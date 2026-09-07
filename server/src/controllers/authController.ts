import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stempact_academy_super_secret_jwt_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ message: 'First name, last name, email, and password are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email address already exists.' });
      return;
    }

    const allowedRegistrationRoles = [Role.STUDENT, Role.PARENT];
    const userRole = role && allowedRegistrationRoles.includes(role) ? role : Role.STUDENT;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: userRole,
      },
    });

    // Automatically create sub-profile if student or parent
    if (userRole === Role.STUDENT) {
      const studentCount = await prisma.studentProfile.count();
      const studentIdNumber = `STP-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`;
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentIdNumber,
          currentLevel: 'Foundation',
        },
      });
    } else if (userRole === Role.PARENT) {
      await prisma.parentProfile.create({
        data: {
          userId: user.id,
          relationship: 'Parent/Guardian',
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: '7d' as any }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        instructorProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials. User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated. Please contact STEMPACT administration.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: '7d' as any }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
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
