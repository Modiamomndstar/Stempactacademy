import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getAcademicSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            cohorts: true,
            enrollments: true,
            admissions: true,
          },
        },
        cohorts: {
          select: {
            id: true,
            cohortCode: true,
            name: true,
            status: true,
            currentEnrollment: true,
            maxCapacity: true,
            program: {
              select: {
                id: true,
                code: true,
                name: true,
                school: {
                  select: { id: true, code: true, name: true, color: true },
                },
              },
            },
          },
        },
      },
    });

    const sessionsWithMetrics = sessions.map((s) => {
      const totalEnrolled = s.cohorts.reduce((acc, c) => acc + (c.currentEnrollment || 0), 0);
      const totalCapacity = s.cohorts.reduce((acc, c) => acc + (c.maxCapacity || 0), 0);
      const openCohorts = s.cohorts.filter((c) => c.status === 'OPEN' || c.status === 'ALMOST_FULL').length;

      return {
        ...s,
        metrics: {
          totalCohorts: s.cohorts.length,
          openCohorts,
          totalEnrolled,
          totalCapacity,
          utilizationRate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
        },
      };
    });

    res.status(200).json({ sessions: sessionsWithMetrics });
  } catch (error: any) {
    console.error('getAcademicSessions error:', error);
    res.status(500).json({ message: 'Failed to fetch academic sessions' });
  }
};

export const createAcademicSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, startDate, endDate, isCurrent } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({ message: 'Session name, start date, and end date are required.' });
      return;
    }

    const sessionCode = code
      ? code.trim().toUpperCase()
      : `SESS-${new Date(startDate).getFullYear()}-${new Date(endDate).getFullYear()}`;

    // If setting as current active session, mark all others as false
    if (isCurrent) {
      await prisma.academicSession.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const session = await prisma.academicSession.create({
      data: {
        code: sessionCode,
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
      },
      include: {
        _count: {
          select: { cohorts: true, enrollments: true },
        },
      },
    });

    res.status(201).json({ message: 'Academic session created successfully', session });
  } catch (error: any) {
    console.error('createAcademicSession error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'An academic session with this code already exists.' });
      return;
    }
    res.status(500).json({ message: 'Failed to create academic session' });
  }
};

export const updateAcademicSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, startDate, endDate, isCurrent } = req.body;

    // If marking as current, toggle off previous current
    if (isCurrent === true) {
      await prisma.academicSession.updateMany({
        where: { id: { not: id }, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const session = await prisma.academicSession.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isCurrent !== undefined && { isCurrent: Boolean(isCurrent) }),
      },
      include: {
        _count: {
          select: { cohorts: true, enrollments: true },
        },
      },
    });

    res.status(200).json({ message: 'Academic session updated successfully', session });
  } catch (error: any) {
    console.error('updateAcademicSession error:', error);
    res.status(500).json({ message: 'Failed to update academic session' });
  }
};
