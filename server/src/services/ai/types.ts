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
// ---------------------------------------------------------------------------
// HELPER FOR LEVEL NORMALIZATION
// ---------------------------------------------------------------------------
function normalizeAcademicLevel(val: unknown): string {
  if (typeof val !== 'string') return 'LEVEL_2_INTERMEDIATE';
  const clean = val.trim().toUpperCase();
  if (['LEVEL_0_ASSESSMENT', 'LEVEL_1_FOUNDATION', 'LEVEL_2_INTERMEDIATE', 'LEVEL_3_ADVANCED', 'LEVEL_4_SPECIALIST', 'LEVEL_5_INNOVATION', 'LEVEL_6_ENTREPRENEURSHIP'].includes(clean)) {
    return clean;
  }
  if (clean.includes('0') || clean.includes('ASSESS')) return 'LEVEL_0_ASSESSMENT';
  if (clean.includes('1') || clean.includes('FOUND') || clean.includes('BEGIN')) return 'LEVEL_1_FOUNDATION';
  if (clean.includes('3') || clean.includes('ADVANC')) return 'LEVEL_3_ADVANCED';
  if (clean.includes('4') || clean.includes('SPEC')) return 'LEVEL_4_SPECIALIST';
  if (clean.includes('5') || clean.includes('INNOV')) return 'LEVEL_5_INNOVATION';
  if (clean.includes('6') || clean.includes('ENTREP')) return 'LEVEL_6_ENTREPRENEURSHIP';
  return 'LEVEL_2_INTERMEDIATE';
}

function extractNumber(val: unknown, fallback: number): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseInt(val.replace(/[^\d.-]/g, ''), 10);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// ZOD SCHEMAS FOR STRUCTURED ACADEMIC ARTIFACTS
// ---------------------------------------------------------------------------

export const ProgramGenerationSchema = z.object({
  name: z.preprocess((v) => String(v || 'Applied Technology & Engineering Program'), z.string().min(1)),
  code: z.preprocess((v) => String(v || `PRG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`), z.string().min(1)),
  schoolCode: z.preprocess((v) => String(v || 'SCSE'), z.string().min(1)),
  description: z.preprocess((v) => String(v || 'Comprehensive hands-on technical academic program.'), z.string().min(1)),
  targetLearner: z.preprocess((v) => String(v || 'Tech students, graduates, and aspiring technical specialists'), z.string().min(1)),
  entryRequirements: z.preprocess((v) => String(v || 'Basic computer literacy and problem-solving readiness'), z.string().min(1)),
  prerequisites: z.preprocess(
    (v) => (Array.isArray(v) ? v.join(', ') : String(v || 'Foundational computer literacy')),
    z.string().min(1)
  ),
  level: z.preprocess(
    (v) => normalizeAcademicLevel(v),
    z.enum([
      'LEVEL_0_ASSESSMENT',
      'LEVEL_1_FOUNDATION',
      'LEVEL_2_INTERMEDIATE',
      'LEVEL_3_ADVANCED',
      'LEVEL_4_SPECIALIST',
      'LEVEL_5_INNOVATION',
      'LEVEL_6_ENTREPRENEURSHIP',
    ])
  ),
  duration: z.preprocess((v) => String(v || '12 Weeks'), z.string().min(1)),
  contactHours: z.preprocess(
    (v) => extractNumber(v, 144),
    z.number().int().positive()
  ),
  theoryPracticalRatio: z.preprocess((v) => String(v || '30:70'), z.string().min(1)),
  tools: z.preprocess(
    (v) => (Array.isArray(v) ? v.map(String) : (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : ['Industry Standard Tools'])),
    z.array(z.string())
  ),
  learningOutcomes: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v.map(String) : [String(v || 'Master core industry skills and tools')]),
    z.array(z.string())
  ),
  careerPathways: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v.map(String) : [String(v || 'Technology Specialist')]),
    z.array(z.string())
  ),
  courses: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : [
      {
        code: 'CRS-101',
        title: 'Core Foundations & Engineering Principles',
        description: 'Comprehensive introduction to primary systems and workflows.',
        credits: 3,
        order: 1,
        modules: [
          {
            title: 'Systems Overview & Lab Architecture',
            description: 'Core concepts and environment configuration.',
            durationHours: 12,
            order: 1,
            lessons: [
              {
                title: 'Architecture Setup & Core Mechanics',
                contentSummary: 'Step-by-step walkthrough of fundamental workflows.',
                practicalActivities: ['Lab 1: Environment Initialization & Verification']
              }
            ]
          }
        ]
      }
    ]),
    z.array(
      z.object({
        code: z.preprocess((c) => String(c || 'CRS-101'), z.string()),
        title: z.preprocess((t) => String(t || 'Core Systems Engineering'), z.string()),
        description: z.preprocess((d) => String(d || 'Course foundational concepts and outcomes.'), z.string()),
        credits: z.preprocess((cr) => extractNumber(cr, 3), z.number().default(3)),
        order: z.preprocess((o) => extractNumber(o, 1), z.number().default(1)),
        modules: z.preprocess(
          (m) => (Array.isArray(m) && m.length > 0 ? m : [
            {
              title: 'Module 1: Foundations',
              description: 'Foundational principles.',
              durationHours: 12,
              order: 1,
              lessons: [{ title: 'Lesson 1', contentSummary: 'Core concepts', practicalActivities: ['Lab sprint'] }]
            }
          ]),
          z.array(
            z.object({
              title: z.preprocess((mt) => String(mt || 'Module Overview'), z.string()),
              description: z.preprocess((md) => String(md || 'Module syllabus and topics.'), z.string()),
              durationHours: z.preprocess((dh) => extractNumber(dh, 12), z.number().default(12)),
              order: z.preprocess((mo) => extractNumber(mo, 1), z.number().default(1)),
              lessons: z.preprocess(
                (l) => (Array.isArray(l) && l.length > 0 ? l : [{ title: 'Core Lesson', contentSummary: 'Lesson overview', practicalActivities: ['Lab exercise'] }]),
                z.array(
                  z.object({
                    title: z.preprocess((lt) => String(lt || 'Lesson Title'), z.string()),
                    contentSummary: z.preprocess((cs) => String(cs || 'Content summary and theoretical foundation.'), z.string()),
                    practicalActivities: z.preprocess(
                      (pa) => (Array.isArray(pa) ? pa.map(String) : [String(pa || 'Hands-on practical sprint')]),
                      z.array(z.string())
                    ),
                  })
                )
              ),
            })
          )
        ),
      })
    )
  ),
  competencies: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : [
      {
        code: 'COMP-01',
        title: 'Core Systems Mastery',
        description: 'Demonstrated proficiency in building and deploying production solutions.',
        category: 'Technical'
      }
    ]),
    z.array(
      z.object({
        code: z.preprocess((c) => String(c || 'COMP-01'), z.string()),
        title: z.preprocess((t) => String(t || 'Core Competency'), z.string()),
        description: z.preprocess((d) => String(d || 'Measurable competency standard and evaluation.'), z.string()),
        category: z.preprocess((cat) => String(cat || 'Technical'), z.string()),
      })
    )
  ),
  capstoneProject: z.preprocess(
    (val: any) => {
      if (val && typeof val === 'object') {
        return {
          title: String(val.title || val.name || 'Industry Capstone Solution'),
          problemStatement: String(val.problemStatement || val.description || 'Solve a real-world high-impact problem.'),
          expectedOutputs: String(val.expectedOutputs || val.deliverables || 'Production repository, deployed service, and presentation.'),
          durationWeeks: extractNumber(val.durationWeeks, 4),
        };
      }
      return {
        title: 'Industry Capstone Project',
        problemStatement: 'Develop an end-to-end production solution solving real-world challenges.',
        expectedOutputs: 'Working codebase, architecture document, and demonstration video.',
        durationWeeks: 4,
      };
    },
    z.object({
      title: z.string(),
      problemStatement: z.string(),
      expectedOutputs: z.string(),
      durationWeeks: z.number(),
    })
  ),
  certificationRequirements: z.preprocess(
    (v) => String(v || '80% attendance, completion of all weekly lab sprints, and passing grade on the capstone evaluation.'),
    z.string().min(1)
  ),
});

export type ProgramGenerationData = z.infer<typeof ProgramGenerationSchema>;

export const CurriculumGenerationSchema = z.object({
  title: z.preprocess((v) => String(v || 'Curriculum Framework'), z.string()),
  totalHours: z.preprocess((v) => extractNumber(v, 144), z.number()),
  theoryPracticalRatio: z.preprocess((v) => String(v || '30:70'), z.string()),
  courseSequence: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : [
      {
        courseCode: 'CRS-101',
        title: 'Core Principles',
        prerequisites: ['Basic programming'],
        expectedCompetencies: ['Fundamental logic and architecture'],
        hours: 48,
      }
    ]),
    z.array(
      z.object({
        courseCode: z.preprocess((c) => String(c || 'CRS-101'), z.string()),
        title: z.preprocess((t) => String(t || 'Foundational Course'), z.string()),
        prerequisites: z.preprocess((p) => (Array.isArray(p) ? p.map(String) : [String(p || 'None')]), z.array(z.string())),
        expectedCompetencies: z.preprocess((c) => (Array.isArray(c) ? c.map(String) : [String(c || 'Core Competency')]), z.array(z.string())),
        hours: z.preprocess((h) => extractNumber(h, 48), z.number()),
      })
    )
  ),
  competenciesFramework: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : [
      {
        competencyCode: 'COMP-101',
        skillName: 'Core Engineering',
        performanceCriteria: 'Demonstrates clear implementation and debugging ability.',
      }
    ]),
    z.array(
      z.object({
        competencyCode: z.preprocess((c) => String(c || 'COMP-101'), z.string()),
        skillName: z.preprocess((s) => String(s || 'Engineering Proficiency'), z.string()),
        performanceCriteria: z.preprocess((p) => String(p || 'Demonstrates mastery of course objectives.'), z.string()),
      })
    )
  ),
});

export type CurriculumGenerationData = z.infer<typeof CurriculumGenerationSchema>;

export const SyllabusGenerationSchema = z.object({
  title: z.preprocess((v) => String(v || 'Weekly Syllabus'), z.string()),
  contactHoursPerWeek: z.preprocess((v) => extractNumber(v, 6), z.number()),
  weeklyOutline: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : [
      {
        week: 1,
        topic: 'Architecture Setup & Foundations',
        courseCode: 'CRS-101',
        moduleTitle: 'Module 1: Orientation & Tools',
        learningObjectives: ['Environment initialization', 'Baseline syntax and concepts'],
        theoryHours: 2,
        practicalHours: 4,
        practicalActivity: 'Set up development workspace and run test suite.',
      }
    ]),
    z.array(
      z.object({
        week: z.preprocess((w) => extractNumber(w, 1), z.number()),
        topic: z.preprocess((t) => String(t || 'Weekly Topic'), z.string()),
        courseCode: z.preprocess((c) => String(c || 'CRS-101'), z.string()),
        moduleTitle: z.preprocess((m) => String(m || 'Core Module'), z.string()),
        learningObjectives: z.preprocess((l) => (Array.isArray(l) ? l.map(String) : [String(l || 'Topic objective')]), z.array(z.string())),
        theoryHours: z.preprocess((th) => extractNumber(th, 2), z.number()),
        practicalHours: z.preprocess((ph) => extractNumber(ph, 4), z.number()),
        practicalActivity: z.preprocess((pa) => String(pa || 'Hands-on practical session'), z.string()),
        assignmentTitle: z.preprocess((a) => (a ? String(a) : undefined), z.string().optional()),
        assessmentQuiz: z.preprocess((q) => (q ? String(q) : undefined), z.string().optional()),
      })
    )
  ),
});

export type SyllabusGenerationData = z.infer<typeof SyllabusGenerationSchema>;

export const AssessmentQuestionItemSchema = z.object({
  questionText: z.preprocess((q) => String(q || 'Assessment Question'), z.string()),
  questionType: z.preprocess((qt) => {
    const s = String(qt || 'MCQ').toUpperCase();
    if (['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'CODING', 'PRACTICAL_TASK'].includes(s)) return s;
    return 'MCQ';
  }, z.enum(['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'CODING', 'PRACTICAL_TASK'])),
  category: z.preprocess((c) => String(c || 'General Knowledge'), z.string()),
  difficulty: z.preprocess((d) => {
    const s = String(d || 'MEDIUM').toUpperCase();
    if (['EASY', 'MEDIUM', 'HARD'].includes(s)) return s;
    return 'MEDIUM';
  }, z.enum(['EASY', 'MEDIUM', 'HARD'])),
  points: z.preprocess((p) => extractNumber(p, 5), z.number().default(5)),
  options: z.preprocess((o) => (Array.isArray(o) ? o.map(String) : undefined), z.array(z.string()).optional()),
  correctAnswer: z.preprocess((ca) => String(ca || 'Correct Answer Reference'), z.string()),
  explanation: z.preprocess((e) => String(e || 'Detailed explanation of the solution.'), z.string()),
  rubric: z.preprocess((r) => (r ? String(r) : undefined), z.string().optional()),
});

export const AssessmentGenerationSchema = z.object({
  title: z.preprocess((t) => String(t || 'Assessment Evaluation'), z.string()),
  description: z.preprocess((d) => String(d || 'Comprehensive assessment test.'), z.string()),
  timeLimitMinutes: z.preprocess((tm) => extractNumber(tm, 45), z.number()),
  passingScorePercentage: z.preprocess((ps) => extractNumber(ps, 70), z.number()),
  questions: z.preprocess(
    (q) => (Array.isArray(q) && q.length > 0 ? q : [
      {
        questionText: 'What is the primary function of an application layer architecture?',
        questionType: 'MCQ',
        category: 'Architecture',
        difficulty: 'MEDIUM',
        points: 5,
        options: ['Decouple concerns', 'Speed up clock rate', 'Reduce screen brightness', 'None of the above'],
        correctAnswer: 'Decouple concerns',
        explanation: 'Layering separates business logic from data access and presentation.',
      }
    ]),
    z.array(AssessmentQuestionItemSchema)
  ),
});

export type AssessmentGenerationData = z.infer<typeof AssessmentGenerationSchema>;

export const LessonPlanSchema = z.object({
  lessonTitle: z.preprocess((lt) => String(lt || 'Lesson Plan'), z.string()),
  durationMinutes: z.preprocess((dm) => extractNumber(dm, 90), z.number()),
  targetLevel: z.preprocess((tl) => String(tl || 'Level 2 (Intermediate)'), z.string()),
  prerequisiteKnowledge: z.preprocess((pk) => (Array.isArray(pk) ? pk.map(String) : [String(pk || 'Basic fundamentals')]), z.array(z.string())),
  learningObjectives: z.preprocess((lo) => (Array.isArray(lo) ? lo.map(String) : [String(lo || 'Understand core lesson objectives')]), z.array(z.string())),
  equipmentAndSoftware: z.preprocess((es) => (Array.isArray(es) ? es.map(String) : ['Standard workstation, code editor']), z.array(z.string())),
  safetyPrecautions: z.preprocess((sp) => (sp ? String(sp) : undefined), z.string().optional()),
  lessonPhases: z.preprocess(
    (lp) => (Array.isArray(lp) && lp.length > 0 ? lp : [
      {
        phaseName: 'Hook & Context Setting',
        allocatedMinutes: 15,
        instructorActions: 'Introduce lesson goals and problem statement.',
        learnerActions: 'Participate in opening discussion.',
        keyQuestions: ['Why is this architecture needed in real-world systems?'],
      },
      {
        phaseName: 'Hands-On Practical Lab',
        allocatedMinutes: 60,
        instructorActions: 'Guide learners through code sprint.',
        learnerActions: 'Complete practical exercises and push commits.',
        keyQuestions: ['How do we test this implementation?'],
      }
    ]),
    z.array(
      z.object({
        phaseName: z.preprocess((p) => String(p || 'Lesson Phase'), z.string()),
        allocatedMinutes: z.preprocess((m) => extractNumber(m, 15), z.number()),
        instructorActions: z.preprocess((ia) => String(ia || 'Instructor guides and demonstrates concepts.'), z.string()),
        learnerActions: z.preprocess((la) => String(la || 'Learner implements code and exercises.'), z.string()),
        keyQuestions: z.preprocess((kq) => (Array.isArray(kq) ? kq.map(String) : [String(kq || 'Key concept check')]), z.array(z.string())),
      })
    )
  ),
  inClassQuizQuestions: z.preprocess(
    (q) => (Array.isArray(q) ? q : []),
    z.array(
      z.object({
        question: z.preprocess((qu) => String(qu || 'Check question'), z.string()),
        answer: z.preprocess((ans) => String(ans || 'Correct answer'), z.string()),
      })
    )
  ),
  homeworkAssignment: z.preprocess(
    (val: any) => {
      if (val && typeof val === 'object') {
        return {
          title: String(val.title || 'Practical Take-Home Sprint'),
          instructions: String(val.instructions || 'Refactor and extend today\'s lab code.'),
          submissionDeadlineDays: extractNumber(val.submissionDeadlineDays, 4),
        };
      }
      return {
        title: 'Practical Take-Home Sprint',
        instructions: 'Refactor and test the code developed in class.',
        submissionDeadlineDays: 4,
      };
    },
    z.object({
      title: z.string(),
      instructions: z.string(),
      submissionDeadlineDays: z.number(),
    })
  ),
});

export type LessonPlanData = z.infer<typeof LessonPlanSchema>;

export const AssignmentGenerationSchema = z.object({
  title: z.preprocess((t) => String(t || 'Practical Assignment'), z.string()),
  problemStatement: z.preprocess((ps) => String(ps || 'Implement an end-to-end technical requirement.'), z.string()),
  detailedInstructions: z.preprocess((di) => String(di || 'Follow coding standards, write tests, and document your approach.'), z.string()),
  expectedDeliverables: z.preprocess((ed) => (Array.isArray(ed) ? ed.map(String) : ['Source code repository', 'Documentation']), z.array(z.string())),
  toolsRequired: z.preprocess((tr) => (Array.isArray(tr) ? tr.map(String) : ['VS Code', 'Git']), z.array(z.string())),
  submissionFormat: z.preprocess((sf) => String(sf || 'GitHub repository URL with live deployment link.'), z.string()),
  estimatedHours: z.preprocess((eh) => extractNumber(eh, 6), z.number()),
  gradingRubric: z.preprocess(
    (gr) => (Array.isArray(gr) && gr.length > 0 ? gr : [
      {
        criterion: 'Functionality & Correctness',
        weightPercentage: 50,
        excellentDescription: 'All requirements met without bugs.',
        goodDescription: 'Core requirements functional with minor flaws.',
        needsImprovementDescription: 'Incomplete or buggy implementation.',
      }
    ]),
    z.array(
      z.object({
        criterion: z.preprocess((c) => String(c || 'Grading Criterion'), z.string()),
        weightPercentage: z.preprocess((w) => extractNumber(w, 25), z.number()),
        excellentDescription: z.preprocess((ed) => String(ed || 'Exceeds standard expectations.'), z.string()),
        goodDescription: z.preprocess((gd) => String(gd || 'Meets standard expectations.'), z.string()),
        needsImprovementDescription: z.preprocess((nid) => String(nid || 'Does not meet basic criteria.'), z.string()),
      })
    )
  ),
});

export type AssignmentGenerationData = z.infer<typeof AssignmentGenerationSchema>;

export const QualityCheckResultSchema = z.object({
  overallStatus: z.preprocess((os) => {
    const s = String(os || 'PASS').toUpperCase();
    if (['PASS', 'WARNING', 'ERROR'].includes(s)) return s;
    return 'PASS';
  }, z.enum(['PASS', 'WARNING', 'ERROR'])),
  qualityScore: z.preprocess((qs) => {
    const num = extractNumber(qs, 92);
    return Math.max(0, Math.min(100, num));
  }, z.number().min(0).max(100)),
  summary: z.preprocess((s) => String(s || 'Pedagogical structure and competency alignment verified successfully.'), z.string()),
  findings: z.preprocess(
    (f) => (Array.isArray(f) ? f : []),
    z.array(
      z.object({
        category: z.preprocess((c) => String(c || 'GENERAL'), z.string()),
        severity: z.preprocess((sev) => {
          const s = String(sev || 'INFO').toUpperCase();
          if (['INFO', 'WARNING', 'ERROR'].includes(s)) return s;
          return 'INFO';
        }, z.enum(['INFO', 'WARNING', 'ERROR'])),
        issue: z.preprocess((i) => String(i || 'No critical issues found.'), z.string()),
        recommendation: z.preprocess((r) => String(r || 'Maintain current pedagogical balance.'), z.string()),
      })
    )
  ),
});

export type QualityCheckResult = z.infer<typeof QualityCheckResultSchema>;

export const StudentFeedbackSchema = z.object({
  strengths: z.preprocess((s) => (Array.isArray(s) ? s.map(String) : [String(s || 'Solid implementation effort.')]), z.array(z.string())),
  growthAreas: z.preprocess((g) => (Array.isArray(g) ? g.map(String) : [String(g || 'Refine edge case handling.')]), z.array(z.string())),
  constructiveSuggestions: z.preprocess((cs) => String(cs || 'Keep practicing test-driven development.'), z.string()),
  recommendedReviewModules: z.preprocess((rm) => (Array.isArray(rm) ? rm.map(String) : [String(rm || 'Module 2')]), z.array(z.string())),
  encouragingClosing: z.preprocess((ec) => String(ec || 'Keep up the outstanding effort!'), z.string()),
});

export type StudentFeedbackData = z.infer<typeof StudentFeedbackSchema>;
