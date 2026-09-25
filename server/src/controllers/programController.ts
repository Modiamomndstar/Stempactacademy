import { Request, Response } from 'express';
import { ProgramStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolCode, schoolId, status, search, featured, minPrice, maxPrice } = req.query;

    const where: any = {};

    if (schoolCode) {
      where.school = { code: String(schoolCode).toUpperCase() };
    } else if (schoolId) {
      where.schoolId = String(schoolId);
    }

    if (status) {
      where.status = status as ProgramStatus;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tools: { contains: q, mode: 'insensitive' } },
        { competencies: { contains: q, mode: 'insensitive' } },
      ];
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.cohorts = {
        some: {
          trainingFee: {
            ...(minPrice !== undefined && { gte: Number(minPrice) }),
            ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
          }
        }
      };
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        school: true,
        cohorts: {
          where: { status: { in: ['OPEN', 'ALMOST_FULL'] } },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ programs, count: programs.length });
  } catch (error: any) {
    console.error('getPrograms error:', error);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
};

export const getProgramByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const program = await prisma.program.findFirst({
      where: {
        OR: [{ code: code.toUpperCase() }, { id: code }],
      },
      include: {
        school: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            curriculumVersion: {
              include: {
                curriculum: true,
                courses: {
                  include: {
                    modules: {
                      include: { lessons: true, practicalActivities: true },
                      orderBy: { order: 'asc' },
                    },
                  },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        curricula: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
        // Legacy compatibility courses (direct Program.courses)
        courses: {
          include: {
            modules: {
              include: { lessons: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        cohorts: {
          include: {
            academicSession: true,
            programVersion: true,
            curriculumVersion: true,
          },
          orderBy: { startDate: 'asc' },
        },
        competencyList: true,
      },
    });

    if (!program) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }

    res.status(200).json({ program });
  } catch (error: any) {
    console.error('getProgramByCode error:', error);
    res.status(500).json({ message: 'Failed to fetch program details' });
  }
};

export const updateProgramStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(status && { status: status as ProgramStatus }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    res.status(200).json({ message: 'Program status updated successfully', program });
  } catch (error: any) {
    console.error('updateProgramStatus error:', error);
    res.status(500).json({ message: 'Failed to update program status' });
  }
};
