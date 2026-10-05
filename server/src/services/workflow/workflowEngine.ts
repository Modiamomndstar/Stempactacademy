import { WorkflowStatus, ProgramStatus, AcademicLevel } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { ProgramGenerationData } from '../ai/types.js';
import { buildDomainProgramCourses } from '../ai/aiProvider.js';

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
    const durationWeeks = Number(rawData.durationWeeks) || (parseInt(String(rawData.duration || '').replace(/\D/g, '')) || 3);
    const duration = `${durationWeeks} Weeks`;
    const contactHours = typeof rawData.contactHours === 'number' ? rawData.contactHours : (durationWeeks * 12);
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

    const resolveAcademicLevel = (val: any): AcademicLevel => {
      if (val === undefined || val === null) return AcademicLevel.LEVEL_1_FOUNDATION;
      if (typeof val === 'number') {
        switch (val) {
          case 0: return AcademicLevel.LEVEL_0_ASSESSMENT;
          case 1: return AcademicLevel.LEVEL_1_FOUNDATION;
          case 2: return AcademicLevel.LEVEL_2_INTERMEDIATE;
          case 3: return AcademicLevel.LEVEL_3_ADVANCED;
          case 4: return AcademicLevel.LEVEL_4_SPECIALIST;
          case 5: return AcademicLevel.LEVEL_5_INNOVATION;
          case 6: return AcademicLevel.LEVEL_6_ENTREPRENEURSHIP;
          default: return AcademicLevel.LEVEL_1_FOUNDATION;
        }
      }
      const s = String(val).toUpperCase();
      if (s.includes('0') || s.includes('ASSESS')) return AcademicLevel.LEVEL_0_ASSESSMENT;
      if (s.includes('1') || s.includes('FOUND') || s.includes('BEGIN')) return AcademicLevel.LEVEL_1_FOUNDATION;
      if (s.includes('3') || s.includes('ADVANC')) return AcademicLevel.LEVEL_3_ADVANCED;
      if (s.includes('4') || s.includes('SPEC') || s.includes('MASTERY')) return AcademicLevel.LEVEL_4_SPECIALIST;
      if (s.includes('5') || s.includes('INNOV')) return AcademicLevel.LEVEL_5_INNOVATION;
      if (s.includes('6') || s.includes('ENTREP')) return AcademicLevel.LEVEL_6_ENTREPRENEURSHIP;
      if (s.includes('2') || s.includes('INTER')) return AcademicLevel.LEVEL_2_INTERMEDIATE;
      return AcademicLevel.LEVEL_1_FOUNDATION;
    };

    const level = resolveAcademicLevel(rawData.level || rawData.academicLevel);

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
        : (rawData.modules && Array.isArray(rawData.modules) && rawData.modules.length > 0)
          ? [
              {
                code: `${code}-101`,
                title: `${name} — Core Curriculum Modules`,
                description: description || 'Comprehensive practical learning progression.',
                credits: Math.min(6, Math.max(3, durationWeeks)),
                order: 1,
                level,
                modules: rawData.modules.map((m: any, idx: number) => ({
                  title: m.title || `Module ${idx + 1}`,
                  description: m.description || '',
                  durationHours: m.durationHours || 12,
                  order: m.weekNumber || m.order || idx + 1,
                  assessmentQuiz: m.assessmentQuiz,
                  assignmentTitle: m.assignmentTitle,
                  lessons: (m.lessons && Array.isArray(m.lessons) && m.lessons.length > 0)
                    ? m.lessons
                    : (m.learningObjectives || ['Core Lesson & Lab']).map((obj: string) => ({
                        title: obj,
                        contentSummary: obj,
                        content: `Instructional lesson overview and guided walkthrough for ${obj}.`,
                        practicalActivities: m.practicalProjects || ['Practical Lab Sprint'],
                      })),
                })),
              },
            ]
          : buildDomainProgramCourses(name, school.code, durationWeeks, level, description);

      const createdCourses = [];
      for (const courseData of coursesToCreate) {
        const course = await tx.course.create({
          data: {
            programId: program.id,
            code: courseData.code || `${code}-CRS`,
            title: courseData.title || `${name} Course`,
            description: courseData.description || '',
            credits: courseData.credits || 3,
            order: courseData.order || 1,
            level: (courseData.level ? resolveAcademicLevel(courseData.level) : level),
          },
        });
        createdCourses.push(course);

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
            const lessonContent = lessonData.content && lessonData.content.length > 25
              ? lessonData.content
              : (lessonData.contentSummary || `Comprehensive practical lesson and instructional guide for ${lessonData.title || `Lesson ${idx + 1}`}.`);

            await tx.lesson.create({
              data: {
                moduleId: mod.id,
                title: lessonData.title || `Lesson ${idx + 1}`,
                content: lessonContent,
                videoUrl: lessonData.videoUrl || undefined,
                videoDurationMin: lessonData.videoDurationMin || 20,
                videoSummary: lessonData.videoSummary || undefined,
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

          if (moduleData.assessmentQuiz) {
            await tx.practicalActivity.create({
              data: {
                moduleId: mod.id,
                title: `${mod.title} — Knowledge Check & Assessment`,
                description: moduleData.assessmentQuiz,
                objectives: 'Verify conceptual understanding and practical mastery.',
                requiredTools: 'Course Assessment Portal',
                estimatedDurationMin: 30,
              },
            });
          }

          if (moduleData.assignmentTitle) {
            await tx.practicalActivity.create({
              data: {
                moduleId: mod.id,
                title: `${mod.title} — Practical Lab Assignment`,
                description: moduleData.assignmentTitle,
                objectives: 'Deliver and submit end-of-module practical implementation artifact.',
                requiredTools: tools.split(',').slice(0, 3).join(', ') || 'Lab Environment',
                estimatedDurationMin: 90,
              },
            });
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

      // -------------------------------------------------------------
      // SMART VERSIONING LOGIC:
      // If current version has NO active cohorts, refine/update in place (Testing/Pre-launch mode).
      // If cohorts have already started, lock old version and mint next version.
      // -------------------------------------------------------------
      const existingCurrentVersion = await tx.programVersion.findFirst({
        where: { programId: program.id, isCurrent: true },
        include: {
          cohorts: true,
        },
      });

      const highestVersionRecord = await tx.programVersion.findFirst({
        where: { programId: program.id },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });

      // Check if current version is locked by any cohorts
      const isLockedByCohorts = Boolean(
        existingCurrentVersion && existingCurrentVersion.cohorts && existingCurrentVersion.cohorts.length > 0
      );

      let targetVersionNumber = 1;
      let programVersionId = '';

      if (existingCurrentVersion && !isLockedByCohorts) {
        // PRE-LAUNCH / TESTING MODE: Update current version in-place
        targetVersionNumber = existingCurrentVersion.versionNumber;
        const updatedVersion = await tx.programVersion.update({
          where: { id: existingCurrentVersion.id },
          data: {
            dataSnapshot: rawData,
            status: WorkflowStatus.PUBLISHED,
            changelog: 'Refined & updated in place via AI Curriculum Architect.',
            approvedById: params.approverId,
            updatedAt: new Date(),
          },
        });
        programVersionId = updatedVersion.id;
      } else {
        // PROTECTED MODE: Mint new incremental version
        targetVersionNumber = (highestVersionRecord?.versionNumber || 0) + 1;

        if (existingCurrentVersion) {
          await tx.programVersion.updateMany({
            where: { programId: program.id, isCurrent: true },
            data: { isCurrent: false },
          });
        }

        const newVersion = await tx.programVersion.create({
          data: {
            programId: program.id,
            versionNumber: targetVersionNumber,
            changelog: highestVersionRecord
              ? `Curriculum revision v${targetVersionNumber} approved and published.`
              : 'Initial AI-generated & human-approved academic release.',
            status: WorkflowStatus.PUBLISHED,
            isCurrent: true,
            effectiveFrom: new Date(),
            dataSnapshot: rawData,
            createdById: generation?.requestedById || params.approverId,
            approvedById: params.approverId,
          },
        });
        programVersionId = newVersion.id;
      }

      // Sync program version counter
      await tx.program.update({
        where: { id: program.id },
        data: { version: targetVersionNumber },
      });

      // Ensure canonical Curriculum & CurriculumVersion sync
      let curriculum = await tx.curriculum.findFirst({
        where: { programId: program.id },
      });

      if (!curriculum) {
        curriculum = await tx.curriculum.create({
          data: {
            programId: program.id,
            title: `${program.name} - Canonical Curriculum`,
            level: program.level,
            totalHours: program.contactHours,
            theoryPracticalRatio: '40:60',
            status: WorkflowStatus.APPROVED,
            version: targetVersionNumber,
          },
        });
      }

      // Check or create CurriculumVersion matching targetVersionNumber
      let curriculumVersion = await tx.curriculumVersion.findFirst({
        where: { curriculumId: curriculum.id, versionNumber: targetVersionNumber },
      });

      if (!curriculumVersion) {
        curriculumVersion = await tx.curriculumVersion.create({
          data: {
            curriculumId: curriculum.id,
            versionNumber: targetVersionNumber,
            dataSnapshot: rawData,
            status: WorkflowStatus.APPROVED,
            changelog: `Curriculum version ${targetVersionNumber} approved and published.`,
            createdById: generation?.requestedById || params.approverId,
            approvedById: params.approverId,
          },
        });
      } else {
        await tx.curriculumVersion.update({
          where: { id: curriculumVersion.id },
          data: {
            dataSnapshot: rawData,
            updatedAt: new Date(),
          },
        });
      }

      // Associate newly created courses with this CurriculumVersion
      await tx.course.updateMany({
        where: { programId: program.id },
        data: { curriculumVersionId: curriculumVersion.id },
      });

      // Link programVersion to curriculumVersion
      await tx.programVersion.update({
        where: { id: programVersionId },
        data: { curriculumVersionId: curriculumVersion.id },
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
