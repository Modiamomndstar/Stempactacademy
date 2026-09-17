import { Response } from 'express';
import { Role, AIActionType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AIOrchestrator } from '../services/ai/aiOrchestrator.js';
import {
  ProgramGenerationSchema,
  CurriculumGenerationSchema,
  SyllabusGenerationSchema,
  AssessmentGenerationSchema,
  LessonPlanSchema,
  AssignmentGenerationSchema,
  QualityCheckResultSchema,
  StudentFeedbackSchema,
} from '../services/ai/types.js';
import { WorkflowEngine } from '../services/workflow/workflowEngine.js';

// ---------------------------------------------------------------------------
// 1. PROGRAM GENERATOR
// ---------------------------------------------------------------------------
export const generateProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, targetLearners, duration, level, schedule, goals, prerequisites, schoolCode } = req.body;

    const prompt = `Generate a rigorous, complete STEM academic program for STEMPACT Academy in Ile-Ife, Nigeria.
Details provided:
- Title/Concept: ${title || 'Full-Stack & Cloud Systems Engineering'}
- School Code: ${schoolCode || 'SCSE'}
- Target Learners: ${targetLearners || 'Undergraduates, polytechnic graduates, aspiring engineers'}
- Level: ${level || 'LEVEL_2_INTERMEDIATE'}
- Duration: ${duration || '6 Months (24 Weeks)'}
- Schedule: ${schedule || '3 days per week, 3 hours per day'}
- Core Goals: ${goals || 'Hands-on practical deployment, real-world Nigerian industry alignment, software engineering best practices'}
- Prerequisites: ${prerequisites || 'Basic computing literacy and logical reasoning'}

Structure must include realistic course codes, modules, practical activities, competencies, and capstone project.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.PROGRAM_GENERATION,
      prompt,
      schema: ProgramGenerationSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({
      success: true,
      message: 'Program draft proposed successfully by AI. Awaiting academic review and approval.',
      data: result,
    });
  } catch (error: any) {
    console.error('[generateProgram error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate program draft.' });
  }
};

// ---------------------------------------------------------------------------
// 2. CURRICULUM GENERATOR
// ---------------------------------------------------------------------------
export const generateCurriculum = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { programTitle, level, durationWeeks, targetCompetencies } = req.body;

    const prompt = `Generate a detailed competency-based curriculum framework for "${programTitle || 'Data Science & Machine Learning'}" at level ${level || 'LEVEL_2_INTERMEDIATE'}.
Duration: ${durationWeeks || 24} weeks.
Target Competencies: ${targetCompetencies || 'Statistical analysis, Python data stack, SQL mastery, machine learning deployment'}.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.CURRICULUM_GENERATION,
      prompt,
      schema: CurriculumGenerationSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[generateCurriculum error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate curriculum.' });
  }
};

// ---------------------------------------------------------------------------
// 3. SYLLABUS GENERATOR
// ---------------------------------------------------------------------------
export const generateSyllabus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { programTitle, durationWeeks, contactHoursPerWeek } = req.body;

    const prompt = `Generate a weekly syllabus outline for "${programTitle}" spanning ${durationWeeks || 12} weeks at ${contactHoursPerWeek || 6} contact hours per week.
Provide week-by-week topic breakdown, theory hours, practical lab activities, and milestones.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.SYLLABUS_GENERATION,
      prompt,
      schema: SyllabusGenerationSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[generateSyllabus error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate syllabus.' });
  }
};

// ---------------------------------------------------------------------------
// 4. LESSON PLANNER
// ---------------------------------------------------------------------------
export const generateLessonPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonTitle, programTitle, level, durationMinutes } = req.body;

    const prompt = `Generate an instructor lesson plan for the topic: "${lessonTitle}" in program "${programTitle}".
Duration: ${durationMinutes || 90} minutes. Level: ${level || 'Intermediate'}.
Include hook, technical demonstration, student hands-on lab, check for understanding questions, and homework assignment.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.LESSON_PLAN_GENERATION,
      prompt,
      schema: LessonPlanSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[generateLessonPlan error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate lesson plan.' });
  }
};

// ---------------------------------------------------------------------------
// 5. ASSESSMENT GENERATOR
// ---------------------------------------------------------------------------
export const generateAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { programTitle, topic, questionCount, difficulty } = req.body;

    const prompt = `Generate an academic diagnostic or module assessment for "${programTitle}", Topic: "${topic || 'Core Engineering Principles'}".
Questions count: ${questionCount || 5}. Difficulty: ${difficulty || 'MEDIUM'}.
Mix MCQs, short answers, and practical coding/scenario tasks with answer explanations.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.ASSESSMENT_GENERATION,
      prompt,
      schema: AssessmentGenerationSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[generateAssessment error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate assessment.' });
  }
};

// ---------------------------------------------------------------------------
// 6. ASSIGNMENT GENERATOR
// ---------------------------------------------------------------------------
export const generateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topic, programTitle, level } = req.body;

    const prompt = `Generate an authentic real-world project assignment for topic "${topic}" in program "${programTitle}" (${level || 'Level 2'}).
Include problem statement, required tools, submission format, and a 3-tier grading rubric.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.ASSIGNMENT_GENERATION,
      prompt,
      schema: AssignmentGenerationSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[generateAssignment error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate assignment.' });
  }
};

// ---------------------------------------------------------------------------
// 7. QUALITY CHECKER
// ---------------------------------------------------------------------------
export const runQualityCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { programData } = req.body;

    const prompt = `Perform an academic quality check on this program structure:
${JSON.stringify(programData || {}, null, 2)}
Verify:
1. Prerequisite progression.
2. Realistic weekly workload vs contact hours.
3. Balance of theory vs practical lab sessions.
4. Completeness of measurable competencies.
5. Capstone project readiness.
Return overall status (PASS, WARNING, ERROR), quality score (0-100), and specific categorized findings.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.QUALITY_CHECK,
      prompt,
      schema: QualityCheckResultSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[runQualityCheck error]:', error);
    res.status(500).json({ message: error.message || 'Quality check failed.' });
  }
};

// ---------------------------------------------------------------------------
// 8. STUDENT FEEDBACK ASSISTANT
// ---------------------------------------------------------------------------
export const generateFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionText, score, assignmentTitle, rubric } = req.body;

    const prompt = `Propose constructive and encouraging instructor feedback for an assignment submission.
Assignment: "${assignmentTitle}"
Score Awarded: ${score}/100
Rubric criteria: ${JSON.stringify(rubric || {})}
Submission details: "${submissionText?.slice(0, 500) || 'Practical project implementation'}"
Highlight strengths, specific areas of growth, and recommended review modules.`;

    const result = await AIOrchestrator.generateStructured({
      actionType: AIActionType.FEEDBACK_GENERATION,
      prompt,
      schema: StudentFeedbackSchema,
      contextData: req.body,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[generateFeedback error]:', error);
    res.status(500).json({ message: error.message || 'Failed to generate feedback.' });
  }
};

// ---------------------------------------------------------------------------
// 9. STUDENT LEARNING COPILOT
// ---------------------------------------------------------------------------
export const studentCopilot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question, activeModuleTitle } = req.body;

    // Resolve student context
    const student = await prisma.studentProfile.findFirst({
      where: { userId: req.user!.id },
      include: {
        cohort: { include: { program: true } },
      },
    });

    const programName = student?.cohort?.program?.name || 'STEMPACT Technical Program';
    const currentLevel = student?.currentLevel || 'Level 1 Foundation';

    const systemInstruction = `You are the "STEMPACT Learning Copilot", an encouraging and pedagogically rigorous AI tutor for a student in "${programName}" (${currentLevel}). Active topic: "${activeModuleTitle || 'Current Module'}".
Your goal is to guide the student toward understanding without giving away answers directly. Provide clear explanations, practical code snippets, and relevant Nigerian industry applications where helpful.`;

    const answer = await AIOrchestrator.generateTextResponse(
      req.user!.id,
      req.user!.role,
      AIActionType.STUDENT_COPILOT,
      question,
      systemInstruction
    );

    res.status(200).json({ success: true, answer });
  } catch (error: any) {
    console.error('[studentCopilot error]:', error);
    res.status(500).json({ message: error.message || 'Learning Copilot encountered an error.' });
  }
};

// ---------------------------------------------------------------------------
// 10. PARENT ASSISTANT
// ---------------------------------------------------------------------------
export const parentAssistant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question } = req.body;

    const parent = await prisma.parentProfile.findFirst({
      where: { userId: req.user!.id },
      include: {
        students: {
          include: {
            user: true,
            attendances: true,
            submissions: true,
            cohort: { include: { program: true } },
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      res.status(404).json({ message: 'No linked student profiles found for this parent.' });
      return;
    }

    const ward = parent.students[0];
    const totalSessions = ward.attendances.length;
    const presentCount = ward.attendances.filter((a: any) => a.status === 'PRESENT').length;
    const attendancePercent = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(0) : '100';

    const wardContext = `Ward Name: ${ward.user.firstName} ${ward.user.lastName}
Program: ${ward.cohort?.program?.name || 'STEMPACT Academy'}
Attendance: ${attendancePercent}%
Completed Submissions: ${ward.submissions.length}`;

    const systemInstruction = `You are the "STEMPACT Parent Assistant". You communicate clearly, respectfully, and constructively with parents about their linked child's learning.
Context about the child:
${wardContext}
Never disclose information about any other student. Focus on progress, attendance, and encouraging parental support.`;

    const answer = await AIOrchestrator.generateTextResponse(
      req.user!.id,
      req.user!.role,
      AIActionType.PARENT_ASSISTANT,
      question,
      systemInstruction
    );

    res.status(200).json({ success: true, answer });
  } catch (error: any) {
    console.error('[parentAssistant error]:', error);
    res.status(500).json({ message: error.message || 'Parent assistant error.' });
  }
};

// ---------------------------------------------------------------------------
// 11. ADMIN ASSISTANT
// ---------------------------------------------------------------------------
export const adminAssistant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;

    // Fetch live summary stats to ground the assistant
    const [totalStudents, totalCohorts, totalPrograms, pendingApplications] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.cohort.count(),
      prisma.program.count(),
      prisma.application.count({ where: { status: 'SUBMITTED' } }),
    ]);

    const systemInstruction = `You are the "STEMPACT Executive Admin Assistant".
Live Academy Metrics:
- Total Enrolled Students: ${totalStudents}
- Active Cohorts: ${totalCohorts}
- Published Programs: ${totalPrograms}
- Pending Admission Applications: ${pendingApplications}
Provide actionable operational summaries, draft communications, and suggest administrative interventions.`;

    const answer = await AIOrchestrator.generateTextResponse(
      req.user!.id,
      req.user!.role,
      AIActionType.ADMIN_ASSISTANT,
      query,
      systemInstruction
    );

    res.status(200).json({ success: true, answer });
  } catch (error: any) {
    console.error('[adminAssistant error]:', error);
    res.status(500).json({ message: error.message || 'Admin assistant error.' });
  }
};

// ---------------------------------------------------------------------------
// 12. APPROVAL & CANONICAL PUBLICATION
// ---------------------------------------------------------------------------
export const approveAndPublish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { overrideData } = req.body;

    const published = await WorkflowEngine.approveAndPublishProgram({
      generationId: id,
      approverId: req.user!.id,
      overrideData,
    });

    res.status(200).json({
      success: true,
      message: `Program "${published.name}" approved and published to canonical academy catalog.`,
      data: published,
    });
  } catch (error: any) {
    console.error('[approveAndPublish error]:', error);
    res.status(500).json({ message: error.message || 'Approval and publishing failed.' });
  }
};

// ---------------------------------------------------------------------------
// 13. AI GENERATION HISTORY
// ---------------------------------------------------------------------------
export const getAIGenerations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await prisma.aIGeneration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        requestedBy: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });

    res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    console.error('[getAIGenerations error]:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch AI history.' });
  }
};
