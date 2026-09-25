import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { emailService } from '../services/emailService.js';
import { academicDeliveryService } from '../services/academicDeliveryService.js';

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cohortId, courseId, moduleId, curriculumVersionId, title, description, maxPoints, dueDate, status } = req.body;

    if (!cohortId || !title || !description || !dueDate) {
      res.status(400).json({ message: 'cohortId, title, description, and dueDate are required.' });
      return;
    }

    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      res.status(404).json({ message: 'Cohort not found.' });
      return;
    }

    const assignment = await prisma.assignment.create({
      data: {
        cohortId,
        courseId: courseId || null,
        moduleId: moduleId || null,
        curriculumVersionId: curriculumVersionId || cohort.curriculumVersionId || null,
        instructorId: req.user?.id || null,
        title,
        description,
        maxPoints: Number(maxPoints) || 100,
        dueDate: new Date(dueDate),
        status: status || 'PUBLISHED',
      },
    });

    res.status(201).json({ message: 'Assignment published successfully', assignment });
  } catch (error: any) {
    console.error('createAssignment error:', error);
    res.status(500).json({ message: error.message || 'Failed to create assignment' });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { assignmentId, content, attachmentUrl } = req.body;

    if (!assignmentId || !content) {
      res.status(400).json({ message: 'assignmentId and content are required.' });
      return;
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentProfile) {
      res.status(403).json({ message: 'Only enrolled students can submit assignments.' });
      return;
    }

    const submission = await academicDeliveryService.submitAssignment({
      assignmentId,
      studentProfileId: studentProfile.id,
      userId: req.user.id,
      content,
      attachmentUrl,
    });

    res.status(201).json({
      message: `Assignment submitted successfully (Version ${submission.version})!`,
      submission,
    });
  } catch (error: any) {
    console.error('submitAssignment error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit assignment' });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
      res.status(400).json({ message: 'grade is required.' });
      return;
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            cohort: {
              include: {
                classSessions: {
                  include: { instructor: true },
                },
              },
            },
          },
        },
      },
    });

    if (!sub) {
      res.status(404).json({ message: 'Submission not found.' });
      return;
    }

    const isSuperOrAcademicAdmin = ['SUPER_ADMIN', 'ACADEMIC_ADMIN'].includes(req.user.role as any);
    const isAssignmentAuthor = sub.assignment.instructorId === req.user.id;
    const isCohortInstructor = sub.assignment.cohort.classSessions.some(
      (cs) => cs.instructor?.userId === req.user?.id
    );

    if (!isSuperOrAcademicAdmin && !isAssignmentAuthor && !isCohortInstructor) {
      res.status(403).json({
        message: 'Access denied: You are not assigned to instruct or grade this cohort/assignment.',
      });
      return;
    }

    const submission = await academicDeliveryService.gradeSubmission({
      submissionId,
      grade: Number(grade),
      feedback,
      gradedByUserId: req.user.id,
    });

    if (submission.student?.user?.email) {
      emailService.sendGradeReleasedEmail({
        to: submission.student.user.email,
        fullName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
        assignmentTitle: submission.assignment.title,
        grade: Number(grade),
        maxPoints: submission.assignment.maxPoints,
        feedback: feedback || '',
      }).catch(err => console.error('Failed to send grade email:', err));
    }

    res.status(200).json({ message: 'Submission graded successfully', submission });
  } catch (error: any) {
    console.error('gradeSubmission error:', error);
    res.status(500).json({ message: error.message || 'Failed to grade submission' });
  }
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        cohort: true,
        submissions: {
          include: {
            student: { include: { user: true } },
            gradedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: [{ isLatest: 'desc' }, { version: 'desc' }],
        },
      },
    });

    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found.' });
      return;
    }

    res.status(200).json({ assignment, submissions: assignment.submissions });
  } catch (error: any) {
    console.error('getAssignmentSubmissions error:', error);
    res.status(500).json({ message: 'Failed to fetch assignment submissions' });
  }
};

export const getMySubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentProfile) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }

    const submissions = await prisma.submission.findMany({
      where: { studentId: studentProfile.id },
      include: { assignment: true },
      orderBy: { submittedAt: 'desc' },
    });

    res.status(200).json({ submissions });
  } catch (error: any) {
    console.error('getMySubmissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};
