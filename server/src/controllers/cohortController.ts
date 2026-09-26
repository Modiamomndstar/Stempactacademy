import { Request, Response } from 'express';
import { CohortStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { identifierService } from '../services/identifierService.js';

export const getCohorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, programId, openOnly, academicYear, academicSessionId, currentSessionOnly } = req.query;

    const where: any = {};

    if (currentSessionOnly === 'true') {
      const currentSession = await prisma.academicSession.findFirst({
        where: { isCurrent: true },
      });
      if (currentSession) {
        where.academicSessionId = currentSession.id;
      }
    }

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
      status,
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
        status: status ? (status as CohortStatus) : CohortStatus.OPEN,
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

export const deleteCohort = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const cohort = await prisma.cohort.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            studentProfiles: true,
            applications: true,
          },
        },
      },
    });

    if (!cohort) {
      res.status(404).json({ message: 'Cohort not found' });
      return;
    }

    if (cohort._count.studentProfiles > 0 && force !== 'true') {
      res.status(400).json({
        message: `Cannot delete cohort "${cohort.name}" because it has ${cohort._count.studentProfiles} enrolled learners. Transfer students first or use force=true.`,
      });
      return;
    }

    // Safely detach/delete dependent relations in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.updateMany({
        where: { currentCohortId: id },
        data: { currentCohortId: null },
      });
      await tx.application.updateMany({
        where: { cohortId: id },
        data: { cohortId: null },
      });
      await tx.admission.deleteMany({
        where: { cohortId: id },
      });
      await tx.placement.updateMany({
        where: { recommendedCohortId: id },
        data: { recommendedCohortId: null },
      });
      await tx.placement.updateMany({
        where: { approvedCohortId: id },
        data: { approvedCohortId: null },
      });
      await tx.assessmentAttempt.updateMany({
        where: { recommendedCohortId: id },
        data: { recommendedCohortId: null },
      });
      await tx.placementDecision.updateMany({
        where: { approvedCohortId: id },
        data: { approvedCohortId: null },
      });
      await tx.invoice.updateMany({
        where: { cohortId: id },
        data: { cohortId: null },
      });
      await tx.studentCohortEnrollment.deleteMany({
        where: { cohortId: id },
      });
      await tx.assignment.deleteMany({
        where: { cohortId: id },
      });
      await tx.project.deleteMany({
        where: { cohortId: id },
      });
      await tx.classSession.deleteMany({
        where: { cohortId: id },
      });
      await tx.syllabus.deleteMany({
        where: { cohortId: id },
      });

      await tx.cohort.delete({
        where: { id },
      });
    });

    res.status(200).json({ message: `Cohort "${cohort.name}" deleted successfully.` });
  } catch (error: any) {
    console.error('deleteCohort error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete cohort' });
  }
};

export const purgeLegacyCohorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { preserveSessionId } = req.body;

    const where: any = {};
    if (preserveSessionId) {
      where.academicSessionId = { not: preserveSessionId };
    } else {
      // Find cohorts not in any current session or matching legacy seeded patterns
      where.OR = [
        { academicSessionId: null },
        { cohortCode: { startsWith: 'STP-2025' } },
        { name: { contains: 'Alpha 2026' } },
        { name: { contains: 'Cohort 1 (Alpha 2026)' } },
      ];
    }

    const legacyCohorts = await prisma.cohort.findMany({
      where,
      select: { id: true, name: true, cohortCode: true },
    });

    if (legacyCohorts.length === 0) {
      res.status(200).json({ message: 'No legacy seeded cohorts found to purge.', count: 0 });
      return;
    }

    const ids = legacyCohorts.map((c) => c.id);

    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.updateMany({
        where: { currentCohortId: { in: ids } },
        data: { currentCohortId: null },
      });
      await tx.application.updateMany({
        where: { cohortId: { in: ids } },
        data: { cohortId: null },
      });
      await tx.admission.deleteMany({
        where: { cohortId: { in: ids } },
      });
      await tx.placement.updateMany({
        where: { recommendedCohortId: { in: ids } },
        data: { recommendedCohortId: null },
      });
      await tx.placement.updateMany({
        where: { approvedCohortId: { in: ids } },
        data: { approvedCohortId: null },
      });
      await tx.assessmentAttempt.updateMany({
        where: { recommendedCohortId: { in: ids } },
        data: { recommendedCohortId: null },
      });
      await tx.placementDecision.updateMany({
        where: { approvedCohortId: { in: ids } },
        data: { approvedCohortId: null },
      });
      await tx.invoice.updateMany({
        where: { cohortId: { in: ids } },
        data: { cohortId: null },
      });
      await tx.studentCohortEnrollment.deleteMany({
        where: { cohortId: { in: ids } },
      });
      await tx.assignment.deleteMany({
        where: { cohortId: { in: ids } },
      });
      await tx.project.deleteMany({
        where: { cohortId: { in: ids } },
      });
      await tx.classSession.deleteMany({
        where: { cohortId: { in: ids } },
      });
      await tx.syllabus.deleteMany({
        where: { cohortId: { in: ids } },
      });

      await tx.cohort.deleteMany({
        where: { id: { in: ids } },
      });
    });

    res.status(200).json({
      message: `Successfully purged ${legacyCohorts.length} legacy seeded cohorts.`,
      count: legacyCohorts.length,
      purged: legacyCohorts.map((c) => c.name),
    });
  } catch (error: any) {
    console.error('purgeLegacyCohorts error:', error);
    res.status(500).json({ message: error.message || 'Failed to purge legacy cohorts' });
  }
};

