import { WorkflowStatus, ProgramStatus, AcademicLevel } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ProgramGenerationData } from '../ai/types.js';

export class WorkflowEngine {
  /**
   * Transition an AI Generation through workflow states
   */
  static async updateGenerationStatus(params: {
    generationId: string;
    newStatus: WorkflowStatus;
    reviewerId: string;
    reviewNotes?: string;
  }) {
    return prisma.aIGeneration.update({
      where: { id: params.generationId },
      data: {
        status: params.newStatus,
        approvedById: params.reviewerId,
        reviewedAt: new Date(),
        reviewNotes: params.reviewNotes,
      },
    });
  }

  /**
   * Approves an AI-Generated Program and executes canonical database creation
   * Strictly respects: AI PROPOSES -> HUMAN APPROVES -> SYSTEM PERSISTS
   */
  static async approveAndPublishProgram(params: {
    generationId?: string;
    approverId: string;
    overrideData?: Partial<ProgramGenerationData>;
  }) {
    const generation = params.generationId
      ? await prisma.aIGeneration.findUnique({
          where: { id: params.generationId },
        })
      : null;

    if (!generation && !params.overrideData) {
      throw new Error('AI Generation record not found and no program draft data provided.');
    }

    const rawData: any = {
      ...((generation?.structuredOutput as any) || {}),
      ...(params.overrideData || {}),
    };

    // 1. Resolve or fallback school
    const schoolCode = rawData.schoolCode || 'SCSE';
    const school = (await prisma.school.findFirst({
      where: {
        OR: [{ code: schoolCode }, { code: 'SCSE' }],
      },
    })) || (await prisma.school.findFirst());

    if (!school) {
      throw new Error(`Target school code "${schoolCode}" does not exist in academy registry.`);
    }

    const code = rawData.code || `PRG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const name = rawData.name || 'AI-Engineered Academic Program';
    const description = rawData.description || '';
    const targetLearner = rawData.targetLearner || rawData.targetAudience || 'Undergraduates, engineers, and digital practitioners';
    const entryRequirements = rawData.entryRequirements || 'Basic computing literacy and logical reasoning';
    const prerequisites = Array.isArray(rawData.prerequisites)
      ? rawData.prerequisites.join(', ')
      : (rawData.prerequisites || 'Basic computing literacy');
    const duration = rawData.duration || (rawData.durationWeeks ? `${rawData.durationWeeks} Weeks` : '12 Weeks');
    const contactHours = typeof rawData.contactHours === 'number' ? rawData.contactHours : 48;
    const tools = Array.isArray(rawData.tools)
      ? rawData.tools.join(', ')
      : (rawData.tools || 'Modern Engineering Tools');
    const capstoneProject = rawData.capstoneProject || {
      title: `${name} Capstone Project`,
      problemStatement: 'Develop an end-to-end production solution solving a practical challenge in the Nigerian or African ecosystem.',
      expectedOutputs: 'Working prototype, GitHub repository, system documentation, and demo presentation.',
      durationWeeks: 4,
    };
    const certificationRequirements = rawData.certificationRequirements || '75% attendance, completion of all weekly labs, and successful capstone presentation.';
    const competenciesList = Array.isArray(rawData.competencies) ? rawData.competencies : [];
    const compStr = competenciesList.map((c: any) => (typeof c === 'string' ? c : c.title)).join(', ') || 'Practical Software Architecture, Cloud Deployment';
    const careerPathwaysList = Array.isArray(rawData.careerPathways)
      ? rawData.careerPathways
      : (Array.isArray(rawData.careerOutcomes) ? rawData.careerOutcomes : ['Software Engineer', 'Systems Architect']);
    const careerPathways = careerPathwaysList.join(', ');
    const level = (rawData.level as AcademicLevel) || AcademicLevel.LEVEL_2_INTERMEDIATE;

    // 2. Atomic canonical database transaction
    return prisma.$transaction(async (tx) => {
      // Create or update Program
      const program = await tx.program.upsert({
        where: { code },
        update: {
          name,
          description,
          targetLearner,
          entryRequirements,
          prerequisites,
          duration,
          contactHours,
          learningLevels: `Foundation to Advanced`,
          tools,
          projects: capstoneProject.title,
          capstone: capstoneProject.problemStatement,
          assessmentCriteria: certificationRequirements,
          competencies: compStr,
          certification: 'STEMPACT Certified Professional',
          careerPathways,
          progressionPathway: 'Specialist & Venture Lab',
          status: ProgramStatus.PUBLISHED,
          level,
        },
        create: {
          code,
          name,
          schoolId: school.id,
          description,
          targetLearner,
          entryRequirements,
          prerequisites,
          duration,
          contactHours,
          learningLevels: `Foundation to Advanced`,
          tools,
          projects: capstoneProject.title,
          capstone: capstoneProject.problemStatement,
          assessmentCriteria: certificationRequirements,
          competencies: compStr,
          certification: 'STEMPACT Certified Professional',
          careerPathways,
          progressionPathway: 'Specialist & Venture Lab',
          status: ProgramStatus.PUBLISHED,
          level,
        },
      });

      // Clear previous courses/competencies on re-publishing to prevent key collisions
      await tx.course.deleteMany({ where: { programId: program.id } });
      await tx.competency.deleteMany({ where: { programId: program.id } });
      await tx.capstoneProject.deleteMany({ where: { programId: program.id } });

      // Determine courses to create
      const coursesToCreate = (rawData.courses && Array.isArray(rawData.courses) && rawData.courses.length > 0)
        ? rawData.courses
        : [
            {
              code: `${code}-101`,
              title: `${name} — Core Curriculum Modules`,
              description: description || 'Comprehensive practical learning progression.',
              credits: 4,
              order: 1,
              modules: (rawData.modules && Array.isArray(rawData.modules) && rawData.modules.length > 0)
                ? rawData.modules.map((m: any, idx: number) => ({
                    title: m.title || `Module ${idx + 1}`,
                    description: m.description || '',
                    durationHours: 12,
                    order: m.weekNumber || idx + 1,
                    lessons: (m.learningObjectives || ['Core Lesson & Lab']).map((obj: string) => ({
                      title: obj,
                      contentSummary: obj,
                      practicalActivities: m.practicalProjects || ['Practical Lab Sprint'],
                    })),
                  }))
                : [
                    {
                      title: 'Foundations & Architecture Sprint',
                      description: 'Baseline development environment and core paradigms.',
                      durationHours: 12,
                      order: 1,
                      lessons: [
                        {
                          title: 'Engineering Best Practices & Environment Setup',
                          contentSummary: 'Toolchain initialization and architecture principles.',
                          practicalActivities: ['Hands-on Lab Sprint 1'],
                        },
                      ],
                    },
                  ],
            },
          ];

      for (const courseData of coursesToCreate) {
        const course = await tx.course.create({
          data: {
            programId: program.id,
            code: courseData.code || `${code}-CRS`,
            title: courseData.title || `${name} Course`,
            description: courseData.description || '',
            credits: courseData.credits || 3,
            order: courseData.order || 1,
          },
        });

        for (const moduleData of courseData.modules || []) {
          const mod = await tx.module.create({
            data: {
              courseId: course.id,
              title: moduleData.title || 'Curriculum Module',
              description: moduleData.description || '',
              durationHours: moduleData.durationHours || 12,
              order: moduleData.order || 1,
            },
          });

          for (const [idx, lessonData] of (moduleData.lessons || []).entries()) {
            await tx.lesson.create({
              data: {
                moduleId: mod.id,
                title: lessonData.title || `Lesson ${idx + 1}`,
                content: lessonData.contentSummary || '',
                order: idx + 1,
              },
            });

            for (const practical of lessonData.practicalActivities || []) {
              await tx.practicalActivity.create({
                data: {
                  moduleId: mod.id,
                  title: `${lessonData.title} — Practical Lab`,
                  description: practical,
                  objectives: 'Hands-on practical mastery and code synthesis.',
                  requiredTools: tools.split(',').slice(0, 3).join(', ') || 'VS Code',
                  estimatedDurationMin: 90,
                },
              });
            }
          }
        }
      }

      // Create Competencies
      for (const comp of competenciesList) {
        await tx.competency.create({
          data: {
            programId: program.id,
            code: typeof comp === 'string' ? `COMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : (comp.code || `COMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`),
            title: typeof comp === 'string' ? comp : (comp.title || 'Technical Skill'),
            description: typeof comp === 'string' ? comp : (comp.description || comp.title || 'Demonstrated practical mastery'),
            category: typeof comp === 'string' ? 'Technical' : (comp.category || 'Technical'),
          },
        });
      }

      // Create Capstone Project
      await tx.capstoneProject.create({
        data: {
          programId: program.id,
          title: capstoneProject.title || `${name} Capstone Project`,
          problemStatement: capstoneProject.problemStatement || 'Solve an authentic engineering challenge.',
          expectedOutputs: capstoneProject.expectedOutputs || 'Working application deliverable.',
          evaluationRubric: {
            criteria: ['Technical Depth', 'Architecture', 'UI/UX Polish', 'Presentation'],
            weights: [40, 30, 15, 15],
          },
          durationWeeks: capstoneProject.durationWeeks || 4,
        },
      });

      // Record immutable ProgramVersion snapshot
      await tx.programVersion.create({
        data: {
          programId: program.id,
          versionNumber: 1,
          changelog: 'Initial AI-generated & human-approved academic release.',
          status: WorkflowStatus.PUBLISHED,
          dataSnapshot: rawData,
          createdById: generation?.requestedById || params.approverId,
          approvedById: params.approverId,
        },
      });

      // Update AI generation status to PUBLISHED if record exists
      if (generation) {
        await tx.aIGeneration.update({
          where: { id: generation.id },
          data: {
            status: WorkflowStatus.PUBLISHED,
            approvedById: params.approverId,
            reviewedAt: new Date(),
          },
        });
      }

      return program;
    });
  }
}
