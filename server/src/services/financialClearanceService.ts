import { FinancialClearanceStatus, PaymentStatus, Role, AdmissionStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { automationEventService } from './automationEventService.js';

export interface ClearanceEvaluationResult {
  clearanceId: string;
  status: FinancialClearanceStatus;
  amountRequired: number;
  amountPaid: number;
  balance: number;
  approvedPlanType: string;
  requiredInitialPayment: number;
  minimumRequiredPercentage: number;
  clearancePercentage: number;
  isCleared: boolean;
  fundingSource?: string | null;
  sponsorName?: string | null;
  notes?: string | null;
}

export interface ApprovePaymentArrangementParams {
  admissionId: string;
  staffUser: { id: string; role: Role; name?: string };
  planType: 'FULL' | 'INSTALLMENTS' | 'FULL_SCHOLARSHIP' | 'FULL_SPONSORSHIP' | 'CUSTOM_ARRANGEMENT';
  requiredInitialPayment?: number;
  installmentSchedule?: Array<{
    installment: number;
    amount: number;
    dueDate: string;
    isRequiredForEnrollment?: boolean;
  }>;
  fundingSource?: 'SELF' | 'PARENT_GUARDIAN' | 'SPONSOR' | 'SCHOLARSHIP' | 'MIXED';
  sponsorName?: string;
  notes?: string;
}

export class FinancialClearanceService {
  /**
   * Authoritative server-side evaluation of financial clearance.
   * Calculates required fee vs adjustments vs verified payments based on
   * the approved financial arrangement (NO hardcoded universal percentage).
   */
  async evaluateFinancialClearance(params: {
    admissionId?: string;
    applicationId?: string;
    studentId?: string;
  }): Promise<ClearanceEvaluationResult> {
    const { admissionId, applicationId, studentId } = params;

    if (!admissionId && !applicationId && !studentId) {
      throw new Error('At least one of admissionId, applicationId, or studentId is required for financial clearance evaluation.');
    }

    // Resolve admission if provided or via application
    let admission = admissionId
      ? await prisma.admission.findUnique({
          where: { id: admissionId },
          include: { cohort: true, application: true },
        })
      : null;

    const resolvedAppId = applicationId || admission?.applicationId;

    if (!admission && resolvedAppId) {
      admission = await prisma.admission.findUnique({
        where: { applicationId: resolvedAppId },
        include: { cohort: true, application: true },
      });
    }

    // Find all invoices associated with this admission, application, or student
    const invoiceWhere: any = {
      OR: [
        ...(admission ? [{ admissionId: admission.id }] : []),
        ...(resolvedAppId ? [{ applicationId: resolvedAppId }] : []),
        ...(studentId ? [{ studentId }] : []),
      ],
    };

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        payments: {
          where: { status: PaymentStatus.PAID },
        },
      },
    });

    let totalRequired = 0;
    let totalPaid = 0;
    let totalAdjustments = 0;

    if (invoices.length > 0) {
      for (const inv of invoices) {
        totalRequired += inv.totalAmount;
        totalAdjustments += (inv.discountAmount || 0) + (inv.scholarshipAmount || 0) + (inv.sponsorAmount || 0);
        const verifiedPaidForInvoice = inv.payments.reduce((sum, p) => sum + p.amount, 0);
        totalPaid += verifiedPaidForInvoice;
      }
    } else if (admission?.cohort) {
      // If no invoice yet, compute standard cohort total
      const c = admission.cohort;
      const discount = (c.trainingFee * c.discountPercentage) / 100;
      totalRequired = c.trainingFee - discount + c.registrationFee + c.certificationFee;
      totalAdjustments = discount;
    }

    // Query existing clearance record to check approved plan and waiver state
    const existingClearance = await prisma.financialClearance.findFirst({
      where: {
        OR: [
          ...(admission ? [{ admissionId: admission.id }] : []),
          ...(resolvedAppId ? [{ applicationId: resolvedAppId }] : []),
          ...(studentId ? [{ studentId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const approvedPlanType = existingClearance?.approvedPlanType || 'FULL';
    const fundingSource = existingClearance?.fundingSource || 'SELF';
    const sponsorName = existingClearance?.sponsorName || null;
    const balance = Math.max(0, totalRequired - totalPaid);

    // Determine required initial payment for clearance
    let requiredInitialPayment: number;
    if (approvedPlanType === 'FULL_SCHOLARSHIP' || approvedPlanType === 'FULL_SPONSORSHIP' || totalRequired === 0) {
      requiredInitialPayment = 0;
    } else if (
      approvedPlanType === 'INSTALLMENTS' &&
      existingClearance?.requiredInitialPayment !== undefined &&
      existingClearance?.requiredInitialPayment !== null
    ) {
      requiredInitialPayment = Math.min(totalRequired, existingClearance.requiredInitialPayment);
    } else {
      // Default: full net amount due (100%), or configured minimum percentage
      const configuredPct = existingClearance?.minimumRequiredPercentage ?? 100.0;
      requiredInitialPayment = (totalRequired * configuredPct) / 100;
    }

    const clearancePercentage = totalRequired > 0 ? (totalPaid / totalRequired) * 100 : (totalRequired === 0 ? 100 : 0);

    // Authoritative clearance evaluation logic
    let status: FinancialClearanceStatus;
    let isCleared: boolean;

    if (existingClearance?.status === FinancialClearanceStatus.WAIVED) {
      status = FinancialClearanceStatus.WAIVED;
      isCleared = true;
    } else if (totalRequired === 0) {
      // 100% Scholarship, 100% Sponsorship, or 100% Discount: Net obligation is ₦0!
      // NO fake payment record is needed to achieve clearance!
      status = FinancialClearanceStatus.CLEARED;
      isCleared = true;
    } else if (totalPaid >= requiredInitialPayment && requiredInitialPayment > 0) {
      // Approved payment arrangement threshold met (e.g. installment 1 or full payment)
      status = FinancialClearanceStatus.CLEARED;
      isCleared = true;
    } else if (requiredInitialPayment === 0) {
      // Management approved arrangement requires ₦0 from applicant
      status = FinancialClearanceStatus.CLEARED;
      isCleared = true;
    } else if (totalPaid > 0) {
      status = FinancialClearanceStatus.PARTIAL;
      isCleared = false;
    } else {
      status = FinancialClearanceStatus.PENDING;
      isCleared = false;
    }

    const primaryInvoiceId = invoices.length > 0 ? invoices[0].id : null;

    const clearance = existingClearance
      ? await prisma.financialClearance.update({
          where: { id: existingClearance.id },
          data: {
            amountRequired: totalRequired,
            amountPaid: totalPaid,
            clearancePercentage,
            status,
            approvedPlanType,
            requiredInitialPayment,
            fundingSource,
            sponsorName,
            admissionId: admission?.id || existingClearance.admissionId,
            applicationId: resolvedAppId || existingClearance.applicationId,
            studentId: studentId || existingClearance.studentId,
            invoiceId: primaryInvoiceId || existingClearance.invoiceId,
            clearedAt:
              isCleared && !existingClearance.clearedAt
                ? new Date()
                : existingClearance.clearedAt,
          },
        })
      : await prisma.financialClearance.create({
          data: {
            admissionId: admission?.id,
            applicationId: resolvedAppId,
            studentId,
            invoiceId: primaryInvoiceId,
            amountRequired: totalRequired,
            amountPaid: totalPaid,
            clearancePercentage,
            minimumRequiredPercentage: 100.0,
            approvedPlanType,
            requiredInitialPayment,
            fundingSource,
            sponsorName,
            status,
            clearedAt: isCleared ? new Date() : null,
          },
        });

    // CRITICAL: Advance admission status to FINANCIALLY_CLEARED ONLY if offer was already ACCEPTED!
    // If offer is still OFFERED, financial clearance does NOT substitute for applicant acceptance.
    if (admission && isCleared && admission.status === AdmissionStatus.ACCEPTED) {
      await prisma.admission.update({
        where: { id: admission.id },
        data: { status: AdmissionStatus.FINANCIALLY_CLEARED },
      });
    }

    automationEventService.emitLifecycleEvent('FINANCIAL_CLEARANCE_EVALUATED', clearance.id, {
      admissionId: admission?.id,
      applicationId: resolvedAppId,
      status,
      amountRequired: totalRequired,
      amountPaid: totalPaid,
      balance,
      approvedPlanType,
      requiredInitialPayment,
      isCleared,
    });

    return {
      clearanceId: clearance.id,
      status: clearance.status,
      amountRequired: clearance.amountRequired,
      amountPaid: clearance.amountPaid,
      balance,
      approvedPlanType,
      requiredInitialPayment,
      minimumRequiredPercentage: clearance.minimumRequiredPercentage,
      clearancePercentage: clearance.clearancePercentage,
      isCleared,
      fundingSource: clearance.fundingSource,
      sponsorName: clearance.sponsorName,
      notes: clearance.notes,
    };
  }

  /**
   * Management approves or modifies a payment arrangement for an admission offer.
   * Authorized: SUPER_ADMIN or FINANCE_ADMIN.
   */
  async approvePaymentArrangement(params: ApprovePaymentArrangementParams) {
    const {
      admissionId,
      staffUser,
      planType,
      requiredInitialPayment,
      installmentSchedule,
      fundingSource,
      sponsorName,
      notes,
    } = params;

    const authorizedRoles: Role[] = [Role.SUPER_ADMIN, Role.FINANCE_ADMIN];
    if (!authorizedRoles.includes(staffUser.role)) {
      throw new Error('Access denied: Only Finance Administration or Super Admin can approve payment arrangements.');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { cohort: true, application: true },
    });

    if (!admission) {
      throw new Error('Admission offer not found.');
    }

    let clearance = await prisma.financialClearance.findFirst({
      where: { admissionId },
    });

    const defaultAmountRequired = clearance?.amountRequired || 0;
    const initialPayment = requiredInitialPayment !== undefined
      ? requiredInitialPayment
      : (planType === 'FULL_SCHOLARSHIP' || planType === 'FULL_SPONSORSHIP' ? 0 : defaultAmountRequired);

    const scheduleJson = installmentSchedule ? JSON.stringify(installmentSchedule) : null;

    if (clearance) {
      clearance = await prisma.financialClearance.update({
        where: { id: clearance.id },
        data: {
          approvedPlanType: planType,
          requiredInitialPayment: initialPayment,
          installmentScheduleJson: scheduleJson,
          fundingSource: fundingSource || 'SELF',
          sponsorName: sponsorName || null,
          approvedById: staffUser.id,
          approvedAt: new Date(),
          notes: notes ? `${clearance.notes ? clearance.notes + ' | ' : ''}${notes}` : clearance.notes,
        },
      });
    } else {
      clearance = await prisma.financialClearance.create({
        data: {
          admissionId: admission.id,
          applicationId: admission.applicationId,
          amountRequired: defaultAmountRequired,
          amountPaid: 0,
          approvedPlanType: planType,
          requiredInitialPayment: initialPayment,
          installmentScheduleJson: scheduleJson,
          fundingSource: fundingSource || 'SELF',
          sponsorName: sponsorName || null,
          approvedById: staffUser.id,
          approvedAt: new Date(),
          notes,
        },
      });
    }

    // Re-evaluate clearance against the new approved arrangement
    const evalResult = await this.evaluateFinancialClearance({ admissionId: admission.id });

    return {
      clearance,
      evaluation: evalResult,
    };
  }

  /**
   * Grant an audited financial waiver by authorized staff (SUPER_ADMIN or FINANCE_ADMIN).
   */
  async grantFinancialWaiver(params: {
    admissionId: string;
    staffUser: { id: string; role: Role; name?: string };
    reason: string;
    waiverAmount?: number;
  }) {
    const { admissionId, staffUser, reason, waiverAmount } = params;

    const authorizedRoles: Role[] = [Role.SUPER_ADMIN, Role.FINANCE_ADMIN];
    if (!authorizedRoles.includes(staffUser.role)) {
      throw new Error('Access denied: Only Finance Administration or Super Admin can grant financial waivers.');
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed justification reason is required for financial waiver.');
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { cohort: true, application: true },
    });

    if (!admission) {
      throw new Error('Admission offer not found.');
    }

    let clearance = await prisma.financialClearance.findFirst({
      where: { admissionId },
    });

    const cohort = admission.cohort;
    const discount = (cohort.trainingFee * cohort.discountPercentage) / 100;
    const defaultTotal = cohort.trainingFee - discount + cohort.registrationFee + cohort.certificationFee;
    const amountRequired = clearance?.amountRequired || defaultTotal;
    const waivedAmount = waiverAmount !== undefined ? waiverAmount : amountRequired;

    if (clearance) {
      clearance = await prisma.financialClearance.update({
        where: { id: clearance.id },
        data: {
          status: FinancialClearanceStatus.WAIVED,
          waivedById: staffUser.id,
          waivedAt: new Date(),
          waiverReason: reason.trim(),
          waiverAmount: waivedAmount,
          clearedBy: staffUser.name || staffUser.id,
          clearedAt: new Date(),
          notes: `Waiver granted by ${staffUser.name || staffUser.role}: ${reason}`,
        },
      });
    } else {
      clearance = await prisma.financialClearance.create({
        data: {
          admissionId: admission.id,
          applicationId: admission.applicationId,
          amountRequired,
          amountPaid: 0,
          status: FinancialClearanceStatus.WAIVED,
          waivedById: staffUser.id,
          waivedAt: new Date(),
          waiverReason: reason.trim(),
          waiverAmount: waivedAmount,
          clearedBy: staffUser.name || staffUser.id,
          clearedAt: new Date(),
          notes: `Waiver granted by ${staffUser.name || staffUser.role}: ${reason}`,
        },
      });
    }

    // If admission was accepted, advance to FINANCIALLY_CLEARED
    if (admission.status === AdmissionStatus.ACCEPTED) {
      await prisma.admission.update({
        where: { id: admission.id },
        data: { status: AdmissionStatus.FINANCIALLY_CLEARED },
      });
    }

    automationEventService.emitLifecycleEvent('FINANCIAL_CLEARANCE_WAIVED', clearance.id, {
      admissionId: admission.id,
      staffId: staffUser.id,
      reason,
      waiverAmount: waivedAmount,
    });

    return clearance;
  }

  /**
   * Helper to check whether an admission is currently cleared for enrollment
   */
  async isFinanciallyCleared(admissionId: string): Promise<boolean> {
    const clearance = await prisma.financialClearance.findFirst({
      where: { admissionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!clearance) return false;
    return clearance.status === FinancialClearanceStatus.CLEARED || clearance.status === FinancialClearanceStatus.WAIVED;
  }
}

export const financialClearanceService = new FinancialClearanceService();
