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
    generationId: string;
    approverId: string;
    overrideData?: Partial<ProgramGenerationData>;
  }) {
    const generation = await prisma.aIGeneration.findUnique({
      where: { id: params.generationId },
    });

    if (!generation) {
      throw new Error('AI Generation record not found.');
    }

    const data: ProgramGenerationData = {
      ...(generation.structuredOutput as any),
      ...(params.overrideData || {}),
    };

    // 1. Resolve or fallback school
    const school = await prisma.school.findFirst({
      where: {
        OR: [{ code: data.schoolCode }, { code: 'SCSE' }],
      },
    });

    if (!school) {
      throw new Error(`Target school code "${data.schoolCode}" does not exist in academy registry.`);
    }

    // 2. Atomic canonical database transaction
    return prisma.$transaction(async (tx) => {
      // Create or update Program
      const program = await tx.program.upsert({
        where: { code: data.code },
        update: {
          name: data.name,
          description: data.description,
          targetLearner: data.targetLearner,
          entryRequirements: data.entryRequirements,
          prerequisites: data.prerequisites,
          duration: data.duration,
          contactHours: data.contactHours,
          learningLevels: `Foundation to Advanced`,
          tools: data.tools.join(', '),
          projects: data.capstoneProject.title,
          capstone: data.capstoneProject.problemStatement,
          assessmentCriteria: data.certificationRequirements,
          competencies: data.competencies.map((c) => c.title).join(', '),
          certification: 'STEMPACT Certified Professional',
          careerPathways: data.careerPathways.join(', '),
          progressionPathway: 'Specialist & Venture Lab',
          status: ProgramStatus.PUBLISHED,
          level: (data.level as AcademicLevel) || AcademicLevel.LEVEL_1_FOUNDATION,
        },
        create: {
          code: data.code,
          name: data.name,
          schoolId: school.id,
          description: data.description,
          targetLearner: data.targetLearner,
          entryRequirements: data.entryRequirements,
          prerequisites: data.prerequisites,
          duration: data.duration,
          contactHours: data.contactHours,
          learningLevels: `Foundation to Advanced`,
          tools: data.tools.join(', '),
          projects: data.capstoneProject.title,
          capstone: data.capstoneProject.problemStatement,
          assessmentCriteria: data.certificationRequirements,
          competencies: data.competencies.map((c) => c.title).join(', '),
          certification: 'STEMPACT Certified Professional',
          careerPathways: data.careerPathways.join(', '),
          progressionPathway: 'Specialist & Venture Lab',
          status: ProgramStatus.PUBLISHED,
          level: (data.level as AcademicLevel) || AcademicLevel.LEVEL_1_FOUNDATION,
        },
      });

      // Create Courses, Modules, Lessons, and Practicals
      for (const courseData of data.courses) {
        const course = await tx.course.create({
          data: {
            programId: program.id,
            code: courseData.code,
            title: courseData.title,
            description: courseData.description,
            credits: courseData.credits,
            order: courseData.order,
          },
        });

        for (const moduleData of courseData.modules) {
          const mod = await tx.module.create({
            data: {
              courseId: course.id,
              title: moduleData.title,
              description: moduleData.description,
              durationHours: moduleData.durationHours,
              order: moduleData.order,
            },
          });

          for (const [idx, lessonData] of moduleData.lessons.entries()) {
            await tx.lesson.create({
              data: {
                moduleId: mod.id,
                title: lessonData.title,
                content: lessonData.contentSummary,
                order: idx + 1,
              },
            });

            // Create Practical Activities
            for (const practical of lessonData.practicalActivities) {
              await tx.practicalActivity.create({
                data: {
                  moduleId: mod.id,
                  title: `${lessonData.title} — Practical Lab`,
                  description: practical,
                  objectives: 'Hands-on practical mastery and code synthesis.',
                  requiredTools: data.tools.slice(0, 3).join(', '),
                  estimatedDurationMin: 90,
                },
              });
            }
          }
        }
      }

      // Create Competencies
      for (const comp of data.competencies) {
        await tx.competency.create({
          data: {
            programId: program.id,
            code: comp.code,
            title: comp.title,
            description: comp.description,
            category: comp.category,
          },
        });
      }

      // Create Capstone Project
      await tx.capstoneProject.create({
        data: {
          programId: program.id,
          title: data.capstoneProject.title,
          problemStatement: data.capstoneProject.problemStatement,
          expectedOutputs: data.capstoneProject.expectedOutputs,
          evaluationRubric: {
            criteria: ['Technical Depth', 'Architecture', 'UI/UX Polish', 'Presentation'],
            weights: [40, 30, 15, 15],
          },
          durationWeeks: data.capstoneProject.durationWeeks,
        },
      });

      // Record immutable ProgramVersion snapshot
      await tx.programVersion.create({
        data: {
          programId: program.id,
          versionNumber: 1,
          changelog: 'Initial AI-generated & human-approved academic release.',
          status: WorkflowStatus.PUBLISHED,
          dataSnapshot: data as any,
          createdById: generation.requestedById,
          approvedById: params.approverId,
        },
      });

      // Update AI generation status to PUBLISHED
      await tx.aIGeneration.update({
        where: { id: generation.id },
        data: {
          status: WorkflowStatus.PUBLISHED,
          approvedById: params.approverId,
          reviewedAt: new Date(),
        },
      });

      return program;
    });
  }
}
