import { Response } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.js';
import { progressionService } from '../services/progressionService.js';
import prisma from '../config/prisma.js';

/**
 * Get student's academic journey, including active cohort, completed stages, and progression eligibilities
 */
export const getAcademicJourney = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let targetStudentId = req.params.studentId;

    // If caller is student, resolve their own profile
    if (!targetStudentId) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!profile) {
        res.status(404).json({ message: 'Student profile not found for authenticated user.' });
        return;
      }
      targetStudentId = profile.id;
    }

    const journey = await progressionService.getStudentAcademicJourney(targetStudentId);
    res.status(200).json({ journey });
  } catch (error: any) {
    console.error('getAcademicJourney error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch academic journey.' });
  }
};

/**
 * Academic Board / Staff evaluates level completion and clears student for advancement
 */
export const evaluateLevelCompletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { studentId, cohortId, overrideCriteria, notes } = req.body;

    if (!studentId || !cohortId) {
      res.status(400).json({ message: 'studentId and cohortId are required.' });
      return;
    }

    const result = await progressionService.evaluateLevelCompletion({
      studentId,
      cohortId,
      staffUser: {
        id: req.user.id,
        role: req.user.role as Role,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      },
      overrideCriteria: Boolean(overrideCriteria),
      notes,
    });

    res.status(200).json({
      message: 'Student level completion evaluated successfully.',
      result,
    });
  } catch (error: any) {
    console.error('evaluateLevelCompletion error:', error);
    res.status(400).json({ message: error.message || 'Failed to evaluate level completion.' });
  }
};

/**
 * Student claims an earned progression entitlement and enrolls into an open cohort for their next level
 */
export const claimProgression = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { eligibilityId, targetCohortId } = req.body;

    if (!eligibilityId || !targetCohortId) {
      res.status(400).json({ message: 'eligibilityId and targetCohortId are required.' });
      return;
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentProfile) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }

    const result = await progressionService.claimProgressionEnrollment({
      studentId: studentProfile.id,
      eligibilityId,
      targetCohortId,
      authUser: {
        id: req.user.id,
        role: req.user.role as Role,
        email: req.user.email,
      },
    });

    res.status(200).json({
      message: 'Progression entitlement claimed! You are successfully enrolled in the next level cohort.',
      enrollment: result.enrollment,
      invoice: result.invoice,
    });
  } catch (error: any) {
    console.error('claimProgression error:', error);
    res.status(400).json({ message: error.message || 'Failed to claim progression enrollment.' });
  }
};
