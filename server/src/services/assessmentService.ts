import { WorkflowStatus, AcademicLevel } from '@prisma/client';
import prisma from '../config/prisma.js';

export interface ScoreCalculationResult {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  categoryPercentages: Record<string, number>;
  categoryTotals: Record<string, { earned: number; max: number }>;
  isPassing: boolean;
  detailedResults: Array<{
    questionId: string;
    category: string;
    points: number;
    earned: number;
    isCorrect: boolean;
    studentAnswer: any;
    correctAnswer: string;
  }>;
}

export interface QuestionDefinition {
  id: string;
  category: string;
  type: string;
  prompt: string;
  codeSnippet?: string | null;
  options: string;
  correctAnswer: string;
  points: number;
  order: number;
}

export class AssessmentService {
  /**
   * Deterministic scoring function.
   * Given a set of questions and submitted answers, always returns identical results.
   */
  static calculateAssessmentScore(
    questions: QuestionDefinition[],
    answers: Record<string, any>
  ): ScoreCalculationResult {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const categoryTotals: Record<string, { earned: number; max: number }> = {};
    const detailedResults: ScoreCalculationResult['detailedResults'] = [];

    // Sort questions by order ascending to guarantee deterministic evaluation order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    for (const q of sortedQuestions) {
      const qPoints = q.points || 5;
      maxPossibleScore += qPoints;

      if (!categoryTotals[q.category]) {
        categoryTotals[q.category] = { earned: 0, max: 0 };
      }
      categoryTotals[q.category].max += qPoints;

      const studentAns = answers[q.id];
      let isCorrect = false;

      if (studentAns !== undefined && studentAns !== null) {
        let parsedOptions: string[] = [];
        try {
          parsedOptions = JSON.parse(q.options);
        } catch {
          parsedOptions = [];
        }

        const selectedText =
          typeof studentAns === 'number' && parsedOptions[studentAns] !== undefined
            ? parsedOptions[studentAns]
            : String(studentAns).trim();

        if (selectedText.toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          isCorrect = true;
          totalScore += qPoints;
          categoryTotals[q.category].earned += qPoints;
        }
      }

      detailedResults.push({
        questionId: q.id,
        category: q.category,
        points: qPoints,
        earned: isCorrect ? qPoints : 0,
        isCorrect,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
      });
    }

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const categoryPercentages: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryTotals)) {
      categoryPercentages[cat] = data.max > 0 ? Math.round((data.earned / data.max) * 100) : 0;
    }

    return {
      totalScore,
      maxPossibleScore,
      percentage,
      categoryPercentages,
      categoryTotals,
      isPassing: percentage >= 60,
      detailedResults,
    };
  }

  /**
   * Resolves the canonical Assessment and current AssessmentVersion for a program or application.
   */
  static async getAssessmentForProgram(params: {
    programId?: string;
    applicationId?: string;
  }) {
    let targetProgramId = params.programId;

    if (params.applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: params.applicationId },
        select: { programId: true },
      });
      if (app) targetProgramId = app.programId;
    }

    // 1. Find assessment specifically for program
    let assessment = targetProgramId
      ? await prisma.assessment.findFirst({
          where: { programId: targetProgramId },
          include: {
            versions: {
              where: { isCurrent: true },
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        })
      : null;

    // 2. Fallback to school assessment
    if (!assessment && targetProgramId) {
      const targetProg = await prisma.program.findUnique({
        where: { id: targetProgramId },
        select: { schoolId: true },
      });
      if (targetProg?.schoolId) {
        assessment = await prisma.assessment.findFirst({
          where: {
            program: { schoolId: targetProg.schoolId },
          },
          include: {
            versions: {
              where: { isCurrent: true },
              include: {
                questions: { orderBy: { order: 'asc' } },
              },
            },
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        });
      }
    }

    // 3. Fallback to general STEM assessment
    if (!assessment) {
      assessment = await prisma.assessment.findFirst({
        include: {
          versions: {
            where: { isCurrent: true },
            include: {
              questions: { orderBy: { order: 'asc' } },
            },
          },
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    if (!assessment) return null;

    // Ensure an AssessmentVersion exists
    let currentVersion = assessment.versions[0] || null;
    if (!currentVersion) {
      // Find current program version to link
      const pv = await prisma.programVersion.findFirst({
        where: { programId: assessment.programId, isCurrent: true },
      });

      currentVersion = await prisma.assessmentVersion.create({
        data: {
          assessmentId: assessment.id,
          versionNumber: 1,
          title: assessment.title,
          instructions: assessment.instructions,
          durationMinutes: assessment.durationMinutes,
          passingScore: assessment.passingScore,
          status: WorkflowStatus.PUBLISHED,
          isCurrent: true,
          programVersionId: pv?.id || null,
          curriculumVersionId: pv?.curriculumVersionId || null,
        },
        include: { questions: { orderBy: { order: 'asc' } } },
      });

      // Link any questions to this version
      if (assessment.questions.length > 0) {
        await prisma.assessmentQuestion.updateMany({
          where: { assessmentId: assessment.id, assessmentVersionId: null },
          data: { assessmentVersionId: currentVersion.id },
        });
      }
    }

    return {
      assessment,
      currentVersion,
      questions: currentVersion.questions && currentVersion.questions.length > 0
        ? currentVersion.questions
        : assessment.questions,
    };
  }
}

export const assessmentService = AssessmentService;
