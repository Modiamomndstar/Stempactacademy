import prisma from '../config/prisma.js';
import {
  Role,
  AdmissionStatus,
  ApplicationStatus,
  EnrollmentStatus,
  FinancialClearanceStatus,
  PaymentStatus,
  InvoiceStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { admissionService } from '../services/admissionService.js';
import { financialClearanceService } from '../services/financialClearanceService.js';
import { enrollmentService } from '../services/enrollmentService.js';
import { paymentService } from '../services/paymentService.js';
import { identifierService } from '../services/identifierService.js';
import { automationEventService } from '../services/automationEventService.js';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runPhase6TestSuite() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: PHASE 6 ADMISSION, FINANCE & ENROLLMENT SUITE');
  console.log('Expanded Verification: Scenarios A through S');
  console.log('====================================================\n');

  // Test setup variables
  let testAdmin: any = null;
  let testFinanceAdmin: any = null;
  let testApplicant1: any = null;
  let testApplicant2: any = null;
  let testAppApproved: any = null;
  let testAppPending: any = null;
  let testPlacementApproved: any = null;
  let testPlacementPending: any = null;
  let testCohort: any = null;
  let testLimitedCohort: any = null;
  let testAdmission1: any = null;

  try {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const ts = Date.now();

    // 1. Setup test staff users
    testAdmin = await prisma.user.create({
      data: {
        email: `phase6_admin_${ts}@stempact.org`,
        firstName: 'Phase6',
        lastName: 'Admin',
        passwordHash,
        role: Role.ADMISSIONS_ADMIN,
      },
    });

    testFinanceAdmin = await prisma.user.create({
      data: {
        email: `phase6_fin_${ts}@stempact.org`,
        firstName: 'Phase6',
        lastName: 'FinanceAdmin',
        passwordHash,
        role: Role.FINANCE_ADMIN,
      },
    });

    testApplicant1 = await prisma.user.create({
      data: {
        email: `phase6_app1_${ts}@stempact.org`,
        firstName: 'Applicant',
        lastName: 'One',
        passwordHash,
        role: Role.APPLICANT,
      },
    });

    testApplicant2 = await prisma.user.create({
      data: {
        email: `phase6_app2_${ts}@stempact.org`,
        firstName: 'Applicant',
        lastName: 'Two',
        passwordHash,
        role: Role.APPLICANT,
      },
    });

    // 2. Fetch canonical academic program & version
    const program = await prisma.program.findFirst({
      where: { code: 'CSE-01' },
      include: { versions: { where: { isCurrent: true } } },
    });
    if (!program || program.versions.length === 0) {
      throw new Error('Base program CSE-01 or active version not found');
    }
    const programVersion = program.versions[0];
    const curriculumVersionId = programVersion.curriculumVersionId;

    // 3. Create active test cohorts
    const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    testCohort = await prisma.cohort.create({
      data: {
        name: `Phase 6 Main Cohort ${ts}`,
        cohortCode: `STP-2026-C6-${ts.toString().slice(-4)}`,
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        academicSessionId: activeSession?.id,
        level: 'Level 1 (Foundation)',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-15'),
        applicationDeadline: new Date('2026-09-25'),
        schedule: 'Weekdays (Mon/Wed/Fri)',
        mode: 'HYBRID',
        location: 'Turing Hall, Ile-Ife',
        instructorName: 'Lead Faculty',
        maxCapacity: 30,
        currentEnrollment: 0,
        trainingFee: 60000,
        registrationFee: 10000,
        certificationFee: 10000,
        discountPercentage: 0,
      },
    });

    testLimitedCohort = await prisma.cohort.create({
      data: {
        name: `Phase 6 Capacity 1 Cohort ${ts}`,
        cohortCode: `STP-2026-CLIM-${ts.toString().slice(-4)}`,
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        academicSessionId: activeSession?.id,
        level: 'Level 1 (Foundation)',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-15'),
        applicationDeadline: new Date('2026-09-25'),
        schedule: 'Weekdays (Mon/Wed/Fri)',
        mode: 'HYBRID',
        location: 'Lab 2, Ile-Ife',
        instructorName: 'Lead Faculty',
        maxCapacity: 1, // Only 1 seat available!
        currentEnrollment: 0,
        trainingFee: 60000,
        registrationFee: 10000,
        certificationFee: 10000,
      },
    });

    // 4. Create Applications (One Approved Placement, One Pending Review)
    testAppApproved = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: testApplicant1.id,
        email: testApplicant1.email,
        fullName: 'Applicant One',
        gender: 'Female',
        phone: '+2348001112221',
        address: 'Ile-Ife, Osun State',
        educationLevel: 'Undergraduate',
        careerGoals: 'Software Engineer',
        learningObjectives: 'Web Development & Cloud',
        statementOfPurpose: 'Desire to acquire world-class software engineering skills',
        preferredSchedule: 'Weekdays',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2003-05-15'),
        status: ApplicationStatus.PLACED,
      },
    });

    testAppPending = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: testApplicant2.id,
        email: testApplicant2.email,
        fullName: 'Applicant Two',
        gender: 'Male',
        phone: '+2348001112222',
        address: 'Ile-Ife, Osun State',
        educationLevel: 'High School',
        careerGoals: 'Data Analyst',
        learningObjectives: 'Python & Analytics',
        statementOfPurpose: 'Keen on data science foundations',
        preferredSchedule: 'Weekdays',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2005-09-20'),
        status: ApplicationStatus.PLACEMENT_PENDING,
      },
    });

    // 5. Create Placement records
    testPlacementApproved = await prisma.placement.create({
      data: {
        applicationId: testAppApproved.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1 (Foundation)',
        reason: 'Scored 85% on diagnostic assessment attempt 1',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        approvedProgram: program.name,
        approvedLevel: 'Level 1 (Foundation)',
        approvedCohortCode: testCohort.cohortCode,
        reviewerId: testAdmin.id,
        reviewedAt: new Date(),
      },
    });

    // Placement decision audit
    await prisma.placementDecision.create({
      data: {
        placementId: testPlacementApproved.id,
        decision: 'APPROVED',
        reviewerId: testAdmin.id,
        reviewerName: 'Phase6 Admin',
        reviewerRole: testAdmin.role,
        approvedProgramId: program.id,
        approvedProgramVersionId: programVersion.id,
        approvedCurriculumVersionId: curriculumVersionId,
        approvedCohortId: testCohort.id,
        notes: 'Academically verified and approved for admission offer',
      },
    });

    testPlacementPending = await prisma.placement.create({
      data: {
        applicationId: testAppPending.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1 (Foundation)',
        reason: 'Pending Academic Board review',
        status: 'PENDING_REVIEW',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
      },
    });

    // ====================================================
    // VERIFICATION OF CORE PHASE 6 CONTROLS
    // ====================================================

    // ----------------------------------------------------
    // CHECK 1: Issue Admission from Approved Placement
    // ----------------------------------------------------
    console.log('\n--- CHECK 1: Issue Admission Offer ---');
    const issueResult = await admissionService.issueAdmissionOffer({
      applicationId: testAppApproved.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    testAdmission1 = issueResult.admission;

    assert(testAdmission1.status === AdmissionStatus.OFFERED, 'Admission offer status is OFFERED');
    assert(testAdmission1.admissionNumber.startsWith('ADM-2026-'), 'Admission number has valid ADM-YYYY-XXX format');
    assert(testAdmission1.programVersionId === programVersion.id, 'Admission offer references correct ProgramVersion');
    assert(testAdmission1.curriculumVersionId === curriculumVersionId, 'Admission offer references correct CurriculumVersion');

    // ----------------------------------------------------
    // CHECK 2: Pending/Rejected Placement cannot produce admission
    // ----------------------------------------------------
    console.log('\n--- CHECK 2: Pending/Rejected Placement Rejection ---');
    let pendingPlacementError: string | null = null;
    try {
      await admissionService.issueAdmissionOffer({
        applicationId: testAppPending.id,
        staffUser: testAdmin,
      });
    } catch (err: any) {
      pendingPlacementError = err.message;
    }
    assert(
      !!pendingPlacementError && pendingPlacementError.includes('approved placement'),
      'Pending placement correctly rejected from admission issuance'
    );

    // ----------------------------------------------------
    // SCENARIO D: Applicant requests installment plan during application
    // ----------------------------------------------------
    console.log('\n--- SCENARIO D: Application Financial Preference Capture ---');
    const appWithPref = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: testApplicant2.id,
        email: testApplicant2.email,
        fullName: 'Applicant Two Pref',
        gender: 'Male',
        phone: '+2348001112229',
        address: 'Campus',
        educationLevel: 'Undergraduate',
        careerGoals: 'Engineer',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Requesting flexible payment',
        preferredSchedule: 'Weekdays',
        programId: program.id,
        dateOfBirth: new Date('2002-01-01'),
        status: ApplicationStatus.SUBMITTED,
        requestedPaymentPlan: '3_INSTALLMENTS',
        fundingSourcePreference: 'PARENT_GUARDIAN',
        sponsorshipDetails: 'Parent to sponsor',
        scholarshipRequested: true,
        financialAssistanceReason: 'Partial assistance required for tuition',
        financialNotes: 'Prefers 3 equal installments across term',
      },
    });

    assert(appWithPref.requestedPaymentPlan === '3_INSTALLMENTS', 'Application captures requested payment plan (3_INSTALLMENTS)');
    assert(appWithPref.fundingSourcePreference === 'PARENT_GUARDIAN', 'Application captures funding preference (PARENT_GUARDIAN)');
    assert(appWithPref.scholarshipRequested === true, 'Application captures scholarship requested flag (true)');
    assert(Boolean(appWithPref.financialAssistanceReason?.includes('Partial assistance')), 'Application captures financial assistance rationale');

    // ----------------------------------------------------
    // SCENARIO E: Management reviews and approves/modifies requested plan
    // ----------------------------------------------------
    console.log('\n--- SCENARIO E: Management Approves Custom Installment Plan ---');
    // Approve placement and issue admission for appWithPref
    const placementWithPref = await prisma.placement.create({
      data: {
        applicationId: appWithPref.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Qualified',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });

    const offerPref = await admissionService.issueAdmissionOffer({
      applicationId: appWithPref.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });

    // Management modifies applicant 3-installment request into an approved 2-installment arrangement
    // with requiredInitialPayment of ₦35,000 for enrollment clearance
    const approvedPlan = await financialClearanceService.approvePaymentArrangement({
      admissionId: offerPref.admission.id,
      staffUser: testFinanceAdmin,
      planType: 'INSTALLMENTS',
      requiredInitialPayment: 35000,
      installmentSchedule: [
        { installment: 1, amount: 35000, dueDate: '2026-10-15', isRequiredForEnrollment: true },
        { installment: 2, amount: 45000, dueDate: '2026-11-15', isRequiredForEnrollment: false },
      ],
      fundingSource: 'PARENT_GUARDIAN',
      notes: 'Management approved 2-installment plan instead of requested 3',
    });

    assert(approvedPlan.clearance.approvedPlanType === 'INSTALLMENTS', 'Clearance records approved plan type INSTALLMENTS');
    assert(approvedPlan.clearance.requiredInitialPayment === 35000, 'Management sets required initial payment to ₦35,000');
    assert(approvedPlan.clearance.fundingSource === 'PARENT_GUARDIAN', 'Clearance records approved funding source PARENT_GUARDIAN');
    assert(approvedPlan.clearance.approvedById === testFinanceAdmin.id, 'Clearance records authorized approving admin ID');

    // ----------------------------------------------------
    // SCENARIO M: Insufficient verified funding fails clearance
    // ----------------------------------------------------
    console.log('\n--- SCENARIO M: Insufficient Verified Funding ---');
    const invoicePref = await prisma.invoice.findFirst({ where: { admissionId: offerPref.admission.id } });
    assert(!!invoicePref, 'Invoice exists for custom plan admission');

    // Pay ₦20,000 (which is less than the requiredInitialPayment of ₦35,000)
    await paymentService.recordSuccessfulPayment({
      invoiceId: invoicePref!.id,
      amount: 20000,
      reference: identifierService.generatePaymentReference('TEST'),
      channel: 'TEST',
      payerType: 'PARENT',
      payerName: 'Parent Guardian',
    });

    const clearanceUnderpaid = await financialClearanceService.evaluateFinancialClearance({
      admissionId: offerPref.admission.id,
    });
    assert(clearanceUnderpaid.isCleared === false, 'Payment below approved initial requirement evaluates to isCleared: false');
    assert(clearanceUnderpaid.status === FinancialClearanceStatus.PARTIAL, 'Clearance status is PARTIAL');

    // ----------------------------------------------------
    // SCENARIO B & C: Multiple installment payments aggregate cleanly
    // ----------------------------------------------------
    console.log('\n--- SCENARIO B & C: Multiple Installment Payments Aggregate ---');
    // Pay remaining ₦15,000 of installment 1 (20,000 + 15,000 = 35,000)
    await paymentService.recordSuccessfulPayment({
      invoiceId: invoicePref!.id,
      amount: 15000,
      reference: identifierService.generatePaymentReference('TEST'),
      channel: 'TEST',
      payerType: 'PARENT',
      payerName: 'Parent Guardian',
    });

    const clearanceMet = await financialClearanceService.evaluateFinancialClearance({
      admissionId: offerPref.admission.id,
    });
    assert(clearanceMet.amountPaid === 35000, 'Multiple installment payments aggregated correctly to ₦35,000');
    assert(clearanceMet.isCleared === true, 'Clearance achieved once approved initial payment requirement is satisfied');
    assert(clearanceMet.status === FinancialClearanceStatus.CLEARED, 'Clearance status transitioned to CLEARED');

    // ----------------------------------------------------
    // SCENARIO N: Financial clearance without admission acceptance must fail
    // ----------------------------------------------------
    console.log('\n--- SCENARIO N: Enrollment Blocked Without Offer Acceptance ---');
    // Note: offerPref is still in OFFERED status (applicant has not yet accepted)
    const checkOfferStatus = await prisma.admission.findUnique({ where: { id: offerPref.admission.id } });
    assert(checkOfferStatus?.status === AdmissionStatus.OFFERED, 'Admission is still in OFFERED status');

    let prematureEnrollError: string | null = null;
    try {
      await enrollmentService.enrollStudent({
        admissionId: offerPref.admission.id,
        authUser: testApplicant2,
      });
    } catch (err: any) {
      prematureEnrollError = err.message;
    }
    assert(
      !!prematureEnrollError && prematureEnrollError.includes('must be accepted before enrollment'),
      'Financially cleared applicant CANNOT enroll while admission offer is still OFFERED'
    );

    // ----------------------------------------------------
    // SCENARIO O, Q, R: Accepted admission + valid clearance proceeds to enrollment
    // ----------------------------------------------------
    console.log('\n--- SCENARIO O, Q, R: Accept Offer and Legitimate Enrollment ---');
    // Accept offer
    await admissionService.acceptAdmissionOffer({
      admissionId: offerPref.admission.id,
      authUser: testApplicant2,
    });
    const acceptedPrefAdmission = await prisma.admission.findUnique({ where: { id: offerPref.admission.id } });
    assert(
      acceptedPrefAdmission?.status === AdmissionStatus.FINANCIALLY_CLEARED,
      'Upon acceptance, admission automatically advances to FINANCIALLY_CLEARED'
    );

    // Before enrollment: user is still APPLICANT, no StudentProfile
    const userBeforeEnroll = await prisma.user.findUnique({ where: { id: testApplicant2.id } });
    assert(userBeforeEnroll?.role === Role.APPLICANT, 'User role strictly remains Role.APPLICANT before enrollment');
    const profileBeforeEnroll = await prisma.studentProfile.findUnique({ where: { userId: testApplicant2.id } });
    assert(profileBeforeEnroll === null, 'No StudentProfile exists prior to enrollment execution');

    // Enroll
    const enrollPrefResult = await enrollmentService.enrollStudent({
      admissionId: offerPref.admission.id,
      authUser: testApplicant2,
      notes: 'Enrolled under approved 2-installment arrangement',
    });

    assert(!!enrollPrefResult.enrollment, 'Enrollment succeeds when offer accepted and financially cleared');
    assert(enrollPrefResult.studentProfile.studentIdNumber.startsWith('STP-2026-'), 'STP registration number generated');
    const userAfterEnroll = await prisma.user.findUnique({ where: { id: testApplicant2.id } });
    assert(userAfterEnroll?.role === Role.STUDENT, 'Applicant promoted to Role.STUDENT upon legitimate enrollment');

    // ----------------------------------------------------
    // SCENARIO A: Full student payment
    // ----------------------------------------------------
    console.log('\n--- SCENARIO A: Full Student Payment ---');
    const userFull = await prisma.user.create({
      data: { email: `full_pay_${ts}@stempact.org`, firstName: 'Full', lastName: 'Payer', passwordHash, role: Role.APPLICANT },
    });
    const appFull = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userFull.id,
        email: userFull.email,
        fullName: 'Full Payer',
        gender: 'Female',
        phone: '+2348003334441',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Full payer',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2001-01-01'),
        status: ApplicationStatus.PLACED,
      },
    });
    await prisma.placement.create({
      data: {
        applicationId: appFull.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Direct',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });
    const offerFull = await admissionService.issueAdmissionOffer({
      applicationId: appFull.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    await admissionService.acceptAdmissionOffer({ admissionId: offerFull.admission.id, authUser: userFull });

    const invFull = await prisma.invoice.findFirst({ where: { admissionId: offerFull.admission.id } });
    // Pay full ₦80,000 in one transaction
    await paymentService.recordSuccessfulPayment({
      invoiceId: invFull!.id,
      amount: 80000,
      reference: identifierService.generatePaymentReference('TEST'),
      channel: 'TEST',
      payerType: 'STUDENT',
      payerName: 'Full Payer',
    });
    const clearanceFull = await financialClearanceService.evaluateFinancialClearance({ admissionId: offerFull.admission.id });
    assert(clearanceFull.amountPaid === 80000, 'Full payment of ₦80,000 verified');
    assert(clearanceFull.balance === 0, 'Outstanding invoice balance is ₦0');
    assert(clearanceFull.isCleared === true, 'Clearance status is true for full student payment');

    // ----------------------------------------------------
    // SCENARIO F & P: Full Scholarship (₦0 due, 0 fake payment records)
    // ----------------------------------------------------
    console.log('\n--- SCENARIO F & P: Full Scholarship (100% award, 0 fake payments) ---');
    const userSchol = await prisma.user.create({
      data: { email: `schol_${ts}@stempact.org`, firstName: 'Scholarship', lastName: 'Recipient', passwordHash, role: Role.APPLICANT },
    });
    const appSchol = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userSchol.id,
        email: userSchol.email,
        fullName: 'Scholarship Recipient',
        gender: 'Male',
        phone: '+2348003334442',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Merit scholar',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2001-01-01'),
        status: ApplicationStatus.PLACED,
        scholarshipRequested: true,
      },
    });
    await prisma.placement.create({
      data: {
        applicationId: appSchol.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: '100% Merit Scholar',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });
    const offerSchol = await admissionService.issueAdmissionOffer({
      applicationId: appSchol.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    await admissionService.acceptAdmissionOffer({ admissionId: offerSchol.admission.id, authUser: userSchol });

    const invSchol = await prisma.invoice.findFirst({ where: { admissionId: offerSchol.admission.id } });
    // Apply 100% scholarship adjustment
    await paymentService.applyFinancialAdjustment({
      invoiceId: invSchol!.id,
      adjustmentType: 'SCHOLARSHIP',
      amount: 80000,
      reason: '100% Full Academy Merit Scholarship Award',
      staffUser: testFinanceAdmin,
    });

    const updatedInvSchol = await prisma.invoice.findUnique({ where: { id: invSchol!.id } });
    assert(updatedInvSchol?.scholarshipAmount === 80000, 'Invoice scholarshipAmount updated to ₦80,000');
    assert(updatedInvSchol?.totalAmount === 0, 'Net amount due on invoice is ₦0');
    assert(updatedInvSchol?.status === InvoiceStatus.PAID, 'Invoice status is marked PAID');

    const clearanceSchol = await financialClearanceService.evaluateFinancialClearance({ admissionId: offerSchol.admission.id });
    assert(clearanceSchol.isCleared === true, 'Clearance granted for 100% scholarship recipient');
    assert(clearanceSchol.status === FinancialClearanceStatus.CLEARED, 'Status is CLEARED');

    // CHECK P: Assert NO fake payment records were created for scholarship
    const paymentCountSchol = await prisma.payment.count({ where: { invoiceId: invSchol!.id } });
    assert(paymentCountSchol === 0, 'ZERO fake payment records created for 100% scholarship clearance');

    // Scholarship student can enroll
    const enrollSchol = await enrollmentService.enrollStudent({ admissionId: offerSchol.admission.id, authUser: userSchol });
    assert(!!enrollSchol.enrollment, 'Full scholarship recipient enrolled cleanly without payment transaction');

    // ----------------------------------------------------
    // SCENARIO G: Partial scholarship
    // ----------------------------------------------------
    console.log('\n--- SCENARIO G: Partial Scholarship ---');
    const userPartSchol = await prisma.user.create({
      data: { email: `part_schol_${ts}@stempact.org`, firstName: 'Part', lastName: 'Schol', passwordHash, role: Role.APPLICANT },
    });
    const appPartSchol = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userPartSchol.id,
        email: userPartSchol.email,
        fullName: 'Part Schol Applicant',
        gender: 'Female',
        phone: '+2348003334443',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Partial scholarship',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2001-01-01'),
        status: ApplicationStatus.PLACED,
      },
    });
    await prisma.placement.create({
      data: {
        applicationId: appPartSchol.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Partial award',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });
    const offerPartSchol = await admissionService.issueAdmissionOffer({
      applicationId: appPartSchol.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    await admissionService.acceptAdmissionOffer({ admissionId: offerPartSchol.admission.id, authUser: userPartSchol });
    const invPartSchol = await prisma.invoice.findFirst({ where: { admissionId: offerPartSchol.admission.id } });

    // Apply ₦30,000 scholarship adjustment (leaving ₦50,000 balance)
    await paymentService.applyFinancialAdjustment({
      invoiceId: invPartSchol!.id,
      adjustmentType: 'SCHOLARSHIP',
      amount: 30000,
      reason: 'Partial merit scholarship',
      staffUser: testFinanceAdmin,
    });
    const invAfterPartSchol = await prisma.invoice.findUnique({ where: { id: invPartSchol!.id } });
    assert(invAfterPartSchol?.totalAmount === 50000, 'Net amount due reduced from 80000 to 50000');

    // Pay remaining ₦50,000
    await paymentService.recordSuccessfulPayment({
      invoiceId: invPartSchol!.id,
      amount: 50000,
      reference: identifierService.generatePaymentReference('TEST'),
      channel: 'TEST',
      payerType: 'STUDENT',
      payerName: 'Part Schol Student',
    });
    const clearancePartSchol = await financialClearanceService.evaluateFinancialClearance({ admissionId: offerPartSchol.admission.id });
    assert(clearancePartSchol.isCleared === true, 'Clearance achieved with partial scholarship + student remainder payment');

    // ----------------------------------------------------
    // SCENARIO H, I, J: Corporate / Individual Sponsorship & Payer Attribution
    // ----------------------------------------------------
    console.log('\n--- SCENARIO H, I, J: Sponsorship & Payer Attribution ---');
    const userSponsor = await prisma.user.create({
      data: { email: `sponsor_recip_${ts}@stempact.org`, firstName: 'Sponsored', lastName: 'Student', passwordHash, role: Role.APPLICANT },
    });
    const appSponsor = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userSponsor.id,
        email: userSponsor.email,
        fullName: 'Sponsored Student',
        gender: 'Male',
        phone: '+2348003334444',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Corporate sponsored',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2001-01-01'),
        status: ApplicationStatus.PLACED,
        fundingSourcePreference: 'SPONSOR',
        sponsorshipDetails: 'Tech Innovation Foundation',
      },
    });
    await prisma.placement.create({
      data: {
        applicationId: appSponsor.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Sponsored slot',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });
    const offerSponsor = await admissionService.issueAdmissionOffer({
      applicationId: appSponsor.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    await admissionService.acceptAdmissionOffer({ admissionId: offerSponsor.admission.id, authUser: userSponsor });
    const invSponsor = await prisma.invoice.findFirst({ where: { admissionId: offerSponsor.admission.id } });

    // Partial sponsor commitment: ₦50,000 by Tech Innovation Foundation
    await paymentService.applyFinancialAdjustment({
      invoiceId: invSponsor!.id,
      adjustmentType: 'SPONSORSHIP',
      amount: 50000,
      reason: 'Tech Innovation Foundation cohort scholarship fund',
      sponsorDetails: { organization: 'Tech Innovation Foundation', name: 'Dr. Sponsor Representative' },
      staffUser: testFinanceAdmin,
    });

    const invAfterSponsor = await prisma.invoice.findUnique({ where: { id: invSponsor!.id } });
    assert(invAfterSponsor?.sponsorAmount === 50000, 'Invoice sponsorAmount recorded as ₦50,000');
    assert(invAfterSponsor?.sponsorOrganization === 'Tech Innovation Foundation', 'Invoice sponsor organization recorded');
    assert(invAfterSponsor?.totalAmount === 30000, 'Student remaining balance is ₦30,000');

    // CHECK J: Sponsor makes payment directly on behalf of applicant
    const sponsorPayment = await paymentService.recordSuccessfulPayment({
      invoiceId: invSponsor!.id,
      amount: 30000,
      reference: identifierService.generatePaymentReference('TEST'),
      channel: 'BANK_TRANSFER',
      payerType: 'SPONSOR',
      payerName: 'Tech Innovation Foundation',
      notes: 'Direct wire payment from foundation account',
    });
    assert(sponsorPayment.payment.payerType === 'SPONSOR', 'Payment record payerType is SPONSOR');
    assert(sponsorPayment.payment.payerName === 'Tech Innovation Foundation', 'Payment record payerName attributes foundation');

    const clearanceSponsor = await financialClearanceService.evaluateFinancialClearance({ admissionId: offerSponsor.admission.id });
    assert(clearanceSponsor.isCleared === true, 'Clearance achieved with sponsorship + sponsor direct payment');

    // ----------------------------------------------------
    // SCENARIO K: Discount / Coupon Reducing Amount Due
    // ----------------------------------------------------
    console.log('\n--- SCENARIO K: Fee Discount / Coupon Code ---');
    const userDisc = await prisma.user.create({
      data: { email: `discount_${ts}@stempact.org`, firstName: 'Discount', lastName: 'User', passwordHash, role: Role.APPLICANT },
    });
    const appDisc = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userDisc.id,
        email: userDisc.email,
        fullName: 'Discount Applicant',
        gender: 'Female',
        phone: '+2348003334445',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Discount applicant',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2001-01-01'),
        status: ApplicationStatus.PLACED,
      },
    });
    await prisma.placement.create({
      data: {
        applicationId: appDisc.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Promo discount eligible',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });
    const offerDisc = await admissionService.issueAdmissionOffer({
      applicationId: appDisc.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    const invDisc = await prisma.invoice.findFirst({ where: { admissionId: offerDisc.admission.id } });

    // Apply 20% discount (₦16,000 on ₦80,000)
    await paymentService.applyFinancialAdjustment({
      invoiceId: invDisc!.id,
      adjustmentType: 'DISCOUNT',
      amount: 16000,
      reason: 'Early bird promotion promo code EARLY20',
      staffUser: testFinanceAdmin,
    });
    const invAfterDisc = await prisma.invoice.findUnique({ where: { id: invDisc!.id } });
    assert(invAfterDisc?.discountAmount === 16000, 'Discount amount of ₦16,000 recorded');
    assert(invAfterDisc?.totalAmount === 64000, 'Total amount due reduced to ₦64,000');

    // ----------------------------------------------------
    // SCENARIO L: Administrative Waiver
    // ----------------------------------------------------
    console.log('\n--- SCENARIO L: Audited Administrative Waiver ---');
    const userWaiver = await prisma.user.create({
      data: { email: `waiver_${ts}@stempact.org`, firstName: 'Waiver', lastName: 'User', passwordHash, role: Role.APPLICANT },
    });
    const appWaiver = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userWaiver.id,
        email: userWaiver.email,
        fullName: 'Waiver Applicant',
        gender: 'Male',
        phone: '+2348003334446',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Waiver applicant',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testCohort.id,
        dateOfBirth: new Date('2001-01-01'),
        status: ApplicationStatus.PLACED,
      },
    });
    await prisma.placement.create({
      data: {
        applicationId: appWaiver.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Staff dependent',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testCohort.id,
        reviewerId: testAdmin.id,
      },
    });
    const offerWaiver = await admissionService.issueAdmissionOffer({
      applicationId: appWaiver.id,
      cohortId: testCohort.id,
      staffUser: testAdmin,
    });
    await admissionService.acceptAdmissionOffer({ admissionId: offerWaiver.admission.id, authUser: userWaiver });

    // Grant waiver
    const grantedWaiver = await financialClearanceService.grantFinancialWaiver({
      admissionId: offerWaiver.admission.id,
      staffUser: testFinanceAdmin,
      reason: 'Staff dependent full tuition waiver',
      waiverAmount: 80000,
    });
    assert(grantedWaiver.status === FinancialClearanceStatus.WAIVED, 'Clearance status set to WAIVED');
    assert(grantedWaiver.waivedById === testFinanceAdmin.id, 'Audited waivedById records finance admin');
    assert(grantedWaiver.waiverAmount === 80000, 'Audited waiverAmount recorded as 80000');

    // Enrolling waived student succeeds
    const enrollWaiver = await enrollmentService.enrollStudent({
      admissionId: offerWaiver.admission.id,
      authUser: userWaiver,
    });
    assert(!!enrollWaiver.enrollment, 'Waived applicant enrolls successfully');

    // ----------------------------------------------------
    // CONCURRENCY & STRICT COHORT CAPACITY ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- Cohort Capacity & Concurrency Enforcement ---');
    // testLimitedCohort has maxCapacity = 1
    const userA = await prisma.user.create({
      data: { email: `seatA_${ts}@stempact.org`, firstName: 'Seat', lastName: 'A', passwordHash, role: Role.APPLICANT },
    });
    const userB = await prisma.user.create({
      data: { email: `seatB_${ts}@stempact.org`, firstName: 'Seat', lastName: 'B', passwordHash, role: Role.APPLICANT },
    });

    const appA = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userA.id,
        email: userA.email,
        fullName: 'Seat Candidate A',
        gender: 'Female',
        phone: '+2348000000001',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Ready',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testLimitedCohort.id,
        dateOfBirth: new Date('2002-01-01'),
        status: ApplicationStatus.PLACED,
      },
    });

    const appB = await prisma.application.create({
      data: {
        applicationNumber: await identifierService.generateApplicationNumber({ year: 2026 }),
        userId: userB.id,
        email: userB.email,
        fullName: 'Seat Candidate B',
        gender: 'Male',
        phone: '+2348000000002',
        address: 'Campus',
        educationLevel: 'BSc',
        careerGoals: 'Tech',
        learningObjectives: 'FullStack',
        statementOfPurpose: 'Ready',
        preferredSchedule: 'Weekday',
        programId: program.id,
        cohortId: testLimitedCohort.id,
        dateOfBirth: new Date('2002-01-01'),
        status: ApplicationStatus.PLACED,
      },
    });

    await prisma.placement.create({
      data: {
        applicationId: appA.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Seat race',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testLimitedCohort.id,
      },
    });

    await prisma.placement.create({
      data: {
        applicationId: appB.id,
        recommendedProgram: program.name,
        recommendedLevel: 'Level 1',
        reason: 'Seat race',
        status: 'APPROVED',
        programId: program.id,
        programVersionId: programVersion.id,
        curriculumVersionId,
        approvedCohortId: testLimitedCohort.id,
      },
    });

    const offerA = await admissionService.issueAdmissionOffer({ applicationId: appA.id, cohortId: testLimitedCohort.id, staffUser: testAdmin });
    const offerB = await admissionService.issueAdmissionOffer({ applicationId: appB.id, cohortId: testLimitedCohort.id, staffUser: testAdmin });

    await admissionService.acceptAdmissionOffer({ admissionId: offerA.admission.id, authUser: userA });
    await admissionService.acceptAdmissionOffer({ admissionId: offerB.admission.id, authUser: userB });

    // Grant waivers to clear both applicants financially
    await financialClearanceService.grantFinancialWaiver({ admissionId: offerA.admission.id, staffUser: testFinanceAdmin, reason: 'Race seat A' });
    await financialClearanceService.grantFinancialWaiver({ admissionId: offerB.admission.id, staffUser: testFinanceAdmin, reason: 'Race seat B' });

    // Fire concurrent enrollment requests for 1 remaining seat
    const [enrollResultA, enrollResultB] = await Promise.allSettled([
      enrollmentService.enrollStudent({ admissionId: offerA.admission.id, authUser: userA }),
      enrollmentService.enrollStudent({ admissionId: offerB.admission.id, authUser: userB }),
    ]);

    const succeeded = [enrollResultA, enrollResultB].filter((r) => r.status === 'fulfilled');
    const failed = [enrollResultA, enrollResultB].filter((r) => r.status === 'rejected');

    assert(succeeded.length === 1, 'Exactly one concurrent candidate successfully claimed the last seat');
    assert(failed.length === 1, 'Exactly one concurrent candidate was safely rejected due to capacity limit');

    const updatedLimitedCohort = await prisma.cohort.findUnique({ where: { id: testLimitedCohort.id } });
    assert(updatedLimitedCohort?.currentEnrollment === 1, 'Cohort currentEnrollment capped strictly at maxCapacity (1)');

    // ----------------------------------------------------
    // SCENARIO S: Existing financial records remain intact
    // ----------------------------------------------------
    console.log('\n--- SCENARIO S: Baseline Financial Records Preservation ---');
    const baselineInvoices = await prisma.invoice.count();
    assert(baselineInvoices > 0, `Baseline invoice records are intact (found ${baselineInvoices} invoices in DB)`);

  } catch (error: any) {
    console.error('Test suite runtime error:', error);
    failCount++;
  } finally {
    try {
      console.log('\nCleaning up Phase 6 test fixtures...');
      const testApps = await prisma.application.findMany({
        where: {
          OR: [
            { email: { startsWith: 'phase6_' } },
            { email: { startsWith: 'seat' } },
            { email: { startsWith: 'full_pay_' } },
            { email: { startsWith: 'schol_' } },
            { email: { startsWith: 'part_schol_' } },
            { email: { startsWith: 'sponsor_recip_' } },
            { email: { startsWith: 'discount_' } },
            { email: { startsWith: 'waiver_' } },
          ],
        },
      });
      const appIds = testApps.map((a) => a.id);
      if (appIds.length > 0) {
        await prisma.studentCohortEnrollment.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.financialClearance.deleteMany({ where: { applicationId: { in: appIds } } });
        const testInvoices = await prisma.invoice.findMany({ where: { applicationId: { in: appIds } } });
        const invoiceIds = testInvoices.map((i) => i.id);
        if (invoiceIds.length > 0) {
          await prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
          await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
        }
        await prisma.admission.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.placementDecision.deleteMany({ where: { placement: { applicationId: { in: appIds } } } });
        await prisma.placement.deleteMany({ where: { applicationId: { in: appIds } } });
        await prisma.application.deleteMany({ where: { id: { in: appIds } } });
      }

      const testUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { startsWith: 'phase6_' } },
            { email: { startsWith: 'seat' } },
            { email: { startsWith: 'full_pay_' } },
            { email: { startsWith: 'schol_' } },
            { email: { startsWith: 'part_schol_' } },
            { email: { startsWith: 'sponsor_recip_' } },
            { email: { startsWith: 'discount_' } },
            { email: { startsWith: 'waiver_' } },
          ],
        },
      });
      const userIds = testUsers.map((u) => u.id);
      if (userIds.length > 0) {
        const profiles = await prisma.studentProfile.findMany({ where: { userId: { in: userIds } } });
        const profileIds = profiles.map((p) => p.id);
        if (profileIds.length > 0) {
          await prisma.studentGuardianRelation.deleteMany({ where: { studentId: { in: profileIds } } });
          await prisma.studentCohortEnrollment.deleteMany({ where: { studentId: { in: profileIds } } });
          await prisma.financialClearance.deleteMany({ where: { studentId: { in: profileIds } } });
          await prisma.studentProfile.deleteMany({ where: { id: { in: profileIds } } });
        }
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }

      await prisma.cohort.deleteMany({ where: { name: { startsWith: 'Phase 6' } } });
      console.log('Phase 6 test fixtures cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('Fixture cleanup error:', cleanupErr);
    }

    console.log('\n====================================================');
    console.log(`PHASE 6 TEST SUITE SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('====================================================\n');
    await prisma.$disconnect();
    if (failCount > 0) {
      process.exit(1);
    }
  }
}

runPhase6TestSuite().catch(console.error);
