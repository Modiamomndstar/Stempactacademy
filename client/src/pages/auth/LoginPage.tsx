import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge, Card } from '../../components/UIElements';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Key,
  GraduationCap,
  Users,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export type PortalType = 'admin' | 'instructor' | 'student';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine initial portal door from URL path or query params
  const getInitialPortal = (): PortalType => {
    if (location.pathname.includes('/admin')) return 'admin';
    if (location.pathname.includes('/instructor')) return 'instructor';
    if (location.pathname.includes('/student')) return 'student';
    const queryPortal = searchParams.get('portal');
    if (queryPortal === 'admin' || queryPortal === 'instructor' || queryPortal === 'student') {
      return queryPortal;
    }
    return 'student'; // Default to learners & parents
  };

  const [activePortal, setActivePortal] = useState<PortalType>(getInitialPortal());
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize tab if URL changes
  useEffect(() => {
    setActivePortal(getInitialPortal());
  }, [location.pathname]);

  const handleLogin = async (
    e?: React.FormEvent,
    customIdentifier?: string,
    customPass?: string,
    portalOverride?: PortalType
  ) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const targetPortal = portalOverride || activePortal;
    const loginId = customIdentifier || identifier;
    const loginPass = customPass || password;

    try {
      const user = await login({
        email: loginId,
        password: loginPass,
        portal: targetPortal,
      });

      // Navigate to corresponding authenticated portal route
      if (['SUPER_ADMIN', 'COORDINATOR_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN'].includes(user.role)) {
        navigate('/portal/admin');
      } else if (user.role === 'INSTRUCTOR') {
        navigate('/portal/instructor');
      } else if (user.role === 'PARENT') {
        navigate('/portal/parent');
      } else {
        navigate('/portal/student');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePortalSwitch = (portal: PortalType) => {
    setActivePortal(portal);
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <STEMLogo size="lg" showSubtitle={false} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              STEMPACT Academy Portal Login
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official Management & Learning System • Ile-Ife Campus Hub
            </p>
          </div>
        </div>

        {/* 3-Door Persona Selector Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-3 gap-1 shadow-inner border border-slate-200">
          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'admin'
                ? 'bg-white text-indigo-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">Staff & Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('instructor')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'instructor'
                ? 'bg-white text-emerald-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Faculty & Instructors</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('student')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'student'
                ? 'bg-white text-blue-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Learners & Parents</span>
          </button>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          {/* Active Door Information Banner */}
          {activePortal === 'admin' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Executive Staff & Administration Portal</span>
                </div>
                <Badge variant="blue">Governance</Badge>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                Super Admin, Coordinator Admins, Academic Directors, and Finance Officers.
                Super Admin credentials sync directly from environment variables.
              </p>
            </div>
          )}

          {activePortal === 'instructor' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Faculty & Instructor Portal</span>
                </div>
                <Badge variant="green">Academic Staff</Badge>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Course Instructors, Lab Fellows, and Mentors. Access live attendance, student
                progress, and grading queues.
              </p>
            </div>
          )}

          {activePortal === 'student' && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Student & Parent Portal</span>
                </div>
                <Badge variant="amber">Learners & Guardians</Badge>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Enrolled learners and parents/guardians. Access syllabus, timetable, submissions,
                diagnostic assessments, and tuition receipts.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>
                  {activePortal === 'instructor'
                    ? 'Staff Code / Email / Username'
                    : 'Email Address or Username'}
                </span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={
                    activePortal === 'admin'
                      ? 'admin@stempact.org or superadmin'
                      : activePortal === 'instructor'
                      ? 'STP-INS-001 or instructor@stempact.org'
                      : 'student@stempact.org or username'
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Case-sensitive</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                activePortal === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : activePortal === 'instructor'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span>Authenticating with Ile-Ife Server...</span>
              ) : (
                <>
                  <span>
                    Sign In to{' '}
                    {activePortal === 'admin'
                      ? 'Administration'
                      : activePortal === 'instructor'
                      ? 'Faculty Portal'
                      : 'Learning Portal'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Login for instant testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Instant 1-Click Demo Credentials
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">Ready to Test</span>
            </div>

            {activePortal === 'admin' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin@stempact.org');
                    setPassword('Admin@12345');
                    handleLogin(undefined, 'admin@stempact.org', 'Admin@12345', 'admin');
                  }}
                  className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-left transition-all"
                >
                  <div className="font-black text-indigo-900 text-xs flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Super Admin</span>
                  </div>
                  <div className="text-[10px] text-indigo-600 font-mono truncate">
                    admin@stempact.org
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Pass: Admin@12345
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('academic@stempact.org');
                    setPassword('Academic@12345');
                    handleLogin(undefined, 'academic@stempact.org', 'Academic@12345', 'admin');
                  }}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-left transition-all"
                >
                  <div className="font-black text-purple-900 text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Academic Admin</span>
                  </div>
                  <div className="text-[10px] text-purple-600 font-mono truncate">
                    academic@stempact.org
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Pass: Academic@12345
                  </div>
                </button>
              </div>
            )}

            {activePortal === 'instructor' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('instructor@stempact.org');
                    setPassword('Instructor@12345');
                    handleLogin(undefined, 'instructor@stempact.org', 'Instructor@12345', 'instructor');
                  }}
                  className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-left transition-all"
                >
                  <div className="font-black text-emerald-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      Lead Instructor (Faculty Demo)
                    </span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      STP-INS-001
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono truncate mt-0.5">
                    instructor@stempact.org • Pass: Instructor@12345
                  </div>
                </button>
              </div>
            )}

            {activePortal === 'student' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('student@stempact.org');
                    setPassword('Student@12345');
                    handleLogin(undefined, 'student@stempact.org', 'Student@12345', 'student');
                  }}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-left transition-all"
                >
                  <div className="font-black text-blue-900 text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Student Demo</span>
                  </div>
                  <div className="text-[10px] text-blue-600 font-mono truncate">
                    student@stempact.org
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Pass: Student@12345
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('parent@stempact.org');
                    setPassword('Parent@12345');
                    handleLogin(undefined, 'parent@stempact.org', 'Parent@12345', 'student');
                  }}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-all"
                >
                  <div className="font-black text-amber-900 text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Parent Demo</span>
                  </div>
                  <div className="text-[10px] text-amber-600 font-mono truncate">
                    parent@stempact.org
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Pass: Parent@12345
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Action: Enrollment registration link */}
          {activePortal === 'student' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-rose-50 border border-blue-200 text-center space-y-2">
              <div className="text-xs font-bold text-slate-800">
                New Student or Parent looking to enroll?
              </div>
              <p className="text-[11px] text-slate-500">
                Choose from our 50 accredited courses across 8 schools and register your account.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Select Course & Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {activePortal !== 'student' && (
            <div className="text-center text-xs text-slate-500">
              Need account access? Staff and Faculty credentials are provisioned by{' '}
              <span className="font-semibold text-slate-700">
                STEMPACT Academy Administration
              </span>
              .
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
