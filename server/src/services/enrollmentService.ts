import {
  AdmissionStatus,
  ApplicationStatus,
  EnrollmentStatus,
  FinancialClearanceStatus,
  Role,
} from '@prisma/client';
import prisma from '../config/prisma.js';
import { identifierService } from './identifierService.js';
import { financialClearanceService } from './financialClearanceService.js';
import { automationEventService } from './automationEventService.js';
import { eventOutboxService } from './eventOutboxService.js';

export interface EnrollStudentParams {
  admissionId: string;
  authUser: { id: string; role: Role; email?: string; name?: string };
  notes?: string;
}

export class EnrollmentService {
  /**
   * Evaluates enrollment eligibility for an admission offer.
   */
  async checkEligibility(admissionId: string) {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        application: { include: { user: true } },
        cohort: true,
        placement: true,
      },
    });

    if (!admission) {
      return { eligible: false, reason: 'Admission record not found.' };
    }

    if (
      admission.status !== AdmissionStatus.ACCEPTED &&
      admission.status !== AdmissionStatus.FINANCIALLY_CLEARED &&
      admission.status !== AdmissionStatus.ENROLLED
    ) {
      return {
        eligible: false,
        reason: `Admission offer must be accepted before enrollment (current status: ${admission.status}).`,
      };
    }

    // Check financial clearance
    const clearance = await financialClearanceService.evaluateFinancialClearance({
      admissionId: admission.id,
    });

    if (!clearance.isCleared) {
      return {
        eligible: false,
        reason: `Applicant has not met financial clearance requirements. Balance required: ₦${clearance.balance.toLocaleString()}.`,
        clearance,
      };
    }

    // Check cohort capacity
    if (admission.cohort.currentEnrollment >= admission.cohort.maxCapacity) {
      return {
        eligible: false,
        reason: `Assigned cohort ${admission.cohort.cohortCode} is at maximum capacity (${admission.cohort.maxCapacity}).`,
      };
    }

    return {
      eligible: true,
      admission,
      clearance,
    };
  }

  /**
   * Finalizes student enrollment transactionally:
   * 1. Verifies offer acceptance & financial clearance.
   * 2. Atomically increments cohort capacity (rejects if full).
   * 3. Promotes user role to STUDENT and generates StudentProfile using collision-safe STP sequence.
   * 4. Establishes canonical StudentCohortEnrollment with academic version links.
   * 5. Advances admission & application status to ENROLLED.
   * 6. Idempotent on retry.
   */
  async enrollStudent(params: EnrollStudentParams) {
    const { admissionId, authUser, notes } = params;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        application: { include: { user: true } },
        cohort: true,
        placement: true,
      },
    });

    if (!admission) {
      throw new Error('Admission record not found.');
    }

    // Idempotency check: If already enrolled, return existing enrollment
    if (admission.status === AdmissionStatus.ENROLLED) {
      const existingEnrollment = await prisma.studentCohortEnrollment.findFirst({
        where: { admissionId: admission.id },
        include: { student: { include: { user: true } }, cohort: true },
      });
      if (existingEnrollment) {
        return {
          enrollment: existingEnrollment,
          studentProfile: existingEnrollment.student,
          admission,
          isAlreadyEnrolled: true,
        };
      }
    }

    // Eligibility validation
    if (
      admission.status !== AdmissionStatus.ACCEPTED &&
      admission.status !== AdmissionStatus.FINANCIALLY_CLEARED
    ) {
      throw new Error(
        `Admission offer must be accepted before enrollment (current status: ${admission.status}).`
      );
    }

    // Financial clearance verification
    const clearance = await financialClearanceService.evaluateFinancialClearance({
      admissionId: admission.id,
    });

    if (!clearance.isCleared) {
      throw new Error(
        `Applicant is not financially cleared for enrollment. Amount outstanding: ₦${clearance.balance.toLocaleString()}.`
      );
    }

    // Execute enrollment transactionally
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic cohort capacity decrement/check
      const affected = await tx.$executeRaw`
        UPDATE "Cohort"
        SET "currentEnrollment" = "currentEnrollment" + 1, "updatedAt" = NOW()
        WHERE "id" = ${admission.cohortId} AND "currentEnrollment" < "maxCapacity"
      `;

      if (affected === 0) {
        throw new Error(
          `Cohort capacity reached (${admission.cohort.maxCapacity} students). Enrollment cannot be completed.`
        );
      }

      // 2. Identify or create User account if not attached
      let userId = admission.application.userId;
      if (!userId) {
        const existingUser = await tx.user.findUnique({
          where: { email: admission.application.email },
        });
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      if (!userId) {
        throw new Error('Cannot enroll applicant without an authenticated user account.');
      }

      // 3. Promote identity: Ensure StudentProfile exists (Phase 3 collision-safe STP ID)
      let studentProfile = await tx.studentProfile.findUnique({
        where: { userId },
      });

      if (!studentProfile) {
        const year = new Date().getFullYear();
        const studentIdNumber = await identifierService.generateStudentIdNumber({ year });

        studentProfile = await tx.studentProfile.create({
          data: {
            userId,
            studentIdNumber,
            currentCohortId: admission.cohortId,
            currentLevel: admission.level,
            status: 'ACTIVE',
            enrollmentDate: new Date(),
          },
        });
      } else {
        studentProfile = await tx.studentProfile.update({
          where: { id: studentProfile.id },
          data: {
            currentCohortId: admission.cohortId,
            currentLevel: admission.level,
            status: 'ACTIVE',
          },
        });
      }

      // Promote User role to STUDENT if currently APPLICANT
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.STUDENT },
      });

      // 4. Update Admission with studentIdNumber & status = ENROLLED
      const updatedAdmission = await tx.admission.update({
        where: { id: admission.id },
        data: {
          studentIdNumber: studentProfile.studentIdNumber,
          status: AdmissionStatus.ENROLLED,
        },
      });

      // 5. Update Application status = ENROLLED
      await tx.application.update({
        where: { id: admission.applicationId },
        data: { status: ApplicationStatus.ENROLLED },
      });

      // 6. Canonical StudentCohortEnrollment creation
      const enrollment = await tx.studentCohortEnrollment.upsert({
        where: {
          studentId_cohortId: {
            studentId: studentProfile.id,
            cohortId: admission.cohortId,
          },
        },
        create: {
          studentId: studentProfile.id,
          cohortId: admission.cohortId,
          admissionId: admission.id,
          applicationId: admission.applicationId,
          programId: admission.programId || admission.cohort.programId,
          programVersionId: admission.programVersionId || admission.cohort.programVersionId,
          curriculumVersionId: admission.curriculumVersionId || admission.cohort.curriculumVersionId,
          academicSessionId: admission.academicSessionId || admission.cohort.academicSessionId,
          financialClearanceId: clearance.clearanceId,
          enrolledById: authUser.id,
          status: EnrollmentStatus.ENROLLED,
          enrollmentDate: new Date(),
          notes,
        },
        update: {
          admissionId: admission.id,
          applicationId: admission.applicationId,
          programId: admission.programId || admission.cohort.programId,
          programVersionId: admission.programVersionId || admission.cohort.programVersionId,
          curriculumVersionId: admission.curriculumVersionId || admission.cohort.curriculumVersionId,
          financialClearanceId: clearance.clearanceId,
          status: EnrollmentStatus.ENROLLED,
          notes,
        },
        include: {
          cohort: true,
          student: { include: { user: true } },
        },
      });

      // 7. Link financial clearance to studentProfile
      await tx.financialClearance.update({
        where: { id: clearance.clearanceId },
        data: { studentId: studentProfile.id },
      });

      // 8. Link invoices to studentProfile
      await tx.invoice.updateMany({
        where: { admissionId: admission.id },
        data: { studentId: studentProfile.id },
      });

      // 9. Parent/Guardian relation linking if parent email provided
      if (admission.application.parentEmail) {
        const parentUser = await tx.user.findUnique({
          where: { email: admission.application.parentEmail },
          include: { parentProfile: true },
        });

        if (parentUser?.parentProfile) {
          await tx.studentGuardianRelation.upsert({
            where: {
              studentId_parentId: {
                studentId: studentProfile.id,
                parentId: parentUser.parentProfile.id,
              },
            },
            create: {
              studentId: studentProfile.id,
              parentId: parentUser.parentProfile.id,
              isPrimary: true,
              canAccessAcademicRecords: true,
              canReceiveBillingInformation: true,
            },
            update: {},
          });
        }
      }

      // Phase 8: Record ENROLLMENT_COMPLETED outbox event atomically within transaction
      await eventOutboxService.recordOutboxEvent(tx, {
        eventType: 'ENROLLMENT_COMPLETED',
        aggregateType: 'StudentCohortEnrollment',
        aggregateId: enrollment.id,
        payload: {
          enrollmentId: enrollment.id,
          admissionId: admission.id,
          studentProfileId: studentProfile.id,
          studentIdNumber: studentProfile.studentIdNumber,
          admissionNumber: admission.admissionNumber,
          cohortId: admission.cohortId,
          cohortCode: admission.cohort.cohortCode,
          enrolledBy: authUser.id,
        },
      });

      return {
        enrollment,
        studentProfile,
        admission: updatedAdmission,
      };
    });

    // Emit lifecycle event
    automationEventService.emitLifecycleEvent('ENROLLMENT_COMPLETED', result.enrollment.id, {
      studentIdNumber: result.studentProfile.studentIdNumber,
      admissionNumber: admission.admissionNumber,
      cohortCode: admission.cohort.cohortCode,
      enrolledBy: authUser.id,
    });

    return result;
  }
}

export const enrollmentService = new EnrollmentService();
