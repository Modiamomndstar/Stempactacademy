import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STEMLogo } from './STEMLogo';
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  BookOpen,
  Users,
  Award,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, portalRoute } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer and dropdowns on route change
  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Schools', path: '/schools' },
    { name: 'Programs', path: '/programs' },
    { name: 'Current Cohorts', path: '/cohorts', badge: 'Live' },
    { name: 'Admissions', path: '/admissions' },
    { name: 'Assessment', path: '/assessment' },
    { name: 'Innovation Lab', path: '/innovation-lab' },
    { name: 'Projects', path: '/projects' },
    { name: 'Competitions', path: '/competitions' },
    { name: 'Events', path: '/events' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-2'
          : 'bg-white border-b border-slate-100 py-3'
      }`}
    >
      {/* Top micro bar with location & hot announcement */}
      <div className="hidden lg:flex items-center justify-between text-[11px] font-medium text-slate-500 max-w-7xl mx-auto px-4 pb-2 border-b border-slate-100/60 mb-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Admissions Open: 2025 Cohorts (Ile-Ife Campus & Hybrid Virtual)
          </span>
          <span className="text-slate-300">|</span>
          <span>Official STEM, Vocational & Tech Academy of Osun State</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/verify" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Verify Certificate
          </Link>
          <span className="text-slate-300">|</span>
          <a
            href="https://wa.me/2348031234567"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 font-semibold"
          >
            WhatsApp Admissions: +234 803 123 4567
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <STEMLogo size="md" showSubtitle={true} />

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 text-[13px] font-medium text-slate-700">
          <Link
            to="/"
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/' ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            Home
          </Link>

          <Link
            to="/about"
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/about' ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            About
          </Link>

          <Link
            to="/schools"
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/schools' ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            Schools
          </Link>

          <Link
            to="/programs"
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/programs' ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            Programs
          </Link>

          <Link
            to="/cohorts"
            className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              location.pathname === '/cohorts' ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <span>Cohorts</span>
            <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold uppercase">
              Open
            </span>
          </Link>

          <Link
            to="/admissions"
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              location.pathname === '/admissions' ? 'text-blue-600 font-semibold bg-blue-50' : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            Admissions
          </Link>

          {/* More Dropdown for Secondary Public Pages */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-2.5 py-1.5 rounded-md hover:text-blue-600 hover:bg-slate-50 flex items-center gap-1 transition-colors"
            >
              <span>Explore</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 p-2 z-50 text-xs"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <Link
                  to="/assessment"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold">Online Assessment</div>
                    <div className="text-[10px] text-slate-400">Readiness & Placement</div>
                  </div>
                </Link>
                <Link
                  to="/innovation-lab"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                >
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Innovation Lab</div>
                    <div className="text-[10px] text-slate-400">R&D & Prototypes</div>
                  </div>
                </Link>
                <Link
                  to="/competitions"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                >
                  <Award className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-semibold">Competitions</div>
                    <div className="text-[10px] text-slate-400">Hackathons & Olympiads</div>
                  </div>
                </Link>
                <Link
                  to="/projects"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                >
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold">Project Showcase</div>
                    <div className="text-[10px] text-slate-400">Student Portfolios</div>
                  </div>
                </Link>
                <Link
                  to="/events"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                >
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-semibold">Events & Talks</div>
                    <div className="text-[10px] text-slate-400">Workshops & Demo Days</div>
                  </div>
                </Link>
                <Link
                  to="/blog"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold">Blog & Resources</div>
                    <div className="text-[10px] text-slate-400">Tech Guides & Updates</div>
                  </div>
                </Link>
                <div className="h-px bg-slate-100 my-1"></div>
                <Link
                  to="/faq"
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
                >
                  <span>Frequently Asked Questions</span>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
                >
                  <span>Contact Academy</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* User Auth Buttons & Primary CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-800 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                  {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
                <span className="font-semibold text-slate-800">{user.firstName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
                        {user.role === 'SUPER_ADMIN'
                          ? 'Super Admin'
                          : user.role === 'COORDINATOR_ADMIN'
                          ? 'Coordinator'
                          : user.role === 'ACADEMIC_ADMIN'
                          ? 'Academic Admin'
                          : user.role === 'FINANCE_ADMIN'
                          ? 'Finance Admin'
                          : user.role === 'INSTRUCTOR'
                          ? 'Faculty'
                          : user.role === 'PARENT'
                          ? 'Parent'
                          : 'Student'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {user.email}
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      to={portalRoute}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Go to My Portal</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/portal/login"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Switch Portal Door</span>
                    </Link>
                  </div>

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/portal/login"
                className="px-3.5 py-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Portal Login
              </Link>
            </div>
          )}

          <Link
            to="/apply"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 text-white text-xs font-bold shadow-sm hover:shadow-md hover:opacity-95 transition-all transform hover:-translate-y-0.5"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            to="/apply"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
          >
            Apply
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 max-h-[85vh] overflow-y-auto">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === link.path
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {user ? (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {user.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : user.role === 'COORDINATOR_ADMIN'
                      ? 'Coordinator'
                      : user.role === 'ACADEMIC_ADMIN'
                      ? 'Academic'
                      : user.role === 'FINANCE_ADMIN'
                      ? 'Finance'
                      : user.role === 'INSTRUCTOR'
                      ? 'Faculty'
                      : user.role === 'PARENT'
                      ? 'Parent'
                      : 'Student'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                  <Link
                    to={portalRoute}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                  >
                    <span>My Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-200/80 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/portal/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold"
              >
                <span>Portal Login (Student / Parent / Staff)</span>
              </Link>
            )}

            <Link
              to="/verify"
              className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500 font-medium hover:text-blue-600"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Verify STEMPACT Certificate</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
