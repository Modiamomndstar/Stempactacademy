import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { Role, CouponType, InvoiceStatus } from '@prisma/client';
import { identifierService } from '../services/identifierService.js';
import { createNotification } from '../services/notificationService.js';

// ===========================================================================
// 1. COUPON MANAGEMENT & VERIFICATION
// ===========================================================================

/**
 * Create a new promotion coupon or fee waiver code (Super Admin & Finance Admin)
 */
export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minInvoiceTotal,
      maxUses,
      expiresAt,
      programId,
      cohortId,
    } = req.body;

    if (!code || !description || discountValue === undefined) {
      res.status(400).json({ message: 'Code, description, and discountValue are required.' });
      return;
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      res.status(400).json({ message: `Coupon code "${cleanCode}" already exists.` });
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        description: String(description).trim(),
        discountType: discountType === 'FIXED_AMOUNT' ? CouponType.FIXED_AMOUNT : CouponType.PERCENTAGE,
        discountValue: Number(discountValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minInvoiceTotal: minInvoiceTotal ? Number(minInvoiceTotal) : null,
        maxUses: maxUses ? parseInt(String(maxUses), 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        programId: programId ? String(programId) : null,
        cohortId: cohortId ? String(cohortId) : null,
        createdById: req.user?.id || null,
        isActive: true,
      },
    });

    res.status(201).json({ message: `Coupon "${cleanCode}" created successfully.`, coupon });
  } catch (error: any) {
    console.error('createCoupon error:', error);
    res.status(500).json({ message: error.message || 'Failed to create coupon' });
  }
};

/**
 * List all coupons with usage statistics (Super Admin & Finance Admin)
 */
export const getCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        program: { select: { id: true, code: true, name: true } },
        cohort: { select: { id: true, name: true, cohortCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ coupons });
  } catch (error: any) {
    console.error('getCoupons error:', error);
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
};

/**
 * Toggle coupon status (active/inactive)
 */
export const toggleCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found.' });
      return;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    res.status(200).json({
      message: `Coupon "${coupon.code}" is now ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      coupon: updated,
    });
  } catch (error: any) {
    console.error('toggleCoupon error:', error);
    res.status(500).json({ message: 'Failed to update coupon status' });
  }
};

/**
 * Apply a coupon code to an invoice (Applicant or Student)
 */
export const applyCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, code } = req.body;
    if (!invoiceId || !code) {
      res.status(400).json({ message: 'invoiceId and code are required.' });
      return;
    }

    const cleanCode = String(code).trim().toUpperCase();

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        application: true,
        cohort: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === InvoiceStatus.PAID) {
      res.status(400).json({ message: 'This invoice has already been fully paid.' });
      return;
    }

    if (invoice.couponCode) {
      res.status(400).json({ message: `Coupon code "${invoice.couponCode}" has already been applied to this invoice.` });
      return;
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      res.status(400).json({ message: 'Invalid or expired coupon code.' });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ message: 'This coupon code has expired.' });
      return;
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ message: 'This coupon code has reached its maximum redemption limit.' });
      return;
    }

    // Program scope check
    if (coupon.programId && invoice.application?.programId && coupon.programId !== invoice.application.programId) {
      res.status(400).json({ message: 'This coupon code is not applicable to your selected academic program.' });
      return;
    }

    // Cohort scope check
    if (coupon.cohortId && invoice.cohortId && coupon.cohortId !== invoice.cohortId) {
      res.status(400).json({ message: 'This coupon code is not applicable to your assigned cohort.' });
      return;
    }

    const baseAmount = invoice.baseAmount || invoice.totalAmount;
    if (coupon.minInvoiceTotal && baseAmount < coupon.minInvoiceTotal) {
      res.status(400).json({ message: `Minimum invoice total of ₦${coupon.minInvoiceTotal.toLocaleString()} required for this coupon.` });
      return;
    }

    // Calculate discount
    let calculatedDiscount = 0;
    if (coupon.discountType === CouponType.PERCENTAGE) {
      calculatedDiscount = (baseAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
        calculatedDiscount = coupon.maxDiscount;
      }
    } else {
      calculatedDiscount = Math.min(coupon.discountValue, baseAmount);
    }

    const newDiscountAmount = (invoice.discountAmount || 0) + calculatedDiscount;
    const newTotalAmount = Math.max(0, baseAmount - newDiscountAmount - (invoice.scholarshipAmount || 0) - (invoice.sponsorAmount || 0));
    const newBalance = Math.max(0, newTotalAmount - (invoice.amountPaid || 0));
    const newStatus = newBalance === 0 ? InvoiceStatus.PAID : (invoice.amountPaid > 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.UNPAID);

    // Update invoice with coupon
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        baseAmount,
        discountAmount: newDiscountAmount,
        totalAmount: newTotalAmount,
        balance: newBalance,
        status: newStatus,
        couponId: coupon.id,
        couponCode: coupon.code,
      },
      include: {
        payments: true,
      },
    });

    // Increment coupon usage
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    res.status(200).json({
      message: `Coupon "${coupon.code}" applied! You saved ₦${calculatedDiscount.toLocaleString()}.`,
      discountAmount: calculatedDiscount,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('applyCoupon error:', error);
    res.status(500).json({ message: error.message || 'Failed to apply coupon.' });
  }
};

// ===========================================================================
// 2. INSTALLMENT PLAN SELECTION & MILESTONES
// ===========================================================================

/**
 * Configure or select an installment payment schedule for an invoice
 */
export const selectInstallmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, planType } = req.body;
    // planType: 'FULL' | 'INSTALLMENTS_2' | 'INSTALLMENTS_3'

    if (!invoiceId || !planType) {
      res.status(400).json({ message: 'invoiceId and planType are required.' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const total = invoice.totalAmount;
    let milestones: any[] = [];

    if (planType === 'INSTALLMENTS_2') {
      const half = Math.round(total / 2);
      milestones = [
        {
          milestone: 1,
          title: 'First Installment (50% Upfront)',
          percentage: 50,
          amount: half,
          dueDate: new Date(invoice.dueDate).toISOString(),
          status: invoice.amountPaid >= half ? 'PAID' : 'PENDING',
        },
        {
          milestone: 2,
          title: 'Final Installment (50% Mid-Cohort)',
          percentage: 50,
          amount: total - half,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: invoice.amountPaid >= total ? 'PAID' : 'PENDING',
        },
      ];
    } else if (planType === 'INSTALLMENTS_3') {
      const first = Math.round(total * 0.4);
      const second = Math.round(total * 0.3);
      const third = total - first - second;
      milestones = [
        {
          milestone: 1,
          title: 'First Installment (40% Upfront)',
          percentage: 40,
          amount: first,
          dueDate: new Date(invoice.dueDate).toISOString(),
          status: invoice.amountPaid >= first ? 'PAID' : 'PENDING',
        },
        {
          milestone: 2,
          title: 'Second Installment (30% Month 2)',
          percentage: 30,
          amount: second,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: invoice.amountPaid >= (first + second) ? 'PAID' : 'PENDING',
        },
        {
          milestone: 3,
          title: 'Final Installment (30% Month 3)',
          percentage: 30,
          amount: third,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          status: invoice.amountPaid >= total ? 'PAID' : 'PENDING',
        },
      ];
    } else {
      milestones = [
        {
          milestone: 1,
          title: 'Full Single Payment (100%)',
          percentage: 100,
          amount: total,
          dueDate: new Date(invoice.dueDate).toISOString(),
          status: invoice.amountPaid >= total ? 'PAID' : 'PENDING',
        },
      ];
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        selectedPlanType: planType,
        installmentScheduleJson: JSON.stringify(milestones),
      },
    });

    res.status(200).json({
      message: `Payment plan set to ${planType === 'INSTALLMENTS_2' ? '2 Installments' : planType === 'INSTALLMENTS_3' ? '3 Installments' : 'Full Payment'}.`,
      invoice: updated,
      milestones,
    });
  } catch (error: any) {
    console.error('selectInstallmentPlan error:', error);
    res.status(500).json({ message: error.message || 'Failed to select payment plan.' });
  }
};

// ===========================================================================
// 3. AD-HOC CUSTOM INVOICE CREATION (Super Admin & Finance Admin)
// ===========================================================================

export const createCustomInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      studentId,
      applicationId,
      cohortId,
      title,
      amount,
      dueDate,
      items,
      notes,
    } = req.body;

    if (!title || !amount) {
      res.status(400).json({ message: 'Invoice title and amount are required.' });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ message: 'Invalid invoice amount.' });
      return;
    }

    const invoiceNumber = await identifierService.generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: studentId || null,
        applicationId: applicationId || null,
        cohortId: cohortId || null,
        title: String(title).trim(),
        baseAmount: numAmount,
        totalAmount: numAmount,
        amountPaid: 0,
        balance: numAmount,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: InvoiceStatus.UNPAID,
        items: typeof items === 'string' ? items : JSON.stringify(items || [{ name: title, amount: numAmount }]),
        adjustmentsJson: notes ? JSON.stringify({ notes, issuedBy: req.user?.email }) : null,
      },
      include: {
        student: { include: { user: true } },
        application: true,
      },
    });

    // Notify recipient
    const recipientUserId = invoice.student?.userId || invoice.application?.userId;
    if (recipientUserId) {
      try {
        await createNotification({
          userId: recipientUserId,
          title: `New Invoice Issued: ${title}`,
          message: `An invoice (${invoiceNumber}) for ₦${numAmount.toLocaleString()} has been added to your dashboard. Please review and complete payment before ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}.`,
          type: 'INFO',
        });
      } catch (notifErr) {
        console.warn('Failed to send invoice notification:', notifErr);
      }
    }

    res.status(201).json({
      message: `Custom invoice ${invoiceNumber} issued successfully!`,
      invoice,
    });
  } catch (error: any) {
    console.error('createCustomInvoice error:', error);
    res.status(500).json({ message: error.message || 'Failed to create custom invoice' });
  }
};

// ===========================================================================
// 4. FINANCIAL LEDGER OVERVIEW & PAYMENT REMINDERS
// ===========================================================================

export const getFinancialOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        student: { include: { user: true } },
        application: { include: { program: true, cohort: true } },
        cohort: true,
        payments: { orderBy: { paidAt: 'desc' } },
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute key ledger metrics
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let fullyPaidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    const formattedRecords = invoices.map((inv) => {
      totalBilled += inv.totalAmount;
      totalCollected += inv.amountPaid;
      totalOutstanding += inv.balance;

      if (inv.status === InvoiceStatus.PAID) fullyPaidCount++;
      else if (inv.status === InvoiceStatus.PARTIALLY_PAID) partialCount++;
      else unpaidCount++;

      const learnerName =
        inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` :
        inv.application ? inv.application.fullName :
        inv.payerName || 'Direct Learner';

      const learnerEmail =
        inv.student?.user?.email ||
        inv.application?.email ||
        inv.payerEmail || '-';

      const programTitle =
        inv.application?.program?.name ||
        inv.cohort?.name ||
        inv.title;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        learnerName,
        learnerEmail,
        learnerPhone: inv.student?.user?.phone || inv.application?.phone || '-',
        programTitle,
        cohortName: inv.cohort?.name || inv.application?.cohort?.name || 'Assigned Cohort',
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        balance: inv.balance,
        status: inv.status,
        dueDate: inv.dueDate,
        couponCode: inv.couponCode,
        selectedPlanType: inv.selectedPlanType,
        installmentSchedule: inv.installmentScheduleJson ? JSON.parse(inv.installmentScheduleJson) : null,
        paymentsCount: inv.payments.length,
        createdAt: inv.createdAt,
      };
    });

    res.status(200).json({
      metrics: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        totalInvoices: invoices.length,
        fullyPaidCount,
        partialCount,
        unpaidCount,
      },
      records: formattedRecords,
    });
  } catch (error: any) {
    console.error('getFinancialOverview error:', error);
    res.status(500).json({ message: 'Failed to load financial overview' });
  }
};

/**
 * Send automated tuition reminder email / message to a student or applicant
 */
export const sendPaymentReminder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // invoiceId
    const { customNote } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        application: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found.' });
      return;
    }

    const email = invoice.student?.user?.email || invoice.application?.email || invoice.payerEmail;
    const name = (invoice.student?.user ? `${invoice.student.user.firstName} ${invoice.student.user.lastName}` : null) || invoice.application?.fullName || 'Learner';

    if (!email) {
      res.status(400).json({ message: 'No valid recipient email address found for this invoice.' });
      return;
    }

    const recipientUserId = invoice.student?.userId || invoice.application?.userId;
    if (recipientUserId) {
      await createNotification({
        userId: recipientUserId,
        title: `Tuition Reminder: ₦${invoice.balance.toLocaleString()} Outstanding`,
        message: `Dear ${name}, this is an academic payment reminder for invoice ${invoice.invoiceNumber} (${invoice.title}). Outstanding balance: ₦${invoice.balance.toLocaleString()}. Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}.${customNote ? ` Note: ${customNote}` : ''}`,
        type: 'ALERT',
      });
    }

    res.status(200).json({
      message: `Tuition payment reminder dispatched successfully to ${name} (${email})!`,
    });
  } catch (error: any) {
    console.error('sendPaymentReminder error:', error);
    res.status(500).json({ message: error.message || 'Failed to send payment reminder.' });
  }
};

// ===========================================================================
// 5. INSTITUTIONAL SIGNATORIES & SETTINGS
// ===========================================================================

export const getInstitutionalSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.institutionalSettings.findUnique({
      where: { id: 'default-institution-settings' },
    });

    if (!settings) {
      settings = await prisma.institutionalSettings.create({
        data: {
          id: 'default-institution-settings',
          institutionName: 'STEMPACT Academy',
          primarySignatoryName: 'Dr. Kehinde Adeleke',
          primarySignatoryTitle: 'Dean of Academic Affairs & Faculty',
          secondarySignatoryName: 'Office of the Registrar',
          secondarySignatoryTitle: 'Registrar & Student Records',
        },
      });
    }

    res.status(200).json({ settings });
  } catch (error: any) {
    console.error('getInstitutionalSettings error:', error);
    res.status(500).json({ message: 'Failed to load institutional settings' });
  }
};

export const updateInstitutionalSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      institutionName,
      institutionMotto,
      campusAddress,
      logoUrl,
      sealBadgeUrl,
      primarySignatoryName,
      primarySignatoryTitle,
      primarySignatoryRole,
      primarySignatorySignature,
      secondarySignatoryName,
      secondarySignatoryTitle,
      secondarySignatoryRole,
      secondarySignatorySignature,
      endorsingPartnerName,
      endorsingPartnerTitle,
      endorsingPartnerLogo,
    } = req.body;

    const updated = await prisma.institutionalSettings.upsert({
      where: { id: 'default-institution-settings' },
      update: {
        ...(institutionName && { institutionName }),
        ...(institutionMotto && { institutionMotto }),
        ...(campusAddress && { campusAddress }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(sealBadgeUrl !== undefined && { sealBadgeUrl }),
        ...(primarySignatoryName && { primarySignatoryName }),
        ...(primarySignatoryTitle && { primarySignatoryTitle }),
        ...(primarySignatoryRole && { primarySignatoryRole }),
        ...(primarySignatorySignature !== undefined && { primarySignatorySignature }),
        ...(secondarySignatoryName && { secondarySignatoryName }),
        ...(secondarySignatoryTitle && { secondarySignatoryTitle }),
        ...(secondarySignatoryRole && { secondarySignatoryRole }),
        ...(secondarySignatorySignature !== undefined && { secondarySignatorySignature }),
        ...(endorsingPartnerName !== undefined && { endorsingPartnerName }),
        ...(endorsingPartnerTitle !== undefined && { endorsingPartnerTitle }),
        ...(endorsingPartnerLogo !== undefined && { endorsingPartnerLogo }),
      },
      create: {
        id: 'default-institution-settings',
        institutionName: institutionName || 'STEMPACT Academy',
        primarySignatoryName: primarySignatoryName || 'Dr. Kehinde Adeleke',
        primarySignatoryTitle: primarySignatoryTitle || 'Dean of Academic Affairs & Faculty',
        secondarySignatoryName: secondarySignatoryName || 'Office of the Registrar',
        secondarySignatoryTitle: secondarySignatoryTitle || 'Registrar & Student Records',
      },
    });

    res.status(200).json({
      message: 'Institutional signatories & academy settings updated successfully!',
      settings: updated,
    });
  } catch (error: any) {
    console.error('updateInstitutionalSettings error:', error);
    res.status(500).json({ message: error.message || 'Failed to update institutional settings' });
  }
};

// ===========================================================================
// 6. MULTI-LEVEL PROGRAM CURRICULUM EXPLORER MATRIX
// ===========================================================================

export const getProgramCurriculumMatrix = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const program = await prisma.program.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
      include: {
        school: true,
        courses: {
          include: {
            modules: {
              include: {
                lessons: true,
                practicalActivities: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!program) {
      res.status(404).json({ message: 'Program not found.' });
      return;
    }

    // Group courses & modules by Academic Level
    const levels = [
      { code: 'LEVEL_1_FOUNDATION', label: 'Level 1: Foundation', badge: 'Foundation Principles' },
      { code: 'LEVEL_2_INTERMEDIATE', label: 'Level 2: Intermediate', badge: 'Applied Toolsets' },
      { code: 'LEVEL_3_ADVANCED', label: 'Level 3: Advanced', badge: 'Complex Architecture' },
      { code: 'LEVEL_4_SPECIALIST', label: 'Level 4: Specialist / Mastery', badge: 'Venture & Production' },
    ];

    const matrix = levels.map((lvl) => {
      // Courses matching this level
      const matchingCourses = program.courses.filter(
        (c) => c.level === lvl.code || (lvl.code === 'LEVEL_1_FOUNDATION' && !c.level)
      );

      const totalModules = matchingCourses.reduce((acc, c) => acc + c.modules.length, 0);
      const totalLessons = matchingCourses.reduce(
        (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.lessons.length, 0),
        0
      );

      return {
        ...lvl,
        hasContent: matchingCourses.length > 0 && totalModules > 0,
        coursesCount: matchingCourses.length,
        modulesCount: totalModules,
        lessonsCount: totalLessons,
        courses: matchingCourses,
      };
    });

    res.status(200).json({
      program: {
        id: program.id,
        code: program.code,
        name: program.name,
        schoolName: program.school.name,
        schoolCode: program.school.code,
        duration: program.duration,
        contactHours: program.contactHours,
        totalLevels: program.totalLevels,
      },
      matrix,
    });
  } catch (error: any) {
    console.error('getProgramCurriculumMatrix error:', error);
    res.status(500).json({ message: 'Failed to load curriculum matrix' });
  }
};

// ===========================================================================
// 7. DYNAMIC PAYMENT GATEWAYS & TRANSFER METHODS CONFIGURATION
// ===========================================================================

/**
 * Public payment options & active channels (accessible by applicants & students)
 * Evaluates active gateway flags against backend environment key presence
 */
export const getPublicPaymentSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.institutionalSettings.findUnique({
      where: { id: 'default-institution-settings' },
    });

    if (!settings) {
      settings = await prisma.institutionalSettings.create({
        data: {
          id: 'default-institution-settings',
          institutionName: 'STEMPACT Academy',
          paystackEnabled: true,
          flutterwaveEnabled: false,
          bankTransferEnabled: true,
          cryptoTransferEnabled: false,
        },
      });
    }

    const paystackEnvConfigured = Boolean(
      process.env.PAYSTACK_SECRET_KEY &&
      process.env.PAYSTACK_SECRET_KEY.trim() !== '' &&
      !process.env.PAYSTACK_SECRET_KEY.startsWith('placeholder')
    );

    const flutterwaveEnvConfigured = Boolean(
      process.env.FLUTTERWAVE_SECRET_KEY &&
      process.env.FLUTTERWAVE_SECRET_KEY.trim() !== '' &&
      !process.env.FLUTTERWAVE_SECRET_KEY.startsWith('placeholder')
    );

    const stripeEnvConfigured = Boolean(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY.trim() !== '' &&
      !process.env.STRIPE_SECRET_KEY.startsWith('placeholder')
    );

    let customMethods: any[] = [];
    try {
      if (settings.customPaymentMethodsJson) {
        customMethods = JSON.parse(settings.customPaymentMethodsJson);
      }
    } catch {
      customMethods = [];
    }

    const activeCustomMethods = Array.isArray(customMethods)
      ? customMethods.filter((m: any) => m && m.isActive !== false)
      : [];

    res.status(200).json({
      paystack: Boolean(settings.paystackEnabled && paystackEnvConfigured),
      flutterwave: Boolean(settings.flutterwaveEnabled && flutterwaveEnvConfigured),
      stripe: Boolean(settings.stripeEnabled && stripeEnvConfigured),
      bankTransfer: Boolean(settings.bankTransferEnabled),
      cryptoTransfer: Boolean(settings.cryptoTransferEnabled && settings.cryptoWalletAddress?.trim()),
      bankDetails: {
        bankName: settings.bankName || 'Access Bank Plc',
        bankAccountNumber: settings.bankAccountNumber || '1234567890',
        bankAccountName: settings.bankAccountName || 'STEMPACT Academy Ltd',
        bankSortCode: settings.bankSortCode || null,
        bankTransferInstructions:
          settings.bankTransferInstructions ||
          'Please include your Application Reference Number or Full Name in the transfer narration.',
      },
      cryptoDetails: settings.cryptoTransferEnabled
        ? {
            cryptoCurrency: settings.cryptoCurrency || 'USDT (TRC-20)',
            cryptoNetwork: settings.cryptoNetwork || 'TRON (TRC20)',
            cryptoWalletAddress: settings.cryptoWalletAddress || '',
            cryptoInstructions:
              settings.cryptoInstructions ||
              'Please send exact USDT equivalent to this wallet and upload the transaction hash and payment screenshot.',
          }
        : null,
      customMethods: activeCustomMethods,
    });
  } catch (error: any) {
    console.error('getPublicPaymentSettings error:', error);
    res.status(500).json({ message: 'Failed to load payment options' });
  }
};

/**
 * Admin view of payment gateway status, env presence, and transfer accounts
 */
export const getAdminPaymentSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.institutionalSettings.findUnique({
      where: { id: 'default-institution-settings' },
    });

    if (!settings) {
      settings = await prisma.institutionalSettings.create({
        data: {
          id: 'default-institution-settings',
          institutionName: 'STEMPACT Academy',
          paystackEnabled: true,
          flutterwaveEnabled: false,
          bankTransferEnabled: true,
          cryptoTransferEnabled: false,
        },
      });
    }

    const paystackEnvConfigured = Boolean(
      process.env.PAYSTACK_SECRET_KEY &&
      process.env.PAYSTACK_SECRET_KEY.trim() !== '' &&
      !process.env.PAYSTACK_SECRET_KEY.startsWith('placeholder')
    );

    const flutterwaveEnvConfigured = Boolean(
      process.env.FLUTTERWAVE_SECRET_KEY &&
      process.env.FLUTTERWAVE_SECRET_KEY.trim() !== '' &&
      !process.env.FLUTTERWAVE_SECRET_KEY.startsWith('placeholder')
    );

    const stripeEnvConfigured = Boolean(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY.trim() !== '' &&
      !process.env.STRIPE_SECRET_KEY.startsWith('placeholder')
    );

    res.status(200).json({
      settings,
      envStatus: {
        paystackConfigured: paystackEnvConfigured,
        flutterwaveConfigured: flutterwaveEnvConfigured,
        stripeConfigured: stripeEnvConfigured,
      },
    });
  } catch (error: any) {
    console.error('getAdminPaymentSettings error:', error);
    res.status(500).json({ message: 'Failed to fetch admin payment settings' });
  }
};

/**
 * Update payment settings (Super Admin & Finance Admin)
 */
export const updatePaymentSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      paystackEnabled,
      flutterwaveEnabled,
      stripeEnabled,
      bankTransferEnabled,
      cryptoTransferEnabled,
      bankName,
      bankAccountNumber,
      bankAccountName,
      bankSortCode,
      bankTransferInstructions,
      cryptoCurrency,
      cryptoNetwork,
      cryptoWalletAddress,
      cryptoInstructions,
      customPaymentMethodsJson,
    } = req.body;

    const updated = await prisma.institutionalSettings.upsert({
      where: { id: 'default-institution-settings' },
      update: {
        ...(paystackEnabled !== undefined && { paystackEnabled: Boolean(paystackEnabled) }),
        ...(flutterwaveEnabled !== undefined && { flutterwaveEnabled: Boolean(flutterwaveEnabled) }),
        ...(stripeEnabled !== undefined && { stripeEnabled: Boolean(stripeEnabled) }),
        ...(bankTransferEnabled !== undefined && { bankTransferEnabled: Boolean(bankTransferEnabled) }),
        ...(cryptoTransferEnabled !== undefined && { cryptoTransferEnabled: Boolean(cryptoTransferEnabled) }),
        ...(bankName && { bankName }),
        ...(bankAccountNumber && { bankAccountNumber }),
        ...(bankAccountName && { bankAccountName }),
        ...(bankSortCode !== undefined && { bankSortCode }),
        ...(bankTransferInstructions !== undefined && { bankTransferInstructions }),
        ...(cryptoCurrency !== undefined && { cryptoCurrency }),
        ...(cryptoNetwork !== undefined && { cryptoNetwork }),
        ...(cryptoWalletAddress !== undefined && { cryptoWalletAddress }),
        ...(cryptoInstructions !== undefined && { cryptoInstructions }),
        ...(customPaymentMethodsJson !== undefined && {
          customPaymentMethodsJson: typeof customPaymentMethodsJson === 'string'
            ? customPaymentMethodsJson
            : JSON.stringify(customPaymentMethodsJson),
        }),
      },
      create: {
        id: 'default-institution-settings',
        institutionName: 'STEMPACT Academy',
        paystackEnabled: paystackEnabled !== undefined ? Boolean(paystackEnabled) : true,
        flutterwaveEnabled: flutterwaveEnabled !== undefined ? Boolean(flutterwaveEnabled) : false,
        bankTransferEnabled: bankTransferEnabled !== undefined ? Boolean(bankTransferEnabled) : true,
        cryptoTransferEnabled: cryptoTransferEnabled !== undefined ? Boolean(cryptoTransferEnabled) : false,
        bankName: bankName || 'Access Bank Plc',
        bankAccountNumber: bankAccountNumber || '1234567890',
        bankAccountName: bankAccountName || 'STEMPACT Academy Ltd',
        bankSortCode,
        bankTransferInstructions,
        cryptoCurrency: cryptoCurrency || 'USDT (TRC-20)',
        cryptoNetwork: cryptoNetwork || 'TRON (TRC20)',
        cryptoWalletAddress: cryptoWalletAddress || '',
        cryptoInstructions,
        customPaymentMethodsJson: typeof customPaymentMethodsJson === 'string'
          ? customPaymentMethodsJson
          : JSON.stringify(customPaymentMethodsJson || []),
      },
    });

    res.status(200).json({
      message: 'Payment gateways and account details updated successfully!',
      settings: updated,
    });
  } catch (error: any) {
    console.error('updatePaymentSettings error:', error);
    res.status(500).json({ message: error.message || 'Failed to update payment settings' });
  }
};
