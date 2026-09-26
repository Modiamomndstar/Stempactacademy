import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface CohortDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  onCohortUpdated?: () => void;
  isSuperOrAcademicAdmin?: boolean;
}

export const CohortDetailModal: React.FC<CohortDetailModalProps> = ({
  isOpen,
  onClose,
  cohortId,
  onCohortUpdated,
  isSuperOrAcademicAdmin = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cohort, setCohort] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'curriculum' | 'sessions' | 'settings'>('students');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

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

  const handleExportCSV = () => {
    if (!analysis?.students || analysis.students.length === 0) return;
    const headers = ['Student Name', 'Email', 'Phone', 'Enrollment Date', 'Status', 'Attendance Rate', 'Invoiced', 'Paid', 'Balance', 'Payment Status'];
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
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
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
                    {session.isCurrent && <span className="text-[10px] text-emerald-400 font-extrabold">• ACTIVE</span>}
                  </span>
                )}
                {programVersion && (
                  <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                    Program v{programVersion.versionNumber}
                  </span>
                )}
                {curriculumVersion && (
                  <span className="text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full">
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

          {/* Top 4 Operational KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity & Enrollment</span>
              <div className="text-lg font-black text-white mt-0.5">
                {cohort?.currentEnrollment || 0} / {cohort?.maxCapacity || 25}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {analytics.fillRate?.toFixed(1) || 0}% Fill Rate
              </span>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tuition Collected</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                ₦{Number(analytics.totalRevenue || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Total ledger intake</span>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Outstanding Balance</span>
              <div className="text-lg font-black text-amber-400 mt-0.5 font-mono">
                ₦{Number(analytics.totalOutstanding || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Pending clearance</span>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Cohort Status</span>
              <div className="mt-1">
                <Badge variant={cohort?.status === 'OPEN' ? 'green' : cohort?.status === 'FULL' ? 'purple' : 'amber'}>
                  {cohort?.status}
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Level: {cohort?.level || 'Level 1'}</span>
            </div>
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
            <Users className="w-4 h-4" />
            <span>Enrolled Students & Guardians ({students.length})</span>
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
            <span>Edit Pricing & Settings</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
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
              {/* TAB 1: ENROLLED STUDENTS & GUARDIANS */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Enrolled Students & Guardian Ledger ({students.length} Learners)
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

              {/* TAB 2: CURRICULUM & VERSION PACING */}
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
                      <span className="font-mono text-[11px] font-bold bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        Program Version: {programVersion?.versionNumber || 1} • Curriculum Version: {curriculumVersion?.versionNumber || 1}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Learners in this cohort are anchored to this specific approved version. Any future program revisions will not mutate historical cohorts or learner transcript records.
                    </p>
                  </div>

                  {/* Course outline */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Courses & Syllabus Delivery
                    </h4>
                    {(program?.courses || []).length === 0 ? (
                      <p className="text-slate-500">Standard modular curriculum mapped in backend architecture.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {program.courses.map((course: any, idx: number) => (
                          <div
                            key={course.id || idx}
                            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-mono text-[10px] text-blue-600 font-bold block">
                                  {course.code || `COURSE-${idx + 1}`}
                                </span>
                                <strong className="text-slate-900 dark:text-white">
                                  {course.title}
                                </strong>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {course.modules?.length || 0} Modules Linked
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TIMETABLE & CLASS SESSIONS */}
              {activeTab === 'sessions' && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Weekly Schedule</span>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {cohort?.schedule || 'Mon, Wed, Fri (4:00 PM – 7:00 PM)'}
                      </div>
                      <span className="text-[10px] text-slate-500">Laboratory & Live Practicum</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Delivery Venue</span>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {cohort?.location || 'STEMPACT Main Hub, Ile-Ife'}
                      </div>
                      <span className="text-[10px] text-slate-500">{cohort?.mode}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Lead Faculty Mentor</span>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {cohort?.instructorName || 'Academy Lead'}
                      </div>
                      <span className="text-[10px] text-slate-500">Supervising Mentor</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Session Date Milestones</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold">Start Date</span>
                        <strong className="text-slate-900 dark:text-white">
                          {cohort?.startDate ? new Date(cohort.startDate).toLocaleDateString('en-GB') : '—'}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold">End Date</span>
                        <strong className="text-slate-900 dark:text-white">
                          {cohort?.endDate ? new Date(cohort.endDate).toLocaleDateString('en-GB') : '—'}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold">Application Deadline</span>
                        <strong className="text-slate-900 dark:text-white">
                          {cohort?.applicationDeadline ? new Date(cohort.applicationDeadline).toLocaleDateString('en-GB') : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS & PRICING EDITOR */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                  {saveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between">
                      <span>✓ {saveSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cohort Name
                      </label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cohort Status
                      </label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-blue-600"
                      >
                        <option value="OPEN">OPEN (Accepting Admissions)</option>
                        <option value="ALMOST_FULL">ALMOST FULL</option>
                        <option value="FULL">FULL</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Training Tuition (₦)
                      </label>
                      <input
                        type="number"
                        value={formState.trainingFee}
                        onChange={(e) => setFormState({ ...formState, trainingFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Registration (₦)
                      </label>
                      <input
                        type="number"
                        value={formState.registrationFee}
                        onChange={(e) => setFormState({ ...formState, registrationFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Certification (₦)
                      </label>
                      <input
                        type="number"
                        value={formState.certificationFee}
                        onChange={(e) => setFormState({ ...formState, certificationFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold focus:outline-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Merit Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formState.discountPercentage}
                        onChange={(e) => setFormState({ ...formState, discountPercentage: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  {/* Capacity & Logistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Maximum Seat Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formState.maxCapacity}
                        onChange={(e) => setFormState({ ...formState, maxCapacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Delivery Mode
                      </label>
                      <select
                        value={formState.mode}
                        onChange={(e) => setFormState({ ...formState, mode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-blue-600"
                      >
                        <option value="Hybrid (Onsite Ile-Ife & Virtual)">Hybrid (Ile-Ife & Virtual)</option>
                        <option value="100% Virtual / Remote">100% Virtual / Remote</option>
                        <option value="100% Onsite Lab Intensive">100% Onsite Lab Intensive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Lead Instructor Name
                      </label>
                      <input
                        type="text"
                        value={formState.instructorName}
                        onChange={(e) => setFormState({ ...formState, instructorName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Class Schedule & Timetable
                    </label>
                    <input
                      type="text"
                      value={formState.schedule}
                      onChange={(e) => setFormState({ ...formState, schedule: e.target.value })}
                      placeholder="e.g. Mon, Wed, Fri (4:00 PM – 7:00 PM) & Saturdays"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-blue-600"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('students')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      Back to Roster
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {savingSettings ? 'Saving Configuration...' : 'Save Cohort Configuration'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
