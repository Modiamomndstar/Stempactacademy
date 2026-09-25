import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { getJwtSecret } from '../config/jwt.js';
import { assessmentService } from '../services/assessmentService.js';
import { placementService } from '../services/placementService.js';

export const getAssessmentForProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, applicationId } = req.query;

    const data = await assessmentService.getAssessmentForProgram({
      programId: programId ? String(programId) : undefined,
      applicationId: applicationId ? String(applicationId) : undefined,
    });

    if (!data || !data.assessment) {
      res.status(404).json({ message: 'No diagnostic assessment found for this program.' });
      return;
    }

    res.status(200).json({
      assessment: {
        id: data.assessment.id,
        title: data.currentVersion?.title || data.assessment.title,
        programId: data.assessment.programId,
        durationMinutes: data.currentVersion?.durationMinutes || data.assessment.durationMinutes,
        passingScore: data.currentVersion?.passingScore || data.assessment.passingScore,
        instructions: data.currentVersion?.instructions || data.assessment.instructions,
        versionNumber: data.currentVersion?.versionNumber || 1,
        questions: data.questions.map((q) => ({
          id: q.id,
          category: q.category,
          type: q.type,
          prompt: q.prompt,
          codeSnippet: q.codeSnippet,
          options: q.options,
          points: q.points,
          order: q.order,
        })),
      },
    });
  } catch (error: any) {
    console.error('getAssessmentForProgram error:', error);
    res.status(500).json({ message: 'Failed to fetch assessment questions' });
  }
};

export const submitAssessmentAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId, assessmentId, programId, answers } = req.body;

    if (!assessmentId || !answers) {
      res.status(400).json({ message: 'assessmentId and answers are required.' });
      return;
    }

    // Extract user from token if present or req.user (preserving Phase 1 auth handling)
    let authUser = req.user;
    if (!authUser && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        if (decoded?.id) {
          const u = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, isActive: true },
          });
          if (u && u.isActive) {
            authUser = u as any;
          }
        }
      } catch (tokenErr) {
        // Continue to check
      }
    }

    if (!authUser) {
      res.status(401).json({ message: 'Authentication required. Please log in or submit your application first.' });
      return;
    }

    if (applicationId && applicationId !== 'demo-applicant-session') {
      const application = await prisma.application.findUnique({
        where: { id: String(applicationId) },
      });
      if (application) {
        const isOwner =
          (application.userId && application.userId === authUser.id) ||
          (application.email && application.email.toLowerCase() === authUser.email.toLowerCase());
        const staffRoles: Role[] = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN];
        const isStaff = staffRoles.includes(authUser.role);

        if (!isOwner && !isStaff) {
          res.status(403).json({
            message: 'Forbidden: You are not authorized to submit assessments for this application.',
          });
          return;
        }
      }
    }

    // Delegate to canonical placementService for scoring, rules evaluation, and persistence
    const result = await placementService.recordAssessmentAttempt({
      applicationId: applicationId && applicationId !== 'demo-applicant-session' ? String(applicationId) : undefined,
      assessmentId: String(assessmentId),
      programId: programId ? String(programId) : undefined,
      answers,
      authUser,
    });

    res.status(200).json({
      message: 'Assessment completed successfully. Your results have been submitted to the Academic Board for review.',
      attempt: {
        id: result.attempt.id,
        score: result.attempt.score,
        maxScore: result.attempt.maxScore,
        percentage: Math.round(result.attempt.percentage),
        categoryScores: result.scoreResult.categoryPercentages,
        recommendedProgram: result.programName,
        recommendedLevel: result.recommendation.recommendedLevel,
        recommendationReason: result.recommendation.rationale,
      },
      placementId: result.placement.id,
      status: 'PENDING_ACADEMIC_REVIEW',
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('submitAssessmentAttempt error:', error);
    res.status(500).json({ message: error.message || 'Failed to record assessment score' });
  }
};
