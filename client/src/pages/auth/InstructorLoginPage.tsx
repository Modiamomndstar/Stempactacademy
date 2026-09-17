import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge } from '../../components/UIElements';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Key,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const InstructorLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInstructorLogin = async (
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
        portal: 'instructor',
      });

      if (user.role === 'INSTRUCTOR' || user.role === 'SUPER_ADMIN') {
        navigate('/portal/instructor');
      } else {
        navigate('/portal/admin');
      }
    } catch (err: any) {
      console.error('Faculty Login error:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Authentication failed. Please verify your faculty instructor credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFaculty = () => {
    setIdentifier('instructor@stempact.org');
    setPassword('Instructor123!');
    handleInstructorLogin(undefined, 'instructor@stempact.org', 'Instructor123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <STEMLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-white">STEMPACT ACADEMY</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono">
              Faculty & Academic Mentors Gateway
            </span>
          </div>
        </Link>
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
        >
          Back to Public Site
        </Link>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-950 border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 mb-2">
              <GraduationCap className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Faculty & Instructor Portal</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Course management, student attendance verification, assignment grading, and lab supervision.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleInstructorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                  Faculty Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="instructor@stempact.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                  Password
                </label>
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Faculty Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleQuickFaculty}
                className="w-full p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span>Demo Lead Instructor</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">Testing</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">instructor@stempact.org</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Academic Faculty Authentication • Ile-Ife Campus Labs</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-[11px] text-slate-500 font-mono">
        STEMPACT ACADEMY • Faculty Operations • Ile-Ife, Osun State, Nigeria
      </footer>
    </div>
  );
};
