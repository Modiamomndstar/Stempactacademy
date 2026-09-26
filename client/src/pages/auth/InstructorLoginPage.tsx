import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  ShieldCheck,
  Key,
} from 'lucide-react';

export const InstructorLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as any)?.from?.pathname || null;

  const handleInstructorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your faculty email or staff code.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const user = await login({
        email: identifier.trim(),
        password,
        portal: 'instructor',
      });

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (user.role === 'INSTRUCTOR' || user.role === 'SUPER_ADMIN') {
        navigate('/portal/instructor');
      } else {
        navigate('/portal/admin');
      }
    } catch (err: any) {
      console.error('Faculty Login error:', err);
      const message =
        err.message ||
        'Authentication failed. Please verify your faculty instructor credentials.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <STEMLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-slate-900">STEMPACT ACADEMY</span>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
              Faculty & Teaching Staff Gateway
            </span>
          </div>
        </Link>
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          Return to Public Site
        </Link>
      </header>

      {/* Main Faculty Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 mb-2">
              <Briefcase className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Faculty Workstation
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sign in to manage assigned cohorts, mark real-time attendance, review coding assignments, and generate lesson plans.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600" />

            {errorMsg && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleInstructorLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="faculty-identifier"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Faculty Email or Staff Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="faculty-identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="instructor@stempact.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="faculty-password"
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="faculty-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
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
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Faculty Workstation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 mb-2">Need a different access portal?</p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <Link
                  to="/login"
                  className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
                >
                  Student & Parent Portal
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  to="/admin-login"
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Admin Gateway
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Faculty Verification • Academic Operations System</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white px-6 py-3 text-center text-[11px] text-slate-400">
        STEMPACT ACADEMY • Faculty Registry • Ile-Ife, Osun State, Nigeria
      </footer>
    </div>
  );
};
