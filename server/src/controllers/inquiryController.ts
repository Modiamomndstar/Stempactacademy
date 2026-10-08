import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { emailService } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit, extractReqMeta } from '../services/auditService.js';

// ============================================================================
// ACADEMIC INQUIRY CONTROLLER
// ============================================================================

/**
 * 1. Submit Public Academic Inquiry (from /contact page)
 * Public endpoint (no auth required)
 */
export const submitPublicInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ message: 'Name, email address, and message are required.' });
      return;
    }

    const { ipAddress, userAgent } = extractReqMeta(req);

    // Save inquiry to database
    const inquiry = await prisma.academicInquiry.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        subject: subject ? String(subject).trim() : 'Program & Syllabus Inquiries',
        message: String(message).trim(),
        status: 'NEW',
        ipAddress,
        userAgent,
      },
    });

    // Send auto-reply confirmation to the visitor
    emailService.sendAcademicInquiryConfirmation({
      to: inquiry.email,
      name: inquiry.name,
      subject: inquiry.subject,
    }).catch((err) => console.warn('Failed to send visitor inquiry auto-reply:', err));

    // Send alert email to Admissions desk / Super Admin
    const adminAlertEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admissions@stempact.org';
    emailService.sendAcademicInquiryAdminAlert({
      to: adminAlertEmail,
      inquiryId: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || undefined,
      subject: inquiry.subject,
      message: inquiry.message,
    }).catch((err) => console.warn('Failed to send admin inquiry alert email:', err));

    // Create in-app notifications for all Super Admins & Admissions Admins
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'ADMISSIONS_ADMIN', 'ACADEMIC_ADMIN', 'MARKETING_MANAGER'] },
          isActive: true,
        },
        select: { id: true },
      });

      for (const adm of adminUsers) {
        await createNotification({
          userId: adm.id,
          title: `New Academic Inquiry: ${inquiry.subject}`,
          message: `${inquiry.name} (${inquiry.email}) sent an inquiry: "${inquiry.message.slice(0, 100)}..."`,
          type: 'INFO',
          relatedEntity: 'INQUIRY',
          relatedEntityId: inquiry.id,
        }).catch(() => {});
      }
    } catch (notifErr) {
      console.warn('Inquiry admin notification dispatch:', notifErr);
    }

    // Log security audit trail
    await logAudit({
      action: 'SUBMIT_ACADEMIC_INQUIRY',
      resource: 'ACADEMIC_INQUIRY',
      resourceId: inquiry.id,
      userName: inquiry.name,
      newValue: { email: inquiry.email, phone: inquiry.phone, subject: inquiry.subject },
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your academic inquiry has been received. An admissions advisor will contact you shortly.',
      inquiryId: inquiry.id,
    });
  } catch (error: any) {
    console.error('Error submitting academic inquiry:', error);
    res.status(500).json({ message: 'Failed to submit inquiry. Please try again or email us directly.' });
  }
};

/**
 * 2. Get Academic Inquiries (Admin CRM)
 * Accessible by: SUPER_ADMIN, ADMISSIONS_ADMIN, ACADEMIC_ADMIN, MARKETING_MANAGER
 */
export const getInquiries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (status && String(status) !== 'ALL') {
      where.status = String(status);
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [inquiries, total, newCount, contactedCount, resolvedCount] = await Promise.all([
      prisma.academicInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          respondedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      prisma.academicInquiry.count({ where }),
      prisma.academicInquiry.count({ where: { status: 'NEW' } }),
      prisma.academicInquiry.count({ where: { status: 'CONTACTED' } }),
      prisma.academicInquiry.count({ where: { status: 'RESOLVED' } }),
    ]);

    res.status(200).json({
      inquiries,
      total,
      metrics: {
        total,
        newCount,
        contactedCount,
        resolvedCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching academic inquiries:', error);
    res.status(500).json({ message: 'Failed to retrieve academic inquiries.' });
  }
};

/**
 * 3. Update Inquiry Status & Notes
 */
export const updateInquiryStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = await prisma.academicInquiry.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Inquiry not found.' });
      return;
    }

    const updated = await prisma.academicInquiry.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        respondedById: req.user?.id,
        respondedAt: new Date(),
      },
      include: {
        respondedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const { ipAddress, userAgent } = extractReqMeta(req);
    await logAudit({
      userId: req.user?.id,
      userName: `${req.user?.firstName} ${req.user?.lastName}`,
      userRole: req.user?.role,
      action: 'UPDATE_INQUIRY_STATUS',
      resource: 'ACADEMIC_INQUIRY',
      resourceId: id,
      previousValue: { status: existing.status, notes: existing.notes },
      newValue: { status: updated.status, notes: updated.notes },
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      message: 'Inquiry status updated successfully.',
      inquiry: updated,
    });
  } catch (error: any) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Failed to update inquiry status.' });
  }
};

/**
 * 4. Reply to Academic Inquiry via Resend Email
 */
export const replyToInquiry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject, message, notes } = req.body;

    if (!subject || !message) {
      res.status(400).json({ message: 'Subject and message are required.' });
      return;
    }

    const inquiry = await prisma.academicInquiry.findUnique({ where: { id } });
    if (!inquiry) {
      res.status(404).json({ message: 'Inquiry not found.' });
      return;
    }

    // Dispatch email reply to visitor
    await emailService.sendDirectFollowUpEmail({
      to: inquiry.email,
      recipientName: inquiry.name,
      subject: String(subject).trim(),
      message: String(message).trim(),
      ctaUrl: `${emailService.getClientUrl()}/programs`,
      ctaText: 'Explore Accredited Programs & Curricula &rarr;',
    });

    // Update status to RESOLVED
    const updated = await prisma.academicInquiry.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        notes: notes ? `${inquiry.notes ? `${inquiry.notes}\n` : ''}${notes}` : inquiry.notes,
        respondedById: req.user?.id,
        respondedAt: new Date(),
      },
      include: {
        respondedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const { ipAddress, userAgent } = extractReqMeta(req);
    await logAudit({
      userId: req.user?.id,
      userName: `${req.user?.firstName} ${req.user?.lastName}`,
      userRole: req.user?.role,
      action: 'REPLY_ACADEMIC_INQUIRY',
      resource: 'ACADEMIC_INQUIRY',
      resourceId: id,
      newValue: { replySubject: subject, recipient: inquiry.email },
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      message: `Reply email successfully sent to ${inquiry.email}. Inquiry marked as RESOLVED.`,
      inquiry: updated,
    });
  } catch (error: any) {
    console.error('Error replying to inquiry:', error);
    res.status(500).json({ message: 'Failed to dispatch reply email.' });
  }
};
