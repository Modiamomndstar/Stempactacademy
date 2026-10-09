const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://stempactacademy.onrender.com/api';
    }
  }
  return '/api';
};

const API_BASE = getApiBase();

export const getAuthToken = (): string | null => {
  return localStorage.getItem('stempact_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('stempact_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('stempact_token');
};

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiRequest('/auth/me'),

  // Schools & Programs
  getSchools: () => apiRequest('/schools'),
  getSchoolByCode: (code: string) => apiRequest(`/schools/${code}`),
  createSchool: (data: any) => apiRequest('/admin/schools', { method: 'POST', body: JSON.stringify(data) }),
  updateSchool: (id: string, data: any) => apiRequest(`/admin/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchool: (id: string) => apiRequest(`/admin/schools/${id}`, { method: 'DELETE' }),

  getPrograms: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/programs${query ? `?${query}` : ''}`);
  },
  getProgramByCode: (code: string) => apiRequest(`/programs/${code}`),
  createProgram: (data: any) => apiRequest('/admin/programs', { method: 'POST', body: JSON.stringify(data) }),
  updateProgram: (id: string, data: any) => apiRequest(`/admin/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProgram: (id: string) => apiRequest(`/admin/programs/${id}`, { method: 'DELETE' }),
  updateProgramStatus: (id: string, data: any) => apiRequest(`/programs/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  curateProgramVideos: (id: string, data: { overwrite?: boolean } = {}) =>
    apiRequest(`/admin/programs/${id}/curate-videos`, { method: 'POST', body: JSON.stringify(data) }),
  updateLessonVideo: (lessonId: string, data: { videoUrl?: string | null; videoDurationMin?: number | null; videoSummary?: string | null }) =>
    apiRequest(`/admin/lessons/${lessonId}/video`, { method: 'PATCH', body: JSON.stringify(data) }),
  curateSingleLessonVideo: (lessonId: string) =>
    apiRequest(`/admin/lessons/${lessonId}/curate-video`, { method: 'POST' }),

  // Multi-Center & Multi-Campus Physical / Virtual Centers
  getCenters: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/centers${query ? `?${query}` : ''}`);
  },
  getCenterById: (id: string) => apiRequest(`/centers/${id}`),
  createCenter: (data: any) => apiRequest('/admin/centers', { method: 'POST', body: JSON.stringify(data) }),
  updateCenter: (id: string, data: any) => apiRequest(`/admin/centers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  seedDefaultCenters: () => apiRequest('/admin/centers/seed', { method: 'POST' }),

  // Academic Sessions & Calendars
  getAcademicSessions: () => apiRequest('/academic-sessions'),
  createAcademicSession: (data: { name: string; code?: string; startDate: string; endDate: string; isCurrent?: boolean }) =>
    apiRequest('/academic-sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateAcademicSession: (id: string, data: { name?: string; code?: string; startDate?: string; endDate?: string; isCurrent?: boolean }) =>
    apiRequest(`/academic-sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Cohorts
  getCohorts: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/cohorts${query ? `?${query}` : ''}`);
  },
  getCohortById: (id: string) => apiRequest(`/cohorts/${id}`),
  getCohortAnalysis: (id: string) => apiRequest(`/cohorts/${id}/analysis`),
  estimateCohortTimeline: (data: { startDate: string; durationWeeks?: number; holidays?: string[]; offDays?: string[] }) =>
    apiRequest('/cohorts/estimate-timeline', { method: 'POST', body: JSON.stringify(data) }),
  createCohort: (data: any) => apiRequest('/cohorts', { method: 'POST', body: JSON.stringify(data) }),
  updateCohort: (id: string, data: any) => apiRequest(`/cohorts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCohort: (id: string, force: boolean = false) =>
    apiRequest(`/cohorts/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' }),
  purgeLegacyCohorts: (data: { preserveSessionId?: string } = {}) =>
    apiRequest('/cohorts/purge-legacy', { method: 'POST', body: JSON.stringify(data) }),

  // Applications
  submitApplication: (data: any) => apiRequest('/applications', { method: 'POST', body: JSON.stringify(data) }),
  getApplications: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/applications${query ? `?${query}` : ''}`);
  },
  getApplicationById: (id: string) => apiRequest(`/applications/${id}`),

  // Assessments
  getAssessment: (params: { programId?: string; applicationId?: string } = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/assessments${query ? `?${query}` : ''}`);
  },
  submitAssessmentAttempt: (data: {
    applicationId?: string;
    programId?: string;
    assessmentId: string;
    answers: Record<string, any>;
  }) => apiRequest('/assessments/attempt', { method: 'POST', body: JSON.stringify(data) }),

  // Placements & Academic Board Review
  getPendingPlacements: () => apiRequest('/placements/pending'),
  reviewPlacement: (placementId: string, data: any) =>
    apiRequest(`/placements/${placementId}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Admissions
  issueAdmission: (data: { applicationId: string; cohortId?: string; assignedClass?: string; orientationDate?: string }) =>
    apiRequest('/admissions/issue', { method: 'POST', body: JSON.stringify(data) }),
  getAdmissions: () => apiRequest('/admissions'),
  getAdmissionByNumber: (number: string) => apiRequest(`/admissions/${number}`),
  acceptAdmission: (admissionId: string) =>
    apiRequest(`/admissions/${admissionId}/accept`, { method: 'POST' }),
  declineAdmission: (admissionId: string, reason?: string) =>
    apiRequest(`/admissions/${admissionId}/decline`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getAdmissionDocument: (admissionId: string) =>
    apiRequest(`/admissions/${admissionId}/document`),
  checkEligibility: (admissionId: string) =>
    apiRequest(`/admissions/${admissionId}/eligibility`),
  enrollStudent: (admissionId: string, notes?: string) =>
    apiRequest(`/admissions/${admissionId}/enroll`, { method: 'POST', body: JSON.stringify({ notes }) }),
  deliverAdmissionLetter: (admissionId: string) =>
    apiRequest(`/admissions/${admissionId}/deliver-letter`, { method: 'POST' }),
  withdrawAdmission: (admissionId: string, reason: string) =>
    apiRequest(`/admissions/${admissionId}/withdraw`, { method: 'POST', body: JSON.stringify({ reason }) }),
  transferAdmissionProgram: (admissionId: string, data: { newProgramId: string; newCohortId: string; newLevel?: string; notes?: string }) =>
    apiRequest(`/admissions/${admissionId}/transfer-program`, { method: 'POST', body: JSON.stringify(data) }),

  // Portals: Student, Parent, Instructor, Coordinator
  getStudentDashboard: () => apiRequest('/student/dashboard'),
  getStudentCurriculum: () => apiRequest('/student/curriculum'),
  recordLessonProgress: (lessonId: string, data: { status?: string; timeSpentMinutes?: number; notes?: string }) =>
    apiRequest(`/student/lessons/${lessonId}/progress`, { method: 'POST', body: JSON.stringify(data) }),
  getCompletionReadiness: (studentId?: string) =>
    apiRequest(`/student/completion-readiness${studentId ? `?studentId=${studentId}` : ''}`),
  getParentDashboard: () => apiRequest('/parent/dashboard'),
  registerWard: (data: any) => apiRequest('/parent/wards', { method: 'POST', body: JSON.stringify(data) }),
  getWardAcademicRecords: (studentId: string) =>
    apiRequest(`/parent/wards/${studentId}/academic-records`),
  getInstructorDashboard: () => apiRequest('/instructor/dashboard'),
  createClassSession: (data: any) => apiRequest('/instructor/sessions', { method: 'POST', body: JSON.stringify(data) }),
  evaluateCompetency: (data: { studentId: string; competencyId: string; status: 'ACQUIRED' | 'IN_PROGRESS' | 'NEEDS_PRACTICE' | string; score?: number; evidenceNotes?: string }) =>
    apiRequest('/instructor/competencies/evaluate', { method: 'POST', body: JSON.stringify(data) }),
  getCohortCurriculum: (cohortId: string) => apiRequest(`/instructor/cohorts/${cohortId}/curriculum`),

  // Academic Progression & Multi-Cohort Entitlements
  getAcademicJourney: (studentId?: string) =>
    apiRequest(`/progression/journey${studentId ? `/${studentId}` : ''}`),
  evaluateLevelCompletion: (data: { studentId: string; cohortId: string; overrideCriteria?: boolean; notes?: string }) =>
    apiRequest('/progression/evaluate', { method: 'POST', body: JSON.stringify(data) }),
  claimProgression: (data: { eligibilityId: string; targetCohortId: string }) =>
    apiRequest('/progression/claim', { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  markAttendance: (data: { classSessionId: string; records: { studentId: string; status: string; remarks?: string }[] }) =>
    apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
  getAttendanceForCohort: (cohortId: string) => apiRequest(`/attendance/cohort/${cohortId}`),

  // Assignments
  createAssignment: (data: any) => apiRequest('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  submitAssignment: (data: { assignmentId: string; content: string; attachmentUrl?: string }) =>
    apiRequest('/assignments/submit', { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (submissionId: string, data: { grade: number; feedback?: string }) =>
    apiRequest(`/assignments/submissions/${submissionId}/grade`, { method: 'PATCH', body: JSON.stringify(data) }),
  generateAiGradeDraft: (submissionId: string) =>
    apiRequest(`/assignments/submissions/${submissionId}/ai-grade-draft`, { method: 'POST' }),
  getAssignmentSubmissions: (assignmentId: string) =>
    apiRequest(`/assignments/${assignmentId}/submissions`),
  getMySubmissions: () =>
    apiRequest('/assignments/my-submissions'),

  // Projects
  getProjects: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/projects${query ? `?${query}` : ''}`);
  },
  createProject: (data: any) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProjectEvidence: (projectId: string, data: { githubUrl?: string; liveDemoUrl?: string; thumbnail?: string; description?: string; skills?: string; tools?: string }) =>
    apiRequest(`/projects/${projectId}/evidence`, { method: 'PATCH', body: JSON.stringify(data) }),
  evaluateProject: (projectId: string, data: { score: number; feedback?: string }) =>
    apiRequest(`/projects/${projectId}/evaluate`, { method: 'POST', body: JSON.stringify(data) }),

  // Certificates & Public Verification
  verifyCertificate: (certNumber: string) => apiRequest(`/certificates/verify/${certNumber}`),
  getCertificates: () => apiRequest('/certificates'),
  issueCertificate: (data: any) => apiRequest('/certificates/issue', { method: 'POST', body: JSON.stringify(data) }),

  // Payments, Gateways & Bank Transfers
  getInvoices: () => apiRequest('/payments/invoices'),
  payInvoice: (data: { invoiceId: string; amount: number; channel?: string; payerName?: string; payerEmail?: string }) =>
    apiRequest('/payments/pay', { method: 'POST', body: JSON.stringify(data) }),
  initializePayment: (data: { invoiceId: string; amount: number; channel?: string; callbackUrl?: string }) =>
    apiRequest('/payments/initialize', { method: 'POST', body: JSON.stringify(data) }),
  submitBankTransfer: (data: {
    invoiceId: string;
    amount: number;
    channel?: string;
    senderBank: string;
    senderAccount?: string;
    proofUrl?: string;
    payerName?: string;
    payerEmail?: string;
  }) => apiRequest('/payments/bank-transfer', { method: 'POST', body: JSON.stringify(data) }),
  getBankTransfers: (status?: string) =>
    apiRequest(`/payments/bank-transfers${status ? `?status=${status}` : ''}`),
  approveBankTransfer: (paymentId: string) =>
    apiRequest(`/payments/bank-transfers/${paymentId}/approve`, { method: 'POST' }),
  rejectBankTransfer: (paymentId: string, rejectionReason?: string) =>
    apiRequest(`/payments/bank-transfers/${paymentId}/reject`, { method: 'POST', body: JSON.stringify({ rejectionReason }) }),
  getFinancialClearance: (admissionId: string) =>
    apiRequest(`/payments/clearance/${admissionId}`),
  grantFinancialWaiver: (data: { admissionId: string; reason: string; waiverAmount?: number }) =>
    apiRequest('/payments/waivers', { method: 'POST', body: JSON.stringify(data) }),
  approvePaymentArrangement: (data: {
    admissionId: string;
    planType: string;
    requiredInitialPayment?: number;
    installmentSchedule?: any;
    fundingSource?: string;
    sponsorName?: string;
    notes?: string;
  }) => apiRequest('/payments/arrangements', { method: 'POST', body: JSON.stringify(data) }),
  applyFinancialAdjustment: (data: {
    invoiceId: string;
    adjustmentType: string;
    amount: number;
    reason: string;
    sponsorDetails?: any;
  }) => apiRequest('/payments/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  applyCoupon: (data: { invoiceId: string; code: string }) =>
    apiRequest('/payments/apply-coupon', { method: 'POST', body: JSON.stringify(data) }),
  selectInstallmentPlan: (data: { invoiceId: string; planType: string }) =>
    apiRequest('/payments/select-plan', { method: 'POST', body: JSON.stringify(data) }),

  // Financial Operations, Coupons, Custom Invoices & Reminders
  getCoupons: (params?: { activeOnly?: string; programId?: string; cohortId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/finance/coupons${q ? `?${q}` : ''}`);
  },
  createCoupon: (data: any) =>
    apiRequest('/finance/coupons', { method: 'POST', body: JSON.stringify(data) }),
  toggleCoupon: (id: string) =>
    apiRequest(`/finance/coupons/${id}/toggle`, { method: 'PATCH' }),
  createCustomInvoice: (data: any) =>
    apiRequest('/finance/invoices/custom', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialOverview: (params?: { search?: string; status?: string; cohortId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/finance/overview${q ? `?${q}` : ''}`);
  },
  sendPaymentReminder: (invoiceId: string, customNote?: string) =>
    apiRequest(`/finance/invoices/${invoiceId}/reminder`, { method: 'POST', body: JSON.stringify({ customNote }) }),

  // Institutional Signatory Settings
  getInstitutionalSettings: () => apiRequest('/settings/institution'),
  updateInstitutionalSettings: (data: any) =>
    apiRequest('/settings/institution', { method: 'PUT', body: JSON.stringify(data) }),

  // Dynamic Payment Gateways & Manual Accounts
  getPublicPaymentSettings: () => apiRequest('/payments/settings'),
  getAdminPaymentSettings: () => apiRequest('/admin/payment-settings'),
  updatePaymentSettings: (data: any) =>
    apiRequest('/admin/payment-settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Multi-Level Program Curriculum Matrix
  getProgramCurriculumMatrix: (programId: string) =>
    apiRequest(`/programs/${programId}/curriculum-matrix`),

  // Marketing & Admissions Leads CRM
  getMarketingLeads: (params?: { search?: string; programId?: string; marketingStatus?: string; funnelStage?: string; isMinor?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/marketing/leads${q ? `?${q}` : ''}`);
  },
  recordLeadFollowUp: (data: {
    applicationId: string;
    contactChannel?: string;
    contactTarget?: string;
    outcome?: string;
    notes: string;
    nextFollowUpDate?: string;
    newMarketingStatus?: string;
  }) => apiRequest('/marketing/follow-up', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadMarketingStatus: (id: string, data: { marketingStatus?: string; marketingNotes?: string }) =>
    apiRequest(`/marketing/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  sendLeadFollowUpEmail: (data: {
    applicationId: string;
    recipientTarget?: 'APPLICANT' | 'PARENT';
    subject: string;
    message: string;
  }) => apiRequest('/marketing/send-email', { method: 'POST', body: JSON.stringify(data) }),

  // CMS
  getCMSContent: () => apiRequest('/cms/content'),
  createAnnouncement: (data: any) => apiRequest('/cms/announcements', { method: 'POST', body: JSON.stringify(data) }),
  createEvent: (data: any) => apiRequest('/cms/events', { method: 'POST', body: JSON.stringify(data) }),
  createBlogPost: (data: any) => apiRequest('/cms/blog', { method: 'POST', body: JSON.stringify(data) }),

  // Admin Analytics
  getAdminStats: () => apiRequest('/admin/stats'),

  // Admin & Instructor Management
  getAdmins: () => apiRequest('/admin/admins'),
  createAdmin: (data: any) => apiRequest('/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminUser: (id: string, data: { firstName?: string; lastName?: string; phone?: string; role?: string }) =>
    apiRequest(`/admin/admins/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleUserBan: (id: string, action: 'BAN' | 'UNBAN', reason?: string) =>
    apiRequest(`/admin/admins/${id}/ban`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
  getInstructors: () => apiRequest('/admin/instructors'),
  createInstructor: (data: any) => apiRequest('/admin/instructors', { method: 'POST', body: JSON.stringify(data) }),
  updateInstructor: (id: string, data: { firstName?: string; lastName?: string; phone?: string }) =>
    apiRequest(`/admin/instructors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleInstructorBan: (id: string, action: 'BAN' | 'UNBAN', reason?: string) =>
    apiRequest(`/admin/instructors/${id}/ban`, { method: 'POST', body: JSON.stringify({ action, reason }) }),

  // In-App Notifications
  getNotifications: (limit?: number) => apiRequest(`/notifications${limit ? `?limit=${limit}` : ''}`),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),

  // Audit Logs
  getAuditLogs: (params?: { limit?: number; offset?: number; search?: string; action?: string; resource?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.action) query.append('action', params.action);
    if (params?.resource) query.append('resource', params.resource);
    const qs = query.toString();
    return apiRequest(`/audit/logs${qs ? `?${qs}` : ''}`);
  },

  // Counselor & Student Support
  getCounselorAtRisk: () => apiRequest('/counselor/at-risk'),
  getCounselingRecords: (studentId?: string, status?: string) => {
    const query = new URLSearchParams();
    if (studentId) query.append('studentId', studentId);
    if (status) query.append('status', status);
    const qs = query.toString();
    return apiRequest(`/counselor/records${qs ? `?${qs}` : ''}`);
  },
  createCounselingRecord: (data: any) => apiRequest('/counselor/records', { method: 'POST', body: JSON.stringify(data) }),
  updateCounselingRecord: (id: string, data: any) => apiRequest(`/counselor/records/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Innovation & Competitions
  getCompetitions: () => apiRequest('/competitions'),
  createCompetition: (data: any) => apiRequest('/competitions', { method: 'POST', body: JSON.stringify(data) }),
  createCompetitionTeam: (data: any) => apiRequest('/competitions/teams', { method: 'POST', body: JSON.stringify(data) }),
  scoreCompetitionTeam: (teamId: string, data: any) => apiRequest(`/competitions/teams/${teamId}/score`, { method: 'POST', body: JSON.stringify(data) }),

  // Corporate & NGO Partner
  getPartnerOverview: (partnerId?: string) => apiRequest(`/partner/overview${partnerId ? `?partnerId=${partnerId}` : ''}`),

  // Program Coordinator
  getCoordinatorOverview: () => apiRequest('/coordinator/overview'),

  // Applicant Portal
  getApplicantDashboard: () => apiRequest('/applicant/dashboard'),

  // AI-Native Academy Operating System
  generateProgram: (data: any) => apiRequest('/ai/generate-program', { method: 'POST', body: JSON.stringify(data) }),
  generateCurriculum: (data: any) => apiRequest('/ai/generate-curriculum', { method: 'POST', body: JSON.stringify(data) }),
  generateSyllabus: (data: any) => apiRequest('/ai/generate-syllabus', { method: 'POST', body: JSON.stringify(data) }),
  generateAssessment: (data: any) => apiRequest('/ai/generate-assessment', { method: 'POST', body: JSON.stringify(data) }),
  generateLessonPlan: (data: any) => apiRequest('/ai/generate-lesson-plan', { method: 'POST', body: JSON.stringify(data) }),
  generateAssignment: (data: any) => apiRequest('/ai/generate-assignment', { method: 'POST', body: JSON.stringify(data) }),
  runQualityCheck: (data: any) => apiRequest('/ai/quality-check', { method: 'POST', body: JSON.stringify(data) }),
  generateFeedback: (data: any) => apiRequest('/ai/generate-feedback', { method: 'POST', body: JSON.stringify(data) }),
  studentCopilot: (data: any) => apiRequest('/ai/student-copilot', { method: 'POST', body: JSON.stringify(data) }),
  parentAssistant: (data: any) => apiRequest('/ai/parent-assistant', { method: 'POST', body: JSON.stringify(data) }),
  adminAssistant: (data: any) => apiRequest('/ai/admin-assistant', { method: 'POST', body: JSON.stringify(data) }),
  publishProgram: (data: any) => apiRequest('/ai/publish-program', { method: 'POST', body: JSON.stringify(data) }),
  optimizeCohortSchedule: (data: { programs: any[]; preferredTiming?: string; hubLocation?: string }) =>
    apiRequest('/ai/optimize-schedule', { method: 'POST', body: JSON.stringify(data) }),
  generatePlacementRationale: (data: {
    applicantName: string;
    programName: string;
    action: string;
    level?: string;
    score?: number;
    experience?: string;
    previousProjects?: string;
    careerGoals?: string;
  }) => apiRequest('/ai/placement-rationale', { method: 'POST', body: JSON.stringify(data) }),
  getAIGenerations: (params?: { entityType?: string; entityId?: string; actionType?: string }) => {
    const query = new URLSearchParams();
    if (params?.entityType) query.append('entityType', params.entityType);
    if (params?.entityId) query.append('entityId', params.entityId);
    if (params?.actionType) query.append('actionType', params.actionType);
    const qs = query.toString();
    return apiRequest(`/ai/generations${qs ? `?${qs}` : ''}`);
  },
  reviewAIDraft: (generationId: string, data: { action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION'; notes?: string; overrideOutput?: any; reviewNotes?: string }) =>
    apiRequest(`/ai/drafts/${generationId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: data.action,
        notes: data.notes || data.reviewNotes,
        overrideOutput: data.overrideOutput,
      }),
    }),
  getNotificationDeliveries: () => apiRequest('/notifications/deliveries'),

  // Cloudflare R2 File Uploads
  uploadFile: (file: File, folder: string = 'receipts') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return apiRequest<{
      success: boolean;
      url: string;
      key: string;
      size: number;
      mimeType: string;
      provider: 'r2' | 'local';
    }>('/upload', { method: 'POST', body: formData });
  },
  getStorageStatus: () => apiRequest('/upload/status'),

  // Academic Inquiries & Contact Forms
  submitInquiry: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    apiRequest('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  getInquiries: (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    return apiRequest(`/inquiries${qs ? `?${qs}` : ''}`);
  },
  updateInquiryStatus: (id: string, data: { status: string; notes?: string }) =>
    apiRequest(`/inquiries/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  replyToInquiry: (id: string, data: { subject: string; message: string; notes?: string }) =>
    apiRequest(`/inquiries/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),

  // Directory & Learner 360 Hub
  getDirectoryStats: () => apiRequest('/admin/directory/stats'),
  getDirectoryUsers: (params?: {
    search?: string;
    role?: string;
    cohortId?: string;
    paymentStatus?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.cohortId) query.append('cohortId', params.cohortId);
    if (params?.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    const qs = query.toString();
    return apiRequest(`/admin/directory/users${qs ? `?${qs}` : ''}`);
  },
  getUserProfile360: (id: string) => apiRequest(`/admin/directory/users/${id}/profile360`),
};


