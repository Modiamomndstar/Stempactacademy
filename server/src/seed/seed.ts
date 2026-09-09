import { PrismaClient, Role, ProgramStatus, CohortStatus, CertificateType, AttendanceStatus, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { schoolsData, programsData } from './seedData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting STEMPACT ACADEMY database seeding...');

  // 1. Clean existing data
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "PartnerProfile", "CoordinatorProfile", "SponsoredStudent", "Notification", "AuditLog", "CounselingRecord", "CompetitionTeam", "TeamMember", "Competition", "RolePermission", "Partner", "Testimonial", "BlogPost", "Event", "Announcement", "Certificate", "Payment", "Invoice", "StudentCompetency", "ProjectMember", "Project", "Submission", "Assignment", "Attendance", "ClassSession", "InstructorProfile", "ParentProfile", "StudentProfile", "Admission", "Placement", "AssessmentAttempt", "AssessmentQuestion", "Assessment", "Application", "Cohort", "Competency", "Lesson", "Module", "Course", "Program", "School", "User" CASCADE;`);

  console.log('🧹 Cleaned existing database tables.');

  // 2. Seed Users & Profiles across all 14 Institutional Personas
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const academicHash = await bcrypt.hash('Academic123!', 10);
  const financeHash = await bcrypt.hash('Finance123!', 10);
  const admissionsHash = await bcrypt.hash('Admissions123!', 10);
  const coordinatorHash = await bcrypt.hash('Coordinator123!', 10);
  const instructorHash = await bcrypt.hash('Instructor123!', 10);
  const studentHash = await bcrypt.hash('Student123!', 10);
  const parentHash = await bcrypt.hash('Parent123!', 10);
  const counselorHash = await bcrypt.hash('Counselor123!', 10);
  const contentHash = await bcrypt.hash('Content123!', 10);
  const innovationHash = await bcrypt.hash('Innovation123!', 10);
  const marketingHash = await bcrypt.hash('Marketing123!', 10);
  const partnerHash = await bcrypt.hash('Partner123!', 10);
  const applicantHash = await bcrypt.hash('Applicant123!', 10);

  // 1. Super Administrator
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@stempact.org',
      username: 'superadmin',
      passwordHash: adminHash,
      firstName: 'Babatunde',
      lastName: 'Olatunji',
      phone: '+234 803 123 4567',
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Academic Administrator
  const academicAdmin = await prisma.user.create({
    data: {
      email: 'academic@stempact.org',
      username: 'academic.admin',
      passwordHash: academicHash,
      firstName: 'Dr. Folashade',
      lastName: 'Adeleke',
      phone: '+234 802 234 5678',
      role: Role.ACADEMIC_ADMIN,
    },
  });

  // 3. Finance Administrator
  const financeAdmin = await prisma.user.create({
    data: {
      email: 'finance@stempact.org',
      username: 'finance.admin',
      passwordHash: financeHash,
      firstName: 'Oluwaseun',
      lastName: 'Balogun',
      phone: '+234 805 345 6789',
      role: Role.FINANCE_ADMIN,
    },
  });

  // 4. Admissions Administrator
  const admissionsAdmin = await prisma.user.create({
    data: {
      email: 'admissions@stempact.org',
      username: 'admissions.admin',
      passwordHash: admissionsHash,
      firstName: 'Kikelomo',
      lastName: 'Adebayo',
      phone: '+234 806 456 7891',
      role: Role.ADMISSIONS_ADMIN,
    },
  });

  // 5. Program Coordinator
  const coordinatorUser = await prisma.user.create({
    data: {
      email: 'coordinator@stempact.org',
      username: 'program.coord',
      passwordHash: coordinatorHash,
      firstName: 'Olumide',
      lastName: 'Fagbemi',
      phone: '+234 807 567 8912',
      role: Role.PROGRAM_COORDINATOR,
    },
  });

  await prisma.coordinatorProfile.create({
    data: {
      userId: coordinatorUser.id,
      staffCode: 'STP-COORD-001',
      department: 'Software Engineering & Junior STEM Programs',
      assignedSchools: JSON.stringify(['CSE', 'KTS']),
      assignedPrograms: JSON.stringify(['FSWD-01', 'AI-ML-01', 'KIDS-STEM-01']),
    },
  });

  // 6. Faculty Instructor
  const instructorUser = await prisma.user.create({
    data: {
      email: 'instructor@stempact.org',
      username: 'damilola.adeyemi',
      passwordHash: instructorHash,
      firstName: 'Engr. Damilola',
      lastName: 'Adeyemi',
      phone: '+234 814 456 7890',
      role: Role.INSTRUCTOR,
    },
  });

  const instructorProfile = await prisma.instructorProfile.create({
    data: {
      userId: instructorUser.id,
      staffCode: 'STP-FAC-001',
      bio: 'Senior Embedded Systems & Full-Stack Engineer with 8+ years experience in IoT architectures and distributed systems.',
      specialization: 'Full-Stack Software Engineering & IoT Systems',
      qualification: 'M.Sc. Computer Engineering (OAU, Ile-Ife)',
      assignedSchools: JSON.stringify(['CSE', 'RIOTH']),
    },
  });

  // 7. Student Learner
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@stempact.org',
      username: 'toluwalase',
      passwordHash: studentHash,
      firstName: 'Toluwalase',
      lastName: 'Ogunbiyi',
      phone: '+234 816 567 8901',
      role: Role.STUDENT,
    },
  });

  // 8. Parent / Guardian
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@stempact.org',
      username: 'funke.parent',
      passwordHash: parentHash,
      firstName: 'Mrs. Funke',
      lastName: 'Ogunbiyi',
      phone: '+234 809 678 9012',
      role: Role.PARENT,
    },
  });

  const parentProfile = await prisma.parentProfile.create({
    data: {
      userId: parentUser.id,
      relationship: 'Mother',
      emergencyContact: '+234 809 678 9012',
      address: 'Plot 12, Road 7, Ede Road, Ile-Ife, Osun State',
    },
  });

  // 9. Student Counselor
  const counselorUser = await prisma.user.create({
    data: {
      email: 'counselor@stempact.org',
      username: 'counselor.support',
      passwordHash: counselorHash,
      firstName: 'Ayomide',
      lastName: 'Olayinka',
      phone: '+234 808 789 0123',
      role: Role.COUNSELOR,
    },
  });

  // 10. Content & LMS Manager
  const contentUser = await prisma.user.create({
    data: {
      email: 'content@stempact.org',
      username: 'content.lms',
      passwordHash: contentHash,
      firstName: 'Zainab',
      lastName: 'Mustapha',
      phone: '+234 811 890 1234',
      role: Role.CONTENT_MANAGER,
    },
  });

  // 11. Innovation & Competition Manager
  const innovationUser = await prisma.user.create({
    data: {
      email: 'innovation@stempact.org',
      username: 'innovation.mgr',
      passwordHash: innovationHash,
      firstName: 'Chukwudi',
      lastName: 'Eze',
      phone: '+234 813 901 2345',
      role: Role.INNOVATION_MANAGER,
    },
  });

  // 12. Marketing & Communications Manager
  const marketingUser = await prisma.user.create({
    data: {
      email: 'marketing@stempact.org',
      username: 'marketing.comms',
      passwordHash: marketingHash,
      firstName: 'Simisola',
      lastName: 'Ajayi',
      phone: '+234 815 012 3456',
      role: Role.MARKETING_MANAGER,
    },
  });

  // 13. Corporate / NGO Partner
  const partnerUser = await prisma.user.create({
    data: {
      email: 'partner@stempact.org',
      username: 'apex.csr',
      passwordHash: partnerHash,
      firstName: 'Apex CleanTech',
      lastName: 'Foundation',
      phone: '+234 802 987 6543',
      role: Role.PARTNER,
    },
  });

  const partnerProfile = await prisma.partnerProfile.create({
    data: {
      userId: partnerUser.id,
      organizationName: 'Apex CleanTech & Renewable Energy Foundation',
      partnerType: 'CORPORATE',
      contactPhone: '+234 802 987 6543',
      mouDetails: 'Sponsorship of 10 disadvantaged youth scholars in Southwest Nigeria with 100% tuition coverage, solar lab hardware toolkits, and internship placement upon completion.',
      grantBudget: 1500000,
      activeSponsorships: 1,
    },
  });

  // 14. Prospective Applicant
  const applicantUser = await prisma.user.create({
    data: {
      email: 'applicant@stempact.org',
      username: 'candidate.john',
      passwordHash: applicantHash,
      firstName: 'John',
      lastName: 'Adebisi',
      phone: '+234 818 123 4567',
      role: Role.APPLICANT,
    },
  });

  console.log('✅ Created all 14 institutional persona accounts and profiles.');

  // 3. Seed Schools
  const schoolMap = new Map<string, string>();
  for (const s of schoolsData) {
    const created = await prisma.school.create({
      data: {
        code: s.code,
        name: s.name,
        description: s.description,
        color: s.color,
        icon: s.icon,
        order: s.order,
      },
    });
    schoolMap.set(s.code, created.id);
  }
  console.log(`✅ Seeded ${schoolsData.length} Academic Schools.`);

  // 4. Seed Programs
  const programMap = new Map<string, string>();
  for (const p of programsData) {
    const schoolId = schoolMap.get(p.schoolCode);
    if (!schoolId) continue;

    const created = await prisma.program.create({
      data: {
        code: p.code,
        name: p.name,
        schoolId: schoolId,
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
      },
    });
    programMap.set(p.code, created.id);

    // Create course and modules outline for primary programs
    const course1 = await prisma.course.create({
      data: {
        programId: created.id,
        code: `${p.code}-C101`,
        title: `${p.name} - Core Foundations`,
        description: `Foundational principles, core syntax, environment setup, and problem decomposition.`,
        order: 1,
      },
    });

    await prisma.module.create({
      data: {
        courseId: course1.id,
        title: 'Module 1: Orientation, Setup & Fundamental Concepts',
        description: 'Development environment setup, version control with Git, and foundational syntax.',
        durationHours: 12,
        order: 1,
      },
    });

    await prisma.module.create({
      data: {
        courseId: course1.id,
        title: 'Module 2: Practical Implementation & Mini-Project',
        description: 'Hands-on guided builds, component assembly, and testing workflows.',
        durationHours: 16,
        order: 2,
      },
    });

    const course2 = await prisma.course.create({
      data: {
        programId: created.id,
        code: `${p.code}-C201`,
        title: `${p.name} - Advanced Engineering & Capstone`,
        description: `Production patterns, real-world constraints, capstone build, and defense.`,
        order: 2,
      },
    });

    await prisma.module.create({
      data: {
        courseId: course2.id,
        title: 'Module 3: Architecture & System Integration',
        description: 'Optimization, security protocols, external API integration, and edge cases.',
        durationHours: 20,
        order: 1,
      },
    });

    await prisma.module.create({
      data: {
        courseId: course2.id,
        title: 'Module 4: Capstone Execution & Defense',
        description: 'End-to-end realization of the capstone project with public showcase defense.',
        durationHours: 24,
        order: 2,
      },
    });
  }
  console.log(`✅ Seeded ${programsData.length} Academic Programs with Course & Module outlines.`);

  // 5. Seed Cohorts (Active, Open, and Upcoming)
  const fseProgramId = programMap.get('CSE-04')!;
  const wdProgramId = programMap.get('CSE-02')!;
  const daProgramId = programMap.get('AIDM-01')!;
  const robProgramId = programMap.get('RIOTH-01')!;
  const solProgramId = programMap.get('RETE-01')!;
  const aiProgramId = programMap.get('AIDM-04')!;
  const kidProgramId = programMap.get('SKT-04')!;
  const labProgramId = programMap.get('ISL-04')!;

  const now = new Date();
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

  const cohortFSE = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-FSE',
      name: 'Full-Stack Software Engineering - Alpha Cohort',
      programId: fseProgramId,
      level: 'Level 1 to Level 3 Immersive',
      startDate: addDays(now, 14),
      endDate: addDays(now, 180),
      applicationDeadline: addDays(now, 7),
      schedule: 'Mondays, Wednesdays, Fridays (4:00 PM – 7:00 PM WAT)',
      mode: 'Hybrid (Onsite Ile-Ife & Virtual Interactive)',
      location: 'STEMPACT Innovation Hub, 14 Fajuyi Road, Ile-Ife, Osun State',
      instructorName: 'Engr. Damilola Adeyemi & Lead Tech Faculty',
      maxCapacity: 25,
      currentEnrollment: 18,
      trainingFee: 85000,
      registrationFee: 5000,
      certificationFee: 10000,
      discountPercentage: 10,
      status: CohortStatus.OPEN,
    },
  });

  const cohortWD = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-WD',
      name: 'Web Development Accelerator - Sprint 1',
      programId: wdProgramId,
      level: 'Level 1: Foundation to Modern Web',
      startDate: addDays(now, 10),
      endDate: addDays(now, 66),
      applicationDeadline: addDays(now, 4),
      schedule: 'Tuesdays, Thursdays (4:30 PM – 7:00 PM) & Saturdays (10:00 AM – 1:00 PM)',
      mode: 'Hybrid (Onsite Ile-Ife Hub & Online)',
      location: 'STEMPACT Campus Hub, Ile-Ife, Osun State',
      instructorName: 'Mr. Kehinde Ayodeji',
      maxCapacity: 20,
      currentEnrollment: 17,
      trainingFee: 65000,
      registrationFee: 5000,
      certificationFee: 10000,
      discountPercentage: 0,
      status: CohortStatus.ALMOST_FULL,
    },
  });

  const cohortDA = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-DA',
      name: 'Data Analytics & Power BI Executive Cohort',
      programId: daProgramId,
      level: 'Level 1: Excel & Relational SQL to Power BI',
      startDate: addDays(now, 21),
      endDate: addDays(now, 77),
      applicationDeadline: addDays(now, 14),
      schedule: 'Saturdays (9:00 AM – 1:00 PM) & Sundays (2:00 PM – 5:00 PM)',
      mode: 'Hybrid / Weekend Executive',
      location: 'STEMPACT Executive Lab, Ile-Ife, Osun State',
      instructorName: 'Mrs. Yetunde Alabi',
      maxCapacity: 30,
      currentEnrollment: 12,
      trainingFee: 75000,
      registrationFee: 5000,
      certificationFee: 10000,
      discountPercentage: 15,
      status: CohortStatus.OPEN,
    },
  });

  const cohortRobotics = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-ROB',
      name: 'Robotics, Microcontrollers & Automation Lab 1',
      programId: robProgramId,
      level: 'Level 1: Actuators, Sensors & Embedded Code',
      startDate: addDays(now, 25),
      endDate: addDays(now, 120),
      applicationDeadline: addDays(now, 18),
      schedule: 'Wednesdays (3:00 PM – 6:00 PM) & Saturdays (10:00 AM – 2:00 PM)',
      mode: 'Onsite Laboratory Intensive',
      location: 'STEMPACT Robotics & Hardware Lab, Ile-Ife',
      instructorName: 'Engr. Damilola Adeyemi',
      maxCapacity: 16,
      currentEnrollment: 9,
      trainingFee: 95000,
      registrationFee: 5000,
      certificationFee: 15000,
      discountPercentage: 0,
      status: CohortStatus.OPEN,
    },
  });

  const cohortSolar = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-SOL',
      name: 'Solar PV Installation & Clean Energy Practice',
      programId: solProgramId,
      level: 'Vocational Technical & Field Practicum',
      startDate: addDays(now, 14),
      endDate: addDays(now, 70),
      applicationDeadline: addDays(now, 8),
      schedule: 'Mondays & Thursdays (9:00 AM – 1:00 PM Field Work)',
      mode: 'Onsite Workshop & Field Apprenticeship',
      location: 'STEMPACT Technical Energy Yard, Ile-Ife, Osun State',
      instructorName: 'Engr. T. O. Fashanu',
      maxCapacity: 20,
      currentEnrollment: 14,
      trainingFee: 70000,
      registrationFee: 5000,
      certificationFee: 10000,
      discountPercentage: 0,
      status: CohortStatus.OPEN,
    },
  });

  const cohortGenAI = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-GAI',
      name: 'Generative AI & Agentic Application Studio',
      programId: aiProgramId,
      level: 'Intermediate to Advanced',
      startDate: addDays(now, 28),
      endDate: addDays(now, 98),
      applicationDeadline: addDays(now, 20),
      schedule: 'Tuesdays & Fridays (5:00 PM – 7:30 PM WAT)',
      mode: 'Hybrid (Virtual Interactive + Onsite Demo Sprints)',
      location: 'STEMPACT AI Hub, Ile-Ife & Global Stream',
      instructorName: 'Dr. Folashade Adeleke',
      maxCapacity: 25,
      currentEnrollment: 11,
      trainingFee: 85000,
      registrationFee: 5000,
      certificationFee: 10000,
      discountPercentage: 10,
      status: CohortStatus.OPEN,
    },
  });

  const cohortKids = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-KID',
      name: 'Young Robotics & Young Makers Club (Teens & Kids)',
      programId: kidProgramId,
      level: 'Ages 8 to 15 Years',
      startDate: addDays(now, 12),
      endDate: addDays(now, 82),
      applicationDeadline: addDays(now, 6),
      schedule: 'Saturdays (10:00 AM – 1:00 PM Weekend Fun Lab)',
      mode: 'Onsite Discovery Hub',
      location: 'STEMPACT Kids Maker Space, Ile-Ife',
      instructorName: 'Miss Blessing Oladipo',
      maxCapacity: 15,
      currentEnrollment: 10,
      trainingFee: 45000,
      registrationFee: 3000,
      certificationFee: 5000,
      discountPercentage: 0,
      status: CohortStatus.OPEN,
    },
  });

  const cohortStartup = await prisma.cohort.create({
    data: {
      cohortCode: 'STP-2025-C1-SLAB',
      name: 'STEMPACT Startup Lab Incubator - Batch 1',
      programId: labProgramId,
      level: 'Founders, Product Teams & Engineers',
      startDate: addDays(now, 35),
      endDate: addDays(now, 175),
      applicationDeadline: addDays(now, 24),
      schedule: 'Weekly Sprint Standups & Saturday Founder Mentorship Sessions',
      mode: 'Hybrid Venture Studio',
      location: 'STEMPACT Innovation Lab & OAU Tech Corridor',
      instructorName: 'Academy Advisory Board & Visiting Venture Partners',
      maxCapacity: 12,
      currentEnrollment: 5,
      trainingFee: 120000,
      registrationFee: 10000,
      certificationFee: 20000,
      discountPercentage: 20,
      status: CohortStatus.OPEN,
    },
  });

  console.log('✅ Seeded 8 Current Cohorts with real schedules, pricing, and deadlines.');

  // 6. Seed Student Profile for Demo Student
  const studentProfile = await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      studentIdNumber: 'STP-2025-0142',
      guardianId: parentProfile.id,
      currentCohortId: cohortFSE.id,
      currentLevel: 'Level 1 (Foundation)',
      completionRate: 68.0,
      attendanceRate: 92.5,
      status: 'ACTIVE',
    },
  });

  // 7. Seed Class Sessions and Attendance for the Student
  const session1 = await prisma.classSession.create({
    data: {
      cohortId: cohortFSE.id,
      instructorId: instructorProfile.id,
      title: 'Full-Stack Architecture & TypeScript Systems',
      date: addDays(now, -14),
      startTime: '16:00',
      endTime: '19:00',
      topic: 'Introduction to Monorepos, Typed APIs, and PostgreSQL Schema Modeling',
      room: 'Turing Computer Lab - Floor 1',
    },
  });

  const session2 = await prisma.classSession.create({
    data: {
      cohortId: cohortFSE.id,
      instructorId: instructorProfile.id,
      title: 'REST APIs & JWT Security Implementation',
      date: addDays(now, -10),
      startTime: '16:00',
      endTime: '19:00',
      topic: 'Role-Based Authorization Guards, Password Salting, and Token Verification',
      room: 'Turing Computer Lab - Floor 1',
    },
  });

  const session3 = await prisma.classSession.create({
    data: {
      cohortId: cohortFSE.id,
      instructorId: instructorProfile.id,
      title: 'Database Relations & Query Optimization',
      date: addDays(now, -7),
      startTime: '16:00',
      endTime: '19:00',
      topic: 'Prisma ORM Foreign Keys, Indexing, and Safe Migrations',
      room: 'Turing Computer Lab - Floor 1',
    },
  });

  const session4 = await prisma.classSession.create({
    data: {
      cohortId: cohortFSE.id,
      instructorId: instructorProfile.id,
      title: 'React State Management & Tailwind Styling',
      date: addDays(now, -3),
      startTime: '16:00',
      endTime: '19:00',
      topic: 'Context API, Custom Hooks, and Mobile Responsive Dashboard Views',
      room: 'Turing Computer Lab - Floor 1',
    },
  });

  await prisma.attendance.createMany({
    data: [
      { classSessionId: session1.id, studentId: studentProfile.id, status: AttendanceStatus.PRESENT, markedById: instructorUser.id },
      { classSessionId: session2.id, studentId: studentProfile.id, status: AttendanceStatus.PRESENT, markedById: instructorUser.id },
      { classSessionId: session3.id, studentId: studentProfile.id, status: AttendanceStatus.LATE, remarks: 'Arrived 15 mins late due to interstate transit', markedById: instructorUser.id },
      { classSessionId: session4.id, studentId: studentProfile.id, status: AttendanceStatus.PRESENT, markedById: instructorUser.id },
    ],
  });

  // 8. Seed Assignment & Submission
  const assignment1 = await prisma.assignment.create({
    data: {
      cohortId: cohortFSE.id,
      title: 'Sprint 1: Build a Secure REST API with Role-Based Access Control',
      description: 'Implement an Express.js backend that registers users, hashes passwords with bcrypt, issues JWT tokens, and protects administrative endpoints with role middleware.',
      dueDate: addDays(now, 5),
      maxPoints: 100,
    },
  });

  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: studentProfile.id,
      userId: studentUser.id,
      content: 'Repository link: https://github.com/stempact-student/secure-auth-api. Includes postman collection, Dockerfile, and unit test suite.',
      grade: 94.0,
      feedback: 'Outstanding implementation of JWT guards and password salting. Excellent error response formatting.',
      gradedAt: addDays(now, -1),
    },
  });

  // 9. Seed Projects & Public Showcase
  const project1 = await prisma.project.create({
    data: {
      cohortId: cohortFSE.id,
      programId: fseProgramId,
      title: 'Ife-Transit: Real-Time Campus Commuter & Shuttle Tracker',
      description: 'A full-stack progressive web application connecting campus shuttle drivers and student commuters in Ile-Ife with real-time GPS tracking and cashless QR fare payment.',
      category: 'Software Engineering',
      skills: 'React, TypeScript, Node.js, WebSockets, Leaflet Maps, Tailwind CSS',
      tools: 'PostgreSQL, Express, Vite, Docker, Render',
      githubUrl: 'https://github.com/stempact/ife-transit-app',
      liveDemoUrl: 'https://ife-transit-demo.stempact.org',
      score: 96.0,
      feedback: 'Highly practical local innovation with great UX and low-bandwidth optimization.',
      isFeaturedPublic: true,
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      studentId: studentProfile.id,
      role: 'Full-Stack Lead & Architecture',
    },
  });

  await prisma.project.create({
    data: {
      cohortId: cohortRobotics.id,
      programId: robProgramId,
      title: 'AgriSense: Autonomous Crop Pest & Moisture Telemetry Rover',
      description: 'An autonomous field rover equipped with solar harvesting, soil moisture probes, and an edge AI camera module that detects early armyworm infestation on maize farms.',
      category: 'Robotics & Hardware',
      skills: 'Embedded C++, ROS2, Computer Vision, PCB Design, 3D CAD',
      tools: 'ESP32, Raspberry Pi 4, KiCad, Fusion 360, Solar MPPT',
      githubUrl: 'https://github.com/stempact/agrisense-rover',
      liveDemoUrl: 'https://agrisense.stempact.org',
      score: 98.0,
      feedback: 'Winner of 2025 Osun State CleanTech Innovation Award.',
      isFeaturedPublic: true,
    },
  });

  await prisma.project.create({
    data: {
      cohortId: cohortSolar.id,
      programId: solProgramId,
      title: 'Smart Solar Microgrid Energy Controller with GSM Telemetry',
      description: 'An intelligent automated changeover and battery protection system that balances municipal grid power, solar arrays, and deep cycle battery life with instant SMS alerts.',
      category: 'Renewable Energy',
      skills: 'Power Electronics, Microcontroller Logic, Energy Auditing',
      tools: 'Hybrid Inverters, PZEM Power Sensors, GSM Sim800L, LiFePO4 BMS',
      isFeaturedPublic: true,
      score: 93.0,
      feedback: 'Extremely durable hardware build designed for Nigerian voltage fluctuations.',
    },
  });

  // 10. Seed Official Verified Certificate
  await prisma.certificate.create({
    data: {
      certificateNumber: 'STP-2027-0001',
      studentId: studentProfile.id,
      studentName: 'Toluwalase Ogunbiyi',
      programName: 'Full-Stack Software Engineering',
      certificateType: CertificateType.PROFESSIONAL,
      achievement: 'Passed with Distinction (Overall Aggregate: 94.2%)',
      issueDate: new Date('2025-06-30'),
      verified: true,
      verificationCode: 'STP-VERIFY-998822',
      signers: JSON.stringify([
        { name: 'Dr. Folashade Adeleke', title: 'Director of Academic Affairs' },
        { name: 'Engr. Damilola Adeyemi', title: 'Lead Faculty Instructor' },
        { name: 'Babatunde Olatunji', title: 'President & Executive Director' },
      ]),
    },
  });

  // 11. Seed Invoices and Payment records
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-0042',
      studentId: studentProfile.id,
      title: 'Tuition & Laboratory Enrollment - Full-Stack Software Engineering',
      totalAmount: 100000,
      amountPaid: 100000,
      balance: 0,
      dueDate: addDays(now, -20),
      status: 'PAID',
      items: JSON.stringify([
        { item: 'Training & Instruction Fee', amount: 85000 },
        { item: 'Registration & Portal Credential', amount: 5000 },
        { item: 'Laboratory & Cloud Workbench Kit', amount: 10000 },
      ]),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      paymentReference: 'PAY-STP-202508-449102',
      amount: 100000,
      currency: 'NGN',
      channel: 'PAYSTACK',
      status: 'PAID',
      paidAt: addDays(now, -22),
      receiptUrl: '/receipts/REC-PAY-STP-202508-449102.pdf',
      metadata: JSON.stringify({
        payerName: 'Mrs. Funke Ogunbiyi',
        gateway: 'Paystack Automated Web Checkout',
        bank: 'Access Bank Nigeria PLC',
      }),
    },
  });

  // 12. Seed Online Assessment and Question Bank
  const assessment = await prisma.assessment.create({
    data: {
      title: 'STEMPACT General STEM & Technical Diagnostic Placement Test',
      programId: fseProgramId,
      durationMinutes: 30,
      passingScore: 60,
      instructions: 'This diagnostic assessment measures your digital readiness, mathematical reasoning, computational logic, and problem solving skills to recommend your ideal starting level.',
    },
  });

  const questions = [
    {
      category: 'DIGITAL_LITERACY',
      type: 'MULTIPLE_CHOICE',
      prompt: 'Which of the following best describes the primary function of an Operating System kernel?',
      options: JSON.stringify([
        'Rendering web pages in a browser',
        'Managing hardware resources and mediating system calls between software and hardware',
        'Compiling high-level programming languages into machine code',
        'Serving as a cloud storage backup provider',
      ]),
      correctAnswer: 'Managing hardware resources and mediating system calls between software and hardware',
      points: 5,
      order: 1,
    },
    {
      category: 'LOGICAL_REASONING',
      type: 'MULTIPLE_CHOICE',
      prompt: 'If every software engineer uses Git, and Ada is a software engineer, which of the following is necessarily true?',
      options: JSON.stringify([
        'Ada only programs in JavaScript',
        'Ada uses Git',
        'Everyone who uses Git is a software engineer',
        'Ada has published an open-source library',
      ]),
      correctAnswer: 'Ada uses Git',
      points: 5,
      order: 2,
    },
    {
      category: 'MATHEMATICS',
      type: 'MULTIPLE_CHOICE',
      prompt: 'What is the value of the binary number 10110 in base 10 (decimal)?',
      options: JSON.stringify(['16', '20', '22', '24']),
      correctAnswer: '22',
      points: 5,
      order: 3,
    },
    {
      category: 'TECHNICAL_KNOWLEDGE',
      type: 'MULTIPLE_CHOICE',
      prompt: 'In a relational database, what does the ACID property stand for?',
      options: JSON.stringify([
        'Atomicity, Consistency, Isolation, Durability',
        'Accuracy, Concurrency, Indexing, Decoupling',
        'Array, Class, Inheritance, Delegation',
        'Authentication, Cipher, Integrity, Defense',
      ]),
      correctAnswer: 'Atomicity, Consistency, Isolation, Durability',
      points: 5,
      order: 4,
    },
    {
      category: 'PROGRAMMING',
      type: 'MULTIPLE_CHOICE',
      prompt: 'What is the output of the following JavaScript snippet?\n\nconst nums = [1, 2, 3];\nconst result = nums.map(n => n * 2).filter(n => n > 3);\nconsole.log(result);',
      options: JSON.stringify(['[2, 4, 6]', '[4, 6]', '[3, 6]', '[2, 3]']),
      correctAnswer: '[4, 6]',
      points: 5,
      order: 5,
    },
    {
      category: 'PROBLEM_SOLVING',
      type: 'MULTIPLE_CHOICE',
      prompt: 'You have a solar inverter system where the batteries drain completely within 2 hours of power outage despite high sunlight during the day. What should be your first diagnostic check?',
      options: JSON.stringify([
        'Immediately replace all solar panels with higher wattage models',
        'Measure the open-circuit voltage (Voc) and charge controller output current to verify solar charging current into the batteries',
        'Increase the AC load by turning on all air conditioning units',
        'Switch the inverter frequency from 50Hz to 60Hz',
      ]),
      correctAnswer: 'Measure the open-circuit voltage (Voc) and charge controller output current to verify solar charging current into the batteries',
      points: 5,
      order: 6,
    },
    {
      category: 'DIGITAL_LITERACY',
      type: 'MULTIPLE_CHOICE',
      prompt: 'Which protocol is used to securely encrypt web communications between a client browser and a web server?',
      options: JSON.stringify(['HTTP', 'HTTPS (TLS/SSL)', 'FTP', 'Telnet']),
      correctAnswer: 'HTTPS (TLS/SSL)',
      points: 5,
      order: 7,
    },
    {
      category: 'PROGRAMMING',
      type: 'MULTIPLE_CHOICE',
      prompt: 'What is the time complexity of looking up a value by key in a standard Hash Map under average conditions?',
      options: JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n^2)']),
      correctAnswer: 'O(1)',
      points: 5,
      order: 8,
    },
  ];

  for (const q of questions) {
    await prisma.assessmentQuestion.create({
      data: {
        assessmentId: assessment.id,
        category: q.category,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        order: q.order,
      },
    });
  }
  console.log('✅ Seeded Placement Assessment with 8 multi-category diagnostic questions.');

  // 13. Seed Sample Pending Application for Academic Admin Workflow Testing
  const sampleApp = await prisma.application.create({
    data: {
      applicationNumber: 'APP-2025-0108',
      programId: fseProgramId,
      cohortId: cohortFSE.id,
      preferredSchedule: 'Weekday Evenings (4pm - 7pm WAT)',
      fullName: 'Olamide Kehinde Adeleke',
      dateOfBirth: new Date('2002-04-15'),
      gender: 'Male',
      phone: '+234 813 999 1122',
      email: 'olamide.adeleke@example.com',
      address: '25 Moore Street, Ile-Ife, Osun State',
      educationLevel: 'B.Sc. In Progress (Computer Science, OAU)',
      institution: 'Obafemi Awolowo University, Ile-Ife',
      previousTraining: 'Self-taught JavaScript and Python basics on YouTube',
      technicalExperience: 'Built a simple HTML/CSS school assignment website and basic CLI calculators.',
      relevantSkills: 'Git basics, JavaScript, Problem Solving, Analytical mindset',
      previousProjects: 'Student result calculator script in Python',
      careerGoals: 'To become a globally competitive software engineer building scalable African fintech solutions.',
      learningObjectives: 'Master production TypeScript, React, PostgreSQL, Docker containerization, and API security.',
      statementOfPurpose: 'STEMPACT Academy offers the exact rigorous project-based environment I need to transition from theoretical computer science to practical industry-grade software craftsmanship in Ile-Ife.',
      isMinor: false,
      consentAccepted: true,
      status: 'ASSESSED',
    },
  });

  const sampleAttempt = await prisma.assessmentAttempt.create({
    data: {
      applicationId: sampleApp.id,
      assessmentId: assessment.id,
      score: 35.0,
      maxScore: 40.0,
      percentage: 87.5,
      categoryScores: JSON.stringify({
        DIGITAL_LITERACY: 100,
        LOGICAL_REASONING: 100,
        MATHEMATICS: 100,
        TECHNICAL_KNOWLEDGE: 100,
        PROGRAMMING: 75,
        PROBLEM_SOLVING: 100,
      }),
      answers: JSON.stringify({ '1': 1, '2': 1, '3': 2, '4': 0, '5': 1 }),
      recommendedProgram: 'Full-Stack Software Engineering',
      recommendedLevel: 'Level 2 (Intermediate - Full-Stack Track)',
      recommendationReason: 'High score across logical reasoning, mathematics, and web fundamentals. Exhibits solid foundational readiness for accelerated intermediate engineering track.',
    },
  });

  await prisma.placement.create({
    data: {
      applicationId: sampleApp.id,
      assessmentAttemptId: sampleAttempt.id,
      recommendedProgram: 'Full-Stack Software Engineering',
      recommendedLevel: 'Level 2',
      reason: 'Strong performance on computational logic and core technical knowledge. Recommended for Level 2 placement upon academic board sign-off.',
      status: 'PENDING_REVIEW',
    },
  });
  console.log('✅ Seeded Sample Application & Placement in PENDING_REVIEW status for testing.');

  // 14. Seed Events
  await prisma.event.createMany({
    data: [
      {
        title: 'Ile-Ife CleanTech & Smart Energy Hackathon 2025',
        description: 'A 48-hour challenge uniting students and engineers to prototype low-cost solar microgrids and smart power switching systems for rural and suburban communities.',
        category: 'Hackathon',
        startDate: addDays(now, 20),
        endDate: addDays(now, 22),
        location: 'STEMPACT Innovation Lab, Ile-Ife & Virtual',
        isVirtual: false,
        status: 'UPCOMING',
      },
      {
        title: 'Tech Career & Remote Work Summit: Bridging Ife to Global Jobs',
        description: 'Masterclass with senior international software engineers on passing tech interviews, winning high-ticket foreign freelancing gigs, and building credible GitHub portfolios.',
        category: 'Conference',
        startDate: addDays(now, 30),
        endDate: addDays(now, 30),
        location: 'STEMPACT Main Auditorium & Live Stream',
        isVirtual: true,
        status: 'UPCOMING',
      },
      {
        title: 'STEMPACT Kids & Teens Science Fair: Tomorrow’s Inventors',
        description: 'An interactive exhibition where young makers aged 7–16 showcase their autonomous line-follower robots, Scratch games, and automated solar plant watering kits to parents and tech enthusiasts.',
        category: 'Exhibition',
        startDate: addDays(now, 45),
        endDate: addDays(now, 45),
        location: 'STEMPACT Youth Innovation Arena, Ile-Ife',
        isVirtual: false,
        status: 'UPCOMING',
      },
    ],
  });

  // 15. Seed Blog Posts
  await prisma.blogPost.createMany({
    data: [
      {
        slug: 'empowering-nigerias-next-tech-generation-from-ile-ife',
        title: 'From Ile-Ife to the World: Building Africa’s Premier STEM & Hardware Academy',
        excerpt: 'How STEMPACT Academy is decentralizing world-class technical education, providing youth with the practical tools to build robotics, solar grids, and scalable software.',
        content: 'Ile-Ife has long been celebrated as the cradle of Yoruba civilization and an intellectual powerhouse. At STEMPACT Academy, we are pairing this rich heritage of knowledge with cutting-edge 21st-century technology...\n\nThrough our 8 academic schools, students do not just memorize theory—they build printed circuit boards, configure solar arrays, train neural networks, and deploy production software.',
        author: 'Executive Academic Council',
        category: 'Vision & Impact',
        readTime: '5 min read',
        isPublished: true,
      },
      {
        slug: 'the-convergence-of-solar-energy-and-iot-in-nigeria',
        title: 'The CleanTech Revolution: Why Renewable Energy Needs IoT and Embedded Systems',
        excerpt: 'Exploring why modern solar installations in Nigeria require intelligent smart metering, automated load controllers, and cloud telemetry to maximize battery longevity.',
        content: 'In Nigeria, the rapid adoption of residential and commercial solar systems has solved critical power reliability issues. However, without intelligent energy management, expensive lithium and deep-cycle battery banks often experience premature degradation...\n\nBy integrating ESP32 telemetry nodes and real-time power sensors, STEMPACT engineers are building smart microgrids that dynamically shed high-draw loads when cloud cover reduces solar irradiance.',
        author: 'Engr. Damilola Adeyemi',
        category: 'Renewable Energy',
        readTime: '6 min read',
        isPublished: true,
      },
      {
        slug: 'why-project-based-learning-outperforms-rote-memorization',
        title: 'Beyond the Textbook: Why Project-Based Learning Produces Employable Engineers',
        excerpt: 'Employers do not hire graduates for the definitions they can recite; they hire for the software they can ship and the physical prototypes they can build.',
        content: 'At STEMPACT Academy, our learning philosophy is anchored on tangible student outcomes. Every program culminates in a public capstone project defended before industry mentors and evaluated on production standards.',
        author: 'Dr. Folashade Adeleke',
        category: 'Pedagogy & Learning',
        readTime: '4 min read',
        isPublished: true,
      },
    ],
  });

  // 16. Seed Testimonials
  await prisma.testimonial.createMany({
    data: [
      {
        name: 'Toluwalase Ogunbiyi',
        role: 'Full-Stack Software Engineering Alumnus',
        organization: 'Now Junior Engineer at a Lagos FinTech',
        content: 'STEMPACT Academy changed my career trajectory completely. Coming from Ile-Ife, having access to high-speed internet, real server infrastructure, and instructors who review your code line-by-line made all the difference.',
        rating: 5,
        isFeatured: true,
      },
      {
        name: 'Mrs. Funke Ogunbiyi',
        role: 'Parent of STEMPACT Student',
        organization: 'Ile-Ife Resident',
        content: 'As a mother, seeing my son build real applications and gain confidence within weeks was priceless. The parent portal kept me updated on his attendance and assignments every step of the way.',
        rating: 5,
        isFeatured: true,
      },
      {
        name: 'Engr. Michael Alabi',
        role: 'Managing Director',
        organization: 'Apex CleanTech Solutions',
        content: 'We hired two solar technicians trained by STEMPACT Academy. Their hands-on competence with inverters, lithium battery BMS, and electrical safety standards surpassed university graduates with years of theoretical training.',
        rating: 5,
        isFeatured: true,
      },
    ],
  });

  // 17. Seed Corporate Partners
  await prisma.partner.createMany({
    data: [
      { name: 'OAU Technology & Innovation Corridor', category: 'ACADEMIC', isFeatured: true },
      { name: 'Osun State Ministry of Innovation, Science & Technology', category: 'GOVERNMENT', isFeatured: true },
      { name: 'Apex CleanTech Solutions Nigeria', category: 'CORPORATE', isFeatured: true },
      { name: 'Paystack Community Partners', category: 'TECHNOLOGY', isFeatured: true },
      { name: 'African Robotics & STEM Network', category: 'COMMUNITY', isFeatured: true },
      { name: 'GitHub Campus Program', category: 'TECHNOLOGY', isFeatured: true },
    ],
  });

  // 18. Seed Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to the STEMPACT 2025 Cohort Cycle!',
        content: 'Orientation week begins next Monday. All admitted students are encouraged to check their syllabus and timetable on their dashboards.',
        targetAudience: 'ALL',
        priority: 'HIGH',
      },
      {
        title: 'Hackathon Team Registrations Open',
        content: 'Registration for the Ile-Ife CleanTech & Smart Energy Hackathon is now open to all students across CSE, RIOTH, and RETE schools.',
        targetAudience: 'PROGRAM',
        priority: 'NORMAL',
      },
    ],
  });

  // 19. Seed Applicant Flow
  const allPrograms = await prisma.program.findMany();
  const firstProgram = allPrograms[0];
  const firstCohort = await prisma.cohort.findFirst({ where: { programId: firstProgram.id } });

  const applicantApp = await prisma.application.create({
    data: {
      applicationNumber: 'APP-2025-0901',
      userId: applicantUser.id,
      programId: firstProgram.id,
      cohortId: firstCohort?.id || null,
      preferredSchedule: 'Hybrid (Weekday Evening & Weekend Lab)',
      fullName: 'John Adebisi',
      dateOfBirth: new Date(Date.now() - 19 * 365 * 24 * 3600 * 1000),
      gender: 'Male',
      phone: '+234 818 123 4567',
      email: 'applicant@stempact.org',
      address: 'Lagere Commercial District, Ile-Ife',
      educationLevel: 'Undergraduate',
      careerGoals: 'Full-Stack Software Architecture & Cloud Systems',
      learningObjectives: 'Hands-on practical development with industry frameworks',
      statementOfPurpose: 'Eager to build production web applications for Nigeria and beyond.',
      status: ApplicationStatus.SUBMITTED,
      consentAccepted: true,
    },
  });

  // 20. Seed Counseling Records & Sponsored Students
  const studentProf = await prisma.studentProfile.findFirst({ where: { userId: studentUser.id } });
  if (studentProf) {
    await prisma.counselingRecord.create({
      data: {
        studentId: studentProf.id,
        counselorId: counselorUser.id,
        category: 'ATTENDANCE_RISK',
        riskLevel: 'MEDIUM',
        summary: 'Missed 2 consecutive Monday lab sprints due to transport disruption from Lagere',
        notes: 'Learner met with student support officer. Transport route has been rearranged with the academy shuttle bus.',
        actionPlan: 'Assign to Thursday makeup workstation slot and monitor attendance weekly.',
        parentNotified: true,
        status: 'OPEN',
      },
    });

    await prisma.sponsoredStudent.create({
      data: {
        partnerProfileId: partnerProfile.id,
        studentId: studentProf.id,
        scholarshipName: 'Apex CleanTech Future Leaders Scholarship',
        coveragePercent: 100,
        status: 'ACTIVE',
      },
    });
  }

  // 21. Seed Innovation Competitions & Hackathons
  const comp = await prisma.competition.create({
    data: {
      title: 'Southwest AgriTech & Clean Energy Hackathon 2025',
      slug: 'agritech-clean-energy-hackathon-2025',
      category: 'HACKATHON',
      description: 'Design and prototype smart IoT solar irrigation and automated crop disease detection nodes.',
      rules: 'Teams must use open hardware (ESP32/Raspberry Pi) and build a real-time telemetry web portal.',
      prizePool: '₦1,000,000 in Grants + Incubation',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      registrationDeadline: new Date(Date.now() + 14 * 86400000),
      status: 'ACTIVE',
    },
  });

  if (studentProf) {
    const squad = await prisma.competitionTeam.create({
      data: {
        competitionId: comp.id,
        name: 'Team TerraSolar',
        projectTitle: 'Automated Solar Irrigation & LoRa Soil Monitoring',
        projectSummary: 'Distributed low-power sensors streaming soil moisture and inverter status to cloud dashboard.',
        repositoryUrl: 'https://github.com/stempact/terrasolar-iot',
        score: 88,
        rank: 1,
        feedback: 'Outstanding hardware prototype and responsive telemetry dashboard built in React.',
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: squad.id,
        studentId: studentProf.id,
        role: 'Team Lead & Firmware Engineer',
      },
    });
  }

  // 22. Seed In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser.id,
        title: 'Welcome to STEMPACT Academy!',
        message: 'Your enrollment is active. Explore your curriculum modules and class timetable.',
        type: 'SUCCESS',
        link: '/portal/student',
      },
      {
        userId: studentUser.id,
        title: 'New Coding Assignment Posted',
        message: 'Sprint 01: Build a Responsive Component Architecture is now active in your classroom.',
        type: 'INFO',
        link: '/portal/student',
      },
      {
        userId: applicantUser.id,
        title: 'Application Registered • Next Step',
        message: 'Your application APP-2025-0901 has been registered. Proceed to take your 15-question technical diagnostic test.',
        type: 'INFO',
        link: '/portal/applicant',
      },
    ],
  });

  // 23. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        userName: 'Babatunde Olatunji',
        userRole: 'SUPER_ADMIN',
        action: 'SYSTEM_INITIALIZATION',
        resource: 'Platform',
        resourceId: 'INIT-2025',
        newValue: 'STEMPACT Academy SMS/LMS Initialized across 8 Schools & 50 Accredited Programs',
        ipAddress: '127.0.0.1',
      },
      {
        userId: academicAdmin.id,
        userName: 'Dr. Folashade Adeleke',
        userRole: 'ACADEMIC_ADMIN',
        action: 'CURRICULUM_PUBLISHED',
        resource: 'Program',
        resourceId: firstProgram.id,
        newValue: 'Syllabus and Assessment Rubrics ratified for Cohort 2025',
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('🎉 STEMPACT ACADEMY database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
