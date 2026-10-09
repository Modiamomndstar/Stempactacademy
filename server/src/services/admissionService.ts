import { AdmissionStatus, ApplicationStatus, Role, InvoiceStatus, EnrollmentStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { identifierService } from './identifierService.js';
import { paymentService } from './paymentService.js';
import { financialClearanceService } from './financialClearanceService.js';
import { automationEventService } from './automationEventService.js';
import { eventOutboxService } from './eventOutboxService.js';

export interface IssueAdmissionParams {
  applicationId: string;
  cohortId?: string;
  assignedClass?: string;
  orientationDate?: Date | string;
  acceptanceDeadlineDays?: number;
  conditions?: string;
  notes?: string;
  staffUser: { id: string; role: Role; name?: string };
}

export class AdmissionService {
  /**
   * Issues an official provisional admission offer to an academically approved applicant.
   * STRICT BOUNDARY:
   * - Does NOT create a StudentProfile.
   * - Does NOT promote user role to STUDENT.
   * - Does NOT increment cohort capacity.
   * - Applicant remains Role.APPLICANT.
   */
  async issueAdmissionOffer(params: IssueAdmissionParams) {
    const {
      applicationId,
      cohortId,
      assignedClass,
      orientationDate,
      acceptanceDeadlineDays = 7,
      conditions,
      notes,
      staffUser,
    } = params;

    const authorizedRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.ADMISSIONS_ADMIN,
    ];

    if (!authorizedRoles.includes(staffUser.role)) {
      throw new Error('Access denied: Unauthorized role to issue admission offers.');
    }

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
      throw new Error('Application not found');
    }

    if (!application.placement || application.placement.status !== 'APPROVED') {
      throw new Error('Application must have an approved placement before admission can be issued.');
    }

    // Determine target cohort
    const selectedCohortId = cohortId || application.placement.approvedCohortId || application.cohortId;
    const cohort = selectedCohortId
      ? await prisma.cohort.findUnique({ where: { id: selectedCohortId } })
      : await prisma.cohort.findFirst({
          where: { programId: application.programId, status: { in: ['OPEN', 'ALMOST_FULL'] } },
        });

    if (!cohort) {
      throw new Error('A valid active cohort must be assigned for admission.');
    }

    const year = new Date().getFullYear();
    const admissionNumber = await identifierService.generateAdmissionNumber({ year });

    const approvedProgramName = application.placement.approvedProgram || application.program.name;
    const approvedLevel = application.placement.approvedLevel || cohort.level || 'Level 1 (Foundation)';

    // Canonical version resolution
    const programId = application.placement.programId || application.programId;
    const programVersionId = application.placement.programVersionId || cohort.programVersionId;
    const curriculumVersionId = application.placement.curriculumVersionId || cohort.curriculumVersionId;
    const academicSessionId = cohort.academicSessionId;
    const assessmentAttemptId = application.placement.assessmentAttemptId;

    const deadline = new Date(Date.now() + 86400000 * acceptanceDeadlineDays);
    const orientation = orientationDate
      ? new Date(orientationDate)
      : new Date(cohort.startDate.getTime() - 86400000 * 3);

    // 1. Create or update Admission record in OFFERED state
    // Note: studentIdNumber is null (assigned upon enrollment!)
    const admission = await prisma.admission.upsert({
      where: { applicationId: application.id },
      create: {
        admissionNumber,
        studentIdNumber: null,
        applicationId: application.id,
        cohortId: cohort.id,
        programName: approvedProgramName,
        level: approvedLevel,
        schedule: cohort.schedule,
        assignedClass: assignedClass || 'Turing Computing Lab 1',
        instructorName: cohort.instructorName,
        letterPdfPath: `/letters/STEMPACT_Admission_${admissionNumber}.pdf`,
        orientationDate: orientation,
        acceptanceDeadline: deadline,
        whatsappGroupUrl: 'https://chat.whatsapp.com/C1ntPtG3qkh1Aguvh5zxN9',
        handbookUrl: '/resources/STEMPACT_Student_Handbook_2025.pdf',
        status: AdmissionStatus.OFFERED,
        placementId: application.placement.id,
        assessmentAttemptId,
        programId,
        programVersionId,
        curriculumVersionId,
        academicSessionId,
        issuedById: staffUser.id,
        conditions,
        notes,
      },
      update: {
        cohortId: cohort.id,
        programName: approvedProgramName,
        level: approvedLevel,
        schedule: cohort.schedule,
        assignedClass: assignedClass || 'Turing Computing Lab 1',
        orientationDate: orientation,
        acceptanceDeadline: deadline,
        status: AdmissionStatus.OFFERED,
        placementId: application.placement.id,
        assessmentAttemptId,
        programId,
        programVersionId,
        curriculumVersionId,
        academicSessionId,
        issuedById: staffUser.id,
        conditions,
        notes,
      },
    });

    // 2. Generate Enrollment Tuition Invoice linked to application, admission, and cohort
    const invoice = await paymentService.createInvoiceForCohort({
      applicationId: application.id,
      cohortId: cohort.id,
      title: `Tuition & Enrollment Fee - ${approvedProgramName} (${cohort.cohortCode})`,
      trainingFee: cohort.trainingFee,
      registrationFee: cohort.registrationFee,
      certificationFee: cohort.certificationFee,
      discountPercentage: cohort.discountPercentage,
    });

    // Link invoice directly to admission
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { admissionId: admission.id },
    });

    // 3. Initialize Financial Clearance record in PENDING state
    await financialClearanceService.evaluateFinancialClearance({
      admissionId: admission.id,
      applicationId: application.id,
    });

    // 4. Update application status to ADMITTED
    await prisma.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.ADMITTED },
    });

    // 5. Emit automation event & record in outbox
    automationEventService.emitLifecycleEvent('ADMISSION_OFFER_ISSUED', admission.id, {
      admissionNumber: admission.admissionNumber,
      applicationId: application.id,
      cohortCode: cohort.cohortCode,
      programName: approvedProgramName,
      issuedBy: staffUser.id,
    });

    await eventOutboxService.recordOutboxEvent(prisma, {
      eventType: 'ADMISSION_OFFER_ISSUED',
      aggregateType: 'Admission',
      aggregateId: admission.id,
      payload: {
        admissionNumber: admission.admissionNumber,
        applicationId: application.id,
        cohortCode: cohort.cohortCode,
        programName: approvedProgramName,
        issuedBy: staffUser.id,
      },
    });

    return {
      admission,
      invoice,
      admissionNumber: admission.admissionNumber,
      cohortCode: cohort.cohortCode,
      status: admission.status,
    };
  }

  /**
   * Applicant accepts their active admission offer.
   */
  async acceptAdmissionOffer(params: {
    admissionId: string;
    authUser: { id: string; role: Role; email: string };
  }) {
    const { admissionId, authUser } = params;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        application: { include: { user: true } },
        cohort: true,
      },
    });

    if (!admission) {
      throw new Error('Admission offer not found.');
    }

    // Authorization: Owner applicant or authorized staff
    const staffRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN];
    const isStaff = staffRoles.includes(authUser.role);
    const isOwner =
      (admission.application?.userId && admission.application.userId === authUser.id) ||
      (admission.application?.email && admission.application.email.toLowerCase() === authUser.email.toLowerCase());

    if (!isStaff && !isOwner) {
      throw new Error('Access denied: You cannot accept an admission offer that does not belong to you.');
    }

    // Idempotency: If already accepted or financially cleared or enrolled, return success
    if (
      admission.status === AdmissionStatus.ACCEPTED ||
      admission.status === AdmissionStatus.FINANCIALLY_CLEARED ||
      admission.status === AdmissionStatus.ENROLLED
    ) {
      return admission;
    }

    if (
      admission.status === AdmissionStatus.DECLINED ||
      admission.status === AdmissionStatus.WITHDRAWN ||
      admission.status === AdmissionStatus.EXPIRED
    ) {
      throw new Error(`Cannot accept admission offer with status ${admission.status}.`);
    }

    // Check expiration
    if (admission.acceptanceDeadline && new Date() > admission.acceptanceDeadline) {
      await prisma.admission.update({
        where: { id: admission.id },
        data: { status: AdmissionStatus.EXPIRED },
      });
      throw new Error('This admission offer has expired.');
    }

    const updated = await prisma.admission.update({
      where: { id: admission.id },
      data: {
        status: AdmissionStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Re-evaluate financial clearance in case payment was made prior to acceptance
    await financialClearanceService.evaluateFinancialClearance({ admissionId: admission.id });

    automationEventService.emitLifecycleEvent('ADMISSION_OFFER_ACCEPTED', admission.id, {
      admissionNumber: admission.admissionNumber,
      acceptedBy: authUser.id,
      acceptedAt: new Date(),
    });

    await eventOutboxService.recordOutboxEvent(prisma, {
      eventType: 'ADMISSION_OFFER_ACCEPTED',
      aggregateType: 'Admission',
      aggregateId: admission.id,
      payload: {
        admissionNumber: admission.admissionNumber,
        acceptedBy: authUser.id,
        acceptedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Applicant declines an admission offer.
   */
  async declineAdmissionOffer(params: {
    admissionId: string;
    authUser: { id: string; role: Role; email: string };
    reason?: string;
  }) {
    const { admissionId, authUser, reason } = params;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { application: true },
    });

    if (!admission) {
      throw new Error('Admission offer not found.');
    }

    const staffRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN];
    const isStaff = staffRoles.includes(authUser.role);
    const isOwner =
      (admission.application?.userId && admission.application.userId === authUser.id) ||
      (admission.application?.email && admission.application.email.toLowerCase() === authUser.email.toLowerCase());

    if (!isStaff && !isOwner) {
      throw new Error('Access denied: You cannot decline this admission offer.');
    }

    if (admission.status === AdmissionStatus.ENROLLED) {
      throw new Error('Cannot decline an already enrolled admission. Use official withdrawal instead.');
    }

    const updated = await prisma.admission.update({
      where: { id: admission.id },
      data: {
        status: AdmissionStatus.DECLINED,
        declinedAt: new Date(),
        declinedReason: reason || 'Declined by applicant',
      },
    });

    automationEventService.emitLifecycleEvent('ADMISSION_OFFER_DECLINED', admission.id, {
      admissionNumber: admission.admissionNumber,
      reason,
    });

    return updated;
  }

  /**
   * Staff withdraws or revokes an admission offer.
   */
  async withdrawAdmissionOffer(params: {
    admissionId: string;
    staffUser: { id: string; role: Role };
    reason: string;
  }) {
    const { admissionId, staffUser, reason } = params;

    const authorizedRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN];
    if (!authorizedRoles.includes(staffUser.role)) {
      throw new Error('Access denied: Only Admissions or Academic Administration can withdraw admission offers.');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new Error('Admission offer not found.');
    }

    const updated = await prisma.admission.update({
      where: { id: admission.id },
      data: {
        status: AdmissionStatus.WITHDRAWN,
        withdrawnAt: new Date(),
        withdrawnById: staffUser.id,
        withdrawnReason: reason,
      },
    });

    automationEventService.emitLifecycleEvent('ADMISSION_OFFER_WITHDRAWN', admission.id, {
      admissionNumber: admission.admissionNumber,
      withdrawnBy: staffUser.id,
      reason,
    });

    return updated;
  }

  /**
   * Fetch admission offer by ID or admissionNumber with strict ownership/staff authorization.
   */
  async getAdmission(identifier: string, authUser: { id: string; role: Role; email: string }) {
    const admission = await prisma.admission.findFirst({
      where: {
        OR: [{ id: identifier }, { admissionNumber: identifier }, { studentIdNumber: identifier }],
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
        financialClearances: { orderBy: { createdAt: 'desc' }, take: 1 },
        enrollments: true,
      },
    });

    if (!admission) {
      throw new Error('Admission record not found');
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

    const isStaff = staffRoles.includes(authUser.role);
    const isOwner =
      (admission.application?.userId && admission.application.userId === authUser.id) ||
      (admission.application?.email && admission.application.email.toLowerCase() === authUser.email.toLowerCase());

    let isParent = false;
    if (authUser.role === Role.PARENT) {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: authUser.id },
        include: {
          guardianRelations: { include: { student: true } },
          students: true,
        },
      });
      if (parentProfile) {
        isParent =
          parentProfile.guardianRelations.some((r) => r.student.userId === admission.application?.userId) ||
          parentProfile.students.some((s) => s.userId === admission.application?.userId);
      }
    }

    if (!isStaff && !isOwner && !isParent) {
      throw new Error('Access denied: You are not authorized to view this admission record.');
    }

    return admission;
  }

  /**
   * Transfer an applicant/admission to a new program, cohort, and academic level.
   * Reconciles academic placement, admission details, and tuition invoice balances.
   */
  async transferProgramAndCohort(params: {
    admissionId: string;
    newProgramId: string;
    newCohortId: string;
    newLevel?: string;
    notes?: string;
    staffUser: { id: string; role: Role; firstName?: string; lastName?: string };
  }) {
    const { admissionId, newProgramId, newCohortId, newLevel, notes, staffUser } = params;

    const authorizedRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN];
    if (!authorizedRoles.includes(staffUser.role)) {
      throw new Error('Forbidden: Only Academic or Admissions Administration can transfer programs.');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        application: { include: { placement: true } },
        cohort: true,
      },
    });

    if (!admission) {
      throw new Error('Admission record not found.');
    }

    const [newProgram, newCohort] = await Promise.all([
      prisma.program.findUnique({ where: { id: newProgramId }, include: { school: true } }),
      prisma.cohort.findUnique({ where: { id: newCohortId } }),
    ]);

    if (!newProgram) {
      throw new Error('Target program not found.');
    }
    if (!newCohort) {
      throw new Error('Target cohort not found.');
    }

    const assignedLevel = newLevel || newCohort.level || admission.level || 'Level 1 (Foundation)';

    // Update Admission, Application, Placement transactionally
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Application
      await tx.application.update({
        where: { id: admission.applicationId },
        data: {
          programId: newProgram.id,
          cohortId: newCohort.id,
        },
      });

      // 2. Update Placement if exists
      if (admission.placementId) {
        await tx.placement.update({
          where: { id: admission.placementId },
          data: {
            programId: newProgram.id,
            recommendedProgram: newProgram.name,
            approvedProgram: newProgram.name,
            approvedLevel: assignedLevel,
            approvedCohortId: newCohort.id,
            adminNotes: notes ? `Program Transfer: ${notes}` : 'Transferred by Admissions Administration',
          },
        });
      }

      // 3. Update Admission
      const updatedAdmission = await tx.admission.update({
        where: { id: admission.id },
        data: {
          programId: newProgram.id,
          programName: newProgram.name,
          level: assignedLevel,
          cohortId: newCohort.id,
          schedule: newCohort.schedule,
          notes: notes ? `${admission.notes || ''} [Transfer Note: ${notes}]` : admission.notes,
        },
        include: {
          cohort: { include: { program: true } },
          application: { include: { user: true } },
        },
      });

      // 4. Reconcile primary tuition invoice
      const primaryInvoice = await tx.invoice.findFirst({
        where: {
          OR: [
            { admissionId: admission.id },
            { applicationId: admission.applicationId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (primaryInvoice) {
        const discount = (newCohort.trainingFee * newCohort.discountPercentage) / 100;
        const newTotalFee = newCohort.trainingFee - discount + newCohort.registrationFee + newCohort.certificationFee;
        const currentPaid = primaryInvoice.amountPaid || 0;
        const newBalance = Math.max(0, newTotalFee - currentPaid);
        const newStatus =
          newBalance === 0
            ? InvoiceStatus.PAID
            : currentPaid > 0
            ? InvoiceStatus.PARTIALLY_PAID
            : InvoiceStatus.UNPAID;

        await tx.invoice.update({
          where: { id: primaryInvoice.id },
          data: {
            cohortId: newCohort.id,
            title: `Tuition & Enrollment Fee - ${newProgram.name} (${newCohort.cohortCode})`,
            baseAmount: newCohort.trainingFee,
            totalAmount: newTotalFee,
            balance: newBalance,
            status: newStatus,
          },
        });
      }

      // 5. If candidate is already matriculated/enrolled as a student, synchronize StudentProfile and StudentCohortEnrollment
      if (admission.application?.userId) {
        const studentProfile = await tx.studentProfile.findFirst({
          where: { userId: admission.application.userId },
        });

        if (studentProfile) {
          await tx.studentProfile.update({
            where: { id: studentProfile.id },
            data: {
              currentCohortId: newCohort.id,
              currentLevel: assignedLevel,
            },
          });

          // Mark prior enrollments as WITHDRAWN due to transfer
          await tx.studentCohortEnrollment.updateMany({
            where: {
              studentId: studentProfile.id,
              status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.ACTIVE] },
              cohortId: { not: newCohort.id },
            },
            data: {
              status: EnrollmentStatus.WITHDRAWN,
              withdrawalReason: `Transferred to cohort ${newCohort.name} (${newCohort.cohortCode}) by administration`,
            },
          });

          // Establish or activate target cohort enrollment
          await tx.studentCohortEnrollment.upsert({
            where: {
              studentId_cohortId: {
                studentId: studentProfile.id,
                cohortId: newCohort.id,
              },
            },
            create: {
              studentId: studentProfile.id,
              cohortId: newCohort.id,
              admissionId: admission.id,
              applicationId: admission.applicationId,
              programId: newProgram.id,
              programVersionId: newCohort.programVersionId,
              curriculumVersionId: newCohort.curriculumVersionId,
              academicSessionId: newCohort.academicSessionId,
              status: EnrollmentStatus.ACTIVE,
              enrolledById: staffUser.id,
            },
            update: {
              programId: newProgram.id,
              programVersionId: newCohort.programVersionId,
              curriculumVersionId: newCohort.curriculumVersionId,
              academicSessionId: newCohort.academicSessionId,
              status: EnrollmentStatus.ACTIVE,
            },
          });
        }
      }

      return updatedAdmission;
    });

    // Re-evaluate financial clearance
    await financialClearanceService.evaluateFinancialClearance({ admissionId: admission.id });

    return updated;
  }
}

export const admissionService = new AdmissionService();
