import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { paymentService } from '../services/paymentService.js';
import { emailService } from '../services/emailService.js';
import { AuthRequest } from '../middlewares/auth.js';

export const issueAdmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationId, cohortId, assignedClass, orientationDate } = req.body;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        placement: true,
        program: { include: { school: true } },
        cohort: true,
        user: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    if (application.status !== 'PLACED' && (!application.placement || application.placement.status === 'REJECTED')) {
      res.status(400).json({ message: 'Application must have an approved placement before admission can be issued.' });
      return;
    }

    // Determine target cohort
    const selectedCohortId = cohortId || application.cohortId;
    const cohort = selectedCohortId
      ? await prisma.cohort.findUnique({ where: { id: selectedCohortId } })
      : await prisma.cohort.findFirst({
          where: { programId: application.programId, status: { in: ['OPEN', 'ALMOST_FULL'] } },
        });

    if (!cohort) {
      res.status(400).json({ message: 'A valid active cohort must be assigned for admission.' });
      return;
    }

    const year = new Date().getFullYear();
    const admissionCount = await prisma.admission.count();
    const studentCount = await prisma.studentProfile.count();

    const admissionNumber = `ADM-${year}-${String(admissionCount + 1).padStart(3, '0')}`;
    const studentIdNumber = `STP-${year}-${String(studentCount + 101).padStart(4, '0')}`;

    const approvedProgramName = application.placement?.approvedProgram || application.program.name;
    const approvedLevel = application.placement?.approvedLevel || 'Level 1 (Foundation)';

    // 1. Create or Update Admission record
    const admission = await prisma.admission.upsert({
      where: { applicationId: application.id },
      create: {
        admissionNumber,
        studentIdNumber,
        applicationId: application.id,
        cohortId: cohort.id,
        programName: approvedProgramName,
        level: approvedLevel,
        schedule: cohort.schedule,
        assignedClass: assignedClass || 'Turing Computing Lab 1',
        instructorName: cohort.instructorName,
        letterPdfPath: `/letters/STEMPACT_Admission_${studentIdNumber}.pdf`,
        orientationDate: orientationDate ? new Date(orientationDate) : new Date(cohort.startDate.getTime() - 86400000 * 3),
        acceptanceDeadline: new Date(Date.now() + 86400000 * 7),
        whatsappGroupUrl: 'https://chat.whatsapp.com/C1ntPtG3qkh1Aguvh5zxN9',
        handbookUrl: '/resources/STEMPACT_Student_Handbook_2025.pdf',
        status: 'ISSUED',
      },
      update: {
        cohortId: cohort.id,
        programName: approvedProgramName,
        level: approvedLevel,
        schedule: cohort.schedule,
        assignedClass: assignedClass || 'Turing Computing Lab 1',
        status: 'ISSUED',
      },
    });

    // 2. Ensure User exists and activate/link StudentProfile
    let userId = application.userId;
    if (!userId) {
      const existingUser = await prisma.user.findUnique({ where: { email: application.email } });
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    if (userId) {
      await prisma.studentProfile.upsert({
        where: { userId },
        create: {
          userId,
          studentIdNumber,
          currentCohortId: cohort.id,
          currentLevel: approvedLevel,
          status: 'ACTIVE',
        },
        update: {
          studentIdNumber,
          currentCohortId: cohort.id,
          currentLevel: approvedLevel,
          status: 'ACTIVE',
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { role: Role.STUDENT },
      });
    }

    // 3. Create Enrollment Invoice
    const studentProfile = userId
      ? await prisma.studentProfile.findUnique({ where: { userId } })
      : null;

    const invoice = await paymentService.createInvoiceForCohort({
      studentId: studentProfile ? studentProfile.id : undefined,
      applicationId: application.id,
      cohortId: cohort.id,
      title: `Tuition & Enrollment Fee - ${approvedProgramName} (${cohort.cohortCode})`,
      trainingFee: cohort.trainingFee,
      registrationFee: cohort.registrationFee,
      certificationFee: cohort.certificationFee,
      discountPercentage: cohort.discountPercentage,
    });

    // Send official admission offer email with invoice breakdown via Resend
    if (application.email) {
      emailService.sendAdmissionOfferEmail({
        to: application.email,
        fullName: application.fullName,
        admissionNumber,
        studentIdNumber,
        programName: approvedProgramName,
        cohortName: cohort.name,
        startDate: new Date(cohort.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        schedule: cohort.schedule,
        trainingFee: cohort.trainingFee,
        registrationFee: cohort.registrationFee,
        certificationFee: cohort.certificationFee,
        totalAmount: invoice.totalAmount,
        invoiceNumber: invoice.invoiceNumber,
      }).catch(err => console.error('Failed to send admission email:', err));
    }

    // 4. Increment cohort enrollment count
    await prisma.cohort.update({
      where: { id: cohort.id },
      data: { currentEnrollment: { increment: 1 } },
    });

    // 5. Update application status
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'ADMITTED' },
    });

    res.status(201).json({
      message: 'Admission issued and student dashboard activated successfully!',
      admission,
      studentIdNumber,
      admissionNumber,
      cohortCode: cohort.cohortCode,
    });
  } catch (error: any) {
    console.error('issueAdmission error:', error);
    res.status(500).json({ message: 'Failed to issue admission' });
  }
};

export const getAdmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const admissions = await prisma.admission.findMany({
      include: {
        application: {
          include: { user: true },
        },
        cohort: {
          include: { program: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.status(200).json({ admissions, count: admissions.length });
  } catch (error: any) {
    console.error('getAdmissions error:', error);
    res.status(500).json({ message: 'Failed to fetch admissions' });
  }
};

export const getAdmissionByNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { number } = req.params;
    const admission = await prisma.admission.findFirst({
      where: {
        OR: [{ admissionNumber: number }, { studentIdNumber: number }, { id: number }],
      },
      include: {
        application: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        cohort: {
          include: { program: { include: { school: true } } },
        },
      },
    });

    if (!admission) {
      res.status(404).json({ message: 'Admission record not found' });
      return;
    }

    const staffRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.ADMISSIONS_ADMIN,
      Role.FINANCE_ADMIN,
      Role.COORDINATOR_ADMIN,
      Role.PROGRAM_COORDINATOR,
      Role.INSTRUCTOR,
    ];

    const isStaff = staffRoles.includes(req.user.role);
    const isOwner =
      (admission.application?.userId && admission.application.userId === req.user.id) ||
      (admission.application?.email && admission.application.email.toLowerCase() === req.user.email.toLowerCase());

    let isParent = false;
    if (req.user.role === Role.PARENT) {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: req.user.id },
        include: { students: { select: { studentIdNumber: true, userId: true } } },
      });
      if (parentProfile) {
        isParent = parentProfile.students.some(
          (s) => s.studentIdNumber === admission.studentIdNumber || s.userId === admission.application?.userId
        );
      }
    }

    if (!isStaff && !isOwner && !isParent) {
      res.status(403).json({ message: 'Access denied: You are not authorized to view this admission record.' });
      return;
    }

    res.status(200).json({ admission });
  } catch (error: any) {
    console.error('getAdmissionByNumber error:', error);
    res.status(500).json({ message: 'Failed to fetch admission record' });
  }
};
