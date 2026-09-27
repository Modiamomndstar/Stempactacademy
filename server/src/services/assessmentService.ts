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
   * Resolves the canonical Assessment and current AssessmentVersion for a program or application.
   * If no assessment exists for the chosen program, AI automatically generates and stores
   * a tailored diagnostic assessment specifically for that program.
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

    // 3. Fallback to any general assessment with valid questions
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
    }

    // 4. If STILL no assessment exists or if the program doesn't have one, generate with AI!
    if (!assessment || (targetProgramId && assessment.programId !== targetProgramId)) {
      if (targetProgramId) {
        const aiGenerated = await AssessmentService.generateAiAssessmentForProgram(targetProgramId);
        if (aiGenerated) return aiGenerated;
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
  static async generateAiAssessmentForProgram(programId: string) {
    try {
      const prog = await prisma.program.findUnique({
        where: { id: programId },
        include: { school: true },
      });

      if (!prog) return null;

      const programTitle = prog.name;
      const schoolName = prog.school?.name || 'STEM Technical Academy';

      let rawQuestions: Array<{
        prompt: string;
        category: string;
        options: string[];
        correctAnswer: string;
        points: number;
      }> = [];

      // 1. Try AI Generation via AIOrchestrator
      try {
        const prompt = `Generate a rigorous, 10-question multiple-choice diagnostic placement test for the academic program "${programTitle}" in the school of "${schoolName}".
The assessment must evaluate baseline technical competencies across:
1. DIGITAL_LITERACY (computer operations, architecture, and technology fundamentals)
2. LOGICAL_REASONING (computational logic, problem solving, sequencing)
3. APPLIED_MATHEMATICS (algebra, units, and calculations relevant to ${programTitle})
4. DOMAIN_SPECIFIC (core fundamentals and practical scenarios in ${programTitle})

Return exactly 10 questions. Every question must have 4 distinct options and 1 clear correct answer.
Difficulty: Baseline Placement Diagnostic.`;

        const aiResult = await AIOrchestrator.generateStructured({
          actionType: AIActionType.ASSESSMENT_GENERATION,
          prompt,
          schema: AssessmentGenerationSchema,
          contextData: { programId, programTitle, schoolName },
          userId: 'system-ai-engine',
          userRole: Role.SUPER_ADMIN,
        });

        if (aiResult?.structured?.questions && aiResult.structured.questions.length > 0) {
          rawQuestions = aiResult.structured.questions.map((q: any) => ({
            prompt: q.questionText || q.prompt,
            category: q.category || 'TECHNICAL_KNOWLEDGE',
            options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'Option A'),
            points: q.points || 5,
          }));
        }
      } catch (aiErr) {
        console.warn('[AssessmentService] AI generation provider error, using domain-tailored generation:', aiErr);
      }

      // 2. If AI output was insufficient, use smart domain-tailored generator
      if (!rawQuestions || rawQuestions.length < 5) {
        rawQuestions = AssessmentService.createDomainDiagnosticQuestions(prog.name, schoolName);
      }

      // 3. Persist new Assessment in Database
      const newAssessment = await prisma.assessment.create({
        data: {
          title: `STEMPACT ${prog.name} Diagnostic Placement Assessment (AI-Generated)`,
          programId: prog.id,
          durationMinutes: 30,
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
          durationMinutes: 30,
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
  static createDomainDiagnosticQuestions(programName: string, schoolName: string) {
    const p = (programName + ' ' + schoolName).toLowerCase();

    // 1. Hardware, Robotics, IoT & Embedded Systems
    if (p.includes('hardware') || p.includes('embedded') || p.includes('robot') || p.includes('iot')) {
      return [
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
    }

    // 2. Software Engineering, Programming & Cloud
    if (p.includes('software') || p.includes('code') || p.includes('programming') || p.includes('web') || p.includes('full-stack')) {
      return [
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
    }

    // 3. AI, Data Science & Machine Learning
    if (p.includes('ai') || p.includes('data') || p.includes('intelligence') || p.includes('machine learning')) {
      return [
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
    }

    // 4. Default Comprehensive Diagnostic Assessment (for all STEM programs)
    return [
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
  }
}

export const assessmentService = AssessmentService;
