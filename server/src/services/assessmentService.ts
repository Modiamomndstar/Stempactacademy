import { WorkflowStatus, AcademicLevel, Role, AIActionType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AIOrchestrator } from './ai/aiOrchestrator.js';
import { AssessmentGenerationSchema } from './ai/types.js';

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
   * Validates whether a question contains authentic technical content
   * rather than generic mock placeholders (e.g. "Assessment Question", "Option A").
   */
  static isQuestionValid(q: any): boolean {
    if (!q) return false;
    const prompt = String(q.prompt || q.questionText || '').trim().toLowerCase();
    if (!prompt || prompt === 'assessment question' || prompt.length < 12) return false;

    let opts: string[] = [];
    if (Array.isArray(q.options)) {
      opts = q.options;
    } else if (typeof q.options === 'string') {
      try {
        opts = JSON.parse(q.options);
      } catch {
        opts = [];
      }
    }
    if (!Array.isArray(opts) || opts.length < 2) return false;

    const optJoined = opts.map((o) => String(o).trim().toLowerCase()).join(' | ');
    if (optJoined.includes('option a | option b | option c') || optJoined === 'option a | option b | option c | option d') {
      return false;
    }
    return true;
  }

  /**
   * Resolves the canonical Assessment and current AssessmentVersion for a program or application.
   * If no assessment exists for the chosen program or if only corrupted placeholder questions exist,
   * AI automatically generates and stores an authentic tailored diagnostic assessment.
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
      if (app?.programId) targetProgramId = app.programId;
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

    // 2. Validate existing assessment questions to ensure they are NOT corrupted placeholders
    if (assessment) {
      const questionsToCheck = assessment.versions[0]?.questions?.length
        ? assessment.versions[0].questions
        : assessment.questions;

      const validCount = questionsToCheck.filter(AssessmentService.isQuestionValid).length;
      if (validCount < 5) {
        console.warn(`[AssessmentService] Assessment ${assessment.id} for program ${assessment.programId} contains placeholder questions (${validCount} valid). Purging to regenerate authentic AI questions.`);
        await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: assessment.id } }).catch(() => null);
        await prisma.assessmentVersion.deleteMany({ where: { assessmentId: assessment.id } }).catch(() => null);
        await prisma.assessment.delete({ where: { id: assessment.id } }).catch(() => null);
        assessment = null;
      }
    }

    // 3. If no authentic assessment exists for this specific program, generate one tailored to it!
    if (!assessment && targetProgramId) {
      const aiGenerated = await AssessmentService.generateAiAssessmentForProgram(targetProgramId);
      if (aiGenerated) return aiGenerated;
    }

    // 4. Fallback to school assessment only if program generation returned null
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

    // Validate school assessment as well
    if (assessment) {
      const questionsToCheck = assessment.versions[0]?.questions?.length
        ? assessment.versions[0].questions
        : assessment.questions;
      if (questionsToCheck.filter(AssessmentService.isQuestionValid).length < 5) {
        assessment = null;
      }
    }

    // 5. Fallback to general STEM assessment if still none
    if (!assessment) {
      assessment = await prisma.assessment.findFirst({
        where: {
          questions: { some: {} },
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
      if (assessment) {
        const questionsToCheck = assessment.versions[0]?.questions?.length
          ? assessment.versions[0].questions
          : assessment.questions;
        if (questionsToCheck.filter(AssessmentService.isQuestionValid).length < 5) {
          assessment = null;
        }
      }
    }

    // If still nothing, ensure a comprehensive general diagnostic test
    if (!assessment) {
      const general = await AssessmentService.ensureGeneralAssessment();
      if (general) return general;
      return null;
    }

    // Ensure an AssessmentVersion exists
    let currentVersion = assessment.versions[0] || null;
    if (!currentVersion) {
      const pv = assessment.programId
        ? await prisma.programVersion.findFirst({
            where: { programId: assessment.programId, isCurrent: true },
          })
        : null;

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

      // Link any existing questions to this version
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
      questions:
        currentVersion.questions && currentVersion.questions.length > 0
          ? currentVersion.questions
          : assessment.questions,
    };
  }

  /**
   * Generates a program-specific AI diagnostic placement assessment and persists it.
   */
  static async generateAiAssessmentForProgram(
    programId: string,
    options?: { targetCount?: number; durationMinutes?: number }
  ) {
    try {
      const prog = await prisma.program.findUnique({
        where: { id: programId },
        include: { school: true, courses: true },
      });

      if (!prog) return null;

      const programTitle = prog.name;
      const schoolName = prog.school?.name || 'STEM Technical Academy';

      // Determine dynamic question count (10 to 20+ questions based on program complexity or requested count)
      const courseCount = prog.courses?.length || 1;
      const defaultCount = courseCount >= 4 ? 20 : (courseCount >= 2 ? 15 : 12);
      const targetCount = Math.max(10, Math.min(30, options?.targetCount || defaultCount));
      const generalCount = Math.max(3, Math.round(targetCount * 0.3));
      const domainCount = targetCount - generalCount;
      const durationMinutes = options?.durationMinutes || (targetCount >= 20 ? 45 : (targetCount >= 15 ? 35 : 25));

      let rawQuestions: Array<{
        prompt: string;
        category: string;
        options: string[];
        correctAnswer: string;
        points: number;
      }> = [];

      // 1. Try AI Generation via AIOrchestrator
      try {
        const prompt = `Generate a rigorous, ${targetCount}-question multiple-choice diagnostic placement test for the academic program "${programTitle}" in the school of "${schoolName}".
Structure the ${targetCount} questions strictly as follows:
- ${generalCount} Questions (~30% - Questions 1 to ${generalCount}): GENERAL FOUNDATIONS covering DIGITAL_LITERACY and LOGICAL_REASONING (computer operations, digital workflows, and analytical problem decomposition).
- ${domainCount} Questions (~70% - Questions ${generalCount + 1} to ${targetCount}): STRICTLY PROGRAM-SPECIFIC & PRACTICAL DOMAIN QUESTIONS directly evaluating core principles, real-world tools, practical scenarios, workflows, terminology, and industry ethics specific to "${programTitle}".
For example, if the program is AI Content Creation, the ${domainCount} program questions must focus on generative prompting, multimodal tools (images/video/audio generation), audience reach, content workflows, and AI copyright/ethics—NOT unrelated hardware or mathematical regression formulas.
Return exactly ${targetCount} questions. Every question must have 4 distinct options and 1 clear correct answer.
Difficulty: Baseline Placement Diagnostic.`;

        const aiResult = await AIOrchestrator.generateStructured({
          actionType: AIActionType.ASSESSMENT_GENERATION,
          prompt,
          schema: AssessmentGenerationSchema,
          contextData: { programId, programTitle, schoolName, targetCount },
          userId: 'system-ai-engine',
          userRole: Role.SUPER_ADMIN,
        });

        if (aiResult?.structured?.questions && aiResult.structured.questions.length > 0) {
          const mapped = aiResult.structured.questions.map((q: any) => ({
            prompt: q.questionText || q.prompt,
            category: q.category || 'TECHNICAL_KNOWLEDGE',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : ''),
            points: q.points || 5,
          }));
          rawQuestions = mapped.filter(AssessmentService.isQuestionValid);
        }
      } catch (aiErr) {
        console.warn('[AssessmentService] AI generation provider error, using domain-tailored generation:', aiErr);
      }

      // 2. If AI output was insufficient or invalid, use smart domain-tailored generator
      if (!rawQuestions || rawQuestions.length < 5) {
        rawQuestions = AssessmentService.createDomainDiagnosticQuestions(prog.name, schoolName, targetCount);
      }

      // 3. Persist new Assessment in Database
      const newAssessment = await prisma.assessment.create({
        data: {
          title: `STEMPACT ${prog.name} Diagnostic Placement Assessment (${rawQuestions.length} Questions)`,
          programId: prog.id,
          durationMinutes,
          passingScore: 60,
          instructions: `This diagnostic assessment evaluates your baseline digital readiness, analytical logic, and introductory technical aptitude for ${prog.name}. The Academic Board uses your performance to determine your optimal cohort entry tier.`,
        },
      });

      const newVersion = await prisma.assessmentVersion.create({
        data: {
          assessmentId: newAssessment.id,
          versionNumber: 1,
          title: newAssessment.title,
          instructions: newAssessment.instructions,
          durationMinutes,
          passingScore: 60,
          status: WorkflowStatus.PUBLISHED,
          isCurrent: true,
        },
      });

      const createdQuestions = [];
      for (let i = 0; i < rawQuestions.length; i++) {
        const q = rawQuestions[i];
        const createdQ = await prisma.assessmentQuestion.create({
          data: {
            assessmentId: newAssessment.id,
            assessmentVersionId: newVersion.id,
            category: q.category,
            type: 'MULTIPLE_CHOICE',
            prompt: q.prompt,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            points: q.points || 5,
            order: i + 1,
          },
        });
        createdQuestions.push(createdQ);
      }

      return {
        assessment: newAssessment,
        currentVersion: newVersion,
        questions: createdQuestions,
      };
    } catch (err) {
      console.error('[AssessmentService.generateAiAssessmentForProgram error]:', err);
      return null;
    }
  }

  /**
   * Ensures at least one comprehensive general diagnostic assessment exists in the system.
   */
  static async ensureGeneralAssessment() {
    try {
      const existing = await prisma.assessment.findFirst({
        where: { questions: { some: {} } },
        include: {
          versions: { where: { isCurrent: true }, include: { questions: { orderBy: { order: 'asc' } } } },
          questions: { orderBy: { order: 'asc' } },
        },
      });

      if (existing) {
        return {
          assessment: existing,
          currentVersion: existing.versions[0] || null,
          questions: existing.versions[0]?.questions || existing.questions,
        };
      }

      const questions = AssessmentService.createDomainDiagnosticQuestions('General STEM & Technology', 'School of Applied Sciences');

      const firstProgram = await prisma.program.findFirst();
      if (!firstProgram) return null;

      const newAssessment = await prisma.assessment.create({
        data: {
          title: 'STEMPACT General STEM & Technical Diagnostic Placement Assessment',
          programId: firstProgram.id,
          durationMinutes: 30,
          passingScore: 60,
          instructions:
            'This foundational diagnostic assessment measures digital readiness, mathematical reasoning, computational logic, and problem-solving skills.',
        },
      });

      const newVersion = await prisma.assessmentVersion.create({
        data: {
          assessmentId: newAssessment.id,
          versionNumber: 1,
          title: newAssessment.title,
          instructions: newAssessment.instructions,
          durationMinutes: 30,
          passingScore: 60,
          status: WorkflowStatus.PUBLISHED,
          isCurrent: true,
        },
      });

      const createdQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const createdQ = await prisma.assessmentQuestion.create({
          data: {
            assessmentId: newAssessment.id,
            assessmentVersionId: newVersion.id,
            category: q.category,
            type: 'MULTIPLE_CHOICE',
            prompt: q.prompt,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            points: q.points || 5,
            order: i + 1,
          },
        });
        createdQuestions.push(createdQ);
      }

      return {
        assessment: newAssessment,
        currentVersion: newVersion,
        questions: createdQuestions,
      };
    } catch (e) {
      console.error('[AssessmentService.ensureGeneralAssessment error]:', e);
      return null;
    }
  }

  /**
   * Domain-specific question bank generator tailored to the student's applied academic program.
   */
  static createDomainDiagnosticQuestions(programName: string, schoolName: string, targetCount: number = 15) {
    const p = (programName + ' ' + schoolName).toLowerCase();

    // 1. Digital Media, Marketing, AI Productivity & AI Content Creation
    if (
      p.includes('content') ||
      p.includes('digital media') ||
      p.includes('marketing') ||
      p.includes('productivity') ||
      p.includes('creative') ||
      p.includes('video') ||
      p.includes('graphic') ||
      p.includes('copywrit') ||
      p.includes('social media') ||
      p.includes('branding')
    ) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'In digital media asset management, what is the primary distinction between raster images (e.g. JPEG, PNG) and vector graphics (e.g. SVG)?',
          options: [
            'Vector graphics scale infinitely without resolution loss, while raster images pixelate when enlarged',
            'Raster images have no file size, while vector graphics cannot be viewed in web browsers',
            'Vector graphics only support black and white colors',
            'There is no functional distinction between raster and vector graphics',
          ],
          correctAnswer: 'Vector graphics scale infinitely without resolution loss, while raster images pixelate when enlarged',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'A digital content creator schedules an automated video publishing workflow. Video rendering takes 20 minutes, thumbnail generation takes 10 minutes, and platform uploading/processing takes 15 minutes. What is the latest time to initiate rendering for a scheduled 5:00 PM release?',
          options: ['4:15 PM', '4:45 PM', '3:30 PM', '4:55 PM'],
          correctAnswer: '4:15 PM',
          points: 5,
        },
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'Which aspect ratio and resolution standard is canonically designed for vertical short-form mobile video (TikTok, Instagram Reels, YouTube Shorts)?',
          options: [
            '9:16 aspect ratio (typically 1080 × 1920 pixels)',
            '16:9 aspect ratio (typically 1920 × 1080 pixels)',
            '4:3 aspect ratio (typically 1024 × 768 pixels)',
            '1:1 square aspect ratio only',
          ],
          correctAnswer: '9:16 aspect ratio (typically 1080 × 1920 pixels)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In Generative AI copywriting and creative storytelling, what is the role of a "System Prompt" or "Role Framing" (e.g. "Act as a senior tech branding strategist")?',
          options: [
            'It primes the Large Language Model with persona, behavioral constraints, tone of voice, and contextual directives',
            'It increases the computer\'s download internet bandwidth',
            'It automatically shuts down the AI model when idle',
            'It translates English sentences into binary assembly machine code',
          ],
          correctAnswer: 'It primes the Large Language Model with persona, behavioral constraints, tone of voice, and contextual directives',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'When generating visual concepts using diffusion models (e.g. Midjourney, Stable Diffusion), what is the primary purpose of a "Negative Prompt"?',
          options: [
            'To specify unwanted attributes, artifacts, or styles to actively exclude from the generated image',
            'To darken the exposure of the final image render',
            'To delete the user account immediately following generation',
            'To publish negative critique of the artwork on social media',
          ],
          correctAnswer: 'To specify unwanted attributes, artifacts, or styles to actively exclude from the generated image',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In AI video and image synthesis pipelines, what does the "Seed" parameter determine across repeated generations?',
          options: [
            'A starting numerical value for the noise generator that allows reproducing consistent visual outputs when other parameters are unchanged',
            'The financial fee charged per generation request',
            'The maximum duration in seconds of the video clip',
            'The physical number of computer monitors attached to the graphics card',
          ],
          correctAnswer: 'A starting numerical value for the noise generator that allows reproducing consistent visual outputs when other parameters are unchanged',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'Which metric on digital content algorithms (YouTube, Instagram, LinkedIn) most strongly correlates with sustained organic distribution and recommendation reach?',
          options: [
            'Average Watch Time / Audience Retention and meaningful shares/saves',
            'Total count of arbitrary hashtags placed in the caption description',
            'The specific time of day the author registered their account',
            'How loudly the creator speaks in the first second of the video',
          ],
          correctAnswer: 'Average Watch Time / Audience Retention and meaningful shares/saves',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In ethical AI content production and commercial publishing, what is the standard professional governance standard regarding AI voice cloning and likeness?',
          options: [
            'Obtain explicit verified consent and commercial rights clearance before replicating an individual\'s voice or likeness',
            'Voice cloning can be used freely on any public person without disclosure or consent',
            'AI voice cloning cannot be uploaded to the internet under any circumstances',
            'Consent is only required for children under 5 years of age',
          ],
          correctAnswer: 'Obtain explicit verified consent and commercial rights clearance before replicating an individual\'s voice or likeness',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In Search Engine Optimization (SEO) and automated content generation, why is human editorial review and "E-E-A-T" (Experience, Expertise, Authoritativeness, Trustworthiness) vital?',
          options: [
            'Search engines penalize unverified, hallucinated, low-value AI spam while rewarding verifiable original insights and real-world expertise',
            'Because AI text cannot be converted into HTML code',
            'Because modern computers cannot read articles longer than 200 words',
            'To prevent internet cloud servers from running out of digital memory storage',
          ],
          correctAnswer: 'Search engines penalize unverified, hallucinated, low-value AI spam while rewarding verifiable original insights and real-world expertise',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In Generative AI prompt engineering and creative writing, how does adjusting the "Temperature" parameter from 0.2 to 0.8 affect the model\'s output?',
          options: [
            'Higher temperature introduces more creative variation and lexical novelty, while lower temperature yields deterministic and focused responses',
            'Higher temperature causes the computer fan to spin faster and heat up physically',
            'Higher temperature restricts the response length to 10 words or fewer',
            'Temperature only controls the color brightness of generated photos',
          ],
          correctAnswer: 'Higher temperature introduces more creative variation and lexical novelty, while lower temperature yields deterministic and focused responses',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In digital audio production and video publishing, what does the LUFS standard measure?',
          options: [
            'Integrated loudness across time for perceived volume consistency across broadcast and streaming platforms',
            'The physical weight of the audio microphone',
            'The number of people listening to the audio stream simultaneously',
            'The screen refresh rate of the video editing computer',
          ],
          correctAnswer: 'Integrated loudness across time for perceived volume consistency across broadcast and streaming platforms',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'When preparing digital graphics for high-resolution physical printing versus web displays, what is the standard resolution target?',
          options: [
            '300 DPI for commercial printing, compared to 72–96 DPI for standard web monitors',
            '10 DPI for printing and 1000 DPI for websites',
            'There is no difference in resolution between print and web',
            'Printing requires vector files only without any DPI values',
          ],
          correctAnswer: '300 DPI for commercial printing, compared to 72–96 DPI for standard web monitors',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In AI text generation and LLM context windows, what does a "Token" generally represent?',
          options: [
            'A basic unit of text processing, roughly equivalent to 4 characters or 0.75 words in English',
            'A physical cryptocurrency coin stored on a hard drive',
            'The serial number of the computer processor',
            'The battery charge percentage of the server',
          ],
          correctAnswer: 'A basic unit of text processing, roughly equivalent to 4 characters or 0.75 words in English',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In video post-production workflows, what is a "LUT" (Look-Up Table) used for?',
          options: [
            'Transforming color values and applying standardized cinematic color grading to raw footage',
            'Translating foreign subtitles into English automatically',
            'Measuring computer network speed during uploads',
            'Locking video files so they cannot be deleted',
          ],
          correctAnswer: 'Transforming color values and applying standardized cinematic color grading to raw footage',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In social video analytics and audience growth, what does Click-Through Rate (CTR) measure?',
          options: [
            'The percentage of users who clicked to view a video after seeing its thumbnail and title',
            'The amount of money earned per minute of video played',
            'The speed at which the video file downloads',
            'How many comments the creator responded to',
          ],
          correctAnswer: 'The percentage of users who clicked to view a video after seeing its thumbnail and title',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 2. Electronics, Electrical Engineering & Circuit Design
    if (
      p.includes('electronic') ||
      p.includes('electrical') ||
      p.includes('circuit') ||
      p.includes('transistor') ||
      p.includes('pcb')
    ) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'What is the primary function of a digital multimeter in electronics engineering?',
          options: [
            'To measure electrical voltage, current (amperage), resistance (ohms), and circuit continuity',
            'To program software operating systems',
            'To display video on HDMI monitors',
            'To drill holes into printed circuit boards',
          ],
          correctAnswer: 'To measure electrical voltage, current (amperage), resistance (ohms), and circuit continuity',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'If two 100-Ohm resistors are connected in parallel in a DC circuit, what is the equivalent total resistance of the combination?',
          options: ['50 Ohms', '200 Ohms', '100 Ohms', '25 Ohms'],
          correctAnswer: '50 Ohms',
          points: 5,
        },
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'What is the fundamental difference between Direct Current (DC) and Alternating Current (AC)?',
          options: [
            'DC flows unidirectionally in a constant direction, whereas AC periodically reverses its direction and magnitude',
            'DC is only used in electric power stations, while AC is only used in wristwatches',
            'DC cannot power electronic circuits',
            'There is no physical difference',
          ],
          correctAnswer: 'DC flows unidirectionally in a constant direction, whereas AC periodically reverses its direction and magnitude',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What is the primary function of a semiconductor diode in an electronic circuit?',
          options: [
            'To permit electric current to flow in one direction while blocking current flow in the opposite direction',
            'To increase circuit voltage infinitely',
            'To convert digital code into analog radio waves',
            'To act as a heat insulator',
          ],
          correctAnswer: 'To permit electric current to flow in one direction while blocking current flow in the opposite direction',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In transistor circuit theory, which terminal of an NPN Bipolar Junction Transistor (BJT) receives the control input current to switch or amplify current flowing from Collector to Emitter?',
          options: ['Base', 'Drain', 'Gate', 'Anode'],
          correctAnswer: 'Base',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'According to Ohm\'s Law (V = I × R), if a 12V DC power source is connected across a 24-Ohm resistive load, what current will flow through the circuit?',
          options: ['0.5 Amperes', '2 Amperes', '288 Amperes', '12 Amperes'],
          correctAnswer: '0.5 Amperes',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What is the function of a decoupling capacitor placed adjacent to an integrated circuit (IC) power supply pin on a PCB?',
          options: [
            'To suppress high-frequency voltage transients and supply instantaneous current during switching transitions',
            'To amplify the volume of audio speakers',
            'To store program code permanently like a flash drive',
            'To step down 220V AC wall power directly into 3.3V DC',
          ],
          correctAnswer: 'To suppress high-frequency voltage transients and supply instantaneous current during switching transitions',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What is the function of an oscilloscope in electronics laboratory diagnostics?',
          options: [
            'To visualize electrical signal voltage waveforms graphed over time',
            'To measure the physical weight of circuit boards',
            'To weld surface-mount components to copper traces',
            'To connect circuit boards to Wi-Fi networks',
          ],
          correctAnswer: 'To visualize electrical signal voltage waveforms graphed over time',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'Which two-input logic gate outputs a HIGH (1) voltage state if and only if its two inputs have differing logical values?',
          options: ['XOR (Exclusive OR) Gate', 'AND Gate', 'NOR Gate', 'NAND Gate'],
          correctAnswer: 'XOR (Exclusive OR) Gate',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In Printed Circuit Board (PCB) design, what is a "Via"?',
          options: [
            'A copper-plated drilled hole that electrically connects conductive copper traces across different layers of the board',
            'A software bug inside the microcontroller',
            'A rubber foot attached to the bottom of the case',
            'A cooling heatsink compound',
          ],
          correctAnswer: 'A copper-plated drilled hole that electrically connects conductive copper traces across different layers of the board',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What is the primary advantage of Pulse-Width Modulation (PWM) when controlling motor speed or LED brightness?',
          options: [
            'It delivers high efficiency with minimal thermal power loss by rapidly pulsing between fully ON and fully OFF states',
            'It transforms DC power into three-phase high voltage AC power',
            'It eliminates the need for any wires in the electrical circuit',
            'It reduces the clock speed of the central microcontroller to zero',
          ],
          correctAnswer: 'It delivers high efficiency with minimal thermal power loss by rapidly pulsing between fully ON and fully OFF states',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In embedded systems and hardware protocols, what is a key architectural characteristic of the I2C communication bus?',
          options: [
            'It uses only two bidirectional lines (SDA for data, SCL for clock) supporting multi-device addressing',
            'It requires a minimum of 24 parallel copper wires',
            'It can only operate over transatlantic fiber-optic cables',
            'It operates exclusively without any clock timing signal',
          ],
          correctAnswer: 'It uses only two bidirectional lines (SDA for data, SCL for clock) supporting multi-device addressing',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In analog electronics, what is the ideal input impedance of an Operational Amplifier (Op-Amp)?',
          options: ['Infinite (effectively drawing zero input current)', 'Zero Ohms (direct short circuit)', 'Exactly 50 Ohms', '1 Ohm'],
          correctAnswer: 'Infinite (effectively drawing zero input current)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What is the primary role of chemical flux applied during electronics soldering?',
          options: [
            'To remove metal surface oxides and facilitate smooth wetting of the solder alloy',
            'To glue components permanently without applying heat',
            'To change the electrical color of the circuit board',
            'To conduct electricity across open air gaps',
          ],
          correctAnswer: 'To remove metal surface oxides and facilitate smooth wetting of the solder alloy',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In digital electronics and microcontrollers, what logic voltage range conventionally represents a binary HIGH state in standard 3.3V LVCMOS systems?',
          options: ['Approximately 2.0V to 3.3V', '0V to 0.8V', '12V to 24V', 'Negative 5V'],
          correctAnswer: 'Approximately 2.0V to 3.3V',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 3. Pure & Applied Mathematics (Foundational to Industrial Applications)
    if (
      p.includes('math') ||
      p.includes('calculus') ||
      p.includes('algebra') ||
      p.includes('linear algebra') ||
      p.includes('fourier') ||
      p.includes('applied math')
    ) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'In computational mathematics, what is the role of scientific notation (e.g. 6.022 × 10²³)?',
          options: [
            'To express exceptionally large or small real numbers compactly using powers of ten',
            'To translate human words into different languages',
            'To format numbers with bold fonts on web pages',
            'To encrypt mathematical numbers for passwords',
          ],
          correctAnswer: 'To express exceptionally large or small real numbers compactly using powers of ten',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'If an industrial production pipeline increases its throughput speed by 25%, by what percentage does the time required to complete 1,000 units decrease?',
          options: ['20%', '25%', '50%', '12.5%'],
          correctAnswer: '20%',
          points: 5,
        },
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'In digital computing systems, which positional numeral system represents values using digits 0 through 9 and letters A through F?',
          options: ['Hexadecimal (Base 16)', 'Octal (Base 8)', 'Binary (Base 2)', 'Duodecimal (Base 12)'],
          correctAnswer: 'Hexadecimal (Base 16)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In linear algebra and computer graphics, what does multiplying a 2D coordinate vector by a 2 × 2 transformation matrix perform geometrically?',
          options: [
            'Linear transformations such as rotation, scaling, reflection, or shearing',
            'Increases the resolution of the computer monitor',
            'Deletes the vector from computer memory',
            'Changes the color of the vector on the screen',
          ],
          correctAnswer: 'Linear transformations such as rotation, scaling, reflection, or shearing',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What does the first derivative f\'(x) of a differentiable function represent geometrically on a Cartesian coordinate graph?',
          options: [
            'The instantaneous slope or rate of change of the tangent line to the curve at point x',
            'The total surface area under the curve between zero and x',
            'The arithmetic average of all points on the graph',
            'The y-intercept of the function',
          ],
          correctAnswer: 'The instantaneous slope or rate of change of the tangent line to the curve at point x',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In signal processing and applied engineering, what does the Fourier Transform decompose a time-domain signal into?',
          options: [
            'Its constituent frequencies and sinusoidal harmonic components',
            'A single compressed MP3 audio file',
            'A set of random binary strings',
            'A linear sequence of algebraic integers',
          ],
          correctAnswer: 'Its constituent frequencies and sinusoidal harmonic components',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'If two non-zero vectors in 3D Euclidean space have a Dot Product (Scalar Product) of 0, what geometric relationship exists between them?',
          options: [
            'The two vectors are mutually orthogonal (perpendicular at 90°)',
            'The two vectors are strictly parallel in the same direction',
            'The two vectors have identical lengths',
            'The two vectors point in opposite directions (180°)',
          ],
          correctAnswer: 'The two vectors are mutually orthogonal (perpendicular at 90°)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In industrial operations research, what does the mathematical optimization technique of Linear Programming solve?',
          options: [
            'A linear objective function (such as profit or cost) subject to linear equality or inequality constraints',
            'The physical speed of internet cables',
            'The temperature of soldering irons in factories',
            'The font size of engineering blueprints',
          ],
          correctAnswer: 'A linear objective function (such as profit or cost) subject to linear equality or inequality constraints',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In probability and statistics, if an event has a probability of 0.25 of occurring on any given independent trial, what is the probability that it will NOT occur on a single trial?',
          options: ['0.75 (75%)', '0.25 (25%)', '0.50 (50%)', '1.00 (100%)'],
          correctAnswer: '0.75 (75%)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In applied calculus and physics, if the position of an autonomous vehicle is given by s(t), what physical quantity does the second derivative s\'\'(t) represent?',
          options: ['Instantaneous Acceleration', 'Instantaneous Velocity', 'Total Distance Traveled', 'Vehicle Mass'],
          correctAnswer: 'Instantaneous Acceleration',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In linear algebra and machine learning dimensionality reduction, what do the eigenvectors of a covariance matrix represent?',
          options: [
            'The principal orthogonal directions along which the data variance is maximized',
            'The total number of rows in the training dataset',
            'The learning rate of the optimization loop',
            'The clock speed of the graphics processor',
          ],
          correctAnswer: 'The principal orthogonal directions along which the data variance is maximized',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In numerical optimization, how does Gradient Descent determine the direction of parameter updates?',
          options: [
            'By taking steps in the direction opposite to the gradient of the loss function (steepest descent)',
            'By choosing completely random directions at each iteration',
            'By increasing parameters whenever the loss increases',
            'By setting all parameters to zero permanently',
          ],
          correctAnswer: 'By taking steps in the direction opposite to the gradient of the loss function (steepest descent)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What mathematical condition must be met for matrix product A × B to be mathematically valid?',
          options: [
            'The number of columns in Matrix A must equal the number of rows in Matrix B',
            'Both matrices must be square and identical in size',
            'All entries in both matrices must be positive integers',
            'Both matrices must have determinant equal to zero',
          ],
          correctAnswer: 'The number of columns in Matrix A must equal the number of rows in Matrix B',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In integral calculus, what does the definite integral of a continuous function f(x) from x = a to x = b geometrically calculate?',
          options: [
            'The net signed area between the curve f(x) and the x-axis over the interval [a, b]',
            'The slope of the tangent line at x = a',
            'The maximum value of the function over the interval',
            'The distance between point a and point b on a circle',
          ],
          correctAnswer: 'The net signed area between the curve f(x) and the x-axis over the interval [a, b]',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In discrete mathematics and algorithmic graph theory, what is a "Tree"?',
          options: [
            'An undirected, connected graph containing no cycles',
            'A graph with every vertex connected to all other vertices',
            'A directed graph where all edge weights are negative',
            'A database table with exactly three columns',
          ],
          correctAnswer: 'An undirected, connected graph containing no cycles',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 4. Pure & Applied Sciences (Physics, Chemistry & Materials Science)
    if (
      p.includes('physic') ||
      p.includes('chem') ||
      p.includes('material science') ||
      p.includes('applied science')
    ) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'What is the primary purpose of using standardized SI units (International System of Units) in scientific computing and experimental instrumentation?',
          options: [
            'To ensure reproducible, globally consistent measurement standards across physics, chemistry, and engineering',
            'To restrict scientific discoveries to specific countries',
            'To make laboratory software run faster',
            'To protect chemical patents',
          ],
          correctAnswer: 'To ensure reproducible, globally consistent measurement standards across physics, chemistry, and engineering',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'In empirical scientific methodology, why is a "Control Group" mandatory in controlled laboratory experiments?',
          options: [
            'To isolate the specific causal impact of the independent variable by comparing against an untreated baseline',
            'To ensure double the amount of chemical reagents are consumed',
            'To keep laboratory assistants busy during wait times',
            'To allow researchers to skip recording measurement data',
          ],
          correctAnswer: 'To isolate the specific causal impact of the independent variable by comparing against an untreated baseline',
          points: 5,
        },
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'What does a sensor transducer convert in scientific instrumentation systems?',
          options: [
            'A physical quantity (such as pressure, temperature, or light) into a measurable electrical signal',
            'Computer code into physical paper documents',
            'AC wall electricity into liquid fuel',
            'Sound waves into radioactive particles',
          ],
          correctAnswer: 'A physical quantity (such as pressure, temperature, or light) into a measurable electrical signal',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'According to Newton\'s Second Law of Motion (F = m × a), what net force is required to accelerate a 5 kg satellite payload at 4 m/s² in space?',
          options: ['20 Newtons', '1.25 Newtons', '0.8 Newtons', '9.8 Newtons'],
          correctAnswer: '20 Newtons',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In chemistry and stoichiometry, what does Avogadro\'s number (6.022 × 10²³) represent?',
          options: [
            'The exact number of constituent particles (atoms or molecules) in one mole of any pure substance',
            'The boiling point of water in Kelvin',
            'The speed of light in a vacuum',
            'The mass of an electron in kilograms',
          ],
          correctAnswer: 'The exact number of constituent particles (atoms or molecules) in one mole of any pure substance',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What is the fundamental difference between an exothermic chemical reaction and an endothermic chemical reaction?',
          options: [
            'Exothermic reactions release thermal energy to the surroundings (ΔH < 0), while endothermic reactions absorb heat (ΔH > 0)',
            'Exothermic reactions only happen in outer space, while endothermic reactions only occur in ice',
            'Endothermic reactions always explode',
            'There is no thermodynamic difference',
          ],
          correctAnswer: 'Exothermic reactions release thermal energy to the surroundings (ΔH < 0), while endothermic reactions absorb heat (ΔH > 0)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In materials science and solid-state physics, what distinguishes crystalline materials from amorphous materials?',
          options: [
            'Crystalline materials possess a periodic, long-range ordered atomic lattice, whereas amorphous materials lack long-range geometric order',
            'Crystalline materials are always liquids at room temperature',
            'Amorphous materials cannot conduct heat',
            'Crystalline materials do not contain atoms',
          ],
          correctAnswer: 'Crystalline materials possess a periodic, long-range ordered atomic lattice, whereas amorphous materials lack long-range geometric order',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What does the First Law of Thermodynamics (Principle of Conservation of Energy) state?',
          options: [
            'Energy cannot be created or destroyed; it can only be transformed from one form to another',
            'Energy is consumed and permanently disappears when work is done',
            'Thermal energy naturally flows from cold bodies to hot bodies without external work',
            'The universe constantly loses mass over time',
          ],
          correctAnswer: 'Energy cannot be created or destroyed; it can only be transformed from one form to another',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'On the pH scale measuring chemical acidity and alkalinity, what does a solution with a pH of 3 signify?',
          options: [
            'An acidic solution with a higher concentration of hydrogen ions (H⁺)',
            'A neutral substance like pure distilled water',
            'A strongly alkaline / basic solution',
            'A frozen solid',
          ],
          correctAnswer: 'An acidic solution with a higher concentration of hydrogen ions (H⁺)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In optical physics, what phenomenon causes a light ray to bend when passing from air into a denser medium like water or optical glass?',
          options: [
            'Refraction due to the change in the wave\'s propagation velocity across different media',
            'Diffraction around physical obstacles',
            'Total internal polarization',
            'Destructive acoustic interference',
          ],
          correctAnswer: 'Refraction due to the change in the wave\'s propagation velocity across different media',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In chemical bonding, what distinguishes a covalent bond from an ionic bond?',
          options: [
            'Covalent bonds involve the sharing of electron pairs between atoms, whereas ionic bonds involve the transfer of electrons creating electrostatic attraction',
            'Covalent bonds only occur in gases, while ionic bonds only occur in liquids',
            'Ionic bonds do not involve any electrons',
            'There is no distinction between covalent and ionic bonds',
          ],
          correctAnswer: 'Covalent bonds involve the sharing of electron pairs between atoms, whereas ionic bonds involve the transfer of electrons creating electrostatic attraction',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'How does a chemical catalyst accelerate the rate of a chemical reaction?',
          options: [
            'By lowering the activation energy barrier required for the reaction to proceed',
            'By increasing the physical volume of the reaction flask',
            'By destroying the reactant molecules permanently',
            'By reducing the gravitational force inside the laboratory',
          ],
          correctAnswer: 'By lowering the activation energy barrier required for the reaction to proceed',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In fluid dynamics and aerodynamics, what does the Reynolds Number (Re) predict?',
          options: [
            'Whether fluid flow behavior will be laminar (smooth) or turbulent (chaotic)',
            'The boiling point of water at sea level',
            'The speed of light in vacuum',
            'The electrical resistance of copper wire',
          ],
          correctAnswer: 'Whether fluid flow behavior will be laminar (smooth) or turbulent (chaotic)',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'What physical property describes a material\'s ability to undergo significant plastic deformation before fracturing (e.g. drawn into thin wires)?',
          options: ['Ductility', 'Brittleness', 'Permeability', 'Reflectivity'],
          correctAnswer: 'Ductility',
          points: 5,
        },
        {
          category: 'DOMAIN_SPECIFIC',
          prompt: 'In modern quantum physics and spectroscopy, what does Planck\'s equation (E = h × f) demonstrate?',
          options: [
            'The energy of a photon is directly proportional to the frequency of its electromagnetic radiation',
            'Energy is independent of light frequency',
            'Mass transforms into dark matter at high temperatures',
            'Sound travels faster than light in open space',
          ],
          correctAnswer: 'The energy of a photon is directly proportional to the frequency of its electromagnetic radiation',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 5. Hardware, Robotics, IoT & Embedded Systems
    if (p.includes('hardware') || p.includes('embedded') || p.includes('robot') || p.includes('iot')) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'Which hardware component is responsible for orchestrating the power-on self-test (POST) and initializing system hardware before the operating system boots?',
          options: ['BIOS / UEFI firmware', 'Random Access Memory (RAM)', 'Solid State Drive controller', 'Graphics Processing Unit (GPU)'],
          correctAnswer: 'BIOS / UEFI firmware',
          points: 5,
        },
        {
          category: 'DOMAIN_KNOWLEDGE',
          prompt: 'In computer hardware architecture, what is the primary distinction between RAM and NVMe Solid State Storage?',
          options: [
            'RAM is volatile high-speed memory that loses data upon power loss, while NVMe is non-volatile persistent storage',
            'RAM stores the operating system files permanently, while NVMe only caches web pages',
            'RAM operates over slow serial buses, while NVMe connects directly to audio controllers',
            'There is no functional distinction; both are identical flash storage chips'
          ],
          correctAnswer: 'RAM is volatile high-speed memory that loses data upon power loss, while NVMe is non-volatile persistent storage',
          points: 5,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          prompt: 'Which standard voltage rails are commonly supplied by an ATX desktop computer Power Supply Unit (PSU) to the motherboard and peripherals?',
          options: ['+12V, +5V, and +3.3V DC', '+220V, +110V, and +50V AC', '+1.5V and -1.5V DC only', '+48V and +96V DC'],
          correctAnswer: '+12V, +5V, and +3.3V DC',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'A computer technician powers on a workstation. The CPU fan spins, but the display remains completely black and the motherboard emits 1 long beep followed by 2 short beeps. What is the most probable fault?',
          options: [
            'Video card / display adapter detection failure or faulty seating',
            'Internet router cable is disconnected',
            'Computer keyboard caps lock key is stuck',
            'Printer ink cartridge is depleted'
          ],
          correctAnswer: 'Video card / display adapter detection failure or faulty seating',
          points: 5,
        },
        {
          category: 'APPLIED_MATHEMATICS',
          prompt: 'According to Ohm\'s Law (V = I × R), if a microcontroller sensor circuit has a voltage of 5 Volts across a resistor with 250 Ohms resistance, what current flows through it?',
          options: ['0.02 Amperes (20 mA)', '1,250 Amperes', '50 Amperes', '0.5 Amperes'],
          correctAnswer: '0.02 Amperes (20 mA)',
          points: 5,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          prompt: 'In digital electronics and logic design, which logic gate outputs TRUE (1) ONLY when both of its inputs are TRUE (1)?',
          options: ['AND Gate', 'OR Gate', 'NOT Gate', 'XOR Gate'],
          correctAnswer: 'AND Gate',
          points: 5,
        },
        {
          category: 'SAFETY_STANDARDS',
          prompt: 'Why is an Electrostatic Discharge (ESD) anti-static wrist strap mandatory when handling microprocessors, RAM modules, and bare motherboards?',
          options: [
            'To equalize electrical potential and prevent static charge from frying microscopic semiconductor gates',
            'To protect the technician from high-voltage 220V wall AC shocks',
            'To keep the technician\'s hands clean from thermal grease',
            'To prevent magnetic interference from mobile phones'
          ],
          correctAnswer: 'To equalize electrical potential and prevent static charge from frying microscopic semiconductor gates',
          points: 5,
        },
        {
          category: 'DOMAIN_KNOWLEDGE',
          prompt: 'In embedded systems and IoT microcontrollers (e.g. ESP32, Arduino), what is the function of a General Purpose Input/Output (GPIO) pin?',
          options: [
            'A programmable pin configured by software to either read sensor inputs or send control signals to actuators',
            'A physical port exclusively used to plug in high-definition HDMI monitors',
            'An internal cooling channel that pumps liquid nitrogen',
            'A battery cell that generates electrical voltage'
          ],
          correctAnswer: 'A programmable pin configured by software to either read sensor inputs or send control signals to actuators',
          points: 5,
        },
        {
          category: 'PROBLEM_SOLVING',
          prompt: 'A desktop system suddenly shuts down under heavy computational load after 10 minutes of operation. Inspection reveals CPU temperatures hitting 100°C. What is the priority remedial step?',
          options: [
            'Inspect CPU heatsink seating, clear accumulated dust, and apply fresh thermal interface paste',
            'Reinstall the operating system from a USB flash drive',
            'Replace the optical DVD drive',
            'Increase screen resolution in display settings'
          ],
          correctAnswer: 'Inspect CPU heatsink seating, clear accumulated dust, and apply fresh thermal interface paste',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'Which expansion bus protocol provides the highest direct data transfer throughput between the CPU and modern high-performance devices like GPUs and NVMe SSDs?',
          options: ['PCI Express (PCIe)', 'USB 2.0', 'Legacy RS-232 Serial Port', 'PS/2 Keyboard Interface'],
          correctAnswer: 'PCI Express (PCIe)',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 2. Software Engineering, Programming & Cloud
    if (p.includes('software') || p.includes('code') || p.includes('programming') || p.includes('web') || p.includes('full-stack')) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'What is the primary role of a distributed version control system like Git in modern engineering teams?',
          options: [
            'To track code history, facilitate parallel branching, and resolve concurrent changes',
            'To compile source code into binary machine instructions',
            'To provide wireless internet connection to development laptops',
            'To monitor electricity consumption of developer machines'
          ],
          correctAnswer: 'To track code history, facilitate parallel branching, and resolve concurrent changes',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'If a search algorithm has an O(log n) time complexity, how does the number of comparison operations grow as the dataset size doubles?',
          options: [
            'It increases by only a constant, small number of operations (roughly 1 step)',
            'It quadruples',
            'It doubles linearly',
            'It drops to zero'
          ],
          correctAnswer: 'It increases by only a constant, small number of operations (roughly 1 step)',
          points: 5,
        },
        {
          category: 'DOMAIN_KNOWLEDGE',
          prompt: 'In RESTful Web APIs, which HTTP method is canonically used to create a new resource on the server?',
          options: ['POST', 'GET', 'DELETE', 'OPTIONS'],
          correctAnswer: 'POST',
          points: 5,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          prompt: 'In database architecture, what is the role of a Foreign Key constraint?',
          options: [
            'To enforce referential integrity between records in two relational tables',
            'To encrypt sensitive user passwords before saving',
            'To store images directly inside the database cache',
            'To automatically translate SQL queries into JavaScript'
          ],
          correctAnswer: 'To enforce referential integrity between records in two relational tables',
          points: 5,
        },
        {
          category: 'PROBLEM_SOLVING',
          prompt: 'A web application form crashes with "Uncaught RangeError: Maximum call stack size exceeded". What code pattern typically triggers this error?',
          options: [
            'A recursive function executing indefinitely without reaching a terminating base case',
            'A CSS style declaration with an invalid hex color code',
            'A database table having more than 50 rows',
            'A user typing too quickly on their mechanical keyboard'
          ],
          correctAnswer: 'A recursive function executing indefinitely without reaching a terminating base case',
          points: 5,
        },
        {
          category: 'APPLIED_MATHEMATICS',
          prompt: 'What is the decimal (base 10) representation of the binary number 1101₂?',
          options: ['13', '11', '15', '14'],
          correctAnswer: '13',
          points: 5,
        },
        {
          category: 'SECURITY',
          prompt: 'Which software development practice most effectively prevents SQL Injection vulnerabilities in database-driven web applications?',
          options: [
            'Using parameterized queries / prepared statements with an ORM',
            'Concatenating raw user strings directly into SQL queries',
            'Storing database passwords in plain text in HTML comments',
            'Limiting database table names to 4 characters'
          ],
          correctAnswer: 'Using parameterized queries / prepared statements with an ORM',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'Which data structure follows the First-In, First-Out (FIFO) access discipline?',
          options: ['Queue', 'Stack', 'Binary Search Tree', 'Hash Map'],
          correctAnswer: 'Queue',
          points: 5,
        },
        {
          category: 'DOMAIN_KNOWLEDGE',
          prompt: 'What does HTTP response status code 404 signify?',
          options: [
            'The requested server resource could not be found',
            'The server encountered an unhandled internal crash',
            'The user lacks authentication credentials',
            'The request succeeded successfully'
          ],
          correctAnswer: 'The requested server resource could not be found',
          points: 5,
        },
        {
          category: 'PROBLEM_SOLVING',
          prompt: 'In asynchronous programming, what problem does the Promise pattern or async/await syntax solve compared to nested callbacks?',
          options: [
            'Eliminates deeply nested "callback hell" and provides structured error propagation',
            'Forces single-threaded JavaScript code to run on 64 CPU cores simultaneously',
            'Prevents web browsers from caching images',
            'Guarantees internet connections never disconnect'
          ],
          correctAnswer: 'Eliminates deeply nested "callback hell" and provides structured error propagation',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 3. AI, Data Science & Machine Learning
    if (p.includes('ai') || p.includes('data') || p.includes('intelligence') || p.includes('machine learning')) {
      const qList = [
        {
          category: 'DIGITAL_LITERACY',
          prompt: 'What fundamentally differentiates Machine Learning from classical rule-based computer programming?',
          options: [
            'ML algorithms infer statistical patterns and mathematical weights from data, whereas classical programming relies on explicit hardcoded rules',
            'ML programs only operate on Apple computers',
            'Classical programming cannot perform mathematical addition',
            'ML does not require any computer hardware or electricity'
          ],
          correctAnswer: 'ML algorithms infer statistical patterns and mathematical weights from data, whereas classical programming relies on explicit hardcoded rules',
          points: 5,
        },
        {
          category: 'DOMAIN_KNOWLEDGE',
          prompt: 'In supervised machine learning, what constitutes the training dataset?',
          options: [
            'Input features paired with corresponding ground-truth target labels',
            'Unlabeled images downloaded randomly from social media',
            'Source code files compiled without comments',
            'Database index files without any data'
          ],
          correctAnswer: 'Input features paired with corresponding ground-truth target labels',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'A machine learning model scores 99% accuracy on training data but drops to 52% accuracy on unseen test data. What problem is the model exhibiting?',
          options: [
            'Overfitting (memorizing noise instead of generalizing)',
            'Underfitting (model is too simple to learn patterns)',
            'Hardware GPU overheating',
            'Incorrect monitor display resolution'
          ],
          correctAnswer: 'Overfitting (memorizing noise instead of generalizing)',
          points: 5,
        },
        {
          category: 'APPLIED_MATHEMATICS',
          prompt: 'In data science, what does the arithmetic mean represent in a dataset?',
          options: [
            'The sum of all values divided by the total number of values',
            'The middle value when all numbers are sorted in order',
            'The most frequently occurring number in the dataset',
            'The difference between the maximum and minimum numbers'
          ],
          correctAnswer: 'The sum of all values divided by the total number of values',
          points: 5,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          prompt: 'Which Python numerical library is standard for multidimensional array calculations and vector operations in AI workflows?',
          options: ['NumPy', 'Flask', 'WordPress', 'Bootstrap'],
          correctAnswer: 'NumPy',
          points: 5,
        },
        {
          category: 'DOMAIN_KNOWLEDGE',
          prompt: 'In prompt engineering for Generative AI and Large Language Models, what is "Few-Shot Prompting"?',
          options: [
            'Providing the model with a few concrete input-output examples in the context window to steer format and reasoning',
            'Restricting the AI response to 3 words or fewer',
            'Sending prompt requests only 3 times per day',
            'Running the model on low battery power'
          ],
          correctAnswer: 'Providing the model with a few concrete input-output examples in the context window to steer format and reasoning',
          points: 5,
        },
        {
          category: 'PROBLEM_SOLVING',
          prompt: 'Why must training and test datasets be kept strictly separate during model development (preventing data leakage)?',
          options: [
            'To ensure the model is evaluated on genuinely unseen data to verify real-world generalization',
            'To conserve hard drive storage space',
            'Because modern operating systems cannot open two CSV files at once',
            'To make the training run take longer'
          ],
          correctAnswer: 'To ensure the model is evaluated on genuinely unseen data to verify real-world generalization',
          points: 5,
        },
        {
          category: 'ETHICS_AND_GOVERNANCE',
          prompt: 'What is a major ethical concern when deploying automated credit scoring or hiring algorithms trained on historical demographic data?',
          options: [
            'Algorithmic bias perpetuating and amplifying historical societal discrimination',
            'The computer running out of printer paper',
            'The algorithm generating too many colorful graphs',
            'Internet bandwidth slowdowns in the office'
          ],
          correctAnswer: 'Algorithmic bias perpetuating and amplifying historical societal discrimination',
          points: 5,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          prompt: 'In classification tasks, what does the "Precision" metric measure?',
          options: [
            'The proportion of positive identifications that were actually correct (True Positives / (True Positives + False Positives))',
            'The physical clock speed of the CPU processor',
            'The amount of RAM memory allocated to Python',
            'The total number of lines in the dataset'
          ],
          correctAnswer: 'The proportion of positive identifications that were actually correct (True Positives / (True Positives + False Positives))',
          points: 5,
        },
        {
          category: 'LOGICAL_REASONING',
          prompt: 'Which machine learning task involves predicting a continuous numerical value (such as electricity demand or crop yield)?',
          options: ['Regression', 'Binary Classification', 'Clustering', 'Dimensionality Reduction'],
          correctAnswer: 'Regression',
          points: 5,
        },
      ];
      return qList.slice(0, targetCount);
    }

    // 4. Default Comprehensive Diagnostic Assessment (for all STEM programs)
    const defaultList = [
      {
        category: 'DIGITAL_LITERACY',
        prompt: 'Which computer component is known as the "brain" of the computer, executing instructions and arithmetic logic?',
        options: ['Central Processing Unit (CPU)', 'Hard Disk Drive (HDD)', 'Power Supply Unit (PSU)', 'Computer Monitor'],
        correctAnswer: 'Central Processing Unit (CPU)',
        points: 5,
      },
      {
        category: 'LOGICAL_REASONING',
        prompt: 'Consider the pattern: 2, 6, 18, 54, ... What is the next logical number in the sequence?',
        options: ['162', '108', '72', '216'],
        correctAnswer: '162',
        points: 5,
      },
      {
        category: 'APPLIED_MATHEMATICS',
        prompt: 'A solar inverter system requires 2,400 Watts of peak power. If the battery bank operates at 24 Volts DC, what is the maximum current in Amperes (Power = Volts × Amps)?',
        options: ['100 Amps', '10 Amps', '57.6 Amps', '240 Amps'],
        correctAnswer: '100 Amps',
        points: 5,
      },
      {
        category: 'DIGITAL_LITERACY',
        prompt: 'Which unit is commonly used to measure the data storage capacity of a modern computer hard drive or SSD?',
        options: ['Gigabytes (GB) or Terabytes (TB)', 'Gigahertz (GHz)', 'Volts (V)', 'Amperes (A)'],
        correctAnswer: 'Gigabytes (GB) or Terabytes (TB)',
        points: 5,
      },
      {
        category: 'PROBLEM_SOLVING',
        prompt: 'If your computer refuses to connect to the local academy Wi-Fi network, which step is the most logical first troubleshooting action?',
        options: [
          'Verify Wi-Fi toggle is enabled on your device and check if other devices can connect to the access point',
          'Throw away the computer and purchase a new laptop',
          'Delete all documents from your desktop folder',
          'Disassemble the laptop screen using a screwdriver'
        ],
        correctAnswer: 'Verify Wi-Fi toggle is enabled on your device and check if other devices can connect to the access point',
        points: 5,
      },
      {
        category: 'LOGICAL_REASONING',
        prompt: 'In algorithm design, what is a "loop" used for?',
        options: [
          'Repeating a sequence of instructions until a specific condition is satisfied',
          'Permanently turning off computer power',
          'Printing a paper document on an inkjet printer',
          'Creating a graphical desktop wallpaper'
        ],
        correctAnswer: 'Repeating a sequence of instructions until a specific condition is satisfied',
        points: 5,
      },
      {
        category: 'TECHNICAL_KNOWLEDGE',
        prompt: 'What is the primary function of cloud computing platforms like AWS, Microsoft Azure, and Google Cloud?',
        options: [
          'Providing on-demand computing power, storage, and databases over the internet without local server maintenance',
          'Manufacturing physical computer keyboards and mice',
          'Controlling atmospheric weather patterns and rain clouds',
          'Repairing broken laptop screens by mail'
        ],
        correctAnswer: 'Providing on-demand computing power, storage, and databases over the internet without local server maintenance',
        points: 5,
      },
      {
        category: 'APPLIED_MATHEMATICS',
        prompt: 'If a project team completes 45% of a technical curriculum in 9 weeks, at that consistent pace how many total weeks will the 100% curriculum take?',
        options: ['20 weeks', '15 weeks', '25 weeks', '18 weeks'],
        correctAnswer: '20 weeks',
        points: 5,
      },
      {
        category: 'DIGITAL_LITERACY',
        prompt: 'Which file extension typically denotes an uncompressed executable application on a Windows computer?',
        options: ['.exe', '.mp3', '.jpg', '.pdf'],
        correctAnswer: '.exe',
        points: 5,
      },
      {
        category: 'PROBLEM_SOLVING',
        prompt: 'When working in a technical innovation laboratory, what is the most important primary rule regarding hardware electrical safety?',
        options: [
          'Always disconnect the main power source before opening or servicing any electrical equipment',
          'Wear metal rings and bracelets for grounding',
          'Keep open cups of water directly beside active circuit boards',
          'Ignore warning labels on high-voltage power supplies'
        ],
        correctAnswer: 'Always disconnect the main power source before opening or servicing any electrical equipment',
        points: 5,
      },
    ];
    return defaultList.slice(0, targetCount);
  }
}

export const assessmentService = AssessmentService;
