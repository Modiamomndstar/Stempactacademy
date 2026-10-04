import { Request, Response } from 'express';
import { ProgramStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolCode, schoolId, status, search, featured, minPrice, maxPrice } = req.query;

    const where: any = {};

    if (schoolCode) {
      where.school = { code: String(schoolCode).toUpperCase() };
    } else if (schoolId) {
      where.schoolId = String(schoolId);
    }

    if (status) {
      where.status = status as ProgramStatus;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tools: { contains: q, mode: 'insensitive' } },
        { competencies: { contains: q, mode: 'insensitive' } },
      ];
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.cohorts = {
        some: {
          trainingFee: {
            ...(minPrice !== undefined && { gte: Number(minPrice) }),
            ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
          }
        }
      };
    }

    const programs = await prisma.program.findMany({
      where,
      include: {
        school: true,
        cohorts: {
          where: { status: { in: ['OPEN', 'ALMOST_FULL'] } },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ programs, count: programs.length });
  } catch (error: any) {
    console.error('getPrograms error:', error);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
};

export const getProgramByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const program = await prisma.program.findFirst({
      where: {
        OR: [{ code: code.toUpperCase() }, { id: code }],
      },
      include: {
        school: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            curriculumVersion: {
              include: {
                curriculum: true,
                courses: {
                  include: {
                    modules: {
                      include: { lessons: true, practicalActivities: true },
                      orderBy: { order: 'asc' },
                    },
                  },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        curricula: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
        // Legacy compatibility courses (direct Program.courses)
        courses: {
          include: {
            modules: {
              include: { lessons: true, practicalActivities: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        cohorts: {
          include: {
            academicSession: true,
            programVersion: true,
            curriculumVersion: true,
          },
          orderBy: { startDate: 'asc' },
        },
        competencyList: true,
      },
    });

    if (!program) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }

    res.status(200).json({ program });
  } catch (error: any) {
    console.error('getProgramByCode error:', error);
    res.status(500).json({ message: 'Failed to fetch program details' });
  }
};

export const updateProgramStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(status && { status: status as ProgramStatus }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    });

    res.status(200).json({ message: 'Program status updated successfully', program });
  } catch (error: any) {
    console.error('updateProgramStatus error:', error);
    res.status(500).json({ message: 'Failed to update program status' });
  }
};

export const createProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      schoolId,
      code,
      name,
      description,
      targetLearner,
      entryRequirements,
      prerequisites,
      duration,
      durationWeeks,
      contactHours,
      commitmentHours,
      learningLevels,
      tools,
      projects,
      capstone,
      assessmentCriteria,
      competencies,
      certification,
      careerPathways,
      progressionPathway,
      status,
      isFeatured,
      isKidsTrack,
      targetAgeGroup,
      totalLevels,
    } = req.body;

    if (!schoolId || !code || !name) {
      res.status(400).json({ message: 'schoolId, code, and name are required.' });
      return;
    }

    const program = await prisma.program.create({
      data: {
        schoolId,
        code: code.toUpperCase(),
        name,
        description: description || '',
        targetLearner: targetLearner || 'Aspiring technologists and software developers',
        entryRequirements: entryRequirements || 'Basic computer literacy and analytical mindset',
        prerequisites: prerequisites || 'None',
        duration: duration || `${durationWeeks || 12} Weeks`,
        contactHours: Number(contactHours || (commitmentHours ? commitmentHours * 4 : 48)),
        learningLevels: learningLevels || 'Level 1: Foundation, Level 2: Intermediate, Level 3: Advanced, Level 4: Mastery',
        tools: tools || '',
        projects: projects || 'Practical real-world industry capstone and lab projects',
        capstone: capstone || 'Comprehensive production capstone defense',
        assessmentCriteria: assessmentCriteria || 'Continuous lab assignments (40%), capstone project (40%), attendance & defense (20%)',
        competencies: competencies || '',
        certification: certification || 'STEMPACT Certified Professional Credential',
        careerPathways: careerPathways || 'Junior Engineer, Systems Specialist, Technical Founder',
        progressionPathway: progressionPathway || 'Progresses systematically from Level 1 Foundation to Level 4 Mastery across cohorts.',
        status: (status as ProgramStatus) || 'OPEN_FOR_APPLICATION',
        isFeatured: Boolean(isFeatured),
        isKidsTrack: Boolean(isKidsTrack),
        targetAgeGroup: targetAgeGroup || (isKidsTrack ? 'Ages 7-16' : 'Ages 16+'),
        totalLevels: Number(totalLevels) || 4,
      },
      include: { school: true },
    });

    res.status(201).json({ message: 'Program created successfully', program });
  } catch (error: any) {
    console.error('createProgram error:', error);
    res.status(500).json({ message: error.message || 'Failed to create program' });
  }
};

export const updateProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      schoolId,
      code,
      name,
      description,
      targetLearner,
      entryRequirements,
      prerequisites,
      duration,
      durationWeeks,
      contactHours,
      commitmentHours,
      learningLevels,
      tools,
      projects,
      capstone,
      assessmentCriteria,
      competencies,
      certification,
      careerPathways,
      progressionPathway,
      status,
      isFeatured,
      isKidsTrack,
      targetAgeGroup,
      totalLevels,
    } = req.body;

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(schoolId && { schoolId }),
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(targetLearner !== undefined && { targetLearner }),
        ...(entryRequirements !== undefined && { entryRequirements }),
        ...(prerequisites !== undefined && { prerequisites }),
        ...(duration !== undefined && { duration }),
        ...(durationWeeks !== undefined && { duration: `${durationWeeks} Weeks` }),
        ...(contactHours !== undefined && { contactHours: Number(contactHours) }),
        ...(commitmentHours !== undefined && { contactHours: Number(commitmentHours) * 4 }),
        ...(learningLevels !== undefined && { learningLevels }),
        ...(tools !== undefined && { tools }),
        ...(projects !== undefined && { projects }),
        ...(capstone !== undefined && { capstone }),
        ...(assessmentCriteria !== undefined && { assessmentCriteria }),
        ...(competencies !== undefined && { competencies }),
        ...(certification !== undefined && { certification }),
        ...(careerPathways !== undefined && { careerPathways }),
        ...(progressionPathway !== undefined && { progressionPathway }),
        ...(status && { status: status as ProgramStatus }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(isKidsTrack !== undefined && { isKidsTrack: Boolean(isKidsTrack) }),
        ...(targetAgeGroup !== undefined && { targetAgeGroup }),
        ...(totalLevels !== undefined && { totalLevels: Number(totalLevels) }),
      },
      include: { school: true },
    });

    res.status(200).json({ message: 'Program updated successfully', program });
  } catch (error: any) {
    console.error('updateProgram error:', error);
    res.status(500).json({ message: error.message || 'Failed to update program' });
  }
};

export const deleteProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cohortsCount = await prisma.cohort.count({ where: { programId: id } });
    if (cohortsCount > 0) {
      res.status(400).json({
        message: `Cannot delete program with ${cohortsCount} existing cohorts. Archive or deactivate instead.`,
      });
      return;
    }

    await prisma.program.delete({ where: { id } });
    res.status(200).json({ message: 'Program deleted successfully' });
  } catch (error: any) {
    console.error('deleteProgram error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete program' });
  }
};

export const curateVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { videoCuratorService } = await import('../services/videoCuratorService.js');
    const result = await videoCuratorService.curateProgramVideos(id);
    res.status(200).json({
      message: `Successfully curated videos for ${result.totalCurated} lesson(s).`,
      result,
      lessonsCount: result.totalCurated,
    });
  } catch (error: any) {
    console.error('curateVideos error:', error);
    res.status(500).json({ message: error.message || 'Failed to curate videos for program' });
  }
};

export const updateLessonVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const { videoUrl, videoDurationMin, videoSummary } = req.body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(videoUrl !== undefined && { videoUrl: videoUrl ? String(videoUrl).trim() : null }),
        ...(videoDurationMin !== undefined && { videoDurationMin: videoDurationMin ? Number(videoDurationMin) : null }),
        ...(videoSummary !== undefined && { videoSummary: videoSummary ? String(videoSummary).trim() : null }),
      },
    });

    res.status(200).json({ message: 'Lesson video updated successfully', lesson });
  } catch (error: any) {
    console.error('updateLessonVideo error:', error);
    res.status(500).json({ message: error.message || 'Failed to update lesson video' });
  }
};

export const curateSingleLessonVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: { program: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      res.status(404).json({ message: 'Lesson not found' });
      return;
    }

    const { videoCuratorService } = await import('../services/videoCuratorService.js');
    const result = await videoCuratorService.curateLessonVideo({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      moduleTitle: lesson.module?.title || 'Core Module',
      courseTitle: lesson.module?.course?.title || 'Program Course',
      programName: lesson.module?.course?.program?.name || 'Academic Program',
    });

    res.status(200).json({
      message: `Successfully curated video for "${lesson.title}".`,
      result,
    });
  } catch (error: any) {
    console.error('curateSingleLessonVideo error:', error);
    res.status(500).json({ message: error.message || 'Failed to curate video for lesson' });
  }
};

