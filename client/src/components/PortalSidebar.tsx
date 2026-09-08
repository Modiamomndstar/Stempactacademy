import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STEMLogo } from './STEMLogo';
import {
  TrendingUp,
  Users,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  ClipboardList,
  CreditCard,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  UserCheck,
  FolderGit2,
  Compass,
  ArrowLeft,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';

interface PortalSidebarProps {
  onCloseMobile?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  onCloseMobile,
  activeTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLinkClick = (tabKey?: string) => {
    if (tabKey && onTabChange) {
      onTabChange(tabKey);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Determine role-based menu sections
  const getNavSections = () => {
    if (user.role === 'SUPER_ADMIN') {
      return [
        {
          title: 'Executive & Governance',
          items: [
            { key: 'analytics', label: 'Executive KPIs', icon: TrendingUp, route: '/portal/admin' },
            { key: 'admins', label: 'Admin Accounts', icon: ShieldAlert, route: '/portal/admin', badge: 'Super', badgeColor: 'bg-indigo-600' },
            { key: 'instructors', label: 'Faculty & Instructors', icon: Users, route: '/portal/admin', badge: 'Staff', badgeColor: 'bg-blue-600' },
          ],
        },
        {
          title: 'Academic Core',
          items: [
            { key: 'programs', label: 'Schools & Programs', icon: BookOpen, route: '/portal/admin' },
            { key: 'cohorts', label: 'Cohorts & Scheduling', icon: Calendar, route: '/portal/admin' },
            { key: 'placements', label: 'Placement Review Queue', icon: Sparkles, route: '/portal/admin', badge: 'Board', badgeColor: 'bg-amber-600' },
            { key: 'applications', label: 'Admissions Intake', icon: ClipboardList, route: '/portal/admin' },
          ],
        },
        {
          title: 'Operations & Records',
          items: [
            { key: 'invoices', label: 'Tuition & Invoices', icon: CreditCard, route: '/portal/admin' },
            { key: 'certificates', label: 'Certificates & Clearances', icon: Award, route: '/portal/admin' },
            { key: 'cms', label: 'Campus Bulletins (CMS)', icon: Bell, route: '/portal/admin' },
          ],
        },
      ];
    }

    if (user.role === 'COORDINATOR_ADMIN' || user.role === 'ACADEMIC_ADMIN') {
      return [
        {
          title: 'Academic Administration',
          items: [
            { key: 'analytics', label: 'Academic Overview', icon: TrendingUp, route: '/portal/admin' },
            { key: 'instructors', label: 'Faculty Management', icon: Users, route: '/portal/admin', badge: 'Manage', badgeColor: 'bg-blue-600' },
            { key: 'placements', label: 'Academic Board Placements', icon: Sparkles, route: '/portal/admin', badge: 'Review', badgeColor: 'bg-amber-600' },
            { key: 'cohorts', label: 'Cohorts & Classes', icon: Calendar, route: '/portal/admin' },
            { key: 'applications', label: 'Admissions Intake', icon: ClipboardList, route: '/portal/admin' },
            { key: 'certificates', label: 'Certificate Clearances', icon: Award, route: '/portal/admin' },
          ],
        },
      ];
    }

    if (user.role === 'INSTRUCTOR') {
      return [
        {
          title: 'Instructional Cockpit',
          items: [
            { key: 'overview', label: 'Teaching Overview', icon: TrendingUp, route: '/portal/instructor' },
            { key: 'classes', label: 'My Cohorts & Classes', icon: BookOpen, route: '/portal/instructor' },
            { key: 'attendance', label: 'Daily Attendance Sheet', icon: CheckCircle2, route: '/portal/instructor', badge: 'Live', badgeColor: 'bg-emerald-600' },
            { key: 'grading', label: 'Assignment Grading Queue', icon: ClipboardList, route: '/portal/instructor', badge: 'Tasks', badgeColor: 'bg-amber-600' },
            { key: 'projects', label: 'Capstone Project Reviews', icon: FolderGit2, route: '/portal/instructor' },
          ],
        },
      ];
    }

    if (user.role === 'PARENT') {
      return [
        {
          title: 'Guardian Overview',
          items: [
            { key: 'overview', label: 'Ward Dashboard', icon: TrendingUp, route: '/portal/parent' },
            { key: 'progress', label: 'Curriculum Progress', icon: BookOpen, route: '/portal/parent' },
            { key: 'attendance', label: 'Attendance Ledger', icon: CheckCircle2, route: '/portal/parent' },
            { key: 'grades', label: 'Instructor Feedback & Grades', icon: Award, route: '/portal/parent' },
            { key: 'invoices', label: 'Tuition Fees & Invoices', icon: CreditCard, route: '/portal/parent' },
          ],
        },
      ];
    }

    // Default: STUDENT
    return [
      {
        title: 'Learning Ledger',
        items: [
          { key: 'overview', label: 'My Learning Cockpit', icon: TrendingUp, route: '/portal/student' },
          { key: 'curriculum', label: 'Modules & Syllabus', icon: BookOpen, route: '/portal/student' },
          { key: 'timetable', label: 'Timetable & Class Link', icon: Calendar, route: '/portal/student' },
          { key: 'attendance', label: 'Attendance Record', icon: CheckCircle2, route: '/portal/student' },
          { key: 'assessment', label: 'Diagnostic Assessment', icon: Sparkles, route: '/portal/student', badge: 'Readiness', badgeColor: 'bg-amber-500' },
          { key: 'assignments', label: 'Assignments & Submissions', icon: ClipboardList, route: '/portal/student' },
          { key: 'invoices', label: 'Tuition Fees & Receipts', icon: CreditCard, route: '/portal/student' },
          { key: 'projects', label: 'Submit Capstone Project', icon: FolderGit2, route: '/portal/student' },
        ],
      },
    ];
  };

  const sections = getNavSections();

  return (
    <aside className="h-full flex flex-col bg-slate-900 text-white border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950">
        <Link to="/" className="flex items-center gap-2.5">
          <STEMLogo size="sm" showSubtitle={false} />
          <div>
            <div className="text-xs font-black tracking-tight text-white uppercase">
              STEMPACT PORTAL
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Profile Card */}
      <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
            {user.firstName ? user.firstName[0] : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[10px] text-blue-400 font-mono truncate">
              {user.username ? `@${user.username}` : user.email}
            </div>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold">
            ● Active Session
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Role-Specific Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {section.title}
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isTabActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => handleLinkClick(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                      isTabActive
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isTabActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          item.badgeColor || 'bg-blue-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Switcher: Return to Public Site */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
        <Link
          to="/"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Website</span>
        </Link>

        <div className="text-center text-[10px] text-slate-500 font-mono">
          STEMPACT ACADEMY • Ile-Ife Campus
        </div>
      </div>
    </aside>
  );
};
