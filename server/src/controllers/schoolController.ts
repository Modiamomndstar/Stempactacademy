import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { programs: true },
        },
      },
    });
    res.status(200).json({ schools });
  } catch (error: any) {
    console.error('getSchools error:', error);
    res.status(500).json({ message: 'Failed to fetch schools' });
  }
};

export const getSchoolByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const school = await prisma.school.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        programs: {
          include: {
            cohorts: {
              where: { status: { in: ['OPEN', 'ALMOST_FULL'] } },
            },
          },
        },
      },
    });

    if (!school) {
      res.status(404).json({ message: 'School not found' });
      return;
    }

    res.status(200).json({ school });
  } catch (error: any) {
    console.error('getSchoolByCode error:', error);
    res.status(500).json({ message: 'Failed to fetch school details' });
  }
};
