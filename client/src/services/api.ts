const API_BASE = '/api';

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
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
  getPrograms: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/programs${query ? `?${query}` : ''}`);
  },
  getProgramByCode: (code: string) => apiRequest(`/programs/${code}`),
  updateProgramStatus: (id: string, data: any) => apiRequest(`/programs/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Cohorts
  getCohorts: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/cohorts${query ? `?${query}` : ''}`);
  },
  getCohortById: (id: string) => apiRequest(`/cohorts/${id}`),
  createCohort: (data: any) => apiRequest('/cohorts', { method: 'POST', body: JSON.stringify(data) }),
  updateCohort: (id: string, data: any) => apiRequest(`/cohorts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

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

  // Portals
  getStudentDashboard: () => apiRequest('/student/dashboard'),
  getParentDashboard: () => apiRequest('/parent/dashboard'),
  getInstructorDashboard: () => apiRequest('/instructor/dashboard'),
  createClassSession: (data: any) => apiRequest('/instructor/sessions', { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  markAttendance: (data: { classSessionId: string; records: { studentId: string; status: string; remarks?: string }[] }) =>
    apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
  getAttendanceForCohort: (cohortId: string) => apiRequest(`/attendance/cohort/${cohortId}`),

  // Assignments
  createAssignment: (data: any) => apiRequest('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  submitAssignment: (data: any) => apiRequest('/assignments/submit', { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (submissionId: string, data: { grade: number; feedback?: string }) =>
    apiRequest(`/assignments/submissions/${submissionId}/grade`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Projects
  getProjects: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/projects${query ? `?${query}` : ''}`);
  },
  createProject: (data: any) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),

  // Certificates & Public Verification
  verifyCertificate: (certNumber: string) => apiRequest(`/certificates/verify/${certNumber}`),
  getCertificates: () => apiRequest('/certificates'),
  issueCertificate: (data: any) => apiRequest('/certificates/issue', { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  getInvoices: () => apiRequest('/payments/invoices'),
  payInvoice: (data: { invoiceId: string; amount: number; channel?: string; payerName?: string; payerEmail?: string }) =>
    apiRequest('/payments/pay', { method: 'POST', body: JSON.stringify(data) }),

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
  getInstructors: () => apiRequest('/admin/instructors'),
  createInstructor: (data: any) => apiRequest('/admin/instructors', { method: 'POST', body: JSON.stringify(data) }),
};
