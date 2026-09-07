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

const router = Router();

// 1. Authentication
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);

// 2. Schools & Programs
router.get('/schools', schoolController.getSchools);
router.get('/schools/:code', schoolController.getSchoolByCode);
router.get('/programs', programController.getPrograms);
router.get('/programs/:code', programController.getProgramByCode);
router.patch('/programs/:id/status', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), programController.updateProgramStatus);

// 3. Cohorts
router.get('/cohorts', cohortController.getCohorts);
router.get('/cohorts/:id', cohortController.getCohortById);
router.post('/cohorts', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), cohortController.createCohort);
router.patch('/cohorts/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), cohortController.updateCohort);

// 4. Applications
router.post('/applications', applicationController.submitApplication);
router.get('/applications', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), applicationController.getApplications);
router.get('/applications/:id', applicationController.getApplicationById);

// 5. Assessments
router.get('/assessments', assessmentController.getAssessmentForProgram);
router.post('/assessments/attempt', assessmentController.submitAssessmentAttempt);

// 6. Placements (Academic Board Approval Workflow)
router.get('/placements/pending', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR), placementController.getPendingPlacements);
router.post('/placements/:placementId/review', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), placementController.reviewAndApprovePlacement);

// 7. Admissions
router.post('/admissions/issue', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), admissionController.issueAdmission);
router.get('/admissions', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), admissionController.getAdmissions);
router.get('/admissions/:number', admissionController.getAdmissionByNumber);

// 8. Portals: Student, Parent, Instructor
router.get('/student/dashboard', authenticate, studentController.getStudentDashboard);
router.get('/parent/dashboard', authenticate, parentController.getParentDashboard);
router.get('/instructor/dashboard', authenticate, instructorController.getInstructorDashboard);
router.post('/instructor/sessions', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR), instructorController.createClassSession);

// 9. Attendance
router.post('/attendance/mark', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.ACADEMIC_ADMIN), attendanceController.markAttendance);
router.get('/attendance/cohort/:cohortId', authenticate, attendanceController.getAttendanceForCohort);

// 10. Assignments & Grading
router.post('/assignments', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR), assignmentController.createAssignment);
router.post('/assignments/submit', authenticate, assignmentController.submitAssignment);
router.patch('/assignments/submissions/:submissionId/grade', authenticate, authorize(Role.SUPER_ADMIN, Role.INSTRUCTOR), assignmentController.gradeSubmission);

// 11. Projects & Showcase
router.get('/projects', projectController.getProjects);
router.post('/projects', authenticate, projectController.createProject);

// 12. Certificates & Public Verification
router.get('/certificates/verify/:certNumber', certificateController.verifyCertificate);
router.get('/certificates', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), certificateController.getCertificates);
router.post('/certificates/issue', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), certificateController.issueCertificate);

// 13. Payments & Invoices
router.get('/payments/invoices', authenticate, paymentController.getInvoices);
router.post('/payments/pay', authenticate, paymentController.payInvoice);

// 14. CMS & Public Feeds
router.get('/cms/content', cmsController.getCMSContent);
router.post('/cms/announcements', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.INSTRUCTOR), cmsController.createAnnouncement);
router.post('/cms/events', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), cmsController.createEvent);
router.post('/cms/blog', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN), cmsController.createBlogPost);

// 15. Admin Analytics
router.get('/admin/stats', authenticate, authorize(Role.SUPER_ADMIN, Role.ACADEMIC_ADMIN, Role.FINANCE_ADMIN), adminStatsController.getAdminStats);

export default router;
