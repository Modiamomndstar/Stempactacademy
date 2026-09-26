import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface AcademicCalendarManagerProps {
  onOpenCreateCohortForSession?: (sessionId: string) => void;
  onDataRefresh: () => Promise<void>;
  isAcademicOrSuperAdmin: boolean;
}

export const AcademicCalendarManager: React.FC<AcademicCalendarManagerProps> = ({
  onOpenCreateCohortForSession,
  onDataRefresh,
  isAcademicOrSuperAdmin,
}) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStartDate || !formEndDate) {
      alert('Please provide session name, start date, and end date.');
      return;
    }
    setCreating(true);
    try {
      await api.createAcademicSession({
        name: formName.trim(),
        code: formCode.trim() || undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        isCurrent: formIsCurrent,
      });
      setActionSuccess(`Academic session "${formName}" created successfully!`);
      setShowCreateModal(false);
      setFormName('');
      setFormCode('');
      setFormStartDate('');
      setFormEndDate('');
      setFormIsCurrent(false);
      await loadSessions();
      await onDataRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to create academic session');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCurrent = async (session: any) => {
    try {
      await api.updateAcademicSession(session.id, { isCurrent: true });
      setActionSuccess(`Session "${session.name}" is now marked as the current active academic session.`);
      await loadSessions();
      await onDataRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to set active academic session');
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditingSaving(true);
    try {
      await api.updateAcademicSession(editingSession.id, {
        name: editingSession.name,
        code: editingSession.code,
        startDate: new Date(editingSession.startDate).toISOString(),
        endDate: new Date(editingSession.endDate).toISOString(),
        isCurrent: editingSession.isCurrent,
      });
      setActionSuccess(`Academic session "${editingSession.name}" updated successfully.`);
      setEditingSession(null);
      await loadSessions();
      await onDataRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update academic session');
    } finally {
      setEditingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex items-start justify-between flex-wrap gap-4 border border-slate-800">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Institutional Governance
            </span>
            <span className="text-xs text-slate-300">Academic Calendar & Session Framework</span>
          </div>
          <h3 className="text-xl font-bold text-white">Academic Calendar & Sessions Manager</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Create, schedule, and govern academic sessions (e.g. 2026 Academic Session, 2026/2027 Session).
            Cohorts, intake batches, and program capacities are anchored directly to these calendar years.
          </p>
        </div>

        {isAcademicOrSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Academic Session</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-950">×</button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center">
          <LoadingSpinner message="Loading registered academic sessions from backend..." />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Registered Academic Sessions & Calendars ({sessions.length})</span>
            </h4>
            <span className="text-xs text-slate-500">Live PostgreSQL Database Entities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => {
              const startDateFormatted = s.startDate
                ? new Date(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA';
              const endDateFormatted = s.endDate
                ? new Date(s.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA';

              return (
                <Card
                  key={s.id}
                  className={`p-6 space-y-4 transition hover:shadow-md ${
                    s.isCurrent ? 'border-2 border-indigo-500 bg-indigo-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {s.code}
                        </span>
                        {s.isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>CURRENT ACTIVE SESSION</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            ACADEMIC SESSION
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{s.name}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!s.isCurrent && isAcademicOrSuperAdmin && (
                        <button
                          onClick={() => handleToggleCurrent(s)}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Set as Current
                        </button>
                      )}
                      {isAcademicOrSuperAdmin && (
                        <button
                          onClick={() => setEditingSession({ ...s })}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                          title="Edit Session Bounds"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calendar Bounds Strip */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Calendar Term Bounds:</span>
                      </span>
                      <strong className="text-slate-900 font-mono">
                        {startDateFormatted} — {endDateFormatted}
                      </strong>
                    </div>

                    {/* Operational KPIs */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono">
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">
                          {s.metrics?.totalCohorts || s._count?.cohorts || 0}
                        </div>
                        <div className="text-[10px] text-slate-400">Intake Cohorts</div>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <div className="text-xs font-bold text-emerald-700">
                          {s.metrics?.openCohorts || 0}
                        </div>
                        <div className="text-[10px] text-slate-400">Open for Intake</div>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <div className="text-xs font-bold text-purple-700">
                          {s.metrics?.totalEnrolled || s._count?.enrollments || 0}
                        </div>
                        <div className="text-[10px] text-slate-400">Enrolled Students</div>
                      </div>
                    </div>
                  </div>

                  {/* Launch Cohorts CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Capacity Utilization:{' '}
                      <strong className="text-slate-800">{s.metrics?.utilizationRate || 0}%</strong>
                    </span>

                    {isAcademicOrSuperAdmin && onOpenCreateCohortForSession && (
                      <button
                        onClick={() => onOpenCreateCohortForSession(s.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Launch Cohort in {s.name.split(' ')[0]}</span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE ACADEMIC SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-fadeIn">
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
                  placeholder="e.g. SESS-2026 or SESS-2026-2027"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Session Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Session End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createIsCurrent"
                  checked={formIsCurrent}
                  onChange={(e) => setFormIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createIsCurrent" className="font-semibold text-slate-700 dark:text-slate-300">
                  Set as Current Active Session across the Academy
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating ? <LoadingSpinner message="" /> : <Plus className="w-4 h-4" />}
                  <span>Create Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACADEMIC SESSION MODAL */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Edit Academic Session
                </h3>
                <p className="text-xs text-slate-500">{editingSession.name}</p>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editingSession.startDate ? new Date(editingSession.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingSession({ ...editingSession, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editingSession.endDate ? new Date(editingSession.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingSession({ ...editingSession, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsCurrent"
                  checked={editingSession.isCurrent}
                  onChange={(e) => setEditingSession({ ...editingSession, isCurrent: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsCurrent" className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Active Session
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editingSaving ? <LoadingSpinner message="" /> : <Edit className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
