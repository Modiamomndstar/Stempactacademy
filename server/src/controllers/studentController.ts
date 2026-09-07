import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: true,
        cohort: {
          include: {
            program: {
              include: {
                school: true,
                courses: {
                  include: {
                    modules: {
                      include: { lessons: true },
                    },
                  },
                },
                competencyList: true,
              },
            },
            classSessions: {
              orderBy: { date: 'asc' },
            },
          },
        },
        attendances: {
          include: { classSession: true },
          orderBy: { date: 'desc' },
        },
        submissions: {
          include: { assignment: true },
          orderBy: { submittedAt: 'desc' },
        },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
        certificates: true,
        competencies: {
          include: { competency: true },
        },
        projectMembers: {
          include: { project: true },
        },
      },
    });

    if (!studentProfile) {
      res.status(404).json({ message: 'Student profile not found for this account.' });
      return;
    }

    // Calculate real attendance percentage
    const totalSessions = studentProfile.attendances.length;
    const attendedSessions = studentProfile.attendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

    // Upcoming assignments
    const cohortId = studentProfile.currentCohortId;
    const upcomingAssignments = cohortId
      ? await prisma.assignment.findMany({
          where: { cohortId },
          include: {
            submissions: {
              where: { studentId: studentProfile.id },
            },
          },
          orderBy: { dueDate: 'asc' },
        })
      : [];

    // Announcements
    const announcements = await prisma.announcement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      dashboard: {
        profile: {
          id: studentProfile.id,
          userId: studentProfile.userId,
          studentIdNumber: studentProfile.studentIdNumber,
          fullName: `${studentProfile.user.firstName} ${studentProfile.user.lastName}`,
          email: studentProfile.user.email,
          phone: studentProfile.user.phone,
          avatarUrl: studentProfile.user.avatarUrl,
          currentLevel: studentProfile.currentLevel,
          status: studentProfile.status,
          enrollmentDate: studentProfile.enrollmentDate,
        },
        cohort: studentProfile.cohort,
        program: studentProfile.cohort?.program,
        metrics: {
          progressPercentage: studentProfile.completionRate || 68,
          attendanceRate,
          totalClasses: totalSessions,
          attendedClasses: attendedSessions,
          modulesCompletedCount: 8,
          totalModulesCount: 12,
          projectsCount: studentProfile.projectMembers.length,
          achievedCompetenciesCount: studentProfile.competencies.length,
        },
        attendances: studentProfile.attendances,
        assignments: upcomingAssignments,
        submissions: studentProfile.submissions,
        invoices: studentProfile.invoices,
        certificates: studentProfile.certificates,
        competencies: studentProfile.competencies,
        projects: studentProfile.projectMembers.map((pm) => pm.project),
        announcements,
      },
    });
  } catch (error: any) {
    console.error('getStudentDashboard error:', error);
    res.status(500).json({ message: 'Failed to load student dashboard' });
  }
};
