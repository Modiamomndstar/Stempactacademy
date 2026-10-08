import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  GraduationCap,
  DollarSign,
  Calendar,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  Phone,
  Mail,
  Award,
  BookOpen,
  FileText,
  ExternalLink,
  RefreshCw,
  Layers,
  Building2,
  CreditCard,
  Activity,
  Check,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';

// -------------------------------------------------------------
// 360° PROFILE DOSSIER MODAL COMPONENT
// -------------------------------------------------------------
interface Learner360ModalProps {
  userId: string;
  onClose: () => void;
}

export const Learner360Modal: React.FC<Learner360ModalProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDossierTab, setActiveDossierTab] = useState<
    'overview' | 'academic' | 'submissions' | 'finance' | 'activity'
  >('overview');

  useEffect(() => {
    let isMounted = true;
    const fetchDossier = async () => {
      setLoading(true);
      try {
        const res = await api.getUserProfile360(userId);
        if (isMounted) {
          setProfile(res.profile);
        }
      } catch (err) {
        console.error('Failed to load user 360 profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDossier();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading 360° Profile Dossier...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-slate-800">User profile could not be retrieved.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const {
    user,
    studentProfile,
    parentProfile,
    guardian,
    enrollments,
    financialSummary,
    invoices,
    payments,
    clearances,
    assignmentSubmissions,
    projects,
    certificates,
    attendance,
    lessonProgress,
    recentActivity,
  } = profile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-white/20 flex items-center justify-center text-2xl font-black shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.firstName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black">
                  {user.firstName} {user.lastName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {user.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {user.isActive ? 'Active Account' : 'Suspended'}
                </span>
                {studentProfile?.studentId && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-slate-200">
                    ID: {studentProfile.studentId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-70" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 opacity-70" /> {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 opacity-70" /> Joined{' '}
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>

          {/* Dossier Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t border-white/10 text-xs">
            {[
              { id: 'overview', label: 'Overview & Bio', icon: Users },
              { id: 'academic', label: 'Academic Journey', icon: BookOpen },
              { id: 'submissions', label: 'Submissions & Grades', icon: Award },
              { id: 'finance', label: 'Tuition & Clearance', icon: CreditCard },
              { id: 'activity', label: 'Access & Activity', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDossierTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDossierTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          {/* TAB 1: OVERVIEW & BIO */}
          {activeDossierTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial & Academic Highlights Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="text-[10px] uppercase font-bold text-blue-600">Total Billed</p>
                  <p className="text-lg font-black text-blue-950 mt-1">
                    ₦{(financialSummary?.totalInvoiced || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Total Paid</p>
                  <p className="text-lg font-black text-emerald-950 mt-1">
                    ₦{(financialSummary?.totalPaid || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="text-[10px] uppercase font-bold text-rose-600">Current Balance</p>
                  <p className="text-lg font-black text-rose-950 mt-1">
                    ₦{(financialSummary?.balanceDue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                  <p className="text-[10px] uppercase font-bold text-purple-600">Tuition Status</p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      financialSummary?.paymentStatus === 'FULLY_PAID'
                        ? 'bg-emerald-200 text-emerald-900'
                        : financialSummary?.paymentStatus === 'PARTIALLY_PAID'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {financialSummary?.paymentStatus || 'UNPAID'}
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Bio & Personal Data
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Full Legal Name</span>
                    <strong className="text-slate-800">
                      {user.firstName} {user.lastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <strong className="text-slate-800">{user.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone Number</span>
                    <strong className="text-slate-800">{user.phone || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                    <strong className="text-slate-800">
                      {studentProfile?.dob
                        ? new Date(studentProfile.dob).toLocaleDateString()
                        : 'Not specified'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gender</span>
                    <strong className="text-slate-800">
                      {studentProfile?.gender || 'Not specified'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Residential Address</span>
                    <strong className="text-slate-800">
                      {studentProfile?.address || 'Not specified'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Guardian Information (If Student) */}
              {guardian && (
                <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
                  <h3 className="font-black text-blue-950 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" /> Linked Parent / Guardian
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Guardian Name</span>
                      <strong className="text-slate-800">{guardian.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Guardian Phone</span>
                      <strong className="text-slate-800">{guardian.phone || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Guardian Email</span>
                      <strong className="text-slate-800">{guardian.email || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Relationship</span>
                      <strong className="text-slate-800">{guardian.relationship || 'Guardian'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Wards (If Parent Profile) */}
              {parentProfile?.students && parentProfile.students.length > 0 && (
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                  <h3 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" /> Linked Wards / Children (
                    {parentProfile.students.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parentProfile.students.map((w: any) => (
                      <div
                        key={w.id}
                        className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {w.user?.firstName} {w.user?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            ID: {w.studentId} • {w.cohort?.name || 'No Cohort'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACADEMIC JOURNEY */}
          {activeDossierTab === 'academic' && (
            <div className="space-y-6">
              {/* Active & Past Cohort Enrollments */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Enrolled Cohorts & Programs
                </h3>
                {enrollments && enrollments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {enrollments.map((enr: any) => (
                      <div
                        key={enr.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {enr.cohort?.program?.school?.name || 'STEMPACT Academy'}
                            </span>
                            <h4 className="font-black text-slate-900 text-sm mt-1">
                              {enr.cohort?.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {enr.cohort?.program?.name} • Level:{' '}
                              <strong>{enr.cohort?.levelCode || enr.cohort?.level || 'Foundation'}</strong>
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              enr.status === 'ENROLLED' || enr.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {enr.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Schedule</span>
                            {enr.cohort?.schedule || 'Flexible'}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Mode</span>
                            {enr.cohort?.mode || 'Hybrid'}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Center</span>
                            {enr.cohort?.learningCenter?.name || 'Virtual Global'}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Enrolled On</span>
                            {enr.createdAt ? new Date(enr.createdAt).toLocaleDateString() : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No active cohort enrollments recorded for this user.
                  </p>
                )}
              </div>

              {/* Lesson Progress & Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Lesson Completion Progress
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span>Completed Lessons:</span>
                    <strong className="text-slate-900 font-mono">
                      {lessonProgress?.completedCount || 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>In-Progress Lessons:</span>
                    <strong className="text-slate-900 font-mono">
                      {lessonProgress?.inProgressCount || 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Total Time Logged:</span>
                    <strong className="text-slate-900 font-mono">
                      {lessonProgress?.totalMinutesSpent || 0} mins
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" /> Attendance Ledger
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span>Present Sessions:</span>
                    <strong className="text-emerald-700 font-mono">
                      {attendance?.present || 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Late Sessions:</span>
                    <strong className="text-amber-700 font-mono">{attendance?.late || 0}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Absent Sessions:</span>
                    <strong className="text-rose-700 font-mono">{attendance?.absent || 0}</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span>Overall Attendance:</span>
                    <span className="text-blue-600">{attendance?.rate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBMISSIONS & GRADES */}
          {activeDossierTab === 'submissions' && (
            <div className="space-y-6">
              {/* Assignment Submissions */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Assignment Submissions & Rubric
                  Scores
                </h3>
                {assignmentSubmissions && assignmentSubmissions.length > 0 ? (
                  <div className="space-y-2">
                    {assignmentSubmissions.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 text-xs">
                            {sub.assignment?.title || 'Assignment'}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              sub.grade !== null && sub.grade !== undefined
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.grade !== null && sub.grade !== undefined
                              ? `Score: ${sub.grade}%`
                              : 'Pending Grading'}
                          </span>
                        </div>
                        {sub.feedback && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <strong>Feedback:</strong> {sub.feedback}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No assignment submissions logged.
                  </p>
                )}
              </div>

              {/* Capstone Projects */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" /> Capstone Project Evidence
                </h3>
                {projects && projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {projects.map((proj: any) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-slate-900 text-xs">{proj.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {proj.description || 'Hands-on practical capstone project.'}
                        </p>
                        <div className="flex items-center gap-3 pt-2 text-[11px]">
                          {proj.githubUrl && (
                            <a
                              href={proj.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> GitHub Repo
                            </a>
                          )}
                          {proj.liveDemoUrl && (
                            <a
                              href={proj.liveDemoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No project submissions logged.
                  </p>
                )}
              </div>

              {/* Earned Certificates */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" /> Issued Credentials & Certificates
                </h3>
                {certificates && certificates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {certificates.map((cert: any) => (
                      <div
                        key={cert.id}
                        className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1"
                      >
                        <p className="font-bold text-emerald-950 text-xs">{cert.title}</p>
                        <p className="text-[10px] text-emerald-700 font-mono">
                          Cert No: {cert.certificateNumber}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Issued on {new Date(cert.createdAt || cert.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No issued certificates yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TUITION & CLEARANCE */}
          {activeDossierTab === 'finance' && (
            <div className="space-y-6">
              {/* Clearance Status Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Financial Clearance Status</h4>
                  <p className="text-[11px] text-slate-500">
                    Required for official graduation, credential issuance, and class seat locking.
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                    clearances?.[0]?.status === 'CLEARED'
                      ? 'bg-emerald-600 text-white'
                      : clearances?.[0]?.status === 'WAIVED'
                      ? 'bg-purple-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {clearances?.[0]?.status || 'PENDING'}
                </span>
              </div>

              {/* Invoices List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">Billing Invoices</h4>
                {invoices && invoices.length > 0 ? (
                  <div className="space-y-2">
                    {invoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            {inv.invoiceNumber} — {inv.description || 'Program Tuition'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Due:{' '}
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Upon receipt'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900 text-xs">
                            ₦{Number(inv.amount).toLocaleString()}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No invoices generated for this student.
                  </p>
                )}
              </div>

              {/* Payments History */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">Verified Payments Ledger</h4>
                {payments && payments.length > 0 ? (
                  <div className="space-y-2">
                    {payments.map((pmt: any) => (
                      <div
                        key={pmt.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            Ref: {pmt.reference || pmt.id.slice(0, 8)} • Channel:{' '}
                            <span className="uppercase">{pmt.channel}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Paid on {new Date(pmt.paidAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-mono font-black text-emerald-700 text-xs">
                          +₦{Number(pmt.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No payment transactions recorded.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACCESS & ACTIVITY */}
          {activeDossierTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Recent Activity & Sign-In History
              </h3>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {log.action} <span className="font-normal text-slate-500">• {log.resource}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          IP: {log.ipAddress || 'Internal'}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                  No audit log activity found for this account.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-mono">
            Dossier UUID: {user.id}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MAIN USER DIRECTORY & 360° HUB COMPONENT
// -------------------------------------------------------------
export const Directory360Manager: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // User list state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & controls
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Dossier modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch directory stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.getDirectoryStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load directory stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getDirectoryUsers({
        search: searchQuery || undefined,
        role: roleFilter,
        cohortId: cohortFilter,
        paymentStatus: paymentFilter,
        page,
        pageSize: 18,
      });
      setUsers(res.users || []);
      setTotalCount(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load directory users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(debounceTimer);
  }, [roleFilter, cohortFilter, paymentFilter, searchQuery, page]);

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Learners & Community Directory
          </h1>
          <p className="text-xs text-slate-500">
            360° centralized dossier for all registered applicants, students, parents, guardians, and faculty.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
          <button
            onClick={() => {
              fetchStats();
              fetchUsers();
            }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC & ANALYTICS BANNER */}
      {loadingStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-4">
          {/* Row 1: Login Activity & Online Status */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm space-y-1">
              <div className="flex items-center justify-between text-blue-200">
                <span className="text-[10px] font-bold uppercase tracking-wide">Total Students</span>
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black">{stats.summary?.totalStudents || 0}</p>
              <p className="text-[10px] text-blue-200">
                {stats.summary?.totalUsers || 0} Total Registered Users
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[10px] font-bold uppercase tracking-wide">Live Online</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {stats.loginMetrics?.currentlyOnline || 0}
              </p>
              <p className="text-[10px] text-slate-400">Active in last 15 mins</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-[10px] font-bold uppercase tracking-wide">Daily Logins</span>
                <Activity className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.loginMetrics?.daily || 0}</p>
              <p className="text-[10px] text-slate-400">Past 24 hours</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-indigo-600">
                <span className="text-[10px] font-bold uppercase tracking-wide">Weekly Logins</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.loginMetrics?.weekly || 0}</p>
              <p className="text-[10px] text-slate-400">Past 7 days</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-purple-600">
                <span className="text-[10px] font-bold uppercase tracking-wide">Monthly</span>
                <Calendar className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.loginMetrics?.monthly || 0}</p>
              <p className="text-[10px] text-slate-400">Past 30 days</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-[10px] font-bold uppercase tracking-wide">Yearly Logins</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stats.loginMetrics?.yearly || 0}</p>
              <p className="text-[10px] text-slate-400">Past 365 days</p>
            </div>
          </div>

          {/* Row 2: Cohorts Distribution & Financial Clearance Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cohort Distribution */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Active vs Past Cohorts Enrollment
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-700">Active Cohorts</span>
                  <p className="text-xl font-black text-blue-950 mt-1">
                    {stats.cohortEnrollment?.activeStudents || 0}{' '}
                    <span className="text-xs font-normal text-blue-700">students</span>
                  </p>
                  <p className="text-[10px] text-blue-600">
                    Across {stats.cohortEnrollment?.activeCohortsCount || 0} active batches
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-600">Past Cohorts</span>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {stats.cohortEnrollment?.pastStudents || 0}{' '}
                    <span className="text-xs font-normal text-slate-500">graduated</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Across {stats.cohortEnrollment?.pastCohortsCount || 0} concluded cohorts
                  </p>
                </div>
              </div>
            </div>

            {/* Active Cohorts Payment Clearance Breakdown */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Active Cohorts Tuition Clearance
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Collected: ₦{(stats.paymentBreakdown?.totalCollected || 0).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] font-black text-emerald-800 block">Fully Paid</span>
                  <p className="text-lg font-black text-emerald-950 mt-0.5">
                    {stats.paymentBreakdown?.fullyPaid || 0}
                  </p>
                  <span className="text-[9px] text-emerald-600">Cleared 100%</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] font-black text-amber-800 block">Partial Paid</span>
                  <p className="text-lg font-black text-amber-950 mt-0.5">
                    {stats.paymentBreakdown?.partiallyPaid || 0}
                  </p>
                  <span className="text-[9px] text-amber-600">Installments</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <span className="text-[10px] font-black text-rose-800 block">Unpaid</span>
                  <p className="text-lg font-black text-rose-950 mt-0.5">
                    {stats.paymentBreakdown?.unpaid || 0}
                  </p>
                  <span className="text-[9px] text-rose-600">Outstanding</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, phone, ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-300"
            >
              <option value="ALL">All Roles ({stats?.summary?.totalUsers || 'All'})</option>
              <option value="STUDENT">Students ({stats?.summary?.totalStudents || 0})</option>
              <option value="APPLICANT">Applicants ({stats?.summary?.totalApplicants || 0})</option>
              <option value="PARENT">Parents & Guardians ({stats?.summary?.totalParents || 0})</option>
              <option value="INSTRUCTOR">Instructors ({stats?.summary?.totalInstructors || 0})</option>
            </select>
          </div>

          {/* Cohort Filter */}
          <div>
            <select
              value={cohortFilter}
              onChange={(e) => {
                setCohortFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-300"
            >
              <option value="ALL">All Cohorts / Batches</option>
              {stats?.activeCohorts?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.enrolledCount} enrolled)
                </option>
              ))}
            </select>
          </div>

          {/* Payment Clearance Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-300"
            >
              <option value="ALL">All Tuition Statuses</option>
              <option value="FULLY_PAID">Fully Paid (Cleared)</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid (Outstanding)</option>
            </select>
          </div>
        </div>

        {/* Results Count Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Found <strong>{totalCount}</strong> matching community members
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <span className="text-[11px] font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* USER LIST OR GRID */}
      {loadingUsers ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading Directory Members...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No members match your search criteria.</p>
          <p className="text-xs text-slate-400">
            Try adjusting your search terms or clearing the selected role/cohort filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((item: any) => {
            const roleBadgeColor = {
              STUDENT: 'bg-blue-100 text-blue-800',
              APPLICANT: 'bg-purple-100 text-purple-800',
              PARENT: 'bg-emerald-100 text-emerald-800',
              INSTRUCTOR: 'bg-amber-100 text-amber-800',
              SUPER_ADMIN: 'bg-rose-100 text-rose-800',
            }[item.role as string] || 'bg-slate-100 text-slate-700';

            const paymentBadge = item.paymentStatus ? (
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  item.paymentStatus === 'FULLY_PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {item.paymentStatus.replace('_', ' ')}
              </span>
            ) : null;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top user header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 shrink-0 text-sm">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.firstName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-sm truncate">
                          {item.firstName} {item.lastName}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">{item.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${roleBadgeColor}`}
                    >
                      {item.role}
                    </span>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paymentBadge}
                    {item.studentId && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        ID: {item.studentId}
                      </span>
                    )}
                    {item.linkedWardsCount !== undefined && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {item.linkedWardsCount} Ward(s)
                      </span>
                    )}
                  </div>

                  {/* Cohort & Guardian Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    {item.cohortName && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">
                          Cohort: <strong>{item.cohortName}</strong>
                        </span>
                      </div>
                    )}
                    {item.guardianName && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">
                          Guardian: <strong>{item.guardianName}</strong>
                        </span>
                      </div>
                    )}
                    {item.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {item.lastLogin
                      ? `Active ${new Date(item.lastLogin).toLocaleDateString()}`
                      : 'Never logged in'}
                  </span>
                  <button
                    onClick={() => setSelectedUserId(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> 360° Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Learner / User</th>
                  <th className="p-3.5">Role & Student ID</th>
                  <th className="p-3.5">Enrolled Cohort</th>
                  <th className="p-3.5">Tuition Status</th>
                  <th className="p-3.5">Linked Parent / Wards</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {`${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {item.firstName} {item.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700">
                          {item.role}
                        </span>
                        {item.studentId && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.studentId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {item.cohortName ? (
                        <div>
                          <p className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                            {item.cohortName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.levelCode || 'Foundation'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.paymentStatus ? (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            item.paymentStatus === 'FULLY_PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.paymentStatus.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.guardianName ? (
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.guardianName}</p>
                          <p className="text-[10px] text-slate-400">{item.guardianPhone || '—'}</p>
                        </div>
                      ) : item.linkedWardsCount !== undefined ? (
                        <span className="text-[10px] font-bold text-purple-700">
                          {item.linkedWardsCount} Linked Ward(s)
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-500">
                      {item.lastLogin
                        ? new Date(item.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedUserId(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                      >
                        360° Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360° PROFILE DOSSIER MODAL */}
      {selectedUserId && (
        <Learner360Modal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};
