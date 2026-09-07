import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  TrendingUp,
} from 'lucide-react';

export const ParentPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchParentDashboard = async () => {
      try {
        const res = await api.getParentDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchParentDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Parent & Guardian Academic Ledger..." />;
  if (!data) return null;

  const { parent, wards, announcements } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Parent & Guardian Portal
            </span>
            <h1 className="text-2xl font-black text-white">
              {user?.firstName} {user?.lastName} ({parent?.relationship || 'Guardian'})
            </h1>
            <p className="text-xs text-slate-400">
              Monitoring {wards.length} enrolled child/ward at STEMPACT Academy
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          Sign Out
        </button>
      </div>

      {/* Wards Overview Cards */}
      <div className="max-w-7xl mx-auto space-y-8">
        {wards.map((ward: any) => (
          <div key={ward.studentIdNumber} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
            {/* Ward Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  ID: {ward.studentIdNumber}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{ward.fullName}</h2>
                <p className="text-xs text-slate-500">
                  {ward.program?.name} • {ward.cohort?.name} ({ward.currentLevel})
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Attendance</div>
                  <div className="text-xl font-black text-emerald-600">{ward.attendanceRate}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Completion</div>
                  <div className="text-xl font-black text-blue-600">{ward.completionRate || 68}%</div>
                </div>
              </div>
            </div>

            {/* Attendance & Recent Work Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Left: Attendance Log */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Recent Class Attendance Log</span>
                </h3>
                <div className="space-y-2">
                  {ward.attendances?.slice(0, 4).map((att: any) => (
                    <div key={att.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {att.classSession?.title || 'Class Session'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(att.date).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Assignments & Faculty Feedback */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Graded Assignments & Faculty Feedback</span>
                </h3>
                <div className="space-y-2">
                  {ward.recentAssignments?.map((sub: any) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{sub.assignment?.title}</span>
                        {sub.grade !== null && (
                          <span className="font-bold text-emerald-700">Grade: {sub.grade}/100</span>
                        )}
                      </div>
                      {sub.feedback && (
                        <p className="text-slate-600 italic text-[11px]">"{sub.feedback}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tuition Status */}
            {ward.invoices && ward.invoices.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 mb-2">Tuition Status:</div>
                {ward.invoices.map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{inv.title}</span>
                      <span className="text-slate-500 ml-2">Total: ₦{inv.totalAmount.toLocaleString()}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
