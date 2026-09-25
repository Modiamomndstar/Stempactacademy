import { AttendanceStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

export interface StudentAcademicContext {
  studentProfileId: string;
  studentIdNumber: string;
  userId: string;
  fullName: string;
  email: string;
  cohortId: string;
  cohortCode: string;
  cohortName: string;
  programId: string;
  programCode: string;
  programName: string;
  programVersionId: string | null;
  programVersionNumber: number | null;
  curriculumVersionId: string | null;
  curriculumVersionNumber: number | null;
  academicSessionId: string | null;
  enrollmentId: string | null;
  isVersionAnchored: boolean;
}

export interface ProgressSummary {
  completionRate: number;
  attendanceRate: number;
  syllabusProgressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  totalAssignments: number;
  completedAssignments: number;
  averageAssignmentGrade: number | null;
  totalCompetencies: number;
  achievedCompetencies: number;
  totalProjects: number;
}

export interface InstitutionalCompletionPolicy {
  policyStatus: 'CONFIGURED' | 'PENDING_INSTITUTIONAL_DEFINITION';
  policyName?: string;
  policyVersion?: string;
  minimumAttendanceRate?: number;
  requiredLessonCompletionRate?: number;
  minimumAssignmentPassingGrade?: number;
  minimumCompetencyAchievementRate?: number;
  notes?: string;
}

export interface CompletionReadinessReport {
  studentId: string;
  studentIdNumber: string;
  fullName: string;
  cohortCode: string;
  programName: string;
  programVersionNumber: number | null;
  curriculumVersionNumber: number | null;
  academicEvidence: {
    attendanceRate: number;
    totalCohortSessions: number;
    attendedSessions: number;
    totalLessons: number;
    completedLessons: number;
    lessonCompletionRate: number;
    totalAssignments: number;
    completedAssignments: number;
    averageAssignmentGrade: number | null;
    totalCompetencies: number;
    achievedCompetencies: number;
    competencyAchievementRate: number;
    totalProjects: number;
  };
  institutionalPolicy: InstitutionalCompletionPolicy;
  evaluation: {
    status: 'POLICY_PENDING' | 'EVALUATED_ELIGIBLE' | 'DEFICITS_IDENTIFIED';
    isPolicyMet: boolean | null;
    deficits: string[];
    summary: string;
    evaluatedAt: Date;
  };
}

export class AcademicDeliveryService {
  /**
   * Resolves the canonical academic context and version anchor for a student.
   * Ensures that delivery, syllabus, and evaluation are anchored to the student's enrolled
   * CurriculumVersion and ProgramVersion, rather than any newer versions published later.
   */
  async getStudentAcademicContext(studentProfileId: string): Promise<StudentAcademicContext> {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        user: true,
        cohort: {
          include: {
            program: true,
            programVersion: true,
            curriculumVersion: true,
            academicSession: true,
          },
        },
        enrollments: {
          where: { status: { in: ['ENROLLED', 'ACTIVE', 'COMPLETED'] } },
          include: {
            cohort: {
              include: {
                program: true,
                programVersion: true,
                curriculumVersion: true,
                academicSession: true,
              },
            },
            program: true,
            programVersion: true,
            curriculumVersion: true,
            academicSession: true,
          },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new Error(`Student profile not found for id: ${studentProfileId}`);
    }

    const activeEnrollment = student.enrollments[0];
    const activeCohort: any = activeEnrollment?.cohort || student.cohort;

    if (!activeCohort) {
      throw new Error(`No active cohort found for student ${student.studentIdNumber}`);
    }

    // Version anchoring precedence:
    // 1. Enrollment record (immutable anchor established at enrollment)
    // 2. Cohort record (cohort-level version)
    const programId = activeEnrollment?.programId || activeCohort.programId;
    const programVersionId = activeEnrollment?.programVersionId || activeCohort.programVersionId;
    const curriculumVersionId = activeEnrollment?.curriculumVersionId || activeCohort.curriculumVersionId;
    const academicSessionId = activeEnrollment?.academicSessionId || activeCohort.academicSessionId;

    let programCode = activeEnrollment?.program?.code || activeCohort.program?.code || 'STEM-PROG';
    let programName = activeEnrollment?.program?.name || activeCohort.program?.name || 'Academic Program';
    let programVersionNumber: number | null = activeEnrollment?.programVersion?.versionNumber || activeCohort.programVersion?.versionNumber || null;
    let curriculumVersionNumber: number | null = activeEnrollment?.curriculumVersion?.versionNumber || activeCohort.curriculumVersion?.versionNumber || null;

    if (!programVersionNumber && programVersionId) {
      const pv = await prisma.programVersion.findUnique({ where: { id: programVersionId } });
      if (pv) programVersionNumber = pv.versionNumber;
    }

    if (!curriculumVersionNumber && curriculumVersionId) {
      const cv = await prisma.curriculumVersion.findUnique({ where: { id: curriculumVersionId } });
      if (cv) curriculumVersionNumber = cv.versionNumber;
    }

    return {
      studentProfileId: student.id,
      studentIdNumber: student.studentIdNumber,
      userId: student.userId,
      fullName: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      cohortId: activeCohort.id,
      cohortCode: activeCohort.cohortCode,
      cohortName: activeCohort.name,
      programId,
      programCode,
      programName,
      programVersionId,
      programVersionNumber,
      curriculumVersionId,
      curriculumVersionNumber,
      academicSessionId,
      enrollmentId: activeEnrollment?.id || null,
      isVersionAnchored: Boolean(programVersionId && curriculumVersionId),
    };
  }

  /**
   * Retrieves the canonical curriculum structure (courses, modules, lessons, practicals)
   * anchored strictly to the student's enrolled CurriculumVersion.
   *
   * Architectural Principle (reconciled with Phase 4):
   * Active delivery resolves 100% through the canonical relational database tables:
   * Course -> Module -> Lesson -> PracticalActivity.
   * CurriculumVersion.dataSnapshot is an immutable historical audit snapshot, NOT an active runtime source.
   */
  async getAnchoredCurriculumForStudent(studentProfileId: string) {
    const context = await this.getStudentAcademicContext(studentProfileId);

    // 1. Primary: fetch courses linked to this CurriculumVersion in relational tables
    let courses = context.curriculumVersionId
      ? await prisma.course.findMany({
          where: { curriculumVersionId: context.curriculumVersionId },
          include: {
            modules: {
              include: {
                lessons: { orderBy: { order: 'asc' } },
                practicalActivities: { orderBy: { createdAt: 'asc' } },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        })
      : [];

    // 2. Fallback: if no courses directly linked to curriculumVersionId, resolve via programId
    if (courses.length === 0) {
      courses = await prisma.course.findMany({
        where: { programId: context.programId },
        include: {
          modules: {
            include: {
              lessons: { orderBy: { order: 'asc' } },
              practicalActivities: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });
    }

    // Fetch competencies linked to CurriculumVersion or Program
    let competencies = context.curriculumVersionId
      ? await prisma.competency.findMany({
          where: { curriculumVersionId: context.curriculumVersionId },
        })
      : [];

    if (competencies.length === 0) {
      competencies = await prisma.competency.findMany({
        where: { programId: context.programId },
      });
    }

    return {
      context,
      courses,
      competencies,
    };
  }

  /**
   * Calculates authentic progress and metrics for a student from actual underlying records:
   * attendances (strictly scoped to active cohort sessions), completed lessons, graded assignments,
   * competencies, and projects.
   *
   * Architectural Note on StudentProfile.attendanceRate & completionRate:
   * These columns in StudentProfile serve purely as high-performance derived read caches.
   * The single authoritative source of truth is always the underlying evidence records.
   * Recalculations are completely idempotent and reproducible from raw evidence.
   */
  async calculateStudentProgress(studentProfileId: string): Promise<ProgressSummary> {
    const context = await this.getStudentAcademicContext(studentProfileId);

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        attendances: {
          include: { classSession: true },
        },
        submissions: {
          where: { isLatest: true },
        },
        competencies: true,
        projectMembers: true,
        lessonProgress: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!student) {
      throw new Error(`Student not found: ${studentProfileId}`);
    }

    const { courses, competencies } = await this.getAnchoredCurriculumForStudent(studentProfileId);

    // 1. Calculate Attendance Rate scoped strictly to the student's active cohort sessions
    const cohortSessions = await prisma.classSession.findMany({
      where: { cohortId: context.cohortId },
      select: { id: true },
    });
    const cohortSessionIds = new Set(cohortSessions.map((s) => s.id));

    const scopedAttendances = student.attendances.filter((a) => cohortSessionIds.has(a.classSessionId));
    const totalScopedAttendances = scopedAttendances.length;
    const attendedSessions = scopedAttendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
    ).length;

    const attendanceRate = totalScopedAttendances > 0
      ? Math.round((attendedSessions / totalScopedAttendances) * 100)
      : 100;

    // 2. Calculate Syllabus / Lesson Progress
    let allLessons: any[] = [];
    courses.forEach((c: any) => {
      if (Array.isArray(c.modules)) {
        c.modules.forEach((m: any) => {
          if (Array.isArray(m.lessons)) {
            allLessons = allLessons.concat(m.lessons);
          }
        });
      }
    });

    const totalLessons = allLessons.length;
    const completedLessons = student.lessonProgress.length;
    const syllabusProgressPercentage = totalLessons > 0
      ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
      : (completedLessons > 0 ? 100 : 0);

    // 3. Calculate Assignments Progress & Average Grade scoped to active cohort
    const cohortAssignments = await prisma.assignment.findMany({
      where: { cohortId: context.cohortId, status: { in: ['PUBLISHED', 'CLOSED'] } },
    });

    const cohortAssignmentIds = new Set(cohortAssignments.map((a) => a.id));
    const scopedSubmissions = student.submissions.filter((s) => cohortAssignmentIds.has(s.assignmentId));

    const totalAssignments = cohortAssignments.length;
    const completedAssignments = scopedSubmissions.length;
    const gradedSubmissions = scopedSubmissions.filter((s) => s.grade !== null && s.grade !== undefined);

    let averageAssignmentGrade: number | null = null;
    if (gradedSubmissions.length > 0) {
      const sumGrades = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
      averageAssignmentGrade = Math.round((sumGrades / gradedSubmissions.length) * 10) / 10;
    }

    // 4. Competencies
    const totalCompetencies = competencies.length;
    const achievedCompetencies = student.competencies.filter((c) => c.status === 'ACQUIRED').length;

    // 5. Authentic Overall Completion Rate Calculation (derived metric)
    let calculatedCompletionRate = 0;
    if (totalLessons > 0 || totalAssignments > 0) {
      const lessonComponent = totalLessons > 0 ? (completedLessons / totalLessons) * 40 : 40;
      const assignmentComponent = totalAssignments > 0
        ? (completedAssignments / totalAssignments) * 30
        : (completedAssignments > 0 ? 30 : 0);
      const attendanceComponent = (attendanceRate / 100) * 20;
      const compComponent = totalCompetencies > 0 ? (achievedCompetencies / totalCompetencies) * 10 : 10;

      calculatedCompletionRate = Math.min(100, Math.round(lessonComponent + assignmentComponent + attendanceComponent + compComponent));
    } else {
      calculatedCompletionRate = attendanceRate;
    }

    // Synchronize derived cache to StudentProfile for fast lookup
    await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        attendanceRate,
        completionRate: calculatedCompletionRate,
      },
    });

    return {
      completionRate: calculatedCompletionRate,
      attendanceRate,
      syllabusProgressPercentage,
      totalLessons,
      completedLessons,
      totalAssignments,
      completedAssignments,
      averageAssignmentGrade,
      totalCompetencies,
      achievedCompetencies,
      totalProjects: student.projectMembers.length,
    };
  }

  /**
   * Evaluates academic completion readiness based on:
   * 1. Factual academic evidence/metrics (attendance, lessons, assignments, competencies).
   * 2. Management-approved institutional policy (if provided/configured).
   *
   * Crucial Principle:
   * If STEMPACT management has not formally configured a completion policy, the system explicitly
   * reports POLICY_PENDING rather than fabricating universal pass/fail thresholds.
   * Does NOT issue certificates or create final completion decisions.
   */
  async evaluateCompletionReadiness(
    studentProfileId: string,
    policy?: InstitutionalCompletionPolicy
  ): Promise<CompletionReadinessReport> {
    const context = await this.getStudentAcademicContext(studentProfileId);
    const progress = await this.calculateStudentProgress(studentProfileId);

    const cohortSessions = await prisma.classSession.findMany({
      where: { cohortId: context.cohortId },
    });

    const factualEvidence = {
      attendanceRate: progress.attendanceRate,
      totalCohortSessions: cohortSessions.length,
      attendedSessions: Math.round((progress.attendanceRate / 100) * cohortSessions.length),
      totalLessons: progress.totalLessons,
      completedLessons: progress.completedLessons,
      lessonCompletionRate: progress.syllabusProgressPercentage,
      totalAssignments: progress.totalAssignments,
      completedAssignments: progress.completedAssignments,
      averageAssignmentGrade: progress.averageAssignmentGrade,
      totalCompetencies: progress.totalCompetencies,
      achievedCompetencies: progress.achievedCompetencies,
      competencyAchievementRate: progress.totalCompetencies > 0
        ? Math.round((progress.achievedCompetencies / progress.totalCompetencies) * 100)
        : 100,
      totalProjects: progress.totalProjects,
    };

    // If no management policy is configured or supplied, mark policy as pending institutional definition
    if (!policy || policy.policyStatus === 'PENDING_INSTITUTIONAL_DEFINITION') {
      return {
        studentId: context.studentProfileId,
        studentIdNumber: context.studentIdNumber,
        fullName: context.fullName,
        cohortCode: context.cohortCode,
        programName: context.programName,
        programVersionNumber: context.programVersionNumber,
        curriculumVersionNumber: context.curriculumVersionNumber,
        academicEvidence: factualEvidence,
        institutionalPolicy: {
          policyStatus: 'PENDING_INSTITUTIONAL_DEFINITION',
          notes: 'Institutional completion criteria are pending official STEMPACT management definition. Factual academic metrics are presented for administrative evaluation.',
        },
        evaluation: {
          status: 'POLICY_PENDING',
          isPolicyMet: null,
          deficits: [],
          summary: 'Factual academic evidence compiled. Formal completion readiness evaluation awaits institutional policy definition.',
          evaluatedAt: new Date(),
        },
      };
    }

    // When an explicit institutional policy is provided, evaluate evidence against it
    const deficits: string[] = [];

    if (policy.minimumAttendanceRate !== undefined && factualEvidence.attendanceRate < policy.minimumAttendanceRate) {
      deficits.push(`Attendance rate is ${factualEvidence.attendanceRate}%, below policy threshold of ${policy.minimumAttendanceRate}%.`);
    }

    if (policy.requiredLessonCompletionRate !== undefined && factualEvidence.lessonCompletionRate < policy.requiredLessonCompletionRate) {
      deficits.push(`Lesson completion is ${factualEvidence.lessonCompletionRate}%, below required ${policy.requiredLessonCompletionRate}%.`);
    }

    if (policy.minimumAssignmentPassingGrade !== undefined) {
      if (factualEvidence.averageAssignmentGrade === null || factualEvidence.averageAssignmentGrade < policy.minimumAssignmentPassingGrade) {
        deficits.push(`Average assignment grade is ${factualEvidence.averageAssignmentGrade ?? 0}%, below policy threshold of ${policy.minimumAssignmentPassingGrade}%.`);
      }
    }

    if (policy.minimumCompetencyAchievementRate !== undefined && factualEvidence.competencyAchievementRate < policy.minimumCompetencyAchievementRate) {
      deficits.push(`Competency achievement is ${factualEvidence.competencyAchievementRate}%, below policy threshold of ${policy.minimumCompetencyAchievementRate}%.`);
    }

    const isPolicyMet = deficits.length === 0;
    const status = isPolicyMet ? 'EVALUATED_ELIGIBLE' : 'DEFICITS_IDENTIFIED';

    return {
      studentId: context.studentProfileId,
      studentIdNumber: context.studentIdNumber,
      fullName: context.fullName,
      cohortCode: context.cohortCode,
      programName: context.programName,
      programVersionNumber: context.programVersionNumber,
      curriculumVersionNumber: context.curriculumVersionNumber,
      academicEvidence: factualEvidence,
      institutionalPolicy: policy,
      evaluation: {
        status,
        isPolicyMet,
        deficits,
        summary: isPolicyMet
          ? `All institutional completion policy requirements for ${policy.policyName || 'Program'} are satisfied based on verified academic evidence.`
          : `Deficits identified against institutional policy requirements: ${deficits.join(' ')}`,
        evaluatedAt: new Date(),
      },
    };
  }

  /**
   * Records student lesson progress (completion / in progress) with:
   * 1. IDOR verification (ensures lesson belongs strictly to student's anchored curriculum).
   * 2. Enrollment scoping (links progress to active StudentCohortEnrollment).
   */
  async recordLessonProgress(params: {
    studentProfileId: string;
    lessonId: string;
    status?: string;
    timeSpentMinutes?: number;
    notes?: string;
  }) {
    const { studentProfileId, lessonId, status = 'COMPLETED', timeSpentMinutes = 30, notes } = params;

    const context = await this.getStudentAcademicContext(studentProfileId);

    // Fetch lesson and verify curriculum context (IDOR Protection)
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }

    const course = lesson.module.course;

    // Canonical Version-Anchored Authorization:
    // When the student's academic context is anchored to a CurriculumVersion, the lesson's course MUST
    // match that exact curriculumVersionId. Cross-version lesson access within the same program is strictly forbidden.
    // The programId fallback is ONLY permitted for legacy transition cohorts/courses that have no curriculumVersionId.
    let isAnchoredToCurriculum = false;
    if (context.curriculumVersionId) {
      isAnchoredToCurriculum = course.curriculumVersionId === context.curriculumVersionId;
    } else {
      isAnchoredToCurriculum = !course.curriculumVersionId && course.programId === context.programId;
    }

    if (!isAnchoredToCurriculum) {
      throw new Error(
        `Access denied: Lesson ${lessonId} does not belong to the student's enrolled curriculum context.`
      );
    }

    const record = await prisma.studentLessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: studentProfileId,
          lessonId,
        },
      },
      update: {
        status,
        enrollmentId: context.enrollmentId,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        timeSpentMinutes: { increment: timeSpentMinutes },
        notes,
      },
      create: {
        studentId: studentProfileId,
        enrollmentId: context.enrollmentId,
        lessonId,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        timeSpentMinutes,
        notes,
      },
    });

    // Recalculate derived cache
    await this.calculateStudentProgress(studentProfileId);

    return record;
  }

  /**
   * Records attendance for a class session with:
   * 1. Strict cohort verification (student must be enrolled in session's cohort).
   * 2. Authoritative persistence in Attendance table.
   * 3. Idempotent derived cache updates.
   */
  async recordAttendance(params: {
    classSessionId: string;
    records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>;
    markedByUserId: string;
  }) {
    const { classSessionId, records, markedByUserId } = params;

    const session = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: { cohort: true },
    });

    if (!session) {
      throw new Error(`Class session not found: ${classSessionId}`);
    }

    // Verify each student belongs to this session's cohort
    for (const rec of records) {
      const student = await prisma.studentProfile.findUnique({
        where: { id: rec.studentId },
        include: {
          enrollments: {
            where: { cohortId: session.cohortId, status: { in: ['ENROLLED', 'ACTIVE'] } },
          },
        },
      });

      if (!student) {
        throw new Error(`Student ${rec.studentId} not found.`);
      }

      const isInCohort = student.currentCohortId === session.cohortId || student.enrollments.length > 0;
      if (!isInCohort) {
        throw new Error(
          `Student ${student.studentIdNumber} is not enrolled in cohort ${session.cohort.cohortCode}. Attendance rejected.`
        );
      }
    }

    // Upsert attendance records transactionally
    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        await tx.attendance.upsert({
          where: {
            classSessionId_studentId: {
              classSessionId,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks,
            markedById: markedByUserId,
          },
          create: {
            classSessionId,
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks,
            markedById: markedByUserId,
          },
        });
      }
    });

    // Update session status to COMPLETED if not already
    if (session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') {
      await prisma.classSession.update({
        where: { id: classSessionId },
        data: { status: 'COMPLETED' },
      });
    }

    // Recalculate each student's attendance and overall progress cache
    for (const rec of records) {
      await this.calculateStudentProgress(rec.studentId);
    }

    return {
      classSessionId,
      cohortCode: session.cohort.cohortCode,
      recordedCount: records.length,
    };
  }

  /**
   * Submits an assignment with automatic versioning, audit trail, and cohort validation.
   */
  async submitAssignment(params: {
    assignmentId: string;
    studentProfileId: string;
    userId: string;
    content: string;
    attachmentUrl?: string;
  }) {
    const { assignmentId, studentProfileId, userId, content, attachmentUrl } = params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { cohort: true },
    });

    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    if (assignment.status === 'CLOSED') {
      throw new Error('This assignment is closed for submissions.');
    }

    // Verify student enrollment in the cohort
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        enrollments: {
          where: { cohortId: assignment.cohortId, status: { in: ['ENROLLED', 'ACTIVE'] } },
        },
      },
    });

    if (!student) {
      throw new Error('Student profile not found.');
    }

    const isEnrolled = student.currentCohortId === assignment.cohortId || student.enrollments.length > 0;
    if (!isEnrolled) {
      throw new Error(`Student is not enrolled in cohort ${assignment.cohort.cohortCode} for this assignment.`);
    }

    // Check existing submissions for this student & assignment
    const existingSubmissions = await prisma.submission.findMany({
      where: { assignmentId, studentId: studentProfileId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = existingSubmissions.length > 0 ? existingSubmissions[0].version + 1 : 1;

    // Use transaction to archive older versions and insert new latest submission
    const newSubmission = await prisma.$transaction(async (tx) => {
      if (existingSubmissions.length > 0) {
        await tx.submission.updateMany({
          where: { assignmentId, studentId: studentProfileId },
          data: { isLatest: false },
        });
      }

      return await tx.submission.create({
        data: {
          assignmentId,
          studentId: studentProfileId,
          userId,
          content,
          attachmentUrl,
          version: nextVersion,
          isLatest: true,
          status: 'SUBMITTED',
        },
        include: { assignment: true },
      });
    });

    // Recalculate derived cache
    await this.calculateStudentProgress(studentProfileId);

    return newSubmission;
  }

  /**
   * Grades an assignment submission with score range validation, feedback, and grader audit.
   */
  async gradeSubmission(params: {
    submissionId: string;
    grade: number;
    feedback?: string;
    gradedByUserId: string;
  }) {
    const { submissionId, grade, feedback, gradedByUserId } = params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, student: true },
    });

    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    if (grade < 0 || grade > submission.assignment.maxPoints) {
      throw new Error(`Grade must be between 0 and ${submission.assignment.maxPoints}. Received: ${grade}.`);
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedById: gradedByUserId,
      },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
    });

    // Recalculate derived cache
    await this.calculateStudentProgress(submission.studentId);

    return updated;
  }

  /**
   * Evaluates a student competency with evidence, enrollment link, and audit tracking.
   */
  async evaluateCompetency(params: {
    studentProfileId: string;
    competencyId: string;
    status: 'ACQUIRED' | 'IN_PROGRESS' | 'NEEDS_PRACTICE';
    score?: number;
    evidenceNotes?: string;
    evaluatorUserId: string;
  }) {
    const { studentProfileId, competencyId, status, score, evidenceNotes, evaluatorUserId } = params;

    const context = await this.getStudentAcademicContext(studentProfileId);

    const competency = await prisma.competency.findUnique({
      where: { id: competencyId },
    });

    if (!competency) {
      throw new Error(`Competency not found: ${competencyId}`);
    }

    const existing = await prisma.studentCompetency.findFirst({
      where: { studentId: studentProfileId, competencyId },
    });

    let record;
    if (existing) {
      record = await prisma.studentCompetency.update({
        where: { id: existing.id },
        data: {
          status,
          score,
          evidenceNotes,
          enrollmentId: context.enrollmentId,
          evaluatorId: evaluatorUserId,
          evaluatedAt: new Date(),
        },
      });
    } else {
      record = await prisma.studentCompetency.create({
        data: {
          studentId: studentProfileId,
          enrollmentId: context.enrollmentId,
          competencyId,
          status,
          score,
          evidenceNotes,
          evaluatorId: evaluatorUserId,
          evaluatedAt: new Date(),
        },
      });
    }

    // Recalculate derived cache
    await this.calculateStudentProgress(studentProfileId);

    return record;
  }

  /**
   * Evaluates a project with score, qualitative feedback, and status update.
   */
  async evaluateProject(params: {
    projectId: string;
    score: number;
    feedback: string;
    status?: string;
  }) {
    const { projectId, score, feedback, status = 'COMPLETED' } = params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (score < 0 || score > 100) {
      throw new Error(`Project score must be between 0 and 100. Received: ${score}`);
    }

    return prisma.project.update({
      where: { id: projectId },
      data: {
        score,
        feedback,
        status,
      },
      include: {
        members: { include: { student: { include: { user: true } } } },
      },
    });
  }
}

export const academicDeliveryService = new AcademicDeliveryService();
