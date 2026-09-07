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
