import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { SchoolsPage } from './pages/public/SchoolsPage';
import { ProgramsPage } from './pages/public/ProgramsPage';
import { ProgramDetailPage } from './pages/public/ProgramDetailPage';
import { CohortsPage } from './pages/public/CohortsPage';
import { AdmissionsPage } from './pages/public/AdmissionsPage';
import { ApplicationWizardPage } from './pages/public/ApplicationWizardPage';
import { AssessmentEnginePage } from './pages/public/AssessmentEnginePage';
import { InnovationLabPage } from './pages/public/InnovationLabPage';
import { StartupLabPage } from './pages/public/StartupLabPage';
import { CompetitionsPage } from './pages/public/CompetitionsPage';
import { ProjectsPage } from './pages/public/ProjectsPage';
import { EventsPage } from './pages/public/EventsPage';
import { BlogPage } from './pages/public/BlogPage';
import { ContactPage } from './pages/public/ContactPage';
import { FAQPage } from './pages/public/FAQPage';
import { CertificateVerifyPage } from './pages/public/CertificateVerifyPage';

// Auth & Registration Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Authenticated Role Portals
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { ParentPortalPage } from './pages/parent/ParentPortalPage';
import { InstructorPortalPage } from './pages/instructor/InstructorPortalPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ApplicantDashboardPage } from './pages/applicant/ApplicantDashboardPage';
import { CounselorDashboardPage } from './pages/counselor/CounselorDashboardPage';
import { InnovationDashboardPage } from './pages/innovation/InnovationDashboardPage';
import { PartnerDashboardPage } from './pages/partner/PartnerDashboardPage';
import { CoordinatorDashboardPage } from './pages/coordinator/CoordinatorDashboardPage';

// Protected Route Component with Strict Role Isolation & Super Admin Omnipotence
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading, portalRoute } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/portal/login" replace />;

  // Super Admin has omnipotent access across all role portals
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={portalRoute} replace />;
  }

  return <>{children}</>;
};

// Main App Navigation Shell
const AppShell: React.FC = () => {
  const location = useLocation();

  // Check if current route is an authenticated portal viewport
  const isPortalRoute =
    location.pathname.startsWith('/portal/') && !location.pathname.includes('/login') ||
    location.pathname === '/admin' ||
    location.pathname === '/instructor' ||
    location.pathname === '/student' ||
    location.pathname === '/parent';

  const routes = (
    <Routes>
      {/* 1. Public Marketing Pages (Full Navbar + Content + Footer) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/schools" element={<SchoolsPage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="/programs/:code" element={<ProgramDetailPage />} />
      <Route path="/cohorts" element={<CohortsPage />} />
      <Route path="/admissions" element={<AdmissionsPage />} />
      <Route path="/apply" element={<RegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/application-wizard" element={<ApplicationWizardPage />} />
      <Route path="/assessment" element={<AssessmentEnginePage />} />
      <Route path="/innovation-lab" element={<InnovationLabPage />} />
      <Route path="/startup-lab" element={<StartupLabPage />} />
      <Route path="/competitions" element={<CompetitionsPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/verify" element={<CertificateVerifyPage />} />
      <Route path="/verify/:certNumber" element={<CertificateVerifyPage />} />

      {/* 2. Authentication Gates */}
      <Route path="/portal/login" element={<LoginPage />} />
      <Route path="/portal/admin/login" element={<LoginPage />} />
      <Route path="/portal/instructor/login" element={<LoginPage />} />
      <Route path="/portal/student/login" element={<LoginPage />} />

      {/* 3. Authenticated Role Portals (Render Dedicated Role Sidebars via PortalLayout) */}
      {/* Administration (Super Admin, Academic Admin, Finance Admin, Admissions Admin) */}
      <Route
        path="/portal/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COORDINATOR_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN', 'ADMISSIONS_ADMIN', 'CONTENT_MANAGER', 'MARKETING_MANAGER']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/portal/admin" replace />} />

      {/* Program Coordinator */}
      <Route
        path="/portal/coordinator"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PROGRAM_COORDINATOR', 'COORDINATOR_ADMIN']}>
            <CoordinatorDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Faculty Instructor */}
      <Route
        path="/portal/instructor"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INSTRUCTOR']}>
            <InstructorPortalPage />
          </ProtectedRoute>
        }
      />
      <Route path="/instructor" element={<Navigate to="/portal/instructor" replace />} />

      {/* Student Learner */}
      <Route
        path="/portal/student"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'STUDENT']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/student" element={<Navigate to="/portal/student" replace />} />

      {/* Parent & Guardian */}
      <Route
        path="/portal/parent"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARENT']}>
            <ParentPortalPage />
          </ProtectedRoute>
        }
      />
      <Route path="/parent" element={<Navigate to="/portal/parent" replace />} />

      {/* Prospective Applicant */}
      <Route
        path="/portal/applicant"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'APPLICANT']}>
            <ApplicantDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Student Counselor & Support */}
      <Route
        path="/portal/counselor"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COUNSELOR']}>
            <CounselorDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Innovation & Competition Manager */}
      <Route
        path="/portal/innovation"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INNOVATION_MANAGER']}>
            <InnovationDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Corporate & NGO Partner */}
      <Route
        path="/portal/partner"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTNER']}>
            <PartnerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Authenticated Portal Pages: Render without public Navbar/Footer (PortalLayout handles Sidebar & Top Bar)
  if (isPortalRoute) {
    return <div className="min-h-screen bg-slate-50">{routes}</div>;
  }

  // All Public & Auth Login Pages: Standard Institutional Web Layout (Navbar + Main + Footer)
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{routes}</main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
};

export default App;
