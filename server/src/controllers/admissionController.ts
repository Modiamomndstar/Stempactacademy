import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { admissionService } from '../services/admissionService.js';
import { enrollmentService } from '../services/enrollmentService.js';
import { admissionDocumentService } from '../services/admissionDocumentService.js';

/**
 * Issue an official provisional admission offer to an applicant with an approved placement.
 * POST /api/admissions/issue
 * Authorized: SUPER_ADMIN, ACADEMIC_ADMIN, ADMISSIONS_ADMIN
 */
export const issueAdmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const {
      applicationId,
      cohortId,
      assignedClass,
      orientationDate,
      acceptanceDeadlineDays,
      conditions,
      notes,
    } = req.body;

    if (!applicationId) {
      res.status(400).json({ message: 'applicationId is required' });
      return;
    }

    const result = await admissionService.issueAdmissionOffer({
      applicationId,
      cohortId,
      assignedClass,
      orientationDate,
      acceptanceDeadlineDays,
      conditions,
      notes,
      staffUser: req.user,
    });

    res.status(201).json({
      message: 'Admission offer issued successfully!',
      admission: result.admission,
      admissionNumber: result.admissionNumber,
      cohortCode: result.cohortCode,
      status: result.status,
      invoice: result.invoice,
    });
  } catch (error: any) {
    console.error('issueAdmission error:', error);
    res.status(400).json({ message: error.message || 'Failed to issue admission offer' });
  }
};

/**
 * Fetch all admissions with filters and counts.
 * GET /api/admissions
 * Authorized: SUPER_ADMIN, ACADEMIC_ADMIN, ADMISSIONS_ADMIN, FINANCE_ADMIN
 */
export const getAdmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, cohortId, programId } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (cohortId) where.cohortId = String(cohortId);
    if (programId) where.programId = String(programId);

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        application: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        cohort: {
          include: { program: true },
        },
        financialClearances: { orderBy: { createdAt: 'desc' }, take: 1 },
        enrollments: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.status(200).json({ admissions, count: admissions.length });
  } catch (error: any) {
    console.error('getAdmissions error:', error);
    res.status(500).json({ message: 'Failed to fetch admissions' });
  }
};

/**
 * Fetch a single admission offer by ID, admissionNumber, or studentIdNumber.
 * GET /api/admissions/:number
 * Strict PII/Ownership authorization.
 */
export const getAdmissionByNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { number } = req.params;
    const admission = await admissionService.getAdmission(number, req.user);

    // Verify admission ownership or parent/staff link
    const isOwner = admission.application?.userId && admission.application.userId === req.user.id;
    const staffRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.ADMISSIONS_ADMIN,
      Role.FINANCE_ADMIN,
      Role.COORDINATOR_ADMIN,
      Role.PROGRAM_COORDINATOR,
      Role.INSTRUCTOR,
      Role.PARENT,
    ];
    if (!isOwner && !staffRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied: You are not authorized to view this admission record.' });
      return;
    }

    res.status(200).json({ admission });
  } catch (error: any) {
    console.error('getAdmissionByNumber error:', error);
    if (error.message?.includes('Access denied')) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error.message?.includes('not found')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to fetch admission record' });
  }
};

/**
 * Applicant accepts an active admission offer.
 * POST /api/admissions/:admissionId/accept
 */
export const acceptAdmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { admissionId } = req.params;
    const admission = await admissionService.acceptAdmissionOffer({
      admissionId,
      authUser: req.user,
    });

    res.status(200).json({
      message: 'Admission offer accepted successfully! Proceed to tuition fee payment for enrollment clearance.',
      admission,
    });
  } catch (error: any) {
    console.error('acceptAdmission error:', error);
    if (error.message?.includes('Access denied')) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to accept admission offer' });
  }
};

/**
 * Applicant declines an admission offer.
 * POST /api/admissions/:admissionId/decline
 */
export const declineAdmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { admissionId } = req.params;
    const { reason } = req.body;

    const admission = await admissionService.declineAdmissionOffer({
      admissionId,
      authUser: req.user,
      reason,
    });

    res.status(200).json({
      message: 'Admission offer declined.',
      admission,
    });
  } catch (error: any) {
    console.error('declineAdmission error:', error);
    if (error.message?.includes('Access denied')) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to decline admission offer' });
  }
};

/**
 * Staff withdraws or revokes an admission offer.
 * POST /api/admissions/:admissionId/withdraw
 * Authorized: SUPER_ADMIN, ACADEMIC_ADMIN, ADMISSIONS_ADMIN
 */
export const withdrawAdmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { admissionId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ message: 'A reason is required to withdraw an admission offer.' });
      return;
    }

    const admission = await admissionService.withdrawAdmissionOffer({
      admissionId,
      staffUser: req.user,
      reason,
    });

    res.status(200).json({
      message: 'Admission offer withdrawn successfully.',
      admission,
    });
  } catch (error: any) {
    console.error('withdrawAdmission error:', error);
    if (error.message?.includes('Access denied')) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to withdraw admission offer' });
  }
};

/**
 * Check enrollment eligibility for an applicant admission offer.
 * GET /api/admissions/:admissionId/eligibility
 */
export const checkEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { admissionId } = req.params;
    const result = await enrollmentService.checkEligibility(admissionId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('checkEligibility error:', error);
    res.status(500).json({ message: 'Failed to check enrollment eligibility' });
  }
};

/**
 * Finalize enrollment for an admitted, cleared applicant into their cohort.
 * POST /api/admissions/:admissionId/enroll
 * Authorized: SUPER_ADMIN, ACADEMIC_ADMIN, ADMISSIONS_ADMIN, or self-enrollment by cleared applicant
 */
export const enrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { admissionId } = req.params;
    const { notes } = req.body;

    const result = await enrollmentService.enrollStudent({
      admissionId,
      authUser: req.user,
      notes,
    });

    res.status(201).json({
      message: 'Student enrolled successfully and official dashboard activated!',
      enrollment: result.enrollment,
      studentProfile: result.studentProfile,
      admission: result.admission,
    });
  } catch (error: any) {
    console.error('enrollStudent error:', error);
    if (error.message?.includes('capacity reached')) {
      res.status(409).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to enroll student' });
  }
};

/**
 * Generate admission letter document / preview.
 * GET /api/admissions/:admissionId/document
 */
export const getAdmissionDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const { admissionId } = req.params;
    const document = await admissionDocumentService.generateAdmissionDocument(
      admissionId,
      { id: req.user.id, role: req.user.role }
    );
    res.status(200).json({ success: true, data: document });
  } catch (error: any) {
    console.error('getAdmissionDocument error:', error);
    if (error.message?.includes('Unauthorized')) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to generate admission document' });
  }
};

/**
 * Trigger official automated admission letter delivery.
 * POST /api/admissions/:admissionId/deliver-letter
 * Enforces Phase 6 clearance requirements.
 */
export const deliverAdmissionLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const { admissionId } = req.params;
    const result = await admissionDocumentService.triggerOfficialAdmissionDelivery(
      admissionId,
      req.user.id
    );

    if (!result.enqueued) {
      res.status(422).json({
        success: false,
        message: result.reason || 'Official admission letter delivery requirements not met.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Official admission letter delivery successfully enqueued.',
      outboxId: result.outboxId,
    });
  } catch (error: any) {
    console.error('deliverAdmissionLetter error:', error);
    res.status(400).json({ message: error.message || 'Failed to deliver admission letter' });
  }
};

