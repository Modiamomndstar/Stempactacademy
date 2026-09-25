import { Request, Response } from 'express';
import { CohortStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { identifierService } from '../services/identifierService.js';

export const getCohorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, programId, openOnly, academicYear, academicSessionId } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as CohortStatus;
    } else if (openOnly === 'true') {
      where.status = { in: [CohortStatus.OPEN, CohortStatus.ALMOST_FULL, CohortStatus.UPCOMING] };
    }

    if (programId) {
      where.programId = String(programId);
    }
    
    if (academicSessionId) {
      where.academicSessionId = String(academicSessionId);
    } else if (academicYear) {
      where.academicSession = { name: String(academicYear) };
    }

    const cohorts = await prisma.cohort.findMany({
      where,
      include: {
        program: {
          include: { school: true },
        },
        academicSession: true,
        programVersion: true,
        curriculumVersion: true,
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

export const getCohortAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cohort = await prisma.cohort.findFirst({
      where: { OR: [{ id }, { cohortCode: id }] },
      include: {
        program: true,
        studentProfiles: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true }
            },
            invoices: true,
            attendances: true
          }
        },
      }
    });

    if (!cohort) {
      res.status(404).json({ message: 'Cohort not found' });
      return;
    }

    const students = cohort.studentProfiles.map(sp => {
      const totalInvoiced = sp.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = sp.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      return {
        id: sp.id,
        name: `${sp.user.firstName} ${sp.user.lastName}`,
        email: sp.user.email,
        phone: sp.user.phone,
        enrollmentDate: sp.enrollmentDate,
        status: sp.status,
        attendanceRate: sp.attendanceRate,
        financials: {
          totalInvoiced,
          totalPaid,
          balance: totalInvoiced - totalPaid,
          status: totalPaid >= totalInvoiced ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'UNPAID')
        }
      };
    });

    const totalRevenue = students.reduce((sum, s) => sum + s.financials.totalPaid, 0);
    const totalOutstanding = students.reduce((sum, s) => sum + s.financials.balance, 0);

    res.status(200).json({
      cohortInfo: {
        id: cohort.id,
        name: cohort.name,
        code: cohort.cohortCode,
        capacity: cohort.maxCapacity,
        enrolled: cohort.currentEnrollment,
        status: cohort.status,
      },
      analytics: {
        totalRevenue,
        totalOutstanding,
        fillRate: (cohort.currentEnrollment / cohort.maxCapacity) * 100,
        activeStudents: students.filter(s => s.status === 'ACTIVE').length
      },
      students
    });
  } catch (error: any) {
    console.error('getCohortAnalysis error:', error);
    res.status(500).json({ message: 'Failed to fetch cohort analysis' });
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
    const {
      name,
      status,
      maxCapacity,
      currentEnrollment,
      trainingFee,
      registrationFee,
      certificationFee,
      discountPercentage,
      schedule,
      mode,
      location,
      startDate,
      endDate,
      applicationDeadline,
      level,
      instructorName,
    } = req.body;

    const cohort = await prisma.cohort.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status: status as CohortStatus }),
        ...(maxCapacity !== undefined && { maxCapacity: Number(maxCapacity) }),
        ...(currentEnrollment !== undefined && { currentEnrollment: Number(currentEnrollment) }),
        ...(trainingFee !== undefined && { trainingFee: Number(trainingFee) }),
        ...(registrationFee !== undefined && { registrationFee: Number(registrationFee) }),
        ...(certificationFee !== undefined && { certificationFee: Number(certificationFee) }),
        ...(discountPercentage !== undefined && { discountPercentage: Number(discountPercentage) }),
        ...(schedule && { schedule }),
        ...(mode && { mode }),
        ...(location && { location }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(applicationDeadline && { applicationDeadline: new Date(applicationDeadline) }),
        ...(level && { level }),
        ...(instructorName && { instructorName }),
      },
    });

    res.status(200).json({ message: 'Cohort pricing and configuration updated successfully', cohort });
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
      programVersionId,
      curriculumVersionId,
      academicSessionId,
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

    const cohortCode = await identifierService.generateCohortCode({ year: new Date().getFullYear() });

    // 1. Resolve default active academic session if not explicitly provided
    let resolvedSessionId = academicSessionId;
    if (!resolvedSessionId) {
      const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      if (activeSession) resolvedSessionId = activeSession.id;
    }

    // 2. Resolve default canonical programVersion and curriculumVersion if not explicitly provided
    let resolvedProgramVersionId = programVersionId;
    let resolvedCurriculumVersionId = curriculumVersionId;
    if (!resolvedProgramVersionId && programId) {
      const activeVersion = await prisma.programVersion.findFirst({
        where: { programId, isCurrent: true },
      });
      if (activeVersion) {
        resolvedProgramVersionId = activeVersion.id;
        if (!resolvedCurriculumVersionId) {
          resolvedCurriculumVersionId = activeVersion.curriculumVersionId;
        }
      }
    }

    const cohort = await prisma.cohort.create({
      data: {
        cohortCode,
        name,
        programId,
        programVersionId: resolvedProgramVersionId || null,
        curriculumVersionId: resolvedCurriculumVersionId || null,
        academicSessionId: resolvedSessionId || null,
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
      include: {
        program: { include: { school: true } },
        academicSession: true,
        programVersion: true,
        curriculumVersion: true,
      },
    });

    res.status(201).json({ message: 'Cohort created successfully', cohort });
  } catch (error: any) {
    console.error('createCohort error:', error);
    res.status(500).json({ message: 'Failed to create cohort' });
  }
};
