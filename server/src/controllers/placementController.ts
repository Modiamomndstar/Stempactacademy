import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getPendingPlacements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = String(status);
    }

    const placements = await prisma.placement.findMany({
      where,
      include: {
        application: {
          include: {
            program: { include: { school: true } },
            cohort: true,
          },
        },
        assessmentAttempt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ placements, count: placements.length });
  } catch (error: any) {
    console.error('getPendingPlacements error:', error);
    res.status(500).json({ message: 'Failed to retrieve placements' });
  }
};

export const reviewAndApprovePlacement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { placementId } = req.params;
    const { approvedProgram, approvedLevel, approvedCohortId, adminNotes, action } = req.body;
    // action: 'APPROVE' | 'MODIFY' | 'REJECT'

    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        application: {
          include: { program: true },
        },
        assessmentAttempt: true,
      },
    });

    if (!placement) {
      res.status(404).json({ message: 'Placement record not found' });
      return;
    }

    const reviewerName = req.user
      ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})`
      : 'Academic Admissions Board';

    const isRejected = action === 'REJECT';
    const placementStatus = isRejected ? 'REJECTED' : action === 'MODIFY' ? 'MODIFIED' : 'APPROVED';

    const finalProgram = approvedProgram || placement.recommendedProgram;
    const finalLevel = approvedLevel || placement.recommendedLevel;

    const updatedPlacement = await prisma.placement.update({
      where: { id: placementId },
      data: {
        approvedProgram: finalProgram,
        approvedLevel: finalLevel,
        approvedCohortCode: approvedCohortId || null,
        adminNotes: adminNotes || 'Approved following academic diagnostic assessment review.',
        reviewerName,
        status: placementStatus,
        reviewedAt: new Date(),
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id: placement.applicationId },
      data: {
        status: isRejected ? 'REJECTED' : 'PLACED',
      },
    });

    res.status(200).json({
      message: `Placement ${placementStatus.toLowerCase()} successfully by Academic Board.`,
      placement: updatedPlacement,
      readyForAdmission: !isRejected,
    });
  } catch (error: any) {
    console.error('reviewAndApprovePlacement error:', error);
    res.status(500).json({ message: 'Failed to review placement' });
  }
};
