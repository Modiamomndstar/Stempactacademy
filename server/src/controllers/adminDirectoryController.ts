import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { Role } from '@prisma/client';

export const getDirectoryStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // 1. Core User Counts
    const [
      totalUsers,
      totalStudents,
      totalApplicants,
      totalParents,
      totalInstructors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.APPLICANT } }),
      prisma.user.count({ where: { role: Role.PARENT } }),
      prisma.user.count({ where: { role: Role.INSTRUCTOR } }),
    ]);

    // 2. Activity & Login Frequency Metrics from AuditLogs
    // Note: To avoid PostgreSQL 42P10 "SELECT DISTINCT ON expressions must match initial ORDER BY expressions"
    // error on Render, we select userId directly and compute unique counts in-memory.
    const [
      dailyLoginsRaw,
      weeklyLoginsRaw,
      monthlyLoginsRaw,
      yearlyLoginsRaw,
      currentlyOnlineRaw,
    ] = await Promise.all([
      prisma.auditLog.findMany({
        where: { action: 'USER_LOGIN', createdAt: { gte: oneDayAgo } },
        select: { userId: true },
      }),
      prisma.auditLog.findMany({
        where: { action: 'USER_LOGIN', createdAt: { gte: oneWeekAgo } },
        select: { userId: true },
      }),
      prisma.auditLog.findMany({
        where: { action: 'USER_LOGIN', createdAt: { gte: oneMonthAgo } },
        select: { userId: true },
      }),
      prisma.auditLog.findMany({
        where: { action: 'USER_LOGIN', createdAt: { gte: oneYearAgo } },
        select: { userId: true },
      }),
      prisma.auditLog.findMany({
        where: { action: 'USER_LOGIN', createdAt: { gte: thirtyMinutesAgo } },
        select: { userId: true },
      }),
    ]);

    const countUniqueUsers = (logs: { userId: string | null }[]) =>
      new Set(logs.map((l) => l.userId).filter(Boolean)).size;

    const dailyLoginsCount = countUniqueUsers(dailyLoginsRaw);
    const weeklyLoginsCount = countUniqueUsers(weeklyLoginsRaw);
    const monthlyLoginsCount = countUniqueUsers(monthlyLoginsRaw);
    const yearlyLoginsCount = countUniqueUsers(yearlyLoginsRaw);
    const currentlyOnlineCount = countUniqueUsers(currentlyOnlineRaw);

    // 3. Cohort Enrollment Distribution
    const activeCohortStatuses: any = ['OPEN', 'ALMOST_FULL', 'IN_PROGRESS'];
    const pastCohortStatuses: any = ['COMPLETED', 'ARCHIVED'];

    const [
      activeCohorts,
      studentsInActiveCohortsCount,
      studentsInPastCohortsCount,
      pastCohortsCount,
    ] = await Promise.all([
      prisma.cohort.findMany({
        where: { status: { in: activeCohortStatuses } },
        include: {
          program: { select: { name: true, code: true } },
          studentProfiles: {
            include: {
              invoices: {
                select: {
                  totalAmount: true,
                  amountPaid: true,
                  balance: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.studentProfile.count({
        where: {
          cohort: { status: { in: activeCohortStatuses } },
        },
      }),
      prisma.studentProfile.count({
        where: {
          cohort: { status: { in: pastCohortStatuses } },
        },
      }),
      prisma.cohort.count({
        where: { status: { in: pastCohortStatuses } },
      }),
    ]);

    // 4. Financial Statistics for Active Cohort Students
    let fullyPaidActiveStudents = 0;
    let partiallyPaidActiveStudents = 0;
    let unpaidActiveStudents = 0;
    let activeTuitionCollected = 0;
    let activeTuitionOutstanding = 0;

    const cohortSummaries = activeCohorts.map((cohort: any) => {
      let cohortPaid = 0;
      let cohortPartial = 0;
      let cohortUnpaid = 0;
      let cohortCollected = 0;
      let cohortOutstanding = 0;

      cohort.studentProfiles.forEach((student: any) => {
        const totalBilled = (student.invoices || []).reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
        const totalPaid = (student.invoices || []).reduce((sum: number, inv: any) => sum + (inv.amountPaid || 0), 0);
        const balance = totalBilled > 0 ? Math.max(0, totalBilled - totalPaid) : (cohort.trainingFee || 0);

        cohortCollected += totalPaid;
        cohortOutstanding += balance;

        if (totalBilled > 0 && totalPaid >= totalBilled) {
          cohortPaid++;
          fullyPaidActiveStudents++;
        } else if (totalPaid > 0 && totalPaid < totalBilled) {
          cohortPartial++;
          partiallyPaidActiveStudents++;
        } else {
          cohortUnpaid++;
          unpaidActiveStudents++;
        }
      });

      activeTuitionCollected += cohortCollected;
      activeTuitionOutstanding += cohortOutstanding;

      return {
        cohortId: cohort.id,
        cohortCode: cohort.cohortCode,
        cohortName: cohort.name,
        programName: cohort.program?.name || 'Program',
        level: cohort.level,
        status: cohort.status,
        totalEnrolled: cohort.studentProfiles.length,
        fullyPaidCount: cohortPaid,
        partiallyPaidCount: cohortPartial,
        unpaidCount: cohortUnpaid,
        tuitionCollected: cohortCollected,
        tuitionOutstanding: cohortOutstanding,
      };
    });

    // 5. Total Invoicing All-time
    const invoiceAgg = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
        amountPaid: true,
        balance: true,
      },
    });

    res.status(200).json({
      summary: {
        totalUsers,
        totalStudents,
        totalApplicants,
        totalParents,
        totalInstructors,
      },
      overview: {
        totalUsers,
        totalStudents,
        totalApplicants,
        totalParents,
        totalInstructors,
      },
      loginMetrics: {
        daily: dailyLoginsCount,
        weekly: weeklyLoginsCount,
        monthly: monthlyLoginsCount,
        yearly: yearlyLoginsCount,
        currentlyOnline: currentlyOnlineCount,
      },
      logins: {
        daily: dailyLoginsCount,
        weekly: weeklyLoginsCount,
        monthly: monthlyLoginsCount,
        yearly: yearlyLoginsCount,
        currentlyOnline: currentlyOnlineCount,
      },
      cohortEnrollment: {
        activeStudents: studentsInActiveCohortsCount,
        pastStudents: studentsInPastCohortsCount,
        totalEnrolled: studentsInActiveCohortsCount + studentsInPastCohortsCount,
        activeCohortsCount: activeCohorts.length,
        pastCohortsCount,
      },
      cohortDistribution: {
        studentsInActiveCohorts: studentsInActiveCohortsCount,
        studentsInPastCohorts: studentsInPastCohortsCount,
        totalEnrolledAllTime: studentsInActiveCohortsCount + studentsInPastCohortsCount,
        activeCohortsCount: activeCohorts.length,
        pastCohortsCount,
      },
      paymentBreakdown: {
        fullyPaid: fullyPaidActiveStudents,
        partiallyPaid: partiallyPaidActiveStudents,
        unpaid: unpaidActiveStudents,
        totalCollected: activeTuitionCollected,
        totalOutstanding: activeTuitionOutstanding,
        fullyPaidActiveStudents,
        partiallyPaidActiveStudents,
        unpaidActiveStudents,
        activeTuitionCollected,
        activeTuitionOutstanding,
        allTimeBilled: invoiceAgg._sum.totalAmount || 0,
        allTimePaid: invoiceAgg._sum.amountPaid || 0,
        allTimeBalance: invoiceAgg._sum.balance || 0,
      },
      activeCohorts: cohortSummaries.map((c: any) => ({
        id: c.cohortId,
        name: c.cohortName,
        cohortCode: c.cohortCode,
        programName: c.programName,
        enrolledCount: c.totalEnrolled,
      })),
      cohortSummaries,
    });
  } catch (error: any) {
    console.error('getDirectoryStats error:', error);
    res.status(500).json({ message: 'Failed to compute directory statistics' });
  }
};

export const getDirectoryUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      role,
      search,
      cohortId,
      paymentStatus,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    // Filter by Role
    if (role && role !== 'ALL') {
      where.role = role as Role;
    }

    // Filter by Search Query
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        {
          studentProfile: {
            studentIdNumber: { contains: q, mode: 'insensitive' },
          },
        },
      ];
    }

    // Filter by Cohort
    if (cohortId && cohortId !== 'ALL') {
      where.studentProfile = {
        currentCohortId: cohortId,
      };
    }

    const [usersRaw, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          studentProfile: {
            include: {
              cohort: {
                include: {
                  program: { select: { name: true, code: true } },
                  learningCenter: { select: { name: true, cityOrTown: true } },
                },
              },
              invoices: {
                select: {
                  id: true,
                  totalAmount: true,
                  amountPaid: true,
                  balance: true,
                  status: true,
                },
              },
              guardianRelations: {
                include: {
                  parent: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true,
                          phone: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          parentProfile: {
            include: {
              students: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                    },
                  },
                  cohort: {
                    select: {
                      id: true,
                      name: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
          applications: {
            select: {
              id: true,
              applicationNumber: true,
              status: true,
              createdAt: true,
              program: { select: { name: true } },
              cohort: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          auditLogs: {
            where: { action: 'USER_LOGIN' },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    // Format and enrich user list
    const enrichedUsers = (usersRaw as any[]).map((u: any) => {
      let financialStatus = 'NO_INVOICE';
      let totalBilled = 0;
      let totalPaid = 0;
      let balance = 0;

      if (u.studentProfile && u.studentProfile.invoices?.length > 0) {
        totalBilled = u.studentProfile.invoices.reduce((acc: number, inv: any) => acc + inv.totalAmount, 0);
        totalPaid = u.studentProfile.invoices.reduce((acc: number, inv: any) => acc + inv.amountPaid, 0);
        balance = totalBilled - totalPaid;

        if (totalBilled > 0 && totalPaid >= totalBilled) {
          financialStatus = 'FULLY_PAID';
        } else if (totalPaid > 0) {
          financialStatus = 'PARTIALLY_PAID';
        } else {
          financialStatus = 'UNPAID';
        }
      }

      const lastLogin = u.auditLogs?.[0]?.createdAt || null;

      // Extract linked wards
      const linkedWards = u.parentProfile?.students?.map((st: any) => ({
        id: st.id,
        name: `${st.user?.firstName} ${st.user?.lastName}`,
        email: st.user?.email,
        phone: st.user?.phone,
        cohort: st.cohort?.name,
        level: st.currentLevel,
      })) || [];

      // Extract linked guardians
      const linkedGuardians = u.studentProfile?.guardianRelations?.map((gr: any) => ({
        id: gr.parent?.id,
        name: `${gr.parent?.user?.firstName} ${gr.parent?.user?.lastName}`,
        email: gr.parent?.user?.email,
        phone: gr.parent?.user?.phone,
        relation: gr.relationType || 'Guardian',
      })) || [];

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLogin,
        financialStatus,
        financialSummary: {
          totalBilled,
          totalPaid,
          balance: Math.max(0, balance),
        },
        studentProfile: u.studentProfile
          ? {
              id: u.studentProfile.id,
              studentIdNumber: u.studentProfile.studentIdNumber,
              currentLevel: u.studentProfile.currentLevel,
              attendanceRate: u.studentProfile.attendanceRate,
              completionRate: u.studentProfile.completionRate,
              cohort: u.studentProfile.cohort,
            }
          : null,
        parentProfile: u.parentProfile
          ? {
              id: u.parentProfile.id,
              relationship: u.parentProfile.relationship,
              emergencyContact: u.parentProfile.emergencyContact,
              wards: linkedWards,
            }
          : null,
        linkedGuardians,
        latestApplication: u.applications?.[0] || null,
      };
    });

    let finalUsers = enrichedUsers;
    if (paymentStatus && paymentStatus !== 'ALL') {
      finalUsers = enrichedUsers.filter((u: any) => u.financialStatus === paymentStatus);
    }

    res.status(200).json({
      users: finalUsers,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error: any) {
    console.error('getDirectoryUsers error:', error);
    res.status(500).json({ message: 'Failed to retrieve directory users' });
  }
};

export const getUserProfile360 = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Search user either by user.id or studentProfile.id
    const userRaw = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { studentProfile: { id } }],
      },
      include: {
        studentProfile: {
          include: {
            cohort: {
              include: {
                program: { include: { school: true } },
                learningCenter: true,
              },
            },
            enrollments: {
              include: {
                cohort: {
                  include: { program: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            invoices: {
              include: {
                payments: { orderBy: { paidAt: 'desc' } },
              },
              orderBy: { createdAt: 'desc' },
            },
            submissions: {
              include: {
                assignment: true,
              },
              orderBy: { submittedAt: 'desc' },
            },
            attendances: {
              include: {
                classSession: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            competencies: {
              include: {
                competency: true,
              },
            },
            certificates: {
              orderBy: { createdAt: 'desc' },
            },
            guardianRelations: {
              include: {
                parent: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            lessonProgress: {
              include: {
                lesson: {
                  include: {
                    module: true,
                  },
                },
              },
            },
            projectMembers: {
              include: {
                project: true,
              },
            },
            financialClearances: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        parentProfile: {
          include: {
            students: {
              include: {
                user: true,
                cohort: { include: { program: true } },
                invoices: true,
              },
            },
          },
        },
        instructorProfile: {
          include: {
            cohortAssignments: {
              include: { cohort: { include: { program: true } } },
            },
            classSessions: {
              orderBy: { date: 'desc' },
              take: 10,
            },
          },
        },
        applications: {
          include: {
            program: true,
            cohort: true,
            placement: true,
            admission: true,
            assessmentAttempts: {
              orderBy: { completedAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          where: { action: 'USER_LOGIN' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!userRaw) {
      res.status(404).json({ message: 'User record not found.' });
      return;
    }

    const user = userRaw as any;

    // Compute student academic metrics
    let academicSummary: any = null;
    let financialSummary: any = null;

    if (user.studentProfile) {
      const sp = user.studentProfile;
      const totalAssignments = sp.submissions?.length || 0;
      const gradedAssignments = sp.submissions?.filter((s: any) => s.grade !== null) || [];
      const avgGrade =
        gradedAssignments.length > 0
          ? gradedAssignments.reduce((acc: number, s: any) => acc + (s.grade || 0), 0) / gradedAssignments.length
          : null;

      const totalLessonsCompleted = sp.lessonProgress?.filter((lp: any) => lp.status === 'COMPLETED').length || 0;

      academicSummary = {
        studentIdNumber: sp.studentIdNumber,
        currentCohort: sp.cohort,
        currentLevel: sp.currentLevel,
        enrollmentDate: sp.enrollmentDate,
        attendanceRate: sp.attendanceRate,
        completionRate: sp.completionRate,
        totalLessonsCompleted,
        totalAssignmentsSubmitted: totalAssignments,
        averageGrade: avgGrade ? Math.round(avgGrade * 10) / 10 : null,
        totalCertificatesEarned: sp.certificates?.length || 0,
        competenciesAcquired: sp.competencies?.filter((c: any) => c.status === 'ACQUIRED').length || 0,
        capstoneProjectsCount: sp.projectMembers?.length || 0,
      };

      // Financial Ledger
      const totalBilled = sp.invoices?.reduce((acc: number, inv: any) => acc + (inv.totalAmount || 0), 0) || 0;
      const totalPaid = sp.invoices?.reduce((acc: number, inv: any) => acc + (inv.amountPaid || 0), 0) || 0;
      const balance = Math.max(0, totalBilled - totalPaid);

      financialSummary = {
        totalInvoiced: totalBilled,
        totalPaid,
        balanceDue: balance,
        paymentStatus:
          totalBilled === 0
            ? 'NO_INVOICE'
            : totalPaid >= totalBilled
            ? 'FULLY_PAID'
            : totalPaid > 0
            ? 'PARTIALLY_PAID'
            : 'UNPAID',
        invoices: sp.invoices || [],
        clearances: sp.financialClearances || [],
      };
    }

    // Extract guardian
    let guardian: any = null;
    if (user.studentProfile?.guardianRelations?.length) {
      const gr = user.studentProfile.guardianRelations[0];
      guardian = {
        name: `${gr.parent?.user?.firstName || ''} ${gr.parent?.user?.lastName || ''}`.trim() || 'Parent',
        phone: gr.parent?.user?.phone || null,
        email: gr.parent?.user?.email || null,
        relationship: gr.relationType || gr.parent?.relationship || 'Guardian',
      };
    } else if (user.applications?.[0]?.parentDetails) {
      try {
        const pd = typeof user.applications[0].parentDetails === 'string'
          ? JSON.parse(user.applications[0].parentDetails)
          : user.applications[0].parentDetails;
        guardian = {
          name: pd.name || `${pd.firstName || ''} ${pd.lastName || ''}`.trim(),
          phone: pd.phone,
          email: pd.email,
          relationship: pd.relationship || 'Parent',
        };
      } catch (e) {}
    }

    // Extract payments across invoices
    const allInvoices = user.studentProfile?.invoices || [];
    const allPayments: any[] = [];
    allInvoices.forEach((inv: any) => {
      (inv.payments || []).forEach((pmt: any) => {
        allPayments.push({
          id: pmt.id,
          reference: pmt.paymentReference || pmt.id,
          amount: pmt.amount,
          channel: pmt.channel,
          paidAt: pmt.paidAt,
          receiptUrl: pmt.receiptUrl || pmt.proofUrl,
        });
      });
    });

    // Extract attendance metrics
    const attList = user.studentProfile?.attendances || [];
    const presentCount = attList.filter((a: any) => a.status === 'PRESENT').length;
    const lateCount = attList.filter((a: any) => a.status === 'LATE').length;
    const absentCount = attList.filter((a: any) => a.status === 'ABSENT').length;
    const totalAtt = attList.length;
    const attendanceRate = totalAtt > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalAtt) * 100) : 100;

    // Extract lesson progress
    const lpList = user.studentProfile?.lessonProgress || [];
    const completedLessons = lpList.filter((lp: any) => lp.status === 'COMPLETED').length;
    const inProgressLessons = lpList.filter((lp: any) => lp.status === 'IN_PROGRESS').length;
    const totalMinutes = lpList.reduce((acc: number, lp: any) => acc + (lp.timeSpentMinutes || 0), 0);

    // Extract enrollments
    const enrollmentsList = (user.studentProfile?.enrollments && user.studentProfile.enrollments.length > 0)
      ? user.studentProfile.enrollments
      : user.studentProfile?.cohort
      ? [{
          id: 'primary-cohort',
          cohort: user.studentProfile.cohort,
          status: 'ACTIVE',
          createdAt: user.studentProfile.enrollmentDate,
        }]
      : [];

    // Extract projects
    const projectsList = (user.studentProfile?.projectMembers || []).map((pm: any) => pm.project).filter(Boolean);

    const fullProfile = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      studentProfile: user.studentProfile
        ? {
            id: user.studentProfile.id,
            studentId: user.studentProfile.studentIdNumber,
            studentIdNumber: user.studentProfile.studentIdNumber,
            currentLevel: user.studentProfile.currentLevel,
            attendanceRate: user.studentProfile.attendanceRate,
            completionRate: user.studentProfile.completionRate,
            cohort: user.studentProfile.cohort,
            dob: user.applications?.[0]?.dateOfBirth || null,
            gender: user.applications?.[0]?.gender || null,
            address: user.applications?.[0]?.address || null,
          }
        : null,
      parentProfile: user.parentProfile,
      guardian,
      enrollments: enrollmentsList,
      financialSummary: financialSummary || {
        totalInvoiced: 0,
        totalPaid: 0,
        balanceDue: 0,
        paymentStatus: 'UNPAID',
      },
      invoices: allInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        description: inv.title || 'Tuition Invoice',
        amount: inv.totalAmount,
        dueDate: inv.dueDate,
        status: inv.status,
      })),
      payments: allPayments,
      clearances: user.studentProfile?.financialClearances || [],
      assignmentSubmissions: user.studentProfile?.submissions || [],
      projects: projectsList,
      certificates: user.studentProfile?.certificates || [],
      attendance: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        total: totalAtt,
        rate: attendanceRate,
      },
      lessonProgress: {
        completedCount: completedLessons,
        inProgressCount: inProgressLessons,
        totalMinutesSpent: totalMinutes,
      },
      recentActivity: user.auditLogs || [],
    };

    res.status(200).json({
      profile: fullProfile,
      user: fullProfile.user,
      academicSummary,
      financialSummary,
      applications: user.applications || [],
      studentProfile: user.studentProfile,
      parentProfile: user.parentProfile,
      instructorProfile: user.instructorProfile,
    });
  } catch (error: any) {
    console.error('getUserProfile360 error:', error);
    res.status(500).json({ message: 'Failed to retrieve 360 degree user profile' });
  }
};

/**
 * Transfer / Switch a Student to a Different Class Section or Cohort.
 * Preserves all grades, invoices, and attendance while atomically updating
 * currentCohortId, StudentCohortEnrollment, recalculating seat counts,
 * and creating an AuditLog entry.
 */
export const transferStudentSection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // studentProfile id or user id
    const { targetCohortId, reason } = req.body;

    if (!targetCohortId) {
      res.status(400).json({ message: 'Target cohort ID is required.' });
      return;
    }

    // 1. Resolve student profile
    const student = await prisma.studentProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: true,
        cohort: true,
      },
    });

    if (!student) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }

    const sourceCohortId = student.currentCohortId;

    if (sourceCohortId === targetCohortId) {
      res.status(400).json({ message: 'Student is already enrolled in this class section.' });
      return;
    }

    // 2. Fetch target cohort and verify capacity
    const targetCohort = await prisma.cohort.findUnique({
      where: { id: targetCohortId },
      include: {
        program: true,
        enrollments: { where: { status: { in: ['ENROLLED', 'ACTIVE'] } } },
      },
    });

    if (!targetCohort) {
      res.status(404).json({ message: 'Target cohort / class section not found.' });
      return;
    }

    const targetActiveCount = targetCohort.enrollments.length;
    if (targetActiveCount >= targetCohort.maxCapacity) {
      res.status(400).json({
        message: `Target section "${targetCohort.name}" is already at full capacity (${targetActiveCount}/${targetCohort.maxCapacity}). Please expand the section max capacity first.`,
      });
      return;
    }

    // 3. Perform atomic transfer
    await prisma.$transaction(async (tx) => {
      // a. Mark old enrollment as WITHDRAWN (with reason transfer) if exists
      if (sourceCohortId) {
        await tx.studentCohortEnrollment.updateMany({
          where: {
            studentId: student.id,
            cohortId: sourceCohortId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
          },
          data: {
            status: 'WITHDRAWN',
            withdrawalReason: `Transferred to ${targetCohort.name}. Reason: ${reason || 'Administrative adjustment'}`,
            withdrawnAt: new Date(),
            notes: `Transferred to ${targetCohort.name} by admin (${req.user?.firstName || 'Admin'}). Reason: ${reason || 'Administrative adjustment'}`,
          },
        });

        // Recalculate source cohort enrollment count
        const sourceActiveCount = await tx.studentCohortEnrollment.count({
          where: {
            cohortId: sourceCohortId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
          },
        });
        const sourceCohortRecord = await tx.cohort.findUnique({ where: { id: sourceCohortId } });
        const sourceCap = sourceCohortRecord?.maxCapacity || 25;
        await tx.cohort.update({
          where: { id: sourceCohortId },
          data: {
            currentEnrollment: sourceActiveCount,
            status: sourceActiveCount >= sourceCap ? 'FULL' : 'OPEN',
          },
        });
      }

      // b. Upsert new enrollment in target cohort
      await tx.studentCohortEnrollment.upsert({
        where: {
          studentId_cohortId: {
            studentId: student.id,
            cohortId: targetCohortId,
          },
        },
        create: {
          studentId: student.id,
          cohortId: targetCohortId,
          programId: targetCohort.programId,
          curriculumVersionId: targetCohort.curriculumVersionId,
          academicSessionId: targetCohort.academicSessionId,
          enrolledById: req.user?.id,
          status: 'ENROLLED',
          notes: `Transferred from ${student.cohort?.name || 'Previous Section'}. Reason: ${reason || 'Administrative adjustment'}`,
        },
        update: {
          status: 'ENROLLED',
          withdrawalReason: null,
          withdrawnAt: null,
          notes: `Re-enrolled/Transferred from ${student.cohort?.name || 'Previous Section'}. Reason: ${reason || 'Administrative adjustment'}`,
        },
      });

      // c. Update studentProfile currentCohortId
      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          currentCohortId: targetCohortId,
          currentLevel: targetCohort.level,
        },
      });

      // d. Recalculate target cohort enrollment count
      const newTargetActiveCount = await tx.studentCohortEnrollment.count({
        where: {
          cohortId: targetCohortId,
          status: { in: ['ENROLLED', 'ACTIVE'] },
        },
      });

      const updatedStatus =
        newTargetActiveCount >= targetCohort.maxCapacity
          ? 'FULL'
          : targetCohort.maxCapacity - newTargetActiveCount <= 3
          ? 'ALMOST_FULL'
          : 'OPEN';

      await tx.cohort.update({
        where: { id: targetCohortId },
        data: {
          currentEnrollment: newTargetActiveCount,
          status: updatedStatus,
        },
      });

      // e. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
          userRole: req.user?.role || 'SUPER_ADMIN',
          action: 'STUDENT_SECTION_TRANSFER',
          resource: 'StudentProfile',
          resourceId: student.id,
          previousValue: JSON.stringify({
            cohortId: student.cohort?.id || null,
            cohortName: student.cohort?.name || null,
          }),
          newValue: JSON.stringify({
            cohortId: targetCohort.id,
            cohortName: targetCohort.name,
            reason: reason || 'Administrative adjustment',
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            studentIdNumber: student.studentIdNumber,
          }),
        },
      });
    });

    res.status(200).json({
      message: `Student successfully transferred to ${targetCohort.name}.`,
      targetCohort: {
        id: targetCohort.id,
        name: targetCohort.name,
      },
    });
  } catch (error: any) {
    console.error('transferStudentSection error:', error);
    res.status(500).json({ message: 'Failed to transfer student section.' });
  }
};

