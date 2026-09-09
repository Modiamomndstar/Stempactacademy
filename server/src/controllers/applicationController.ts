import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApplicationStatus, Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { emailService } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stempact_academy_super_secret_jwt_key_2025';

export const submitApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      programId,
      cohortId,
      preferredSchedule,
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      educationLevel,
      institution,
      previousTraining,
      technicalExperience,
      relevantSkills,
      previousProjects,
      careerGoals,
      learningObjectives,
      statementOfPurpose,
      isMinor,
      parentName,
      parentPhone,
      parentEmail,
      parentRelationship,
      consentAccepted,
      password, // applicant chooses password or default
    } = req.body;

    if (!programId || !fullName || !email || !phone || !statementOfPurpose) {
      res.status(400).json({ message: 'Please fill in all required application fields.' });
      return;
    }

    // Check if minor and validate parent info
    const birthDate = new Date(dateOfBirth);
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    const requiresParentalConsent = isMinor || calculatedAge < 18;

    if (requiresParentalConsent && (!parentName || !parentPhone || !parentEmail)) {
      res.status(400).json({
        message: 'Applicant is under 18 years of age. Parent/Guardian contact details and consent are required.',
      });
      return;
    }

    // 1. Create or find User account for applicant
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const userPassword = password || 'Stempact@2025';
      const passwordHash = await bcrypt.hash(userPassword, 10);
      const [first, ...rest] = fullName.trim().split(' ');
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: first || fullName,
          lastName: rest.join(' ') || 'Learner',
          phone,
          role: Role.STUDENT,
        },
      });
    }

    // 2. Generate unique Application ID
    const count = await prisma.application.count();
    const year = new Date().getFullYear();
    const applicationNumber = `APP-${year}-${String(count + 1).padStart(4, '0')}`;

    // 3. Create Application Record
    const application = await prisma.application.create({
      data: {
        applicationNumber,
        userId: user.id,
        programId,
        cohortId: cohortId || null,
        preferredSchedule: preferredSchedule || 'Flexible',
        fullName,
        dateOfBirth: birthDate,
        gender: gender || 'Unspecified',
        phone,
        email,
        address: address || 'Ile-Ife, Osun State',
        educationLevel: educationLevel || 'Secondary School / Undergraduate',
        institution: institution || null,
        previousTraining: previousTraining || null,
        technicalExperience: technicalExperience || null,
        relevantSkills: relevantSkills || null,
        previousProjects: previousProjects || null,
        careerGoals: careerGoals || 'Technology Career Growth',
        learningObjectives: learningObjectives || 'Practical Mastery',
        statementOfPurpose,
        isMinor: requiresParentalConsent,
        parentName: requiresParentalConsent ? parentName : null,
        parentPhone: requiresParentalConsent ? parentPhone : null,
        parentEmail: requiresParentalConsent ? parentEmail : null,
        parentRelationship: requiresParentalConsent ? parentRelationship : null,
        consentAccepted: Boolean(consentAccepted),
        status: ApplicationStatus.ASSESSMENT_PENDING,
      },
      include: {
        program: { include: { school: true } },
        cohort: true,
      },
    });

    // Send application confirmation email with direct assessment link via Resend
    if (application.email) {
      emailService.sendApplicationReceivedEmail({
        to: application.email,
        fullName: application.fullName,
        applicationNumber: application.applicationNumber,
        programName: application.program?.name || 'STEMPACT Program',
        programId: application.programId,
        applicationId: application.id,
      }).catch(err => console.error('Failed to send application email:', err));
    }

    // 4. Generate Auth Token so applicant can immediately take assessment
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Application submitted successfully!',
      applicationNumber,
      applicationId: application.id,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      nextSteps: {
        action: 'PROCEED_TO_ASSESSMENT',
        message: 'Complete the online STEM readiness and placement assessment to determine your starting level.',
        assessmentUrl: `/assessment?appId=${application.id}`,
      },
      application,
    });
  } catch (error: any) {
    console.error('submitApplication error:', error);
    res.status(500).json({ message: 'Failed to submit application. Please check all fields.' });
  }
};

export const getApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, programId, search } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as ApplicationStatus;
    }
    if (programId) {
      where.programId = String(programId);
    }
    if (search) {
      const q = String(search);
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { applicationNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        program: { include: { school: true } },
        cohort: true,
        assessmentAttempts: true,
        placement: true,
        admission: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ applications, count: applications.length });
  } catch (error: any) {
    console.error('getApplications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

export const getApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationNumber: id }],
      },
      include: {
        program: { include: { school: true } },
        cohort: true,
        assessmentAttempts: true,
        placement: true,
        admission: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    res.status(200).json({ application });
  } catch (error: any) {
    console.error('getApplicationById error:', error);
    res.status(500).json({ message: 'Failed to retrieve application details' });
  }
};
