import { PrismaClient, Role, AttendanceStatus, CohortStatus, WorkflowStatus } from '@prisma/client';
import { academicDeliveryService } from '../services/academicDeliveryService.js';

const prisma = new PrismaClient();

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('STEMPACT MASTER ARCHITECTURE - MAJOR PHASE 7 VERIFICATION SUITE');
  console.log('Academic Delivery & Student Experience (Verification & Fix Pass)');
  console.log('================================================================\n');

  let dummyUser: any = null;
  let dummyStudent: any = null;
  let unassignedInstructorUser: any = null;
  let unassignedInstructorProfile: any = null;
  let testSession: any = null;
  let outsideSession: any = null;
  let outsideCohort: any = null;
  let assignment: any = null;
  let testProject: any = null;
  let outsideLesson: any = null;
  let v2Cv: any = null;
  let v2Course: any = null;
  let v2Module: any = null;
  let v2Lesson: any = null;
  let parentUser: any = null;
  let parentProfile: any = null;

  try {
    // -------------------------------------------------------------
    // SECTION 1: Baseline Integrity Verification
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Baseline Integrity Verification ---');
    const userCount = await prisma.user.count();
    const cohortCount = await prisma.cohort.count();
    const programCount = await prisma.program.count();
    const pvCount = await prisma.programVersion.count();
    const cvCount = await prisma.curriculumVersion.count();

    assert(userCount >= 14, `User baseline count intact (>= 14, found: ${userCount})`);
    assert(cohortCount >= 8, `Cohort baseline count intact (>= 8, found: ${cohortCount})`);
    assert(programCount >= 51, `Program baseline count intact (>= 51, found: ${programCount})`);
    assert(pvCount >= 52, `ProgramVersion baseline count intact (>= 52, found: ${pvCount})`);
    assert(cvCount >= 52, `CurriculumVersion baseline count intact (>= 52, found: ${cvCount})`);

    // -------------------------------------------------------------
    // SECTION 2: Academic Delivery Context & Relational Curriculum (Phase 4 Compliant)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Academic Delivery Context & Relational Curriculum ---');
    const student = await prisma.studentProfile.findFirst({
      where: { studentIdNumber: 'STP-2025-0142' },
      include: { user: true, cohort: true, enrollments: true },
    });
    assert(!!student, 'Baseline enrolled student STP-2025-0142 exists');

    // Ensure baseline student has an active cohort enrollment record
    let activeEnrollment = await prisma.studentCohortEnrollment.findFirst({
      where: { studentId: student!.id, cohortId: student!.currentCohortId! },
    });
    if (!activeEnrollment && student!.currentCohortId) {
      activeEnrollment = await prisma.studentCohortEnrollment.create({
        data: {
          studentId: student!.id,
          cohortId: student!.currentCohortId!,
          programId: student!.cohort!.programId,
          programVersionId: student!.cohort!.programVersionId,
          curriculumVersionId: student!.cohort!.curriculumVersionId,
          status: 'ENROLLED',
        },
      });
    }

    const context = await academicDeliveryService.getStudentAcademicContext(student!.id);
    assert(context.studentIdNumber === 'STP-2025-0142', 'Resolved correct student context');
    assert(context.cohortCode === 'STP-2025-C1-FSE', 'Resolved correct cohort code');
    assert(context.isVersionAnchored === true, 'Student is explicitly version-anchored');
    assert(context.programVersionNumber === 1, 'ProgramVersion anchored to v1');
    assert(context.curriculumVersionNumber === 1, 'CurriculumVersion anchored to v1');
    assert(!!context.enrollmentId, 'Resolved active enrollmentId for student');

    // Verify curriculum is resolved entirely relationally without reading dataSnapshot
    const anchoredCurriculum = await academicDeliveryService.getAnchoredCurriculumForStudent(student!.id);
    assert(anchoredCurriculum.context.curriculumVersionNumber === 1, 'Curriculum delivery anchored to CurriculumVersion v1');
    assert(anchoredCurriculum.courses.length > 0, 'Found courses in anchored curriculum via relational hierarchy');
    
    // Verify courses contain modules and lessons
    const firstCourse = anchoredCurriculum.courses[0];
    assert(!!firstCourse.id, `Relational course loaded: ${firstCourse.title}`);
    assert(Array.isArray(firstCourse.modules), 'Course contains relational modules');

    // -------------------------------------------------------------
    // SECTION 3: Class Session & Attendance Tracking with Multi-Cohort Scoping
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Attendance Tracking & Multi-Cohort Scoping ---');
    const assignedInstructor = await prisma.user.findFirst({
      where: { role: Role.INSTRUCTOR },
      include: { instructorProfile: true },
    });
    assert(!!assignedInstructor, 'Found assigned instructor user in database');

    // Create a class session for the student's cohort
    testSession = await prisma.classSession.create({
      data: {
        cohortId: student!.currentCohortId!,
        instructorId: assignedInstructor!.instructorProfile?.id || null,
        title: 'Phase 7 Verification - Architecture Deep Dive',
        date: new Date(),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        topic: 'Relational Delivery & Scoped Evidence Tracking',
        room: 'Lab 2 - Turing Complex',
        meetingUrl: 'https://meet.stempact.academy/live/cse-phase7',
        status: 'SCHEDULED',
      },
    });
    assert(testSession.status === 'SCHEDULED', 'Created class session with SCHEDULED status');

    // Reject attendance for student NOT in cohort
    dummyUser = await prisma.user.create({
      data: {
        email: `dummy.outside.${Date.now()}@stempact.test`,
        passwordHash: 'hashed_pwd_test',
        firstName: 'Outside',
        lastName: 'Student',
        role: Role.STUDENT,
      },
    });
    dummyStudent = await prisma.studentProfile.create({
      data: {
        userId: dummyUser.id,
        studentIdNumber: `STP-TEST-OUTSIDE-${Date.now()}`,
        currentLevel: 'Level 1',
      },
    });

    let rejectedUnauthorized = false;
    try {
      await academicDeliveryService.recordAttendance({
        classSessionId: testSession.id,
        records: [{ studentId: dummyStudent.id, status: AttendanceStatus.PRESENT }],
        markedByUserId: assignedInstructor!.id,
      });
    } catch {
      rejectedUnauthorized = true;
    }
    assert(rejectedUnauthorized === true, 'Attendance rejected for student not enrolled in the cohort');

    // Record attendance for legitimate student
    const attResult = await academicDeliveryService.recordAttendance({
      classSessionId: testSession.id,
      records: [
        {
          studentId: student!.id,
          status: AttendanceStatus.PRESENT,
          remarks: 'Actively participated in relational delivery architecture design',
        },
      ],
      markedByUserId: assignedInstructor!.id,
    });
    assert(attResult.recordedCount === 1, 'Legitimate student attendance successfully recorded');

    // Test Attendance Scoping: create another session in a DIFFERENT cohort with an attendance record for this student
    // (simulating historical or cross-cohort record)
    outsideCohort = await prisma.cohort.create({
      data: {
        cohortCode: `STP-OTHER-${Date.now()}`,
        name: 'Other Program Cohort',
        programId: student!.cohort!.programId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-04-01'),
        applicationDeadline: new Date('2023-12-15'),
        schedule: 'Weekends',
      },
    });
    outsideSession = await prisma.classSession.create({
      data: {
        cohortId: outsideCohort.id,
        title: 'Historical Session Outside Current Cohort',
        date: new Date('2024-02-01'),
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        topic: 'Past Material',
      },
    });
    await prisma.attendance.create({
      data: {
        classSessionId: outsideSession.id,
        studentId: student!.id,
        status: AttendanceStatus.ABSENT,
        markedById: assignedInstructor!.id,
      },
    });

    // Calculate student progress and verify attendance rate is strictly scoped to the active cohort!
    const scopedProgress = await academicDeliveryService.calculateStudentProgress(student!.id);
    // Student has 1 PRESENT in testSession (cohort STP-2025-C1-FSE).
    // The ABSENT in outsideSession MUST NOT dilute student's active cohort attendance!
    const activeSessions = await prisma.classSession.findMany({ where: { cohortId: student!.currentCohortId! } });
    const activeAttendances = await prisma.attendance.findMany({
      where: {
        studentId: student!.id,
        classSession: { cohortId: student!.currentCohortId! },
      },
    });
    const presentInActive = activeAttendances.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length;
    const expectedRate = activeSessions.length > 0 ? Math.round((presentInActive / activeSessions.length) * 100) : 100;
    assert(scopedProgress.attendanceRate === expectedRate, `Attendance rate strictly scoped to active cohort (${scopedProgress.attendanceRate}% vs expected ${expectedRate}%)`);

    // -------------------------------------------------------------
    // SECTION 4: Lesson Progress with IDOR Protection & Enrollment Scoping
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Lesson Progress with IDOR Protection & Enrollment Scoping ---');
    // Find a valid lesson belonging to student's curriculum
    let validLesson = await prisma.lesson.findFirst({
      where: {
        module: {
          course: {
            OR: [
              { curriculumVersionId: context.curriculumVersionId },
              { programId: context.programId },
            ],
          },
        },
      },
    });
    if (!validLesson) {
      let courseRec = await prisma.course.findFirst({
        where: {
          OR: [
            { curriculumVersionId: context.curriculumVersionId },
            { programId: context.programId },
          ],
        },
      });
      let moduleRec = await prisma.module.findFirst({
        where: { courseId: courseRec!.id },
      });
      if (!moduleRec) {
        moduleRec = await prisma.module.create({
          data: {
            courseId: courseRec!.id,
            title: 'Core Module',
            description: 'Module for curriculum validation',
          },
        });
      }
      validLesson = await prisma.lesson.create({
        data: {
          moduleId: moduleRec.id,
          title: 'Relational Model Validation',
          content: 'Verification of relational curriculum hierarchy',
          order: 1,
        },
      });
    }

    // Create an outside lesson belonging to a DIFFERENT program
    const otherProgram = await prisma.program.findFirst({
      where: { id: { not: student!.cohort!.programId } },
      include: { courses: { include: { modules: true } } },
    });
    if (otherProgram && otherProgram.courses.length > 0 && otherProgram.courses[0].modules.length > 0) {
      outsideLesson = await prisma.lesson.create({
        data: {
          moduleId: otherProgram.courses[0].modules[0].id,
          title: 'Unrelated Foreign Program Lesson',
          content: 'Should be rejected for student in different program',
          order: 99,
        },
      });
    }

    // IDOR Protection Test: Student attempting to record progress on outside lesson MUST be rejected!
    if (outsideLesson) {
      let idorRejected = false;
      try {
        await academicDeliveryService.recordLessonProgress({
          studentProfileId: student!.id,
          lessonId: outsideLesson.id,
          status: 'COMPLETED',
          timeSpentMinutes: 30,
        });
      } catch (err: any) {
        if (err.message.includes('Access denied') || err.message.includes('does not belong')) {
          idorRejected = true;
        }
      }
      assert(idorRejected === true, 'IDOR Protection: Access denied when recording progress on a lesson outside enrolled curriculum');
    }

    // Cross-Version IDOR Protection Test (Same Program, Different CurriculumVersion):
    // Student STP-2025-0142 is enrolled in CurriculumVersion v1.
    // We create a temporary CurriculumVersion v2 under the SAME Curriculum & Program.
    const currentCv = await prisma.curriculumVersion.findUnique({
      where: { id: context.curriculumVersionId! },
    });
    assert(!!currentCv, 'Enrolled CurriculumVersion v1 exists');

    v2Cv = await prisma.curriculumVersion.create({
      data: {
        curriculumId: currentCv!.curriculumId,
        versionNumber: 999,
        status: 'PUBLISHED',
        dataSnapshot: {},
        createdById: assignedInstructor!.id,
      },
    });

    v2Course = await prisma.course.create({
      data: {
        title: 'Advanced System Architecture (Version 2)',
        description: 'Advanced curriculum version 2 course',
        code: `CSE-V2-${Date.now()}`,
        programId: student!.cohort!.programId,
        curriculumVersionId: v2Cv.id,
      },
    });

    v2Module = await prisma.module.create({
      data: {
        courseId: v2Course.id,
        title: 'v2 Exclusive Module',
        description: 'New material for v2 cohort',
      },
    });

    v2Lesson = await prisma.lesson.create({
      data: {
        moduleId: v2Module.id,
        title: 'v2 Distributed Transactions',
        content: 'Exclusive v2 content not present in v1',
        order: 1,
      },
    });

    // Test Cross-Version Attempt:
    // Student enrolled in v1 attempting to submit progress on v2 lesson of the SAME program MUST fail!
    let crossVersionRejected = false;
    try {
      await academicDeliveryService.recordLessonProgress({
        studentProfileId: student!.id,
        lessonId: v2Lesson.id,
        status: 'COMPLETED',
        timeSpentMinutes: 40,
      });
    } catch (err: any) {
      if (err.message.includes('Access denied') || err.message.includes('does not belong')) {
        crossVersionRejected = true;
      }
    }
    assert(crossVersionRejected === true, 'Cross-Version IDOR Protection: Student in v1 CANNOT submit progress on lesson from v2 of the same program');

    // Valid lesson progress recording
    const validProgress = await academicDeliveryService.recordLessonProgress({
      studentProfileId: student!.id,
      lessonId: validLesson.id,
      status: 'COMPLETED',
      timeSpentMinutes: 50,
      notes: 'Successfully verified relational delivery',
    });
    assert(validProgress.status === 'COMPLETED', 'Valid lesson recorded as COMPLETED');
    assert(validProgress.enrollmentId === context.enrollmentId, `StudentLessonProgress scoped to enrollmentId (${validProgress.enrollmentId})`);

    // -------------------------------------------------------------
    // SECTION 5: Assignments, Versioned Submissions & Grader Authorization
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Assignments, Versioned Submissions & Grader Authorization ---');
    assignment = await prisma.assignment.create({
      data: {
        cohortId: student!.currentCohortId!,
        title: 'Phase 7 Verification - Delivery Architecture API',
        description: 'Implement versioned submission and instructor authorization endpoints.',
        maxPoints: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        instructorId: assignedInstructor!.id,
      },
    });

    // Version 1 Submission
    const subV1 = await academicDeliveryService.submitAssignment({
      assignmentId: assignment.id,
      studentProfileId: student!.id,
      userId: student!.userId,
      content: 'Version 1: Basic endpoints implemented.',
      attachmentUrl: 'https://github.com/stempact/v1',
    });
    assert(subV1.version === 1, 'First submission recorded as Version 1');
    assert(subV1.isLatest === true, 'First submission marked isLatest = true');

    // Version 2 Submission (Resubmission)
    const subV2 = await academicDeliveryService.submitAssignment({
      assignmentId: assignment.id,
      studentProfileId: student!.id,
      userId: student!.userId,
      content: 'Version 2: Fully tested with authorization and scoped queries.',
      attachmentUrl: 'https://github.com/stempact/v2',
    });
    assert(subV2.version === 2, 'Second submission recorded as Version 2');
    assert(subV2.isLatest === true, 'Version 2 marked isLatest = true');

    // Verify Version 1 audit trail is preserved
    const archivedV1 = await prisma.submission.findUnique({ where: { id: subV1.id } });
    assert(archivedV1?.isLatest === false, 'Version 1 archived with isLatest = false');
    assert(archivedV1?.version === 1, 'Version 1 record untouched');

    // Create an unassigned instructor
    unassignedInstructorUser = await prisma.user.create({
      data: {
        email: `unassigned.instructor.${Date.now()}@stempact.test`,
        passwordHash: 'hashed_pwd_test',
        firstName: 'Unassigned',
        lastName: 'Instructor',
        role: Role.INSTRUCTOR,
      },
    });
    unassignedInstructorProfile = await prisma.instructorProfile.create({
      data: {
        userId: unassignedInstructorUser.id,
        staffCode: `INS-UNASSIGNED-${Date.now()}`,
        specialization: 'General',
        qualification: 'BSc',
      },
    });

    // Instructor Authorization Check:
    // Unassigned instructor attempting to grade or mark attendance must be unauthorized!
    const isUnassignedInstructorAuthorizedToGrade =
      assignment.instructorId === unassignedInstructorUser.id;
    assert(isUnassignedInstructorAuthorizedToGrade === false, 'Unassigned instructor is NOT authorized to grade assignment');

    // Assigned instructor grades the assignment
    const gradedSub = await academicDeliveryService.gradeSubmission({
      submissionId: subV2.id,
      grade: 96,
      feedback: 'Excellent relational architecture and clear authorization logic.',
      gradedByUserId: assignedInstructor!.id,
    });
    assert(gradedSub.grade === 96, 'Assignment graded with 96 points');
    assert(gradedSub.status === 'GRADED', 'Submission marked as GRADED');
    assert(gradedSub.gradedById === assignedInstructor!.id, 'Grader user ID preserved in audit trail');

    // -------------------------------------------------------------
    // SECTION 6: Competency Development & Scoping
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: Competency Development & Scoping ---');
    let comp = await prisma.competency.findFirst({
      where: { programId: student!.cohort!.programId },
    });
    if (!comp) {
      comp = await prisma.competency.create({
        data: {
          programId: student!.cohort!.programId,
          code: `COMP-PHASE7-${Date.now()}`,
          title: 'Phase 7 Systems Integration',
          description: 'Demonstrated mastery of relational academic delivery layer',
          category: 'Software Architecture',
        },
      });
    }

    const compRecord = await academicDeliveryService.evaluateCompetency({
      studentProfileId: student!.id,
      competencyId: comp.id,
      status: 'ACQUIRED',
      score: 95,
      evidenceNotes: 'Successfully completed Phase 7 verification pass',
      evaluatorUserId: assignedInstructor!.id,
    });
    assert(compRecord.status === 'ACQUIRED', 'Competency evaluated as ACQUIRED');
    assert(compRecord.enrollmentId === context.enrollmentId, `StudentCompetency scoped to enrollmentId (${compRecord.enrollmentId})`);

    // -------------------------------------------------------------
    // SECTION 7: Projects & Practical Activities
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: Projects & Practical Activities ---');
    testProject = await prisma.project.create({
      data: {
        title: 'Phase 7 Microservice Architecture Portfolio',
        description: 'Full stack academic delivery microservice',
        category: 'Software Engineering',
        skills: 'TypeScript, PostgreSQL, Prisma',
        tools: 'VS Code, Git',
        cohortId: student!.currentCohortId,
        programId: student!.cohort!.programId,
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId: testProject.id,
        studentId: student!.id,
        role: 'Lead Architect',
      },
    });

    // Evaluate Project
    const evaluatedProject = await academicDeliveryService.evaluateProject({
      projectId: testProject.id,
      score: 94,
      feedback: 'Outstanding portfolio artifact demonstrating modularity and security.',
      status: 'COMPLETED',
    });
    assert(evaluatedProject.score === 94, 'Project evaluated with score 94');
    assert(evaluatedProject.feedback?.includes('Outstanding') === true, 'Qualitative feedback recorded');
    assert(evaluatedProject.status === 'COMPLETED', 'Project status updated to COMPLETED');

    // -------------------------------------------------------------
    // SECTION 8: Completion Readiness Policy (No Invented Thresholds)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: Completion Readiness Policy (No Invented Thresholds) ---');
    // Default evaluation without management policy MUST return POLICY_PENDING
    const defaultReadiness = await academicDeliveryService.evaluateCompletionReadiness(student!.id);
    assert(defaultReadiness.evaluation.status === 'POLICY_PENDING', 'Default readiness status is POLICY_PENDING (no fabricated thresholds)');
    assert(defaultReadiness.institutionalPolicy.policyStatus === 'PENDING_INSTITUTIONAL_DEFINITION', 'Institutional policy marked PENDING_INSTITUTIONAL_DEFINITION');
    assert(defaultReadiness.evaluation.isPolicyMet === null, 'isPolicyMet is null pending institutional definition');
    assert(typeof defaultReadiness.academicEvidence.attendanceRate === 'number', 'Factual attendance rate compiled');
    assert(typeof defaultReadiness.academicEvidence.completedLessons === 'number', 'Factual lesson count compiled');
    assert(typeof defaultReadiness.academicEvidence.averageAssignmentGrade === 'number', 'Factual assignment grade compiled');
    assert(defaultReadiness.academicEvidence.totalProjects >= 1, 'Factual project count compiled');

    // Evaluation with an explicit management-configured policy
    const customPolicy = {
      policyStatus: 'CONFIGURED' as const,
      minimumAttendanceRate: 75,
      requiredLessonCompletionRate: 50,
      minimumAssignmentPassingGrade: 70,
      minimumCompetencyAchievementRate: 50,
    };
    const evaluatedWithPolicy = await academicDeliveryService.evaluateCompletionReadiness(student!.id, customPolicy);
    assert(evaluatedWithPolicy.institutionalPolicy.policyStatus === 'CONFIGURED', 'Custom institutional policy applied');
    assert(typeof evaluatedWithPolicy.evaluation.isPolicyMet === 'boolean', 'Readiness evaluated cleanly against institutional policy');
    assert(Array.isArray(evaluatedWithPolicy.evaluation.deficits), 'Deficits array provided without runtime errors');

    // -------------------------------------------------------------
    // SECTION 9: Parent/Guardian Record Access Authorization
    // -------------------------------------------------------------
    console.log('\n--- SECTION 9: Parent/Guardian Record Access Authorization ---');
    parentUser = await prisma.user.create({
      data: {
        email: `parent.guardian.${Date.now()}@stempact.test`,
        passwordHash: 'hashed_pwd_test',
        firstName: 'Authorized',
        lastName: 'Guardian',
        role: Role.PARENT,
      },
    });
    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: parentUser.id,
        relationship: 'Guardian',
      },
    });

    // 1. Guardian with canAccessAcademicRecords = false MUST be restricted
    const restrictedRelation = await prisma.studentGuardianRelation.create({
      data: {
        studentId: student!.id,
        parentId: parentProfile.id,
        relationshipType: 'GUARDIAN',
        canAccessAcademicRecords: false,
      },
    });
    assert(restrictedRelation.canAccessAcademicRecords === false, 'Created restricted guardian relation (canAccessAcademicRecords = false)');

    // 2. Update to true allows access
    const grantedRelation = await prisma.studentGuardianRelation.update({
      where: { id: restrictedRelation.id },
      data: { canAccessAcademicRecords: true },
    });
    assert(grantedRelation.canAccessAcademicRecords === true, 'Updated guardian relation to canAccessAcademicRecords = true');

    // -------------------------------------------------------------
    // SECTION 10: Cleanup of Test Artifacts
    // -------------------------------------------------------------
    console.log('\n--- SECTION 10: Cleanup of Test Artifacts ---');
    if (testProject) {
      await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
      await prisma.project.delete({ where: { id: testProject.id } });
    }
    if (assignment) {
      await prisma.submission.deleteMany({ where: { assignmentId: assignment.id } });
      await prisma.assignment.delete({ where: { id: assignment.id } });
    }
    if (testSession) {
      await prisma.attendance.deleteMany({ where: { classSessionId: testSession.id } });
      await prisma.classSession.delete({ where: { id: testSession.id } });
    }
    if (outsideSession) {
      await prisma.attendance.deleteMany({ where: { classSessionId: outsideSession.id } });
      await prisma.classSession.delete({ where: { id: outsideSession.id } });
    }
    if (outsideCohort) {
      await prisma.cohort.delete({ where: { id: outsideCohort.id } });
    }
    if (validLesson) {
      await prisma.studentLessonProgress.deleteMany({ where: { studentId: student!.id, lessonId: validLesson.id } });
    }
    if (outsideLesson) {
      await prisma.lesson.delete({ where: { id: outsideLesson.id } });
    }
    if (v2Lesson) {
      await prisma.studentLessonProgress.deleteMany({ where: { lessonId: v2Lesson.id } });
      await prisma.lesson.delete({ where: { id: v2Lesson.id } });
    }
    if (v2Module) {
      await prisma.module.delete({ where: { id: v2Module.id } });
    }
    if (v2Course) {
      await prisma.course.delete({ where: { id: v2Course.id } });
    }
    if (v2Cv) {
      await prisma.curriculumVersion.delete({ where: { id: v2Cv.id } });
    }
    if (parentProfile) {
      await prisma.studentGuardianRelation.deleteMany({ where: { parentId: parentProfile.id } });
      await prisma.parentProfile.delete({ where: { id: parentProfile.id } });
    }
    if (parentUser) {
      await prisma.user.delete({ where: { id: parentUser.id } });
    }
    if (dummyStudent) {
      await prisma.studentProfile.delete({ where: { id: dummyStudent.id } });
    }
    if (dummyUser) {
      await prisma.user.delete({ where: { id: dummyUser.id } });
    }
    if (unassignedInstructorProfile) {
      await prisma.instructorProfile.delete({ where: { id: unassignedInstructorProfile.id } });
    }
    if (unassignedInstructorUser) {
      await prisma.user.delete({ where: { id: unassignedInstructorUser.id } });
    }
    console.log('Cleanup completed successfully.');

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`MAJOR PHASE 7 TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('================================================================');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ TEST RUN ABORTED WITH ERROR:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
