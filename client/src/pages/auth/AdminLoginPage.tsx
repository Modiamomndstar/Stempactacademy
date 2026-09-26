import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  Key,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as any)?.from?.pathname || null;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your institutional email or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setLoading(true);

    try {
      const user = await login({
        email: identifier.trim(),
        password,
        portal: 'admin',
      });

      if (from) {
        navigate(from, { replace: true });
        return;
      }

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
      const message =
        err.message ||
        'Authentication failed. Please verify your administrative credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
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
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Return to Public Site
        </Link>
      </header>

      {/* Main Admin Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-xl mb-2">
              <ShieldAlert className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Institutional Governance
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Super Admin, Academic Registry, Admissions Board & Financial Management console.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />

            {errorMsg && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-identifier"
                  className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono"
                >
                  Admin Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@stempact.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono"
                >
                  Security Key / Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate Administrative Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 mb-2">Looking for other academy gateways?</p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <Link
                  to="/login"
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Student & Parent Portal
                </Link>
                <span className="text-slate-600">•</span>
                <Link
                  to="/instructor-login"
                  className="text-slate-400 hover:text-slate-300 font-medium transition-colors"
                >
                  Faculty Portal
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audited Access Protocol • Session Logged & Monitored</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-center text-[11px] text-slate-500">
        STEMPACT ACADEMY • Governance System • Strictly Authorized Personnel Only
      </footer>
    </div>
  );
};
