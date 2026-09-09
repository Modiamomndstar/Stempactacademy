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
  Briefcase,
  HeartPulse,
  Lightbulb,
  Compass,
  CreditCard,
  Megaphone,
  Layers,
} from 'lucide-react';

export type PortalType = 'learners' | 'faculty' | 'admin' | 'ecosystem';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine initial portal door from URL path or query params
  const getInitialPortal = (): PortalType => {
    if (location.pathname.includes('/admin')) return 'admin';
    if (location.pathname.includes('/instructor')) return 'faculty';
    if (location.pathname.includes('/student')) return 'learners';
    const queryPortal = searchParams.get('portal');
    if (
      queryPortal === 'admin' ||
      queryPortal === 'faculty' ||
      queryPortal === 'learners' ||
      queryPortal === 'ecosystem'
    ) {
      return queryPortal as PortalType;
    }
    return 'learners'; // Default to learners & parents
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
      });

      // Route directly to the corresponding dedicated dashboard
      switch (user.role) {
        case 'SUPER_ADMIN':
        case 'ACADEMIC_ADMIN':
        case 'FINANCE_ADMIN':
        case 'ADMISSIONS_ADMIN':
          navigate('/portal/admin');
          break;
        case 'PROGRAM_COORDINATOR':
        case 'COORDINATOR_ADMIN':
          navigate('/portal/coordinator');
          break;
        case 'INSTRUCTOR':
          navigate('/portal/instructor');
          break;
        case 'PARENT':
          navigate('/portal/parent');
          break;
        case 'COUNSELOR':
          navigate('/portal/counselor');
          break;
        case 'CONTENT_MANAGER':
        case 'MARKETING_MANAGER':
          navigate('/portal/admin');
          break;
        case 'INNOVATION_MANAGER':
          navigate('/portal/innovation');
          break;
        case 'PARTNER':
          navigate('/portal/partner');
          break;
        case 'APPLICANT':
          navigate('/portal/applicant');
          break;
        case 'STUDENT':
        default:
          navigate('/portal/student');
          break;
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
              STEMPACT Academy Unified Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select your institutional doorway to access your tailored dashboard • Ile-Ife Campus Hub
            </p>
          </div>
        </div>

        {/* 4-Door Persona Selector Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1 shadow-inner border border-slate-200">
          <button
            type="button"
            onClick={() => handlePortalSwitch('learners')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'learners'
                ? 'bg-white text-blue-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Learners</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('faculty')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'faculty'
                ? 'bg-white text-emerald-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'admin'
                ? 'bg-white text-indigo-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Governance</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('ecosystem')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'ecosystem'
                ? 'bg-white text-amber-700 shadow-md border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Partners</span>
          </button>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          {/* Active Door Information Banner */}
          {activePortal === 'learners' && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Doorway 1: Learners & Guardians</span>
                </div>
                <Badge variant="blue">Students • Parents • Applicants</Badge>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Access your learning cockpit, dynamic diagnostic tests, syllabus, assignments, and tuition receipts.
              </p>
            </div>
          )}

          {activePortal === 'faculty' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Doorway 2: Faculty & Mentors</span>
                </div>
                <Badge variant="green">Instructors • Counselors</Badge>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Course Instructors and Student Support Counselors. Access live class attendance, grading queues, and pastoral case records.
              </p>
            </div>
          )}

          {activePortal === 'admin' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Doorway 3: Institutional Administration</span>
                </div>
                <Badge variant="blue">Super Admin • Academic • Finance • Admissions • Coordinator</Badge>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                Platform Owners, Academic Directors, Admissions Officers, Finance Officers, and Program Coordinators.
              </p>
            </div>
          )}

          {activePortal === 'ecosystem' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>Doorway 4: Ecosystem & Partners</span>
                </div>
                <Badge variant="amber">Corporate • Innovation • Content • Marketing</Badge>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Corporate & NGO Sponsors, Hackathon Managers, Content Developers, and Communications Managers.
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
              <label className="font-bold text-slate-700">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="name@stempact.org"
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
              className="w-full py-3 px-4 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <span>Authenticating with Server...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Login for instant testing across all 14 personas */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Instant 1-Click Demo Profiles ({activePortal.toUpperCase()})
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">1-Click Sign In</span>
            </div>

            {/* Doorway 1: Learners & Guardians */}
            {activePortal === 'learners' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'student@stempact.org', 'Student123!')}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-left transition-all"
                >
                  <div className="font-bold text-blue-900 text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Enrolled Student</span>
                  </div>
                  <div className="text-[10px] text-blue-600 font-mono truncate">student@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'parent@stempact.org', 'Parent123!')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-all"
                >
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Parent / Guardian</span>
                  </div>
                  <div className="text-[10px] text-amber-600 font-mono truncate">parent@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'applicant@stempact.org', 'Applicant123!')}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-left transition-all"
                >
                  <div className="font-bold text-purple-900 text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Prospective Applicant</span>
                  </div>
                  <div className="text-[10px] text-purple-600 font-mono truncate">applicant@stempact.org</div>
                </button>
              </div>
            )}

            {/* Doorway 2: Faculty & Mentors */}
            {activePortal === 'faculty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'instructor@stempact.org', 'Instructor123!')}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-left transition-all"
                >
                  <div className="font-bold text-emerald-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      Lead Instructor
                    </span>
                    <span className="text-[9px] bg-emerald-200 px-1.5 py-0.5 rounded font-mono">STP-INS-001</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono truncate mt-0.5">instructor@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'counselor@stempact.org', 'Counselor123!')}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-left transition-all"
                >
                  <div className="font-bold text-purple-900 text-xs flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                    <span>Student Counselor</span>
                  </div>
                  <div className="text-[10px] text-purple-600 font-mono truncate mt-0.5">counselor@stempact.org</div>
                </button>
              </div>
            )}

            {/* Doorway 3: Institutional Governance */}
            {activePortal === 'admin' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'admin@stempact.org', 'Admin123!')}
                  className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-left transition-all"
                >
                  <div className="font-bold text-indigo-900 text-xs flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Super Admin</span>
                  </div>
                  <div className="text-[10px] text-indigo-600 font-mono truncate">admin@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'academic@stempact.org', 'Academic123!')}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-left transition-all"
                >
                  <div className="font-bold text-blue-900 text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Academic Admin</span>
                  </div>
                  <div className="text-[10px] text-blue-600 font-mono truncate">academic@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'admissions@stempact.org', 'Admissions123!')}
                  className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 text-left transition-all"
                >
                  <div className="font-bold text-teal-900 text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Admissions Admin</span>
                  </div>
                  <div className="text-[10px] text-teal-600 font-mono truncate">admissions@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'finance@stempact.org', 'Finance123!')}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-left transition-all"
                >
                  <div className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Finance Admin</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono truncate">finance@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'coordinator@stempact.org', 'Coordinator123!')}
                  className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100/60 text-left transition-all"
                >
                  <div className="font-bold text-cyan-900 text-xs flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Coordinator</span>
                  </div>
                  <div className="text-[10px] text-cyan-600 font-mono truncate">coordinator@stempact.org</div>
                </button>
              </div>
            )}

            {/* Doorway 4: Ecosystem & Partners */}
            {activePortal === 'ecosystem' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'partner@stempact.org', 'Partner123!')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-all"
                >
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>NGO / Corporate Partner</span>
                  </div>
                  <div className="text-[10px] text-amber-600 font-mono truncate">partner@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'innovation@stempact.org', 'Innovation123!')}
                  className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/60 text-left transition-all"
                >
                  <div className="font-bold text-orange-900 text-xs flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-orange-600" />
                    <span>Innovation Manager</span>
                  </div>
                  <div className="text-[10px] text-orange-600 font-mono truncate">innovation@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'content@stempact.org', 'Content123!')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all"
                >
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>Content / LMS Mgr</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">content@stempact.org</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin(undefined, 'marketing@stempact.org', 'Marketing123!')}
                  className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 text-left transition-all"
                >
                  <div className="font-bold text-rose-900 text-xs flex items-center gap-1">
                    <Megaphone className="w-3.5 h-3.5 text-rose-600" />
                    <span>Marketing Manager</span>
                  </div>
                  <div className="text-[10px] text-rose-600 font-mono truncate">marketing@stempact.org</div>
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
