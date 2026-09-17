import { z } from 'zod';
import { AIActionType, WorkflowStatus } from '@prisma/client';

export interface AIProviderConfig {
  provider: 'groq' | 'google-gemini' | 'openai' | 'anthropic' | 'mock';
  apiKey?: string;
  model: string;
}

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  model?: string;
}

export interface AIGenerationResult<T = any> {
  structured: T;
  rawText: string;
  tokensPrompt: number;
  tokensCompletion: number;
  costEstimate: number;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface IAIProvider {
  name: string;
  generateStructured<T>(prompt: string, schema: z.ZodType<T>, options?: AIOptions): Promise<AIGenerationResult<T>>;
  generateText(prompt: string, options?: AIOptions): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number; latencyMs: number }>;
}

// ---------------------------------------------------------------------------
// ZOD SCHEMAS FOR STRUCTURED ACADEMIC ARTIFACTS
// ---------------------------------------------------------------------------

export const ProgramGenerationSchema = z.object({
  name: z.string(),
  code: z.string(),
  schoolCode: z.string(),
  description: z.string(),
  targetLearner: z.string(),
  entryRequirements: z.string(),
  prerequisites: z.string(),
  level: z.enum([
    'LEVEL_0_ASSESSMENT',
    'LEVEL_1_FOUNDATION',
    'LEVEL_2_INTERMEDIATE',
    'LEVEL_3_ADVANCED',
    'LEVEL_4_SPECIALIST',
    'LEVEL_5_INNOVATION',
    'LEVEL_6_ENTREPRENEURSHIP',
  ]),
  duration: z.string(),
  contactHours: z.number().int().positive(),
  theoryPracticalRatio: z.string(),
  tools: z.array(z.string()),
  learningOutcomes: z.array(z.string()),
  careerPathways: z.array(z.string()),
  courses: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      description: z.string(),
      credits: z.number().default(3),
      order: z.number(),
      modules: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          durationHours: z.number(),
          order: z.number(),
          lessons: z.array(
            z.object({
              title: z.string(),
              contentSummary: z.string(),
              practicalActivities: z.array(z.string()),
            })
          ),
        })
      ),
    })
  ),
  competencies: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
    })
  ),
  capstoneProject: z.object({
    title: z.string(),
    problemStatement: z.string(),
    expectedOutputs: z.string(),
    durationWeeks: z.number(),
  }),
  certificationRequirements: z.string(),
});

export type ProgramGenerationData = z.infer<typeof ProgramGenerationSchema>;

export const CurriculumGenerationSchema = z.object({
  title: z.string(),
  totalHours: z.number(),
  theoryPracticalRatio: z.string(),
  courseSequence: z.array(
    z.object({
      courseCode: z.string(),
      title: z.string(),
      prerequisites: z.array(z.string()),
      expectedCompetencies: z.array(z.string()),
      hours: z.number(),
    })
  ),
  competenciesFramework: z.array(
    z.object({
      competencyCode: z.string(),
      skillName: z.string(),
      performanceCriteria: z.string(),
    })
  ),
});

export type CurriculumGenerationData = z.infer<typeof CurriculumGenerationSchema>;

export const SyllabusGenerationSchema = z.object({
  title: z.string(),
  contactHoursPerWeek: z.number(),
  weeklyOutline: z.array(
    z.object({
      week: z.number(),
      topic: z.string(),
      courseCode: z.string(),
      moduleTitle: z.string(),
      learningObjectives: z.array(z.string()),
      theoryHours: z.number(),
      practicalHours: z.number(),
      practicalActivity: z.string(),
      assignmentTitle: z.string().optional(),
      assessmentQuiz: z.string().optional(),
    })
  ),
});

export type SyllabusGenerationData = z.infer<typeof SyllabusGenerationSchema>;

export const AssessmentQuestionItemSchema = z.object({
  questionText: z.string(),
  questionType: z.enum(['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'CODING', 'PRACTICAL_TASK']),
  category: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z.number().default(5),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  rubric: z.string().optional(),
});

export const AssessmentGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  timeLimitMinutes: z.number(),
  passingScorePercentage: z.number(),
  questions: z.array(AssessmentQuestionItemSchema),
});

export type AssessmentGenerationData = z.infer<typeof AssessmentGenerationSchema>;

export const LessonPlanSchema = z.object({
  lessonTitle: z.string(),
  durationMinutes: z.number(),
  targetLevel: z.string(),
  prerequisiteKnowledge: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  equipmentAndSoftware: z.array(z.string()),
  safetyPrecautions: z.string().optional(),
  lessonPhases: z.array(
    z.object({
      phaseName: z.string(),
      allocatedMinutes: z.number(),
      instructorActions: z.string(),
      learnerActions: z.string(),
      keyQuestions: z.array(z.string()),
    })
  ),
  inClassQuizQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  homeworkAssignment: z.object({
    title: z.string(),
    instructions: z.string(),
    submissionDeadlineDays: z.number(),
  }),
});

export type LessonPlanData = z.infer<typeof LessonPlanSchema>;

export const AssignmentGenerationSchema = z.object({
  title: z.string(),
  problemStatement: z.string(),
  detailedInstructions: z.string(),
  expectedDeliverables: z.array(z.string()),
  toolsRequired: z.array(z.string()),
  submissionFormat: z.string(),
  estimatedHours: z.number(),
  gradingRubric: z.array(
    z.object({
      criterion: z.string(),
      weightPercentage: z.number(),
      excellentDescription: z.string(),
      goodDescription: z.string(),
      needsImprovementDescription: z.string(),
    })
  ),
});

export type AssignmentGenerationData = z.infer<typeof AssignmentGenerationSchema>;

export const QualityCheckResultSchema = z.object({
  overallStatus: z.enum(['PASS', 'WARNING', 'ERROR']),
  qualityScore: z.number().min(0).max(100),
  summary: z.string(),
  findings: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(['INFO', 'WARNING', 'ERROR']),
      issue: z.string(),
      recommendation: z.string(),
    })
  ),
});

export type QualityCheckResult = z.infer<typeof QualityCheckResultSchema>;

export const StudentFeedbackSchema = z.object({
  strengths: z.array(z.string()),
  growthAreas: z.array(z.string()),
  constructiveSuggestions: z.string(),
  recommendedReviewModules: z.array(z.string()),
  encouragingClosing: z.string(),
});

export type StudentFeedbackData = z.infer<typeof StudentFeedbackSchema>;
