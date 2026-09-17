import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { IAIProvider, AIOptions, AIGenerationResult } from './types.js';

export class GeminiProvider implements IAIProvider {
  name = 'google-gemini';
  private ai: GoogleGenAI;
  private defaultModel: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.defaultModel = model;
  }

  async generateStructured<T>(prompt: string, schema: z.ZodType<T>, options?: AIOptions): Promise<AIGenerationResult<T>> {
    const startTime = Date.now();
    const model = this.defaultModel;

    const systemPrompt = `${options?.systemInstruction || 'You are the Chief Academic Officer & Senior Curriculum Architect at STEMPACT Academy, an elite STEM, Digital Skills, and Entrepreneurship Institution in Ile-Ife, Nigeria.'}
You MUST respond with valid JSON strictly adhering to the expected schema without markdown wrappers, markdown codeblocks, or extra conversational prose.`;

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: options?.temperature ?? 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const latencyMs = Date.now() - startTime;

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        // Clean markdown backticks if any
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      const validated = schema.parse(parsed);

      return {
        structured: validated,
        rawText,
        tokensPrompt: response.usageMetadata?.promptTokenCount || 0,
        tokensCompletion: response.usageMetadata?.candidatesTokenCount || 0,
        costEstimate: ((response.usageMetadata?.totalTokenCount || 0) * 0.000001),
        model,
        provider: this.name,
        latencyMs,
      };
    } catch (error: any) {
      console.error('[GeminiProvider Error]:', error);
      throw new Error(`AI Structured Generation Failed: ${error.message}`);
    }
  }

  async generateText(prompt: string, options?: AIOptions): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number; latencyMs: number }> {
    const startTime = Date.now();
    const model = this.defaultModel;

    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: options?.systemInstruction,
        temperature: options?.temperature ?? 0.7,
      },
    });

    return {
      text: response.text || '',
      tokensPrompt: response.usageMetadata?.promptTokenCount || 0,
      tokensCompletion: response.usageMetadata?.candidatesTokenCount || 0,
      latencyMs: Date.now() - startTime,
    };
  }
}

export class MockProvider implements IAIProvider {
  name = 'mock-provider';

  async generateStructured<T>(prompt: string, schema: z.ZodType<T>, options?: AIOptions): Promise<AIGenerationResult<T>> {
    const startTime = Date.now();
    console.log('[MockProvider] Generating realistic structured academic artifact for prompt:', prompt.slice(0, 100));

    // Fallback generator returning valid mock data based on keywords
    let mockData: any = {};

    if (
      prompt.toLowerCase().includes('quality') ||
      prompt.toLowerCase().includes('rubric') ||
      prompt.toLowerCase().includes('audit')
    ) {
      mockData = {
        overallStatus: 'PASS',
        qualityScore: 94,
        summary: 'The proposed academic structure demonstrates exceptional pedagogical rigor, clear competency mapping, and strong balance between theory and lab practice.',
        findings: [
          {
            category: 'PRACTICAL_BALANCE',
            severity: 'INFO',
            issue: 'Theory-to-practical ratio is 30:70, which aligns perfectly with STEMPACT hands-on experiential standards.',
            recommendation: 'Ensure hardware lab benches are reserved in advance for Week 8 micro-controller sessions.',
          },
          {
            category: 'COMPETENCIES',
            severity: 'INFO',
            issue: 'All 8 course modules map directly to measurable industry competencies with evaluation rubrics.',
            recommendation: 'Include a portfolio tag for each completed competency so students can showcase them on graduation.',
          },
        ],
      };
    } else if (prompt.includes('Program') || prompt.includes('program')) {
      mockData = {
        name: 'AI & Machine Learning Engineering Specialist',
        code: 'STP-AIML-SPEC',
        schoolCode: 'SAIML',
        description: 'Comprehensive 6-month hands-on engineering program mastering modern ML, Deep Learning, LLMs and practical production deployment.',
        targetLearner: 'Aspiring AI engineers, computer science undergraduates, and software developers transitioning into machine learning.',
        entryRequirements: 'Basic programming knowledge in Python, fundamental linear algebra, and personal laptop.',
        prerequisites: 'Foundational Python or completion of STEMPACT Foundation Level 1.',
        level: 'LEVEL_3_ADVANCED',
        duration: '6 Months (24 Weeks)',
        contactHours: 144,
        theoryPracticalRatio: '30:70',
        tools: ['Python 3.12', 'PyTorch', 'Hugging Face', 'Scikit-Learn', 'FastAPI', 'Docker', 'PostgreSQL'],
        learningOutcomes: [
          'Design and train deep neural networks with PyTorch',
          'Fine-tune and deploy open-source LLMs using LoRA and Hugging Face',
          'Build end-to-end RAG pipelines with vector databases',
          'Deploy production-grade machine learning microservices with containerization',
        ],
        careerPathways: ['Machine Learning Engineer', 'AI Solutions Architect', 'Data Scientist', 'AI Product Developer'],
        courses: [
          {
            code: 'AIML-301',
            title: 'Mathematical Foundations & Statistical Learning',
            description: 'Core linear algebra, probability, vector calculus and classical statistical learning algorithms.',
            credits: 3,
            order: 1,
            modules: [
              {
                title: 'Vector Calculus & Gradient Optimization',
                description: 'Matrix decompositions, loss surfaces, stochastic gradient descent, and backpropagation mechanics.',
                durationHours: 12,
                order: 1,
                lessons: [
                  {
                    title: 'Derivatives, Jacobians, and Neural Network Backprop',
                    contentSummary: 'Step-by-step mathematical derivation and code implementation of the chain rule in computation graphs.',
                    practicalActivities: ['Implement backprop from scratch in pure NumPy', 'Visualize gradient descent convergence on non-convex surfaces'],
                  },
                ],
              },
            ],
          },
          {
            code: 'AIML-302',
            title: 'Deep Learning Architectures & Transformer Models',
            description: 'CNNs, RNNs, Self-Attention mechanisms, and the modern Transformer architecture.',
            credits: 4,
            order: 2,
            modules: [
              {
                title: 'Attention Mechanisms and Transformer Blocks',
                description: 'Multi-head self-attention, positional encodings, layer norm, and feed-forward sub-layers.',
                durationHours: 18,
                order: 1,
                lessons: [
                  {
                    title: 'Coding the Attention Mechanism From Scratch',
                    contentSummary: 'Mathematical formulation of Q, K, V matrices, softmax scaling, and causal masking.',
                    practicalActivities: ['Build a miniature nanoGPT model in PyTorch', 'Train on Shakespeare text to observe text generation'],
                  },
                ],
              },
            ],
          },
        ],
        competencies: [
          {
            code: 'COMP-AIML-01',
            title: 'PyTorch Model Architecture Design',
            description: 'Ability to construct modular PyTorch nn.Module networks with customized forward passes and loss functions.',
            category: 'Technical',
          },
          {
            code: 'COMP-AIML-02',
            title: 'RAG Pipeline Construction',
            description: 'Ability to construct vector chunking, embedding, and semantic retrieval pipelines for LLMs.',
            category: 'Applied AI',
          },
        ],
        capstoneProject: {
          title: 'Autonomous Multi-Agent AI System for Healthcare / Agriculture in Nigeria',
          problemStatement: 'Develop a practical multi-agent AI pipeline addressing rural clinic triage or agricultural crop disease detection using mobile imagery.',
          expectedOutputs: 'Working web API, trained model weights, evaluation benchmark report, and live demonstration video.',
          durationWeeks: 4,
        },
        certificationRequirements: '80% class attendance, completion of all weekly lab sprints, 75%+ on mid-term assessment, and successful capstone presentation.',
      };
    } else if (prompt.includes('Lesson') || prompt.includes('lesson')) {
      mockData = {
        lessonTitle: 'Building Multi-Head Self-Attention in PyTorch',
        durationMinutes: 90,
        targetLevel: 'Level 3 (Advanced)',
        prerequisiteKnowledge: ['Python tensor operations', 'Basic matrix multiplication', 'Softmax activation function'],
        learningObjectives: [
          'Explain the mathematical formulation of scaled dot-product attention',
          'Implement multi-head attention using PyTorch linear layers and transpose operations',
          'Apply causal attention masks for auto-regressive generation',
        ],
        equipmentAndSoftware: ['VS Code / Jupyter Notebook', 'Python 3.11+', 'PyTorch 2.0+ (CPU or CUDA)'],
        safetyPrecautions: 'Ensure proper ergonomic seating and eye breaks during intensive code sprint.',
        lessonPhases: [
          {
            phaseName: 'Hook & Context Setting',
            allocatedMinutes: 15,
            instructorActions: 'Demonstrate how traditional RNNs bottleneck information and why self-attention solves parallelization.',
            learnerActions: 'Participate in discussion comparing sequential vs. parallel sequence modeling.',
            keyQuestions: ['Why does scaled dot-product divide by sqrt(d_k)?', 'What is the purpose of the query and key projection?'],
          },
          {
            phaseName: 'Technical Demonstration',
            allocatedMinutes: 30,
            instructorActions: 'Live-code the MultiHeadAttention class block in PyTorch, walking through tensor dimension shapes.',
            learnerActions: 'Follow along in local coding environment, annotating shape comments next to each line.',
            keyQuestions: ['What are the 4 dimensions of the attention tensor: (batch, heads, seq_len, head_dim)?'],
          },
          {
            phaseName: 'Hands-On Practical Lab',
            allocatedMinutes: 35,
            instructorActions: 'Circulate through the lab desks, assisting students with dimension mismatch errors and mask broadcasting.',
            learnerActions: 'Complete the student lab sprint: add dropout and residual connection to the attention block.',
            keyQuestions: ['How does residual connection prevent vanishing gradients in deep transformers?'],
          },
          {
            phaseName: 'Check for Understanding & Wrap-Up',
            allocatedMinutes: 10,
            instructorActions: 'Review the 2 quick-fire check questions and assign the take-home sprint.',
            learnerActions: 'Submit git commit link of completed attention class.',
            keyQuestions: ['What happens if we do not mask future tokens in an auto-regressive model?'],
          },
        ],
        inClassQuizQuestions: [
          {
            question: 'What is the time complexity of self-attention with respect to sequence length N?',
            answer: 'O(N^2) quadratic complexity.',
          },
        ],
        homeworkAssignment: {
          title: 'Implement Feed-Forward Sublayer and LayerNorm to Complete the Transformer Block',
          instructions: 'Combine your MultiHeadAttention with a position-wise feed-forward network and Pre-LayerNorm to produce a complete TransformerEncoderBlock.',
          submissionDeadlineDays: 4,
        },
      };
    } else {
      mockData = {
        title: 'Diagnostic Placement Assessment: Full-Stack & Systems Engineering',
        description: 'Adaptive diagnostic evaluation assessing digital literacy, algorithmic problem-solving, and web fundamentals.',
        timeLimitMinutes: 45,
        passingScorePercentage: 70,
        questions: [
          {
            questionText: 'What is the primary role of a relational database foreign key?',
            questionType: 'MCQ',
            category: 'Database Systems',
            difficulty: 'MEDIUM',
            points: 5,
            options: [
              'To uniquely identify a record in the primary table',
              'To establish and enforce a linked relationship between data in two tables',
              'To encrypt column data for privacy',
              'To speed up full-text search indexing',
            ],
            correctAnswer: 'To establish and enforce a linked relationship between data in two tables',
            explanation: 'A foreign key creates a referential constraint matching the primary key in another table.',
          },
        ],
      };
    }

    const validated = schema && typeof schema.parse === 'function' ? schema.parse(mockData) : (mockData as T);
    const rawText = JSON.stringify(validated, null, 2);

    return {
      structured: validated,
      rawText,
      tokensPrompt: 450,
      tokensCompletion: 820,
      costEstimate: 0,
      model: 'mock-academic-engine-v1',
      provider: this.name,
      latencyMs: Date.now() - startTime,
    };
  }

  async generateText(prompt: string, options?: AIOptions): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number; latencyMs: number }> {
    return {
      text: `[STEMPACT AI Assistant]: Based on approved academic curriculum and institutional policies, here is the recommended guidance for: "${prompt.slice(0, 80)}...". All learner progress is actively monitored with continuous practical assessments.`,
      tokensPrompt: 120,
      tokensCompletion: 180,
      latencyMs: 150,
    };
  }
}

let cachedProvider: IAIProvider | null = null;

export const getAIProvider = (): IAIProvider => {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.AI_MODEL || 'gemini-2.5-flash';

  if (apiKey) {
    console.log(`🧠 [AI Engine] Initialized Google Gemini Provider with model: ${model}`);
    cachedProvider = new GeminiProvider(apiKey, model);
  } else {
    console.warn(`⚠️ [AI Engine] No GEMINI_API_KEY found in environment. Using MockProvider for deterministic offline testing.`);
    cachedProvider = new MockProvider();
  }

  return cachedProvider;
};
