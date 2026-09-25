import { Response } from 'express';
import { AttendanceStatus, Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { academicDeliveryService } from '../services/academicDeliveryService.js';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { classSessionId, records } = req.body;
    // records: Array of { studentId: string, status: AttendanceStatus, remarks?: string }

    if (!classSessionId || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ message: 'classSessionId and non-empty records array are required.' });
      return;
    }

    // Authorization verification
    const session = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: { cohort: true, instructor: true },
    });

    if (!session) {
      res.status(404).json({ message: 'Class session not found.' });
      return;
    }

    const isSuperOrAcademicAdmin = [Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN].includes(req.user.role as any);
    const isSessionInstructor = session.instructor?.userId === req.user.id;
    const isCohortInstructor = await prisma.classSession.findFirst({
      where: {
        cohortId: session.cohortId,
        instructor: { userId: req.user.id },
      },
    });

    if (!isSuperOrAcademicAdmin && !isSessionInstructor && !isCohortInstructor) {
      res.status(403).json({ message: 'Access denied: You are not assigned to instruct this session or cohort.' });
      return;
    }

    const result = await academicDeliveryService.recordAttendance({
      classSessionId,
      records,
      markedByUserId: req.user.id,
    });

    res.status(200).json({
      message: `Successfully recorded attendance for ${records.length} students.`,
      result,
    });
  } catch (error: any) {
    console.error('markAttendance error:', error);
    res.status(500).json({ message: error.message || 'Failed to record attendance' });
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

    // Student IDOR Protection
    if (req.user.role === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id },
        include: { enrollments: { where: { cohortId } } },
      });

      const isInCohort = student?.currentCohortId === cohortId || (student?.enrollments && student.enrollments.length > 0);
      if (!student || !isInCohort) {
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

    // Parent IDOR Protection
    if (req.user.role === 'PARENT') {
      const parent = await prisma.parentProfile.findUnique({
        where: { userId: req.user.id },
        include: {
          students: true,
          guardianRelations: { include: { student: true } },
        },
      });

      const wardStudentIds = new Set<string>();
      parent?.students.forEach((s) => wardStudentIds.add(s.id));
      parent?.guardianRelations.forEach((r) => wardStudentIds.add(r.studentId));

      const sessions = await prisma.classSession.findMany({
        where: { cohortId },
        include: {
          attendances: {
            where: { studentId: { in: Array.from(wardStudentIds) } },
            include: { student: { include: { user: true } } },
          },
        },
        orderBy: { date: 'desc' },
      });

      res.status(200).json({ sessions });
      return;
    }

    // Staff access
    if (!staffRoles.includes(req.user.role)) {
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
