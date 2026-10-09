import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.js';

import * as authController from '../controllers/authController.js';
import * as schoolController from '../controllers/schoolController.js';
import * as programController from '../controllers/programController.js';
import * as cohortController from '../controllers/cohortController.js';
import * as applicationController from '../controllers/applicationController.js';
import * as assessmentController from '../controllers/assessmentController.js';
import * as placementController from '../controllers/placementController.js';
import * as admissionController from '../controllers/admissionController.js';
import * as studentController from '../controllers/studentController.js';
import * as parentController from '../controllers/parentController.js';
import * as instructorController from '../controllers/instructorController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as assignmentController from '../controllers/assignmentController.js';
import * as projectController from '../controllers/projectController.js';
import * as certificateController from '../controllers/certificateController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as cmsController from '../controllers/cmsController.js';
import * as adminStatsController from '../controllers/adminStatsController.js';
import * as adminUserController from '../controllers/adminUserController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as auditController from '../controllers/auditController.js';
import * as counselorController from '../controllers/counselorController.js';
import * as innovationController from '../controllers/innovationController.js';
import * as partnerController from '../controllers/partnerController.js';
import * as coordinatorController from '../controllers/coordinatorController.js';
import * as applicantController from '../controllers/applicantController.js';
import * as aiController from '../controllers/aiController.js';
import * as academicSessionController from '../controllers/academicSessionController.js';
import * as centerController from '../controllers/centerController.js';
import * as progressionController from '../controllers/progressionController.js';
import * as uploadController from '../controllers/uploadController.js';
import * as financeController from '../controllers/financeController.js';
import * as marketingController from '../controllers/marketingController.js';
import * as inquiryController from '../controllers/inquiryController.js';
import * as adminDirectoryController from '../controllers/adminDirectoryController.js';
import { BootstrapService } from '../services/bootstrap/bootstrapService.js';

const router = Router();

// 1. Authentication
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);

// 2. Schools & Programs
router.get('/schools', schoolController.getSchools);
router.get('/schools/:code', schoolController.getSchoolByCode);
router.post('/admin/schools', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), schoolController.createSchool);
router.put('/admin/schools/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), schoolController.updateSchool);
router.delete('/admin/schools/:id', authenticate, authorize(Role.SUPER_ADMIN), schoolController.deleteSchool);

router.get('/programs', programController.getPrograms);
router.get('/programs/:code', programController.getProgramByCode);
router.post('/admin/programs', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), programController.createProgram);
router.put('/admin/programs/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), programController.updateProgram);
router.delete('/admin/programs/:id', authenticate, authorize(Role.SUPER_ADMIN), programController.deleteProgram);
router.patch('/programs/:id/status', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), programController.updateProgramStatus);
router.post('/admin/programs/:id/curate-videos', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.CONTENT_MANAGER), programController.curateVideos);
router.patch('/admin/lessons/:lessonId/video', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.CONTENT_MANAGER), programController.updateLessonVideo);
router.post('/admin/lessons/:lessonId/curate-video', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.CONTENT_MANAGER), programController.curateSingleLessonVideo);

// 2.2 Learning Centers (Multi-Center & Multi-Campus)
router.get('/centers', centerController.getCenters);
router.get('/centers/:id', centerController.getCenterById);
router.post('/admin/centers', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), centerController.createCenter);
router.put('/admin/centers/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), centerController.updateCenter);
router.post('/admin/centers/seed', authenticate, authorize(Role.SUPER_ADMIN), centerController.seedDefaultCenters);

// 2.5 Academic Calendars & Sessions
router.get('/academic-sessions', academicSessionController.getAcademicSessions);
router.post('/academic-sessions', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), academicSessionController.createAcademicSession);
router.patch('/academic-sessions/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), academicSessionController.updateAcademicSession);

// 3. Cohorts
router.get('/cohorts', cohortController.getCohorts);
router.post('/cohorts/purge-legacy', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), cohortController.purgeLegacyCohorts);
router.get('/cohorts/:id', cohortController.getCohortById);
router.get('/cohorts/:id/analysis', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN), cohortController.getCohortAnalysis);
router.post('/cohorts/estimate-timeline', cohortController.estimateTimeline);
router.post('/cohorts', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACADEMIC_ADMIN, Role.PROGRAM_COORDINATOR), cohortController.createCohort);
router.patch('/cohorts/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACADEMIC_ADMIN, Role.PROGRAM_COORDINATOR), cohortController.updateCohort);
router.delete('/cohorts/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), cohortController.deleteCohort);

// 4. Applications
router.post('/applications', applicationController.submitApplication);
router.get('/applications', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN), applicationController.getApplications);
router.get('/applications/:id', authenticate, applicationController.getApplicationById);

// 5. Assessments
router.get('/assessments', assessmentController.getAssessmentForProgram);
router.post('/assessments/attempt', authenticate, assessmentController.submitAssessmentAttempt);

// 6. Placements (Academic Board Approval Workflow)
router.get('/placements/pending', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR), placementController.getPendingPlacements);
router.post('/placements/:placementId/review', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), placementController.reviewAndApprovePlacement);

// 7. Admissions
router.post('/admissions/issue', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN), admissionController.issueAdmission);
router.get('/admissions', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN, Role.FINANCE_ADMIN), admissionController.getAdmissions);
router.get('/admissions/:number', authenticate, admissionController.getAdmissionByNumber);
router.post('/admissions/:admissionId/accept', authenticate, admissionController.acceptAdmission);
router.post('/admissions/:admissionId/decline', authenticate, admissionController.declineAdmission);
router.post('/admissions/:admissionId/withdraw', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN), admissionController.withdrawAdmission);
router.get('/admissions/:admissionId/eligibility', authenticate, admissionController.checkEligibility);
router.post('/admissions/:admissionId/enroll', authenticate, admissionController.enrollStudent);
router.get('/admissions/:admissionId/document', authenticate, admissionController.getAdmissionDocument);
router.post('/admissions/:admissionId/deliver-letter', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN), admissionController.deliverAdmissionLetter);
router.post('/admissions/:admissionId/transfer-program', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN), admissionController.transferProgram);

// 8. Portals: Student, Parent, Instructor, Applicant, Coordinator, Partner
router.get('/student/dashboard', authenticate, studentController.getStudentDashboard);
router.get('/student/curriculum', authenticate, studentController.getStudentCurriculum);
router.post('/student/lessons/:lessonId/progress', authenticate, studentController.recordLessonProgress);
router.get('/student/completion-readiness', authenticate, studentController.getCompletionReadiness);
router.get('/parent/dashboard', authenticate, parentController.getParentDashboard);
router.post('/parent/wards', authenticate, authorize(Role.SUPER_ADMIN, Role.PARENT), parentController.registerWard);
router.get('/parent/wards/:studentId/academic-records', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.PARENT), parentController.getWardAcademicRecords);
router.get('/instructor/dashboard', authenticate, instructorController.getInstructorDashboard);
router.get('/instructor/cohorts/:cohortId/curriculum', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), instructorController.getCohortCurriculum);
router.post('/instructor/sessions', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), instructorController.createClassSession);
router.post('/instructor/competencies/evaluate', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), instructorController.evaluateCompetency);
router.get('/applicant/dashboard', authenticate, applicantController.getApplicantDashboard);
router.get('/coordinator/overview', authenticate, authorize(Role.SUPER_ADMIN, Role.PROGRAM_COORDINATOR, Role.COORDINATOR_ADMIN), coordinatorController.getCoordinatorOverview);
router.get('/partner/overview', authenticate, authorize(Role.SUPER_ADMIN, Role.PARTNER), partnerController.getPartnerOverview);

// 8.5 Academic Progression & Multi-Cohort Entitlements (Level 1 -> Level 4)
router.get('/progression/journey', authenticate, progressionController.getAcademicJourney);
router.get('/progression/journey/:studentId', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR), progressionController.getAcademicJourney);
router.post('/progression/evaluate', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR), progressionController.evaluateLevelCompletion);
router.post('/progression/claim', authenticate, progressionController.claimProgression);

// 9. Attendance
router.post('/attendance/mark', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), attendanceController.markAttendance);
router.get('/attendance/cohort/:cohortId', authenticate, attendanceController.getAttendanceForCohort);

// 10. Assignments & Grading
router.post('/assignments', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), assignmentController.createAssignment);
router.post('/assignments/submit', authenticate, assignmentController.submitAssignment);
router.patch('/assignments/submissions/:submissionId/grade', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), assignmentController.gradeSubmission);
router.post('/assignments/submissions/:submissionId/ai-grade-draft', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), assignmentController.generateAiGradeDraft);
router.get('/assignments/:assignmentId/submissions', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), assignmentController.getAssignmentSubmissions);
router.get('/assignments/my-submissions', authenticate, assignmentController.getMySubmissions);

// 11. Projects & Showcase
router.get('/projects', projectController.getProjects);
router.post('/projects', authenticate, projectController.createProject);
router.patch('/projects/:projectId/evidence', authenticate, projectController.updateProjectEvidence);
router.post('/projects/:projectId/evaluate', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR), projectController.evaluateProject);

// 12. Certificates & Public Verification
router.get('/certificates/verify/:certNumber', certificateController.verifyCertificate);
router.get('/certificates', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), certificateController.getCertificates);
router.post('/certificates/issue', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), certificateController.issueCertificate);

// 13. Payments, Gateways & Bank Transfers
router.get('/payments/invoices', authenticate, paymentController.getInvoices);
router.post('/payments/pay', authenticate, paymentController.payInvoice);
router.post('/payments/initialize', authenticate, paymentController.initializeOnlinePayment);
router.post('/payments/webhook/paystack', paymentController.paystackWebhook);
router.post('/payments/webhook/flutterwave', paymentController.flutterwaveWebhook);
router.post('/payments/bank-transfer', authenticate, paymentController.submitBankTransfer);
router.get('/payments/bank-transfers', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), paymentController.getBankTransfers);
router.post('/payments/bank-transfers/:paymentId/approve', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), paymentController.approveBankTransfer);
router.post('/payments/bank-transfers/:paymentId/reject', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), paymentController.rejectBankTransfer);
router.post('/payments/waivers', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), paymentController.grantFinancialWaiver);
router.get('/payments/clearance/:admissionId', authenticate, paymentController.getFinancialClearance);
router.post('/payments/arrangements', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), paymentController.approvePaymentArrangement);
router.post('/payments/adjustments', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), paymentController.applyFinancialAdjustment);
router.post('/payments/apply-coupon', authenticate, financeController.applyCoupon);
router.post('/payments/select-plan', authenticate, financeController.selectInstallmentPlan);

// 13b. Financial Operations, Coupons, Custom Invoices & Reminders
router.post('/finance/coupons', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.createCoupon);
router.get('/finance/coupons', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.getCoupons);
router.patch('/finance/coupons/:id/toggle', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.toggleCoupon);
router.post('/finance/invoices/custom', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.createCustomInvoice);
router.get('/finance/overview', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.getFinancialOverview);
router.post('/finance/invoices/:id/reminder', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.sendPaymentReminder);

// 13c. Institutional Signatory Settings & Payment Gateways
router.get('/settings/institution', financeController.getInstitutionalSettings);
router.put('/settings/institution', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), financeController.updateInstitutionalSettings);
router.get('/payments/settings', financeController.getPublicPaymentSettings);
router.get('/admin/payment-settings', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.getAdminPaymentSettings);
router.put('/admin/payment-settings', authenticate, authorize(Role.SUPER_ADMIN, Role.FINANCE_ADMIN), financeController.updatePaymentSettings);

// 13d. Multi-Level Program Curriculum Matrix
router.get('/programs/:id/curriculum-matrix', financeController.getProgramCurriculumMatrix);

// 13e. Marketing & Admissions Leads CRM
router.get('/marketing/leads', authenticate, authorize(Role.SUPER_ADMIN, Role.MARKETING_MANAGER, Role.ADMISSIONS_ADMIN), marketingController.getMarketingLeads);
router.post('/marketing/follow-up', authenticate, authorize(Role.SUPER_ADMIN, Role.MARKETING_MANAGER, Role.ADMISSIONS_ADMIN), marketingController.recordLeadFollowUp);
router.patch('/marketing/leads/:id/status', authenticate, authorize(Role.SUPER_ADMIN, Role.MARKETING_MANAGER, Role.ADMISSIONS_ADMIN), marketingController.updateLeadMarketingStatus);
router.post('/marketing/send-email', authenticate, authorize(Role.SUPER_ADMIN, Role.MARKETING_MANAGER, Role.ADMISSIONS_ADMIN), marketingController.sendLeadFollowUpEmail);

// 14. CMS & Public Feeds
router.get('/cms/content', cmsController.getCMSContent);
router.post('/cms/announcements', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR, Role.MARKETING_MANAGER), cmsController.createAnnouncement);
router.post('/cms/events', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.MARKETING_MANAGER), cmsController.createEvent);
router.post('/cms/blog', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.MARKETING_MANAGER), cmsController.createBlogPost);

// 15. Admin Analytics
router.get('/admin/stats', authenticate, authorize(Role.SUPER_ADMIN, Role.COORDINATOR_ADMIN, Role.PROGRAM_COORDINATOR, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN, Role.ADMISSIONS_ADMIN, Role.MARKETING_MANAGER), adminStatsController.getAdminStats);

// 15b. Learners & Community Directory (360° Profile Hub & Analytics)
router.get('/admin/directory/stats', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN, Role.ADMISSIONS_ADMIN, Role.MARKETING_MANAGER), adminDirectoryController.getDirectoryStats);
router.get('/admin/directory/users', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN, Role.ADMISSIONS_ADMIN, Role.MARKETING_MANAGER), adminDirectoryController.getDirectoryUsers);
router.get('/admin/directory/users/:id/profile360', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN, Role.ADMISSIONS_ADMIN, Role.MARKETING_MANAGER), adminDirectoryController.getUserProfile360);

// 16. Admin & Staff Management
router.post('/admin/admins', authenticate, authorize(Role.SUPER_ADMIN), adminUserController.createAdmin);
router.get('/admin/admins', authenticate, authorize(Role.SUPER_ADMIN), adminUserController.getAdmins);
router.patch('/admin/admins/:id', authenticate, authorize(Role.SUPER_ADMIN), adminUserController.updateAdminUser);
router.post('/admin/admins/:id/ban', authenticate, authorize(Role.SUPER_ADMIN), adminUserController.toggleUserBan);
router.post('/admin/instructors', authenticate, authorize(Role.SUPER_ADMIN, Role.COORDINATOR_ADMIN, Role.PROGRAM_COORDINATOR), adminUserController.createInstructor);
router.get('/admin/instructors', authenticate, authorize(Role.SUPER_ADMIN, Role.COORDINATOR_ADMIN, Role.PROGRAM_COORDINATOR, Role.ACADEMIC_ADMIN), adminUserController.getInstructors);
router.patch('/admin/instructors/:id', authenticate, authorize(Role.SUPER_ADMIN), adminUserController.updateAdminUser);
router.post('/admin/instructors/:id/ban', authenticate, authorize(Role.SUPER_ADMIN), adminUserController.toggleUserBan);

// 17. In-App Notifications & Preferences
router.get('/notifications', authenticate, notificationController.getNotifications);
router.patch('/notifications/:id/read', authenticate, notificationController.markRead);
router.patch('/notifications/read-all', authenticate, notificationController.markAllRead);
router.get('/notifications/preferences', authenticate, notificationController.getPreferences);
router.put('/notifications/preferences', authenticate, notificationController.updatePreferences);
router.get('/notifications/deliveries', authenticate, notificationController.getDeliveries);

// 18. Audit Trail
router.get('/audit/logs', authenticate, authorize(Role.SUPER_ADMIN), auditController.getAuditLogs);

// 19. Counseling & Student Support
router.get('/counselor/at-risk', authenticate, authorize(Role.SUPER_ADMIN, Role.COUNSELOR, Role.ACADEMIC_ADMIN), counselorController.getAtRiskStudents);
router.get('/counselor/records', authenticate, authorize(Role.SUPER_ADMIN, Role.COUNSELOR), counselorController.getCounselingRecords);
router.post('/counselor/records', authenticate, authorize(Role.SUPER_ADMIN, Role.COUNSELOR), counselorController.createCounselingRecord);
router.patch('/counselor/records/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.COUNSELOR), counselorController.updateCounselingRecord);

// 20. Innovation & Competitions
router.get('/competitions', innovationController.getCompetitions);
router.post('/competitions', authenticate, authorize(Role.SUPER_ADMIN, Role.INNOVATION_MANAGER), innovationController.createCompetition);
router.post('/competitions/teams', authenticate, authorize(Role.SUPER_ADMIN, Role.INNOVATION_MANAGER), innovationController.createTeam);
router.post('/competitions/teams/:teamId/score', authenticate, authorize(Role.SUPER_ADMIN, Role.INNOVATION_MANAGER), innovationController.scoreTeam);

// 21. STEMPACT AI Engine Endpoints (with dual-route compatibility for client and backend aliases)
router.post('/ai/generate-program', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.generateProgram);
router.post('/ai/programs/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.generateProgram);

router.post('/ai/generate-curriculum', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.generateCurriculum);
router.post('/ai/curriculum/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.generateCurriculum);

router.post('/ai/generate-syllabus', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.PROGRAM_COORDINATOR, Role.INSTRUCTOR), aiController.generateSyllabus);
router.post('/ai/syllabus/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.PROGRAM_COORDINATOR, Role.INSTRUCTOR), aiController.generateSyllabus);

router.post('/ai/generate-lesson-plan', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.generateLessonPlan);
router.post('/ai/lessons/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.generateLessonPlan);

router.post('/ai/generate-assessment', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN, Role.INSTRUCTOR), aiController.generateAssessment);
router.post('/ai/assessments/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN, Role.INSTRUCTOR), aiController.generateAssessment);

router.post('/ai/generate-assignment', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.generateAssignment);
router.post('/ai/assignments/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.generateAssignment);

router.post('/ai/quality-check', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.runQualityCheck);

router.post('/ai/generate-feedback', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.generateFeedback);
router.post('/ai/feedback/generate', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.generateFeedback);

router.post('/ai/student-copilot', authenticate, authorize(Role.SUPER_ADMIN, Role.STUDENT, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.studentCopilot);
router.post('/ai/learning-assistant', authenticate, authorize(Role.SUPER_ADMIN, Role.STUDENT, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), aiController.studentCopilot);

router.post('/ai/parent-assistant', authenticate, authorize(Role.SUPER_ADMIN, Role.PARENT, Role.ACADEMIC_ADMIN), aiController.parentAssistant);
router.post('/ai/admin-assistant', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN, Role.ADMISSIONS_ADMIN, Role.COORDINATOR_ADMIN, Role.PROGRAM_COORDINATOR), aiController.adminAssistant);

router.post('/ai/publish-program', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.approveAndPublish);
router.post('/ai/generations/:id/approve', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.approveAndPublish);
router.patch('/ai/drafts/:generationId/review', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR, Role.PROGRAM_COORDINATOR, Role.COORDINATOR_ADMIN), aiController.reviewDraft);
router.get('/ai/generations', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), aiController.getAIGenerations);
router.post('/ai/optimize-schedule', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.PROGRAM_COORDINATOR, Role.COORDINATOR_ADMIN), aiController.optimizeSchedule);
router.post('/ai/placement-rationale', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.ADMISSIONS_ADMIN), aiController.generatePlacementRationale);

// 22. Database Bootstrap & System Health Diagnostics
router.get('/bootstrap/status', authenticate, authorize(Role.SUPER_ADMIN), async (req, res) => {
  try {
    const status = await BootstrapService.getStatus();
    res.json({ status: 'OK', data: status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bootstrap/seed', authenticate, authorize(Role.SUPER_ADMIN), async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      message: 'Forced database re-seeding is strictly disabled in production mode.',
    });
    return;
  }
  try {
    const result = await BootstrapService.seedAll(true);
    res.json({ status: 'OK', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 23. File Upload & Cloudflare R2 Storage
router.post('/upload', authenticate, uploadController.uploadMiddleware.single('file'), uploadController.uploadSingleFile);
router.get('/upload/status', uploadController.getStorageStatus);

// 24. Public Academic Inquiries & Contact Forms
router.post('/inquiries', inquiryController.submitPublicInquiry);
router.get('/inquiries', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMISSIONS_ADMIN, Role.ACADEMIC_ADMIN, Role.MARKETING_MANAGER), inquiryController.getInquiries);
router.patch('/inquiries/:id/status', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMISSIONS_ADMIN, Role.ACADEMIC_ADMIN, Role.MARKETING_MANAGER), inquiryController.updateInquiryStatus);
router.post('/inquiries/:id/reply', authenticate, authorize(Role.SUPER_ADMIN, Role.ADMISSIONS_ADMIN, Role.ACADEMIC_ADMIN, Role.MARKETING_MANAGER), inquiryController.replyToInquiry);

export default router;
