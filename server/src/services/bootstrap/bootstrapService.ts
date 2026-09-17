import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { Role, ProgramStatus, CohortStatus } from '@prisma/client';
import { schoolsData, programsData } from '../../seed/seedData.js';
import { ensureSuperAdminFromEnv } from '../../controllers/authController.js';

export interface BootstrapStatus {
  schoolCount: number;
  programCount: number;
  userCount: number;
  sessionCount: number;
  hasSuperAdmin: boolean;
  superAdminEmail?: string;
}

export class BootstrapService {
  /**
   * Check current count and state of database
   */
  static async getStatus(): Promise<BootstrapStatus> {
    const [schoolCount, programCount, userCount, sessionCount, superAdmin] = await Promise.all([
      prisma.school.count(),
      prisma.program.count(),
      prisma.user.count(),
      prisma.academicSession.count(),
      prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } }),
    ]);

    return {
      schoolCount,
      programCount,
      userCount,
      sessionCount,
      hasSuperAdmin: !!superAdmin,
      superAdminEmail: superAdmin?.email,
    };
  }

  /**
   * Automatically bootstrap database on initial deployment if 0 schools exist
   */
  static async autoBootstrapIfEmpty(): Promise<{ bootstrapped: boolean; message: string }> {
    try {
      // First ensure Super Admin account exists and is synchronized
      await ensureSuperAdminFromEnv();

      const schoolCount = await prisma.school.count();
      if (schoolCount > 0) {
        console.log(`ℹ️ [BOOTSTRAP] Database already contains ${schoolCount} schools. Skipping auto-seed.`);
        return { bootstrapped: false, message: `Database already populated with ${schoolCount} schools.` };
      }

      console.log('🌱 [BOOTSTRAP] Fresh/Empty database detected! Initiating automated STEMPACT Academy seed...');
      return await this.seedAll(false);
    } catch (error: any) {
      console.error('❌ [BOOTSTRAP ERROR] Auto-bootstrap failed:', error.message || error);
      return { bootstrapped: false, message: `Auto-bootstrap failed: ${error.message}` };
    }
  }

  /**
   * Seed all 8 Schools, 30+ Programs, Academic Sessions, Super Admin, and Demo Personas
   */
  static async seedAll(force: boolean = false): Promise<{ bootstrapped: boolean; message: string }> {
    console.log('🌱 Starting comprehensive STEMPACT ACADEMY seeding...');

    // 1. Create Academic Session
    let session = await prisma.academicSession.findFirst({
      where: { code: 'SES-2026' },
    });

    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          code: 'SES-2026',
          name: '2026/2027 Academic Session',
          startDate: new Date('2026-09-01'),
          endDate: new Date('2027-08-31'),
          isCurrent: true,
        },
      });
      console.log(`✔ Academic Session created: ${session.name}`);
    }

    // 2. Ensure Super Admin
    await ensureSuperAdminFromEnv();
    const superAdmin = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });

    // 3. Create Additional Administrative and Academic Personas
    const defaultPasswordHash = await bcrypt.hash('Admin123!', 10);
    const facultyPasswordHash = await bcrypt.hash('Instructor123!', 10);
    const studentPasswordHash = await bcrypt.hash('Student123!', 10);

    // Academic Admin
    const academicAdmin = await prisma.user.upsert({
      where: { email: 'academic@stempact.org' },
      update: {},
      create: {
        email: 'academic@stempact.org',
        username: 'academic.admin',
        passwordHash: defaultPasswordHash,
        firstName: 'Dr. Folashade',
        lastName: 'Adeleke',
        phone: '+234 802 234 5678',
        role: Role.ACADEMIC_ADMIN,
        isActive: true,
      },
    });

    // Admissions Admin
    await prisma.user.upsert({
      where: { email: 'admissions@stempact.org' },
      update: {},
      create: {
        email: 'admissions@stempact.org',
        username: 'admissions.admin',
        passwordHash: defaultPasswordHash,
        firstName: 'Kikelomo',
        lastName: 'Adebayo',
        phone: '+234 806 456 7891',
        role: Role.ADMISSIONS_ADMIN,
        isActive: true,
      },
    });

    // Finance Admin
    await prisma.user.upsert({
      where: { email: 'finance@stempact.org' },
      update: {},
      create: {
        email: 'finance@stempact.org',
        username: 'finance.admin',
        passwordHash: defaultPasswordHash,
        firstName: 'Oluwaseun',
        lastName: 'Balogun',
        phone: '+234 805 345 6789',
        role: Role.FINANCE_ADMIN,
        isActive: true,
      },
    });

    // Program Coordinator
    const coordinator = await prisma.user.upsert({
      where: { email: 'coordinator@stempact.org' },
      update: {},
      create: {
        email: 'coordinator@stempact.org',
        username: 'program.coord',
        passwordHash: defaultPasswordHash,
        firstName: 'Olumide',
        lastName: 'Fagbemi',
        phone: '+234 807 567 8912',
        role: Role.PROGRAM_COORDINATOR,
        isActive: true,
      },
    });

    await prisma.coordinatorProfile.upsert({
      where: { userId: coordinator.id },
      update: {},
      create: {
        userId: coordinator.id,
        staffCode: 'STP-COORD-001',
        department: 'Software Engineering & Junior STEM Programs',
        assignedSchools: JSON.stringify(['CSE', 'SKT']),
        assignedPrograms: JSON.stringify(['CSE-01', 'CSE-02', 'AIDM-01']),
      },
    });

    // Instructor
    const instructor = await prisma.user.upsert({
      where: { email: 'instructor@stempact.org' },
      update: {},
      create: {
        email: 'instructor@stempact.org',
        username: 'damilola.adeyemi',
        passwordHash: facultyPasswordHash,
        firstName: 'Engr. Damilola',
        lastName: 'Adeyemi',
        phone: '+234 814 456 7890',
        role: Role.INSTRUCTOR,
        isActive: true,
      },
    });

    await prisma.instructorProfile.upsert({
      where: { userId: instructor.id },
      update: {},
      create: {
        userId: instructor.id,
        staffCode: 'INS-2026-001',
        specialization: 'Full-Stack Software Architecture & Cloud Computing',
        qualification: 'M.Sc Computer Engineering, Obafemi Awolowo University',
        bio: 'Senior Software Engineer with 8+ years experience building fintech products and mentoring developers in Ile-Ife.',
        assignedSchools: JSON.stringify(['School of Computing and Software Engineering']),
      },
    });

    // Demo Student
    const studentUser = await prisma.user.upsert({
      where: { email: 'student@stempact.org' },
      update: {},
      create: {
        email: 'student@stempact.org',
        username: 'student.ayomide',
        passwordHash: studentPasswordHash,
        firstName: 'Ayomide',
        lastName: 'Adekunle',
        phone: '+234 809 123 4567',
        role: Role.STUDENT,
        isActive: true,
      },
    });

    await prisma.studentProfile.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        studentIdNumber: 'STP-2026-0001',
        currentLevel: 'Foundation',
        enrollmentDate: new Date(),
        status: 'ACTIVE',
      },
    });

    // Demo Parent
    const parentUser = await prisma.user.upsert({
      where: { email: 'parent@stempact.org' },
      update: {},
      create: {
        email: 'parent@stempact.org',
        username: 'parent.adekunle',
        passwordHash: defaultPasswordHash,
        firstName: 'Mrs. Funke',
        lastName: 'Adekunle',
        phone: '+234 803 987 6543',
        role: Role.PARENT,
        isActive: true,
      },
    });

    await prisma.parentProfile.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: {
        userId: parentUser.id,
        relationship: 'Mother',
        emergencyContact: '+234 803 987 6543',
      },
    });

    // 4. Seed 8 Schools
    const schoolMap = new Map<string, string>();

    for (const s of schoolsData) {
      const school = await prisma.school.upsert({
        where: { code: s.code },
        update: {
          name: s.name,
          description: s.description,
          color: s.color,
          icon: s.icon,
          order: s.order,
        },
        create: {
          code: s.code,
          name: s.name,
          description: s.description,
          color: s.color,
          icon: s.icon,
          order: s.order,
        },
      });
      schoolMap.set(s.code, school.id);
    }
    console.log(`✔ ${schoolMap.size} STEM Schools seeded.`);

    // 5. Seed 30+ Programs
    let programsCreated = 0;
    for (const p of programsData) {
      const schoolId = schoolMap.get(p.schoolCode);
      if (!schoolId) continue;

      const program = await prisma.program.upsert({
        where: { code: p.code },
        update: {
          name: p.name,
          description: p.description,
          targetLearner: p.targetLearner,
          entryRequirements: p.entryRequirements,
          prerequisites: p.prerequisites,
          duration: p.duration,
          contactHours: p.contactHours,
          learningLevels: p.learningLevels,
          tools: p.tools,
          projects: p.projects,
          capstone: p.capstone,
          assessmentCriteria: p.assessmentCriteria,
          competencies: p.competencies,
          certification: p.certification,
          careerPathways: p.careerPathways,
          progressionPathway: p.progressionPathway,
          status: p.status as ProgramStatus,
          isFeatured: p.isFeatured,
          schoolId,
        },
        create: {
          code: p.code,
          name: p.name,
          description: p.description,
          targetLearner: p.targetLearner,
          entryRequirements: p.entryRequirements,
          prerequisites: p.prerequisites,
          duration: p.duration,
          contactHours: p.contactHours,
          learningLevels: p.learningLevels,
          tools: p.tools,
          projects: p.projects,
          capstone: p.capstone,
          assessmentCriteria: p.assessmentCriteria,
          competencies: p.competencies,
          certification: p.certification,
          careerPathways: p.careerPathways,
          progressionPathway: p.progressionPathway,
          status: p.status as ProgramStatus,
          isFeatured: p.isFeatured,
          schoolId,
        },
      });

      // If program has no cohorts, seed a starter cohort
      const existingCohort = await prisma.cohort.findFirst({ where: { programId: program.id } });
      if (!existingCohort) {
        await prisma.cohort.create({
          data: {
            programId: program.id,
            name: `${p.code} - Cohort 1 (Alpha 2026)`,
            cohortCode: `${p.code}-2026-A`,
            startDate: new Date('2026-10-05'),
            endDate: new Date('2026-12-18'),
            maxCapacity: 35,
            currentEnrollment: 12,
            trainingFee: 65000,
            registrationFee: 5000,
            certificationFee: 10000,
            applicationDeadline: new Date('2026-09-28'),
            schedule: 'Mon, Wed, Fri (4:00 PM – 7:00 PM) & Saturdays (10:00 AM – 1:00 PM)',
            status: CohortStatus.OPEN,
            mode: 'Hybrid (Onsite Ile-Ife Hub & Online)',
            location: 'STEMPACT Campus Hub, Ile-Ife, Osun State',
            level: 'Level 1: Foundation',
          },
        });
      }

      programsCreated++;
    }
    console.log(`✔ ${programsCreated} Academic Programs & Cohorts seeded.`);

    // 6. Seed Announcement
    await prisma.announcement.create({
      data: {
        title: 'Welcome to STEMPACT Academy OS — 2026/2027 Academic Session',
        content: 'Admissions and placement examinations are now open across all 8 Schools. Practical hands-on training commences in Ile-Ife campus labs and virtual classrooms.',
        targetAudience: 'ALL',
        priority: 'HIGH',
      },
    });

    console.log('🎉 STEMPACT ACADEMY database seeded successfully!');
    return {
      bootstrapped: true,
      message: `Successfully seeded ${schoolMap.size} Schools, ${programsCreated} Programs, Academic Session, and Accounts!`,
    };
  }
}
