import { Request, Response } from 'express';
import { CertificateType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { emailService } from '../services/emailService.js';

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { certNumber } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateNumber: certNumber.toUpperCase() },
          { verificationCode: certNumber.toUpperCase() },
        ],
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            cohort: { include: { program: true } },
          },
        },
      },
    });

    if (!certificate) {
      res.status(404).json({
        valid: false,
        message: `Certificate with reference "${certNumber}" is invalid or could not be found in the STEMPACT Registry.`,
      });
      return;
    }

    let signersList = [];
    try {
      signersList = JSON.parse(certificate.signers);
    } catch (e) {
      signersList = [{ name: 'Executive Academic Council', title: 'STEMPACT Academy' }];
    }

    res.status(200).json({
      valid: certificate.verified,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        programName: certificate.programName,
        certificateType: certificate.certificateType,
        achievement: certificate.achievement,
        issueDate: certificate.issueDate,
        verified: certificate.verified,
        signers: signersList,
        institution: 'STEMPACT ACADEMY - Ile-Ife, Osun State, Nigeria',
      },
    });
  } catch (error: any) {
    console.error('verifyCertificate error:', error);
    res.status(500).json({ message: 'Failed to verify certificate' });
  }
};

export const issueCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, programName, certificateType, achievement } = req.body;

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const count = await prisma.certificate.count();
    const year = new Date().getFullYear();
    const certificateNumber = `STP-${year + 2}-${String(count + 1).padStart(4, '0')}`;
    const verificationCode = `STP-VERIFY-${Math.floor(100000 + Math.random() * 900000)}`;

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        programName: programName || 'Advanced STEM Specialization',
        certificateType: (certificateType as CertificateType) || CertificateType.PROFESSIONAL,
        achievement: achievement || 'Successfully completed practical curriculum with high merit',
        issueDate: new Date(),
        verified: true,
        verificationCode,
        signers: JSON.stringify([
          { name: 'Dr. Folashade Adeleke', title: 'Director of Academic Affairs' },
          { name: 'Babatunde Olatunji', title: 'Executive Director' },
        ]),
      },
    });

    // Send official certificate notification email via Resend
    if (student.user?.email) {
      emailService.sendCertificateIssuedEmail({
        to: student.user.email,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        programName: certificate.programName,
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
      }).catch(err => console.error('Failed to send certificate email:', err));
    }

    res.status(201).json({ message: 'Certificate issued successfully', certificate });
  } catch (error: any) {
    console.error('issueCertificate error:', error);
    res.status(500).json({ message: 'Failed to issue certificate' });
  }
};

export const getCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        student: { include: { user: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    res.status(200).json({ certificates });
  } catch (error: any) {
    console.error('getCertificates error:', error);
    res.status(500).json({ message: 'Failed to fetch certificates' });
  }
};
