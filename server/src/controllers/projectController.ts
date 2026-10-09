import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, schoolId, programId, cohortId, search, featuredOnly } = req.query;

    const where: any = {};
    if (featuredOnly === 'true') {
      where.isFeaturedPublic = true;
    }
    if (category && category !== 'ALL') {
      where.category = { contains: String(category), mode: 'insensitive' };
    }
    if (programId && programId !== 'ALL') {
      where.programId = String(programId);
    }
    if (cohortId && cohortId !== 'ALL') {
      where.cohortId = String(cohortId);
    }
    if (schoolId && schoolId !== 'ALL') {
      where.program = {
        schoolId: String(schoolId),
      };
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { skills: { contains: q, mode: 'insensitive' } },
        { tools: { contains: q, mode: 'insensitive' } },
      ];
    }

    let projects = await prisma.project.findMany({
      where,
      include: {
        program: { include: { school: true } },
        cohort: true,
        members: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If database has 0 projects, seed flagship student projects so public showcase is vibrant
    if (projects.length === 0 && Object.keys(where).length === 0) {
      const count = await prisma.project.count();
      if (count === 0) {
        const firstProgram = await prisma.program.findFirst({ include: { school: true } });
        const firstCohort = await prisma.cohort.findFirst();

        await prisma.project.createMany({
          data: [
            {
              title: 'Ife-Transit: Real-Time Campus Commuter & Shuttle Tracker',
              description: 'A full-stack progressive web application connecting campus shuttle drivers and student commuters in Ile-Ife with real-time GPS tracking and cashless QR fare payment.',
              category: 'Software Engineering',
              skills: 'React, TypeScript, Node.js, WebSockets, Leaflet Maps, Tailwind CSS',
              tools: 'PostgreSQL, Express, Vite, Docker, Render',
              githubUrl: 'https://github.com/stempact/ife-transit-app',
              liveDemoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              score: 96,
              feedback: 'Highly practical local innovation with great UX and low-bandwidth optimization.',
              status: 'COMPLETED',
              isFeaturedPublic: true,
              programId: firstProgram?.id || null,
              cohortId: firstCohort?.id || null,
            },
            {
              title: 'AgriSense: Autonomous Crop Pest & Moisture Telemetry Rover',
              description: 'An autonomous field rover equipped with solar harvesting, soil moisture probes, and an edge AI camera module that detects early armyworm infestation on maize farms in Osun State.',
              category: 'Robotics & Hardware',
              skills: 'Embedded C++, ROS2, Computer Vision, PCB Design, 3D CAD',
              tools: 'ESP32, Raspberry Pi 4, KiCad, Fusion 360, Solar MPPT',
              githubUrl: 'https://github.com/stempact/agrisense-rover',
              liveDemoUrl: 'https://www.youtube.com/watch?v=7h1s9vKfsj0',
              score: 98,
              feedback: 'Winner of 2025 Osun State CleanTech Innovation Award.',
              status: 'COMPLETED',
              isFeaturedPublic: true,
              programId: firstProgram?.id || null,
              cohortId: firstCohort?.id || null,
            },
            {
              title: 'Smart Solar Microgrid Energy Controller with GSM Telemetry',
              description: 'An intelligent automated changeover and battery protection system that balances municipal grid power, solar arrays, and deep cycle battery life with instant SMS alerts.',
              category: 'Renewable Energy',
              skills: 'Power Electronics, Microcontroller Logic, Energy Auditing',
              tools: 'Hybrid Inverters, PZEM Power Sensors, GSM Sim800L, LiFePO4 BMS',
              githubUrl: 'https://github.com/stempact/solar-microgrid',
              liveDemoUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
              score: 93,
              feedback: 'Extremely durable hardware build designed for Nigerian voltage fluctuations.',
              status: 'COMPLETED',
              isFeaturedPublic: true,
              programId: firstProgram?.id || null,
              cohortId: firstCohort?.id || null,
            },
          ],
        });

        projects = await prisma.project.findMany({
          include: {
            program: { include: { school: true } },
            cohort: true,
            members: {
              include: {
                student: { include: { user: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

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

    let targetCohortId = cohortId || null;
    let targetProgramId = programId || null;

    let studentProfile: any = null;
    if (req.user) {
      studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
        include: { cohort: { include: { program: true } } },
      });

      if (studentProfile) {
        if (!targetCohortId && studentProfile.cohortId) {
          targetCohortId = studentProfile.cohortId;
        }
        if (!targetProgramId && studentProfile.cohort?.programId) {
          targetProgramId = studentProfile.cohort.programId;
        }
      }
    }

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
        cohortId: targetCohortId,
        programId: targetProgramId,
        isFeaturedPublic: isFeaturedPublic !== undefined ? Boolean(isFeaturedPublic) : true,
      },
    });

    // If student user is logged in, link as creator member
    if (studentProfile) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          studentId: studentProfile.id,
          role: 'Lead Creator',
        },
      });
    }

    const createdProjectWithDetails = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        program: { include: { school: true } },
        cohort: true,
        members: { include: { student: { include: { user: true } } } },
      },
    });

    res.status(201).json({ message: 'Project added to portfolio successfully!', project: createdProjectWithDetails });
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
