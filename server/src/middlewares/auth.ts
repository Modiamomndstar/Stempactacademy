import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, UserStatus } from '@prisma/client';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stempact_academy_super_secret_jwt_key_2025';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
    firstName: string;
    lastName: string;
  };
  studentProfile?: any;
  parentProfile?: any;
  instructorProfile?: any;
  coordinatorProfile?: any;
  partnerProfile?: any;
}

// Default role-to-permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ACADEMIC_ADMIN: [
    'programs.view', 'programs.create', 'programs.edit', 'programs.publish',
    'courses.manage', 'content.publish',
    'cohorts.manage', 'cohorts.assign',
    'applications.view', 'assessments.manage', 'assessments.review',
    'placements.review', 'placements.approve',
    'certificates.issue', 'competencies.verify',
  ],
  FINANCE_ADMIN: [
    'programs.view', 'cohorts.view', 'applications.view',
    'payments.view', 'payments.verify', 'payments.fees', 'payments.refund',
  ],
  ADMISSIONS_ADMIN: [
    'programs.view', 'cohorts.view', 'users.view',
    'applications.view', 'applications.review', 'applications.interview',
    'assessments.review', 'admissions.issue', 'admissions.activate',
  ],
  PROGRAM_COORDINATOR: [
    'programs.view', 'programs.edit', 'cohorts.manage',
    'attendance.view', 'classes.view', 'reports.view',
  ],
  COORDINATOR_ADMIN: [
    'programs.view', 'programs.edit', 'cohorts.manage',
    'attendance.view', 'classes.view', 'reports.view',
  ],
  INSTRUCTOR: [
    'programs.view', 'courses.view', 'content.publish',
    'classes.conduct', 'attendance.mark',
    'assignments.create', 'grades.manage', 'competencies.verify',
  ],
  STUDENT: [
    'programs.view', 'courses.view', 'classes.view',
    'assignments.submit', 'grades.view', 'payments.submit',
  ],
  PARENT: [
    'programs.view', 'wards.view', 'attendance.view',
    'grades.view', 'payments.submit',
  ],
  COUNSELOR: [
    'students.view', 'attendance.view', 'grades.view',
    'counseling.manage',
  ],
  CONTENT_MANAGER: [
    'programs.view', 'courses.manage', 'content.publish',
    'assessments.manage',
  ],
  INNOVATION_MANAGER: [
    'programs.view', 'competitions.manage', 'projects.view',
  ],
  MARKETING_MANAGER: [
    'programs.view', 'marketing.manage', 'events.manage', 'blog.manage',
  ],
  PARTNER: [
    'programs.view', 'sponsored.view', 'reports.view',
  ],
  APPLICANT: [
    'applications.self', 'assessments.take', 'admissions.accept', 'payments.submit',
  ],
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. Missing token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || user.status === UserStatus.DEACTIVATED || user.status === UserStatus.SUSPENDED) {
      res.status(401).json({ message: 'User account not found, deactivated, or suspended.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Please login.' });
      return;
    }

    // SUPER_ADMIN has omnipotent permission across all operations
    if (req.user.role === Role.SUPER_ADMIN || allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`,
    });
    return;
  };
};

export const hasPermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Please login.' });
      return;
    }

    // SUPER_ADMIN has omnipotent access
    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    const rolePerms = ROLE_PERMISSIONS[req.user.role] || [];
    if (rolePerms.includes('*') || rolePerms.includes(permission)) {
      return next();
    }

    // Check database role permission overrides
    const dbPerm = await prisma.rolePermission.findUnique({
      where: {
        role_permission: {
          role: req.user.role,
          permission,
        },
      },
    });

    if (dbPerm) {
      return next();
    }

    res.status(403).json({
      message: `Forbidden: Missing required permission [${permission}].`,
    });
  };
};

// Profile Ownership / Context Loaders
export const requireStudentProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: req.user.id },
    include: { cohort: true },
  });

  if (!profile && req.user.role !== Role.SUPER_ADMIN) {
    res.status(404).json({ message: 'Student profile not found.' });
    return;
  }

  req.studentProfile = profile;
  next();
};

export const requireParentProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const profile = await prisma.parentProfile.findUnique({
    where: { userId: req.user.id },
    include: { students: { include: { cohort: true, user: true } } },
  });

  if (!profile && req.user.role !== Role.SUPER_ADMIN) {
    res.status(404).json({ message: 'Parent profile not found.' });
    return;
  }

  req.parentProfile = profile;
  next();
};

export const requirePartnerProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: req.user.id },
    include: {
      sponsoredStudents: {
        include: {
          student: {
            include: { user: true, cohort: true },
          },
        },
      },
    },
  });

  if (!profile && req.user.role !== Role.SUPER_ADMIN) {
    res.status(404).json({ message: 'Partner profile not found.' });
    return;
  }

  req.partnerProfile = profile;
  next();
};

export const requireCoordinatorProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const profile = await prisma.coordinatorProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!profile && req.user.role !== Role.SUPER_ADMIN) {
    res.status(404).json({ message: 'Coordinator profile not found.' });
    return;
  }

  req.coordinatorProfile = profile;
  next();
};
