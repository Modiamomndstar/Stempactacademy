import prisma from '../config/prisma.js';
import { academicService } from '../services/academicService.js';
import { WorkflowStatus, AcademicLevel, Role } from '@prisma/client';

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

async function runAcademicArchitectureVerification() {
  console.log('====================================================');
  console.log('STEMPACT ACADEMY: PHASE 4 ACADEMIC ARCHITECTURE TEST');
  console.log('====================================================\n');

  let testProgramId: string | null = null;
  let testCurriculumId: string | null = null;
  let testV1CohortId: string | null = null;
  let testV2CohortId: string | null = null;

  try {
    // 1. Establish and verify the canonical academic baseline
    console.log('1. Canonical Academic Baseline Initialization:');
    const baselineResult = await academicService.ensureBaselineAcademicHierarchy();
    console.log('    Baseline initialization summary:', JSON.stringify(baselineResult));
    assert(baselineResult.programsProcessed > 0, `Processed ${baselineResult.programsProcessed} programs into canonical structure`);
    assert(!!baselineResult.academicSessionId, `Active AcademicSession established: ${baselineResult.academicSessionId}`);

    // Verify Active Academic Session
    const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    assert(!!activeSession, `Current Academic Session found: ${activeSession?.name} (${activeSession?.code})`);

    // 2. Program Identity & Versioning
    console.log('\n2. Program & ProgramVersion Relationships:');
    const sampleProgram = await prisma.program.findFirst({
      where: { code: 'CSE-01' },
      include: {
        school: true,
        versions: { include: { curriculumVersion: true } },
        curricula: { include: { versions: true } },
        courses: { include: { modules: { include: { lessons: true } } } },
      },
    });
    assert(!!sampleProgram, 'Sample program CSE-01 retrieved');
    if (!sampleProgram) throw new Error('CSE-01 not found');

    assert(sampleProgram.code === 'CSE-01', 'Program code remains stable identity (CSE-01)');
    assert(sampleProgram.versions.length >= 1, `ProgramVersion exists for Program (count: ${sampleProgram.versions.length})`);

    const v1 = sampleProgram.versions.find((v) => v.versionNumber === 1);
    const v2 = sampleProgram.versions.find((v) => v.versionNumber === 2);
    assert(!!v1, 'ProgramVersion v1 exists');
    assert(v1?.programId === sampleProgram.id, 'ProgramVersion points directly to parent Program');
    assert(v1?.isCurrent === false, 'ProgramVersion v1 is historical (isCurrent=false)');
    assert(v2?.isCurrent === true, 'ProgramVersion v2 is current (isCurrent=true)');
    assert(!!v1?.curriculumVersionId, `ProgramVersion references CurriculumVersion: ${v1?.curriculumVersionId}`);

    // Verify a single-version program (CSE-02) has v1 as current
    const singleVersionProg = await prisma.program.findFirst({
      where: { code: 'CSE-02' },
      include: { versions: true },
    });
    assert(singleVersionProg?.versions.find(v => v.versionNumber === 1)?.isCurrent === true, 'Single-version Program CSE-02 has v1 as current');

    // 3. Curriculum & CurriculumVersion Architecture
    console.log('\n3. Curriculum & CurriculumVersion Hierarchy:');
    assert(sampleProgram.curricula.length >= 1, `Curriculum exists for Program (count: ${sampleProgram.curricula.length})`);
    const curriculum = sampleProgram.curricula[0];
    assert(curriculum.programId === sampleProgram.id, 'Curriculum belongs to correct Program');
    assert(curriculum.versions.length >= 1, `CurriculumVersion exists for Curriculum (count: ${curriculum.versions.length})`);

    const cv1 = curriculum.versions.find((cv) => cv.versionNumber === 1);
    assert(!!cv1, 'CurriculumVersion v1 exists');
    assert(cv1?.curriculumId === curriculum.id, 'CurriculumVersion belongs to correct Curriculum');
    assert(v1?.curriculumVersionId === cv1?.id, 'ProgramVersion resolves to matching CurriculumVersion');

    // 4. Course & Module Canonical Resolution
    console.log('\n4. Course & Module Structure Resolution:');
    const coursesWithCv = await prisma.course.findMany({
      where: { programId: sampleProgram.id },
      include: { curriculumVersion: true, modules: { include: { lessons: true } } },
    });
    assert(coursesWithCv.length > 0, `Courses exist for Program (count: ${coursesWithCv.length})`);
    const allCoursesMapped = coursesWithCv.every((c) => c.curriculumVersionId === cv1?.id);
    assert(allCoursesMapped, 'All Program courses reference canonical CurriculumVersion');
    assert(coursesWithCv[0].modules.length > 0, `Courses resolve down into Modules (count: ${coursesWithCv[0].modules.length})`);

    // Test canonical program resolution service method
    const canonicalProgram = await academicService.getCanonicalProgram('CSE-01');
    assert(!!canonicalProgram, 'academicService.getCanonicalProgram resolves successfully');
    assert(canonicalProgram?.activeVersion?.versionNumber === 2, 'Canonical active version for CSE-01 is v2');
    assert(canonicalProgram?.canonicalCourses.length === coursesWithCv.length, 'Canonical courses resolved through service');

    // 5. Cohort Canonical Academic Relationships
    console.log('\n5. Cohort Delivery Instance Relationships:');
    const cohorts = await prisma.cohort.findMany({
      where: { academicSessionId: { not: null } },
      include: { academicSession: true, programVersion: true, curriculumVersion: true, program: true },
    });
    assert(cohorts.length > 0, `Cohorts associated with Academic Session (count: ${cohorts.length})`);
    const sampleCohort = cohorts[0];
    assert(!!sampleCohort.academicSession, `Cohort resolves to AcademicSession: ${sampleCohort.academicSession?.name}`);
    assert(!!sampleCohort.programVersion, `Cohort resolves to ProgramVersion: v${sampleCohort.programVersion?.versionNumber}`);
    assert(!!sampleCohort.curriculumVersion, `Cohort resolves to CurriculumVersion: ${sampleCohort.curriculumVersion?.id}`);
    assert(sampleCohort.programId === sampleCohort.programVersion?.programId, 'Cohort programId matches ProgramVersion parent program');

    // 6. Multi-Versioning Coexistence & Historical Integrity
    console.log('\n6. Multi-Version Program Evolution & Historical Immutability:');
    // Create Version 2 for testing
    const adminUser = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
    const creatorId = adminUser?.id || sampleProgram.versions[0].createdById;

    // Create or retrieve Curriculum Version 2
    let cv2 = await prisma.curriculumVersion.findFirst({
      where: { curriculumId: curriculum.id, versionNumber: 2 },
    });
    if (!cv2) {
      cv2 = await academicService.createCurriculumVersion({
        curriculumId: curriculum.id,
        versionNumber: 2,
        changelog: 'Version 2.0 modernization: Advanced AI Integration',
        status: WorkflowStatus.APPROVED,
        createdById: creatorId,
        dataSnapshot: { notes: 'Updated module specs' },
      });
    }
    assert(!!cv2 && cv2.versionNumber === 2, `CurriculumVersion v2 confirmed: ${cv2?.id}`);

    // Create or retrieve ProgramVersion 2
    let pv2 = await prisma.programVersion.findFirst({
      where: { programId: sampleProgram.id, versionNumber: 2 },
    });
    if (!pv2) {
      pv2 = await academicService.createProgramVersion({
        programId: sampleProgram.id,
        versionNumber: 2,
        changelog: 'Program Revision 2.0 with GenAI track',
        status: WorkflowStatus.APPROVED,
        isCurrent: true,
        curriculumVersionId: cv2?.id,
        createdById: creatorId,
        dataSnapshot: { changes: 'Added AI specialization' },
      });
    }
    assert(!!pv2 && pv2.versionNumber === 2, `ProgramVersion v2 confirmed: ${pv2?.id}`);

    // Verify v1 and v2 coexist cleanly
    const allVersions = await prisma.programVersion.findMany({
      where: { programId: sampleProgram.id },
      orderBy: { versionNumber: 'asc' },
    });
    assert(allVersions.length >= 2, `Multiple versions coexist under same Program (count: ${allVersions.length})`);
    const pv1Refetched = allVersions.find((v) => v.versionNumber === 1);
    const pv2Refetched = allVersions.find((v) => v.versionNumber === 2);

    // Test 1: Only one current ProgramVersion can exist per Program
    const currentCount = await prisma.programVersion.count({
      where: { programId: sampleProgram.id, isCurrent: true },
    });
    assert(currentCount === 1, 'Only one current ProgramVersion exists per Program');

    // Test 2: Creating/activating a new current version deactivates the previous one
    assert(pv1Refetched?.isCurrent === false, 'ProgramVersion v1 is historical with isCurrent=false');
    assert(pv2Refetched?.isCurrent === true, 'ProgramVersion v2 is active current version with isCurrent=true');

    // Test 3: ensureBaselineAcademicHierarchy does not reactivate an older version
    await academicService.ensureBaselineAcademicHierarchy();
    const pv1AfterRebaseline = await prisma.programVersion.findUnique({ where: { id: pv1Refetched!.id } });
    assert(pv1AfterRebaseline?.isCurrent === false, 'ensureBaselineAcademicHierarchy() does not reactivate older version');
    const pv2AfterRebaseline = await prisma.programVersion.findUnique({ where: { id: pv2Refetched!.id } });
    assert(pv2AfterRebaseline?.isCurrent === true, 'Current version v2 remains active after rebaseline');

    // Test 4: Database partial unique constraint prevents duplicate current versions
    let constraintCaught = false;
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "ProgramVersion" SET "isCurrent" = true WHERE id = $1`,
        pv1Refetched!.id
      );
    } catch (err: any) {
      constraintCaught = true;
    }
    assert(constraintCaught, 'PostgreSQL partial unique index rejected duplicate isCurrent=true');

    // Verify historical cohorts remain pinned to their original version
    const cohortV1 = await prisma.cohort.create({
      data: {
        cohortCode: `TEST-C1-V1-${Date.now()}`,
        name: 'Historical Cohort (v1 curriculum)',
        programId: sampleProgram.id,
        programVersionId: pv1Refetched!.id,
        curriculumVersionId: cv1!.id,
        academicSessionId: activeSession!.id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        applicationDeadline: new Date('2024-12-15'),
        schedule: 'Weekdays',
      },
    });
    testV1CohortId = cohortV1.id;

    const cohortV2 = await prisma.cohort.create({
      data: {
        cohortCode: `TEST-C2-V2-${Date.now()}`,
        name: 'New Cohort (v2 curriculum)',
        programId: sampleProgram.id,
        programVersionId: pv2Refetched!.id,
        curriculumVersionId: cv2!.id,
        academicSessionId: activeSession!.id,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-02-28'),
        applicationDeadline: new Date('2026-08-15'),
        schedule: 'Weekdays',
      },
    });
    testV2CohortId = cohortV2.id;

    assert(cohortV1.programVersionId === pv1Refetched!.id, 'Historical Cohort remains bound to ProgramVersion v1');
    assert(cohortV2.programVersionId === pv2Refetched!.id, 'New Cohort is bound to ProgramVersion v2');

    // 7. Legacy Compatibility & Idempotency
    console.log('\n7. Legacy Compatibility & Idempotency:');
    // Legacy Program.courses relation
    const legacyProgram = await prisma.program.findUnique({
      where: { id: sampleProgram.id },
      include: { courses: true, cohorts: true },
    });
    assert(legacyProgram!.courses.length > 0, 'Legacy Program.courses query works seamlessly');
    assert(legacyProgram!.cohorts.length > 0, 'Legacy Program.cohorts query works seamlessly');

    // Idempotency: second run of ensureBaselineAcademicHierarchy must not duplicate
    const rebaseline = await academicService.ensureBaselineAcademicHierarchy();
    assert(rebaseline.curriculaCreated === 0, 'Idempotent: No duplicate curricula created on subsequent runs');
    assert(rebaseline.programVersionsCreated === 0, 'Idempotent: No duplicate program versions created on subsequent runs');

  } catch (err: any) {
    console.error('Academic Architecture verification error:', err);
    assert(false, 'Academic Architecture test suite threw an unhandled error', err.message);
  } finally {
    console.log('\nCleaning up multi-version test cohorts...');
    if (testV1CohortId) await prisma.cohort.delete({ where: { id: testV1CohortId } }).catch(() => {});
    if (testV2CohortId) await prisma.cohort.delete({ where: { id: testV2CohortId } }).catch(() => {});

    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAcademicArchitectureVerification();
