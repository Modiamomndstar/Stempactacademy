import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Video,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';

export const CoordinatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Selected cohort for deep inspections in Sessions, Attendance, and Progress tabs
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  // Cohort Attendance & Sessions State
  const [cohortSessions, setCohortSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);

  // Cohort Syllabus & Progress State
  const [cohortDetail, setCohortDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCoordinatorOverview();
      setData(res);
      if (res?.cohorts?.length > 0 && !selectedCohortId) {
        setSelectedCohortId(res.cohorts[0].id);
      }
    } catch (err) {
      console.error('Failed to load coordinator data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedCohortId changes, load sessions & attendance
  useEffect(() => {
    if (!selectedCohortId) return;

    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        const res = await api.getAttendanceForCohort(selectedCohortId);
        setCohortSessions(res.sessions || []);
      } catch (err) {
        console.error('Failed to load cohort sessions:', err);
        setCohortSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const res = await api.getCohortById(selectedCohortId);
        setCohortDetail(res.cohort || res);
      } catch (err) {
        console.error('Failed to load cohort details:', err);
        setCohortDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };

    loadSessions();
    loadDetail();
  }, [selectedCohortId]);

  if (loading) {
    return (
      <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">Loading Program Coordinator Operations Cockpit...</p>
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
      c.cohortCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedCohort = cohorts.find((c: any) => c.id === selectedCohortId) || cohorts[0] || null;

  // Calculate high-level metrics
  const totalCapacity = cohorts.reduce((acc: number, c: any) => acc + (c.maxCapacity || 0), 0);
  const totalEnrolled = data?.totalStudents || cohorts.reduce((acc: number, c: any) => acc + (c.enrolledCount || 0), 0);
  const averageFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Program Operations • {data?.staffCode && data.staffCode !== 'COORD-001' ? data.staffCode : 'Program Coordinator'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Program Coordinator Cockpit
            </h1>
            <p className="text-sm text-slate-300">
              Oversee assigned program schedules, track cohort enrollment quotas, inspect daily attendance pacing, and ensure syllabus milestones are met.
            </p>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          {[
            { key: 'overview', label: 'Program Pacing & Cohorts', icon: Compass },
            { key: 'cohorts', label: 'Cohort Rosters & Capacity', icon: Users, count: cohorts.length },
            { key: 'sessions', label: 'Timetable & Sessions', icon: Calendar },
            { key: 'attendance', label: 'Attendance Oversight', icon: CheckCircle2 },
            { key: 'progress', label: 'Academic Delivery Progress', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Active Supervised Cohorts</span>
                  <Compass className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{data?.totalCohorts || cohorts.length}</div>
                <span className="text-[11px] text-blue-600 font-medium">Assigned operational groups</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Total Supervised Learners</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2">{totalEnrolled}</div>
                <span className="text-[11px] text-slate-500">Active enrolled students</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Cohort Capacity Utilization</span>
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-700 mt-2">{averageFillRate}%</div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(averageFillRate, 100)}%` }} />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold">Institutional Role</span>
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-base font-bold text-slate-800 mt-2">
                  {data?.staffCode && data.staffCode !== 'COORD-001' ? data.staffCode : 'Program Coordinator'}
                </div>
                <span className="text-[11px] text-slate-500">{data?.department || 'Academic Operations'}</span>
              </div>
            </div>

            {/* Operational Pacing Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Supervised Cohort Pacing Summary</h3>
                  <p className="text-xs text-slate-500">Live operational status and attendance fidelity across all assigned cohorts.</p>
                </div>
                <button
                  onClick={() => handleTabChange('cohorts')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View Full Roster</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-3">Cohort Code</th>
                      <th className="py-3 px-3">Program & School</th>
                      <th className="py-3 px-3">Lead Faculty</th>
                      <th className="py-3 px-3">Seats (Enrolled / Max)</th>
                      <th className="py-3 px-3">Avg Attendance</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cohorts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No cohorts currently assigned to your coordinator profile.
                        </td>
                      </tr>
                    ) : (
                      cohorts.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-blue-700">{c.cohortCode}</td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-[11px] text-slate-500">{c.programName} • {c.schoolName}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 font-medium">{c.instructorName || 'Unassigned'}</td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className="font-bold text-slate-900">{c.enrolledCount}</span> / {c.maxCapacity}
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({Math.round(((c.enrolledCount || 0) / (c.maxCapacity || 1)) * 100)}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-slate-800">
                              {c.avgAttendance}%
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCohortId(c.id);
                                handleTabChange('sessions');
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-slate-700 transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COHORT ROSTERS & CAPACITY */}
        {activeTab === 'cohorts' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cohort Rosters & Capacity Oversight</h3>
                <p className="text-xs text-slate-500">
                  Inspect student rosters, enrollment quotas, and individual student participation rates per cohort.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search cohort, program, faculty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCohorts.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-400 text-xs">
                  No active cohorts found matching your search criteria.
                </div>
              ) : (
                filteredCohorts.map((cohort: any) => {
                  const fillPct = Math.round(((cohort.enrolledCount || 0) / (cohort.maxCapacity || 1)) * 100);
                  const isNearCapacity = fillPct >= 90;

                  return (
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

                      {/* Capacity Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Capacity Utilization</span>
                          <span className="font-mono font-bold text-slate-900">
                            {cohort.enrolledCount} / {cohort.maxCapacity} ({fillPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isNearCapacity ? 'bg-amber-600' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                          <span className="text-slate-500 block text-[10px]">Lead Faculty:</span>
                          <strong className="text-slate-900">{cohort.instructorName || 'Unassigned'}</strong>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                          <span className="text-slate-500 block text-[10px]">Lab Schedule:</span>
                          <strong className="text-slate-900 truncate block">{cohort.schedule || 'TBA'}</strong>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                          <span className="text-slate-500 block text-[10px]">Cohort Level:</span>
                          <strong className="text-slate-900">{cohort.level || 'Standard'}</strong>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                          <span className="text-slate-500 block text-[10px]">Avg Attendance:</span>
                          <strong className="text-emerald-700 font-mono font-bold">{cohort.avgAttendance}%</strong>
                        </div>
                      </div>

                      {/* Enrolled Students Roster */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Enrolled Students ({cohort.students?.length || 0}):
                          </span>
                          <button
                            onClick={() => {
                              setSelectedCohortId(cohort.id);
                              handleTabChange('attendance');
                            }}
                            className="text-[11px] text-blue-600 font-bold hover:underline"
                          >
                            Attendance Log →
                          </button>
                        </div>

                        {cohort.students?.length === 0 ? (
                          <div className="text-center py-3 text-slate-400 text-xs">
                            No students currently registered in this cohort roster.
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs bg-white rounded-xl border border-slate-200/60 p-2">
                            {cohort.students.map((st: any) => (
                              <div key={st.id} className="py-1.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg">
                                <div>
                                  <span className="text-slate-800 font-medium block">{st.name}</span>
                                  <span className="font-mono text-slate-400 text-[10px]">{st.studentIdNumber || st.email}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-[11px] font-bold text-slate-800">
                                    {st.attendanceRate}% Att.
                                  </span>
                                  {st.completionRate !== undefined && (
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      {st.completionRate}% Comp.
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TIMETABLE & CLASS SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Cohort Selector Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cohort Timetable & Class Sessions</h3>
                <p className="text-xs text-slate-500">
                  Inspect scheduled lectures, lab meetings, room allocations, and remote video conference links.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600">Select Cohort:</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-blue-600 bg-white"
                >
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.cohortCode} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sessions List */}
            {sessionsLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Loading cohort timetable...</p>
              </div>
            ) : cohortSessions.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Class Sessions Recorded</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are no scheduled or completed class sessions logged for this cohort yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cohortSessions.map((session: any) => {
                  const sessionDate = session.date ? new Date(session.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  }) : 'TBA';

                  const attendeesCount = session.attendances?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
                  const totalRoster = session.attendances?.length || 0;

                  return (
                    <div
                      key={session.id}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Session #{session.sessionNumber || '•'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          session.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : session.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {session.status || 'SCHEDULED'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{session.title}</h4>
                        {session.topic && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{session.topic}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sessionDate}</span>
                          {session.startTime && (
                            <span className="text-slate-400 font-mono">
                              ({session.startTime} - {session.endTime || 'End'})
                            </span>
                          )}
                        </div>

                        {session.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{session.location}</span>
                          </div>
                        )}

                        {session.meetingLink && (
                          <div className="flex items-center gap-2">
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            <a
                              href={session.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-semibold hover:underline flex items-center gap-1 truncate"
                            >
                              <span>Join Virtual Room</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {totalRoster > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Attendance Logged:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {attendeesCount} / {totalRoster} Present
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ATTENDANCE OVERSIGHT */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Cohort Selector Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendance Oversight & Compliance</h3>
                <p className="text-xs text-slate-500">
                  Track daily roll calls, monitor learner participation trends, and identify attendance risk flags.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600">Select Cohort:</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-blue-600 bg-white"
                >
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.cohortCode} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Analytics Cards */}
            {selectedCohort && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Cohort Average Attendance</span>
                  <div className="text-2xl font-black mt-1 font-mono text-slate-900">
                    {selectedCohort.avgAttendance}%
                  </div>
                  <span className="text-[11px] text-slate-500">Roll-call aggregate across all sessions</span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Total Sessions Recorded</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {cohortSessions.length}
                  </div>
                  <span className="text-[11px] text-slate-500">Completed & scheduled roll calls</span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Total Enrolled Students</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {selectedCohort.students?.length || 0}
                  </div>
                  <span className="text-[11px] text-slate-500">Active registered cohort roster</span>
                </div>
              </div>
            )}

            {/* Student-by-Student Attendance Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Student Attendance Roster</h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Student ID</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Attendance Rate</th>
                      <th className="py-3 px-3 text-right">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!selectedCohort || !selectedCohort.students || selectedCohort.students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No enrolled students recorded for this cohort.
                        </td>
                      </tr>
                    ) : (
                      selectedCohort.students.map((st: any) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{st.name}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{st.studentIdNumber || '—'}</td>
                          <td className="py-3 px-3 text-slate-600">{st.email}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {st.attendanceRate}%
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {st.completionRate !== undefined ? `${st.completionRate}%` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACADEMIC DELIVERY PROGRESS */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Cohort Selector Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Delivery Progress & Syllabus Pacing</h3>
                <p className="text-xs text-slate-500">
                  Track delivery against approved program curriculum, course modules, and lesson milestones.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600">Select Cohort:</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-blue-600 bg-white"
                >
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.cohortCode} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Curriculum Breakdown */}
            {detailLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Loading syllabus structure...</p>
              </div>
            ) : !cohortDetail?.program ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Program Curriculum Details</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Curriculum information for this cohort will display here once syllabus modules are linked.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Program Header Card */}
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {cohortDetail.program.school?.name || 'School of Advanced Computing'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Code: {cohortDetail.program.code}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{cohortDetail.program.name}</h4>
                  <p className="text-xs text-slate-600">{cohortDetail.program.description}</p>
                </div>

                {/* Courses and Modules List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Courses & Modules Syllabus Track</span>
                  </h4>

                  {cohortDetail.program.courses?.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                      No courses linked to this program structure.
                    </div>
                  ) : (
                    cohortDetail.program.courses?.map((course: any, idx: number) => (
                      <div
                        key={course.id || idx}
                        className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blue-700">
                            Course {idx + 1}: {course.code}
                          </span>
                          {course.credits && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {course.credits} Credits
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-slate-900">{course.title}</h5>
                        {course.description && (
                          <p className="text-xs text-slate-500">{course.description}</p>
                        )}

                        {course.modules && course.modules.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Syllabus Modules ({course.modules.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {course.modules.map((mod: any, mIdx: number) => (
                                <div
                                  key={mod.id || mIdx}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800 block">
                                      Module {mod.orderIndex || mIdx + 1}: {mod.title}
                                    </span>
                                    {mod.durationMinutes && (
                                      <span className="text-[10px] text-slate-400">
                                        Estimated: {Math.round(mod.durationMinutes / 60)} hrs
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                                    Active Track
                                  </span>
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
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};
