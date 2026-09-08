import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SideMenuLayout } from './components/SideMenuLayout';

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

// Auth & Dashboard Portals
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { ParentPortalPage } from './pages/parent/ParentPortalPage';
import { InstructorPortalPage } from './pages/instructor/InstructorPortalPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/portal/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Main App Navigation Shell
const AppShell: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const routes = (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/schools" element={<SchoolsPage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="/programs/:code" element={<ProgramDetailPage />} />
      <Route path="/cohorts" element={<CohortsPage />} />
      <Route path="/admissions" element={<AdmissionsPage />} />
      <Route path="/apply" element={<ApplicationWizardPage />} />
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

      {/* Auth Portal */}
      <Route path="/portal/login" element={<LoginPage />} />

      {/* Authenticated Role Portals */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'SUPER_ADMIN', 'ACADEMIC_ADMIN']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['PARENT', 'SUPER_ADMIN', 'ACADEMIC_ADMIN']}>
            <ParentPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'SUPER_ADMIN', 'ACADEMIC_ADMIN']}>
            <InstructorPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Home Page: Uses full-width top Navbar layout
  if (isHomePage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{routes}</main>
        <Footer />
      </div>
    );
  }

  // All Other Pages: Uses dedicated Side Menu layout
  return <SideMenuLayout>{routes}</SideMenuLayout>;
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
