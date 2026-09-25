import { Request, Response } from 'express';
import { Role, AcademicLevel } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { placementService } from '../services/placementService.js';

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
        program: true,
        programVersion: true,
        curriculumVersion: true,
        recommendedCohort: true,
        approvedCohort: true,
        decisions: {
          orderBy: { createdAt: 'desc' },
        },
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
    const {
      approvedProgram,
      approvedProgramId,
      approvedProgramVersionId,
      approvedCurriculumVersionId,
      approvedLevel,
      approvedLevelCode,
      approvedCohortId,
      adminNotes,
      action = 'APPROVE',
    } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required to review placements.' });
      return;
    }

    const authorizedRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.COORDINATOR_ADMIN];
    if (!authorizedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Only Academic Board members or Administrators can review placements.' });
      return;
    }

    const validActions = ['APPROVE', 'MODIFY', 'REJECT', 'RETURN_FOR_REASSESSMENT'];
    if (!validActions.includes(action)) {
      res.status(400).json({ message: `Invalid review action: ${action}. Allowed: ${validActions.join(', ')}` });
      return;
    }

    const result = await placementService.reviewPlacementByAcademicBoard({
      placementId,
      action: action as any,
      reviewerUser: req.user,
      approvedProgramId,
      approvedProgramVersionId,
      approvedCurriculumVersionId,
      approvedLevel: approvedLevel || approvedProgram,
      approvedLevelCode: approvedLevelCode as AcademicLevel,
      approvedCohortId,
      adminNotes,
    });

    res.status(200).json({
      message: `Placement ${result.action.toLowerCase()} successfully by Academic Board.`,
      placement: result.placement,
      decision: result.decision,
      readyForAdmission: result.readyForAdmission,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('reviewAndApprovePlacement error:', error);
    res.status(500).json({ message: error.message || 'Failed to review placement' });
  }
};
