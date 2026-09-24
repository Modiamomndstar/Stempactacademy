import { Response } from 'express';
import { AttendanceStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classSessionId, records } = req.body;
    // records: Array of { studentId: string, status: AttendanceStatus, remarks?: string }

    if (!classSessionId || !Array.isArray(records)) {
      res.status(400).json({ message: 'classSessionId and records array are required.' });
      return;
    }

    const markedById = req.user?.id;

    for (const record of records) {
      // Find existing attendance for this student & session, or create
      const existing = await prisma.attendance.findFirst({
        where: {
          classSessionId,
          studentId: record.studentId,
        },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status as AttendanceStatus,
            remarks: record.remarks,
            markedById,
          },
        });
      } else {
        await prisma.attendance.create({
          data: {
            classSessionId,
            studentId: record.studentId,
            status: record.status as AttendanceStatus,
            remarks: record.remarks,
            markedById,
          },
        });
      }

      // Recalculate student profile attendance rate
      const allStudentAttendances = await prisma.attendance.findMany({
        where: { studentId: record.studentId },
      });
      const total = allStudentAttendances.length;
      const attended = allStudentAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const rate = total > 0 ? (attended / total) * 100 : 100;

      await prisma.studentProfile.update({
        where: { id: record.studentId },
        data: { attendanceRate: Math.round(rate) },
      });
    }

    res.status(200).json({ message: `Successfully recorded attendance for ${records.length} students.` });
  } catch (error: any) {
    console.error('markAttendance error:', error);
    res.status(500).json({ message: 'Failed to record attendance' });
  }
};

export const getAttendanceForCohort = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { cohortId } = req.params;

    const staffRoles = [
      'SUPER_ADMIN',
      'ACADEMIC_ADMIN',
      'INSTRUCTOR',
      'COORDINATOR_ADMIN',
      'PROGRAM_COORDINATOR',
      'COUNSELOR',
    ];

    if (!staffRoles.includes(req.user.role)) {
      // If student, allow viewing only their own attendance records in this cohort
      if (req.user.role === 'STUDENT') {
        const student = await prisma.studentProfile.findUnique({
          where: { userId: req.user.id },
        });

        if (!student || student.currentCohortId !== cohortId) {
          res.status(403).json({ message: 'Access denied: You are not enrolled in this cohort.' });
          return;
        }

        const sessions = await prisma.classSession.findMany({
          where: { cohortId },
          include: {
            attendances: {
              where: { studentId: student.id },
            },
          },
          orderBy: { date: 'desc' },
        });

        res.status(200).json({ sessions });
        return;
      }

      res.status(403).json({ message: 'Access denied: Viewing full cohort attendance roster requires instructor or administrator privileges.' });
      return;
    }

    const sessions = await prisma.classSession.findMany({
      where: { cohortId },
      include: {
        attendances: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ sessions });
  } catch (error: any) {
    console.error('getAttendanceForCohort error:', error);
    res.status(500).json({ message: 'Failed to load cohort attendance' });
  }
};
