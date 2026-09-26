import React, { useState } from 'react';
import { api } from '../../services/api';
import { Card, Badge } from '../UIElements';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  ChevronRight,
  ExternalLink,
  X,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Send,
  AlertTriangle,
  RotateCcw,
  Ban,
  UserCheck,
} from 'lucide-react';

interface AdmissionsManagerProps {
  applications: any[];
  placements: any[];
  cohorts: any[];
  programs: any[];
  onDataRefresh: () => Promise<void>;
  isAdmissionsOrSuperAdmin: boolean;
  isAcademicOrSuperAdmin: boolean;
}

export const AdmissionsManager: React.FC<AdmissionsManagerProps> = ({
  applications,
  placements,
  cohorts,
  programs,
  onDataRefresh,
  isAdmissionsOrSuperAdmin,
  isAcademicOrSuperAdmin,
}) => {
  const [subTab, setSubTab] = useState<'applications' | 'placements'>('applications');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  // Selected Application for full lifecycle drawer inspection
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Placement Review Modal State
  const [reviewingPlacement, setReviewingPlacement] = useState<any | null>(null);
  const [boardAction, setBoardAction] = useState<'APPROVE' | 'MODIFY' | 'REJECT' | 'RETURN_FOR_REASSESSMENT'>('APPROVE');
  const [approvedLevel, setApprovedLevel] = useState('Level 2 (Accelerated)');
  const [approvedProgramId, setApprovedProgramId] = useState('');
  const [approvedCohortId, setApprovedCohortId] = useState('');
  const [boardNotes, setBoardNotes] = useState('');

  // Issue Admission Modal State
  const [issuingApp, setIssuingApp] = useState<any | null>(null);
  const [assignCohortId, setAssignCohortId] = useState('');
  const [assignedClass, setAssignedClass] = useState('Turing Computer Lab 1');
  const [orientationDate, setOrientationDate] = useState('');
  const [admissionNotes, setAdmissionNotes] = useState('');

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (statusFilter && app.status !== statusFilter) return false;
    if (programFilter && app.programId !== programFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = app.fullName?.toLowerCase().includes(q);
      const matchEmail = app.email?.toLowerCase().includes(q);
      const matchNum = app.applicationNumber?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchNum) return false;
    }
    return true;
  });

  // 1. Submit Academic Board Placement Decision
  const handlePlacementDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPlacement) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.reviewPlacement(reviewingPlacement.id, {
        action: boardAction,
        approvedLevel: boardAction === 'MODIFY' || boardAction === 'APPROVE' ? approvedLevel : undefined,
        approvedProgramId: boardAction === 'MODIFY' && approvedProgramId ? approvedProgramId : undefined,
        approvedCohortId: boardAction === 'MODIFY' && approvedCohortId ? approvedCohortId : undefined,
        adminNotes: boardNotes || `Placement decision: ${boardAction}`,
      });
      setActionSuccess(`Academic Board decision "${boardAction}" recorded successfully.`);
      setReviewingPlacement(null);
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit board decision');
    } finally {
      setProcessing(false);
    }
  };

  // 2. Issue Admission Offer
  const handleIssueAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingApp) return;
    setProcessing(true);
    setActionError('');
    try {
      const res = await api.issueAdmission({
        applicationId: issuingApp.id,
        cohortId: assignCohortId || issuingApp.cohortId || undefined,
        assignedClass: assignedClass || undefined,
        orientationDate: orientationDate || undefined,
      });
      setActionSuccess(
        `Admission offer issued successfully! Admission No: ${res.admissionNumber} • Student ID: ${res.admission?.studentIdNumber || 'Assigned'}`
      );
      setIssuingApp(null);
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue admission offer');
    } finally {
      setProcessing(false);
    }
  };

  // 3. Trigger Official Admission Delivery (requires clearance)
  const handleDeliverOfficialLetter = async (admissionId: string) => {
    setProcessing(true);
    setActionError('');
    try {
      const res = await api.deliverAdmissionLetter(admissionId);
      setActionSuccess(res.message || 'Official admission letter delivery enqueued successfully.');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Official delivery requirement not met (financial clearance required).');
    } finally {
      setProcessing(false);
    }
  };

  // 4. Withdraw Admission Offer
  const handleWithdrawAdmission = async (admissionId: string) => {
    const reason = window.prompt('Enter mandatory official reason for admission withdrawal:');
    if (!reason) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.withdrawAdmission(admissionId, reason);
      setActionSuccess('Admission offer has been withdrawn.');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to withdraw admission offer');
    } finally {
      setProcessing(false);
    }
  };

  // 5. Finalize Enrollment
  const handleEnrollStudent = async (admissionId: string) => {
    if (!window.confirm('Enroll student into assigned cohort and activate their Learning Ledger?')) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.enrollStudent(admissionId, 'Enrolled by Admissions Administration');
      setActionSuccess('Student enrolled successfully! Official student dashboard activated.');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to enroll student');
    } finally {
      setProcessing(false);
    }
  };

  // 6. View Provisional Admission Document
  const handleViewAdmissionDoc = async (admissionId: string) => {
    setDrawerLoading(true);
    try {
      const res = await api.getAdmissionDocument(admissionId);
      setPreviewDoc(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve admission document');
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'applications'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Admissions Intake Pipeline ({applications.length})
          </button>
          <button
            onClick={() => setSubTab('placements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'placements'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Academic Board Placements ({placements.length})
          </button>
        </div>

        {actionSuccess && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="text-emerald-950 font-bold ml-1">×</button>
          </div>
        )}
        {actionError && (
          <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="text-rose-950 font-bold ml-1">×</button>
          </div>
        )}
      </div>

      {/* SUBTAB 1: APPLICATIONS INTAKE PIPELINE */}
      {subTab === 'applications' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or application #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Application Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="ASSESSMENT_PENDING">ASSESSMENT PENDING</option>
                <option value="ASSESSMENT_COMPLETED">ASSESSMENT COMPLETED</option>
                <option value="PLACEMENT_READY">PLACEMENT READY</option>
                <option value="ADMITTED">ADMITTED</option>
                <option value="ENROLLED">ENROLLED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
              </select>

              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Academic Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-mono text-slate-500 font-semibold">
              Showing {filteredApps.length} of {applications.length} applicants
            </div>
          </div>

          {/* Applications Table / Cards */}
          <div className="space-y-3">
            {filteredApps.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs">
                No applications matching filter criteria.
              </Card>
            ) : (
              filteredApps.map((app) => {
                const hasAdmission = Boolean(app.admission);
                const hasPlacement = Boolean(app.placement);
                const assessmentAttempts = app.assessmentAttempts || [];
                const latestAttempt = assessmentAttempts[assessmentAttempts.length - 1];

                return (
                  <Card
                    key={app.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-all"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{app.fullName}</span>
                        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {app.applicationNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            app.status === 'ENROLLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'ADMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'SUBMITTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                        {hasAdmission && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                            Adm: {app.admission.admissionNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {app.program?.name || 'Program Unassigned'}
                        </span>
                        <span>•</span>
                        <span>{app.email}</span>
                        <span>•</span>
                        <span>{app.phone}</span>
                      </div>

                      {/* Lifecycle Signals */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 flex-wrap">
                        {latestAttempt ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>Assessment Score: {latestAttempt.score}%</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">No Assessment Attempt</span>
                        )}

                        {hasPlacement && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-medium">
                            Board: {app.placement.status} ({app.placement.approvedLevel || app.placement.recommendedLevel})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bench */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Inspect Dossier
                      </button>

                      {app.status !== 'ADMITTED' && app.status !== 'ENROLLED' && isAdmissionsOrSuperAdmin && (
                        <button
                          onClick={() => {
                            setIssuingApp(app);
                            setAssignCohortId(app.cohortId || '');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Issue Admission
                        </button>
                      )}

                      {app.admission && (
                        <button
                          onClick={() => handleViewAdmissionDoc(app.admission.id)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors"
                        >
                          View Document
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ACADEMIC BOARD PLACEMENTS QUEUE */}
      {subTab === 'placements' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Placement Review Bench</h3>
              <p className="text-xs text-slate-500">
                Academic Board evaluations of diagnostic assessment results. Required backend actions: APPROVE, MODIFY, REJECT, RETURN_FOR_REASSESSMENT.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {placements.filter((p) => p.status === 'PENDING_REVIEW').length} Pending Board Review
            </span>
          </div>

          <div className="space-y-3">
            {placements.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs">
                No placement records in queue.
              </Card>
            ) : (
              placements.map((plc) => (
                <Card
                  key={plc.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {plc.application?.fullName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        App: {plc.application?.applicationNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          plc.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : plc.status === 'MODIFIED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : plc.status === 'PENDING_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {plc.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Target:</strong> {plc.application?.program?.name} •{' '}
                      <strong>Assessment Attempt:</strong> {plc.assessmentAttempt ? `${plc.assessmentAttempt.score}%` : 'Diagnostic Taken'}
                    </div>

                    <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <strong>Algorithm Recommendation:</strong> {plc.recommendedLevel} — {plc.reason}
                    </div>

                    {plc.adminNotes && (
                      <div className="text-[11px] text-slate-500 italic">
                        Board Notes: "{plc.adminNotes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAcademicOrSuperAdmin && (
                      <button
                        onClick={() => {
                          setReviewingPlacement(plc);
                          setApprovedLevel(plc.recommendedLevel || 'Level 2 (Accelerated)');
                          setApprovedProgramId(plc.application?.programId || '');
                          setApprovedCohortId(plc.application?.cohortId || '');
                          setBoardNotes(plc.adminNotes || '');
                          setBoardAction('APPROVE');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                      >
                        Academic Board Review
                      </button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ACADEMIC BOARD REVIEW MODAL */}
      {reviewingPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Academic Board Placement Decision</h3>
                <p className="text-xs text-slate-500">
                  Applicant: {reviewingPlacement.application?.fullName} ({reviewingPlacement.application?.applicationNumber})
                </p>
              </div>
              <button onClick={() => setReviewingPlacement(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlacementDecision} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div>
                  <strong className="text-slate-700">Applied Program:</strong>{' '}
                  <span className="text-slate-900">{reviewingPlacement.application?.program?.name}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Diagnostic Score:</strong>{' '}
                  <span className="font-mono font-bold text-indigo-700">
                    {reviewingPlacement.assessmentAttempt?.score !== undefined ? `${reviewingPlacement.assessmentAttempt.score}%` : 'Submitted'}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-700">Algorithm Recommendation:</strong>{' '}
                  <span className="text-amber-700 font-bold">{reviewingPlacement.recommendedLevel}</span>
                </div>
                <div className="text-slate-500 text-[11px]">{reviewingPlacement.reason}</div>
              </div>

              {/* Action Selector: APPROVE, MODIFY, REJECT, RETURN_FOR_REASSESSMENT */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Academic Board Action *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'APPROVE', label: 'Approve Recommendation', desc: 'Accept recommended level' },
                    { id: 'MODIFY', label: 'Modify Level / Cohort', desc: 'Override level or track' },
                    { id: 'RETURN_FOR_REASSESSMENT', label: 'Return for Reassessment', desc: 'Request re-test' },
                    { id: 'REJECT', label: 'Reject Placement', desc: 'Decline application' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setBoardAction(act.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        boardAction === act.id
                          ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{act.label}</div>
                      <div className="text-[10px] text-slate-500">{act.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(boardAction === 'APPROVE' || boardAction === 'MODIFY') && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Approved Academic Level *</label>
                    <select
                      value={approvedLevel}
                      onChange={(e) => setApprovedLevel(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Level 1 (Foundation)">Level 1 (Foundation)</option>
                      <option value="Level 2 (Accelerated)">Level 2 (Accelerated)</option>
                      <option value="Level 3 (Advanced Specialization)">Level 3 (Advanced Specialization)</option>
                    </select>
                  </div>

                  {boardAction === 'MODIFY' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Target Program</label>
                        <select
                          value={approvedProgramId}
                          onChange={(e) => setApprovedProgramId(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="">Retain Applied Program</option>
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Assigned Cohort</label>
                        <select
                          value={approvedCohortId}
                          onChange={(e) => setApprovedCohortId(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                        >
                          <option value="">Retain Current Cohort</option>
                          {cohorts.map((c) => (
                            <option key={c.id} value={c.id}>{c.cohortCode} — {c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Academic Board Rationale / Notes *</label>
                <textarea
                  rows={3}
                  value={boardNotes}
                  onChange={(e) => setBoardNotes(e.target.value)}
                  placeholder="Record official academic evaluation notes, assessment review findings, or placement rationale..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingPlacement(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Recording Decision...' : `Confirm ${boardAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE ADMISSION OFFER MODAL */}
      {issuingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Issue Official Admission Offer</h3>
                <p className="text-xs text-slate-500">Applicant: {issuingApp.fullName} ({issuingApp.applicationNumber})</p>
              </div>
              <button onClick={() => setIssuingApp(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueAdmission} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Assign Cohort *</label>
                <select
                  value={assignCohortId}
                  onChange={(e) => setAssignCohortId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  required
                >
                  <option value="">Select Cohort for Enrollment</option>
                  {cohorts
                    .filter((c) => !issuingApp.programId || c.programId === issuingApp.programId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cohortCode} — {c.name} ({c.currentEnrollment || 0}/{c.maxCapacity} Seats)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Laboratory / Hall</label>
                  <input
                    type="text"
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    placeholder="e.g. Turing Computer Lab 1"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Orientation Date</label>
                  <input
                    type="date"
                    value={orientationDate}
                    onChange={(e) => setOrientationDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                <strong>Lifecycle Policy:</strong> Issuing this offer generates a Provisional Admission Offer. The official final admission letter delivery requires verified financial clearance.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIssuingApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Issuing...' : 'Issue Provisional Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: FULL APPLICANT DOSSIER INSPECTOR */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedApp.applicationNumber}
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">{selectedApp.fullName}</h3>
                <p className="text-xs text-slate-500">Applicant Dossier & Lifecycle Record</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Email Address</span>
                <strong className="text-slate-800">{selectedApp.email}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Phone Number</span>
                <strong className="text-slate-800">{selectedApp.phone}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Target Program</span>
                <strong className="text-slate-800">{selectedApp.program?.name}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Target Cohort</span>
                <strong className="text-slate-800">{selectedApp.cohort?.name || 'Open Cohort'}</strong>
              </div>
            </div>

            {/* Academic Background & Motivation */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">Academic & Technical Background</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block">Education Level & Institution:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedApp.educationLevel || 'Tertiary'} — {selectedApp.institution || 'OAU Ile-Ife'}
                  </span>
                </div>
                {selectedApp.statementOfPurpose && (
                  <div>
                    <span className="text-slate-400 block">Statement of Purpose:</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 whitespace-pre-wrap">
                      {selectedApp.statementOfPurpose}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lifecycle Stages */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">Lifecycle Milestones</h4>
              <div className="space-y-2">
                {/* 1. Assessment */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">1. Diagnostic Assessment</strong>
                    <span className="text-slate-500 text-[11px]">
                      {selectedApp.assessmentAttempts?.length > 0
                        ? `Completed (Score: ${selectedApp.assessmentAttempts[0].score}%)`
                        : 'No Assessment Attempt Recorded'}
                    </span>
                  </div>
                  <Badge variant={selectedApp.assessmentAttempts?.length > 0 ? 'green' : 'slate'}>
                    {selectedApp.assessmentAttempts?.length > 0 ? 'COMPLETED' : 'PENDING'}
                  </Badge>
                </div>

                {/* 2. Academic Board Placement */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">2. Academic Board Placement</strong>
                    <span className="text-slate-500 text-[11px]">
                      {selectedApp.placement
                        ? `Decision: ${selectedApp.placement.status} (${selectedApp.placement.approvedLevel || selectedApp.placement.recommendedLevel})`
                        : 'Pending Board Evaluation'}
                    </span>
                  </div>
                  <Badge variant={selectedApp.placement?.status === 'APPROVED' ? 'green' : 'amber'}>
                    {selectedApp.placement?.status || 'AWAITING'}
                  </Badge>
                </div>

                {/* 3. Admission Offer */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">3. Admission Offer</strong>
                    <span className="text-slate-500 text-[11px]">
                      {selectedApp.admission
                        ? `Offer Issued (${selectedApp.admission.status}) • Adm #: ${selectedApp.admission.admissionNumber}`
                        : 'Not Issued Yet'}
                    </span>
                  </div>
                  <Badge variant={selectedApp.admission ? 'blue' : 'slate'}>
                    {selectedApp.admission?.status || 'UNISSUED'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Administrative Action Controls */}
            {selectedApp.admission && (
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-xs text-slate-900">Admission Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewAdmissionDoc(selectedApp.admission.id)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    View Provisional Document
                  </button>
                  <button
                    onClick={() => handleDeliverOfficialLetter(selectedApp.admission.id)}
                    disabled={processing}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50"
                  >
                    Trigger Official Letter Delivery
                  </button>
                  <button
                    onClick={() => handleEnrollStudent(selectedApp.admission.id)}
                    disabled={processing}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50"
                  >
                    Finalize Enrollment
                  </button>
                  <button
                    onClick={() => handleWithdrawAdmission(selectedApp.admission.id)}
                    disabled={processing}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs disabled:opacity-50"
                  >
                    Withdraw Offer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: ADMISSION DOCUMENT PREVIEW */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {previewDoc.documentType || 'PROVISIONAL ADMISSION OFFER'}
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">Admission Offer Document</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-serif leading-relaxed">
              <div className="text-center pb-3 border-b border-slate-200 font-sans">
                <div className="font-black text-base tracking-tight text-slate-900">STEMPACT ACADEMY</div>
                <div className="text-[10px] text-slate-500 font-mono">Ile-Ife Campus, Osun State, Nigeria</div>
              </div>

              <div>
                <p>Dear <strong>{previewDoc.applicantName}</strong>,</p>
                <p className="mt-2">
                  Following review of your application ({previewDoc.applicationNumber}) and diagnostic placement evaluation, we are pleased to offer you provisional admission to:
                </p>
                <div className="my-3 p-3 bg-white rounded-xl border border-slate-200 font-sans">
                  <div><strong>Program:</strong> {previewDoc.programName}</div>
                  <div><strong>Cohort:</strong> {previewDoc.cohortCode}</div>
                  <div><strong>Admission Ref:</strong> {previewDoc.admissionNumber}</div>
                  <div><strong>Student ID Number:</strong> {previewDoc.studentIdNumber || 'Assigned on Enrollment'}</div>
                </div>
              </div>

              <div className="font-sans text-[11px] p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <strong>Important Notice:</strong> This document represents a provisional admission offer. Official final enrollment clearance and delivery of the official admission letter require completed financial clearance in accordance with Academy regulations.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
