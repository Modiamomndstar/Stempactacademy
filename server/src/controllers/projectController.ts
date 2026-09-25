import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, featuredOnly } = req.query;

    const where: any = {};
    if (featuredOnly === 'true') {
      where.isFeaturedPublic = true;
    }
    if (category) {
      where.category = { contains: String(category), mode: 'insensitive' };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        program: { include: { school: true } },
        members: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ projects });
  } catch (error: any) {
    console.error('getProjects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      skills,
      tools,
      thumbnail,
      githubUrl,
      liveDemoUrl,
      cohortId,
      programId,
      isFeaturedPublic,
    } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        category: category || 'Software Engineering',
        skills: skills || 'React, TypeScript',
        tools: tools || 'Git, VS Code',
        thumbnail,
        githubUrl,
        liveDemoUrl,
        cohortId: cohortId || null,
        programId: programId || null,
        isFeaturedPublic: isFeaturedPublic !== undefined ? Boolean(isFeaturedPublic) : true,
      },
    });

    // If student user is logged in, link as creator member
    if (req.user) {
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      if (student) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            studentId: student.id,
            role: 'Lead Creator',
          },
        });
      }
    }

    res.status(201).json({ message: 'Project added to portfolio successfully!', project });
  } catch (error: any) {
    console.error('createProject error:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

export const updateProjectEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { projectId } = req.params;
    const { githubUrl, liveDemoUrl, thumbnail, description, skills, tools } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { student: true },
        },
      },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const isStaff = ['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'INSTRUCTOR'].includes(req.user.role as any);
    const isMember = project.members.some((m) => m.student.userId === req.user?.id);

    if (!isStaff && !isMember) {
      res.status(403).json({ message: 'Access denied: You are not a member or instructor of this project.' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(githubUrl !== undefined && { githubUrl }),
        ...(liveDemoUrl !== undefined && { liveDemoUrl }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(description !== undefined && { description }),
        ...(skills !== undefined && { skills }),
        ...(tools !== undefined && { tools }),
      },
      include: {
        members: { include: { student: { include: { user: true } } } },
      },
    });

    res.status(200).json({ message: 'Project evidence updated successfully', project: updated });
  } catch (error: any) {
    console.error('updateProjectEvidence error:', error);
    res.status(500).json({ message: error.message || 'Failed to update project evidence' });
  }
};

export const evaluateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { projectId } = req.params;
    const { score, feedback, status } = req.body;

    if (score === undefined || score === null) {
      res.status(400).json({ message: 'score is required' });
      return;
    }

    const { academicDeliveryService } = await import('../services/academicDeliveryService.js');
    const evaluated = await academicDeliveryService.evaluateProject({
      projectId,
      score: Number(score),
      feedback: feedback || '',
      status: status || 'COMPLETED',
    });

    res.status(200).json({ message: 'Project evaluated successfully', project: evaluated });
  } catch (error: any) {
    console.error('evaluateProject error:', error);
    res.status(500).json({ message: error.message || 'Failed to evaluate project' });
  }
};
