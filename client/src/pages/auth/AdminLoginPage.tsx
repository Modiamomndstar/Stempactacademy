import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge } from '../../components/UIElements';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Key,
  Building,
  CheckCircle2,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleAdminLogin = async (
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
        portal: 'admin',
      });

      // Route directly to the corresponding administrative dashboard
      switch (user.role) {
        case 'SUPER_ADMIN':
        case 'ACADEMIC_ADMIN':
        case 'FINANCE_ADMIN':
        case 'ADMISSIONS_ADMIN':
        case 'CONTENT_MANAGER':
        case 'MARKETING_MANAGER':
          navigate('/portal/admin');
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
        default:
          navigate('/portal/admin');
          break;
      }
    } catch (err: any) {
      console.error('Admin Login error:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Authentication failed. Please verify your administrator credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    handleAdminLogin(undefined, email, pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <STEMLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-white">STEMPACT ACADEMY</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Institutional Admin Gateway
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="amber" size="sm" className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Restricted Access</span>
          </Badge>
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
          >
            Back to Public Site
          </Link>
        </div>
      </header>

      {/* Main Login Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Security Notice Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 border border-indigo-500/30 shadow-2xl shadow-indigo-950/60 mb-2">
              <Lock className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Staff & Administration Gateway</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Official institutional portal for Super Administrators, Academic Directors, Coordinators, and Finance Officers.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-blue-500" />

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                  Administrator Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@stempact.org or username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Administrative Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-blue-600 hover:from-rose-500 hover:via-indigo-500 hover:to-blue-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Access Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Testing Demo Persona Toggle */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-mono"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Institutional Testing Accounts</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoCredentials ? 'rotate-180' : ''}`} />
              </button>

              {showDemoCredentials && (
                <div className="mt-3 space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@stempact.org', 'Admin123!')}
                      className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                          <span>Super Administrator</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">Full Power</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">admin@stempact.org</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('academic@stempact.org', 'Admin123!')}
                      className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-blue-400">Academic Administrator</div>
                        <div className="text-[11px] text-slate-400 font-mono">academic@stempact.org</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('coordinator@stempact.org', 'Admin123!')}
                      className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-emerald-400">Program Coordinator</div>
                        <div className="text-[11px] text-slate-400 font-mono">coordinator@stempact.org</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit Encrypted Session • Audit Logged & IP Ratified</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-[11px] text-slate-500 font-mono">
        STEMPACT ACADEMY OS • Institutional Infrastructure Hub • Ile-Ife, Osun State, Nigeria
      </footer>
    </div>
  );
};
