import prisma from '../config/prisma';
import { identifierService } from '../services/identifierService';
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

async function runIdentifierVerification() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: PHASE 3 IDENTIFIER VERIFICATION');
  console.log('====================================================\n');

  try {
    const currentYear = new Date().getFullYear();

    // 1. IdentifierSequence Table Health Check
    console.log('1. Database IdentifierSequence Table:');
    const seqTableCount = await prisma.identifierSequence.count();
    assert(seqTableCount >= 0, `IdentifierSequence table exists and is accessible (rows: ${seqTableCount})`);

    // 2. Format & Pattern Checks
    console.log('\n2. Business Identifier Format Validation:');
    const appNum = await identifierService.generateApplicationNumber();
    const appRegex = new RegExp(`^APP-${currentYear}-\\d{4}$`);
    assert(appRegex.test(appNum), `Application Number format: ${appNum} matches APP-YYYY-XXXX`);

    const admNum = await identifierService.generateAdmissionNumber();
    const admRegex = new RegExp(`^ADM-${currentYear}-\\d{3}$`);
    assert(admRegex.test(admNum), `Admission Number format: ${admNum} matches ADM-YYYY-XXX`);

    const studentId = await identifierService.generateStudentIdNumber();
    const studentRegex = new RegExp(`^STP-${currentYear}-\\d{4}$`);
    assert(studentRegex.test(studentId), `Student ID format: ${studentId} matches STP-YYYY-XXXX`);

    const invNum = await identifierService.generateInvoiceNumber();
    const invRegex = new RegExp(`^INV-${currentYear}-\\d{4}$`);
    assert(invRegex.test(invNum), `Invoice Number format: ${invNum} matches INV-YYYY-XXXX`);

    const certNum = await identifierService.generateCertificateNumber({ year: currentYear });
    const certRegex = new RegExp(`^STP-${currentYear}-\\d{4}$`);
    assert(certRegex.test(certNum), `Certificate Number format: ${certNum} matches STP-YYYY-XXXX`);

    const verifyCode = identifierService.generateCertificateVerificationCode();
    const verifyRegex = /^STP-VERIFY-[0-9A-F]{6,8}$/;
    assert(verifyRegex.test(verifyCode), `Certificate Verification Code format: ${verifyCode} matches STP-VERIFY-XXXXXX`);

    const cohortCode = await identifierService.generateCohortCode({ year: currentYear });
    const cohortRegex = new RegExp(`^STP-${currentYear}-C\\d+$`);
    assert(cohortRegex.test(cohortCode), `Cohort Code format: ${cohortCode} matches STP-YYYY-CXX`);

    const staffCode = await identifierService.generateInstructorStaffCode();
    const staffRegex = /^STP-INS-\d{3}$/;
    assert(staffRegex.test(staffCode), `Instructor Staff Code format: ${staffCode} matches STP-INS-XXX`);

    const payRefPstk = identifierService.generatePaymentReference('PSTK');
    assert(payRefPstk.startsWith('PAY-STP-PSTK-'), `Paystack Payment Reference: ${payRefPstk}`);

    const payRefFlw = identifierService.generatePaymentReference('FLW');
    assert(payRefFlw.startsWith('PAY-STP-FLW-'), `Flutterwave Payment Reference: ${payRefFlw}`);

    const payRefDir = identifierService.generatePaymentReference('DIR');
    assert(payRefDir.startsWith('PAY-STP-DIR-'), `Direct Payment Reference: ${payRefDir}`);

    const payRefBnk = identifierService.generatePaymentReference('BNK');
    assert(payRefBnk.startsWith('PAY-STP-BNK-'), `Bank Transfer Payment Reference: ${payRefBnk}`);

    // 3. Monotonic Sequential Ordering
    console.log('\n3. Monotonic Increment Check:');
    const app1 = await identifierService.generateApplicationNumber();
    const app2 = await identifierService.generateApplicationNumber();
    const num1 = parseInt(app1.split('-')[2], 10);
    const num2 = parseInt(app2.split('-')[2], 10);
    assert(num2 === num1 + 1, `Application numbers are strictly sequential: ${app1} -> ${app2}`);

    const inv1 = await identifierService.generateInvoiceNumber();
    const inv2 = await identifierService.generateInvoiceNumber();
    const invNum1 = parseInt(inv1.split('-')[2], 10);
    const invNum2 = parseInt(inv2.split('-')[2], 10);
    assert(invNum2 === invNum1 + 1, `Invoice numbers are strictly sequential: ${inv1} -> ${inv2}`);

    // 4. Concurrency Safety & Collision Resistance (Promise.all)
    console.log('\n4. Concurrency Safety & Collision Resistance (25 concurrent calls):');
    const parallelRequests = 25;
    const concurrentApps = await Promise.all(
      Array.from({ length: parallelRequests }, () => identifierService.generateApplicationNumber())
    );
    const uniqueApps = new Set(concurrentApps);
    assert(
      uniqueApps.size === parallelRequests,
      `All ${parallelRequests} concurrent Application Numbers are strictly unique (0 collisions)`,
      `Expected ${parallelRequests}, got ${uniqueApps.size}`
    );

    const concurrentStudents = await Promise.all(
      Array.from({ length: parallelRequests }, () => identifierService.generateStudentIdNumber())
    );
    const uniqueStudents = new Set(concurrentStudents);
    assert(
      uniqueStudents.size === parallelRequests,
      `All ${parallelRequests} concurrent Student IDs are strictly unique (0 collisions)`,
      `Expected ${parallelRequests}, got ${uniqueStudents.size}`
    );

    const concurrentInvoices = await Promise.all(
      Array.from({ length: parallelRequests }, () => identifierService.generateInvoiceNumber())
    );
    const uniqueInvoices = new Set(concurrentInvoices);
    assert(
      uniqueInvoices.size === parallelRequests,
      `All ${parallelRequests} concurrent Invoice Numbers are strictly unique (0 collisions)`,
      `Expected ${parallelRequests}, got ${uniqueInvoices.size}`
    );

    // 5. Identity Role Model Check
    console.log('\n5. Core Identity Model Verification:');
    assert('APPLICANT' in Role, 'Role.APPLICANT is defined in Prisma schema');
    assert('STUDENT' in Role, 'Role.STUDENT is defined in Prisma schema');

    const appUserCount = await prisma.user.count({ where: { role: Role.APPLICANT } });
    assert(appUserCount >= 0, `Users with APPLICANT role queryable (count: ${appUserCount})`);

    // 6. IdentifierSequence Persistence Check
    console.log('\n6. IdentifierSequence Table State:');
    const sequences = await prisma.identifierSequence.findMany({
      orderBy: { name: 'asc' },
    });
    assert(sequences.length > 0, `IdentifierSequence entries persisted in DB (${sequences.length} tracking records)`);
    sequences.forEach(s => {
      console.log(`    - ${s.name}: currentVal = ${s.currentVal} (prefix: ${s.prefix}, year: ${s.year})`);
    });

  } catch (err: any) {
    console.error('Unexpected error during Phase 3 verification:', err);
    assert(false, 'Phase 3 verification suite threw an unhandled error', err.message);
  } finally {
    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runIdentifierVerification();
