import { Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { academicDeliveryService } from '../services/academicDeliveryService.js';
import { progressionService } from '../services/progressionService.js';

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: true,
        cohort: {
          include: {
            program: { include: { school: true } },
            classSessions: {
              orderBy: { date: 'asc' },
            },
          },
        },
        attendances: {
          include: { classSession: true },
          orderBy: { date: 'desc' },
        },
        submissions: {
          where: { isLatest: true },
          include: { assignment: true },
          orderBy: { submittedAt: 'desc' },
        },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
        certificates: {
          orderBy: { issueDate: 'desc' },
        },
        competencies: {
          include: { competency: true },
        },
        projectMembers: {
          include: { project: true },
        },
        lessonProgress: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!studentProfile) {
      res.status(404).json({ message: 'Student profile not found for this account.' });
      return;
    }

    // Resolve version-anchored academic delivery context
    const academicContext = await academicDeliveryService.getStudentAcademicContext(studentProfile.id);
    const curriculumData = await academicDeliveryService.getAnchoredCurriculumForStudent(studentProfile.id);
    const metrics = await academicDeliveryService.calculateStudentProgress(studentProfile.id);

    // Upcoming assignments in active cohort
    const cohortId = studentProfile.currentCohortId || academicContext.cohortId;
    const upcomingAssignments = cohortId
      ? await prisma.assignment.findMany({
          where: { cohortId, status: { in: ['PUBLISHED', 'CLOSED'] } },
          include: {
            submissions: {
              where: { studentId: studentProfile.id, isLatest: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        })
      : [];

    // Announcements
    const announcements = await prisma.announcement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      dashboard: {
        profile: {
          id: studentProfile.id,
          userId: studentProfile.userId,
          studentIdNumber: studentProfile.studentIdNumber,
          fullName: `${studentProfile.user.firstName} ${studentProfile.user.lastName}`,
          email: studentProfile.user.email,
          phone: studentProfile.user.phone,
          avatarUrl: studentProfile.user.avatarUrl,
          currentLevel: studentProfile.currentLevel,
          status: studentProfile.status,
          enrollmentDate: studentProfile.enrollmentDate,
        },
        academicContext,
        cohort: studentProfile.cohort,
        program: studentProfile.cohort?.program,
        curriculum: {
          versionNumber: academicContext.curriculumVersionNumber,
          levelCode: academicContext.levelCode,
          levelDisplayName: academicContext.levelDisplayName,
          courses: curriculumData.courses,
          competencies: curriculumData.competencies,
        },
        completedLessonIds: studentProfile.lessonProgress.map((lp) => lp.lessonId),
        lessonProgress: studentProfile.lessonProgress,
        metrics: {
          progressPercentage: metrics.completionRate,
          attendanceRate: metrics.attendanceRate,
          syllabusProgressPercentage: metrics.syllabusProgressPercentage,
          totalClasses: studentProfile.attendances.length,
          attendedClasses: studentProfile.attendances.filter(
            (a) => a.status === 'PRESENT' || a.status === 'LATE'
          ).length,
          completedLessonsCount: metrics.completedLessons,
          totalLessonsCount: metrics.totalLessons,
          completedAssignmentsCount: metrics.completedAssignments,
          totalAssignmentsCount: metrics.totalAssignments,
          averageAssignmentGrade: metrics.averageAssignmentGrade,
          projectsCount: metrics.totalProjects,
          achievedCompetenciesCount: metrics.achievedCompetencies,
          totalCompetenciesCount: metrics.totalCompetencies,
        },
        attendances: studentProfile.attendances,
        assignments: upcomingAssignments,
        submissions: studentProfile.submissions,
        invoices: studentProfile.invoices,
        certificates: studentProfile.certificates,
        competencies: studentProfile.competencies,
        projects: studentProfile.projectMembers.map((pm) => pm.project),
        announcements,
      },
    });
  } catch (error: any) {
    console.error('getStudentDashboard error:', error);
    res.status(500).json({ message: 'Failed to load student dashboard' });
  }
};

export const getStudentCurriculum = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const curriculumData = await academicDeliveryService.getAnchoredCurriculumForStudent(studentProfile.id);
    res.status(200).json(curriculumData);
  } catch (error: any) {
    console.error('getStudentCurriculum error:', error);
    res.status(500).json({ message: 'Failed to fetch student curriculum' });
  }
};

export const recordLessonProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { lessonId } = req.params;
    const { status, timeSpentMinutes, notes } = req.body;

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentProfile) {
      res.status(403).json({ message: 'Only enrolled students can record lesson progress.' });
      return;
    }

    const progress = await academicDeliveryService.recordLessonProgress({
      studentProfileId: studentProfile.id,
      lessonId,
      status: status || 'COMPLETED',
      timeSpentMinutes: timeSpentMinutes !== undefined ? Number(timeSpentMinutes) : 30,
      notes,
    });

    res.status(200).json({
      message: 'Lesson progress recorded successfully.',
      progress,
    });
  } catch (error: any) {
    console.error('recordLessonProgress error:', error);
    if (error.message?.includes('Access denied') || error.message?.includes('does not belong')) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error.message?.includes('not found')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Failed to record lesson progress.' });
  }
};

export const getCompletionReadiness = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let targetStudentId: string | null = null;

    if (req.user.role === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      if (!student) {
        res.status(404).json({ message: 'Student profile not found.' });
        return;
      }
      targetStudentId = student.id;
    } else {
      // Staff roles can query by studentId parameter
      const requestedId = req.query.studentId as string;
      if (!requestedId) {
        res.status(400).json({ message: 'studentId query parameter is required for staff review.' });
        return;
      }
      targetStudentId = requestedId;
    }

    const report = await academicDeliveryService.evaluateCompletionReadiness(targetStudentId);
    res.status(200).json({ report });
  } catch (error: any) {
    console.error('getCompletionReadiness error:', error);
    res.status(500).json({ message: error.message || 'Failed to evaluate completion readiness.' });
  }
};

export const claimLevelCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      include: { certificates: true },
    });

    if (!student) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }

    const context = await academicDeliveryService.getStudentAcademicContext(student.id);
    const report = await academicDeliveryService.evaluateCompletionReadiness(student.id);

    // Check if certificate already issued for this level & program
    const existingCert = student.certificates.find(
      (c) =>
        c.levelCode === context.levelCode &&
        c.programName.toLowerCase().includes(context.programName.toLowerCase())
    );

    if (existingCert) {
      res.status(200).json({
        message: `Your Certificate of Completion for ${context.programName} (${context.levelDisplayName}) has already been issued.`,
        alreadyIssued: true,
        certificate: existingCert,
        report,
      });
      return;
    }

    if (!report.evaluation.isPolicyMet) {
      res.status(400).json({
        message:
          report.evaluation.deficits.join(' ') ||
          'You have not yet met all academic completion requirements for this level.',
        deficits: report.evaluation.deficits,
        report,
      });
      return;
    }

    // Issue the verifiable Level Certificate of Completion & unlock next-level Progression Eligibility
    const result = await progressionService.evaluateLevelCompletion({
      studentId: student.id,
      cohortId: context.cohortId,
      staffUser: {
        id: req.user.id,
        role: Role.ACADEMIC_ADMIN,
        name: 'STEMPACT Automated Level Completion Terminal',
      },
      overrideCriteria: true,
      notes: `Verified 100% UoPeople Level Completion (${report.academicEvidence.completedLessons}/${report.academicEvidence.totalLessons} lessons, ${report.academicEvidence.attendanceRate}% attendance).`,
    });

    res.status(200).json({
      message: `Congratulations! Your official Certificate of Completion for ${context.programName} (${context.levelDisplayName}) has been generated!`,
      certificate: result.certificate,
      trackDiploma: result.trackDiploma || null,
      progressionEligibility: result.progressionEligibility || null,
      report,
    });
  } catch (error: any) {
    console.error('claimLevelCertificate error:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate Level Certificate of Completion.',
    });
  }
};

