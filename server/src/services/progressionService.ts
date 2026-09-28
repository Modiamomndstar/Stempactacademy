import {
  AcademicLevel,
  CertificateType,
  EnrollmentStatus,
  Role,
} from '@prisma/client';
import prisma from '../config/prisma.js';
import { identifierService } from './identifierService.js';
import { paymentService } from './paymentService.js';
import { createNotification } from './notificationService.js';
import { emailService } from './emailService.js';
import { automationEventService } from './automationEventService.js';

export const LEVEL_PROGRESSION_MAP: Record<AcademicLevel, AcademicLevel | null> = {
  [AcademicLevel.LEVEL_0_ASSESSMENT]: AcademicLevel.LEVEL_1_FOUNDATION,
  [AcademicLevel.LEVEL_1_FOUNDATION]: AcademicLevel.LEVEL_2_INTERMEDIATE,
  [AcademicLevel.LEVEL_2_INTERMEDIATE]: AcademicLevel.LEVEL_3_ADVANCED,
  [AcademicLevel.LEVEL_3_ADVANCED]: AcademicLevel.LEVEL_4_SPECIALIST,
  [AcademicLevel.LEVEL_4_SPECIALIST]: AcademicLevel.LEVEL_5_INNOVATION,
  [AcademicLevel.LEVEL_5_INNOVATION]: AcademicLevel.LEVEL_6_ENTREPRENEURSHIP,
  [AcademicLevel.LEVEL_6_ENTREPRENEURSHIP]: null,
};

export const LEVEL_DISPLAY_NAMES: Record<AcademicLevel, string> = {
  [AcademicLevel.LEVEL_0_ASSESSMENT]: 'Level 0 — Assessment & Digital Orientation',
  [AcademicLevel.LEVEL_1_FOUNDATION]: 'Level 1 — Foundation Bootcamp',
  [AcademicLevel.LEVEL_2_INTERMEDIATE]: 'Level 2 — Applied Hands-On Engineering',
  [AcademicLevel.LEVEL_3_ADVANCED]: 'Level 3 — Advanced Systems & Architecture',
  [AcademicLevel.LEVEL_4_SPECIALIST]: 'Level 4 — Specialist & Production Innovation',
  [AcademicLevel.LEVEL_5_INNOVATION]: 'Level 5 — Applied R&D & Prototyping',
  [AcademicLevel.LEVEL_6_ENTREPRENEURSHIP]: 'Level 6 — Venture Commercialization',
};

export class ProgressionService {
  /**
   * Evaluates student completion for their active cohort level.
   * On success:
   * - Marks StudentCohortEnrollment as COMPLETED.
   * - Generates Level Completion Certificate.
   * - Creates permanent ProgressionEligibility for the subsequent level.
   * - Releases the Single Active Cohort Lock!
   */
  async evaluateLevelCompletion(params: {
    studentId: string;
    cohortId: string;
    staffUser: { id: string; role: Role; name?: string };
    overrideCriteria?: boolean;
    notes?: string;
  }) {
    const { studentId, cohortId, staffUser, overrideCriteria = false, notes } = params;

    const authorizedStaff: Role[] = [
      Role.SUPER_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.PROGRAM_COORDINATOR,
      Role.COORDINATOR_ADMIN,
    ];

    if (!authorizedStaff.includes(staffUser.role)) {
      throw new Error('Access denied: Unauthorized role to evaluate and clear student progression.');
    }

    const enrollment = await prisma.studentCohortEnrollment.findUnique({
      where: {
        studentId_cohortId: { studentId, cohortId },
      },
      include: {
        student: { include: { user: true } },
        cohort: { include: { program: true } },
      },
    });

    if (!enrollment) {
      throw new Error('Student cohort enrollment not found.');
    }

    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      return {
        success: true,
        alreadyCompleted: true,
        message: 'Student has already completed this cohort level.',
        enrollment,
      };
    }

    // 1. Audit attendance rate
    const totalSessions = await prisma.classSession.count({ where: { cohortId } });
    const attendedSessions = await prisma.attendance.count({
      where: {
        studentId,
        classSession: { cohortId },
        status: { in: ['PRESENT', 'EXCUSED'] },
      },
    });

    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100;

    // 2. Audit assignments
    const totalAssignments = await prisma.assignment.count({ where: { cohortId } });
    const gradedSubmissions = await prisma.submission.count({
      where: {
        studentId,
        assignment: { cohortId },
        status: 'GRADED',
      },
    });

    const meetsAttendance = attendanceRate >= 75;
    const meetsAssignments = totalAssignments === 0 || gradedSubmissions >= Math.ceil(totalAssignments * 0.7);

    if (!overrideCriteria && (!meetsAttendance || !meetsAssignments)) {
      throw new Error(
        `Student does not meet level completion criteria. Attendance: ${attendanceRate.toFixed(1)}% (min 75%), Assignments graded: ${gradedSubmissions}/${totalAssignments}.`
      );
    }

    const currentLevelCode = enrollment.cohort.levelCode || AcademicLevel.LEVEL_1_FOUNDATION;
    const nextLevelCode = LEVEL_PROGRESSION_MAP[currentLevelCode];

    // Transaction: Complete enrollment, generate certificate, create progression eligibility
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark enrollment as COMPLETED (releases active lock)
      const updatedEnrollment = await tx.studentCohortEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completionDate: new Date(),
          notes: notes || `Level completed with ${attendanceRate.toFixed(1)}% attendance.`,
        },
      });

      // 2. Generate verifiable Certificate
      const certYear = new Date().getFullYear();
      const certificateNumber = await identifierService.generateCertificateNumber({ year: certYear });
      const verificationCode = `V-${certificateNumber.replace('CERT-', '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const certificate = await tx.certificate.create({
        data: {
          certificateNumber,
          studentId,
          studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          programName: `${enrollment.cohort.program.name} (${LEVEL_DISPLAY_NAMES[currentLevelCode]})`,
          certificateType: CertificateType.COMPLETION,
          achievement: `Successfully completed ${LEVEL_DISPLAY_NAMES[currentLevelCode]} under cohort ${enrollment.cohort.name}.`,
          verificationCode,
          verified: true,
          signers: JSON.stringify(['Director of Academics & Training', 'Lead Faculty Mentor']),
        },
      });

      // 3. Create permanent ProgressionEligibility for next level (if not at terminal level)
      let progressionEligibility: any = null;
      if (nextLevelCode) {
        progressionEligibility = await tx.progressionEligibility.create({
          data: {
            studentId,
            programId: enrollment.cohort.programId,
            completedLevel: currentLevelCode,
            eligibleLevel: nextLevelCode,
            completedCohortId: cohortId,
            certificateId: certificate.id,
            status: 'AVAILABLE',
            notes: `Eligible for ${LEVEL_DISPLAY_NAMES[nextLevelCode]}.`,
          },
        });
      }

      // Update student profile completion metrics
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          currentLevel: nextLevelCode ? LEVEL_DISPLAY_NAMES[nextLevelCode] : 'Graduate',
          completionRate: 100,
        },
      });

      return {
        enrollment: updatedEnrollment,
        certificate,
        progressionEligibility,
      };
    });

    // 4. Send notifications
    const studentUser = enrollment.student.user;
    const certNotice = `Congratulations ${studentUser.firstName}! You have successfully completed ${LEVEL_DISPLAY_NAMES[currentLevelCode]} in ${enrollment.cohort.program.name}. Your Certificate (${result.certificate.certificateNumber}) is now available in your portal.`;
    
    await createNotification({
      userId: studentUser.id,
      title: `Level Completion: ${LEVEL_DISPLAY_NAMES[currentLevelCode]} Completed!`,
      message: result.progressionEligibility
        ? `${certNotice} You are now eligible to advance to ${LEVEL_DISPLAY_NAMES[nextLevelCode!]}. You may enroll in an upcoming cohort whenever you are ready!`
        : certNotice,
      type: 'SUCCESS',
      link: '/portal/student?tab=certificates',
    });

    if (studentUser.email) {
      await emailService.sendCertificateIssuedEmail({
        to: studentUser.email,
        fullName: `${studentUser.firstName} ${studentUser.lastName}`,
        programName: `${enrollment.cohort.program.name} - ${LEVEL_DISPLAY_NAMES[currentLevelCode]}`,
        certificateNumber: result.certificate.certificateNumber,
        verificationCode: result.certificate.verificationCode,
      });
    }

    return {
      success: true,
      enrollment: result.enrollment,
      certificate: result.certificate,
      progressionEligibility: result.progressionEligibility,
    };
  }

  /**
   * Fetches student's full historical academic journey:
   * - Active running cohort (if any).
   * - Completed cohort stages & certificates.
   * - Open progression entitlements available to claim.
   */
  async getStudentAcademicJourney(studentId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        certificates: { orderBy: { issueDate: 'desc' } },
        progressionEligibilities: {
          where: { status: 'AVAILABLE' },
          include: { program: true, completedCohort: true },
          orderBy: { clearedAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new Error('Student profile not found.');
    }

    // Active cohort enrollment
    const activeEnrollment = await prisma.studentCohortEnrollment.findFirst({
      where: {
        studentId,
        status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.ACTIVE] },
      },
      include: {
        cohort: {
          include: {
            program: true,
            learningCenter: true,
          },
        },
      },
    });

    // Completed historical cohort enrollments
    const completedEnrollments = await prisma.studentCohortEnrollment.findMany({
      where: {
        studentId,
        status: EnrollmentStatus.COMPLETED,
      },
      include: {
        cohort: {
          include: {
            program: true,
            learningCenter: true,
          },
        },
      },
      orderBy: { completionDate: 'desc' },
    });

    // For any available progression entitlements, find matching open cohorts
    const openAdvancementCohorts: any[] = [];
    for (const prog of student.progressionEligibilities) {
      const matchingCohorts = await prisma.cohort.findMany({
        where: {
          programId: prog.programId,
          levelCode: prog.eligibleLevel,
          status: { in: ['OPEN', 'ALMOST_FULL', 'UPCOMING'] },
        },
        include: {
          program: true,
          learningCenter: true,
        },
        orderBy: { startDate: 'asc' },
      });
      openAdvancementCohorts.push({
        eligibilityId: prog.id,
        programId: prog.programId,
        eligibleLevel: prog.eligibleLevel,
        eligibleLevelName: LEVEL_DISPLAY_NAMES[prog.eligibleLevel],
        cohorts: matchingCohorts,
      });
    }

    return {
      student: {
        id: student.id,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        currentLevel: student.currentLevel,
      },
      activeEnrollment,
      hasActiveCohort: activeEnrollment !== null,
      completedEnrollments,
      certificates: student.certificates,
      availableProgression: student.progressionEligibilities.map((pe) => ({
        ...pe,
        completedLevelName: LEVEL_DISPLAY_NAMES[pe.completedLevel],
        eligibleLevelName: LEVEL_DISPLAY_NAMES[pe.eligibleLevel],
      })),
      openAdvancementCohorts,
    };
  }

  /**
   * Student claims an earned progression entitlement and enrolls into an open cohort.
   * Gated by:
   * - Must NOT have any other active cohort running.
   * - Target cohort must match eligibleLevel and programId.
   */
  async claimProgressionEnrollment(params: {
    studentId: string;
    eligibilityId: string;
    targetCohortId: string;
    authUser: { id: string; role: Role; email?: string };
  }) {
    const { studentId, eligibilityId, targetCohortId, authUser } = params;

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new Error('Student profile not found.');
    }

    // Authorization: Owner student or Super Admin
    if (student.userId !== authUser.id && authUser.role !== Role.SUPER_ADMIN) {
      throw new Error('Access denied: You cannot claim progression on behalf of another student.');
    }

    // 1. Verify Single Active Cohort Constraint
    const activeEnrollment = await prisma.studentCohortEnrollment.findFirst({
      where: {
        studentId,
        status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.ACTIVE] },
      },
      include: { cohort: true },
    });

    if (activeEnrollment) {
      throw new Error(
        `Academic Policy Restriction: You are currently enrolled in an active cohort (${activeEnrollment.cohort.name}). You must complete your current cohort before claiming advancement to a new cohort.`
      );
    }

    // 2. Verify eligibility
    const eligibility = await prisma.progressionEligibility.findUnique({
      where: { id: eligibilityId },
    });

    if (!eligibility || eligibility.studentId !== studentId || eligibility.status !== 'AVAILABLE') {
      throw new Error('Valid progression entitlement not found or has already been claimed.');
    }

    // 3. Verify target cohort
    const targetCohort = await prisma.cohort.findUnique({
      where: { id: targetCohortId },
      include: { program: true },
    });

    if (!targetCohort) {
      throw new Error('Target cohort not found.');
    }

    if (targetCohort.programId !== eligibility.programId) {
      throw new Error('Target cohort program does not match progression entitlement.');
    }

    if (targetCohort.levelCode !== eligibility.eligibleLevel) {
      throw new Error(
        `Target cohort level (${LEVEL_DISPLAY_NAMES[targetCohort.levelCode]}) does not match your eligible level (${LEVEL_DISPLAY_NAMES[eligibility.eligibleLevel]}).`
      );
    }

    if (targetCohort.currentEnrollment >= targetCohort.maxCapacity) {
      throw new Error('Target cohort has reached maximum capacity.');
    }

    // 4. Enroll transactionally
    const result = await prisma.$transaction(async (tx) => {
      // Increment cohort capacity
      await tx.$executeRaw`
        UPDATE "Cohort"
        SET "currentEnrollment" = "currentEnrollment" + 1, "updatedAt" = NOW()
        WHERE "id" = ${targetCohort.id} AND "currentEnrollment" < "maxCapacity"
      `;

      // Create new StudentCohortEnrollment in ACTIVE state
      const enrollment = await tx.studentCohortEnrollment.create({
        data: {
          studentId,
          cohortId: targetCohort.id,
          programId: targetCohort.programId,
          programVersionId: targetCohort.programVersionId,
          curriculumVersionId: targetCohort.curriculumVersionId,
          academicSessionId: targetCohort.academicSessionId,
          status: EnrollmentStatus.ENROLLED,
          enrolledById: authUser.id,
          notes: `Advanced from ${LEVEL_DISPLAY_NAMES[eligibility.completedLevel]} via Progression Eligibility #${eligibility.id.substring(0, 8)}.`,
        },
        include: { cohort: true },
      });

      // Mark eligibility as CLAIMED
      await tx.progressionEligibility.update({
        where: { id: eligibility.id },
        data: {
          status: 'CLAIMED',
          claimedCohortId: targetCohort.id,
          claimedAt: new Date(),
        },
      });

      // Update student profile active cohort & level
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          currentCohortId: targetCohort.id,
          currentLevel: LEVEL_DISPLAY_NAMES[eligibility.eligibleLevel],
          completionRate: 0,
        },
      });

      // Generate invoice for the new level cohort
      const invoice = await paymentService.createInvoiceForCohort({
        studentId,
        cohortId: targetCohort.id,
        title: `Tuition & Studio Fee — ${targetCohort.name} (${LEVEL_DISPLAY_NAMES[eligibility.eligibleLevel]})`,
        trainingFee: targetCohort.trainingFee,
        registrationFee: targetCohort.registrationFee,
        certificationFee: targetCohort.certificationFee,
        discountPercentage: targetCohort.discountPercentage,
      });

      return { enrollment, invoice };
    });

    await createNotification({
      userId: student.userId,
      title: `Enrollment Confirmed: ${targetCohort.name}`,
      message: `You are officially enrolled in ${targetCohort.name} for ${LEVEL_DISPLAY_NAMES[eligibility.eligibleLevel]}. Welcome to the next stage of your engineering journey!`,
      type: 'SUCCESS',
      link: '/portal/student',
    });

    return result;
  }
}

export const progressionService = new ProgressionService();
