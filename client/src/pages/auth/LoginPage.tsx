import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import {
  GraduationCap,
  Users,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  Briefcase,
  X,
  FileCheck,
} from 'lucide-react';

export type LearnerPortalType = 'student' | 'parent' | 'applicant';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<LearnerPortalType>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Check if redirected from a protected route
  const from = (location.state as any)?.from?.pathname || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email, student ID, or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const user = await login({
        email: identifier.trim(),
        password,
        portal: activeTab,
      });

      // If user had a redirected destination, honor it
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Route directly to the corresponding dashboard based on verified user role
      switch (user.role) {
        case 'STUDENT':
          navigate('/portal/student');
          break;
        case 'PARENT':
          navigate('/portal/parent');
          break;
        case 'APPLICANT':
          navigate('/portal/applicant');
          break;
        case 'INSTRUCTOR':
          navigate('/portal/instructor');
          break;
        case 'PROGRAM_COORDINATOR':
        case 'COORDINATOR_ADMIN':
          navigate('/portal/coordinator');
          break;
        case 'COUNSELOR':
          navigate('/portal/counselor');
          break;
        case 'INNOVATION_MANAGER':
          navigate('/portal/innovation');
          break;
        case 'PARTNER':
          navigate('/portal/partner');
          break;
        case 'SUPER_ADMIN':
        case 'ACADEMIC_ADMIN':
        case 'FINANCE_ADMIN':
        case 'ADMISSIONS_ADMIN':
          navigate('/portal/admin');
          break;
        default:
          navigate('/portal/student');
          break;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const message =
        err.message ||
        'Authentication failed. Please verify your credentials or contact academic support.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <STEMLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-slate-900">STEMPACT ACADEMY</span>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
              Learner & Guardian Portal
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/apply"
            className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Apply for Course
          </Link>
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Login Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-2">
              {activeTab === 'student' ? (
                <GraduationCap className="w-7 h-7" />
              ) : activeTab === 'parent' ? (
                <Users className="w-7 h-7" />
              ) : (
                <FileCheck className="w-7 h-7" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === 'student'
                ? 'Student Learning Portal'
                : activeTab === 'parent'
                ? 'Parent & Guardian Gateway'
                : 'Applicant Intake Portal'}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'student'
                ? 'Access your course syllabus, practical lab timetables, coding assignments, and certificates.'
                : activeTab === 'parent'
                ? 'Monitor your linked ward’s attendance, homework scores, tuition receipts, and instructor notes.'
                : 'Track your application status, take your diagnostic placement test, and view admission offers.'}
            </p>
          </div>

          {/* Persona Tabs (Student vs Parent vs Applicant) */}
          <div className="flex p-1 bg-slate-200/80 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('parent');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'parent'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Parent</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('applicant');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'applicant'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Applicant</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />

            {errorMsg && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  {activeTab === 'student'
                    ? 'Email or Student ID (e.g. STP-2026-XXXX)'
                    : activeTab === 'parent'
                    ? 'Parent / Guardian Email'
                    : 'Applicant Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeTab === 'student'
                        ? 'student@stempact.org or STP-2026-0001'
                        : activeTab === 'parent'
                        ? 'parent@example.com'
                        : 'applicant@example.com'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to {activeTab === 'applicant' ? 'Applicant Portal' : 'Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Application & Registration Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">Not yet enrolled in a STEMPACT program?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Apply for Next Cohort</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <span>Create Account</span>
                </Link>
              </div>
            </div>

            {/* Other Institutional Doors */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Staff & Faculty Gateways
              </p>
              <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
                <Link
                  to="/instructor-login"
                  className="hover:text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Faculty / Instructor</span>
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/admin-login"
                  className="hover:text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin Gateway</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Secure Student Data • STEMPACT Academy Ile-Ife</span>
          </div>
        </div>
      </main>

      {/* Forgot Password Assistance Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="forgot-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Account Recovery Assistance</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For security compliance, password resets for student, parent, and applicant portal accounts are coordinated through the Academic Admissions & Registry Office.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-800">Support Channels:</div>
              <div className="text-slate-600">
                • Email: <strong className="text-blue-600">admissions@stempact.org</strong>
              </div>
              <div className="text-slate-600">
                • Campus Registry: <span className="text-slate-700">STEMPACT Academy Hub, Ede Road, Ile-Ife</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Please provide your full legal name, registered email address, and student ID or application number when requesting an account recovery token.
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200/80 bg-white px-6 py-3 text-center text-[11px] text-slate-400">
        STEMPACT ACADEMY • Student Information System • Ile-Ife, Osun State, Nigeria
      </footer>
    </div>
  );
};
