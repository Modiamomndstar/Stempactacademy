import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/prisma.js';

export const getPartnerOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let partnerProfile: any = null;

    if (req.user.role === 'SUPER_ADMIN') {
      const partnerId = req.query.partnerId as string;
      if (partnerId) {
        partnerProfile = await prisma.partnerProfile.findUnique({
          where: { id: partnerId },
          include: {
            user: true,
            sponsoredStudents: {
              include: {
                student: {
                  include: {
                    user: true,
                    cohort: { include: { program: true } },
                    projectMembers: { include: { project: true } },
                    submissions: { select: { grade: true } },
                  },
                },
              },
            },
          },
        });
      } else {
        partnerProfile = await prisma.partnerProfile.findFirst({
          include: {
            user: true,
            sponsoredStudents: {
              include: {
                student: {
                  include: {
                    user: true,
                    cohort: { include: { program: true } },
                    projectMembers: { include: { project: true } },
                    submissions: { select: { grade: true } },
                  },
                },
              },
            },
          },
        });
      }
    } else {
      partnerProfile = await prisma.partnerProfile.findUnique({
        where: { userId: req.user.id },
        include: {
          user: true,
          sponsoredStudents: {
            include: {
              student: {
                include: {
                  user: true,
                  cohort: { include: { program: true } },
                  projectMembers: { include: { project: true } },
                  submissions: { select: { grade: true } },
                },
              },
            },
          },
        },
      });
    }

    if (!partnerProfile) {
      res.status(404).json({ message: 'Partner profile not found.' });
      return;
    }

    const students = partnerProfile.sponsoredStudents.map((s: any) => {
      const grades = s.student.submissions.filter((sub: any) => sub.grade !== null);
      const avgGrade = grades.length > 0
        ? grades.reduce((acc: number, curr: any) => acc + (curr.grade || 0), 0) / grades.length
        : null;

      return {
        id: s.student.id,
        fullName: `${s.student.user.firstName} ${s.student.user.lastName}`,
        email: s.student.user.email,
        studentIdNumber: s.student.studentIdNumber,
        program: s.student.cohort?.program?.name || 'STEM Track',
        cohort: s.student.cohort?.name || 'Cohort Alpha',
        level: s.student.currentLevel,
        attendanceRate: s.student.attendanceRate,
        completionRate: s.student.completionRate,
        avgGrade: avgGrade !== null ? Math.round(avgGrade) : 'N/A',
        scholarshipName: s.scholarshipName,
        coveragePercent: s.coveragePercent,
        projectsCount: s.student.projectMembers?.length || 0,
        status: s.status,
      };
    });

    const totalSponsored = students.length;
    const avgAttendance = totalSponsored > 0
      ? students.reduce((sum: number, st: any) => sum + st.attendanceRate, 0) / totalSponsored
      : 100;
    const avgCompletion = totalSponsored > 0
      ? students.reduce((sum: number, st: any) => sum + st.completionRate, 0) / totalSponsored
      : 0;

    res.status(200).json({
      partner: {
        id: partnerProfile.id,
        organizationName: partnerProfile.organizationName,
        partnerType: partnerProfile.partnerType,
        mouDetails: partnerProfile.mouDetails,
        grantBudget: partnerProfile.grantBudget,
        activeSponsorships: totalSponsored,
      },
      metrics: {
        totalSponsored,
        avgAttendance: Math.round(avgAttendance),
        avgCompletion: Math.round(avgCompletion),
        activeSprintsOnTrack: totalSponsored > 0 ? 100 : 0,
      },
      students,
    });
  } catch (error: any) {
    console.error('getPartnerOverview error:', error);
    res.status(500).json({ message: 'Failed to fetch partner overview' });
  }
};
