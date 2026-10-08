import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { emailService } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

// ===========================================================================
// MARKETING & ADMISSIONS LEAD CRM CONTROLLER
// ===========================================================================

/**
 * Get comprehensive marketing leads dossier and conversion funnel analytics
 * Accessible by: SUPER_ADMIN, MARKETING_MANAGER, ADMISSIONS_ADMIN
 */
export const getMarketingLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, programId, marketingStatus, funnelStage, isMinor } = req.query;

    const where: any = {};

    if (programId && String(programId) !== 'ALL') {
      where.programId = String(programId);
    }

    if (marketingStatus && String(marketingStatus) !== 'ALL') {
      where.marketingStatus = String(marketingStatus);
    }

    if (isMinor === 'true') {
      where.isMinor = true;
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { parentName: { contains: q, mode: 'insensitive' } },
        { parentPhone: { contains: q, mode: 'insensitive' } },
        { applicationNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 1. Fetch applications with all related enrollment funnel data
    const applications = await prisma.application.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        program: {
          select: {
            id: true,
            code: true,
            name: true,
            school: { select: { id: true, name: true, code: true } },
          },
        },
        cohort: {
          select: {
            id: true,
            name: true,
            cohortCode: true,
            startDate: true,
            levelCode: true,
            trainingFee: true,
          },
        },
        preferredCenter: {
          select: { id: true, name: true, cityOrTown: true, stateOrRegion: true },
        },
        assessmentAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            score: true,
            maxScore: true,
            percentage: true,
            recommendedLevel: true,
            completedAt: true,
          },
        },
        placement: {
          select: {
            id: true,
            status: true,
            recommendedLevel: true,
            approvedLevel: true,
          },
        },
        admission: {
          select: {
            id: true,
            admissionNumber: true,
            status: true,
            issuedAt: true,
            acceptedAt: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            amountPaid: true,
            balance: true,
            status: true,
            selectedPlanType: true,
          },
        },
        financialClearances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            approvedAt: true,
          },
        },
        followUps: {
          include: {
            recordedBy: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch registered accounts who haven't submitted an application yet (top of funnel)
    const registeredOnlyUsers = await prisma.user.findMany({
      where: {
        role: 'APPLICANT',
        applications: { none: {} },
        ...(search && String(search).trim() !== ''
          ? {
              OR: [
                { firstName: { contains: String(search).trim(), mode: 'insensitive' } },
                { lastName: { contains: String(search).trim(), mode: 'insensitive' } },
                { email: { contains: String(search).trim(), mode: 'insensitive' } },
                { phone: { contains: String(search).trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 3. Transform and calculate stage for each application
    const leads = applications.map((app) => {
      const latestAttempt = app.assessmentAttempts[0] || null;
      const latestInvoice = app.invoices[0] || null;
      const latestClearance = app.financialClearances[0] || null;

      let stage = 'APPLICATION_SUBMITTED';
      if (latestClearance?.status === 'CLEARED' || (latestInvoice && latestInvoice.balance === 0 && latestInvoice.amountPaid > 0)) {
        stage = 'TUITION_CLEARED';
      } else if (latestInvoice && latestInvoice.amountPaid > 0 && latestInvoice.balance > 0) {
        stage = 'TUITION_PARTIALLY_PAID';
      } else if (app.admission) {
        stage = 'ADMISSION_OFFERED';
      } else if (latestAttempt) {
        stage = 'ASSESSMENT_COMPLETED';
      } else {
        stage = 'ASSESSMENT_PENDING';
      }

      return {
        id: app.id,
        applicationNumber: app.applicationNumber,
        userId: app.userId,
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        address: app.address,
        isMinor: app.isMinor,
        parentName: app.parentName,
        parentPhone: app.parentPhone,
        parentEmail: app.parentEmail,
        parentRelationship: app.parentRelationship,
        program: app.program,
        cohort: app.cohort,
        preferredCenter: app.preferredCenter,
        requestedPaymentPlan: app.requestedPaymentPlan,
        fundingSourcePreference: app.fundingSourcePreference,
        scholarshipRequested: app.scholarshipRequested,
        financialAssistanceReason: app.financialAssistanceReason,
        marketingStatus: app.marketingStatus || 'NEW_LEAD',
        marketingNotes: app.marketingNotes,
        lastContactedAt: app.lastContactedAt,
        funnelStage: stage,
        latestAttempt,
        placement: app.placement,
        admission: app.admission,
        invoice: latestInvoice,
        financialClearance: latestClearance,
        followUps: app.followUps,
        createdAt: app.createdAt,
      };
    });

    // Filter by computed funnelStage if provided
    const filteredLeads = funnelStage && String(funnelStage) !== 'ALL'
      ? leads.filter((l) => l.funnelStage === funnelStage)
      : leads;

    // 4. Calculate Key Funnel Metrics
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const metrics = {
      totalLeads: leads.length + registeredOnlyUsers.length,
      totalApplications: leads.length,
      registeredOnlyCount: registeredOnlyUsers.length,
      newLeadsToday: leads.filter((l) => new Date(l.createdAt) >= oneDayAgo).length,
      assessmentPendingCount: leads.filter((l) => l.funnelStage === 'ASSESSMENT_PENDING').length,
      assessmentCompletedCount: leads.filter((l) => l.funnelStage === 'ASSESSMENT_COMPLETED').length,
      admissionOfferedCount: leads.filter((l) => l.funnelStage === 'ADMISSION_OFFERED').length,
      tuitionPartiallyPaidCount: leads.filter((l) => l.funnelStage === 'TUITION_PARTIALLY_PAID').length,
      tuitionClearedCount: leads.filter((l) => l.funnelStage === 'TUITION_CLEARED').length,
      paymentCommittedCount: leads.filter((l) => l.marketingStatus === 'PAYMENT_COMMITTED').length,
      minorsWithParentsCount: leads.filter((l) => l.isMinor && l.parentPhone).length,
      conversionRate: leads.length > 0
        ? Math.round((leads.filter((l) => l.funnelStage === 'TUITION_CLEARED').length / leads.length) * 100)
        : 0,
    };

    res.status(200).json({
      metrics,
      leads: filteredLeads,
      registeredOnlyUsers,
    });
  } catch (error: any) {
    console.error('getMarketingLeads error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch marketing leads dossier' });
  }
};

/**
 * Log a manual follow-up activity (phone call, WhatsApp message, email, in-person note)
 */
export const recordLeadFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      applicationId,
      contactChannel, // PHONE_CALL, WHATSAPP, EMAIL, SMS, IN_PERSON
      contactTarget,  // APPLICANT, PARENT_GUARDIAN, SPONSOR
      outcome,        // CONNECTED_INTERESTED, PROMISED_PAYMENT, CALLBACK_REQUESTED, NO_ANSWER, BUSY, WRONG_NUMBER, NOT_INTERESTED, ENROLLED
      notes,
      nextFollowUpDate,
      newMarketingStatus,
    } = req.body;

    if (!applicationId || !notes) {
      res.status(400).json({ message: 'applicationId and notes are required' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      res.status(404).json({ message: 'Application record not found' });
      return;
    }

    const recordedById = req.user?.id;
    if (!recordedById) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // 1. Create Follow-up Log
    const followUp = await prisma.leadFollowUp.create({
      data: {
        applicationId,
        recordedById,
        contactChannel: contactChannel || 'PHONE_CALL',
        contactTarget: contactTarget || 'APPLICANT',
        outcome: outcome || 'CONNECTED_INTERESTED',
        notes: String(notes).trim(),
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      },
      include: {
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    // 2. Update Application marketing status & timestamp
    const updatedStatus = newMarketingStatus || (
      outcome === 'PROMISED_PAYMENT' ? 'PAYMENT_COMMITTED' :
      outcome === 'ENROLLED' ? 'CONVERTED' :
      outcome === 'NOT_INTERESTED' ? 'LOST' :
      'FOLLOWING_UP'
    );

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        marketingStatus: updatedStatus,
        marketingNotes: String(notes).trim(),
        lastContactedAt: new Date(),
      },
    });

    res.status(201).json({
      message: 'Follow-up interaction recorded successfully!',
      followUp,
      marketingStatus: updatedApp.marketingStatus,
    });
  } catch (error: any) {
    console.error('recordLeadFollowUp error:', error);
    res.status(500).json({ message: error.message || 'Failed to record lead follow-up' });
  }
};

/**
 * Update lead marketing status tag
 */
export const updateLeadMarketingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { marketingStatus, marketingNotes } = req.body;

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(marketingStatus && { marketingStatus }),
        ...(marketingNotes !== undefined && { marketingNotes }),
      },
    });

    res.status(200).json({
      message: 'Lead marketing status updated.',
      application: updated,
    });
  } catch (error: any) {
    console.error('updateLeadMarketingStatus error:', error);
    res.status(500).json({ message: 'Failed to update marketing status' });
  }
};

/**
 * Send customized marketing & admissions follow-up email directly to applicant or parent
 */
export const sendLeadFollowUpEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId, recipientTarget, subject, message } = req.body;

    if (!applicationId || !subject || !message) {
      res.status(400).json({ message: 'applicationId, subject, and message are required' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        program: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    let recipientEmail = application.email;
    let recipientName = application.fullName;

    if (recipientTarget === 'PARENT' && application.parentEmail) {
      recipientEmail = application.parentEmail;
      recipientName = application.parentName || `Parent of ${application.fullName}`;
    }

    if (!recipientEmail) {
      res.status(400).json({ message: 'No valid recipient email address on file' });
      return;
    }

    const clientUrl = emailService.getClientUrl();

    // 1. Dispatch Email via Resend
    const dispatchResult = await emailService.sendDirectFollowUpEmail({
      to: recipientEmail,
      recipientName,
      subject: String(subject).trim(),
      message: String(message).trim(),
      ctaUrl: `${clientUrl}/portal/applicant`,
      ctaText: 'Access Your Applicant Dashboard →',
    });

    // 2. In-app notification for the applicant if account exists
    if (application.userId) {
      await createNotification({
        userId: application.userId,
        title: String(subject).trim(),
        message: String(message).trim().slice(0, 200) + '...',
        type: 'INFO',
      });
    }

    // 3. Automatically record follow-up history
    if (req.user?.id) {
      await prisma.leadFollowUp.create({
        data: {
          applicationId,
          recordedById: req.user.id,
          contactChannel: 'EMAIL',
          contactTarget: recipientTarget === 'PARENT' ? 'PARENT_GUARDIAN' : 'APPLICANT',
          outcome: dispatchResult.success ? 'CONNECTED_INTERESTED' : 'NO_ANSWER',
          notes: `[Email Sent: "${subject}"]\n${message}`,
        },
      });

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          lastContactedAt: new Date(),
          marketingStatus: 'FOLLOWING_UP',
        },
      });
    }

    res.status(200).json({
      message: `Follow-up email dispatched successfully to ${recipientName} (${recipientEmail})!`,
      dispatchResult,
    });
  } catch (error: any) {
    console.error('sendLeadFollowUpEmail error:', error);
    res.status(500).json({ message: error.message || 'Failed to dispatch follow-up email' });
  }
};
