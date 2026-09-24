import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, ApplicationStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/jwt.js';

/**
 * Ensures Super Admin account is provisioned directly from .env variables
 */
export const ensureSuperAdminFromEnv = async (): Promise<void> => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const rawEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@stempact.org';
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD || (!isProd ? 'Admin@Dev2025!' : '');
    if (isProd && (!rawPassword || rawPassword === 'Admin@Dev2025!' || rawPassword.length < 12)) {
      throw new Error('FATAL SECURITY: In production, SUPER_ADMIN_PASSWORD must be explicitly provided and at least 12 characters.');
    }
    const rawUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const rawFirstName = process.env.SUPER_ADMIN_FIRSTNAME || 'Super';
    const rawLastName = process.env.SUPER_ADMIN_LASTNAME || 'Admin';

    // Strip any accidental wrapping quotes and trim
    const superEmail = rawEmail.replace(/["']/g, '').trim().toLowerCase();
    const superPassword = rawPassword.replace(/["']/g, '').trim();
    const superUsername = rawUsername.replace(/["']/g, '').trim().toLowerCase();
    const superFirstName = rawFirstName.replace(/["']/g, '').trim();
    const superLastName = rawLastName.replace(/["']/g, '').trim();

    console.log(`[BOOT] Ensuring Super Admin account for: ${superEmail} (username: ${superUsername})`);

    const existingSuper = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: superEmail, mode: 'insensitive' } },
          { username: { equals: superUsername, mode: 'insensitive' } },
          { role: Role.SUPER_ADMIN },
        ],
      },
    });

    const passwordHash = await bcrypt.hash(superPassword, 10);

    if (!existingSuper) {
      const created = await prisma.user.create({
        data: {
          email: superEmail,
          username: superUsername,
          passwordHash,
          firstName: superFirstName,
          lastName: superLastName,
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
      });
      console.log(`✔ [BOOT] Created Super Admin successfully: ${created.email} (ID: ${created.id})`);
    } else {
      const updated = await prisma.user.update({
        where: { id: existingSuper.id },
        data: {
          email: superEmail,
          username: superUsername,
          passwordHash,
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
      });
      console.log(`✔ [BOOT] Synchronized Super Admin credentials: ${updated.email} (ID: ${updated.id})`);
    }
  } catch (error: any) {
    console.error('❌ [BOOT ERROR] Failed to ensure Super Admin from .env:', error.message || error);
  }
};

/**
 * Register a new Student or Parent (with optional direct Course Enrollment)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      role,
      programId,
      cohortId,
      dateOfBirth,
      parentDetails,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ message: 'First name, last name, email, and password are required.' });
      return;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({ message: 'An account with this email address already exists.' });
      return;
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        res.status(400).json({ message: 'This username is already taken. Please choose another.' });
        return;
      }
    }

    const allowedRegistrationRoles = [Role.STUDENT, Role.PARENT];
    const userRole = role && allowedRegistrationRoles.includes(role) ? role : Role.STUDENT;

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedUsername = username || email.split('@')[0];

    const result = await prisma.$transaction(async (tx) => {
      let appRecord: any = null;

      const user = await tx.user.create({
        data: {
          email,
          username: assignedUsername,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: userRole,
        },
      });

      // If student profile
      if (userRole === Role.STUDENT) {
        const studentCount = await tx.studentProfile.count();
        const studentIdNumber = `STP-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`;
        
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            studentIdNumber,
            currentLevel: 'Foundation',
          },
        });

        // If enrolled directly for a program, generate an application record
        if (programId) {
          const appCount = await tx.application.count();
          const applicationNumber = `APP-${new Date().getFullYear()}-${String(appCount + 1).padStart(4, '0')}`;

          appRecord = await tx.application.create({
            data: {
              applicationNumber,
              userId: user.id,
              programId,
              cohortId: cohortId || null,
              preferredSchedule: 'Hybrid (Weekend & Evening)',
              fullName: `${firstName} ${lastName}`,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(Date.now() - 17 * 365 * 24 * 3600 * 1000),
              gender: 'Unspecified',
              phone: phone || '',
              email,
              address: 'Ile-Ife, Osun State',
              educationLevel: 'High School / Undergraduate',
              careerGoals: 'Practical STEM Mastery & Real-World Impact',
              learningObjectives: 'Hands-on Technical Excellence',
              statementOfPurpose: 'Enrolling directly via STEMPACT ACADEMY Admissions Portal.',
              status: ApplicationStatus.SUBMITTED,
              isMinor: parentDetails ? true : false,
              parentName: parentDetails?.name || null,
              parentRelationship: parentDetails?.relationship || null,
              parentPhone: parentDetails?.phone || null,
              parentEmail: parentDetails?.email || null,
              consentAccepted: true,
            },
          });
        }
      } else if (userRole === Role.PARENT) {
        await tx.parentProfile.create({
          data: {
            userId: user.id,
            relationship: parentDetails?.relationship || 'Parent/Guardian',
          },
        });
      }

      return { user, application: appRecord };
    });

    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      message: 'Account created and course enrolled successfully!',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone,
        role: result.user.role,
      },
      applicationId: result.application?.id || null,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Internal server error.' });
  }
};

/**
 * Universal & Persona-Gated Login (Supports Email OR Username)
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, email, username, password, portal } = req.body;
    const loginId = identifier || email || username;

    if (!loginId || !password) {
      res.status(400).json({ message: 'Email/Username and password are required.' });
      return;
    }

    // Find by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: loginId, mode: 'insensitive' } },
          { username: { equals: loginId, mode: 'insensitive' } },
        ],
      },
      include: {
        studentProfile: true,
        instructorProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials. User account not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'This account has been deactivated. Please contact STEMPACT administration.' });
      return;
    }

    // Optional portal gate role validation
    if (portal === 'admin') {
      const adminRoles: Role[] = [
        Role.SUPER_ADMIN,
        Role.COORDINATOR_ADMIN,
        Role.ACADEMIC_ADMIN,
        Role.FINANCE_ADMIN,
        Role.ADMISSIONS_ADMIN,
        Role.CONTENT_MANAGER,
        Role.MARKETING_MANAGER,
        Role.COUNSELOR,
        Role.INNOVATION_MANAGER,
        Role.PROGRAM_COORDINATOR,
      ];
      if (!adminRoles.includes(user.role)) {
        res.status(403).json({ message: 'Access denied. You must be an authorized Institutional Administrator to log in through the Staff Gateway.' });
        return;
      }
    } else if (portal === 'instructor') {
      if (user.role !== Role.INSTRUCTOR && user.role !== Role.SUPER_ADMIN) {
        res.status(403).json({ message: 'Access denied. This login is reserved for Academic Faculty and Instructors.' });
        return;
      }
    } else if (portal === 'student') {
      const studentRoles: Role[] = [Role.STUDENT, Role.PARENT, Role.APPLICANT, Role.PARTNER];
      if (!studentRoles.includes(user.role) && user.role !== Role.SUPER_ADMIN) {
        res.status(403).json({ message: 'Staff and Faculty accounts must sign in via their dedicated administrative portals at /admin/login.' });
        return;
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        studentProfile: user.studentProfile,
        instructorProfile: user.instructorProfile,
        parentProfile: user.parentProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Internal server error.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: {
          include: {
            cohort: {
              include: { program: true },
            },
          },
        },
        instructorProfile: true,
        parentProfile: {
          include: {
            students: {
              include: {
                user: true,
                cohort: { include: { program: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { passwordHash, ...userData } = user;
    res.status(200).json({ user: userData });
  } catch (error: any) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Failed to retrieve user profile' });
  }
};
