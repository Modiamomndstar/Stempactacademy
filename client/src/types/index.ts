export type Role =
  | 'SUPER_ADMIN'
  | 'ACADEMIC_ADMIN'
  | 'FINANCE_ADMIN'
  | 'ADMISSIONS_ADMIN'
  | 'PROGRAM_COORDINATOR'
  | 'COORDINATOR_ADMIN'
  | 'INSTRUCTOR'
  | 'STUDENT'
  | 'PARENT'
  | 'COUNSELOR'
  | 'CONTENT_MANAGER'
  | 'INNOVATION_MANAGER'
  | 'MARKETING_MANAGER'
  | 'PARTNER'
  | 'APPLICANT';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'ARCHIVED';

export const AcademicLevel = {
  LEVEL_0_ASSESSMENT: 'LEVEL_0_ASSESSMENT',
  LEVEL_1_FOUNDATION: 'LEVEL_1_FOUNDATION',
  LEVEL_2_INTERMEDIATE: 'LEVEL_2_INTERMEDIATE',
  LEVEL_3_ADVANCED: 'LEVEL_3_ADVANCED',
  LEVEL_4_SPECIALIST: 'LEVEL_4_SPECIALIST',
  LEVEL_5_INNOVATION: 'LEVEL_5_INNOVATION',
  LEVEL_6_ENTREPRENEURSHIP: 'LEVEL_6_ENTREPRENEURSHIP',
} as const;
export type AcademicLevel = (typeof AcademicLevel)[keyof typeof AcademicLevel];

export interface ProgramDraft {
  name: string;
  code: string;
  schoolCode: string;
  academicLevel: number;
  durationWeeks: number;
  targetAudience: string;
  description: string;
  learningOutcomes: string[];
  prerequisites: string[];
  careerOutcomes: string[];
  suggestedFeeNgn: number;
  modules: {
    weekNumber: number;
    title: string;
    description: string;
    learningObjectives: string[];
    practicalProjects: string[];
  }[];
}

export interface QualityCheckResult {
  alignmentScore: number;
  completenessScore: number;
  practicalBalanceScore: number;
  rigorScore: number;
  industryRelevanceScore: number;
  suggestions: string[];
  warnings: string[];
}

export interface LessonPlanDraft {
  topic: string;
  durationMinutes: number;
  targetAudience: string;
  objectives: string[];
  materialsNeeded: string[];
  agenda: {
    timeMinutes: number;
    activity: string;
    details: string;
  }[];
  handsOnExercise: string;
  formativeAssessment: string;
  takeHomeAssignment?: string;
}

export interface FeedbackDraft {
  strengths: string[];
  areasForImprovement: string[];
  suggestedScore: number;
  encouragement: string;
}

export type WorkflowStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type AIActionType =
  | 'PROGRAM_GENERATION'
  | 'CURRICULUM_GENERATION'
  | 'SYLLABUS_GENERATION'
  | 'COURSE_GENERATION'
  | 'MODULE_GENERATION'
  | 'LESSON_PLAN_GENERATION'
  | 'ASSESSMENT_GENERATION'
  | 'ASSIGNMENT_GENERATION'
  | 'PROJECT_GENERATION'
  | 'QUALITY_CHECK'
  | 'FEEDBACK_GENERATION'
  | 'ADMISSION_LETTER_GENERATION'
  | 'PROGRESS_ANALYSIS'
  | 'STUDENT_COPILOT'
  | 'PARENT_ASSISTANT'
  | 'ADMIN_ASSISTANT';

export type ProgramStatus =
  | 'DRAFT'
  | 'AI_GENERATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'UPCOMING'
  | 'OPEN_FOR_APPLICATION'
  | 'FULL'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'REVISED';

export type CohortStatus = 'DRAFT' | 'UPCOMING' | 'OPEN' | 'ALMOST_FULL' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSESSMENT_PENDING'
  | 'ASSESSED'
  | 'PLACEMENT_PENDING'
  | 'PLACED'
  | 'ADMITTED'
  | 'ENROLLED'
  | 'REJECTED'
  | 'WITHDRAWN';

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
  status?: UserStatus;
  avatarUrl?: string;
  studentProfile?: StudentProfile;
  instructorProfile?: InstructorProfile;
  parentProfile?: ParentProfile;
  coordinatorProfile?: CoordinatorProfile;
  partnerProfile?: PartnerProfile;
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
  level?: AcademicLevel;
  version?: number;
  isFeatured: boolean;
  cohorts?: Cohort[];
  courses?: Course[];
  curricula?: Curriculum[];
  syllabi?: Syllabus[];
  capstoneProjects?: CapstoneProject[];
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
  academicSessionId?: string;
  academicSession?: AcademicSession;
  syllabi?: Syllabus[];
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  counselorId?: string;
  category: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  notes: string;
  actionPlan?: string;
  parentNotified: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentIdNumber: string;
    currentLevel: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    cohort?: {
      name: string;
      program?: { name: string };
    };
  };
  counselor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Competition {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  rules?: string;
  prizePool?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  bannerUrl?: string;
  teams?: CompetitionTeam[];
}

export interface CompetitionTeam {
  id: string;
  competitionId: string;
  name: string;
  projectTitle?: string;
  projectSummary?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  score?: number;
  rank?: number;
  feedback?: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  studentId: string;
  role: string;
  student?: {
    studentIdNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface CoordinatorProfile {
  id: string;
  userId: string;
  staffCode: string;
  department: string;
  assignedSchools: string;
  assignedPrograms: string;
}

export interface PartnerProfile {
  id: string;
  userId: string;
  organizationName: string;
  partnerType: string;
  contactPhone?: string;
  mouDetails?: string;
  grantBudget: number;
  activeSponsorships: number;
  sponsoredStudents?: SponsoredStudent[];
}

export interface SponsoredStudent {
  id: string;
  partnerProfileId: string;
  studentId: string;
  scholarshipName: string;
  coveragePercent: number;
  startDate: string;
  status: string;
  student?: StudentProfile;
}

export interface AcademicSession {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt?: string;
  cohorts?: Cohort[];
}

export interface Curriculum {
  id: string;
  programId: string;
  title: string;
  level: AcademicLevel;
  totalHours: number;
  theoryPracticalRatio: string;
  competencies?: any;
  courseSequence?: any;
  status: WorkflowStatus;
  version: number;
  createdAt?: string;
}

export interface Syllabus {
  id: string;
  programId: string;
  cohortId?: string;
  title: string;
  weeklyOutline: any[];
  contactHoursPerWeek: number;
  status: WorkflowStatus;
  version: number;
  createdAt?: string;
}

export interface PracticalActivity {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  objectives: string;
  labSafetyNotes?: string;
  requiredTools: string;
  estimatedDurationMin: number;
}

export interface CapstoneProject {
  id: string;
  programId: string;
  title: string;
  problemStatement: string;
  expectedOutputs: string;
  evaluationRubric: any;
  teamSizeMin: number;
  teamSizeMax: number;
  durationWeeks: number;
}

export interface AIGeneration {
  id: string;
  actionType: AIActionType;
  promptContext: any;
  rawOutput: string;
  structuredOutput: any;
  model: string;
  provider: string;
  tokensPrompt: number;
  tokensCompletion: number;
  costEstimate?: number;
  status: WorkflowStatus;
  requestedById: string;
  approvedById?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface AIAuditLog {
  id: string;
  userId: string;
  userRole: Role;
  action: AIActionType;
  resourceType: string;
  resourceId?: string;
  inputSummary?: string;
  model: string;
  provider: string;
  latencyMs: number;
  approved: boolean;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  sourceUrl?: string;
  isCanonical: boolean;
  createdAt: string;
}

export interface StudentPortfolio {
  id: string;
  studentId: string;
  bio?: string;
  headline?: string;
  isPublic: boolean;
  customSlug?: string;
  items?: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  portfolioId: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  techStack: string;
  role: string;
  demoUrl?: string;
  repoUrl?: string;
  mediaUrls: string[];
  skillsDemonstrated: string[];
  isVerifiedByInstructor: boolean;
  completedAt?: string;
}


