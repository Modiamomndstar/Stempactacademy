export type Role = 'SUPER_ADMIN' | 'COORDINATOR_ADMIN' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT';

export type ProgramStatus = 'DRAFT' | 'PUBLISHED' | 'UPCOMING' | 'OPEN_FOR_APPLICATION' | 'FULL' | 'CLOSED' | 'ARCHIVED';

export type CohortStatus = 'DRAFT' | 'UPCOMING' | 'OPEN' | 'ALMOST_FULL' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ASSESSMENT_PENDING' | 'ASSESSED' | 'PLACED' | 'ADMITTED' | 'ENROLLED' | 'REJECTED';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  studentProfile?: StudentProfile;
  instructorProfile?: InstructorProfile;
  parentProfile?: ParentProfile;
}

export interface School {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  order: number;
  programs?: Program[];
  _count?: { programs: number };
}

export interface Program {
  id: string;
  code: string;
  name: string;
  schoolId: string;
  school?: School;
  description: string;
  targetLearner: string;
  entryRequirements: string;
  prerequisites: string;
  duration: string;
  contactHours: number;
  learningLevels: string;
  tools: string;
  projects: string;
  capstone: string;
  assessmentCriteria: string;
  competencies: string;
  certification: string;
  careerPathways: string;
  progressionPathway: string;
  status: ProgramStatus;
  isFeatured: boolean;
  cohorts?: Cohort[];
  courses?: Course[];
}

export interface Course {
  id: string;
  programId: string;
  code: string;
  title: string;
  description: string;
  order: number;
  modules?: Module[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationHours: number;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  resources?: string;
  order: number;
}

export interface Cohort {
  id: string;
  cohortCode: string;
  name: string;
  programId: string;
  program?: Program;
  level: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  schedule: string;
  mode: string;
  location: string;
  instructorName: string;
  maxCapacity: number;
  currentEnrollment: number;
  availableSeats?: number;
  trainingFee: number;
  registrationFee: number;
  certificationFee: number;
  discountPercentage: number;
  status: CohortStatus;
  isRegistrationOpen?: boolean;
}

export interface Application {
  id: string;
  applicationNumber: string;
  userId?: string;
  programId: string;
  program?: Program;
  cohortId?: string;
  cohort?: Cohort;
  preferredSchedule: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  educationLevel: string;
  institution?: string;
  previousTraining?: string;
  technicalExperience?: string;
  relevantSkills?: string;
  previousProjects?: string;
  careerGoals: string;
  learningObjectives: string;
  statementOfPurpose: string;
  isMinor: boolean;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string;
  status: ApplicationStatus;
  createdAt: string;
  assessmentAttempts?: AssessmentAttempt[];
  placement?: Placement;
  admission?: Admission;
}

export interface AssessmentQuestion {
  id: string;
  category: string;
  type: string;
  prompt: string;
  codeSnippet?: string;
  options: string;
  points: number;
  order: number;
}

export interface Assessment {
  id: string;
  title: string;
  programId: string;
  durationMinutes: number;
  passingScore: number;
  instructions: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentAttempt {
  id: string;
  applicationId: string;
  score: number;
  maxScore: number;
  percentage: number;
  categoryScores: string;
  recommendedProgram: string;
  recommendedLevel: string;
  recommendationReason: string;
  completedAt: string;
}

export interface Placement {
  id: string;
  applicationId: string;
  application?: Application;
  assessmentAttemptId?: string;
  assessmentAttempt?: AssessmentAttempt;
  recommendedProgram: string;
  recommendedLevel: string;
  reason: string;
  approvedProgram?: string;
  approvedLevel?: string;
  approvedCohortCode?: string;
  adminNotes?: string;
  reviewerName?: string;
  status: string;
  reviewedAt?: string;
}

export interface Admission {
  id: string;
  admissionNumber: string;
  studentIdNumber: string;
  applicationId: string;
  application?: Application;
  cohortId: string;
  cohort?: Cohort;
  programName: string;
  level: string;
  schedule: string;
  assignedClass: string;
  instructorName: string;
  letterPdfPath?: string;
  orientationDate?: string;
  whatsappGroupUrl: string;
  handbookUrl: string;
  status: string;
  issuedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  user?: User;
  studentIdNumber: string;
  currentLevel: string;
  completionRate: number;
  attendanceRate: number;
  status: string;
  enrollmentDate?: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  relationship: string;
  emergencyContact?: string;
  address?: string;
}

export interface InstructorProfile {
  id: string;
  userId: string;
  staffCode: string;
  bio?: string;
  specialization: string;
  qualification: string;
}

export interface AttendanceRecord {
  id: string;
  classSessionId: string;
  classSession?: {
    title: string;
    date: string;
    topic: string;
  };
  studentId: string;
  student?: { user: User };
  status: AttendanceStatus;
  remarks?: string;
  date: string;
}

export interface Assignment {
  id: string;
  cohortId: string;
  title: string;
  description: string;
  maxPoints: number;
  dueDate: string;
  submissions?: Submission[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignment?: Assignment;
  studentId: string;
  content: string;
  attachmentUrl?: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string;
  tools: string;
  thumbnail?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  score?: number;
  feedback?: string;
  isFeaturedPublic: boolean;
  members?: { role: string; student: { user: User } }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId?: string;
  title: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  items: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentReference: string;
  amount: number;
  currency: string;
  channel: string;
  status: PaymentStatus;
  paidAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  programName: string;
  certificateType: string;
  achievement: string;
  issueDate: string;
  verified: boolean;
  signers: string | { name: string; title: string }[];
  verificationCode: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  readTime: string;
  publishedAt: string;
}

export interface CreateAdminData {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'COORDINATOR_ADMIN' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN';
  password: string;
}

export interface CreateInstructorData {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  phone?: string;
  specialization: string;
  bio?: string;
  qualification?: string;
  assignedSchools?: string;
  password: string;
}
