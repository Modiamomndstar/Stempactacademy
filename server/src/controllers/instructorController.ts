import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

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

    // Find all active cohorts (or all cohorts if super admin/faculty)
    const activeCohorts = await prisma.cohort.findMany({
      where: { status: { in: ['OPEN', 'ALMOST_FULL', 'IN_PROGRESS'] } },
      include: {
        program: { include: { school: true } },
        studentProfiles: {
          include: { user: true },
        },
        assignments: {
          include: { submissions: true },
        },
        classSessions: {
          orderBy: { date: 'desc' },
          take: 3,
        },
      },
    });

    // Submissions requiring grading
    const pendingSubmissions = await prisma.submission.findMany({
      where: { grade: null },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
      take: 10,
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
      cohorts: activeCohorts,
      pendingSubmissions,
      recentSessions: instructorProfile?.classSessions || [],
    });
  } catch (error: any) {
    console.error('getInstructorDashboard error:', error);
    res.status(500).json({ message: 'Failed to load instructor dashboard' });
  }
};

export const createClassSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cohortId, title, date, startTime, endTime, topic, room } = req.body;

    const instructorProfile = req.user
      ? await prisma.instructorProfile.findUnique({ where: { userId: req.user.id } })
      : null;

    const session = await prisma.classSession.create({
      data: {
        cohortId,
        instructorId: instructorProfile ? instructorProfile.id : null,
        title,
        date: new Date(date),
        startTime: startTime || '16:00',
        endTime: endTime || '19:00',
        topic,
        room: room || 'Turing Hall, Ile-Ife',
      },
    });

    res.status(201).json({ message: 'Class session created successfully', session });
  } catch (error: any) {
    console.error('createClassSession error:', error);
    res.status(500).json({ message: 'Failed to create class session' });
  }
};
