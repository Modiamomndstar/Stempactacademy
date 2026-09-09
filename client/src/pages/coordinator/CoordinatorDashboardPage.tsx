import React, { useState, useEffect } from 'react';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Compass,
  Calendar,
  Users,
  CheckCircle2,
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  Search,
} from 'lucide-react';

export const CoordinatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCoordinatorOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load coordinator data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">Loading Program Coordinator Desk...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const cohorts = data?.cohorts || [];
  const filteredCohorts = cohorts.filter(
    (c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.programName.toLowerCase().includes(search.toLowerCase()) ||
      c.cohortCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Program Operations • {data?.department || 'Academic Operations'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Program Coordinator Cockpit
            </h1>
            <p className="text-sm text-slate-300">
              Oversee assigned program schedules, track cohort enrollment quotas, inspect daily attendance pacing, and ensure syllabus milestones are met.
            </p>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Active Cohorts Under Supervision</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{data?.totalCohorts || 0}</div>
            <span className="text-[11px] text-blue-600 font-medium">Assigned operational groups</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Total Supervised Learners</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{data?.totalStudents || 0}</div>
            <span className="text-[11px] text-slate-500">Currently enrolled</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Staff Credentials</span>
            <div className="text-xl font-bold text-slate-800 mt-1 font-mono">{data?.staffCode || 'COORD-001'}</div>
            <span className="text-[11px] text-slate-500">Authorized Academic Operations</span>
          </div>
        </div>

        {/* Cohorts Pacing Grid */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-base font-bold text-slate-900">Cohort Rosters & Operational Fidelity</h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search cohort or program..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCohorts.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 text-xs">
                No active cohorts found matching search criteria.
              </div>
            ) : (
              filteredCohorts.map((cohort: any) => (
                <div
                  key={cohort.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 font-mono block">
                        {cohort.cohortCode} • {cohort.schoolName}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{cohort.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {cohort.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">Lead Faculty:</span>
                      <strong className="text-slate-900">{cohort.instructorName}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">Lab Schedule:</span>
                      <strong className="text-slate-900 truncate block">{cohort.schedule}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">Enrolled / Capacity:</span>
                      <strong className="text-slate-900 font-mono">
                        {cohort.enrolledCount} / {cohort.maxCapacity} Seats
                      </strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">Cohort Attendance:</span>
                      <strong className="text-emerald-700 font-mono font-bold">{cohort.avgAttendance}%</strong>
                    </div>
                  </div>

                  {cohort.students?.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Enrolled Students ({cohort.students.length}):
                      </span>
                      <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {cohort.students.map((st: any) => (
                          <div key={st.id} className="py-1 flex items-center justify-between">
                            <span className="text-slate-800 font-medium">{st.name}</span>
                            <span className="font-mono text-slate-500 text-[10px]">{st.studentIdNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
