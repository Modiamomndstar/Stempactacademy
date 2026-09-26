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
  Layers,
  Compass,
  LogOut,
  X,
  ExternalLink,
  History,
  Send,
  DollarSign,
  UserPlus,
  HeartPulse,
  Lightbulb,
  Briefcase,
  Megaphone,
} from 'lucide-react';

export interface PortalSidebarProps {
  onCloseMobile?: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  onCloseMobile,
  activeSection,
  onSectionChange,
  activeTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleNavigate = (route: string, sectionKey?: string) => {
    if (sectionKey) {
      if (onSectionChange) onSectionChange(sectionKey);
      if (onTabChange) onTabChange(sectionKey);
    }
    if (location.pathname !== route) {
      navigate(route);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getRoleDisplayName = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'SUPER ADMINISTRATOR';
      case 'ACADEMIC_ADMIN':
        return 'ACADEMIC ADMINISTRATOR';
      case 'FINANCE_ADMIN':
        return 'FINANCE ADMINISTRATOR';
      case 'ADMISSIONS_ADMIN':
        return 'ADMISSIONS ADMINISTRATOR';
      case 'PROGRAM_COORDINATOR':
      case 'COORDINATOR_ADMIN':
        return 'PROGRAM COORDINATOR';
      case 'INSTRUCTOR':
        return 'FACULTY MENTOR';
      case 'STUDENT':
        return 'ENROLLED LEARNER';
      case 'PARENT':
        return 'PARENT & GUARDIAN';
      case 'COUNSELOR':
        return 'STUDENT COUNSELOR';
      case 'INNOVATION_MANAGER':
        return 'INNOVATION MANAGER';
      case 'PARTNER':
        return 'CORPORATE & NGO PARTNER';
      case 'APPLICANT':
        return 'PROSPECTIVE APPLICANT';
      default:
        return (user.role as string)?.replace(/_/g, ' ') || 'PORTAL USER';
    }
  };

  // Determine section navigation based on role
  const getNavigationGroups = () => {
    // 1. Prospective Applicant
    if (user.role === 'APPLICANT' || location.pathname.startsWith('/portal/applicant')) {
      return [
        {
          title: 'ENROLLMENT DESK',
          items: [
            { key: 'status', label: 'Application Status', icon: ClipboardList, route: '/portal/applicant' },
            { key: 'assessment', label: 'Diagnostic Assessment', icon: Sparkles, route: '/portal/applicant' },
            { key: 'admission', label: 'Offer of Admission', icon: Award, route: '/portal/applicant' },
            { key: 'tuition', label: 'Tuition & Clearance', icon: CreditCard, route: '/portal/applicant' },
          ],
        },
      ];
    }

    // 2. Student Learner
    if (user.role === 'STUDENT' || location.pathname.startsWith('/portal/student')) {
      return [
        {
          title: 'LEARNING JOURNEY',
          items: [
            { key: 'overview', label: 'Learning Cockpit', icon: TrendingUp, route: '/portal/student' },
            { key: 'curriculum', label: 'Curriculum & Lessons', icon: BookOpen, route: '/portal/student' },
            { key: 'assignments', label: 'Assignments & Projects', icon: ClipboardList, route: '/portal/student' },
            { key: 'attendance', label: 'Timetable & Attendance', icon: Calendar, route: '/portal/student' },
          ],
        },
        {
          title: 'STUDENT SERVICES',
          items: [
            { key: 'finance', label: 'Tuition & Clearance', icon: CreditCard, route: '/portal/student' },
            { key: 'certificates', label: 'Earned Certificates', icon: Award, route: '/portal/student' },
          ],
        },
      ];
    }

    // 3. Faculty Mentor / Instructor
    if (user.role === 'INSTRUCTOR' || location.pathname.startsWith('/portal/instructor')) {
      return [
        {
          title: 'TEACHING WORKSPACE',
          items: [
            { key: 'cockpit', label: 'Faculty Cockpit', icon: TrendingUp, route: '/portal/instructor' },
            { key: 'cohorts', label: 'Assigned Cohorts', icon: Users, route: '/portal/instructor' },
            { key: 'attendance', label: 'Mark Attendance', icon: CheckCircle2, route: '/portal/instructor' },
            { key: 'grading', label: 'Submissions & Grading', icon: ClipboardList, route: '/portal/instructor' },
            { key: 'competencies', label: 'Competency Evaluation', icon: Award, route: '/portal/instructor' },
          ],
        },
      ];
    }

    // 4. Parent & Guardian
    if (user.role === 'PARENT' || location.pathname.startsWith('/portal/parent')) {
      return [
        {
          title: 'WARD OVERSIGHT',
          items: [
            { key: 'overview', label: 'Ward Cockpit', icon: Users, route: '/portal/parent' },
            { key: 'progress', label: 'Academic Progress', icon: BookOpen, route: '/portal/parent' },
            { key: 'attendance', label: 'Attendance History', icon: CheckCircle2, route: '/portal/parent' },
            { key: 'finance', label: 'Tuition & Statements', icon: CreditCard, route: '/portal/parent' },
          ],
        },
      ];
    }

    // 5. Program Coordinator
    if (user.role === 'PROGRAM_COORDINATOR' || user.role === 'COORDINATOR_ADMIN' || location.pathname.startsWith('/portal/coordinator')) {
      return [
        {
          title: 'OPERATIONS',
          items: [
            { key: 'overview', label: 'Pacing Cockpit', icon: Compass, route: '/portal/coordinator' },
            { key: 'cohorts', label: 'Cohorts & Rosters', icon: Users, route: '/portal/coordinator' },
            { key: 'sessions', label: 'Timetable & Sessions', icon: Calendar, route: '/portal/coordinator' },
            { key: 'attendance', label: 'Attendance Oversight', icon: CheckCircle2, route: '/portal/coordinator' },
          ],
        },
      ];
    }

    // 6. Counselor
    if (user.role === 'COUNSELOR' || location.pathname.startsWith('/portal/counselor')) {
      return [
        {
          title: 'STUDENT SUPPORT',
          items: [
            { key: 'atrisk', label: 'At-Risk Watchlist', icon: HeartPulse, route: '/portal/counselor' },
            { key: 'records', label: 'Counseling Records', icon: ClipboardList, route: '/portal/counselor' },
          ],
        },
      ];
    }

    // 7. Innovation & Partner Roles
    if (user.role === 'INNOVATION_MANAGER' || location.pathname.startsWith('/portal/innovation')) {
      return [
        {
          title: 'INNOVATION HUB',
          items: [
            { key: 'competitions', label: 'Competitions & Teams', icon: Lightbulb, route: '/portal/innovation' },
          ],
        },
      ];
    }
    if (user.role === 'PARTNER' || location.pathname.startsWith('/portal/partner')) {
      return [
        {
          title: 'PARTNERSHIP DESK',
          items: [
            { key: 'overview', label: 'CSR & Scholars Roster', icon: Briefcase, route: '/portal/partner' },
          ],
        },
      ];
    }

    // 8. Super Admin & Academic Administration (Full Multi-Section Management Suite)
    return [
      {
        title: 'OVERVIEW',
        items: [
          { key: 'analytics', label: 'Executive Dashboard', icon: TrendingUp, route: '/portal/admin' },
        ],
      },
      {
        title: 'ACADEMIC OPERATIONS',
        items: [
          { key: 'academics', label: 'Schools & Programs', icon: BookOpen, route: '/portal/admin' },
          { key: 'cohorts', label: 'Cohorts & Timetables', icon: Calendar, route: '/portal/admin' },
          { key: 'admissions', label: 'Admissions Pipeline', icon: UserPlus, route: '/portal/admin' },
          { key: 'finance', label: 'Tuition & Ledger', icon: DollarSign, route: '/portal/admin' },
          { key: 'certificates', label: 'Certifications', icon: Award, route: '/portal/admin' },
        ],
      },
      {
        title: 'FACULTY & AI',
        items: [
          { key: 'instructors', label: 'Faculty Mentors', icon: GraduationCap, route: '/portal/admin' },
          { key: 'ai', label: 'AI Studio & Governance', icon: Sparkles, route: '/portal/admin' },
        ],
      },
      {
        title: 'COMMUNICATIONS',
        items: [
          { key: 'cms', label: 'Campus Bulletins (CMS)', icon: Megaphone, route: '/portal/admin' },
          { key: 'deliveries', label: 'Notification Outbox', icon: Send, route: '/portal/admin' },
        ],
      },
      {
        title: 'GOVERNANCE',
        items: [
          { key: 'admins', label: 'Admin Accounts', icon: ShieldAlert, route: '/portal/admin' },
          { key: 'audit', label: 'System Audit Trail', icon: History, route: '/portal/admin' },
        ],
      },
    ];
  };

  const navGroups = getNavigationGroups();
  const currentKey = activeSection || activeTab;

  return (
    <aside className="h-full flex flex-col bg-[#070c14] text-white border-r border-[#1a2538] select-none">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-[#1a2538] flex items-center justify-between bg-[#04080e]">
        <Link to="/" className="flex items-center gap-2.5">
          <STEMLogo size="sm" showSubtitle={false} />
          <div>
            <div className="text-xs font-black tracking-tight text-white uppercase">
              STEMPACT ACADEMY
            </div>
            <div className="text-[10px] text-blue-400 font-mono font-bold tracking-tight">
              {getRoleDisplayName()}
            </div>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Nav Scroll View */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 sidebar-scroll">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isCurrent =
                  currentKey === item.key ||
                  (item.route === location.pathname && !currentKey);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNavigate(item.route, item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 text-left outline-none cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600/15 text-white border-l-2 border-blue-500 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e1626]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isCurrent ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Footer */}
      <div className="p-3 border-t border-[#1a2538] bg-[#04080e]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0a101b] border border-[#1a2538]/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
              {user.firstName?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Sign out of portal"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
