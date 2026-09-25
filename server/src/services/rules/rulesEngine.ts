import prisma from '../../config/prisma.js';
import { AttendanceStatus, CertificateType } from '@prisma/client';
import { PlacementService } from '../placementService.js';

export interface ScheduleConflictCheck {
  hasConflict: boolean;
  conflicts: string[];
}

export interface CertificateEligibilityResult {
  isEligible: boolean;
  attendanceRate: number;
  assignmentsCompletedPercent: number;
  assessmentsPassed: boolean;
  outstandingBalance: number;
  reasons: string[];
  recommendedCertificateType?: CertificateType;
}

export class RulesEngine {
  /**
   * Deterministic Schedule Conflict Detection
   * Prevents double-booking instructors, classrooms/labs, and overlapping cohort times
   */
  static async checkScheduleConflicts(params: {
    instructorId?: string;
    location: string;
    date: Date;
    startTime: string; // e.g. "16:00"
    endTime: string;   // e.g. "18:30"
    excludeSessionId?: string;
  }): Promise<ScheduleConflictCheck> {
    const conflicts: string[] = [];

    // Query active sessions on the same calendar day
    const dayStart = new Date(params.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(params.date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingSessions = await prisma.classSession.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        id: params.excludeSessionId ? { not: params.excludeSessionId } : undefined,
      },
    });

    const isOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
      return startA < endB && endA > startB;
    };

    for (const session of existingSessions) {
      const overlap = isOverlap(params.startTime, params.endTime, session.startTime, session.endTime);

      if (overlap) {
        // Room/Hub conflict
        if (session.room && session.room.toLowerCase() === params.location.toLowerCase()) {
          conflicts.push(`Room/Lab Conflict: "${params.location}" is already booked for "${session.topic}" (${session.startTime} - ${session.endTime})`);
        }

        // Instructor conflict
        if (params.instructorId && session.instructorId === params.instructorId) {
          conflicts.push(`Instructor Conflict: Instructor is already assigned to lead "${session.topic}" (${session.startTime} - ${session.endTime})`);
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * Deterministic Certificate Eligibility Calculator
   * Strictly enforces:
   * 1. Attendance >= 75%
   * 2. Assignment Submissions >= 80%
   * 3. Zero outstanding tuition fee balance
   */
  static async calculateCertificateEligibility(studentProfileId: string): Promise<CertificateEligibilityResult> {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        attendances: true,
        submissions: true,
        invoices: true,
        cohort: {
          include: {
            assignments: true,
            program: true,
          },
        },
      },
    });

    if (!student || !student.cohort) {
      return {
        isEligible: false,
        attendanceRate: 0,
        assignmentsCompletedPercent: 0,
        assessmentsPassed: false,
        outstandingBalance: 0,
        reasons: ['Student profile or assigned cohort not found.'],
      };
    }

    const reasons: string[] = [];

    // 1. Calculate Attendance
    const totalSessions = student.attendances.length;
    const presentSessions = student.attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.EXCUSED
    ).length;
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 100;

    if (attendanceRate < 75) {
      reasons.push(`Attendance requirement not met: ${attendanceRate.toFixed(1)}% (minimum 75% required).`);
    }

    // 2. Calculate Assignment Completion
    const totalAssignments = student.cohort.assignments.length;
    const submittedCount = student.submissions.filter((s) => s.grade !== null && s.grade >= 50).length;
    const assignmentsCompletedPercent = totalAssignments > 0 ? (submittedCount / totalAssignments) * 100 : 100;

    if (assignmentsCompletedPercent < 80) {
      reasons.push(`Assignment submission requirement not met: ${assignmentsCompletedPercent.toFixed(1)}% (minimum 80% passing submissions required).`);
    }

    // 3. Outstanding Tuition Check
    const unpaidInvoices = student.invoices.filter((inv) => inv.status !== 'PAID');
    const outstandingBalance = unpaidInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);

    if (outstandingBalance > 0) {
      reasons.push(`Outstanding financial balance of ₦${outstandingBalance.toLocaleString()} must be settled prior to certificate issuance.`);
    }

    const isEligible = reasons.length === 0;

    return {
      isEligible,
      attendanceRate,
      assignmentsCompletedPercent,
      assessmentsPassed: true,
      outstandingBalance,
      reasons,
      recommendedCertificateType: CertificateType.COMPLETION,
    };
  }

  /**
   * Deterministic Placement Evaluation Rules
   * Canonical delegation to PlacementService (Single Source of Truth)
   */
  static evaluateDiagnosticPlacement(scorePercentage: number, experienceYears: number = 0): {
    recommendedLevel: string;
    levelCode: string;
    rationale: string;
  } {
    const res = PlacementService.evaluatePlacementRecommendation(scorePercentage, { experienceYears });
    return {
      recommendedLevel: res.recommendedLevel,
      levelCode: res.levelCode,
      rationale: res.rationale,
    };
  }
}
