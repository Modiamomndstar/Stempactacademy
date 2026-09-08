import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STEMLogo } from './STEMLogo';
import {
  Home,
  Info,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Rocket,
  Award,
  FolderGit2,
  CalendarDays,
  Newspaper,
  HelpCircle,
  Mail,
  ShieldCheck,
  User,
  LogOut,
  ArrowRight,
  ChevronRight,
  Compass,
  X,
} from 'lucide-react';

interface SideMenuProps {
  onCloseMobile?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, portalRoute } = useAuth();

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navGroups = [
    {
      group: 'Academic Tracks',
      items: [
        { name: 'Home Landing', path: '/', icon: Home },
        { name: 'About Academy', path: '/about', icon: Info },
        { name: 'Academic Schools', path: '/schools', icon: GraduationCap },
        { name: 'Programs & Syllabi', path: '/programs', icon: BookOpen },
        { name: 'Current Cohorts', path: '/cohorts', icon: Calendar, badge: 'Live', badgeColor: 'bg-rose-500' },
        { name: 'Admissions Overview', path: '/admissions', icon: Compass },
        { name: 'Apply Now', path: '/apply', icon: ArrowRight, badge: 'Intake', badgeColor: 'bg-emerald-600' },
      ],
    },
    {
      group: 'Innovation & Research',
      items: [
        { name: 'Diagnostic Assessment', path: '/assessment', icon: Sparkles, badge: 'Test', badgeColor: 'bg-amber-500' },
        { name: 'Innovation Lab', path: '/innovation-lab', icon: Layers },
        { name: 'Startup Lab', path: '/startup-lab', icon: Rocket },
        { name: 'Competitions & Hackathons', path: '/competitions', icon: Award },
        { name: 'Project Showcase', path: '/projects', icon: FolderGit2 },
      ],
    },
    {
      group: 'Campus & Resources',
      items: [
        { name: 'Events & Talks', path: '/events', icon: CalendarDays },
        { name: 'Blog & Articles', path: '/blog', icon: Newspaper },
        { name: 'Frequently Asked', path: '/faq', icon: HelpCircle },
        { name: 'Contact Us', path: '/contact', icon: Mail },
        { name: 'Verify Certificate', path: '/verify', icon: ShieldCheck, badge: 'Security', badgeColor: 'bg-blue-600' },
      ],
    },
  ];

  return (
    <aside className="h-full flex flex-col bg-white text-slate-800 border-r border-slate-200 select-none">
      {/* Top Header with Brand Logo */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white">
        <Link to="/" onClick={handleLinkClick} className="block transition-transform hover:scale-[1.01]">
          <STEMLogo size="sm" showSubtitle={true} />
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Close side menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Portal Spotlight Card (When Logged In) */}
      {user && (
        <div className="p-3 mx-3 mt-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white shadow-sm border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {user.firstName ? user.firstName[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <Link
              to={portalRoute}
              onClick={handleLinkClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
            >
              <span>My Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                logout();
                if (onCloseMobile) onCloseMobile();
                navigate('/');
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {group.group}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-3 border-blue-600 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-blue-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-blue-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Side Menu Bottom Info & Guest Authentication Actions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
        {!user && (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/portal/login"
              onClick={handleLinkClick}
              className="flex items-center justify-center py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors shadow-2xs"
            >
              Portal Login
            </Link>
            <Link
              to="/apply"
              onClick={handleLinkClick}
              className="flex items-center justify-center py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors shadow-2xs"
            >
              Apply Now
            </Link>
          </div>
        )}

        <div className="px-2 py-1 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Ile-Ife Campus, Osun State
          </span>
          <span className="font-mono text-[9px] text-slate-400">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
