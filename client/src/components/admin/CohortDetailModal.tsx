import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Badge, Card, LoadingSpinner } from '../UIElements';
import {
  X,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  HeartHandshake,
  Layers,
  UserCheck,
  UserPlus,
  Shield,
  Search,
  ExternalLink,
  PowerOff,
  Power,
} from 'lucide-react';

interface CohortDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  applications?: any[];
  onCohortUpdated?: () => void;
  isSuperOrAcademicAdmin?: boolean;
}

export const CohortDetailModal: React.FC<CohortDetailModalProps> = ({
  isOpen,
  onClose,
  cohortId,
  applications = [],
  onCohortUpdated,
  isSuperOrAcademicAdmin = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cohort, setCohort] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'students' | 'applicants' | 'parents' | 'curriculum' | 'sessions' | 'settings'
  >('students');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Filters
  const [applicantSearch, setApplicantSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');

  // Edit form state
  const [formState, setFormState] = useState({
    name: '',
    status: 'OPEN',
    maxCapacity: 25,
    currentEnrollment: 0,
    trainingFee: 65000,
    registrationFee: 5000,
    certificationFee: 10000,
    discountPercentage: 0,
    schedule: '',
    mode: 'Hybrid (Onsite Ile-Ife & Virtual)',
    location: 'STEMPACT Main Hub, Ile-Ife, Osun State',
    instructorName: '',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    level: 'Level 1',
  });

  const loadCohortData = async () => {
    if (!cohortId) return;
    setLoading(true);
    setError('');
    try {
      const [cohortRes, analysisRes] = await Promise.all([
        api.getCohortById(cohortId).catch(() => null),
        api.getCohortAnalysis(cohortId).catch(() => null),
      ]);

      const c = cohortRes?.cohort;
      setCohort(c);
      setAnalysis(analysisRes);

      if (c) {
        setFormState({
          name: c.name || '',
          status: c.status || 'OPEN',
          maxCapacity: c.maxCapacity || 25,
          currentEnrollment: c.currentEnrollment || 0,
          trainingFee: c.trainingFee || 65000,
          registrationFee: c.registrationFee || 5000,
          certificationFee: c.certificationFee || 10000,
          discountPercentage: c.discountPercentage || 0,
          schedule: c.schedule || '',
          mode: c.mode || 'Hybrid (Onsite Ile-Ife & Virtual)',
          location: c.location || 'STEMPACT Main Hub, Ile-Ife, Osun State',
          instructorName: c.instructorName || '',
          startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
          endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
          applicationDeadline: c.applicationDeadline ? new Date(c.applicationDeadline).toISOString().split('T')[0] : '',
          level: c.level || 'Level 1',
        });
      }
    } catch (err: any) {
      console.error('Failed to load cohort details:', err);
      setError(err.message || 'Failed to fetch cohort operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cohortId) {
      loadCohortData();
    } else {
      setCohort(null);
      setAnalysis(null);
    }
  }, [isOpen, cohortId]);

  // Quick 1-click toggle for Closing or Reopening Intake
  const handleToggleIntakeStatus = async (newStatus: string) => {
    if (!cohort) return;
    setSavingSettings(true);
    setSaveSuccess('');
    try {
      await api.updateCohort(cohort.id, { status: newStatus });
      setSaveSuccess(`Cohort intake status updated to ${newStatus}. Public registration updated.`);
      await loadCohortData();
      if (onCohortUpdated) onCohortUpdated();
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update cohort intake status');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohort) return;
    setSavingSettings(true);
    setSaveSuccess('');
    try {
      await api.updateCohort(cohort.id, formState);
      setSaveSuccess('Cohort operations configuration & pricing updated successfully!');
      await loadCohortData();
      if (onCohortUpdated) onCohortUpdated();
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update cohort parameters');
    } finally {
      setSavingSettings(false);
    }
  };

  // Applicants specifically belonging to this cohort or this cohort's program
  const cohortApplicants = useMemo(() => {
    if (!applications || !cohort) return [];
    return applications.filter(
      (a) =>
        a.cohortId === cohort.id ||
        (a.programId === cohort.programId && a.cohort?.cohortCode === cohort.cohortCode)
    );
  }, [applications, cohort]);

  const filteredApplicants = cohortApplicants.filter((app) => {
    if (!applicantSearch) return true;
    const q = applicantSearch.toLowerCase();
    return (
      app.fullName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.applicationNumber?.toLowerCase().includes(q)
    );
  });

  // Parents / Guardians associated with this cohort
  const cohortParents = useMemo(() => {
    const parentMap = new Map<string, any>();

    // 1. From cohort applications
    cohortApplicants.forEach((app) => {
      if (app.parentName || app.parentEmail || app.parentPhone) {
        const key = app.parentEmail || app.parentPhone || app.parentName;
        if (!parentMap.has(key)) {
          parentMap.set(key, {
            name: app.parentName || 'Parent / Guardian',
            phone: app.parentPhone || '—',
            email: app.parentEmail || '—',
            relationship: app.parentRelationship || (app.isMinor ? 'Legal Guardian' : 'Parent'),
            wardName: app.fullName,
            wardId: app.applicationNumber,
            isMinor: app.isMinor,
            isEnrolled: app.status === 'ENROLLED',
          });
        }
      }
    });

    // 2. From enrolled students in analysis
    (analysis?.students || []).forEach((st: any) => {
      if (st.guardian) {
        const key = st.guardian.user?.email || st.guardian.user?.phone || st.guardian.id;
        if (!parentMap.has(key)) {
          parentMap.set(key, {
            name:
              `${st.guardian.user?.firstName || ''} ${st.guardian.user?.lastName || ''}`.trim() ||
              'Parent / Guardian',
            phone: st.guardian.user?.phone || st.guardian.emergencyContact || '—',
            email: st.guardian.user?.email || '—',
            relationship: st.guardian.relationship || 'Parent / Guardian',
            wardName: st.name,
            wardId: st.studentIdNumber || st.id,
            isMinor: false,
            isEnrolled: true,
          });
        }
      }
    });

    return Array.from(parentMap.values());
  }, [cohortApplicants, analysis]);

  const filteredParents = cohortParents.filter((p) => {
    if (!parentSearch) return true;
    const q = parentSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.wardName?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!analysis?.students || analysis.students.length === 0) return;
    const headers = [
      'Student Name',
      'Email',
      'Phone',
      'Enrollment Date',
      'Status',
      'Attendance Rate',
      'Invoiced',
      'Paid',
      'Balance',
      'Payment Status',
    ];
    const rows = analysis.students.map((s: any) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : ''}"`,
      `"${s.status}"`,
      `"${s.attendanceRate}%"`,
      s.financials?.totalInvoiced || 0,
      s.financials?.totalPaid || 0,
      s.financials?.balance || 0,
      `"${s.financials?.status || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${cohort?.cohortCode || 'cohort'}_students_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const students = analysis?.students || [];
  const analytics = analysis?.analytics || {
    totalRevenue: 0,
    totalOutstanding: 0,
    fillRate: 0,
    activeStudents: 0,
  };

  const program = cohort?.program;
  const session = cohort?.academicSession;
  const programVersion = cohort?.programVersion;
  const curriculumVersion = cohort?.curriculumVersion;
  const isIntakeOpen = cohort?.status === 'OPEN' || cohort?.status === 'ALMOST_FULL';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shrink-0 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                  {cohort?.cohortCode || cohortId}
                </span>
                {session && (
                  <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{session.name}</span>
                    {session.isCurrent && (
                      <span className="text-[10px] text-emerald-400 font-extrabold">• ACTIVE</span>
                    )}
                  </span>
                )}
                {programVersion && (
                  <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                    Program v{programVersion.versionNumber}
                  </span>
                )}
                {curriculumVersion && (
                  <span className="text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2.5 py-0.5 rounded-full">
                    Curriculum v{curriculumVersion.versionNumber}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {cohort?.name || 'Cohort Operations Console'}
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl">
                {program?.name} • Delivery: <strong>{cohort?.mode}</strong> • Lead: <strong>{cohort?.instructorName}</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Intake Control & KPIs Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            {/* Operational KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity & Intake</span>
                <div className="text-lg font-black text-white mt-0.5">
                  {cohort?.currentEnrollment || 0} / {cohort?.maxCapacity || 25}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {analytics.fillRate?.toFixed(1) || 0}% Seat Fill Rate
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cohort Applicants</span>
                <div className="text-lg font-black text-blue-300 mt-0.5">
                  {cohortApplicants.length}
                </div>
                <span className="text-[10px] text-slate-400">Total pipeline intake</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tuition Collected</span>
                <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                  ₦{Number(analytics.totalRevenue || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">Verified intake</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Intake State</span>
                <div className="mt-1">
                  <Badge variant={isIntakeOpen ? 'green' : cohort?.status === 'FULL' ? 'purple' : 'red'}>
                    {cohort?.status === 'OPEN' ? 'OPEN FOR APPLICATION' : cohort?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Intake Closure Button for Admin */}
            {isSuperOrAcademicAdmin && (
              <div className="flex items-center gap-2">
                {isIntakeOpen ? (
                  <button
                    onClick={() => handleToggleIntakeStatus('CLOSED')}
                    disabled={savingSettings}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Close Intake for this Cohort</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleIntakeStatus('OPEN')}
                    disabled={savingSettings}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Reopen Intake for Applications</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'students'
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Enrolled Students ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'applicants'
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Cohort Applicants ({cohortApplicants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('parents')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'parents'
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Parents & Guardians ({cohortParents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Curriculum & Version Pacing</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Class Timetable & Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Intake Control & Pricing</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <LoadingSpinner message="Loading cohort intelligence, enrolled students roster, and financial ledger..." />
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: ENROLLED STUDENTS */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Enrolled Students ({students.length} Learners)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Real-time student academic attendance fidelity and fee clearance ledger.
                      </p>
                    </div>

                    {students.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
                      </button>
                    )}
                  </div>

                  {students.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-2">
                      <Users className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No students currently enrolled in this cohort.
                      </p>
                      <p className="text-[11px]">
                        Students appear here once their admission is accepted and financial clearance is verified.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10px] font-bold">
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Contact</th>
                              <th className="py-3 px-4">Attendance Rate</th>
                              <th className="py-3 px-4">Total Invoiced</th>
                              <th className="py-3 px-4">Amount Paid</th>
                              <th className="py-3 px-4">Balance</th>
                              <th className="py-3 px-4">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                            {students.map((st: any) => (
                              <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                  <div>{st.name}</div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Enrolled: {st.enrollmentDate ? new Date(st.enrollmentDate).toLocaleDateString('en-GB') : '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{st.email}</span>
                                  </div>
                                  {st.phone && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{st.phone}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${st.attendanceRate || 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                      {st.attendanceRate || 100}%
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono font-semibold">
                                  ₦{Number(st.financials?.totalInvoiced || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                                  ₦{Number(st.financials?.totalPaid || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-amber-600">
                                  ₦{Number(st.financials?.balance || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant={
                                      st.financials?.status === 'PAID'
                                        ? 'green'
                                        : st.financials?.status === 'PARTIAL'
                                        ? 'amber'
                                        : 'red'
                                    }
                                  >
                                    {st.financials?.status || 'UNPAID'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COHORT APPLICANTS */}
              {activeTab === 'applicants' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Applications Received for {cohort?.name} ({cohortApplicants.length})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Prospective applicants in the intake pipeline targeting this specific cohort.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search applicants..."
                        value={applicantSearch}
                        onChange={(e) => setApplicantSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  {filteredApplicants.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-2">
                      <UserPlus className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No applications currently assigned to this cohort.
                      </p>
                      <p className="text-[11px]">
                        Applicants will show up here as they apply via the public catalog or when allocated from the admissions pipeline.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10px] font-bold">
                              <th className="py-3 px-4">Applicant</th>
                              <th className="py-3 px-4">Contact</th>
                              <th className="py-3 px-4">Age / Category</th>
                              <th className="py-3 px-4">Parent / Guardian Recorded</th>
                              <th className="py-3 px-4">Applied Date</th>
                              <th className="py-3 px-4">Intake Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                            {filteredApplicants.map((app: any) => (
                              <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                  <div>{app.fullName}</div>
                                  <span className="text-[10px] font-mono text-blue-600">
                                    {app.applicationNumber}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{app.email}</span>
                                  </div>
                                  {app.phone && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{app.phone}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {app.isMinor ? (
                                    <Badge variant="purple">Minor (Consent Linked)</Badge>
                                  ) : (
                                    <Badge variant="slate">Adult Learner</Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {app.parentName ? (
                                    <div className="space-y-0.5">
                                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                                        {app.parentName}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        {app.parentPhone || app.parentEmail} ({app.parentRelationship || 'Guardian'})
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">Self-Sponsored / None</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                                  {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB') : '—'}
                                </td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant={
                                      app.status === 'ENROLLED'
                                        ? 'green'
                                        : app.status === 'ADMITTED'
                                        ? 'blue'
                                        : app.status === 'PLACED'
                                        ? 'purple'
                                        : 'amber'
                                    }
                                  >
                                    {app.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PARENTS & GUARDIANS DIRECTORY */}
              {activeTab === 'parents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Parents & Guardians Directory ({cohortParents.length})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Primary guardians and emergency contacts linked to learners and applicants in this cohort.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search parents & wards..."
                        value={parentSearch}
                        onChange={(e) => setParentSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  {filteredParents.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-2">
                      <HeartHandshake className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No parent/guardian records currently associated with this cohort.
                      </p>
                      <p className="text-[11px]">
                        Guardian contacts are recorded automatically when applications with parental consent are submitted.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredParents.map((parent: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-2xs hover:border-indigo-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">
                                {parent.name}
                              </div>
                              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {parent.relationship}
                              </span>
                            </div>
                            <span className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500">
                              <Shield className="w-4 h-4" />
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-700">
                            {parent.phone && parent.phone !== '—' && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <a href={`tel:${parent.phone}`} className="hover:text-blue-600 hover:underline">
                                  {parent.phone}
                                </a>
                              </div>
                            )}
                            {parent.email && parent.email !== '—' && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <a href={`mailto:${parent.email}`} className="hover:text-blue-600 hover:underline truncate">
                                  {parent.email}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Enrolled Ward:
                            </span>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {parent.wardName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {parent.wardId} {parent.isEnrolled && '• (Enrolled Student)'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CURRICULUM & VERSION PACING */}
              {activeTab === 'curriculum' && (
                <div className="space-y-6 text-xs">
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-indigo-950 dark:text-indigo-200">
                          Canonical Version Anchoring
                        </span>
                      </div>
                      <Badge variant="purple">
                        {programVersion ? `Program v${programVersion.versionNumber}` : 'Default Version'}
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      Learners in this cohort are anchored to{' '}
                      <strong>{curriculumVersion?.name || `Curriculum Version ${curriculumVersion?.versionNumber || 1}`}</strong>.
                      Any subsequent changes to canonical curriculum will not disrupt this active cohort's syllabus.
                    </p>
                  </div>

                  {/* Program Courses Outline */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Canonical Courses Linked to Cohort ({program?.courses?.length || 0})
                    </h5>

                    {(!program?.courses || program.courses.length === 0) ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
                        No canonical courses currently linked in relational schema.
                      </div>
                    ) : (
                      program.courses.map((course: any, idx: number) => (
                        <div
                          key={course.id || idx}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                              Course {idx + 1}: {course.code} — {course.title}
                            </span>
                            {course.credits && (
                              <span className="font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px]">
                                {course.credits} Credits
                              </span>
                            )}
                          </div>

                          {course.modules && course.modules.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                              {course.modules.map((mod: any, mIdx: number) => (
                                <div
                                  key={mod.id || mIdx}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700"
                                >
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    Mod {mod.orderIndex || mIdx + 1}: {mod.title}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CLASS TIMETABLE & SESSIONS */}
              {activeTab === 'sessions' && (
                <div className="space-y-4 text-xs">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Scheduled Timetable & Operational Logistics
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Class Weekly Schedule</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {cohort?.schedule || 'TBA'}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delivery Venue & Mode</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {cohort?.mode}
                        </div>
                        <div className="text-[10px] text-slate-500">{cohort?.location}</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>Cohort Date Bounds</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          <strong>Starts:</strong>{' '}
                          {cohort?.startDate ? new Date(cohort.startDate).toLocaleDateString('en-GB') : 'TBA'}
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          <strong>Ends:</strong>{' '}
                          {cohort?.endDate ? new Date(cohort.endDate).toLocaleDateString('en-GB') : 'TBA'}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px]">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Assigned Lead Faculty</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {cohort?.instructorName || 'Academy Lead Mentor'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: INTAKE CONTROL & PRICING SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                  {/* Intake Closure Banner */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          Cohort Application & Intake Status Control
                        </h4>
                        <p className="text-xs text-slate-500">
                          Set whether this program is accepting new applications. Closing intake disables applications on the public website.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isIntakeOpen ? (
                          <button
                            type="button"
                            onClick={() => handleToggleIntakeStatus('CLOSED')}
                            disabled={savingSettings}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <PowerOff className="w-3.5 h-3.5" />
                            <span>Close Intake Now</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleIntakeStatus('OPEN')}
                            disabled={savingSettings}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>Reopen Application Intake</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Status Selector:</label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      >
                        <option value="OPEN">OPEN (Accepting Applications)</option>
                        <option value="ALMOST_FULL">ALMOST FULL</option>
                        <option value="FULL">FULL (No more seats)</option>
                        <option value="IN_PROGRESS">IN PROGRESS (Classes Active)</option>
                        <option value="COMPLETED">COMPLETED (Graduated)</option>
                        <option value="CLOSED">CLOSED (Intake Closed)</option>
                      </select>
                    </div>
                  </div>

                  {/* Capacity & Pricing Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Max Capacity (Seat Intake Limit)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formState.maxCapacity}
                        onChange={(e) => setFormState({ ...formState, maxCapacity: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Training Tuition Fee (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formState.trainingFee}
                        onChange={(e) => setFormState({ ...formState, trainingFee: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Merit Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formState.discountPercentage}
                        onChange={(e) => setFormState({ ...formState, discountPercentage: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Registration Fee (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={formState.registrationFee}
                        onChange={(e) => setFormState({ ...formState, registrationFee: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Certification Fee (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={formState.certificationFee}
                        onChange={(e) => setFormState({ ...formState, certificationFee: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={formState.applicationDeadline}
                        onChange={(e) => setFormState({ ...formState, applicationDeadline: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formState.startDate}
                        onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formState.endDate}
                        onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Class Schedule Pattern
                    </label>
                    <input
                      type="text"
                      value={formState.schedule}
                      onChange={(e) => setFormState({ ...formState, schedule: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-3">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {savingSettings ? <LoadingSpinner message="" /> : <Edit className="w-4 h-4" />}
                      <span>Save Intake & Configuration</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
