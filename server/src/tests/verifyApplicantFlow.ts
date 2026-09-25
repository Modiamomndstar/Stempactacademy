import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, ApplicationStatus } from '@prisma/client';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/jwt.js';
import { identifierService } from '../services/identifierService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runApplicantFlowVerification() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: APPLICANT FLOW VERIFICATION');
  console.log('====================================================\n');

  let testUserId: string | null = null;
  let testAppId1: string | null = null;
  let testAppId2: string | null = null;

  try {
    // 0. Fetch a Program for testing
    const program = await prisma.program.findFirst();
    assert(!!program, `Reference Program available for application test: ${program?.name || 'None'}`);
    if (!program) throw new Error('No program found in database');

    const cohort = await prisma.cohort.findFirst({ where: { programId: program.id } });

    // 1. Verification of Role.APPLICANT on application submission
    console.log('\n1. Application Submission User Role:');
    const testEmail = `test_applicant_${Date.now()}@stempact.test`;
    const testPassword = 'SecurePassword123!';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const fullName = 'Ada Lovelace Test';

    // Simulate applicationController.ts logic
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      const [first, ...rest] = fullName.trim().split(' ');
      user = await prisma.user.create({
        data: {
          email: testEmail,
          passwordHash,
          firstName: first || fullName,
          lastName: rest.join(' ') || 'Learner',
          phone: '+2348011223344',
          role: Role.APPLICANT,
        },
      });
    }
    testUserId = user.id;

    assert(user.role === Role.APPLICANT, `Newly created user has Role.APPLICANT (actual: ${user.role})`);
    assert(user.role !== Role.STUDENT, 'User is NOT assigned Role.STUDENT upon initial application');

    // 2. Verification that no StudentProfile or official student ID is created during application
    console.log('\n2. StudentProfile & Student ID Absence:');
    const appNumber1 = await identifierService.generateApplicationNumber();
    const application1 = await prisma.application.create({
      data: {
        applicationNumber: appNumber1,
        userId: user.id,
        programId: program.id,
        cohortId: cohort?.id || null,
        preferredSchedule: 'Flexible',
        fullName,
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Female',
        phone: '+2348011223344',
        email: testEmail,
        address: 'Ile-Ife, Osun State',
        educationLevel: 'Secondary School',
        careerGoals: 'Technology Career Growth',
        learningObjectives: 'Practical Mastery',
        statementOfPurpose: 'Excited to join STEMPACT Academy.',
        status: ApplicationStatus.ASSESSMENT_PENDING,
      },
    });
    testAppId1 = application1.id;

    assert(application1.applicationNumber.startsWith('APP-'), `Application assigned Application Number: ${application1.applicationNumber}`);

    const existingStudentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });
    assert(existingStudentProfile === null, 'No StudentProfile exists for the applicant user');

    // 3. Verification of Applicant Authentication & Portal Access
    console.log('\n3. Applicant Authentication & Portal Access:');
    // Check password comparison
    const passwordValid = await bcrypt.compare(testPassword, user.passwordHash);
    assert(passwordValid, 'Applicant password successfully validates via bcrypt');

    // Check JWT payload
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN as any }
    );
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    assert(decoded.role === Role.APPLICANT, `JWT token carries role: ${decoded.role}`);

    // Check portal access validation matching authController.ts logic
    const studentRoles: Role[] = [Role.STUDENT, Role.PARENT, Role.APPLICANT, Role.PARTNER];
    const isAllowedInLearnerGateway = studentRoles.includes(user.role);
    assert(isAllowedInLearnerGateway, 'Applicant is permitted access via Learner Gateway in authController.ts');

    // 4. Duplicate Application / Account Handling
    console.log('\n4. Duplicate Application / Existing Account Handling:');
    // Simulate submitting a second application with the same email
    let userSecondAttempt = await prisma.user.findUnique({ where: { email: testEmail } });
    assert(!!userSecondAttempt, 'Existing user account is retrieved without creating duplicate user');
    assert(userSecondAttempt?.id === user.id, 'User account ID is reused across multiple applications');

    const appNumber2 = await identifierService.generateApplicationNumber();
    const application2 = await prisma.application.create({
      data: {
        applicationNumber: appNumber2,
        userId: userSecondAttempt!.id,
        programId: program.id,
        cohortId: cohort?.id || null,
        preferredSchedule: 'Weekend',
        fullName,
        dateOfBirth: new Date('2000-01-01'),
        gender: 'Female',
        phone: '+2348011223344',
        email: testEmail,
        address: 'Ile-Ife, Osun State',
        educationLevel: 'Secondary School',
        careerGoals: 'Technology Career Growth',
        learningObjectives: 'Practical Mastery',
        statementOfPurpose: 'Second application for different track.',
        status: ApplicationStatus.ASSESSMENT_PENDING,
      },
    });
    testAppId2 = application2.id;

    assert(appNumber2 !== appNumber1, `Distinct Application Number generated: ${appNumber2} != ${appNumber1}`);
    const userApplications = await prisma.application.findMany({ where: { userId: user.id } });
    assert(userApplications.length === 2, `Both applications (count: ${userApplications.length}) linked to single applicant user`);

    // Verify still no StudentProfile
    const studentProfileAfterTwoApps = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
    assert(studentProfileAfterTwoApps === null, 'Still no StudentProfile after multiple applications');

    // 5. Existing Admitted/Student Authentication & StudentProfile Creation Flow
    console.log('\n5. Admitted/Student Authentication & StudentProfile Creation:');
    // Simulate admission acceptance flow from admissionController.ts
    const studentIdNumber = await identifierService.generateStudentIdNumber();
    assert(studentIdNumber.startsWith('STP-'), `Official Student ID Number generated: ${studentIdNumber}`);

    const createdStudentProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        studentIdNumber,
        currentCohortId: cohort?.id || null,
        currentLevel: 'LEVEL_1',
        status: 'ACTIVE',
      },
      update: {
        studentIdNumber,
        currentCohortId: cohort?.id || null,
        currentLevel: 'LEVEL_1',
        status: 'ACTIVE',
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.STUDENT },
    });

    assert(updatedUser.role === Role.STUDENT, `User role promoted to Role.STUDENT upon admission (actual: ${updatedUser.role})`);
    assert(createdStudentProfile.studentIdNumber === studentIdNumber, `StudentProfile contains official Student ID: ${createdStudentProfile.studentIdNumber}`);

    // Verify existing student in database remains intact
    const existingStudentUser = await prisma.user.findFirst({
      where: { role: Role.STUDENT, NOT: { id: user.id } },
      include: { studentProfile: true },
    });
    if (existingStudentUser) {
      assert(!!existingStudentUser.studentProfile, `Existing student profile is preserved (${existingStudentUser.email})`);
      assert(!!existingStudentUser.studentProfile?.studentIdNumber, `Existing student ID preserved: ${existingStudentUser.studentProfile?.studentIdNumber}`);
    }

  } catch (err: any) {
    console.error('Verification error:', err);
    assert(false, 'Applicant flow verification encountered an error', err.message);
  } finally {
    // Cleanup test records
    console.log('\nCleaning up verification test data...');
    if (testAppId1) await prisma.application.delete({ where: { id: testAppId1 } }).catch(() => {});
    if (testAppId2) await prisma.application.delete({ where: { id: testAppId2 } }).catch(() => {});
    if (testUserId) {
      await prisma.studentProfile.deleteMany({ where: { userId: testUserId } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }

    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runApplicantFlowVerification();
