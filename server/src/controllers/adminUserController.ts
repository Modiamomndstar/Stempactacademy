import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

// 1. Create an Admin Account (SUPER_ADMIN only)
export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, username, phone, role, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: 'First name, last name, email, and password are required.' });
      return;
    }

    const allowedAdminRoles = [
      Role.COORDINATOR_ADMIN,
      Role.ACADEMIC_ADMIN,
      Role.FINANCE_ADMIN,
      Role.SUPER_ADMIN,
    ];

    const adminRole = role && allowedAdminRoles.includes(role) ? role : Role.ACADEMIC_ADMIN;

    // Check email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({ message: 'An account with this email address already exists.' });
      return;
    }

    // Check username if provided
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        res.status(400).json({ message: 'This username is already taken. Please choose another.' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username: username || email.split('@')[0],
        phone,
        role: adminRole,
        passwordHash,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: `Administrator account (${adminRole.replace('_', ' ')}) created successfully.`,
      admin: user,
    });
  } catch (error: any) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ message: 'Failed to create admin account. Internal server error.' });
  }
};

// 2. List all Administrators (SUPER_ADMIN only)
export const getAdmins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: [
            Role.SUPER_ADMIN,
            Role.COORDINATOR_ADMIN,
            Role.ACADEMIC_ADMIN,
            Role.FINANCE_ADMIN,
          ],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ admins });
  } catch (error: any) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Failed to load administrator accounts.' });
  }
};

// 3. Create an Instructor Account (SUPER_ADMIN or COORDINATOR_ADMIN)
export const createInstructor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      username,
      phone,
      password,
      specialization,
      bio,
      qualification,
      assignedSchools,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
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

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedUsername = username || email.split('@')[0];

    const instructorCount = await prisma.instructorProfile.count();
    const staffCode = `STP-INS-${String(instructorCount + 1).padStart(3, '0')}`;

    const instructor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          username: assignedUsername,
          phone,
          role: Role.INSTRUCTOR,
          passwordHash,
        },
      });

      const profile = await tx.instructorProfile.create({
        data: {
          userId: user.id,
          staffCode,
          specialization: specialization || 'STEM Technical Instructor',
          bio: bio || 'Faculty member at STEMPACT ACADEMY, Ile-Ife.',
          qualification: qualification || 'B.Sc / B.Eng / Professional Certification',
          assignedSchools: assignedSchools || 'SCH-01',
        },
      });

      return { user, profile };
    });

    res.status(201).json({
      message: 'Instructor account created successfully.',
      instructor: {
        id: instructor.user.id,
        staffCode: instructor.profile.staffCode,
        firstName: instructor.user.firstName,
        lastName: instructor.user.lastName,
        email: instructor.user.email,
        username: instructor.user.username,
        phone: instructor.user.phone,
        role: instructor.user.role,
        specialization: instructor.profile.specialization,
        qualification: instructor.profile.qualification,
        assignedSchools: instructor.profile.assignedSchools,
        loginUrl: '/portal/instructor/login',
      },
    });
  } catch (error: any) {
    console.error('Error creating instructor account:', error);
    res.status(500).json({ message: 'Failed to create instructor account. Internal server error.' });
  }
};

// 4. List all Instructors
export const getInstructors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const instructors = await prisma.user.findMany({
      where: { role: Role.INSTRUCTOR },
      include: {
        instructorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ instructors });
  } catch (error: any) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ message: 'Failed to load instructors.' });
  }
};
