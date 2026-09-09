import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { emailService } from '../services/emailService.js';

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cohortId, courseId, title, description, maxPoints, dueDate } = req.body;

    const assignment = await prisma.assignment.create({
      data: {
        cohortId,
        courseId: courseId || null,
        title,
        description,
        maxPoints: Number(maxPoints) || 100,
        dueDate: new Date(dueDate),
      },
    });

    res.status(201).json({ message: 'Assignment published successfully', assignment });
  } catch (error: any) {
    console.error('createAssignment error:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { assignmentId, content, attachmentUrl } = req.body;

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentProfile) {
      res.status(403).json({ message: 'Only enrolled students can submit assignments.' });
      return;
    }

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: studentProfile.id,
        userId: req.user.id,
        content,
        attachmentUrl,
      },
    });

    res.status(201).json({ message: 'Assignment submitted successfully!', submission });
  } catch (error: any) {
    console.error('submitAssignment error:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: Number(grade),
        feedback,
        gradedAt: new Date(),
      },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
    });

    if (submission.student?.user?.email) {
      emailService.sendGradeReleasedEmail({
        to: submission.student.user.email,
        fullName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
        assignmentTitle: submission.assignment.title,
        grade: Number(grade),
        maxPoints: submission.assignment.maxPoints,
        feedback,
      }).catch(err => console.error('Failed to send grade email:', err));
    }

    res.status(200).json({ message: 'Submission graded successfully', submission });
  } catch (error: any) {
    console.error('gradeSubmission error:', error);
    res.status(500).json({ message: 'Failed to grade submission' });
  }
};
