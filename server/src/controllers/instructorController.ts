import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { academicDeliveryService } from '../services/academicDeliveryService.js';
import { normalizeAcademicLevel } from '../services/ai/types.js';
import { LEVEL_META } from '../services/ai/uopeopleCurriculumBuilder.js';

export const getInstructorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: true,
        classSessions: {
          include: {
            cohort: { include: { program: true } },
            attendances: { include: { student: { include: { user: true } } } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    // Determine cohort filter:
    // If user is SUPER_ADMIN or ACADEMIC_ADMIN and passed ?filter=assigned, filter by assignment;
    // Otherwise, if user has role INSTRUCTOR (and not super/academic admin), only show cohorts they are assigned to
    // (via CohortInstructor junction OR instructorName matching their name).
    const filterMode = req.query.filter as string | undefined;
    const isAcademyAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ACADEMIC_ADMIN';

    let cohortWhereClause: any = {
      status: { in: ['OPEN', 'ALMOST_FULL', 'IN_PROGRESS'] },
    };

    if (!isAcademyAdmin || filterMode === 'assigned') {
      const instructorNameSearch = req.user.lastName || '';
      cohortWhereClause = {
        ...cohortWhereClause,
        OR: [
          ...(instructorProfile ? [{ instructors: { some: { instructorId: instructorProfile.id } } }] : []),
          { instructors: { some: { instructor: { userId: req.user.id } } } },
          ...(instructorNameSearch ? [{ instructorName: { contains: instructorNameSearch, mode: 'insensitive' } }] : []),
        ],
      };
    }

    // Find active cohorts
    const activeCohorts = await prisma.cohort.findMany({
      where: cohortWhereClause,
      include: {
        program: { include: { school: true } },
        learningCenter: true,
        curriculumVersion: {
          include: {
            courses: {
              include: {
                modules: {
                  include: { lessons: { orderBy: { order: 'asc' } } },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        studentProfiles: {
          include: {
            user: true,
            lessonProgress: { where: { status: 'COMPLETED' } },
          },
        },
        enrollments: {
          where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
          include: {
            student: {
              include: {
                user: true,
                lessonProgress: { where: { status: 'COMPLETED' } },
              },
            },
          },
        },
        assignments: {
          include: { submissions: true },
        },
        projects: {
          include: {
            members: { include: { student: { include: { user: true } } } },
          },
        },
        classSessions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    // Ensure all cohorts have their level-scoped UoPeople courses populated and student metrics synchronized
    const enhancedCohorts = await Promise.all(
      activeCohorts.map(async (cohort) => {
        const { levelCode, levelDisplayName } = await academicDeliveryService.resolveCohortEffectiveLevel(cohort);

        let courses: any[] = await academicDeliveryService.ensureUoPeopleCourseForProgramLevel(
          cohort.programId,
          levelCode,
          cohort.curriculumVersionId
        );
        if (courses.length === 0) {
          courses = cohort.curriculumVersion?.courses || [];
        }

        // Enrich each student in the cohort roster with their resolved level and live progress metrics
        const enrichStudent = async (sp: any) => {
          if (!sp) return sp;
          const rawCandidate =
            (levelCode && levelCode !== 'LEVEL_1_FOUNDATION' ? levelCode : null) ||
            sp.currentLevel ||
            levelCode ||
            'LEVEL_1_FOUNDATION';
          const spLevelCode = normalizeAcademicLevel(rawCandidate);
          const spLevelMeta = LEVEL_META[spLevelCode] || LEVEL_META.LEVEL_1_FOUNDATION;

          const progress = await academicDeliveryService.calculateStudentProgress(sp.id).catch(() => null);

          return {
            ...sp,
            resolvedLevelCode: spLevelCode,
            resolvedLevelDisplayName: spLevelMeta.displayName,
            completedLessonsCount: progress?.completedLessons ?? 0,
            totalLessonsCount: progress?.totalLessons ?? 0,
            syllabusProgressPercentage: progress?.syllabusProgressPercentage ?? 0,
            attendanceRate: progress?.attendanceRate ?? sp.attendanceRate ?? 100,
            completionRate: progress?.completionRate ?? 0,
            calculatedCompletionRate: progress?.completionRate ?? 0,
          };
        };

        const enrichedProfiles = await Promise.all(
          (cohort.studentProfiles || []).map((sp) => enrichStudent(sp))
        );
        const enrichedEnrollments = await Promise.all(
          (cohort.enrollments || []).map(async (enr: any) => ({
            ...enr,
            student: enr.student ? await enrichStudent(enr.student) : enr.student,
          }))
        );

        return {
          ...cohort,
          levelCode,
          level: levelDisplayName,
          levelDisplayName,
          studentProfiles: enrichedProfiles,
          enrollments: enrichedEnrollments,
          curriculumVersion: cohort.curriculumVersion
            ? { ...cohort.curriculumVersion, courses }
            : { id: 'fallback-cv', versionNumber: 1, courses },
        };
      })
    );

    // Submissions requiring grading
    const pendingSubmissions = await prisma.submission.findMany({
      where: { grade: null, isLatest: true },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
      orderBy: { submittedAt: 'asc' },
      take: 30,
    });

    // Capstone projects across active cohorts
    const activeCohortIds = activeCohorts.map((c) => c.id);
    const cohortProjects = await prisma.project.findMany({
      where: {
        cohortId: { in: activeCohortIds },
      },
      include: {
        cohort: { select: { id: true, name: true, cohortCode: true, level: true, levelCode: true } },
        program: { select: { id: true, name: true } },
        members: { include: { student: { include: { user: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      instructor: instructorProfile
        ? {
            id: instructorProfile.id,
            staffCode: instructorProfile.staffCode,
            specialization: instructorProfile.specialization,
            qualification: instructorProfile.qualification,
            bio: instructorProfile.bio,
            name: `${instructorProfile.user.firstName} ${instructorProfile.user.lastName}`,
          }
        : {
            name: `${req.user.firstName} ${req.user.lastName}`,
            staffCode: 'FACULTY-LEAD',
          },
      cohorts: enhancedCohorts,
      pendingSubmissions,
      projects: cohortProjects,
      recentSessions: instructorProfile?.classSessions || [],
    });
  } catch (error: any) {
    console.error('getInstructorDashboard error:', error);
    res.status(500).json({ message: 'Failed to load instructor dashboard' });
  }
};

export const getCohortCurriculum = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cohortId } = req.params;
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        program: { include: { school: true } },
        learningCenter: true,
        studentProfiles: true,
        enrollments: {
          where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
          include: { student: true },
        },
        curriculumVersion: {
          include: {
            courses: {
              include: {
                modules: {
                  include: { lessons: { orderBy: { order: 'asc' } } },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            submissions: {
              include: { student: { include: { user: true } } },
            },
          },
        },
        projects: {
          include: {
            members: { include: { student: { include: { user: true } } } },
          },
        },
        classSessions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!cohort) {
      res.status(404).json({ message: 'Cohort not found.' });
      return;
    }

    const { levelCode, levelDisplayName } = await academicDeliveryService.resolveCohortEffectiveLevel(cohort);

    let courses: any[] = await academicDeliveryService.ensureUoPeopleCourseForProgramLevel(
      cohort.programId,
      levelCode,
      cohort.curriculumVersionId
    );
    if (courses.length === 0) {
      courses = cohort.curriculumVersion?.courses || [];
    }

    const enhancedCohort = {
      ...cohort,
      levelCode,
      level: levelDisplayName,
      levelDisplayName,
      curriculumVersion: cohort.curriculumVersion
        ? { ...cohort.curriculumVersion, courses }
        : { id: 'fallback-cv', versionNumber: 1, courses },
    };

    res.status(200).json({ cohort: enhancedCohort });
  } catch (error: any) {
    console.error('getCohortCurriculum error:', error);
    res.status(500).json({ message: 'Failed to fetch cohort curriculum' });
  }
};

export const createClassSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cohortId, courseId, moduleId, lessonId, title, date, startTime, endTime, topic, room, meetingUrl, status } = req.body;

    if (!cohortId || !title || !date || !topic) {
      res.status(400).json({ message: 'cohortId, title, date, and topic are required.' });
      return;
    }

    const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) {
      res.status(404).json({ message: 'Cohort not found.' });
      return;
    }

    const instructorProfile = req.user
      ? await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } })
      : null;

    const session = await prisma.classSession.create({
      data: {
        cohortId,
        instructorId: instructorProfile ? instructorProfile.id : null,
        courseId: courseId || null,
        moduleId: moduleId || null,
        lessonId: lessonId || null,
        title,
        date: new Date(date),
        startTime: startTime || '16:00',
        endTime: endTime || '19:00',
        topic,
        room: room || 'Turing Hall, Ile-Ife',
        meetingUrl: meetingUrl || null,
        status: status || 'SCHEDULED',
      },
    });

    res.status(201).json({ message: 'Class session created successfully', session });
  } catch (error: any) {
    console.error('createClassSession error:', error);
    res.status(500).json({ message: 'Failed to create class session' });
  }
};

export const evaluateCompetency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { studentId, competencyId, status, score, evidenceNotes } = req.body;

    if (!studentId || !competencyId || !status) {
      res.status(400).json({ message: 'studentId, competencyId, and status are required.' });
      return;
    }

    const record = await academicDeliveryService.evaluateCompetency({
      studentProfileId: studentId,
      competencyId,
      status,
      score: score !== undefined ? Number(score) : undefined,
      evidenceNotes,
      evaluatorUserId: req.user.id,
    });

    res.status(200).json({
      message: 'Competency evaluated successfully.',
      record,
    });
  } catch (error: any) {
    console.error('evaluateCompetency error:', error);
    res.status(500).json({ message: error.message || 'Failed to evaluate competency' });
  }
};

export const getStudentLearningProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }

    const profile = await academicDeliveryService.getStudentDetailedLearningProfile(studentId);
    res.status(200).json({ profile });
  } catch (error: any) {
    console.error('getStudentLearningProfile error:', error);
    res.status(500).json({ message: error.message || 'Failed to load student learning profile' });
  }
};

export const getStudentsLearningDirectory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { programId, cohortId, levelCode, search } = req.query;
    const directory = await academicDeliveryService.getAllStudentsLearningDirectory({
      programId: programId as string | undefined,
      cohortId: cohortId as string | undefined,
      levelCode: levelCode as string | undefined,
      search: search as string | undefined,
    });
    res.status(200).json(directory);
  } catch (error: any) {
    console.error('getStudentsLearningDirectory error:', error);
    res.status(500).json({ message: error.message || 'Failed to load students learning directory' });
  }
};

