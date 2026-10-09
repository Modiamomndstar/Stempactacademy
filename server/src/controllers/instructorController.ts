import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { academicDeliveryService } from '../services/academicDeliveryService.js';

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

    // Find all active cohorts
    const activeCohorts = await prisma.cohort.findMany({
      where: { status: { in: ['OPEN', 'ALMOST_FULL', 'IN_PROGRESS'] } },
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
          include: { user: true },
        },
        enrollments: {
          where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
          include: { student: { include: { user: true } } },
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

    // Ensure all cohorts have their courses populated even if curriculumVersionId was null
    const enhancedCohorts = await Promise.all(
      activeCohorts.map(async (cohort) => {
        let courses = cohort.curriculumVersion?.courses || [];
        if (courses.length === 0 && cohort.programId) {
          courses = await prisma.course.findMany({
            where: { programId: cohort.programId },
            include: {
              modules: {
                include: { lessons: { orderBy: { order: 'asc' } } },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          });
        }
        return {
          ...cohort,
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
        cohort: { select: { id: true, name: true, cohortCode: true, level: true } },
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

    let courses = cohort.curriculumVersion?.courses || [];
    if (courses.length === 0 && cohort.programId) {
      courses = await prisma.course.findMany({
        where: { programId: cohort.programId },
        include: {
          modules: {
            include: { lessons: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });
    }

    const enhancedCohort = {
      ...cohort,
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
