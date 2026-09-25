import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt';
import { Role } from '@prisma/client';

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

async function runRegressionSuite() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: PHASE 2 REGRESSION VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Authentication & User Record Accessibility
    console.log('1. Authentication & User Records:');
    const users = await prisma.user.findMany({ take: 5 });
    assert(users.length > 0, `Users table is readable (found ${users.length} users)`);
    const superAdmin = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
    assert(!!superAdmin, 'Super Admin user exists in database');
    if (superAdmin) {
      const secret = getJwtSecret();
      const token = jwt.sign({ id: superAdmin.id, email: superAdmin.email, role: superAdmin.role }, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret) as any;
      assert(decoded.id === superAdmin.id, 'Authentication token generation & verification succeeds');
    }

    // 2. Existing Student & Parent Records (Compatibility Fields)
    console.log('\n2. Student & Parent Profile Compatibility:');
    const student = await prisma.studentProfile.findFirst({
      include: { user: true, cohort: true, guardian: true },
    });
    assert(!!student, 'Existing student profile is accessible');
    if (student) {
      assert('currentCohortId' in student, 'StudentProfile.currentCohortId legacy field preserved');
      assert('currentLevel' in student, 'StudentProfile.currentLevel legacy field preserved');
      assert('guardianId' in student, 'StudentProfile.guardianId legacy field preserved');
    }

    const parent = await prisma.parentProfile.findFirst({
      include: { user: true, students: true },
    });
    assert(!!parent, 'Existing parent profile is accessible');
    if (parent) {
      assert(Array.isArray(parent.students), 'ParentProfile.students legacy relation preserved');
    }

    // 3. Existing Cohorts & Programs
    console.log('\n3. Cohorts & Programs Accessibility:');
    const cohorts = await prisma.cohort.findMany({
      include: { program: true },
      take: 5,
    });
    assert(cohorts.length > 0, `Cohorts table is readable (found ${cohorts.length} cohorts)`);
    assert(!!cohorts[0]?.program, 'Cohort.program legacy relationship preserved');

    // 4. Existing Applications & Invoices
    console.log('\n4. Applications & Financial Records:');
    const applications = await prisma.application.findMany({ take: 5 });
    assert(applications.length > 0, `Applications table is readable (found ${applications.length} applications)`);
    if (applications.length > 0) {
      const app = applications[0];
      assert('parentName' in app && 'parentPhone' in app, 'Application parent contact fields preserved');
    }

    const invoices = await prisma.invoice.findMany({
      include: { payments: true },
      take: 5,
    });
    assert(invoices.length > 0, `Invoices table is readable (found ${invoices.length} invoices)`);

    // 5. Existing Assessments & Attendance
    console.log('\n5. Assessments & Attendance Records:');
    const assessments = await prisma.assessment.findMany({
      include: { questions: true },
      take: 5,
    });
    assert(assessments.length > 0, `Assessments table is readable (found ${assessments.length} assessments)`);

    const attendances = await prisma.attendance.findMany({ take: 5 });
    assert(attendances.length > 0, `Attendance records are readable (found ${attendances.length} records)`);

    // 6. New Phase 2 Additive Models Functional Verification
    console.log('\n6. Phase 2 Additive Models Integrity:');
    const enrollmentsCount = await prisma.studentCohortEnrollment.count();
    assert(typeof enrollmentsCount === 'number', 'StudentCohortEnrollment table exists and is queryable');

    const clearancesCount = await prisma.financialClearance.count();
    assert(typeof clearancesCount === 'number', 'FinancialClearance table exists and is queryable');

    const guardianRelationsCount = await prisma.studentGuardianRelation.count();
    assert(typeof guardianRelationsCount === 'number', 'StudentGuardianRelation table exists and is queryable');

    // Verify relations compile and can be queried via Prisma client
    if (student) {
      const studentWithNewRelations = await prisma.studentProfile.findUnique({
        where: { id: student.id },
        include: {
          enrollments: true,
          financialClearances: true,
          guardianRelations: true,
        },
      });
      assert(!!studentWithNewRelations, 'StudentProfile can query new enrollments, clearances, and guardianRelations');
    }

    if (parent) {
      const parentWithNewRelations = await prisma.parentProfile.findUnique({
        where: { id: parent.id },
        include: {
          guardianRelations: true,
        },
      });
      assert(!!parentWithNewRelations, 'ParentProfile can query new guardianRelations');
    }

    console.log('\n====================================================');
    console.log(`REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
  } catch (err: any) {
    console.error('Regression suite failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRegressionSuite();
