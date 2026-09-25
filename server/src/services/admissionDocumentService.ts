import { Role, AdmissionStatus, FinancialClearanceStatus } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { eventOutboxService, DbClient } from './eventOutboxService.js';

export interface AdmissionDocumentData {
  documentType: 'OFFICIAL_ADMISSION_LETTER' | 'PROVISIONAL_OFFER_PREVIEW' | 'ADMISSION_NOTICE';
  isOfficial: boolean;
  watermark?: string;
  verificationHash: string;
  issueDate: Date;
  admission: {
    id: string;
    admissionNumber: string;
    status: AdmissionStatus;
    offerDate: Date;
    acceptanceDeadline?: Date | null;
  };
  student: {
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
    studentId?: string | null;
  };
  academic: {
    schoolName: string;
    programName: string;
    programCode: string;
    programVersion: number;
    curriculumVersionCode: string;
    academicSessionName: string;
    cohortName: string;
    cohortCode: string;
    startDate: Date;
    deliveryMode: string;
  };
  financial: {
    tuitionFee: number;
    currency: string;
    clearanceStatus: FinancialClearanceStatus | 'NOT_APPLICABLE';
    isFinanciallyCleared: boolean;
  };
  letterHtml: string;
  letterText: string;
}

export class AdmissionDocumentService {
  /**
   * Authoritatively generate admission letter data/preview.
   * Clearly distinguishes provisional preview from official final admission letters.
   */
  async generateAdmissionDocument(
    admissionId: string,
    requestingUser: { id: string; role: Role }
  ): Promise<AdmissionDocumentData> {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        application: {
          include: {
            user: true,
            program: { include: { school: true } },
          },
        },
        cohort: {
          include: {
            program: { include: { school: true } },
            programVersion: true,
            curriculumVersion: true,
            academicSession: true,
          },
        },
        program: { include: { school: true } },
        programVersion: true,
        curriculumVersion: true,
        academicSession: true,
        financialClearances: { orderBy: { createdAt: 'desc' }, take: 1 },
        enrollments: {
          include: { student: true },
          take: 1,
        },
      },
    });

    if (!admission) {
      throw new Error(`Admission record not found: ${admissionId}`);
    }

    // Authorization verification
    const isStaff = ([
      Role.SUPER_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.ADMISSIONS_ADMIN,
      Role.FINANCE_ADMIN,
      Role.PROGRAM_COORDINATOR,
      Role.COORDINATOR_ADMIN,
    ] as Role[]).includes(requestingUser.role);

    const isApplicant =
      admission.application.userId === requestingUser.id ||
      admission.application.email === (requestingUser as any).email;

    if (!isStaff && !isApplicant) {
      throw new Error('Unauthorized to access this admission document.');
    }

    const app = admission.application;
    const user = app.user;
    const cohort = admission.cohort;
    const program = admission.program || cohort.program || app.program;
    const school = program.school;
    const session = admission.academicSession || cohort.academicSession;
    const clearance = admission.financialClearances?.[0];
    const enrollment = admission.enrollments?.[0];

    const isOfficiallyClearedOrEnrolled =
      admission.status === AdmissionStatus.FINANCIALLY_CLEARED ||
      admission.status === AdmissionStatus.ENROLLED;

    const documentType = isOfficiallyClearedOrEnrolled
      ? 'OFFICIAL_ADMISSION_LETTER'
      : 'PROVISIONAL_OFFER_PREVIEW';

    const isOfficial = isOfficiallyClearedOrEnrolled;
    const watermark = isOfficial
      ? undefined
      : 'PROVISIONAL OFFER — PENDING FINANCIAL CLEARANCE — NOT AN OFFICIAL MATRICULATION LETTER';

    // Verification checksum based on immutable tuple
    const programVersionId = admission.programVersionId || cohort.programVersionId || 'pv-default';
    const userId = user?.id || app.userId || 'u-applicant';
    const verificationPayload = `${admission.id}:${admission.admissionNumber}:${userId}:${cohort.id}:${programVersionId}:${isOfficial}`;
    const verificationHash = crypto.createHash('sha256').update(verificationPayload).digest('hex').substring(0, 16).toUpperCase();

    const studentName = app.fullName || (user ? `${user.firstName} ${user.lastName}` : 'Applicant');
    const programName = admission.programName || program.name;
    const programCode = program.code;
    const curriculumCode =
      admission.curriculumVersion ? `CV-v${admission.curriculumVersion.versionNumber}` :
      cohort.curriculumVersion ? `CV-v${cohort.curriculumVersion.versionNumber}` :
      'CV-DEFAULT';
    const versionNumber =
      admission.programVersion?.versionNumber ||
      cohort.programVersion?.versionNumber ||
      1;
    const cohortName = cohort.name;
    const startDateFormatted = new Date(cohort.startDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const studentIdNumber = admission.studentIdNumber || enrollment?.student?.studentIdNumber;

    const letterText = `
STEMPACT ACADEMY
Office of the Registrar
Ile-Ife, Osun State, Nigeria
==================================================
DOCUMENT: ${isOfficial ? 'OFFICIAL ADMISSION LETTER' : 'PROVISIONAL ADMISSION OFFER (PREVIEW)'}
Verification Code: ${verificationHash}
Admission Number: ${admission.admissionNumber}
Date: ${new Date().toLocaleDateString()}
Status: ${admission.status}

Dear ${studentName},

${
  isOfficial
    ? `We are pleased to confirm your OFFICIAL ADMISSION and academic matriculation into the STEMPACT Academy program outlined below:`
    : `We are pleased to extend a PROVISIONAL OFFER of admission to STEMPACT Academy. Please note: This is an offer preview. Official matriculation and class access are subject to financial clearance.`
}

ACADEMIC PLACEMENT DETAILS:
- School: ${school?.name || 'School of Advanced Computing & Technology'}
- Program: ${programName} (${programCode})
- Academic Version: v${versionNumber} [Curriculum: ${curriculumCode}]
- Cohort: ${cohortName} (${cohort.cohortCode})
- Academic Session: ${session?.name || 'Academic Year 2026/2027'}
- Start Date: ${startDateFormatted}
- Delivery Mode: ${cohort.mode || 'Hybrid (Onsite Ile-Ife & Virtual)'}

FINANCIAL STATUS:
- Program Tuition: ₦${cohort.trainingFee?.toLocaleString() || '0'}
- Financial Clearance Status: ${clearance?.status || 'PENDING'}
${studentIdNumber ? `- Official Student ID: ${studentIdNumber}` : ''}

${
  isOfficial
    ? `You are now fully authorized to participate in all lectures, laboratories, and curriculum activities. Welcome to STEMPACT Academy!`
    : `To confirm your acceptance and receive your official admission pack, please proceed to the STEMPACT portal to complete your tuition arrangements.`
}

Sincerely,
Office of Academic Affairs & Admissions
STEMPACT Academy
    `.trim();

    const letterHtml = `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
  ${!isOfficial ? `<div style="background-color: #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 20px;">⚠️ ${watermark}</div>` : ''}
  <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="color: #1e3a8a; margin: 0;">STEMPACT ACADEMY</h2>
    <p style="color: #64748b; margin: 4px 0 0 0;">Office of the Registrar • Ile-Ife, Nigeria</p>
    <div style="margin-top: 8px; font-size: 13px; color: #475569;">
      <strong>${isOfficial ? 'OFFICIAL ADMISSION LETTER' : 'PROVISIONAL ADMISSION OFFER'}</strong> | Verification Ref: <code>${verificationHash}</code>
    </div>
  </div>

  <p>Dear <strong>${studentName}</strong>,</p>
  <p>${isOfficial ? 'We are pleased to confirm your <strong>official admission</strong> to STEMPACT Academy:' : 'We are pleased to extend a provisional offer of admission to STEMPACT Academy:'}</p>

  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 16px 0;">
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr><td style="padding: 4px 0; color: #64748b;">Admission No:</td><td style="font-weight: bold;">${admission.admissionNumber}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Program:</td><td style="font-weight: bold;">${programName} (${programCode})</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Curriculum Version:</td><td>v${versionNumber} [${curriculumCode}]</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Cohort:</td><td>${cohortName}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Commencement Date:</td><td>${startDateFormatted}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Financial Clearance:</td><td><span style="font-weight: bold; color: ${isOfficial ? '#15803d' : '#b45309'};">${clearance?.status || 'PENDING'}</span></td></tr>
      ${studentIdNumber ? `<tr><td style="padding: 4px 0; color: #64748b;">Student ID:</td><td style="font-weight: bold; color: #2563eb;">${studentIdNumber}</td></tr>` : ''}
    </table>
  </div>

  <p style="font-size: 14px; line-height: 1.5;">${isOfficial ? 'Please retain this official document for your academic records. You may now access your course dashboard and curriculum materials.' : 'Please proceed to your student portal to fulfill your financial clearance requirements.'}</p>

  <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8;">
    STEMPACT Academy • Official Document • Verification: <code>${verificationHash}</code>
  </div>
</div>
    `.trim();

    return {
      documentType,
      isOfficial,
      watermark,
      verificationHash,
      issueDate: new Date(),
      admission: {
        id: admission.id,
        admissionNumber: admission.admissionNumber,
        status: admission.status,
        offerDate: admission.issuedAt,
        acceptanceDeadline: admission.acceptanceDeadline,
      },
      student: {
        userId,
        name: studentName,
        email: app.email,
        phone: app.phone,
        studentId: studentIdNumber,
      },
      academic: {
        schoolName: school?.name || 'School of Advanced Computing & Technology',
        programName,
        programCode,
        programVersion: versionNumber,
        curriculumVersionCode: curriculumCode,
        academicSessionName: session?.name || '2026/2027',
        cohortName,
        cohortCode: cohort.cohortCode,
        startDate: cohort.startDate,
        deliveryMode: cohort.mode || 'Hybrid (Onsite Ile-Ife & Virtual)',
      },
      financial: {
        tuitionFee: cohort.trainingFee || 0,
        currency: 'NGN',
        clearanceStatus: clearance?.status || 'NOT_APPLICABLE',
        isFinanciallyCleared: clearance?.status === FinancialClearanceStatus.CLEARED || clearance?.status === FinancialClearanceStatus.WAIVED,
      },
      letterHtml,
      letterText,
    };
  }

  /**
   * Policy check: Can official automated delivery be triggered?
   * Strict Rule: CANNOT automatically deliver official letter on OFFERED or ACCEPTED.
   * Must be FINANCIALLY_CLEARED or ENROLLED.
   */
  canTriggerOfficialAutomatedDelivery(
    admissionStatus: AdmissionStatus,
    clearanceStatus?: FinancialClearanceStatus | null
  ): { canDeliver: boolean; reason?: string } {
    if (
      admissionStatus === AdmissionStatus.OFFERED ||
      admissionStatus === AdmissionStatus.ACCEPTED
    ) {
      return {
        canDeliver: false,
        reason: `Official automated admission letter delivery is strictly prohibited for provisional status '${admissionStatus}'. Financial clearance is required.`,
      };
    }

    if (
      admissionStatus !== AdmissionStatus.FINANCIALLY_CLEARED &&
      admissionStatus !== AdmissionStatus.ENROLLED
    ) {
      return {
        canDeliver: false,
        reason: `Admission status '${admissionStatus}' is ineligible for official admission delivery.`,
      };
    }

    if (
      clearanceStatus &&
      clearanceStatus !== FinancialClearanceStatus.CLEARED &&
      clearanceStatus !== FinancialClearanceStatus.WAIVED
    ) {
      return {
        canDeliver: false,
        reason: `Financial clearance is '${clearanceStatus}'. Must be CLEARED or WAIVED for official admission delivery.`,
      };
    }

    return { canDeliver: true };
  }

  /**
   * Trigger official admission letter delivery.
   * Respects transactional boundary via dbClient and enqueues EventOutbox.
   */
  async triggerOfficialAdmissionDelivery(
    admissionId: string,
    triggeredByUserId: string,
    dbClient: DbClient = prisma
  ): Promise<{ enqueued: boolean; outboxId?: string; reason?: string }> {
    const admission = await (dbClient as any).admission.findUnique({
      where: { id: admissionId },
      include: {
        financialClearances: { orderBy: { createdAt: 'desc' }, take: 1 },
        application: { include: { user: true, program: true } },
        cohort: true,
      },
    });

    if (!admission) {
      throw new Error(`Admission not found: ${admissionId}`);
    }

    const latestClearance = admission.financialClearances?.[0];

    const policyCheck = this.canTriggerOfficialAutomatedDelivery(
      admission.status,
      latestClearance?.status
    );

    if (!policyCheck.canDeliver) {
      return { enqueued: false, reason: policyCheck.reason };
    }

    const applicantUserId = admission.application.userId || admission.application.user?.id || triggeredByUserId;
    const applicantName = admission.application.fullName || `${admission.application.user?.firstName || 'Applicant'} ${admission.application.user?.lastName || ''}`;

    // Atomically enqueue Outbox event for official delivery
    const outboxRecord = await eventOutboxService.recordOutboxEvent(dbClient, {
      eventType: 'ADMISSION_OFFICIAL_OFFER_DELIVERY',
      aggregateType: 'Admission',
      aggregateId: admission.id,
      payload: {
        admissionId: admission.id,
        admissionNumber: admission.admissionNumber,
        userId: applicantUserId,
        applicantName,
        programName: admission.programName || admission.application.program.name,
        programCode: admission.application.program.code,
        cohortName: admission.cohort.name,
        startDate: admission.cohort.startDate,
        triggeredByUserId,
      },
    });

    return { enqueued: true, outboxId: outboxRecord.id };
  }
}

export const admissionDocumentService = new AdmissionDocumentService();
