import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/prisma.js';

export const getCoordinatorOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: req.user.id },
    });

    let assignedProgramIds: string[] = [];
    if (coordinator?.assignedPrograms) {
      try {
        assignedProgramIds = JSON.parse(coordinator.assignedPrograms);
      } catch {
        assignedProgramIds = [];
      }
    }

    const whereCohort: any = {};
    if (req.user.role !== 'SUPER_ADMIN' && assignedProgramIds.length > 0) {
      whereCohort.program = {
        OR: [
          { id: { in: assignedProgramIds } },
          { code: { in: assignedProgramIds } },
        ],
      };
    }

    const cohorts = await prisma.cohort.findMany({
      where: whereCohort,
      include: {
        program: { include: { school: true } },
        studentProfiles: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            submissions: { select: { grade: true } },
          },
        },
        classSessions: {
          orderBy: { date: 'asc' },
          take: 5,
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const totalStudents = cohorts.reduce((acc, c) => acc + c.studentProfiles.length, 0);

    const cohortSummaries = cohorts.map((c) => {
      const avgCohortAttendance = c.studentProfiles.length > 0
        ? Math.round(c.studentProfiles.reduce((sum, s) => sum + s.attendanceRate, 0) / c.studentProfiles.length)
        : 100;

      return {
        id: c.id,
        cohortCode: c.cohortCode,
        name: c.name,
        programName: c.program.name,
        schoolName: c.program.school.name,
        level: c.level,
        status: c.status,
        schedule: c.schedule,
        instructorName: c.instructorName,
        enrolledCount: c.studentProfiles.length,
        maxCapacity: c.maxCapacity,
        avgAttendance: avgCohortAttendance,
        upcomingClassesCount: c.classSessions.length,
        students: c.studentProfiles.map((st) => ({
          id: st.id,
          name: `${st.user.firstName} ${st.user.lastName}`,
          email: st.user.email,
          studentIdNumber: st.studentIdNumber,
          attendanceRate: st.attendanceRate,
          completionRate: st.completionRate,
        })),
      };
    });

    res.status(200).json({
      department: coordinator?.department || 'Academic Operations',
      staffCode: coordinator?.staffCode || 'COORD-001',
      totalCohorts: cohorts.length,
      totalStudents,
      cohorts: cohortSummaries,
    });
  } catch (error: any) {
    console.error('getCoordinatorOverview error:', error);
    res.status(500).json({ message: 'Failed to fetch coordinator overview' });
  }
};
