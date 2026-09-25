import prisma from '../config/prisma.js';
import { Role, AcademicLevel, ApplicationStatus, WorkflowStatus } from '@prisma/client';
import { assessmentService, AssessmentService } from '../services/assessmentService.js';
import { placementService, PlacementService, CURRENT_PLACEMENT_RULE_VERSION } from '../services/placementService.js';
import { RulesEngine } from '../services/rules/rulesEngine.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runPhase5Verification() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: PHASE 5 PLACEMENT & ASSESSMENT SUITE');
  console.log('====================================================\n');

  // Test setup variables
  let testUserApplicant: any = null;
  let testUserUnauthorized: any = null;
  let testUserAdmin: any = null;
  let testApp: any = null;
  let testAssessment: any = null;
  let testAssessmentVersion: any = null;
  let testQuestions: any[] = [];
  let testCohort: any = null;

  try {
    // ----------------------------------------------------
    // PREPARATION & FIXTURES
    // ----------------------------------------------------
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    testUserApplicant = await prisma.user.create({
      data: {
        email: `phase5_applicant_${Date.now()}@stempact.org`,
        firstName: 'Phase5',
        lastName: 'Applicant',
        passwordHash,
        role: Role.APPLICANT,
      },
    });

    testUserUnauthorized = await prisma.user.create({
      data: {
        email: `phase5_student_${Date.now()}@stempact.org`,
        firstName: 'Unauthorized',
        lastName: 'Student',
        passwordHash,
        role: Role.STUDENT,
      },
    });

    testUserAdmin = await prisma.user.create({
      data: {
        email: `phase5_admin_${Date.now()}@stempact.org`,
        firstName: 'Academic',
        lastName: 'Admin',
        passwordHash,
        role: Role.ACADEMIC_ADMIN,
      },
    });

    const targetProgram = await prisma.program.findFirst({
      where: { code: 'CSE-04' },
      include: {
        versions: { where: { isCurrent: true } },
      },
    });

    if (!targetProgram) {
      throw new Error('Required reference program CSE-04 not found in database');
    }

    testCohort = await prisma.cohort.findFirst({
      where: { programId: targetProgram.id },
    });

    testApp = await prisma.application.create({
      data: {
        applicationNumber: `APP-P5-${Date.now()}`,
        userId: testUserApplicant.id,
        programId: targetProgram.id,
        preferredSchedule: 'Weekend',
        fullName: 'Phase5 Applicant',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Male',
        phone: '08012345678',
        email: testUserApplicant.email,
        address: 'STEMPACT Campus, Ile-Ife',
        educationLevel: 'Undergraduate',
        careerGoals: 'Software Engineer',
        learningObjectives: 'Full stack development',
        statementOfPurpose: 'Passionate about engineering',
        status: ApplicationStatus.SUBMITTED,
      },
    });

    testAssessment = await prisma.assessment.findFirst({
      where: { programId: targetProgram.id },
      include: {
        versions: { where: { isCurrent: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });

    if (!testAssessment) {
      throw new Error('Assessment not found for target program');
    }

    testAssessmentVersion = testAssessment.versions[0];
    testQuestions = testAssessment.questions;

    // ----------------------------------------------------
    // TEST A: Assessment Version Integrity
    // ----------------------------------------------------
    console.log('1. Assessment Version Integrity:');
    assert(!!testAssessmentVersion, 'Assessment has an active AssessmentVersion');
    assert(testAssessmentVersion.isCurrent === true, 'AssessmentVersion is marked isCurrent = true');
    assert(testAssessmentVersion.versionNumber >= 1, `AssessmentVersion number is valid (${testAssessmentVersion.versionNumber})`);
    assert(testAssessmentVersion.status === WorkflowStatus.PUBLISHED, 'AssessmentVersion status is PUBLISHED');
    assert(!!testAssessmentVersion.programVersionId, 'AssessmentVersion is linked to canonical ProgramVersion');
    assert(!!testAssessmentVersion.curriculumVersionId, 'AssessmentVersion is linked to canonical CurriculumVersion');

    // Partial unique index test: attempting to create a second isCurrent=true version fails
    let partialUniqueIndexThrew = false;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AssessmentVersion" ("id", "assessmentId", "versionNumber", "title", "instructions", "durationMinutes", "passingScore", "status", "isCurrent", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, '${testAssessment.id}', 999, 'Duplicate Version', 'Test', 30, 60, 'PUBLISHED'::"WorkflowStatus", true, NOW(), NOW());`
      );
    } catch (e: any) {
      partialUniqueIndexThrew =
        e.message?.includes('AssessmentVersion_assessmentId_isCurrent_unique') ||
        e.message?.includes('Key ("assessmentId")=') ||
        e.message?.includes('23505') ||
        e.code === '23505' ||
        e.meta?.code === '23505';
    }
    assert(partialUniqueIndexThrew, 'Database partial unique index rejects duplicate isCurrent = true for same Assessment');

    // ----------------------------------------------------
    // TEST B: Deterministic Scoring
    // ----------------------------------------------------
    console.log('\n2. Deterministic Scoring:');
    const mockQuestions = [
      {
        id: 'q1',
        category: 'LOGICAL_REASONING',
        type: 'MULTIPLE_CHOICE',
        prompt: 'What is 2 + 2?',
        options: JSON.stringify(['3', '4', '5']),
        correctAnswer: '4',
        points: 10,
        order: 1,
      },
      {
        id: 'q2',
        category: 'PROGRAMMING',
        type: 'MULTIPLE_CHOICE',
        prompt: 'Which is a JavaScript keyword?',
        options: JSON.stringify(['function', 'def', 'func']),
        correctAnswer: 'function',
        points: 10,
        order: 2,
      },
    ];

    const answers1 = { q1: '4', q2: 'function' };
    const score1 = AssessmentService.calculateAssessmentScore(mockQuestions, answers1);
    const score2 = AssessmentService.calculateAssessmentScore(mockQuestions, answers1);

    assert(score1.totalScore === 20, 'Calculates correct score (20/20)');
    assert(score1.percentage === 100, 'Calculates 100% percentage');
    assert(JSON.stringify(score1) === JSON.stringify(score2), 'Pure scoring is strictly deterministic across repeated runs');

    // Test option index submission vs raw text
    const answersWithIndex = { q1: 1, q2: 'FUNCTION ' }; // index 1 is '4', trimmed case-insensitive
    const scoreWithIndex = AssessmentService.calculateAssessmentScore(mockQuestions, answersWithIndex);
    assert(scoreWithIndex.totalScore === 20, 'Scores option index and trimmed case-insensitive values correctly');

    // ----------------------------------------------------
    // TEST C: Assessment Attempt Ownership
    // ----------------------------------------------------
    console.log('\n3. Assessment Attempt Ownership:');
    let unauthorizedCaught = false;
    try {
      await placementService.recordAssessmentAttempt({
        applicationId: testApp.id,
        assessmentId: testAssessment.id,
        answers: { [testQuestions[0].id]: testQuestions[0].correctAnswer },
        authUser: testUserUnauthorized,
      });
    } catch (err: any) {
      unauthorizedCaught = err.statusCode === 403 || err.message.includes('Forbidden');
    }
    assert(unauthorizedCaught, 'Rejects attempt submission for another user application with 403 Forbidden');

    // ----------------------------------------------------
    // TEST D: Multi-Attempt Lifecycle & Traceability (R1 -> Reassessment -> R2 -> Approval)
    // ----------------------------------------------------
    console.log('\n4. Multi-Attempt Lifecycle & Historical Traceability:');
    const studentProfilesBefore = await prisma.studentProfile.count();
    const enrollmentsBefore = await prisma.studentCohortEnrollment.count();
    const initialCohortEnrollment = testCohort ? testCohort.currentEnrollment : 0;

    // Step 1: Attempt 1 produces recommendation R1 (100% -> LEVEL_4_SPECIALIST)
    const answersFull: Record<string, string> = {};
    testQuestions.forEach((q) => {
      answersFull[q.id] = q.correctAnswer;
    });

    const attempt1Result = await placementService.recordAssessmentAttempt({
      applicationId: testApp.id,
      assessmentId: testAssessment.id,
      answers: answersFull,
      authUser: testUserApplicant,
    });

    assert(!!attempt1Result.attempt.id, 'First assessment attempt (Attempt 1) created successfully');
    assert(attempt1Result.attempt.percentage === 100, 'Attempt 1 scored 100%');
    assert(attempt1Result.attempt.ruleVersion === CURRENT_PLACEMENT_RULE_VERSION, `Attempt 1 records rule version (${CURRENT_PLACEMENT_RULE_VERSION})`);
    assert(attempt1Result.attempt.recommendedLevelCode === AcademicLevel.LEVEL_4_SPECIALIST, 'Recommendation R1: 100% maps to LEVEL_4_SPECIALIST');
    assert(!!attempt1Result.attempt.questionsSnapshot, 'Attempt 1 captures frozen questionsSnapshot');

    // Step 2: Academic Board reviews Attempt 1 and returns applicant for reassessment
    const currentPlacementAfterAttempt1 = await prisma.placement.findUnique({
      where: { applicationId: testApp.id },
    });

    const boardReturnReview = await placementService.reviewPlacementByAcademicBoard({
      placementId: currentPlacementAfterAttempt1!.id,
      action: 'RETURN_FOR_REASSESSMENT',
      reviewerUser: testUserAdmin,
      adminNotes: 'Board reviewed Attempt 1 and requested practical reassessment due to candidate interview.',
    });

    assert(boardReturnReview.placement.status === 'RETURNED_FOR_REASSESSMENT', 'Placement status updated to RETURNED_FOR_REASSESSMENT');
    assert(boardReturnReview.decision.decision === 'RETURNED_FOR_REASSESSMENT', 'PlacementDecision 1 records decision RETURNED_FOR_REASSESSMENT');
    assert(boardReturnReview.decision.assessmentAttemptId === attempt1Result.attempt.id, 'PlacementDecision 1 explicitly points to Attempt 1 ID');

    const appAfterReturn = await prisma.application.findUnique({ where: { id: testApp.id } });
    assert(appAfterReturn?.status === ApplicationStatus.SUBMITTED, 'Application status reset to SUBMITTED to permit reassessment');

    // Step 3: Attempt 2 (Reassessment) produces recommendation R2 (partial score)
    const answersPartial: Record<string, string> = {};
    if (testQuestions[0]) answersPartial[testQuestions[0].id] = testQuestions[0].correctAnswer;

    const attempt2Result = await placementService.recordAssessmentAttempt({
      applicationId: testApp.id,
      assessmentId: testAssessment.id,
      answers: answersPartial,
      authUser: testUserApplicant,
    });

    assert(!!attempt2Result.attempt.id, 'Second assessment attempt (Attempt 2 / Reassessment) created successfully');
    assert(attempt2Result.attempt.id !== attempt1Result.attempt.id, 'Attempt 2 has distinct ID from Attempt 1');
    assert(attempt2Result.attempt.percentage < 100, 'Attempt 2 reflects distinct reassessment score');
    assert(!!attempt2Result.attempt.questionsSnapshot, 'Attempt 2 captures its own frozen questionsSnapshot');

    // Step 4: Academic Board reviews Attempt 2 and Approves placement
    const currentPlacementAfterAttempt2 = await prisma.placement.findUnique({
      where: { applicationId: testApp.id },
    });

    const boardApproveReview = await placementService.reviewPlacementByAcademicBoard({
      placementId: currentPlacementAfterAttempt2!.id,
      action: 'APPROVE',
      reviewerUser: testUserAdmin,
      adminNotes: 'Board reviewed Attempt 2 and approved final placement.',
    });

    assert(boardApproveReview.placement.status === 'APPROVED', 'Placement status updated to APPROVED');
    assert(boardApproveReview.decision.decision === 'APPROVED', 'PlacementDecision 2 records decision APPROVED');
    assert(boardApproveReview.decision.assessmentAttemptId === attempt2Result.attempt.id, 'PlacementDecision 2 explicitly points to Attempt 2 ID');

    const appAfterApproval = await prisma.application.findUnique({ where: { id: testApp.id } });
    assert(appAfterApproval?.status === ApplicationStatus.PLACED, 'Application status updated to PLACED after approval');

    // Step 5: Full Historical Auditability Verification
    console.log('\n5. Multi-Attempt History Reconstruction & Verification:');
    const placementHistory = await placementService.getPlacementHistory(testApp.id);

    assert(placementHistory.attemptsCount === 2, `Full history preserves exactly 2 attempts (actual: ${placementHistory.attemptsCount})`);

    // Verify Attempt 1 remains 100% reconstructable
    const hAttempt1 = placementHistory.attempts[0];
    assert(hAttempt1.attemptId === attempt1Result.attempt.id, 'Historical Attempt 1 matches Attempt 1 ID');
    assert(hAttempt1.percentage === 100, 'Historical Attempt 1 score preserved (100%)');
    assert(hAttempt1.recommendedLevelCode === AcademicLevel.LEVEL_4_SPECIALIST, 'Recommendation R1 preserved as LEVEL_4_SPECIALIST');
    assert(hAttempt1.ruleVersion === CURRENT_PLACEMENT_RULE_VERSION, `Historical Attempt 1 rule version preserved (${CURRENT_PLACEMENT_RULE_VERSION})`);
    assert(hAttempt1.decisions.length === 1, 'Attempt 1 preserves its associated Academic Board decision');
    assert(hAttempt1.decisions[0].decision === 'RETURNED_FOR_REASSESSMENT', 'Attempt 1 decision remains immutable: RETURNED_FOR_REASSESSMENT');

    // Verify Attempt 2 remains 100% reconstructable
    const hAttempt2 = placementHistory.attempts[1];
    assert(hAttempt2.attemptId === attempt2Result.attempt.id, 'Historical Attempt 2 matches Attempt 2 ID');
    assert(hAttempt2.percentage === attempt2Result.attempt.percentage, 'Historical Attempt 2 score preserved');
    assert(hAttempt2.decisions.length === 1, 'Attempt 2 preserves its associated Academic Board decision');
    assert(hAttempt2.decisions[0].decision === 'APPROVED', 'Attempt 2 decision remains immutable: APPROVED');

    // Verify Current Placement represents active state without destroying historical information
    assert(placementHistory.currentPlacement?.status === 'APPROVED', 'Current Placement status correctly represents APPROVED');
    assert(placementHistory.currentPlacement?.assessmentAttemptId === attempt2Result.attempt.id, 'Current Placement correctly references latest attempt (Attempt 2)');
    assert(placementHistory.currentPlacement?.decisions.length === 2, 'Current Placement links all 2 historical decisions');

    // ----------------------------------------------------
    // TEST E: Canonical Placement Rules Thresholds
    // ----------------------------------------------------
    console.log('\n6. Canonical Placement Rules Thresholds:');
    const rSpecialist = PlacementService.evaluatePlacementRecommendation(90);
    assert(rSpecialist.levelCode === AcademicLevel.LEVEL_4_SPECIALIST, 'Score >= 85% maps to LEVEL_4_SPECIALIST');

    const rAdvanced = PlacementService.evaluatePlacementRecommendation(75);
    assert(rAdvanced.levelCode === AcademicLevel.LEVEL_3_ADVANCED, 'Score >= 70% maps to LEVEL_3_ADVANCED');

    const rIntermediate = PlacementService.evaluatePlacementRecommendation(55);
    assert(rIntermediate.levelCode === AcademicLevel.LEVEL_2_INTERMEDIATE, 'Score >= 50% maps to LEVEL_2_INTERMEDIATE');

    const rFoundation = PlacementService.evaluatePlacementRecommendation(35);
    assert(rFoundation.levelCode === AcademicLevel.LEVEL_1_FOUNDATION, 'Score >= 30% maps to LEVEL_1_FOUNDATION');

    const rAssessment = PlacementService.evaluatePlacementRecommendation(20);
    assert(rAssessment.levelCode === AcademicLevel.LEVEL_0_ASSESSMENT, 'Score < 30% maps to LEVEL_0_ASSESSMENT');

    // ----------------------------------------------------
    // TEST F: Conflicting Old Placement Logic Elimination
    // ----------------------------------------------------
    console.log('\n7. Conflicting Old Placement Logic Elimination:');
    const controllerPath = path.resolve(process.cwd(), 'src/controllers/assessmentController.ts');
    const controllerCode = fs.readFileSync(controllerPath, 'utf8');

    assert(!controllerCode.includes('percentage >= 80'), 'assessmentController.ts NO LONGER contains conflicting "percentage >= 80" heuristic');
    assert(!controllerCode.includes('percentage >= 60'), 'assessmentController.ts NO LONGER contains conflicting "percentage >= 60" heuristic');
    assert(controllerCode.includes('placementService.recordAssessmentAttempt'), 'assessmentController.ts delegates to canonical placementService');

    const rulesEngineEval = RulesEngine.evaluateDiagnosticPlacement(88);
    assert(rulesEngineEval.levelCode === AcademicLevel.LEVEL_4_SPECIALIST, 'RulesEngine delegates directly to canonical PlacementService');

    // ----------------------------------------------------
    // TEST G: Relational & Version-Safe References
    // ----------------------------------------------------
    console.log('\n8. Relational & Version-Safe References:');
    const activePlacement = placementHistory.currentPlacement;
    assert(!!activePlacement, 'Placement record exists for application');
    assert(activePlacement?.programId === targetProgram.id, 'Placement has relational programId');
    assert(!!activePlacement?.programVersionId, 'Placement has relational programVersionId');
    assert(!!activePlacement?.curriculumVersionId, 'Placement has relational curriculumVersionId');
    assert(activePlacement?.ruleVersion === CURRENT_PLACEMENT_RULE_VERSION, 'Placement stores canonical ruleVersion');

    // ----------------------------------------------------
    // TEST H: Board Review Authorization
    // ----------------------------------------------------
    console.log('\n9. Academic Board Review Authorization:');
    let unauthorizedReviewCaught = false;
    try {
      await placementService.reviewPlacementByAcademicBoard({
        placementId: activePlacement!.id,
        action: 'APPROVE',
        reviewerUser: testUserUnauthorized,
      });
    } catch (err: any) {
      unauthorizedReviewCaught = err.statusCode === 403 || err.message.includes('Forbidden');
    }
    assert(unauthorizedReviewCaught, 'Unauthorized user (STUDENT) is rejected with 403 Forbidden from reviewing placement');

    // ----------------------------------------------------
    // TEST I: Isolation from Enrollment & Student Profiles
    // ----------------------------------------------------
    console.log('\n10. Isolation from Enrollment & Student Profiles:');
    const studentProfilesAfter = await prisma.studentProfile.count();
    const enrollmentsAfter = await prisma.studentCohortEnrollment.count();
    const refreshedCohort = testCohort ? await prisma.cohort.findUnique({ where: { id: testCohort.id } }) : null;

    assert(studentProfilesAfter === studentProfilesBefore, 'Placement workflow DID NOT create a StudentProfile');
    assert(enrollmentsAfter === enrollmentsBefore, 'Placement workflow DID NOT create a StudentCohortEnrollment');
    if (refreshedCohort) {
      assert(refreshedCohort.currentEnrollment === initialCohortEnrollment, 'Placement workflow DID NOT increment cohort capacity');
    }

    const applicantUserCheck = await prisma.user.findUnique({ where: { id: testUserApplicant.id } });
    assert(applicantUserCheck?.role === Role.APPLICANT, 'Applicant user role remains Role.APPLICANT');

    // ----------------------------------------------------
    // TEST J: Historical Assessment Interpretability
    // ----------------------------------------------------
    console.log('\n11. Historical Assessment Interpretability:');
    const frozenAttempt = await prisma.assessmentAttempt.findFirst({
      where: { applicationId: testApp.id },
      orderBy: { completedAt: 'asc' },
    });

    const parsedSnapshot = typeof frozenAttempt?.questionsSnapshot === 'string'
      ? JSON.parse(frozenAttempt.questionsSnapshot)
      : frozenAttempt?.questionsSnapshot;

    assert(Array.isArray(parsedSnapshot), 'Historical attempt contains frozen array of question definitions');
    assert(parsedSnapshot.length > 0, 'Snapshot preserves full question context at attempt time');
    assert(!!parsedSnapshot[0].correctAnswer, 'Snapshot contains the exact answer key at attempt time');

  } finally {
    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\nCleaning up verification fixtures...');
    if (testApp) {
      const pl = await prisma.placement.findUnique({ where: { applicationId: testApp.id } });
      if (pl) {
        await prisma.placementDecision.deleteMany({ where: { placementId: pl.id } });
        await prisma.placement.delete({ where: { id: pl.id } });
      }
      await prisma.assessmentAttempt.deleteMany({ where: { applicationId: testApp.id } });
      await prisma.application.delete({ where: { id: testApp.id } });
    }
    if (testUserApplicant) {
      await prisma.user.delete({ where: { id: testUserApplicant.id } });
    }
    if (testUserUnauthorized) {
      await prisma.user.delete({ where: { id: testUserUnauthorized.id } });
    }
    if (testUserAdmin) {
      await prisma.user.delete({ where: { id: testUserAdmin.id } });
    }
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase5Verification()
  .catch((err) => {
    console.error('Phase 5 Verification Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
