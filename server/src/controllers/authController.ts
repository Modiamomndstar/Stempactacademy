import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, ApplicationStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stempact_academy_super_secret_jwt_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Ensures Super Admin account is provisioned directly from .env variables
 */
export const ensureSuperAdminFromEnv = async (): Promise<void> => {
  try {
    const superEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@stempact.org';
    const superPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345';
    const superUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const superFirstName = process.env.SUPER_ADMIN_FIRSTNAME || 'Super';
    const superLastName = process.env.SUPER_ADMIN_LASTNAME || 'Admin';

    const existingSuper = await prisma.user.findFirst({
      where: {
        OR: [{ email: superEmail }, { role: Role.SUPER_ADMIN }],
      },
    });

    const passwordHash = await bcrypt.hash(superPassword, 10);

    if (!existingSuper) {
      await prisma.user.create({
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
      console.log(`[BOOT] Initialized Super Admin from .env: ${superEmail}`);
    } else {
      // Sync credentials if needed
      await prisma.user.update({
        where: { id: existingSuper.id },
        data: {
          email: superEmail,
          username: existingSuper.username || superUsername,
          passwordHash,
          role: Role.SUPER_ADMIN,
        },
      });
      console.log(`[BOOT] Verified Super Admin account: ${superEmail}`);
    }
  } catch (error) {
    console.error('[BOOT ERROR] Failed to ensure Super Admin from .env:', error);
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
      JWT_SECRET,
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
      const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.COORDINATOR_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN];
      if (!adminRoles.includes(user.role)) {
        res.status(403).json({ message: 'Access denied. You must be an Administrator to log in through the Staff Portal.' });
        return;
      }
    } else if (portal === 'instructor') {
      if (user.role !== Role.INSTRUCTOR && user.role !== Role.SUPER_ADMIN) {
        res.status(403).json({ message: 'Access denied. This login is reserved for Academic Faculty and Instructors.' });
        return;
      }
    } else if (portal === 'student') {
      if (user.role !== Role.STUDENT && user.role !== Role.PARENT && user.role !== Role.SUPER_ADMIN) {
        res.status(403).json({ message: 'Please log in through your appropriate Staff or Faculty portal.' });
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
      JWT_SECRET,
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
