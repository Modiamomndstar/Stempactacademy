import React, { useState, useEffect } from 'react';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CounselingRecord } from '../../types';
import {
  HeartPulse,
  AlertTriangle,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  Phone,
  Mail,
  ShieldAlert,
  Search,
  Check,
} from 'lucide-react';

export const CounselorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('atrisk');
  const [loading, setLoading] = useState<boolean>(true);
  const [atRiskList, setAtRiskList] = useState<any[]>([]);
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [search, setSearch] = useState<string>('');

  // Modal State for New Case
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [category, setCategory] = useState<string>('ATTENDANCE_RISK');
  const [riskLevel, setRiskLevel] = useState<string>('MEDIUM');
  const [summary, setSummary] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [parentNotified, setParentNotified] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskRes, recordsRes] = await Promise.all([
        api.getCounselorAtRisk(),
        api.getCounselingRecords(),
      ]);
      setAtRiskList(riskRes.atRiskList || []);
      setRecords(recordsRes.records || []);
    } catch (err: any) {
      console.error('Failed to load counselor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !summary || !notes) {
      alert('Please fill all required case details.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCounselingRecord({
        studentId: selectedStudent.id,
        category,
        riskLevel,
        summary,
        notes,
        actionPlan,
        parentNotified,
      });
      setShowModal(false);
      setSelectedStudent(null);
      setSummary('');
      setNotes('');
      setActionPlan('');
      setParentNotified(false);
      loadData();
    } catch (err: any) {
      alert('Failed to log counseling record: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (recordId: string, newStatus: string) => {
    try {
      await api.updateCounselingRecord(recordId, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const filteredAtRisk = atRiskList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentIdNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.cohort.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Student Support & Pastoral Advisory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Counselor Workstation
            </h1>
            <p className="text-sm text-slate-300">
              Proactively identify learners facing attendance slips or grade drops, record confidential counseling notes, and build actionable recovery plans.
            </p>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Monitored Students</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{atRiskList.length}</div>
            <span className="text-[11px] text-slate-500">Across active cohorts</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-rose-600 font-semibold">Critical Risk Flagged</span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {atRiskList.filter((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL').length}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">Attendance &lt; 70% or grades &lt; 50%</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-purple-600 font-semibold">Open Intervention Cases</span>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {records.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">Under active mentorship</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-semibold">Resolved Cases</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {records.filter((r) => r.status === 'RESOLVED').length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Successfully back on track</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('atrisk')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'atrisk'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            At-Risk Watchlist ({atRiskList.length})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'records'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Counseling Case Records ({records.length})
          </button>
        </div>

        {/* Tab 1: At-Risk Watchlist */}
        {activeTab === 'atrisk' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student or cohort..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3 font-bold">Student</th>
                    <th className="p-3 font-bold">Program & Cohort</th>
                    <th className="p-3 font-bold">Attendance %</th>
                    <th className="p-3 font-bold">Avg Grade %</th>
                    <th className="p-3 font-bold">Risk Level</th>
                    <th className="p-3 font-bold">Guardian Contact</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAtRisk.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No students currently flagged for academic or attendance risk!
                      </td>
                    </tr>
                  ) : (
                    filteredAtRisk.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <strong className="text-slate-900 block">{st.fullName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{st.studentIdNumber}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-800 block">{st.cohort}</span>
                          <span className="text-[10px] text-slate-500">{st.level}</span>
                        </td>
                        <td className="p-3">
                          <span className={`font-mono font-bold ${
                            st.attendanceRate < 70 ? 'text-rose-600' : st.attendanceRate < 80 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {st.attendanceRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-700">
                            {st.avgGrade !== 'N/A' ? `${st.avgGrade}%` : 'No subs'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.riskLevel === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : st.riskLevel === 'HIGH'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : st.riskLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {st.riskLevel}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>{st.guardianName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.guardianPhone}</div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudent(st);
                              setShowModal(true);
                            }}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Open Case</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Counseling Case Records */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confidential Case Files</h3>
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active counseling cases logged yet.
                </div>
              ) : (
                records.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {r.student?.user?.firstName} {r.student?.user?.lastName} ({r.student?.studentIdNumber})
                        </span>
                        <div className="text-[11px] text-slate-500">
                          Category: <strong className="text-slate-700">{r.category}</strong> • Risk Level:{' '}
                          <strong className="text-rose-600">{r.riskLevel}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={r.status}
                          onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                          className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="ESCALATED">ESCALATED</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                      <div className="font-semibold text-slate-900">{r.summary}</div>
                      <p className="text-slate-600">{r.notes}</p>
                      {r.actionPlan && (
                        <div className="pt-2 text-purple-900 font-medium">
                          🎯 <strong>Action Plan:</strong> {r.actionPlan}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Logged: {new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.parentNotified && <span className="text-purple-600 font-bold">✓ Guardian Contacted</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Log Support Case Modal */}
        {showModal && selectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Open Support Case: {selectedStudent.fullName}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    >
                      <option value="ATTENDANCE_RISK">Attendance Slip</option>
                      <option value="ACADEMIC_STRUGGLE">Academic Difficulty</option>
                      <option value="CAREER_GUIDANCE">Career Guidance</option>
                      <option value="BEHAVIORAL">Behavioral</option>
                      <option value="PERSONAL">Personal / Welfare</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Risk Severity</label>
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Summary Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Missed 3 consecutive Python labs; struggling with loops"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confidential Pastoral Notes</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detail meeting discussion, student reasons, and mentor observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Remedial Action Plan</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule 2 tutoring hours with Teaching Assistant"
                    value={actionPlan}
                    onChange={(e) => setActionPlan(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="notifyParent"
                    checked={parentNotified}
                    onChange={(e) => setParentNotified(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <label htmlFor="notifyParent" className="text-slate-700 font-medium">
                    Dispatch notification to parent / guardian ({selectedStudent.guardianName})
                  </label>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    {submitting ? 'Saving...' : 'Save Case File'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};
