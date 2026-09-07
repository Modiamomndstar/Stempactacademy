import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getParentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            cohort: {
              include: {
                program: { include: { school: true } },
                classSessions: {
                  take: 5,
                  orderBy: { date: 'asc' },
                },
              },
            },
            attendances: {
              include: { classSession: true },
              orderBy: { date: 'desc' },
              take: 10,
            },
            submissions: {
              include: { assignment: true },
              orderBy: { submittedAt: 'desc' },
              take: 5,
            },
            invoices: {
              include: { payments: true },
            },
            projectMembers: {
              include: { project: true },
            },
          },
        },
      },
    });

    if (!parentProfile) {
      // Fallback: see if this parent's email was registered as parentEmail in an application
      const matchedApps = await prisma.application.findMany({
        where: { parentEmail: req.user.email },
        include: {
          admission: true,
          program: true,
          cohort: true,
        },
      });

      res.status(200).json({
        parent: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
        },
        wards: [],
        applications: matchedApps,
        message: 'No active enrolled students directly linked yet.',
      });
      return;
    }

    const announcements = await prisma.announcement.findMany({
      where: { targetAudience: { in: ['ALL', 'PARENTS'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const wardsSummary = parentProfile.students.map((student) => {
      const totalSessions = student.attendances.length;
      const attendedSessions = student.attendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

      return {
        studentIdNumber: student.studentIdNumber,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        currentLevel: student.currentLevel,
        cohort: student.cohort,
        program: student.cohort?.program,
        attendanceRate,
        completionRate: student.completionRate,
        attendances: student.attendances,
        recentAssignments: student.submissions,
        invoices: student.invoices,
        projects: student.projectMembers.map((pm) => pm.project),
      };
    });

    res.status(200).json({
      parent: {
        id: parentProfile.id,
        relationship: parentProfile.relationship,
        emergencyContact: parentProfile.emergencyContact,
      },
      wards: wardsSummary,
      announcements,
    });
  } catch (error: any) {
    console.error('getParentDashboard error:', error);
    res.status(500).json({ message: 'Failed to load parent dashboard' });
  }
};
