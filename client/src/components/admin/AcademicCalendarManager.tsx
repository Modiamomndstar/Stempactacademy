import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Card, Badge, LoadingSpinner } from '../UIElements';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Sparkles,
  Users,
  ChevronRight,
  TrendingUp,
  Layers,
  X,
  CalendarDays,
  ShieldCheck,
  ArrowLeft,
  Search,
  Trash2,
  PowerOff,
  Power,
  DollarSign,
  MapPin,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import { CohortDetailModal } from './CohortDetailModal';

interface AcademicCalendarManagerProps {
  onOpenCreateCohortForSession?: (sessionId: string) => void;
  onDataRefresh: () => Promise<void>;
  isAcademicOrSuperAdmin: boolean;
  cohorts?: any[];
  programs?: any[];
  schools?: any[];
  applications?: any[];
}

export const AcademicCalendarManager: React.FC<AcademicCalendarManagerProps> = ({
  onOpenCreateCohortForSession,
  onDataRefresh,
  isAcademicOrSuperAdmin,
  cohorts = [],
  programs = [],
  schools = [],
  applications = [],
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Drilldown state into a specific academic session
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Console Modal & Delete Modal State
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [cohortToDelete, setCohortToDelete] = useState<any | null>(null);
  const [deletingCohort, setDeletingCohort] = useState(false);

  // Purge Legacy Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);

  // Filters within drilled down session
  const [cohortSearch, setCohortSearch] = useState('');
  const [cohortStatusFilter, setCohortStatusFilter] = useState<string>('ALL');
  const [cohortSchoolFilter, setCohortSchoolFilter] = useState<string>('ALL');

  // Create Session Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsCurrent, setFormIsCurrent] = useState(false);

  // Edit Session Modal State
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAcademicSessions();
      setSessions(res?.sessions || []);
    } catch (err: any) {
      console.error('Failed to load academic sessions:', err);
      setError(err.message || 'Failed to fetch academic calendar sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Currently selected session object
  const activeDrilldownSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // Cohorts belonging to the drilled-down session
  const sessionCohorts = useMemo(() => {
    if (!activeDrilldownSession) return [];
    return cohorts.filter(
      (c) =>
        c.academicSessionId === activeDrilldownSession.id ||
        c.academicSession?.id === activeDrilldownSession.id ||
        c.academicSession?.name === activeDrilldownSession.name
    );
  }, [cohorts, activeDrilldownSession]);

  // Filtered cohorts in drilled down session
  const filteredSessionCohorts = useMemo(() => {
    return sessionCohorts.filter((c) => {
      if (cohortStatusFilter !== 'ALL' && c.status !== cohortStatusFilter) return false;
      if (cohortSchoolFilter !== 'ALL') {
        const progSchool = c.program?.school?.code || c.program?.schoolId;
        if (progSchool !== cohortSchoolFilter) return false;
      }
      if (cohortSearch) {
        const q = cohortSearch.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchCode = (c.cohortCode || c.code || '').toLowerCase().includes(q);
        const matchProg = c.program?.name?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchProg) return false;
      }
      return true;
    });
  }, [sessionCohorts, cohortStatusFilter, cohortSchoolFilter, cohortSearch]);

  // Handle Quick Intake Toggle
  const handleToggleCohortIntake = async (cohortId: string, currentStatus: string) => {
    setProcessing(true);
    setError('');
    const newStatus = (currentStatus === 'OPEN' || currentStatus === 'ALMOST_FULL') ? 'CLOSED' : 'OPEN';
    try {
      await api.updateCohort(cohortId, { status: newStatus });
      setActionSuccess(`Cohort intake status set to ${newStatus}. Public registration updated.`);
      await onDataRefresh();
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to update cohort intake');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Delete Cohort
  const handleDeleteCohortConfirm = async () => {
    if (!cohortToDelete) return;
    setDeletingCohort(true);
    setError('');
    try {
      await api.deleteCohort(cohortToDelete.id, true);
      setActionSuccess(`Cohort "${cohortToDelete.name}" was permanently removed.`);
      setCohortToDelete(null);
      await onDataRefresh();
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete cohort');
    } finally {
      setDeletingCohort(false);
    }
  };

  // Handle Purge All Legacy Seeded Cohorts
  const handlePurgeLegacyCohorts = async () => {
    setPurging(true);
    setError('');
    try {
      const res = await api.purgeLegacyCohorts({
        // Preserve cohorts belonging to existing manual academic sessions if needed
        preserveSessionId: activeDrilldownSession?.id,
      });
      setActionSuccess(res.message || 'Successfully cleaned up legacy seeded cohorts.');
      setShowPurgeModal(false);
      await onDataRefresh();
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to purge legacy cohorts');
    } finally {
      setPurging(false);
    }
  };

  // Handle Create Session Submit
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStartDate || !formEndDate) {
      setError('Please provide session title, start date, and end date.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await api.createAcademicSession({
        name: formName.trim(),
        code: formCode.trim() || undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        isCurrent: formIsCurrent,
      });

      setActionSuccess(`Academic Session "${res.session.name}" created successfully.`);
      setShowCreateModal(false);
      setFormName('');
      setFormCode('');
      setFormStartDate('');
      setFormEndDate('');
      setFormIsCurrent(false);
      await loadSessions();
      await onDataRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create academic session');
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit Session Submit
  const handleSaveEditSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditingSaving(true);
    setError('');
    try {
      await api.updateAcademicSession(editingSession.id, {
        name: editingSession.name,
        code: editingSession.code,
        startDate: editingSession.startDate ? new Date(editingSession.startDate).toISOString() : undefined,
        endDate: editingSession.endDate ? new Date(editingSession.endDate).toISOString() : undefined,
        isCurrent: editingSession.isCurrent,
      });
      setActionSuccess(`Academic session "${editingSession.name}" updated successfully.`);
      setEditingSession(null);
      await loadSessions();
      await onDataRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update academic session');
    } finally {
      setEditingSaving(false);
    }
  };

  // Handle Toggle Active Current Session
  const handleToggleCurrentSession = async (s: any) => {
    setProcessing(true);
    setError('');
    try {
      await api.updateAcademicSession(s.id, { isCurrent: true });
      setActionSuccess(`"${s.name}" is now designated as the Active Current Academic Session.`);
      await loadSessions();
      await onDataRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to activate session');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && sessions.length === 0) {
    return <LoadingSpinner message="Loading Institutional Academic Calendars & Sessions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {actionSuccess && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-950 hover:opacity-75">×</button>
        </div>
      )}
      {error && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="font-bold text-rose-950 hover:opacity-75">×</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: DRILLED DOWN VIEW OF A SELECTED ACADEMIC SESSION                  */}
      {/* ========================================================================= */}
      {activeDrilldownSession ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb & Top Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => setSelectedSessionId(null)}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Academic Sessions</span>
            </button>

            <div className="flex items-center gap-2">
              {isAcademicOrSuperAdmin && onOpenCreateCohortForSession && (
                <button
                  onClick={() => onOpenCreateCohortForSession(activeDrilldownSession.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Launch Cohort in {activeDrilldownSession.name.split(' ')[0]}</span>
                </button>
              )}
              {isAcademicOrSuperAdmin && (
                <button
                  onClick={() => setEditingSession({ ...activeDrilldownSession })}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Dates</span>
                </button>
              )}
            </div>
          </div>

          {/* Session Banner Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded border border-blue-700/50">
                    {activeDrilldownSession.code || 'SES'}
                  </span>
                  {activeDrilldownSession.isCurrent ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Current Active Intake Session
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleCurrentSession(activeDrilldownSession)}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white border border-slate-700 uppercase tracking-wider transition cursor-pointer"
                      title="Set this session as the active session for public applications"
                    >
                      Set as Active Session
                    </button>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {activeDrilldownSession.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Calendar Term: {new Date(activeDrilldownSession.startDate).toLocaleDateString()} — {new Date(activeDrilldownSession.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Session Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl text-center min-w-[100px]">
                  <div className="text-2xl font-extrabold text-blue-400">
                    {sessionCohorts.length}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Cohorts</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl text-center min-w-[100px]">
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {sessionCohorts.filter((c) => c.status === 'OPEN' || c.status === 'ALMOST_FULL').length}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Open Intake</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl text-center min-w-[100px]">
                  <div className="text-2xl font-extrabold text-purple-400">
                    {sessionCohorts.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Enrolled</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl text-center min-w-[100px]">
                  <div className="text-2xl font-extrabold text-amber-400">
                    {sessionCohorts.reduce((sum, c) => sum + (c.maxCapacity || 0), 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Capacity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cohorts in this session by name, code, or program..."
                  value={cohortSearch}
                  onChange={(e) => setCohortSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-blue-600 font-medium"
                />
              </div>

              {/* Status Filter */}
              <select
                value={cohortStatusFilter}
                onChange={(e) => setCohortStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-blue-600 bg-white"
              >
                <option value="ALL">All Cohort Statuses ({sessionCohorts.length})</option>
                <option value="OPEN">Open for Intake (OPEN)</option>
                <option value="ALMOST_FULL">Almost Full (ALMOST_FULL)</option>
                <option value="UPCOMING">Upcoming (UPCOMING)</option>
                <option value="CLOSED">Closed Intake (CLOSED)</option>
              </select>

              {/* School Filter */}
              {schools && schools.length > 0 && (
                <select
                  value={cohortSchoolFilter}
                  onChange={(e) => setCohortSchoolFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-blue-600 bg-white"
                >
                  <option value="ALL">All Schools</option>
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.code}>
                      {sch.name} ({sch.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredSessionCohorts.length} of {sessionCohorts.length} Cohorts
            </div>
          </div>

          {/* Cohorts Grid for this Session */}
          {filteredSessionCohorts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">No Cohorts Found in this Session</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {sessionCohorts.length === 0
                    ? `No cohorts have been launched under ${activeDrilldownSession.name} yet. Click "+ Launch Cohort in Session" to activate multi-program intake.`
                    : 'No cohorts match your active search and status filter criteria.'}
                </p>
              </div>
              {isAcademicOrSuperAdmin && onOpenCreateCohortForSession && (
                <button
                  onClick={() => onOpenCreateCohortForSession(activeDrilldownSession.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Launch First Cohort in {activeDrilldownSession.name}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSessionCohorts.map((c) => {
                const availableSeats = Math.max(0, (c.maxCapacity || 0) - (c.currentEnrollment || 0));
                const fillPct = Math.round(((c.currentEnrollment || 0) / (c.maxCapacity || 1)) * 100);
                const isOpen = c.status === 'OPEN' || c.status === 'ALMOST_FULL';

                return (
                  <Card
                    key={c.id}
                    className="p-5 space-y-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all rounded-3xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Status & Code */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {c.cohortCode || c.code}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {c.program?.school?.code || 'STEM'}
                          </span>
                        </div>
                        <Badge
                          variant={
                            isOpen
                              ? 'green'
                              : c.status === 'UPCOMING'
                              ? 'blue'
                              : 'slate'
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>

                      {/* Title & Program */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 line-clamp-2">
                          {c.name}
                        </h4>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                          <span>{c.program?.name || 'Academic Program'}</span>
                        </div>
                      </div>

                      {/* Dates & Schedule */}
                      <div className="text-xs text-slate-600 space-y-1 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {c.schedule && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.schedule}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.mode || 'Hybrid'}</span>
                        </div>
                      </div>

                      {/* Seats Availability Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500">Seats Intake:</span>
                          <strong className="text-slate-900">
                            {c.currentEnrollment || 0} / {c.maxCapacity} ({availableSeats} free)
                          </strong>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              fillPct >= 90
                                ? 'bg-rose-500'
                                : fillPct >= 60
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Tuition Pill */}
                      <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-100/70 rounded-xl font-mono text-slate-700">
                        <span>Tuition:</span>
                        <strong className="text-slate-900 font-bold">₦{(Number(c.trainingFee) || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedCohortId(c.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Console & Roster</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {isAcademicOrSuperAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCohortIntake(c.id, c.status)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                              isOpen
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Toggle public registration open/closed"
                          >
                            {isOpen ? (
                              <>
                                <PowerOff className="w-3 h-3 text-rose-600" />
                                <span>Close</span>
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3 text-emerald-600" />
                                <span>Open</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setCohortToDelete(c)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Delete this cohort"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW B: ALL ACADEMIC SESSIONS GRID                                        */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-xl space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    Institutional Governance
                  </span>
                  <span className="text-xs text-slate-400">Academic Calendar & Session Framework</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Academic Calendar & Sessions Manager
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Create, schedule, and govern academic sessions (e.g. 2026 Academic Session, 2026/2027 Session). Cohorts, intake
                  batches, and program capacities are anchored directly to these calendar years.
                </p>
              </div>

              {isAcademicOrSuperAdmin && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setShowPurgeModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-900/50 hover:border-rose-700 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    title="Remove legacy seeded cohorts that do not belong to active sessions"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clean Old Seeded Cohorts</span>
                  </button>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create New Academic Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Academic Sessions Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>REGISTERED ACADEMIC SESSIONS & CALENDARS ({sessions.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">Click on any card to view and manage cohorts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((s) => {
                const startDateFormatted = new Date(s.startDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const endDateFormatted = new Date(s.endDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                // Count cohorts in this session from live cohorts prop
                const cohortsInThisSession = cohorts.filter(
                  (c) => c.academicSessionId === s.id || c.academicSession?.id === s.id || c.academicSession?.name === s.name
                );

                return (
                  <Card
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`p-5 rounded-3xl space-y-4 border transition-all cursor-pointer hover:shadow-xl hover:scale-[1.01] ${
                      s.isCurrent
                        ? 'bg-blue-50/20 border-blue-300 dark:border-blue-900/50 shadow-md ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {s.code || 'SES'}
                          </span>
                          {s.isCurrent ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              CURRENT ACTIVE SESSION
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-900">
                          {s.name}
                        </h3>
                      </div>

                      {isAcademicOrSuperAdmin && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingSession({ ...s })}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                            title="Edit Session Bounds"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Calendar Bounds Strip */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Calendar Term:</span>
                        </span>
                        <strong className="text-slate-900 font-mono">
                          {startDateFormatted} — {endDateFormatted}
                        </strong>
                      </div>

                      {/* Operational KPIs */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono">
                        <div className="p-1.5 bg-slate-50 rounded-xl">
                          <div className="text-xs font-bold text-slate-800">
                            {cohortsInThisSession.length || s.metrics?.totalCohorts || 0}
                          </div>
                          <div className="text-[10px] text-slate-400">Intake Cohorts</div>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-xl">
                          <div className="text-xs font-bold text-emerald-700">
                            {cohortsInThisSession.filter((c) => c.status === 'OPEN' || c.status === 'ALMOST_FULL').length || s.metrics?.openCohorts || 0}
                          </div>
                          <div className="text-[10px] text-slate-400">Open Intake</div>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-xl">
                          <div className="text-xs font-bold text-purple-700">
                            {cohortsInThisSession.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">Enrolled</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      className="flex items-center justify-between pt-2 border-t border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedSessionId(s.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Manage Session Cohorts</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {isAcademicOrSuperAdmin && onOpenCreateCohortForSession && (
                        <button
                          onClick={() => onOpenCreateCohortForSession(s.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Cohort</span>
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COHORT DETAIL MODAL (WHEN A COHORT CONSOLE IS OPENED)                      */}
      {/* ========================================================================= */}
      {selectedCohortId && (
        <CohortDetailModal
          cohortId={selectedCohortId}
          isOpen={!!selectedCohortId}
          onClose={() => setSelectedCohortId(null)}
          applications={applications}
          isSuperOrAcademicAdmin={isAcademicOrSuperAdmin}
          onCohortUpdated={async () => {
            await onDataRefresh();
            await loadSessions();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* DELETE SINGLE COHORT CONFIRMATION MODAL                                   */}
      {/* ========================================================================= */}
      {cohortToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Cohort
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-800 font-semibold">{cohortToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              This action will permanently delete the cohort and remove it from public intake. Any linked student records will be preserved safely.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCohortToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                disabled={deletingCohort}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCohortConfirm}
                disabled={deletingCohort}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {deletingCohort ? 'Deleting...' : 'Yes, Delete Cohort'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PURGE LEGACY SEEDED COHORTS CONFIRMATION MODAL                            */}
      {/* ========================================================================= */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Clean Up Legacy Seeded Cohorts
                </h3>
                <p className="text-xs text-slate-500">
                  Permanently remove the default seeded test cohorts (such as CSE-01, CSE-02, Alpha 2026) that were pre-populated during initial setup.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>What will this do?</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Permanently deletes all old seeded dummy cohorts.</li>
                <li>Preserves only the new cohorts you created under your configured Academic Sessions.</li>
                <li>Ensures the public page only shows clean, manual active cohorts.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                disabled={purging}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeLegacyCohorts}
                disabled={purging}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {purging ? 'Purging Legacy Seeded Cohorts...' : 'Yes, Clean Up Seeded Cohorts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE ACADEMIC SESSION MODAL                                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create New Academic Session
                </h3>
                <p className="text-xs text-slate-500">
                  Establish a calendar year/session for cohort batch intake and academic versioning.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Session Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Academic Session or 2026/2027 Academic Year"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Session Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SES-2026"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Term Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Term End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="formIsCurrent"
                  checked={formIsCurrent}
                  onChange={(e) => setFormIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="formIsCurrent" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as Active Current Academic Session (makes cohorts available for live public intake)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {creating ? 'Creating Session...' : 'Create Academic Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT ACADEMIC SESSION MODAL                                               */}
      {/* ========================================================================= */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Edit Academic Session Bounds
                </h3>
                <p className="text-xs text-slate-500">
                  Update session title, code, calendar bounds, or active status.
                </p>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Session Name
                </label>
                <input
                  type="text"
                  value={editingSession.name}
                  onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Session Code
                </label>
                <input
                  type="text"
                  value={editingSession.code || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Term Start Date
                  </label>
                  <input
                    type="date"
                    value={editingSession.startDate ? new Date(editingSession.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingSession({ ...editingSession, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Term End Date
                  </label>
                  <input
                    type="date"
                    value={editingSession.endDate ? new Date(editingSession.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingSession({ ...editingSession, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsCurrent"
                  checked={editingSession.isCurrent || false}
                  onChange={(e) => setEditingSession({ ...editingSession, isCurrent: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsCurrent" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Designate as Current Active Academic Session
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  disabled={editingSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {editingSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
