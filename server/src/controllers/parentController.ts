import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { academicDeliveryService } from '../services/academicDeliveryService.js';

export const getParentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: req.user.id },
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
              include: {
                program: { include: { school: true } },
                classSessions: {
                  take: 5,
                  orderBy: { date: 'asc' },
                },
              },
            },
            attendances: {
              include: { classSession: true },
              orderBy: { date: 'desc' },
              take: 10,
            },
            submissions: {
              where: { isLatest: true },
              include: { assignment: true },
              orderBy: { submittedAt: 'desc' },
              take: 5,
            },
            invoices: {
              include: { payments: true },
            },
            projectMembers: {
              include: { project: true },
            },
          },
        },
        guardianRelations: {
          include: {
            student: {
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
                  include: {
                    program: { include: { school: true } },
                    classSessions: {
                      take: 5,
                      orderBy: { date: 'asc' },
                    },
                  },
                },
                attendances: {
                  include: { classSession: true },
                  orderBy: { date: 'desc' },
                  take: 10,
                },
                submissions: {
                  where: { isLatest: true },
                  include: { assignment: true },
                  orderBy: { submittedAt: 'desc' },
                  take: 5,
                },
                invoices: {
                  include: { payments: true },
                },
                projectMembers: {
                  include: { project: true },
                },
              },
            },
          },
        },
      },
    });

    if (!parentProfile) {
      // Fallback: match by parentEmail
      const matchedApps = await prisma.application.findMany({
        where: { parentEmail: req.user.email },
        include: {
          admission: true,
          program: true,
          cohort: true,
        },
      });

      res.status(200).json({
        parent: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
        },
        wards: [],
        applications: matchedApps,
        message: 'No active enrolled students directly linked yet.',
      });
      return;
    }

    const announcements = await prisma.announcement.findMany({
      where: { targetAudience: { in: ['ALL', 'PARENTS'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Merge students from direct relationship and StudentGuardianRelation (gated by canAccessAcademicRecords)
    const studentMap = new Map<string, any>();
    parentProfile.students.forEach((s) => studentMap.set(s.id, s));
    parentProfile.guardianRelations.forEach((gr) => {
      if (gr.canAccessAcademicRecords && gr.student && !studentMap.has(gr.student.id)) {
        studentMap.set(gr.student.id, gr.student);
      }
    });

    const wardsList = Array.from(studentMap.values());
    const wardsSummary = await Promise.all(
      wardsList.map(async (student) => {
        let progress;
        try {
          progress = await academicDeliveryService.calculateStudentProgress(student.id);
        } catch {
          progress = {
            completionRate: student.completionRate || 0,
            attendanceRate: student.attendanceRate || 100,
            syllabusProgressPercentage: 0,
            totalLessons: 0,
            completedLessons: 0,
            totalAssignments: 0,
            completedAssignments: 0,
            averageAssignmentGrade: null,
            totalCompetencies: 0,
            achievedCompetencies: 0,
            totalProjects: student.projectMembers.length,
          };
        }

        return {
          studentId: student.id,
          studentIdNumber: student.studentIdNumber,
          fullName: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          currentLevel: student.currentLevel,
          cohort: student.cohort,
          program: student.cohort?.program,
          attendanceRate: progress.attendanceRate,
          completionRate: progress.completionRate,
          syllabusProgressPercentage: progress.syllabusProgressPercentage,
          completedLessonsCount: progress.completedLessons,
          totalLessonsCount: progress.totalLessons,
          attendances: student.attendances,
          recentAssignments: student.submissions,
          invoices: student.invoices,
          projects: student.projectMembers.map((pm: any) => pm.project),
        };
      })
    );

    res.status(200).json({
      parent: {
        id: parentProfile.id,
        relationship: parentProfile.relationship,
        emergencyContact: parentProfile.emergencyContact,
      },
      wards: wardsSummary,
      announcements,
    });
  } catch (error: any) {
    console.error('getParentDashboard error:', error);
    res.status(500).json({ message: 'Failed to load parent dashboard' });
  }
};

export const getWardAcademicRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { studentId } = req.params;

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!parentProfile) {
      res.status(404).json({ message: 'Parent profile not found.' });
      return;
    }

    // Verify guardian relationship and academic record authorization
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        cohort: { include: { program: true } },
      },
    });

    if (!student) {
      res.status(404).json({ message: 'Student not found.' });
      return;
    }

    const isDirectGuardian = student.guardianId === parentProfile.id;
    const guardianRelation = await prisma.studentGuardianRelation.findUnique({
      where: {
        studentId_parentId: {
          studentId,
          parentId: parentProfile.id,
        },
      },
    });

    const isAuthorized =
      (guardianRelation !== null && guardianRelation.canAccessAcademicRecords) ||
      (guardianRelation === null && isDirectGuardian);

    if (!isAuthorized) {
      res.status(403).json({
        message: 'Access denied: You are not authorized to view academic records for this ward.',
      });
      return;
    }

    const progress = await academicDeliveryService.calculateStudentProgress(studentId);
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: { studentId },
      include: { lesson: true },
      orderBy: { completedAt: 'desc' },
    });
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: { classSession: true },
      orderBy: { date: 'desc' },
    });
    const submissions = await prisma.submission.findMany({
      where: { studentId, isLatest: true },
      include: { assignment: true },
      orderBy: { submittedAt: 'desc' },
    });
    const competencies = await prisma.studentCompetency.findMany({
      where: { studentId },
      include: { competency: true },
    });
    const projects = await prisma.projectMember.findMany({
      where: { studentId },
      include: { project: true },
    });

    res.status(200).json({
      ward: {
        studentId: student.id,
        studentIdNumber: student.studentIdNumber,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        currentLevel: student.currentLevel,
        cohort: student.cohort,
      },
      academicRecords: {
        progress,
        lessonProgress,
        attendances,
        submissions,
        competencies,
        projects: projects.map((p) => p.project),
      },
    });
  } catch (error: any) {
    console.error('getWardAcademicRecords error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch ward academic records.' });
  }
};

export const registerWard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const {
      firstName,
      lastName,
      fullName,
      email,
      username,
      password,
      phone,
      dateOfBirth,
      gender,
      programId,
      cohortId,
      preferredCenterId,
      educationLevel,
      address,
      state,
      country,
      relationship,
    } = req.body;

    const resolvedFullName = (fullName || `${firstName || ''} ${lastName || ''}`).trim();
    if (!resolvedFullName || !programId) {
      res.status(400).json({ message: 'Ward full name and programId are required.' });
      return;
    }

    const nameParts = resolvedFullName.split(' ');
    const fName = firstName || nameParts[0] || 'Learner';
    const lName = lastName || nameParts.slice(1).join(' ') || 'Ward';

    // Ensure parent profile exists
    let parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!parentProfile) {
      parentProfile = await prisma.parentProfile.create({
        data: {
          userId: req.user.id,
          relationship: relationship || 'PARENT',
          emergencyContact: phone || (req.user as any)?.phone || '',
        },
      });
    }

    // Determine unique Ward Email & Username
    const cleanFirst = fName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Date.now().toString().slice(-4);

    const wardEmail = email?.trim() || `${cleanFirst}.${cleanLast}.${randomSuffix}@ward.stempact.org`;
    const wardUsername = username?.trim().toLowerCase() || `${cleanFirst}.${cleanLast}${randomSuffix}`;

    // Provision or attach User account for the child
    let wardUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: wardEmail },
          { username: wardUsername },
        ],
      },
    });

    if (!wardUser) {
      const defaultPassword = password?.trim() || 'StempactWard@2026';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      wardUser = await prisma.user.create({
        data: {
          email: wardEmail,
          username: wardUsername,
          passwordHash,
          firstName: fName,
          lastName: lName,
          phone: phone || (req.user as any)?.phone || '',
          role: 'STUDENT',
          isActive: true,
        },
      });
    }

    // Generate unique application number
    const year = new Date().getFullYear();
    const count = await prisma.application.count();
    const applicationNumber = `APP-${year}-${String(count + 1).padStart(5, '0')}`;

    const application = await prisma.application.create({
      data: {
        applicationNumber,
        userId: wardUser.id,
        programId,
        cohortId: cohortId || null,
        preferredCenterId: preferredCenterId || null,
        preferredSchedule: 'Flexible / Center Scheduled',
        fullName: resolvedFullName,
        email: wardEmail,
        phone: phone || (req.user as any)?.phone || '08000000000',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2010-01-01'),
        gender: gender || 'OTHER',
        address: address || 'Ile-Ife, Osun State',
        educationLevel: educationLevel || 'Secondary / High School',
        careerGoals: 'Develop practical engineering and STEM competencies',
        learningObjectives: 'Hands-on practical curriculum mastery',
        statementOfPurpose: 'Registered by parent/guardian for structured STEM education.',
        isMinor: true,
        parentName: `${req.user.firstName} ${req.user.lastName}`,
        parentEmail: req.user.email,
        parentPhone: phone || (req.user as any)?.phone || '08000000000',
        parentRelationship: relationship || parentProfile.relationship || 'Parent',
        status: 'SUBMITTED',
      },
    });

    res.status(201).json({
      message: 'Ward registration submitted and student account provisioned successfully.',
      application,
      wardAccount: {
        id: wardUser.id,
        username: wardUser.username,
        email: wardUser.email,
        fullName: resolvedFullName,
      },
    });
  } catch (error: any) {
    console.error('registerWard error:', error);
    res.status(500).json({ message: error.message || 'Failed to register ward.' });
  }
};

