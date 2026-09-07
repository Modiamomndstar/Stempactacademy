import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getAssessmentForProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, applicationId } = req.query;

    let targetProgramId = programId ? String(programId) : undefined;

    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: String(applicationId) },
        select: { programId: true },
      });
      if (app) targetProgramId = app.programId;
    }

    // Find assessment specifically for program or fallback to general STEM diagnostic test
    let assessment = targetProgramId
      ? await prisma.assessment.findFirst({
          where: { programId: targetProgramId },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                category: true,
                type: true,
                prompt: true,
                codeSnippet: true,
                options: true,
                points: true,
                order: true,
              },
            },
          },
        })
      : null;

    if (!assessment) {
      assessment = await prisma.assessment.findFirst({
        include: {
          questions: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              category: true,
              type: true,
              prompt: true,
              codeSnippet: true,
              options: true,
              points: true,
              order: true,
            },
          },
        },
      });
    }

    if (!assessment) {
      res.status(404).json({ message: 'No diagnostic assessment found for this program.' });
      return;
    }

    res.status(200).json({ assessment });
  } catch (error: any) {
    console.error('getAssessmentForProgram error:', error);
    res.status(500).json({ message: 'Failed to fetch assessment questions' });
  }
};

export const submitAssessmentAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId, assessmentId, answers } = req.body;
    // answers is an object mapping questionId to selected answer string or index

    if (!applicationId || !assessmentId || !answers) {
      res.status(400).json({ message: 'applicationId, assessmentId, and answers are required.' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { program: true },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId },
    });

    let totalScore = 0;
    let maxPossibleScore = 0;
    const categoryTotals: Record<string, { earned: number; max: number }> = {};

    questions.forEach((q) => {
      const qPoints = q.points || 5;
      maxPossibleScore += qPoints;

      if (!categoryTotals[q.category]) {
        categoryTotals[q.category] = { earned: 0, max: 0 };
      }
      categoryTotals[q.category].max += qPoints;

      const studentAns = answers[q.id];
      let isCorrect = false;

      if (studentAns !== undefined) {
        // Compare string values directly or matched options
        let parsedOptions: string[] = [];
        try {
          parsedOptions = JSON.parse(q.options);
        } catch (e) {
          parsedOptions = [];
        }

        const selectedText =
          typeof studentAns === 'number' && parsedOptions[studentAns]
            ? parsedOptions[studentAns]
            : String(studentAns).trim();

        if (selectedText.toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          isCorrect = true;
          totalScore += qPoints;
          categoryTotals[q.category].earned += qPoints;
        }
      }
    });

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Build category percentages
    const categoryPercentages: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryTotals)) {
      categoryPercentages[cat] = data.max > 0 ? Math.round((data.earned / data.max) * 100) : 0;
    }

    // Determine algorithmic recommendation based on score and category strengths
    let recommendedLevel = 'Level 1 (Foundation)';
    let recommendationReason = 'Solid foundation. Recommended to start with Level 1 to build core competencies.';

    if (percentage >= 80) {
      recommendedLevel = 'Level 2 (Accelerated / Intermediate)';
      recommendationReason = `High performance (${percentage.toFixed(1)}%). Demonstrated high competency in logical reasoning and core technical concepts. Recommended for accelerated Level 2 placement.`;
    } else if (percentage >= 60) {
      recommendedLevel = 'Level 1 (Standard Track)';
      recommendationReason = `Passed assessment (${percentage.toFixed(1)}%). Suitable for comprehensive Level 1 immersion with standard practical milestones.`;
    } else {
      recommendedLevel = 'Level 1 (Foundational Track with Mentorship)';
      recommendationReason = `Score (${percentage.toFixed(1)}%). Recommended for Level 1 with dedicated peer-mentorship and digital literacy support.`;
    }

    // Record Assessment Attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        applicationId: application.id,
        userId: application.userId || (req.user ? req.user.id : null),
        assessmentId,
        score: totalScore,
        maxScore: maxPossibleScore,
        percentage,
        categoryScores: JSON.stringify(categoryPercentages),
        answers: JSON.stringify(answers),
        recommendedProgram: application.program.name,
        recommendedLevel,
        recommendationReason,
      },
    });

    // Create or update Placement record in PENDING_REVIEW state (never purely automated!)
    const placement = await prisma.placement.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        assessmentAttemptId: attempt.id,
        recommendedProgram: application.program.name,
        recommendedLevel,
        reason: recommendationReason,
        status: 'PENDING_REVIEW',
      },
      update: {
        assessmentAttemptId: attempt.id,
        recommendedProgram: application.program.name,
        recommendedLevel,
        reason: recommendationReason,
        status: 'PENDING_REVIEW',
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'ASSESSED' },
    });

    res.status(200).json({
      message: 'Assessment completed successfully. Your results have been submitted to the Academic Board for review.',
      attempt: {
        id: attempt.id,
        score: totalScore,
        maxScore: maxPossibleScore,
        percentage: Math.round(percentage),
        categoryScores: categoryPercentages,
        recommendedProgram: application.program.name,
        recommendedLevel,
        recommendationReason,
      },
      placementId: placement.id,
      status: 'PENDING_ACADEMIC_REVIEW',
    });
  } catch (error: any) {
    console.error('submitAssessmentAttempt error:', error);
    res.status(500).json({ message: 'Failed to record assessment score' });
  }
};
