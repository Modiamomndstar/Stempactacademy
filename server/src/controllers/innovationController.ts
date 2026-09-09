import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/prisma.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export const getCompetitions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        teams: {
          include: {
            members: {
              include: {
                student: { include: { user: true } },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.status(200).json({ competitions });
  } catch (error: any) {
    console.error('getCompetitions error:', error);
    res.status(500).json({ message: 'Failed to fetch competitions' });
  }
};

export const createCompetition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, slug, category, description, rules, prizePool, startDate, endDate, registrationDeadline } = req.body;

    if (!title || !category || !startDate || !endDate) {
      res.status(400).json({ message: 'Title, category, startDate, and endDate are required.' });
      return;
    }

    const compSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const competition = await prisma.competition.create({
      data: {
        title,
        slug: compSlug,
        category,
        description: description || '',
        rules: rules || '',
        prizePool: prizePool || '₦500,000 in Innovation Grants',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(startDate),
        status: 'UPCOMING',
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: `${req.user?.firstName || 'Manager'} ${req.user?.lastName || ''}`,
      userRole: req.user?.role,
      action: 'COMPETITION_CREATED',
      resource: 'Competition',
      resourceId: competition.id,
      newValue: competition,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ message: 'Competition created successfully', competition });
  } catch (error: any) {
    console.error('createCompetition error:', error);
    res.status(500).json({ message: 'Failed to create competition' });
  }
};

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { competitionId, name, memberIds } = req.body; // memberIds: array of studentProfile IDs

    if (!competitionId || !name) {
      res.status(400).json({ message: 'Competition ID and Team Name are required.' });
      return;
    }

    const team = await prisma.competitionTeam.create({
      data: {
        competitionId,
        name,
        members: {
          create: (memberIds || []).map((studentId: string, idx: number) => ({
            studentId,
            role: idx === 0 ? 'Team Lead' : 'Core Engineer',
          })),
        },
      },
      include: {
        members: { include: { student: { include: { user: true } } } },
      },
    });

    // Notify team members
    for (const member of team.members) {
      await createNotification({
        userId: member.student.userId,
        title: 'Assigned to Innovation Squad! 🚀',
        message: `You have been added to team "${name}" for the upcoming hackathon.`,
        type: 'SUCCESS',
        link: '/portal/student',
      });
    }

    res.status(201).json({ message: 'Competition team formed successfully', team });
  } catch (error: any) {
    console.error('createTeam error:', error);
    res.status(500).json({ message: 'Failed to create team' });
  }
};

export const scoreTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { score, rank, feedback } = req.body;

    const team = await prisma.competitionTeam.update({
      where: { id: teamId },
      data: {
        score: parseFloat(score),
        rank: rank ? parseInt(rank) : null,
        feedback: feedback || null,
      },
      include: {
        competition: true,
        members: { include: { student: true } },
      },
    });

    for (const member of team.members) {
      await createNotification({
        userId: member.student.userId,
        title: `Hackathon Results Published: ${team.competition.title}`,
        message: `Your squad scored ${score}/100${rank ? ` and achieved Rank #${rank}` : ''}!`,
        type: 'SUCCESS',
        link: '/portal/student',
      });
    }

    res.status(200).json({ message: 'Team scored successfully', team });
  } catch (error: any) {
    console.error('scoreTeam error:', error);
    res.status(500).json({ message: 'Failed to score team' });
  }
};
