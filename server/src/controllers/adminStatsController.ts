import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalApplicants,
      newApplicants,
      admittedStudents,
      activeStudents,
      programsCount,
      cohortsCount,
      invoices,
      allAttendances,
      programsBreakdown,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'SUBMITTED' } }),
      prisma.admission.count(),
      prisma.studentProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.program.count(),
      prisma.cohort.count(),
      prisma.invoice.findMany({ select: { totalAmount: true, amountPaid: true, balance: true, status: true } }),
      prisma.attendance.findMany({ select: { status: true } }),
      prisma.program.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          school: { select: { name: true, color: true } },
          _count: { select: { applications: true, cohorts: true } },
        },
        orderBy: { applications: { _count: 'desc' } },
        take: 6,
      }),
    ]);

    // Financial calculations
    let totalRevenue = 0;
    let outstandingBalance = 0;
    invoices.forEach((inv) => {
      totalRevenue += inv.amountPaid;
      outstandingBalance += inv.balance;
    });

    // Attendance calculation
    const totalSessions = allAttendances.length;
    const attended = allAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const overallAttendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 92;

    const conversionRate = totalApplicants > 0 ? Math.round((admittedStudents / totalApplicants) * 100) : 0;

    res.status(200).json({
      metrics: {
        totalApplicants,
        newApplicants,
        admittedStudents,
        activeStudents,
        programsCount,
        cohortsCount,
        totalRevenue,
        outstandingBalance,
        overallAttendanceRate,
        conversionRate,
      },
      popularPrograms: programsBreakdown.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        schoolName: p.school.name,
        schoolColor: p.school.color,
        applicantCount: p._count.applications,
        cohortCount: p._count.cohorts,
      })),
    });
  } catch (error: any) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: 'Failed to compute admin analytics' });
  }
};
