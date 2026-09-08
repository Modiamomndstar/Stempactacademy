import prisma from '../config/prisma.js';

export async function seedMoreAssessments() {
  console.log('Seeding domain-specific dynamic diagnostic assessments...');

  // 1. Find target programs
  const aiProgram = await prisma.program.findFirst({
    where: { OR: [{ code: 'DMAP-07' }, { name: { contains: 'AI for Education', mode: 'insensitive' } }, { code: 'AIDM-02' }] },
  });

  const seProgram = await prisma.program.findFirst({
    where: { OR: [{ code: 'CSE-04' }, { code: 'CSE-02' }, { name: { contains: 'Full-Stack', mode: 'insensitive' } }] },
  });

  const solarProgram = await prisma.program.findFirst({
    where: { OR: [{ code: 'RETE-01' }, { name: { contains: 'Solar', mode: 'insensitive' } }] },
  });

  const kidsProgram = await prisma.program.findFirst({
    where: { OR: [{ code: 'SKT-01' }, { name: { contains: 'Kids', mode: 'insensitive' } }] },
  });

  // --- SEED 1: AI & Educational Tech Diagnostic Assessment ---
  if (aiProgram) {
    const existing = await prisma.assessment.findFirst({ where: { programId: aiProgram.id } });
    if (!existing) {
      const aiAssessment = await prisma.assessment.create({
        data: {
          title: 'STEMPACT AI & Educational Technology Diagnostic Placement Test',
          programId: aiProgram.id,
          durationMinutes: 25,
          passingScore: 60,
          instructions:
            'This assessment evaluates your foundational knowledge in Artificial Intelligence, prompt engineering, data literacy, and the practical application of AI tools in education and digital workflows.',
        },
      });

      const aiQuestions = [
        {
          category: 'TECHNICAL_KNOWLEDGE',
          type: 'MULTIPLE_CHOICE',
          prompt: 'Which of the following best defines a Large Language Model (LLM) like GPT or Claude?',
          options: JSON.stringify([
            'A database that stores hardcoded answers to common questions',
            'A neural network trained on vast text datasets to predict next tokens and understand linguistic patterns',
            'A computer program that executes SQL queries on school servers',
            'An operating system driver designed for graphics cards',
          ]),
          correctAnswer: 'A neural network trained on vast text datasets to predict next tokens and understand linguistic patterns',
          points: 5,
          order: 1,
        },
        {
          category: 'PROBLEM_SOLVING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'In prompt engineering, what is the primary purpose of "Few-Shot Prompting"?',
          options: JSON.stringify([
            'Limiting the model to generating only three words',
            'Providing the model with a few input-output examples in the context window to guide its response format and tone',
            'Restricting the prompt length to save server memory',
            'Allowing only two users to query the model simultaneously',
          ]),
          correctAnswer: 'Providing the model with a few input-output examples in the context window to guide its response format and tone',
          points: 5,
          order: 2,
        },
        {
          category: 'DIGITAL_LITERACY',
          type: 'MULTIPLE_CHOICE',
          prompt: 'When an AI system generates convincingly written but factually incorrect or fabricated information, what is this phenomenon called?',
          options: JSON.stringify([
            'Token overflow',
            'Model Hallucination',
            'Cache eviction',
            'Quantization error',
          ]),
          correctAnswer: 'Model Hallucination',
          points: 5,
          order: 3,
        },
        {
          category: 'LOGICAL_REASONING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'A teacher wants to use AI to generate personalized practice quizzes based on each student’s past mistakes. What is the most ethically responsible data practice?',
          options: JSON.stringify([
            'Upload all student personal identifiers, home addresses, and phone numbers into a public AI tool',
            'Anonymize student records, remove PII (Personally Identifiable Information), and use privacy-compliant educational models',
            'Disable all student feedback and assume AI outputs are always 100% accurate',
            'Avoid saving any quiz results and rely purely on oral tests',
          ]),
          correctAnswer: 'Anonymize student records, remove PII (Personally Identifiable Information), and use privacy-compliant educational models',
          points: 5,
          order: 4,
        },
        {
          category: 'PROGRAMMING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'What Python library is most commonly used for handling tabular datasets and data analysis in AI pipelines?',
          options: JSON.stringify(['pandas', 'Flask', 'Django', 'Tailwind']),
          correctAnswer: 'pandas',
          points: 5,
          order: 5,
        },
        {
          category: 'MATHEMATICS',
          type: 'MULTIPLE_CHOICE',
          prompt: 'If a machine learning classifier correctly identifies 85 out of 100 student homework submissions as complete, what is the accuracy percentage of the model?',
          options: JSON.stringify(['70%', '80%', '85%', '90%']),
          correctAnswer: '85%',
          points: 5,
          order: 6,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          type: 'MULTIPLE_CHOICE',
          prompt: 'What is "Retrieval-Augmented Generation" (RAG) in modern AI applications?',
          options: JSON.stringify([
            'A technique that combines information retrieval from a trusted knowledge base with an LLM to generate factual, cited responses',
            'A method to speed up graphic rendering in video editing software',
            'A way to delete cached student data after semester graduation',
            'An optical character recognition tool for grading physical paper exam sheets',
          ]),
          correctAnswer: 'A technique that combines information retrieval from a trusted knowledge base with an LLM to generate factual, cited responses',
          points: 5,
          order: 7,
        },
        {
          category: 'PROBLEM_SOLVING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'A school wants to automate grading of student essays using AI. What is the best pedagogical workflow?',
          options: JSON.stringify([
            'Fully replace teachers and let AI assign final semester grades without human supervision',
            'Use AI as an assistive co-pilot to provide formative feedback and rubrics, with teachers making the final grading determination',
            'Discard all student writing assignments and only use multiple choice tests',
            'Grade only the fastest submissions and ignore the rest',
          ]),
          correctAnswer: 'Use AI as an assistive co-pilot to provide formative feedback and rubrics, with teachers making the final grading determination',
          points: 5,
          order: 8,
        },
      ];

      for (const q of aiQuestions) {
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: aiAssessment.id,
            category: q.category,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            order: q.order,
          },
        });
      }
      console.log(`Successfully created AI assessment: ${aiAssessment.title}`);
    }
  }

  // --- SEED 2: Renewable Energy & Solar Diagnostic Assessment ---
  if (solarProgram) {
    const existing = await prisma.assessment.findFirst({ where: { programId: solarProgram.id } });
    if (!existing) {
      const solarAssessment = await prisma.assessment.create({
        data: {
          title: 'STEMPACT Renewable Energy & Solar Engineering Diagnostic Test',
          programId: solarProgram.id,
          durationMinutes: 30,
          passingScore: 60,
          instructions:
            'Evaluates foundational electrical concepts, solar photovoltaic principles, battery sizing, and system safety procedures.',
        },
      });

      const solarQuestions = [
        {
          category: 'MATHEMATICS',
          type: 'MULTIPLE_CHOICE',
          prompt: 'According to Ohm\'s Law, what is the formula to calculate Electrical Power (Watts)?',
          options: JSON.stringify(['P = V × I', 'P = V / R', 'P = I × R', 'P = V + I']),
          correctAnswer: 'P = V × I',
          points: 5,
          order: 1,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          type: 'MULTIPLE_CHOICE',
          prompt: 'What is the primary function of an Inverter in a residential solar power system?',
          options: JSON.stringify([
            'Converts AC power from the grid into DC power for batteries',
            'Converts DC power generated by solar panels/batteries into AC power for household appliances',
            'Increases water pressure in solar thermal heaters',
            'Monitors internet wifi signals around solar panels',
          ]),
          correctAnswer: 'Converts DC power generated by solar panels/batteries into AC power for household appliances',
          points: 5,
          order: 2,
        },
        {
          category: 'PROBLEM_SOLVING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'Two 12V 200Ah deep-cycle batteries are connected in SERIES. What is the resulting voltage and amp-hour capacity?',
          options: JSON.stringify([
            '12V, 400Ah',
            '24V, 200Ah',
            '24V, 400Ah',
            '12V, 200Ah',
          ]),
          correctAnswer: '24V, 200Ah',
          points: 5,
          order: 3,
        },
        {
          category: 'DIGITAL_LITERACY',
          type: 'MULTIPLE_CHOICE',
          prompt: 'Which type of solar charge controller is significantly more efficient because it tracks the maximum power operating point of solar panels?',
          options: JSON.stringify(['PWM (Pulse Width Modulation)', 'MPPT (Maximum Power Point Tracking)', 'Manual Rheostat', 'Direct Diode']),
          correctAnswer: 'MPPT (Maximum Power Point Tracking)',
          points: 5,
          order: 4,
        },
        {
          category: 'TECHNICAL_KNOWLEDGE',
          type: 'MULTIPLE_CHOICE',
          prompt: 'What safety precaution MUST always be observed before working on the DC disconnect switch of a rooftop solar array?',
          options: JSON.stringify([
            'Ensure the inverter is switched off and verify zero voltage with an insulated multimeter',
            'Pour cold water over the panels to lower surface temperature',
            'Touch both positive and negative terminals with bare hands to test for static',
            'Disconnect the grounding wire first',
          ]),
          correctAnswer: 'Ensure the inverter is switched off and verify zero voltage with an insulated multimeter',
          points: 5,
          order: 5,
        },
      ];

      for (const q of solarQuestions) {
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: solarAssessment.id,
            category: q.category,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            order: q.order,
          },
        });
      }
      console.log(`Successfully created Solar assessment: ${solarAssessment.title}`);
    }
  }

  // --- SEED 3: Kids & Teens Computational Thinking Assessment ---
  if (kidsProgram) {
    const existing = await prisma.assessment.findFirst({ where: { programId: kidsProgram.id } });
    if (!existing) {
      const kidsAssessment = await prisma.assessment.create({
        data: {
          title: 'STEMPACT Kids & Teens Computational Thinking Assessment',
          programId: kidsProgram.id,
          durationMinutes: 20,
          passingScore: 50,
          instructions:
            'A fun, interactive diagnostic puzzle testing sequencing, loops, visual block logic, and creative problem solving.',
        },
      });

      const kidsQuestions = [
        {
          category: 'LOGICAL_REASONING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'In Scratch coding, which block category is used to make a character sprite walk, turn, or glide across the stage?',
          options: JSON.stringify(['Motion (Blue)', 'Looks (Purple)', 'Sound (Pink)', 'Variables (Orange)']),
          correctAnswer: 'Motion (Blue)',
          points: 5,
          order: 1,
        },
        {
          category: 'PROBLEM_SOLVING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'You want your robot sprite to draw a square on the screen. It moves forward 100 steps and turns right 90 degrees. How many times should this sequence repeat?',
          options: JSON.stringify(['2 times', '3 times', '4 times', '10 times']),
          correctAnswer: '4 times',
          points: 5,
          order: 2,
        },
        {
          category: 'DIGITAL_LITERACY',
          type: 'MULTIPLE_CHOICE',
          prompt: 'What is the most important rule when creating passwords for your online learning accounts?',
          options: JSON.stringify([
            'Use your full name and birthday so you never forget it',
            'Share your password with all your classmates',
            'Use a strong, unique passphrase with letters and numbers, and never share it publicly',
            'Write your password on your school bag',
          ]),
          correctAnswer: 'Use a strong, unique passphrase with letters and numbers, and never share it publicly',
          points: 5,
          order: 3,
        },
        {
          category: 'PROGRAMMING',
          type: 'MULTIPLE_CHOICE',
          prompt: 'What is a "Bug" in computer programming?',
          options: JSON.stringify([
            'A physical insect inside your computer screen',
            'An error or mistake in the code that makes the program behave unexpectedly',
            'A new game character downloaded from the internet',
            'A feature that makes computers run faster',
          ]),
          correctAnswer: 'An error or mistake in the code that makes the program behave unexpectedly',
          points: 5,
          order: 4,
        },
      ];

      for (const q of kidsQuestions) {
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: kidsAssessment.id,
            category: q.category,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            order: q.order,
          },
        });
      }
      console.log(`Successfully created Kids & Teens assessment: ${kidsAssessment.title}`);
    }
  }

  console.log('Dynamic assessment seeding complete!');
}

if (process.argv[1] && process.argv[1].includes('seedMoreAssessments')) {
  seedMoreAssessments()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}
