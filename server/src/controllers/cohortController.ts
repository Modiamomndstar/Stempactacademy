import { Request, Response } from 'express';
import { CohortStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

export const getCohorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, programId, openOnly } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as CohortStatus;
    } else if (openOnly === 'true') {
      where.status = { in: [CohortStatus.OPEN, CohortStatus.ALMOST_FULL, CohortStatus.UPCOMING] };
    }

    if (programId) {
      where.programId = String(programId);
    }

    const cohorts = await prisma.cohort.findMany({
      where,
      include: {
        program: {
          include: { school: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const cohortsWithSeats = cohorts.map((c) => ({
      ...c,
      availableSeats: Math.max(0, c.maxCapacity - c.currentEnrollment),
      isRegistrationOpen: ([CohortStatus.OPEN, CohortStatus.ALMOST_FULL] as CohortStatus[]).includes(c.status),
    }));

    res.status(200).json({ cohorts: cohortsWithSeats });
  } catch (error: any) {
    console.error('getCohorts error:', error);
    res.status(500).json({ message: 'Failed to fetch cohorts' });
  }
};

export const getCohortById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cohort = await prisma.cohort.findFirst({
      where: {
        OR: [{ id }, { cohortCode: id }],
      },
      include: {
        program: {
          include: {
            school: true,
            courses: {
              include: { modules: true },
            },
          },
        },
      },
    });

    if (!cohort) {
      res.status(404).json({ message: 'Cohort not found' });
      return;
    }

    res.status(200).json({
      cohort: {
        ...cohort,
        availableSeats: Math.max(0, cohort.maxCapacity - cohort.currentEnrollment),
      },
    });
  } catch (error: any) {
    console.error('getCohortById error:', error);
    res.status(500).json({ message: 'Failed to fetch cohort' });
  }
};

export const updateCohort = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, maxCapacity, currentEnrollment, trainingFee, discountPercentage } = req.body;

    const cohort = await prisma.cohort.update({
      where: { id },
      data: {
        ...(status && { status: status as CohortStatus }),
        ...(maxCapacity !== undefined && { maxCapacity: Number(maxCapacity) }),
        ...(currentEnrollment !== undefined && { currentEnrollment: Number(currentEnrollment) }),
        ...(trainingFee !== undefined && { trainingFee: Number(trainingFee) }),
        ...(discountPercentage !== undefined && { discountPercentage: Number(discountPercentage) }),
      },
    });

    res.status(200).json({ message: 'Cohort updated successfully', cohort });
  } catch (error: any) {
    console.error('updateCohort error:', error);
    res.status(500).json({ message: 'Failed to update cohort' });
  }
};

export const createCohort = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      programId,
      level,
      startDate,
      endDate,
      applicationDeadline,
      schedule,
      mode,
      location,
      instructorName,
      maxCapacity,
      trainingFee,
      registrationFee,
      certificationFee,
      discountPercentage,
    } = req.body;

    const count = await prisma.cohort.count();
    const cohortCode = `STP-${new Date().getFullYear()}-C${count + 1}`;

    const cohort = await prisma.cohort.create({
      data: {
        cohortCode,
        name,
        programId,
        level: level || 'Level 1',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applicationDeadline: new Date(applicationDeadline),
        schedule,
        mode: mode || 'Hybrid (Onsite Ile-Ife & Virtual)',
        location: location || 'STEMPACT Innovation Hub, Ile-Ife',
        instructorName: instructorName || 'Academy Faculty',
        maxCapacity: Number(maxCapacity) || 25,
        trainingFee: Number(trainingFee) || 75000,
        registrationFee: Number(registrationFee) || 5000,
        certificationFee: Number(certificationFee) || 10000,
        discountPercentage: Number(discountPercentage) || 0,
        status: CohortStatus.OPEN,
      },
    });

    res.status(201).json({ message: 'Cohort created successfully', cohort });
  } catch (error: any) {
    console.error('createCohort error:', error);
    res.status(500).json({ message: 'Failed to create cohort' });
  }
};
