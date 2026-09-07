import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  FileText,
  Filter,
  Check,
  X,
  CreditCard,
  Edit,
  ExternalLink,
  Send,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [pendingPlacements, setPendingPlacements] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'placements' | 'applications' | 'cohorts' | 'programs' | 'invoices' | 'certificates' | 'cms'
  >('analytics');

  // Modal / Review States
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [reviewingPlacement, setReviewingPlacement] = useState<any | null>(null);
  const [approvedLevelInput, setApprovedLevelInput] = useState<string>('Level 2 (Accelerated)');
  const [adminNotesInput, setAdminNotesInput] = useState<string>('Approved following diagnostic assessment review.');
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // New Announcement / CMS state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  const loadAllData = async () => {
    try {
      const [statsRes, appsRes, placementsRes, cohortsRes, progRes, invRes] = await Promise.all([
        api.getAdminStats(),
        api.getApplications(),
        api.getPendingPlacements(),
        api.getCohorts(),
        api.getPrograms(),
        api.getInvoices(),
      ]);
      setStats(statsRes);
      setApplications(appsRes.applications || []);
      setPendingPlacements(placementsRes.placements || []);
      setCohorts(cohortsRes.cohorts || []);
      setPrograms(progRes.programs || []);
      setInvoices(invRes.invoices || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. Approve Placement
  const handleApprovePlacement = async (placementId: string) => {
    setProcessingAction(true);
    try {
      await api.reviewPlacement(placementId, {
        action: 'APPROVE',
        approvedLevel: approvedLevelInput,
        adminNotes: adminNotesInput,
      });
      setActionSuccess('Placement approved by Academic Board! Ready for admission issuance.');
      setReviewingPlacement(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve placement');
    } finally {
      setProcessingAction(false);
    }
  };

  // 2. Issue Admission
  const handleIssueAdmission = async (applicationId: string, cohortId?: string) => {
    setProcessingAction(true);
    try {
      const res = await api.issueAdmission({
        applicationId,
        cohortId,
        assignedClass: 'Turing Computer Lab 1',
      });
      setActionSuccess(
        `Admission issued successfully! Student ID: ${res.studentIdNumber} • Admission No: ${res.admissionNumber}`
      );
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to issue admission');
    } finally {
      setProcessingAction(false);
    }
  };

  // 3. Toggle Program Status
  const handleToggleProgramStatus = async (programId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN_FOR_APPLICATION' ? 'FULL' : 'OPEN_FOR_APPLICATION';
    try {
      await api.updateProgramStatus(programId, { status: newStatus });
      setActionSuccess(`Program status switched to ${newStatus}`);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update program status');
    }
  };

  // 4. Broadcast Announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    try {
      await api.createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        targetAudience: 'ALL',
        priority: 'HIGH',
      });
      setActionSuccess('Announcement broadcasted to all students and faculty!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to create announcement');
    }
  };

  if (loading) return <LoadingSpinner message="Loading Executive Management Console..." />;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center">
            AD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
                EXECUTIVE ACADEMIC CONSOLE
              </span>
              <span className="text-xs font-bold text-slate-400">
                {user?.role.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              STEMPACT Administration Hub
            </h1>
            <p className="text-xs text-slate-400">
              Ile-Ife Campus Operations • Admissions Pipeline • Financial Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAllData()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Refresh Data
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            Sign Out
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="font-semibold">{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-900">×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-thin">
          {[
            { id: 'analytics', name: 'Executive Analytics' },
            { id: 'placements', name: `Placement Review Queue (${pendingPlacements.length})` },
            { id: 'applications', name: `Applications Pipeline (${applications.length})` },
            { id: 'cohorts', name: `Cohorts & Seats (${cohorts.length})` },
            { id: 'programs', name: `Academic Programs (${programs.length})` },
            { id: 'invoices', name: `Revenue & Invoices (${invoices.length})` },
            { id: 'cms', name: 'Announcements & CMS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* TAB 1: EXECUTIVE ANALYTICS */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Applicants</span>
                <div className="text-2xl font-black text-slate-900">{stats.metrics.totalApplicants}</div>
                <div className="text-[11px] text-blue-600 font-semibold">{stats.metrics.newApplicants} New Pending</div>
              </Card>

              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Admitted Learners</span>
                <div className="text-2xl font-black text-emerald-600">{stats.metrics.admittedStudents}</div>
                <div className="text-[11px] text-slate-500 font-semibold">{stats.metrics.conversionRate}% Conversion Rate</div>
              </Card>

              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue Collected</span>
                <div className="text-2xl font-black text-slate-900">
                  ₦{(stats.metrics.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-600 font-semibold">
                  ₦{(stats.metrics.outstandingBalance || 0).toLocaleString()} Outstanding
                </div>
              </Card>

              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Overall Attendance</span>
                <div className="text-2xl font-black text-blue-600">{stats.metrics.overallAttendanceRate}%</div>
                <div className="text-[11px] text-slate-500 font-semibold">Across All Class Sessions</div>
              </Card>
            </div>

            {/* Popular Programs Breakdown */}
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Most Popular Academic Tracks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {stats.popularPrograms?.map((prog: any) => (
                  <div key={prog.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{prog.name}</span>
                      <span className="text-slate-500">{prog.schoolName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-600 text-sm block">
                        {prog.applicantCount} Applicants
                      </span>
                      <span className="text-[10px] text-slate-400">{prog.cohortCount} Active Cohorts</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: PLACEMENT REVIEW QUEUE (ACADEMIC BOARD APPROVAL WORKFLOW) */}
        {activeTab === 'placements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Academic Placement Review Queue</h2>
                <p className="text-xs text-slate-500">
                  Mandatory Academic Board sign-off: Review algorithmic test results, adjust levels, and approve placement.
                </p>
              </div>
            </div>

            {pendingPlacements.length === 0 ? (
              <Card className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No Pending Placements</h3>
                <p className="text-xs text-slate-500">All submitted assessments have been formally ratified.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPlacements.map((plc: any) => (
                  <Card key={plc.id} className="p-6 space-y-4 border-l-4 border-l-amber-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {plc.application?.applicationNumber}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-0.5">
                          {plc.application?.fullName} ({plc.application?.email})
                        </h3>
                      </div>
                      <Badge variant="amber">PENDING ACADEMIC REVIEW</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Assessment Score</span>
                        <span className="font-black text-slate-900 text-base">
                          {plc.assessmentAttempt?.score ?? 35} / {plc.assessmentAttempt?.maxScore ?? 40} ({plc.assessmentAttempt?.percentage ?? 87}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Track</span>
                        <span className="font-bold text-blue-900 text-sm">
                          {plc.recommendedProgram}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Level</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {plc.recommendedLevel}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Diagnostic Evaluation Notes:</strong> {plc.reason}
                    </p>

                    {/* Review Modal / Drawer Inline */}
                    {reviewingPlacement?.id === plc.id ? (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 text-xs">
                        <div className="font-bold text-blue-950">Academic Board Ratification Panel:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">Approved Level *</label>
                            <input
                              type="text"
                              value={approvedLevelInput}
                              onChange={(e) => setApprovedLevelInput(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">Official Board Remarks</label>
                            <input
                              type="text"
                              value={adminNotesInput}
                              onChange={(e) => setAdminNotesInput(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            disabled={processingAction}
                            onClick={() => handleApprovePlacement(plc.id)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Confirm & Approve Placement</span>
                          </button>
                          <button
                            onClick={() => setReviewingPlacement(null)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setReviewingPlacement(plc);
                            setApprovedLevelInput(plc.recommendedLevel || 'Level 2');
                            setAdminNotesInput(`Approved by Academic Board based on score ${plc.assessmentAttempt?.percentage ?? 87}%.`);
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                        >
                          Review & Ratify Placement
                        </button>
                        <span className="text-[11px] text-slate-400">Never purely automated</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: APPLICATIONS PIPELINE & ADMISSION ISSUANCE */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Student Application Pipeline</h2>
            <div className="space-y-4">
              {applications.map((app: any) => {
                const canIssueAdmission = app.status === 'PLACED' && !app.admission;
                return (
                  <Card key={app.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600">{app.applicationNumber}</span>
                        <h3 className="font-bold text-base text-slate-900 mt-0.5">{app.fullName}</h3>
                        <div className="text-xs text-slate-500">{app.email} • {app.phone}</div>
                      </div>
                      <Badge
                        variant={
                          app.status === 'ADMITTED'
                            ? 'green'
                            : app.status === 'PLACED'
                            ? 'blue'
                            : 'amber'
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <strong className="text-slate-700 block">Applied Program:</strong>
                        <span className="text-slate-600">{app.program?.name}</span>
                      </div>
                      <div>
                        <strong className="text-slate-700 block">Education Level:</strong>
                        <span className="text-slate-600">{app.educationLevel}</span>
                      </div>
                      <div>
                        <strong className="text-slate-700 block">Schedule:</strong>
                        <span className="text-slate-600">{app.preferredSchedule}</span>
                      </div>
                      <div>
                        <strong className="text-slate-700 block">Minor Safeguard:</strong>
                        <span className="text-slate-600">{app.isMinor ? `Minor (${app.parentName})` : 'Adult (>18)'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                      <strong>Statement of Purpose:</strong> {app.statementOfPurpose}
                    </p>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {app.admission ? (
                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Admitted: {app.admission.studentIdNumber} ({app.admission.admissionNumber})</span>
                        </div>
                      ) : canIssueAdmission ? (
                        <button
                          disabled={processingAction}
                          onClick={() => handleIssueAdmission(app.id, app.cohortId)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                        >
                          {processingAction ? 'Generating Admission...' : 'Issue Official Admission Letter & Student ID'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {app.status === 'ASSESSMENT_PENDING' ? 'Awaiting Diagnostic Assessment' : 'Awaiting Placement Review'}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COHORTS & SEATS */}
        {activeTab === 'cohorts' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Academic Cohorts & Capacity Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((c: any) => (
                <Card key={c.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">{c.cohortCode}</span>
                    <Badge variant="blue">{c.status}</Badge>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Program:</strong> {c.program?.name}</div>
                    <div><strong>Start:</strong> {new Date(c.startDate).toLocaleDateString('en-GB')}</div>
                    <div><strong>Enrollment:</strong> {c.currentEnrollment} / {c.maxCapacity} seats</div>
                    <div><strong>Tuition:</strong> ₦{c.trainingFee.toLocaleString()}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ACADEMIC PROGRAMS & STATUS TOGGLES */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Program Catalog Status Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((prog: any) => (
                <Card key={prog.id} className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400">{prog.code}</span>
                    <h4 className="font-bold text-sm text-slate-900">{prog.name}</h4>
                    <span className="text-xs text-slate-500">{prog.school?.name}</span>
                  </div>

                  <button
                    onClick={() => handleToggleProgramStatus(prog.id, prog.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      prog.status === 'OPEN_FOR_APPLICATION'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {prog.status === 'OPEN_FOR_APPLICATION' ? 'Accepting Applications' : 'Cohort Full'}
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: REVENUE & INVOICES */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Tuition Invoices & Payment Ledger</h2>
            <div className="space-y-3">
              {invoices.map((inv: any) => (
                <Card key={inv.id} className="p-5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600 block">{inv.invoiceNumber}</span>
                    <span className="font-bold text-slate-900 text-sm">{inv.title}</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="font-black text-slate-900 text-sm block">₦{inv.totalAmount.toLocaleString()}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ANNOUNCEMENTS & CMS */}
        {activeTab === 'cms' && (
          <Card className="p-8 space-y-6">
            <h3 className="font-bold text-base text-slate-900">Broadcast Campus Announcement</h3>
            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Announcement Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update for 2025 Full-Stack Sprint"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Announcement Content *</label>
                <textarea
                  rows={4}
                  placeholder="Official memo broadcasted across Student, Parent, and Instructor dashboards..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast Announcement</span>
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};
