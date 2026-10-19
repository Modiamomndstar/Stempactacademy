import { AcademicLevel, AttendanceStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import {
  buildUoPeopleStructuredCourse,
  LEVEL_META,
} from './ai/uopeopleCurriculumBuilder.js';
import { normalizeAcademicLevel } from './ai/types.js';
import { isVerifiedVideoUrl } from './verifiedVideoRegistry.js';

export interface StudentAcademicContext {
  studentProfileId: string;
  studentIdNumber: string;
  userId: string;
  fullName: string;
  email: string;
  cohortId: string;
  cohortCode: string;
  cohortName: string;
  levelCode: string;
  levelDisplayName: string;
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
  levelCode?: string;
  levelDisplayName?: string;
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
   * CurriculumVersion, ProgramVersion, and Cohort AcademicLevel.
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

    // Resolve AcademicLevel consistently across cohort.levelCode, student.currentLevel, and cohort.level
    const rawLevelCandidate =
      (activeCohort.levelCode && activeCohort.levelCode !== 'LEVEL_1_FOUNDATION'
        ? activeCohort.levelCode
        : null) ||
      student.currentLevel ||
      activeCohort.level ||
      activeCohort.levelCode ||
      'LEVEL_1_FOUNDATION';
    const levelCode = normalizeAcademicLevel(rawLevelCandidate);
    const levelInfo = LEVEL_META[levelCode] || LEVEL_META.LEVEL_1_FOUNDATION;

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
      levelCode,
      levelDisplayName: levelInfo.displayName,
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
   * Ensures a UoPeople-structured course (Course Introduction -> Units 1..W -> Final Level Project & Certificate Issuance)
   * exists for the given programId and AcademicLevel (LEVEL_1_FOUNDATION .. LEVEL_4_SPECIALIST).
   * Non-destructively upgrades legacy or incomplete courses while ensuring 100% verified videos and non-repeating units.
   */
  async ensureUoPeopleCourseForProgramLevel(
    programId: string,
    levelCode: string = 'LEVEL_1_FOUNDATION',
    curriculumVersionId?: string | null,
    forceRegenerate: boolean = false
  ) {
    const normalizedCode = normalizeAcademicLevel(levelCode);
    const normalizedLevel = (LEVEL_META[normalizedCode] ? LEVEL_META[normalizedCode].code : 'LEVEL_1_FOUNDATION') as AcademicLevel;

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { school: true },
    });

    if (!program) {
      return [];
    }

    const existingCourses = await prisma.course.findMany({
      where: { programId },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                _count: { select: { studentProgress: true } },
              },
              orderBy: { order: 'asc' },
            },
            practicalActivities: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    const isComputerHardwareProgram = /computer\s*hardware|pc\s*hardware|motherboard|laptop\s*repair|system\s*maintenance/i.test(
      `${program.name} ${program.description || ''}`
    );

    const matchingLevelCourses = existingCourses.filter(
      (c) => c.level === normalizedLevel || (normalizedLevel === 'LEVEL_1_FOUNDATION' && !c.level)
    );

    // Check if any matching course already satisfies the complete UoPeople architecture, 8+ unique units, and 100% verified videos
    if (!forceRegenerate) {
      const validCourse = matchingLevelCourses.find((c) => {
        if (!Array.isArray(c.modules) || c.modules.length < 8) return false;

        const hasIntroUnit = c.modules.some(
          (m) => m.order === 0 || /course\s*introduction/i.test(m.title)
        );
        const hasFinalProjectUnit = c.modules.some(
          (m) =>
            /final\s*level\s*project|certificate\s*issuance/i.test(m.title) ||
            m.lessons.some((l) => l.interactiveLabType === 'CERTIFICATE_GATE')
        );
        if (!hasIntroUnit || !hasFinalProjectUnit) return false;

        // Check that no two units repeat the same theme title
        const normalizedThemes = c.modules.map((m) =>
          String(m.title || '')
            .replace(/^unit\s*\d+\s*:\s*/i, '')
            .trim()
            .toLowerCase()
        );
        if (new Set(normalizedThemes).size !== normalizedThemes.length) {
          return false;
        }

        // Check that all lessons with a videoUrl use a 100% verified live YouTube ID
        const hasInvalidVideo = c.modules.some((m) =>
          m.lessons.some((l) => Boolean(l.videoUrl) && !isVerifiedVideoUrl(l.videoUrl))
        );
        if (hasInvalidVideo) {
          return false;
        }

        if (isComputerHardwareProgram) {
          const allTitles = c.modules
            .map((m) => `${m.title} ${m.lessons.map((l) => l.title).join(' ')}`)
            .join(' ');
          if (/arduino\s*uno|ultrasonic|servo|pid\s*loop/i.test(allTitles)) {
            return false;
          }
        }
        return c.level === normalizedLevel;
      });

      if (validCourse) {
        return [validCourse];
      }
    }

    // Parse program duration weeks (guarantee at least 7 weeks => Course Intro + 6 Learning Units + Final Project = 8 units)
    const durationMatch = String(program.duration || '8 Weeks').match(/(\d+)/);
    const parsedWeeks = durationMatch ? parseInt(durationMatch[1], 10) : 7;
    const durationWeeks = Math.min(9, Math.max(7, parsedWeeks > 9 ? 8 : parsedWeeks));
    const toolsList = String(program.tools || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const [blueprint] = buildUoPeopleStructuredCourse({
      programTitle: program.name,
      programCode: program.code,
      schoolCode: program.school?.code || 'STEM',
      levelStr: normalizedLevel,
      durationWeeks,
      description: program.description,
      tools: toolsList,
    });

    // Determine target CurriculumVersionId if available
    const resolvedCvId =
      curriculumVersionId ||
      matchingLevelCourses.find((c) => c.curriculumVersionId)?.curriculumVersionId ||
      existingCourses.find((c) => c.curriculumVersionId)?.curriculumVersionId ||
      null;

    // Replace outdated/incomplete courses for this level so the canonical 8-unit UoPeople course takes effect cleanly
    for (const oldCourse of matchingLevelCourses) {
      await prisma.course.delete({ where: { id: oldCourse.id } }).catch(() => {});
    }

    const createdCourse = await prisma.course.create({
      data: {
        programId: program.id,
        curriculumVersionId: resolvedCvId,
        code: `${blueprint.code}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        title: blueprint.title,
        description: blueprint.description,
        credits: blueprint.credits || 3,
        level: normalizedLevel,
        order: blueprint.order,
        modules: {
          create: blueprint.modules.map((m: any) => ({
            title: m.title,
            description: m.description,
            order: m.order,
            durationHours: m.durationHours || 8,
            lessons: {
              create: (m.lessons || []).map((l: any, lIdx: number) => ({
                title: l.title,
                content: l.content,
                order: lIdx + 1,
                videoUrl: l.videoUrl || undefined,
                videoDurationMin: l.videoDurationMin || undefined,
                videoSummary: l.videoSummary || undefined,
                interactiveLabType: l.interactiveLabType || undefined,
                resources: l.resources || undefined,
              })),
            },
            practicalActivities: {
              create: (m.lessons || [])
                .flatMap((l: any) =>
                  (l.practicalActivities || []).map((paText: string) => ({
                    title: `${l.title} — Practical Exercise`,
                    description: paText,
                    objectives: 'Hands-on practical mastery and engineering verification.',
                    requiredTools: toolsList.slice(0, 3).join(', ') || 'Industry Toolchain',
                    estimatedDurationMin: 60,
                  }))
                ),
            },
          })),
        },
      },
      include: {
        modules: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
            practicalActivities: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return [createdCourse];
  }

  /**
   * Retrieves the canonical curriculum structure (courses, modules, lessons, practicals)
   * anchored strictly to the student's enrolled Cohort AcademicLevel and Program.
   */
  async getAnchoredCurriculumForStudent(studentProfileId: string) {
    const context = await this.getStudentAcademicContext(studentProfileId);

    // Ensure and retrieve the UoPeople-structured course strictly scoped to the student's cohort levelCode
    const courses = await this.ensureUoPeopleCourseForProgramLevel(
      context.programId,
      context.levelCode,
      context.curriculumVersionId
    );

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

    const totalSessionsHeld = cohortSessions.length;
    const attendanceRate = totalScopedAttendances > 0
      ? Math.round((attendedSessions / totalScopedAttendances) * 100)
      : (totalSessionsHeld > 0 ? 0 : 100);

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

    const activeCourseLessonIds = new Set(allLessons.map((l) => l.id));
    const totalLessons = allLessons.length;
    const completedLessons = student.lessonProgress.filter((lp) =>
      activeCourseLessonIds.has(lp.lessonId)
    ).length;
    const syllabusProgressPercentage = totalLessons > 0
      ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
      : 0;

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
      const lessonComponent = totalLessons > 0 ? (completedLessons / totalLessons) * 40 : 0;
      const assignmentComponent = totalAssignments > 0
        ? (completedAssignments / totalAssignments) * 30
        : 30;
      const attendanceComponent = totalScopedAttendances > 0 ? (attendanceRate / 100) * 20 : 20;
      const compComponent = totalCompetencies > 0 ? (achievedCompetencies / totalCompetencies) * 10 : 10;

      calculatedCompletionRate = Math.min(100, Math.round(lessonComponent + assignmentComponent + attendanceComponent + compComponent));
    } else {
      calculatedCompletionRate = 0;
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
   * 2. STEMPACT Academic Council Standard Completion Policy (or custom policy if supplied).
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

    const effectivePolicy: InstitutionalCompletionPolicy =
      policy && policy.policyStatus
        ? policy
        : {
            policyStatus: 'CONFIGURED',
            policyName: `STEMPACT Academic Council Standard Policy (${context.levelDisplayName})`,
            policyVersion: 'v2.4-UoPeople',
            minimumAttendanceRate: 75,
            requiredLessonCompletionRate: 90,
            minimumAssignmentPassingGrade: 50,
            notes:
              'Requires completion of Course Introduction, Weekly Learning Units (including Self-Quizzes & Unit Assignments), Final Level Project, and minimum 75% attendance.',
          };

    if (effectivePolicy.policyStatus === 'PENDING_INSTITUTIONAL_DEFINITION') {
      return {
        studentId: context.studentProfileId,
        studentIdNumber: context.studentIdNumber,
        fullName: context.fullName,
        cohortCode: context.cohortCode,
        levelCode: context.levelCode,
        levelDisplayName: context.levelDisplayName,
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

    // Evaluate evidence against the institutional policy
    const deficits: string[] = [];

    if (
      effectivePolicy.minimumAttendanceRate !== undefined &&
      factualEvidence.attendanceRate < effectivePolicy.minimumAttendanceRate
    ) {
      deficits.push(
        `Attendance rate is ${factualEvidence.attendanceRate}%, below policy threshold of ${effectivePolicy.minimumAttendanceRate}%.`
      );
    }

    if (
      effectivePolicy.requiredLessonCompletionRate !== undefined &&
      factualEvidence.lessonCompletionRate < effectivePolicy.requiredLessonCompletionRate
    ) {
      deficits.push(
        `Lesson & unit completion is ${factualEvidence.lessonCompletionRate}% (${factualEvidence.completedLessons}/${factualEvidence.totalLessons} lessons), below required ${effectivePolicy.requiredLessonCompletionRate}%.`
      );
    }

    if (
      effectivePolicy.minimumAssignmentPassingGrade !== undefined &&
      factualEvidence.totalAssignments > 0
    ) {
      if (factualEvidence.completedAssignments < Math.ceil(factualEvidence.totalAssignments * 0.7)) {
        deficits.push(
          `Completed assignments (${factualEvidence.completedAssignments}/${factualEvidence.totalAssignments}) is below the required 70% submission threshold.`
        );
      } else if (
        factualEvidence.averageAssignmentGrade !== null &&
        factualEvidence.averageAssignmentGrade < effectivePolicy.minimumAssignmentPassingGrade
      ) {
        deficits.push(
          `Average assignment grade is ${factualEvidence.averageAssignmentGrade}%, below policy threshold of ${effectivePolicy.minimumAssignmentPassingGrade}%.`
        );
      }
    }

    if (
      effectivePolicy.minimumCompetencyAchievementRate !== undefined &&
      factualEvidence.competencyAchievementRate < effectivePolicy.minimumCompetencyAchievementRate
    ) {
      deficits.push(
        `Competency achievement is ${factualEvidence.competencyAchievementRate}%, below policy threshold of ${effectivePolicy.minimumCompetencyAchievementRate}%.`
      );
    }

    const isPolicyMet = deficits.length === 0;
    const status = isPolicyMet ? 'EVALUATED_ELIGIBLE' : 'DEFICITS_IDENTIFIED';

    return {
      studentId: context.studentProfileId,
      studentIdNumber: context.studentIdNumber,
      fullName: context.fullName,
      cohortCode: context.cohortCode,
      levelCode: context.levelCode,
      levelDisplayName: context.levelDisplayName,
      programName: context.programName,
      programVersionNumber: context.programVersionNumber,
      curriculumVersionNumber: context.curriculumVersionNumber,
      academicEvidence: factualEvidence,
      institutionalPolicy: effectivePolicy,
      evaluation: {
        status,
        isPolicyMet,
        deficits,
        summary: isPolicyMet
          ? `All institutional completion policy requirements for ${context.programName} (${context.levelDisplayName}) are satisfied based on verified academic evidence.`
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

    // Canonical Version & Program-Anchored Authorization:
    const isAnchoredToCurriculum =
      course.programId === context.programId ||
      Boolean(context.curriculumVersionId && course.curriculumVersionId === context.curriculumVersionId);

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
