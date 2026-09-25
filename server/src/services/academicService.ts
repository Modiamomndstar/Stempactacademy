import { WorkflowStatus, AcademicLevel, ProgramStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

export interface CreateProgramVersionParams {
  programId: string;
  versionNumber?: number;
  changelog?: string;
  dataSnapshot?: any;
  status?: WorkflowStatus;
  isCurrent?: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  curriculumVersionId?: string;
  createdById: string;
  approvedById?: string;
}

export interface CreateCurriculumParams {
  programId: string;
  title: string;
  level?: AcademicLevel;
  totalHours?: number;
  theoryPracticalRatio?: string;
  competencies?: any;
  courseSequence?: any;
  status?: WorkflowStatus;
  version?: number;
}

export interface CreateCurriculumVersionParams {
  curriculumId: string;
  versionNumber?: number;
  dataSnapshot?: any;
  changelog?: string;
  status?: WorkflowStatus;
  createdById: string;
  approvedById?: string;
  courseIds?: string[];
}

export class AcademicService {
  /**
   * Resolves the canonical program hierarchy:
   * School -> Program -> ProgramVersion (current) -> Curriculum -> CurriculumVersion -> Courses -> Modules -> Lessons/Activities
   */
  async getCanonicalProgram(programIdOrCode: string) {
    const program = await prisma.program.findFirst({
      where: {
        OR: [
          { id: programIdOrCode },
          { code: programIdOrCode.toUpperCase() },
        ],
      },
      include: {
        school: true,
        // Canonical versioned track
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            curriculumVersion: {
              include: {
                curriculum: true,
                courses: {
                  include: {
                    modules: {
                      include: {
                        lessons: { orderBy: { order: 'asc' } },
                        practicalActivities: true,
                      },
                      orderBy: { order: 'asc' },
                    },
                  },
                  orderBy: { order: 'asc' },
                },
                competencies: true,
              },
            },
          },
        },
        // Reusable curriculum definitions
        curricula: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
            },
          },
        },
        // Legacy compatibility courses (direct Program.courses)
        courses: {
          include: {
            modules: {
              include: {
                lessons: { orderBy: { order: 'asc' } },
                practicalActivities: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        competencyList: true,
        cohorts: {
          include: {
            academicSession: true,
            programVersion: true,
            curriculumVersion: true,
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!program) return null;

    // Identify the active/current canonical ProgramVersion
    const activeVersion =
      program.versions.find((v) => v.isCurrent) ||
      program.versions.find((v) => v.status === WorkflowStatus.APPROVED) ||
      program.versions[0] ||
      null;

    // Identify canonical courses (prefer CurriculumVersion courses, fallback to legacy direct Program courses)
    const canonicalCourses =
      activeVersion?.curriculumVersion?.courses && activeVersion.curriculumVersion.courses.length > 0
        ? activeVersion.curriculumVersion.courses
        : program.courses;

    return {
      ...program,
      activeVersion,
      canonicalCourses,
    };
  }

  /**
   * Resolves a cohort in its canonical academic context:
   * Cohort -> ProgramVersion -> CurriculumVersion -> AcademicSession (and legacy Program)
   */
  async getCanonicalCohort(cohortIdOrCode: string) {
    return prisma.cohort.findFirst({
      where: {
        OR: [
          { id: cohortIdOrCode },
          { cohortCode: cohortIdOrCode },
        ],
      },
      include: {
        program: {
          include: { school: true },
        },
        programVersion: {
          include: {
            curriculumVersion: {
              include: { curriculum: true },
            },
          },
        },
        curriculumVersion: {
          include: {
            curriculum: true,
            courses: {
              include: {
                modules: {
                  include: { lessons: true, practicalActivities: true },
                },
              },
            },
          },
        },
        academicSession: true,
      },
    });
  }

  /**
   * Creates a new immutable ProgramVersion for a Program
   */
  async createProgramVersion(params: CreateProgramVersionParams) {
    let nextVersionNumber = params.versionNumber;
    if (!nextVersionNumber) {
      const highestVersion = await prisma.programVersion.findFirst({
        where: { programId: params.programId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      nextVersionNumber = (highestVersion?.versionNumber || 0) + 1;
    }

    // If marked as current, unset existing current versions for this program
    if (params.isCurrent) {
      await prisma.programVersion.updateMany({
        where: { programId: params.programId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return prisma.programVersion.create({
      data: {
        programId: params.programId,
        versionNumber: nextVersionNumber,
        changelog: params.changelog || `Version ${nextVersionNumber} release`,
        status: params.status || WorkflowStatus.DRAFT,
        dataSnapshot: params.dataSnapshot || {},
        isCurrent: params.isCurrent ?? false,
        effectiveFrom: params.effectiveFrom || null,
        effectiveTo: params.effectiveTo || null,
        curriculumVersionId: params.curriculumVersionId || null,
        createdById: params.createdById,
        approvedById: params.approvedById || null,
      },
      include: {
        program: true,
        curriculumVersion: true,
      },
    });
  }

  /**
   * Creates a reusable Curriculum definition for a Program
   */
  async createCurriculum(params: CreateCurriculumParams) {
    return prisma.curriculum.create({
      data: {
        programId: params.programId,
        title: params.title,
        level: params.level || AcademicLevel.LEVEL_1_FOUNDATION,
        totalHours: params.totalHours || 48,
        theoryPracticalRatio: params.theoryPracticalRatio || '40:60',
        competencies: params.competencies || null,
        courseSequence: params.courseSequence || null,
        status: params.status || WorkflowStatus.DRAFT,
        version: params.version || 1,
      },
      include: {
        program: true,
        versions: true,
      },
    });
  }

  /**
   * Creates an immutable CurriculumVersion snapshot and associates Courses
   */
  async createCurriculumVersion(params: CreateCurriculumVersionParams) {
    let nextVersionNumber = params.versionNumber;
    if (!nextVersionNumber) {
      const highestVersion = await prisma.curriculumVersion.findFirst({
        where: { curriculumId: params.curriculumId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      nextVersionNumber = (highestVersion?.versionNumber || 0) + 1;
    }

    const version = await prisma.curriculumVersion.create({
      data: {
        curriculumId: params.curriculumId,
        versionNumber: nextVersionNumber,
        dataSnapshot: params.dataSnapshot || {},
        status: params.status || WorkflowStatus.DRAFT,
        changelog: params.changelog || `Curriculum snapshot v${nextVersionNumber}`,
        createdById: params.createdById,
        approvedById: params.approvedById || null,
      },
    });

    if (params.courseIds && params.courseIds.length > 0) {
      await prisma.course.updateMany({
        where: { id: { in: params.courseIds } },
        data: { curriculumVersionId: version.id },
      });
    }

    return prisma.curriculumVersion.findUnique({
      where: { id: version.id },
      include: {
        curriculum: true,
        courses: {
          include: { modules: { include: { lessons: true } } },
        },
      },
    });
  }

  /**
   * Deterministically ensures the baseline canonical academic hierarchy:
   * 1. Active AcademicSession (SES-2026)
   * 2. Canonical Curriculum & CurriculumVersion for all existing Programs
   * 3. Associating existing Course records with their Program's CurriculumVersion
   * 4. Canonical ProgramVersion (v1, isCurrent: true) referencing CurriculumVersion
   * 5. Associating historical Cohorts with AcademicSession, ProgramVersion & CurriculumVersion
   * 
   * This is completely idempotent and safe against multiple executions.
   */
  async ensureBaselineAcademicHierarchy(adminUserId?: string) {
    const fallbackUserId = adminUserId || (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } }))?.id || 'SYSTEM_BASELINE';

    // 1. Ensure Active Academic Session
    let session = await prisma.academicSession.findFirst({
      where: { code: 'SES-2026' },
    });
    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          code: 'SES-2026',
          name: '2026/2027 Academic Session',
          startDate: new Date('2026-09-01'),
          endDate: new Date('2027-08-31'),
          isCurrent: true,
        },
      });
    }

    // 2. Process all Programs
    const programs = await prisma.program.findMany({
      include: {
        courses: { include: { modules: { include: { lessons: true, practicalActivities: true } } } },
        curricula: { include: { versions: true } },
        versions: true,
        competencyList: true,
        cohorts: true,
      },
    });

    let curriculaCreated = 0;
    let curriculumVersionsCreated = 0;
    let programVersionsCreated = 0;
    let coursesMapped = 0;
    let cohortsMapped = 0;

    for (const prog of programs) {
      // 2a. Ensure Canonical Curriculum
      let curriculum = prog.curricula[0];
      if (!curriculum) {
        curriculum = await prisma.curriculum.create({
          data: {
            programId: prog.id,
            title: `${prog.name} - Canonical Curriculum`,
            level: prog.level,
            totalHours: prog.contactHours,
            theoryPracticalRatio: '40:60',
            status: WorkflowStatus.APPROVED,
            version: 1,
          },
          include: { versions: true },
        });
        curriculaCreated++;
      }

      // 2b. Ensure Canonical CurriculumVersion
      let curriculumVersion = curriculum.versions?.[0];
      if (!curriculumVersion) {
        const courseSnapshot = prog.courses.map((c) => ({
          code: c.code,
          title: c.title,
          credits: c.credits,
          order: c.order,
          modules: c.modules.map((m) => ({
            title: m.title,
            durationHours: m.durationHours,
            order: m.order,
            lessonsCount: m.lessons.length,
          })),
        }));

        curriculumVersion = await prisma.curriculumVersion.create({
          data: {
            curriculumId: curriculum.id,
            versionNumber: 1,
            dataSnapshot: {
              programCode: prog.code,
              programName: prog.name,
              courses: courseSnapshot,
              competencies: prog.competencies,
            },
            status: WorkflowStatus.APPROVED,
            changelog: 'Initial canonical baseline curriculum version 1.0',
            createdById: fallbackUserId,
            approvedById: fallbackUserId,
          },
        });
        curriculumVersionsCreated++;
      }

      // 2c. Map existing Courses to CurriculumVersion
      const unmappedCourseIds = prog.courses
        .filter((c) => !c.curriculumVersionId)
        .map((c) => c.id);
      if (unmappedCourseIds.length > 0) {
        await prisma.course.updateMany({
          where: { id: { in: unmappedCourseIds } },
          data: { curriculumVersionId: curriculumVersion.id },
        });
        coursesMapped += unmappedCourseIds.length;
      }

      // 2d. Ensure Canonical ProgramVersion
      const anyVersionCurrent = prog.versions.some((v) => v.isCurrent);
      let progVersion = prog.versions.find((v) => v.versionNumber === 1);
      if (!progVersion) {
        progVersion = await prisma.programVersion.create({
          data: {
            programId: prog.id,
            versionNumber: 1,
            changelog: 'Initial canonical program version 1.0',
            status: WorkflowStatus.APPROVED,
            isCurrent: !anyVersionCurrent,
            effectiveFrom: new Date('2026-09-01'),
            effectiveTo: new Date('2027-08-31'),
            curriculumVersionId: curriculumVersion.id,
            dataSnapshot: {
              code: prog.code,
              name: prog.name,
              level: prog.level,
              duration: prog.duration,
              contactHours: prog.contactHours,
              entryRequirements: prog.entryRequirements,
              prerequisites: prog.prerequisites,
              careerPathways: prog.careerPathways,
            },
            createdById: fallbackUserId,
            approvedById: fallbackUserId,
          },
        });
        programVersionsCreated++;
      } else {
        const updateData: any = {};
        if (!progVersion.curriculumVersionId) {
          updateData.curriculumVersionId = curriculumVersion.id;
        }
        // Only activate v1 if NO version for this program is currently active
        if (!anyVersionCurrent && !progVersion.isCurrent) {
          updateData.isCurrent = true;
        }
        if (Object.keys(updateData).length > 0) {
          await prisma.programVersion.update({
            where: { id: progVersion.id },
            data: updateData,
          });
        }
      }

      // 2e. Associate historical Cohorts with Session, ProgramVersion & CurriculumVersion
      for (const cohort of prog.cohorts) {
        if (!cohort.academicSessionId || !cohort.programVersionId || !cohort.curriculumVersionId) {
          await prisma.cohort.update({
            where: { id: cohort.id },
            data: {
              academicSessionId: cohort.academicSessionId || session.id,
              programVersionId: cohort.programVersionId || progVersion.id,
              curriculumVersionId: cohort.curriculumVersionId || curriculumVersion.id,
            },
          });
          cohortsMapped++;
        }
      }
    }

    return {
      academicSessionId: session.id,
      programsProcessed: programs.length,
      curriculaCreated,
      curriculumVersionsCreated,
      programVersionsCreated,
      coursesMapped,
      cohortsMapped,
    };
  }
}

export const academicService = new AcademicService();
