import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge, Card } from '../../components/UIElements';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Key,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login({
        email: customEmail || email,
        password: customPass || password,
      });

      // Role redirect
      if (['SUPER_ADMIN', 'ACADEMIC_ADMIN', 'FINANCE_ADMIN'].includes(user.role)) {
        navigate('/admin');
      } else if (user.role === 'INSTRUCTOR') {
        navigate('/instructor');
      } else if (user.role === 'PARENT') {
        navigate('/parent');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { role: 'Super Admin', email: 'admin@stempact.org', pass: 'Admin@12345', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { role: 'Academic Admin', email: 'academic@stempact.org', pass: 'Academic@12345', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { role: 'Lead Instructor', email: 'instructor@stempact.org', pass: 'Instructor@12345', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { role: 'Student Demo', email: 'student@stempact.org', pass: 'Student@12345', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { role: 'Parent Demo', email: 'parent@stempact.org', pass: 'Parent@12345', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center">
          <STEMLogo size="lg" showSubtitle={false} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          STEMPACT Academy Portal Login
        </h2>
        <p className="text-xs text-slate-500">
          Sign in to access your student dashboard, parent reports, or academic administration.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="name@stempact.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Password</label>
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
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Login for instant reviewer testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Instant 1-Click Demo Logins
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {quickLogins.map((ql) => (
                <button
                  key={ql.role}
                  type="button"
                  onClick={() => {
                    setEmail(ql.email);
                    setPassword(ql.pass);
                    handleLogin(undefined, ql.email, ql.pass);
                  }}
                  className={`p-2 rounded-lg border text-left font-semibold text-[11px] transition-all hover:scale-102 ${ql.color}`}
                >
                  <div className="font-bold">{ql.role}</div>
                  <div className="text-[9px] opacity-75 truncate">{ql.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/apply" className="font-bold text-blue-600 hover:underline">
              Apply for Admission
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
