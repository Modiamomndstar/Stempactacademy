import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PortalSidebar } from './PortalSidebar';
import {
  Menu,
  ArrowLeft,
  User,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Desktop Fixed Role Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 xl:w-72 z-40 shadow-xl">
        <PortalSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* 2. Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 z-50 shadow-2xl flex flex-col">
            <PortalSidebar
              onCloseMobile={() => setMobileOpen(false)}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </div>
      )}

      {/* 3. Main Portal Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72 min-h-screen">
        {/* Top Portal Utility Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open portal navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <span>
                  {location.pathname.startsWith('/portal/instructor') || user.role === 'INSTRUCTOR'
                    ? 'FACULTY INSTRUCTOR'
                    : location.pathname.startsWith('/portal/student') || user.role === 'STUDENT'
                    ? 'STUDENT LEARNER'
                    : location.pathname.startsWith('/portal/parent') || user.role === 'PARENT'
                    ? 'PARENT & GUARDIAN'
                    : user.role.replace('_', ' ')}{' '}
                  PORTAL
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono font-normal">
                  Ile-Ife Campus Hub
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/portal/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
            >
              <span>Switch Portal</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Return to Website</span>
              <span className="sm:hidden">Website</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {user.username ? `@${user.username}` : user.email}
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.firstName ? user.firstName[0] : 'U'}
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Portal Page Body */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
};
