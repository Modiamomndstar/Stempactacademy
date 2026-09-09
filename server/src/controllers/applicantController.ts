import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/prisma.js';

export const getApplicantDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const application = await prisma.application.findFirst({
      where: {
        OR: [
          { userId: req.user.id },
          { email: req.user.email },
        ],
      },
      include: {
        program: { include: { school: true, assessments: { include: { questions: true } } } },
        cohort: true,
        assessmentAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
        placement: true,
        admission: {
          include: {
            cohort: true,
          },
        },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      res.status(200).json({
        hasApplication: false,
        message: 'No enrollment application found for this account.',
      });
      return;
    }

    // Determine current pipeline stage
    let currentStage = 'SUBMITTED';
    let nextAction = 'Take Diagnostic Assessment';

    const latestAttempt = application.assessmentAttempts[0] || null;
    const placement = application.placement;
    const admission = application.admission;
    const invoice = application.invoices[0] || null;

    if (admission && admission.status === 'ENROLLED') {
      currentStage = 'ENROLLED';
      nextAction = 'Access Student Portal';
    } else if (admission) {
      currentStage = 'ADMITTED';
      nextAction = 'Pay Tuition Deposit to Confirm Seat';
    } else if (placement && placement.status === 'APPROVED') {
      currentStage = 'PLACEMENT_APPROVED';
      nextAction = 'Awaiting Admission Letter Generation';
    } else if (latestAttempt) {
      currentStage = 'ASSESSMENT_COMPLETED';
      nextAction = 'Academic Board Reviewing Placement';
    } else {
      currentStage = 'ASSESSMENT_PENDING';
      nextAction = 'Complete 15-Question Diagnostic Assessment';
    }

    // Dynamic assessment questions for this program
    const assessment = application.program.assessments[0] || null;

    res.status(200).json({
      hasApplication: true,
      currentStage,
      nextAction,
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        preferredSchedule: application.preferredSchedule,
        programName: application.program.name,
        schoolName: application.program.school.name,
        cohortName: application.cohort?.name || 'Assigned upon admission',
        status: application.status,
        createdAt: application.createdAt,
      },
      assessmentAttempt: latestAttempt,
      placement,
      admission,
      invoice,
      assessmentAvailable: !!assessment,
      assessmentId: assessment?.id,
    });
  } catch (error: any) {
    console.error('getApplicantDashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch applicant dashboard' });
  }
};
