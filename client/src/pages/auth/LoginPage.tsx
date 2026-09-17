import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge } from '../../components/UIElements';
import {
  GraduationCap,
  Users,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Key,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  ChevronDown,
} from 'lucide-react';

export type LearnerPortalType = 'student' | 'parent';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<LearnerPortalType>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleLogin = async (
    e?: React.FormEvent,
    customIdentifier?: string,
    customPass?: string
  ) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const loginId = customIdentifier || identifier;
    const loginPass = customPass || password;

    try {
      const user = await login({
        email: loginId,
        password: loginPass,
        portal: 'student',
      });

      // Route directly to the corresponding learner/parent dashboard
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
        case 'PARTNER':
          navigate('/portal/partner');
          break;
        case 'SUPER_ADMIN':
          navigate('/portal/admin');
          break;
        default:
          navigate('/portal/student');
          break;
      }
    } catch (err: any) {
      console.error('Student Login error:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Authentication failed. Please verify your Student ID/Email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStudent = () => {
    setIdentifier('student@stempact.org');
    setPassword('Student123!');
    handleLogin(undefined, 'student@stempact.org', 'Student123!');
  };

  const handleQuickParent = () => {
    setIdentifier('parent@stempact.org');
    setPassword('Parent123!');
    handleLogin(undefined, 'parent@stempact.org', 'Parent123!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <STEMLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-slate-900">STEMPACT ACADEMY</span>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
              Student & Parent Learning Portal
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
          {/* Welcome Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-2">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === 'student' ? 'Student Learning Portal' : 'Parent & Guardian Gateway'}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'student'
                ? 'Access your course syllabus, practical lab timetables, coding assignments, and certificates.'
                : 'Monitor your linked child’s attendance, homework scores, tuition receipts, and instructor notes.'}
            </p>
          </div>

          {/* Persona Tabs (Student vs Parent) */}
          <div className="flex p-1 bg-slate-200/70 rounded-xl border border-slate-200">
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
              <span>Student / Learner</span>
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
              <span>Parent / Guardian</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {activeTab === 'student' ? 'Email or Student ID (e.g. STP-2026-XXXX)' : 'Parent Email or Phone'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeTab === 'student' ? 'student@stempact.org or STP-2026-0001' : 'parent@stempact.org'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Learning Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Application Prompt */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 mb-2">Not yet enrolled in a STEMPACT program?</p>
              <Link
                to="/apply"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Browse Academic Programs & Enroll Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Testing Demo Toggle */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span>Demo Student Accounts</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoCredentials ? 'rotate-180' : ''}`} />
              </button>

              {showDemoCredentials && (
                <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={handleQuickStudent}
                    className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-blue-700">Student Learner Demo</div>
                      <div className="text-[11px] text-slate-500 font-mono">student@stempact.org</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickParent}
                    className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-indigo-700">Parent / Guardian Demo</div>
                      <div className="text-[11px] text-slate-500 font-mono">parent@stempact.org</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Secure Student Data • STEMPACT Academy Ile-Ife</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white px-6 py-3 text-center text-[11px] text-slate-400">
        STEMPACT ACADEMY • Student Information System • Ile-Ife, Osun State, Nigeria
      </footer>
    </div>
  );
};
