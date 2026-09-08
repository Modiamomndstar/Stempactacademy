import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SideMenu } from './SideMenu';
import { Footer } from './Footer';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  ArrowRight,
  Home,
} from 'lucide-react';

interface SideMenuLayoutProps {
  children: React.ReactNode;
}

export const SideMenuLayout: React.FC<SideMenuLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, portalRoute } = useAuth();

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Format breadcrumb text
  const getBreadcrumbTitle = () => {
    const path = location.pathname.replace(/^\//, '');
    if (!path) return 'Home';
    const segments = path.split('/');
    const first = segments[0];

    const mapping: Record<string, string> = {
      about: 'About Academy',
      schools: 'Academic Schools',
      programs: 'Academic Programs',
      cohorts: 'Current Cohorts',
      admissions: 'Admissions',
      apply: 'Application Wizard',
      assessment: 'Diagnostic Assessment',
      'innovation-lab': 'Innovation Lab',
      'startup-lab': 'Startup Lab',
      competitions: 'Competitions & Hackathons',
      projects: 'Project Showcase',
      events: 'Events & Talks',
      blog: 'Blog & Articles',
      contact: 'Contact Us',
      faq: 'Frequently Asked Questions',
      verify: 'Certificate Verification',
      student: 'Student Portal',
      parent: 'Parent / Guardian Portal',
      instructor: 'Instructor Portal',
      admin: 'Executive Admin Console',
      portal: 'Portal Authentication',
    };

    const mainTitle = mapping[first] || first.charAt(0).toUpperCase() + first.slice(1);
    if (segments.length > 1) {
      return `${mainTitle} / ${segments.slice(1).join(' / ')}`;
    }
    return mainTitle;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Desktop Fixed Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 xl:w-72 z-40 shadow-xs">
        <SideMenu />
      </div>

      {/* 2. Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Sliding drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transform transition-transform ease-in-out duration-200">
            <SideMenu onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Content Column with Sidebar Offset */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72">
        {/* Compact Internal Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
          {/* Left: Mobile Drawer Trigger & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 lg:hidden transition-colors"
              aria-label="Open side menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Link to="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
                {getBreadcrumbTitle()}
              </span>
            </nav>
          </div>

          {/* Right: Quick Action CTAs & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/verify"
              className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Verify Certificate</span>
            </Link>

            <span className="hidden xl:inline text-slate-300">|</span>

            <span className="hidden xl:flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ile-Ife Campus</span>
            </span>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={portalRoute}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-semibold transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{user.firstName}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Log Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/portal/login"
                className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Portal Login
              </Link>
            )}

            <Link
              to="/apply"
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <span>Apply</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 w-full">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
