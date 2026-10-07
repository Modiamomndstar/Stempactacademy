import { AcademicLevel, ApplicationStatus, Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AssessmentService } from './assessmentService.js';
import { emailService } from './emailService.js';
import { createNotification } from './notificationService.js';
import { identifierService } from './identifierService.js';

export const CURRENT_PLACEMENT_RULE_VERSION = 'STEMPACT_RULES_V1';

export interface PlacementRecommendation {
  recommendedLevel: string;
  levelCode: AcademicLevel;
  rationale: string;
  ruleVersion: string;
}

export class PlacementService {
  /**
   * Canonical placement evaluation rules.
   * Single source of truth across STEMPACT Academy.
   * Maps diagnostic assessment scores deterministically to the canonical AcademicLevel hierarchy.
   */
  static evaluatePlacementRecommendation(
    scorePercentage: number,
    options?: { experienceYears?: number; technicalExperience?: string }
  ): PlacementRecommendation {
    const experienceYears = options?.experienceYears || 0;

    if (scorePercentage >= 85 || experienceYears >= 3) {
      return {
        recommendedLevel: 'Level 4 — Specialist / Production Engineering',
        levelCode: AcademicLevel.LEVEL_4_SPECIALIST,
        rationale: `High performance (${scorePercentage.toFixed(1)}%). Demonstrated mastery in systems architecture and independent problem solving.`,
        ruleVersion: CURRENT_PLACEMENT_RULE_VERSION,
      };
    } else if (scorePercentage >= 70 || experienceYears >= 1) {
      return {
        recommendedLevel: 'Level 3 — Advanced Engineering',
        levelCode: AcademicLevel.LEVEL_3_ADVANCED,
        rationale: `Strong performance (${scorePercentage.toFixed(1)}%). Strong algorithmic reasoning and working familiarity with core engineering frameworks.`,
        ruleVersion: CURRENT_PLACEMENT_RULE_VERSION,
      };
    } else if (scorePercentage >= 50) {
      return {
        recommendedLevel: 'Level 2 — Intermediate Hands-On',
        levelCode: AcademicLevel.LEVEL_2_INTERMEDIATE,
        rationale: `Sound performance (${scorePercentage.toFixed(1)}%). Sound digital literacy and fundamental syntax; benefits from supervised lab sprints.`,
        ruleVersion: CURRENT_PLACEMENT_RULE_VERSION,
      };
    } else if (scorePercentage >= 30) {
      return {
        recommendedLevel: 'Level 1 — Foundation Bootcamp',
        levelCode: AcademicLevel.LEVEL_1_FOUNDATION,
        rationale: `Foundational performance (${scorePercentage.toFixed(1)}%). Eager learner; best served by structured foundations in computational logic and syntax.`,
        ruleVersion: CURRENT_PLACEMENT_RULE_VERSION,
      };
    } else {
      return {
        recommendedLevel: 'Level 0 — Assessment & Digital Literacy',
        levelCode: AcademicLevel.LEVEL_0_ASSESSMENT,
        rationale: `Score (${scorePercentage.toFixed(1)}%). Recommended for prerequisite digital literacy and computational thinking orientation.`,
        ruleVersion: CURRENT_PLACEMENT_RULE_VERSION,
      };
    }
  }

  /**
   * Submits and records an assessment attempt, producing a deterministic placement recommendation.
   * Runs in an atomic transaction.
   * IMPORTANT: Placement does NOT enroll the applicant or create student profiles.
   */
  static async recordAssessmentAttempt(params: {
    applicationId?: string;
    assessmentId: string;
    programId?: string;
    answers: Record<string, any>;
    authUser: { id: string; email: string; role: Role; firstName?: string; lastName?: string };
  }) {
    const { applicationId, assessmentId, programId, answers, authUser } = params;

    // 1. Fetch assessment and current version
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        program: true,
        versions: {
          where: { isCurrent: true },
          include: { questions: { orderBy: { order: 'asc' } } },
        },
        questions: { orderBy: { order: 'asc' } },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const currentVersion = assessment.versions[0] || null;
    const questionsToScore = (currentVersion?.questions && currentVersion.questions.length > 0)
      ? currentVersion.questions
      : assessment.questions;

    if (!questionsToScore || questionsToScore.length === 0) {
      throw new Error('No questions found for this assessment');
    }

    // 2. Resolve Application record & verify ownership
    let application: any = null;

    if (applicationId && applicationId !== 'demo-applicant-session') {
      application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { program: true },
      });

      if (!application) {
        throw new Error('Application record not found');
      }

      // Verify that authUser owns this application or is authorized staff
      const isOwner =
        (application.userId && application.userId === authUser.id) ||
        (application.email && application.email.toLowerCase() === authUser.email.toLowerCase());
      const staffRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN];
      const isStaff = staffRoles.includes(authUser.role);

      if (!isOwner && !isStaff) {
        const forbiddenErr: any = new Error('Forbidden: You are not authorized to submit assessments for this application.');
        forbiddenErr.statusCode = 403;
        throw forbiddenErr;
      }
    } else {
      if (programId) {
        application = await prisma.application.findFirst({
          where: {
            OR: [{ userId: authUser.id }, { email: authUser.email }],
            programId: String(programId),
          },
          include: { program: true },
          orderBy: { createdAt: 'desc' },
        });
      }
      if (!application) {
        application = await prisma.application.findFirst({
          where: {
            OR: [{ userId: authUser.id }, { email: authUser.email }],
          },
          include: { program: true },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (!application) {
        // Safeguard: If the authenticated candidate takes an assessment without a pre-existing application record,
        // auto-provision the official Application record to prevent blocking their assessment submission.
        let resolvedProgramId: string | null = programId ? String(programId) : (assessment.programId || null);
        if (!resolvedProgramId) {
          const firstProg = await prisma.program.findFirst({ select: { id: true } });
          resolvedProgramId = firstProg?.id || null;
        }

        if (resolvedProgramId) {
          const applicationNumber = await identifierService.generateApplicationNumber();
          const userRecord = await prisma.user.findUnique({ where: { id: authUser.id } });
          const userFull = userRecord
            ? `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || authUser.email
            : authUser.email;

          application = await prisma.application.create({
            data: {
              applicationNumber,
              userId: authUser.id,
              programId: resolvedProgramId,
              fullName: userFull,
              email: authUser.email,
              phone: userRecord?.phone || '',
              address: 'Ile-Ife, Osun State',
              educationLevel: 'Undergraduate / Technical Candidate',
              careerGoals: 'Practical STEM Mastery & Real-World Impact',
              learningObjectives: 'Hands-on Technical Excellence',
              statementOfPurpose: 'Diagnostic Placement Assessment initiated via STEMPACT Academy Portal.',
              preferredSchedule: 'Hybrid (Weekend & Evening)',
              intendedLevel: 'LEVEL_1_FOUNDATION',
              status: ApplicationStatus.SUBMITTED,
              dateOfBirth: new Date(Date.now() - 18 * 365 * 24 * 3600 * 1000),
              gender: 'Unspecified',
            },
            include: { program: true },
          });
          console.log(`✔ [PlacementService] Auto-provisioned application ${application.applicationNumber} for candidate ${authUser.email}`);
        } else {
          const notFoundErr: any = new Error('No active application found for your account. Please submit an application before taking the placement assessment.');
          notFoundErr.statusCode = 400;
          throw notFoundErr;
        }
      }
    }

    // 3. Score deterministically
    const scoreResult = AssessmentService.calculateAssessmentScore(questionsToScore, answers);

    // 4. Evaluate placement recommendation via canonical rules
    const targetProgramId = application.programId || assessment.programId;
    const recommendation = this.evaluatePlacementRecommendation(scoreResult.percentage);

    // 5. Resolve active ProgramVersion and CurriculumVersion
    const currentProgramVersion = await prisma.programVersion.findFirst({
      where: { programId: targetProgramId, isCurrent: true },
    });

    const currentCurriculumVersionId = currentProgramVersion?.curriculumVersionId || null;

    // 6. Suggest an open cohort for the program as a recommendation reference only (NEVER enrolls!)
    const recommendedCohort = await prisma.cohort.findFirst({
      where: {
        programId: targetProgramId,
        status: { in: ['OPEN', 'ALMOST_FULL'] },
      },
      orderBy: { startDate: 'asc' },
    });

    const progName = application.program?.name || assessment.program?.name || 'STEMPACT Academy';

    // 7. Atomic transaction: create attempt, upsert placement in PENDING_REVIEW, update application status
    const result = await prisma.$transaction(async (tx) => {
      // Freeze question definitions into attempt for immutable auditability
      const questionsSnapshot = questionsToScore.map((q) => ({
        id: q.id,
        category: q.category,
        type: q.type,
        prompt: q.prompt,
        codeSnippet: q.codeSnippet,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        order: q.order,
      }));

      const attempt = await tx.assessmentAttempt.create({
        data: {
          applicationId: application.id,
          userId: application.userId || authUser.id,
          assessmentId: assessment.id,
          assessmentVersionId: currentVersion?.id || null,
          score: scoreResult.totalScore,
          maxScore: scoreResult.maxPossibleScore,
          percentage: scoreResult.percentage,
          categoryScores: JSON.stringify(scoreResult.categoryPercentages),
          answers: JSON.stringify(answers),
          questionsSnapshot: questionsSnapshot as any,
          ruleVersion: recommendation.ruleVersion,
          recommendedProgram: progName,
          recommendedLevel: recommendation.recommendedLevel,
          recommendedLevelCode: recommendation.levelCode,
          recommendedProgramId: targetProgramId,
          recommendedProgramVersionId: currentProgramVersion?.id || null,
          recommendedCurriculumVersionId: currentCurriculumVersionId,
          recommendedCohortId: recommendedCohort?.id || null,
          recommendationReason: recommendation.rationale,
        },
      });

      // Upsert Placement in PENDING_REVIEW state (never purely automated final decision!)
      const placement = await tx.placement.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          assessmentAttemptId: attempt.id,
          recommendedProgram: progName,
          recommendedLevel: recommendation.recommendedLevel,
          recommendedLevelCode: recommendation.levelCode,
          programId: targetProgramId,
          programVersionId: currentProgramVersion?.id || null,
          curriculumVersionId: currentCurriculumVersionId,
          recommendedCohortId: recommendedCohort?.id || null,
          reason: recommendation.rationale,
          ruleVersion: recommendation.ruleVersion,
          status: 'PENDING_REVIEW',
        },
        update: {
          assessmentAttemptId: attempt.id,
          recommendedProgram: progName,
          recommendedLevel: recommendation.recommendedLevel,
          recommendedLevelCode: recommendation.levelCode,
          programId: targetProgramId,
          programVersionId: currentProgramVersion?.id || null,
          curriculumVersionId: currentCurriculumVersionId,
          recommendedCohortId: recommendedCohort?.id || null,
          reason: recommendation.rationale,
          ruleVersion: recommendation.ruleVersion,
          status: 'PENDING_REVIEW',
          approvedProgram: null,
          approvedLevel: null,
          approvedLevelCode: null,
          approvedCohortId: null,
          approvedCohortCode: null,
          reviewedAt: null,
          reviewerId: null,
          reviewerName: null,
          adminNotes: null,
        },
      });

      // Update application status to ASSESSED
      await tx.application.update({
        where: { id: application.id },
        data: { status: ApplicationStatus.ASSESSED },
      });

      return { attempt, placement };
    });

    // Send assessment completed email asynchronously
    if (application.email) {
      emailService
        .sendAssessmentCompletedEmail({
          to: application.email,
          fullName: application.fullName,
          programName: progName,
          score: scoreResult.percentage,
          recommendedLevel: recommendation.recommendedLevel,
          recommendationReason: recommendation.rationale,
        })
        .catch((err) => console.error('Failed to send assessment completed email:', err));
    }

    return {
      attempt: result.attempt,
      placement: result.placement,
      scoreResult,
      recommendation,
      programName: progName,
    };
  }

  /**
   * Academic Board placement review and decision workflow.
   * Authorization-protected: Only SUPER_ADMIN, ACADEMIC_ADMIN, or COORDINATOR_ADMIN can review.
   * Preserves audit history via PlacementDecision model.
   * IMPORTANT: Placement decision does NOT create student profiles or enroll into cohorts.
   */
  static async reviewPlacementByAcademicBoard(params: {
    placementId: string;
    action: 'APPROVE' | 'MODIFY' | 'REJECT' | 'RETURN_FOR_REASSESSMENT';
    reviewerUser: { id: string; role: Role; firstName: string; lastName: string };
    approvedProgramId?: string;
    approvedProgramVersionId?: string;
    approvedCurriculumVersionId?: string;
    approvedLevel?: string;
    approvedLevelCode?: AcademicLevel;
    approvedCohortId?: string;
    adminNotes?: string;
  }) {
    const {
      placementId,
      action,
      reviewerUser,
      approvedProgramId,
      approvedProgramVersionId,
      approvedCurriculumVersionId,
      approvedLevel,
      approvedLevelCode,
      approvedCohortId,
      adminNotes,
    } = params;

    // Validate authorized reviewer role
    const authorizedRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.COORDINATOR_ADMIN];
    if (!authorizedRoles.includes(reviewerUser.role)) {
      const err: any = new Error('Forbidden: Only Academic Board members or Administrators can review placements.');
      err.statusCode = 403;
      throw err;
    }

    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        application: { include: { program: true } },
        assessmentAttempt: true,
      },
    });

    if (!placement) {
      const err: any = new Error('Placement record not found');
      err.statusCode = 404;
      throw err;
    }

    const reviewerName = `${reviewerUser.firstName} ${reviewerUser.lastName}`.trim() || 'Academic Board Reviewer';
    const reviewerRole = String(reviewerUser.role);

    // Resolve final programs and levels
    const finalProgramId = approvedProgramId || placement.programId || placement.application.programId;
    let finalProgramVersionId = approvedProgramVersionId || placement.programVersionId;
    let finalCurriculumVersionId = approvedCurriculumVersionId || placement.curriculumVersionId;

    if (approvedProgramId && (!approvedProgramVersionId || approvedProgramId !== placement.programId)) {
      const currentPv = await prisma.programVersion.findFirst({
        where: { programId: approvedProgramId, isCurrent: true },
      });
      finalProgramVersionId = currentPv?.id || null;
      finalCurriculumVersionId = currentPv?.curriculumVersionId || null;
    }

    const resolvedProgram = finalProgramId
      ? await prisma.program.findUnique({ where: { id: finalProgramId } })
      : null;

    const finalProgramName = resolvedProgram?.name || placement.recommendedProgram;
    const finalLevel = approvedLevel || placement.recommendedLevel;
    const finalLevelCode = approvedLevelCode || placement.recommendedLevelCode || null;

    const finalCohort = approvedCohortId
      ? await prisma.cohort.findUnique({ where: { id: approvedCohortId } })
      : null;

    // Determine decision status
    let decisionStatus: string;
    let newAppStatus: ApplicationStatus;

    switch (action) {
      case 'APPROVE':
        decisionStatus = 'APPROVED';
        newAppStatus = ApplicationStatus.PLACED;
        break;
      case 'MODIFY':
        decisionStatus = 'MODIFIED';
        newAppStatus = ApplicationStatus.PLACED;
        break;
      case 'REJECT':
        decisionStatus = 'REJECTED';
        newAppStatus = ApplicationStatus.REJECTED;
        break;
      case 'RETURN_FOR_REASSESSMENT':
        decisionStatus = 'RETURNED_FOR_REASSESSMENT';
        // Reset application status to SUBMITTED so the applicant can retake the assessment
        newAppStatus = ApplicationStatus.SUBMITTED;
        break;
      default:
        decisionStatus = 'APPROVED';
        newAppStatus = ApplicationStatus.PLACED;
    }

    // Atomic transaction: record PlacementDecision audit entry, update Placement, update Application
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Create PlacementDecision history entry
      const decisionRecord = await tx.placementDecision.create({
        data: {
          placementId: placement.id,
          assessmentAttemptId: placement.assessmentAttemptId || null,
          decision: decisionStatus,
          reviewerId: reviewerUser.id,
          reviewerName,
          reviewerRole,
          approvedProgramId: finalProgramId || null,
          approvedProgramVersionId: finalProgramVersionId || null,
          approvedCurriculumVersionId: finalCurriculumVersionId || null,
          approvedLevel: finalLevel,
          approvedLevelCode: finalLevelCode,
          approvedCohortId: approvedCohortId || null,
          notes: adminNotes || `Placement ${decisionStatus.toLowerCase()} by Academic Board.`,
        },
      });

      // 2. Update Placement record
      const updatedPlacement = await tx.placement.update({
        where: { id: placementId },
        data: {
          status: decisionStatus,
          approvedProgram: decisionStatus === 'REJECTED' || decisionStatus === 'RETURNED_FOR_REASSESSMENT' ? null : finalProgramName,
          approvedLevel: decisionStatus === 'REJECTED' || decisionStatus === 'RETURNED_FOR_REASSESSMENT' ? null : finalLevel,
          approvedLevelCode: decisionStatus === 'REJECTED' || decisionStatus === 'RETURNED_FOR_REASSESSMENT' ? null : finalLevelCode,
          programId: decisionStatus === 'REJECTED' || decisionStatus === 'RETURNED_FOR_REASSESSMENT' ? placement.programId : finalProgramId,
          programVersionId: finalProgramVersionId,
          curriculumVersionId: finalCurriculumVersionId,
          approvedCohortId: approvedCohortId || null,
          approvedCohortCode: finalCohort?.cohortCode || null,
          reviewerId: reviewerUser.id,
          reviewerName,
          adminNotes: adminNotes || `Reviewed and ${decisionStatus.toLowerCase()} by ${reviewerName}`,
          reviewedAt: new Date(),
        },
      });

      // 3. Update Application status
      await tx.application.update({
        where: { id: placement.applicationId },
        data: { status: newAppStatus },
      });

      return { updatedPlacement, decisionRecord };
    });

    // 4. Resolve applicant user ID for in-app notification delivery
    let targetUserId = placement.application.userId;
    if (!targetUserId && placement.application.email) {
      try {
        const u = await prisma.user.findUnique({
          where: { email: placement.application.email },
          select: { id: true },
        });
        targetUserId = u?.id || null;
      } catch (err) {
        console.warn('Could not resolve applicant userId by email:', err);
      }
    }

    if (targetUserId) {
      let notifTitle = 'Academic Admissions Decision';
      let notifMessage = '';
      let notifType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' = 'INFO';
      let notifLink = '/portal/applicant';

      if (decisionStatus === 'RETURNED_FOR_REASSESSMENT') {
        notifTitle = 'Diagnostic Reassessment Required';
        notifMessage = `The Academic Board reviewed your diagnostic test for ${placement.application.program.name} and requested that you retake the assessment. Notes: ${adminNotes || 'Please retake your diagnostic assessment.'}`;
        notifType = 'WARNING';
        notifLink = `/portal/applicant/assessment?appId=${placement.applicationId}&programId=${placement.application.programId}`;
      } else if (decisionStatus === 'APPROVED') {
        notifTitle = 'Curriculum Track Approved';
        notifMessage = `Congratulations! The Academic Admissions Board has approved your placement for ${finalProgramName} at ${finalLevel}. Your provisional admission letter is being prepared.`;
        notifType = 'SUCCESS';
        notifLink = '/portal/applicant';
      } else if (decisionStatus === 'MODIFIED') {
        notifTitle = 'Track Placement Adjusted by Board';
        notifMessage = `The Academic Admissions Board has adjusted your placement to ${finalProgramName} (${finalLevel}). Notes: ${adminNotes || 'Adjusted for optimal cohort track.'}`;
        notifType = 'INFO';
        notifLink = '/portal/applicant';
      } else if (decisionStatus === 'REJECTED') {
        notifTitle = 'Admissions Review Update';
        notifMessage = `The Academic Admissions Board has concluded review of your application for ${placement.application.program.name}. Notes: ${adminNotes || 'Application declined.'}`;
        notifType = 'ALERT';
        notifLink = '/portal/applicant';
      }

      await createNotification({
        userId: targetUserId,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        link: notifLink,
        relatedEntity: 'PLACEMENT',
        relatedEntityId: placement.id,
      });
    }

    // 5. Send Transactional Placement Email
    if (placement.application.email) {
      emailService
        .sendPlacementDecisionEmail({
          to: placement.application.email,
          fullName: placement.application.fullName,
          action: decisionStatus as any,
          programName: finalProgramName,
          levelName: finalLevel,
          adminNotes: adminNotes || undefined,
          reassessmentLink: `${emailService.getClientUrl()}/portal/applicant/assessment?appId=${placement.applicationId}&programId=${placement.application.programId}`,
        })
        .catch((err) => console.error('Failed to send placement decision email:', err));
    }

    return {
      placement: updated.updatedPlacement,
      decision: updated.decisionRecord,
      action: decisionStatus,
      readyForAdmission: decisionStatus === 'APPROVED' || decisionStatus === 'MODIFIED',
    };
  }

  /**
   * Reconstructs the complete historical placement timeline for an application:
   * all attempts, their frozen snapshots, rule versions, recommendations,
   * and the Academic Board decisions made on each attempt.
   */
  static async getPlacementHistory(applicationId: string) {
    const [placement, attempts] = await Promise.all([
      prisma.placement.findUnique({
        where: { applicationId },
        include: {
          program: true,
          programVersion: true,
          curriculumVersion: true,
          recommendedCohort: true,
          approvedCohort: true,
          decisions: { orderBy: { createdAt: 'asc' } },
        },
      }),
      prisma.assessmentAttempt.findMany({
        where: { applicationId },
        include: {
          assessmentVersion: true,
          recommendedProgramRef: true,
          recommendedProgramVersion: true,
          recommendedCurriculumVersion: true,
          recommendedCohort: true,
          placementDecisions: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { completedAt: 'asc' },
      }),
    ]);

    return {
      currentPlacement: placement,
      attemptsCount: attempts.length,
      attempts: attempts.map((att) => ({
        attemptId: att.id,
        completedAt: att.completedAt,
        score: att.score,
        maxScore: att.maxScore,
        percentage: att.percentage,
        ruleVersion: att.ruleVersion,
        recommendedProgram: att.recommendedProgram,
        recommendedLevel: att.recommendedLevel,
        recommendedLevelCode: att.recommendedLevelCode,
        recommendationReason: att.recommendationReason,
        recommendedProgramId: att.recommendedProgramId,
        recommendedProgramVersionId: att.recommendedProgramVersionId,
        recommendedCurriculumVersionId: att.recommendedCurriculumVersionId,
        recommendedCohortId: att.recommendedCohortId,
        questionsSnapshot: att.questionsSnapshot,
        decisions: att.placementDecisions,
      })),
    };
  }
}

export const placementService = PlacementService;
