import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/prisma.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

export const getAtRiskStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Students with attendance rate below 75%
    // 2. Students with average submission grade below 50%
    const students = await prisma.studentProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        cohort: {
          include: { program: true },
        },
        guardian: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        counselingRecords: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        submissions: {
          select: { grade: true },
        },
      },
      orderBy: { attendanceRate: 'asc' },
    });

    const atRiskList = students.map((s) => {
      const graded = s.submissions.filter((sub) => sub.grade !== null);
      const avgGrade = graded.length > 0
        ? graded.reduce((acc, curr) => acc + (curr.grade || 0), 0) / graded.length
        : null;

      let riskReason = '';
      let riskLevel = 'LOW';

      if (s.attendanceRate < 70) {
        riskLevel = 'HIGH';
        riskReason = `Critical Attendance Risk (${s.attendanceRate.toFixed(1)}%)`;
      } else if (s.attendanceRate < 80) {
        riskLevel = 'MEDIUM';
        riskReason = `Attendance Warning (${s.attendanceRate.toFixed(1)}%)`;
      }

      if (avgGrade !== null && avgGrade < 50) {
        riskLevel = riskLevel === 'HIGH' ? 'CRITICAL' : 'HIGH';
        riskReason += (riskReason ? ' + ' : '') + `Failing Average Grade (${avgGrade.toFixed(1)}%)`;
      }

      const hasActiveCase = s.counselingRecords.some((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS');

      return {
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullName: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        phone: s.user.phone,
        cohort: s.cohort?.name || 'Unassigned Cohort',
        program: s.cohort?.program?.name || 'STEM Academy Track',
        level: s.currentLevel,
        attendanceRate: s.attendanceRate,
        avgGrade: avgGrade !== null ? Math.round(avgGrade) : 'N/A',
        guardianName: s.guardian ? `${s.guardian.user.firstName} ${s.guardian.user.lastName}` : 'None Registered',
        guardianPhone: s.guardian?.emergencyContact || s.guardian?.user.phone || 'N/A',
        riskLevel,
        riskReason: riskReason || 'Standard Monitoring',
        hasActiveCase,
        recentCases: s.counselingRecords,
      };
    });

    res.status(200).json({ atRiskList });
  } catch (error: any) {
    console.error('getAtRiskStudents error:', error);
    res.status(500).json({ message: 'Failed to fetch at-risk students' });
  }
};

export const getCounselingRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, status } = req.query;
    const where: any = {};
    if (studentId) where.studentId = studentId as string;
    if (status) where.status = status as string;

    const records = await prisma.counselingRecord.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            cohort: { include: { program: true } },
          },
        },
        counselor: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ records });
  } catch (error: any) {
    console.error('getCounselingRecords error:', error);
    res.status(500).json({ message: 'Failed to fetch counseling records' });
  }
};

export const createCounselingRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, category, riskLevel, summary, notes, actionPlan, parentNotified, followUpDate } = req.body;

    if (!studentId || !category || !summary || !notes) {
      res.status(400).json({ message: 'Missing required counseling fields.' });
      return;
    }

    const record = await prisma.counselingRecord.create({
      data: {
        studentId,
        counselorId: req.user?.id || null,
        category,
        riskLevel: riskLevel || 'MEDIUM',
        summary,
        notes,
        actionPlan: actionPlan || null,
        parentNotified: Boolean(parentNotified),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        status: 'OPEN',
      },
      include: {
        student: { include: { user: true, guardian: { include: { user: true } } } },
      },
    });

    // Notify student gently
    await createNotification({
      userId: record.student.userId,
      title: 'Student Support & Advising Session Logged',
      message: `Your counselor logged notes for your session regarding ${category}. Check in with Student Support anytime.`,
      type: 'INFO',
      link: '/portal/student',
    });

    // If parent was notified and has a linked user account, notify parent
    if (parentNotified && record.student.guardian?.userId) {
      await createNotification({
        userId: record.student.guardian.userId,
        title: 'Academy Counselor Update for Your Ward',
        message: `A support note regarding ${record.student.user.firstName} has been recorded by Academy Counseling: ${summary}`,
        type: 'WARNING',
        link: '/portal/parent',
      });
    }

    await logAudit({
      userId: req.user?.id,
      userName: `${req.user?.firstName || 'Counselor'} ${req.user?.lastName || ''}`,
      userRole: req.user?.role,
      action: 'COUNSELING_RECORD_CREATED',
      resource: 'CounselingRecord',
      resourceId: record.id,
      newValue: { studentId, category, riskLevel, summary },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ message: 'Counseling record created successfully', record });
  } catch (error: any) {
    console.error('createCounselingRecord error:', error);
    res.status(500).json({ message: 'Failed to create counseling record' });
  }
};

export const updateCounselingRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, actionPlan, notes, followUpDate } = req.body;

    const existing = await prisma.counselingRecord.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Counseling record not found' });
      return;
    }

    const updated = await prisma.counselingRecord.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(actionPlan !== undefined && { actionPlan }),
        ...(notes && { notes }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: `${req.user?.firstName || 'Counselor'} ${req.user?.lastName || ''}`,
      userRole: req.user?.role,
      action: 'COUNSELING_RECORD_UPDATED',
      resource: 'CounselingRecord',
      resourceId: id,
      previousValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ message: 'Counseling record updated successfully', record: updated });
  } catch (error: any) {
    console.error('updateCounselingRecord error:', error);
    res.status(500).json({ message: 'Failed to update counseling record' });
  }
};
