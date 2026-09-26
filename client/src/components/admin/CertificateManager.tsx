import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Award,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  FileCheck,
  UserCheck,
  ChevronRight,
  BookOpen,
  Calendar,
  Percent,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface CertificateManagerProps {
  certificates: any[];
  students: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const CertificateManager: React.FC<CertificateManagerProps> = ({
  certificates,
  students,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [selectedStudentForReadiness, setSelectedStudentForReadiness] = useState<string>('');
  const [readinessReport, setReadinessReport] = useState<any | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  // Form states for issuance
  const [issueStudentId, setIssueStudentId] = useState('');
  const [issueProgramName, setIssueProgramName] = useState('');
  const [issueCertType, setIssueCertType] = useState('PROFESSIONAL');
  const [issueAchievement, setIssueAchievement] = useState('Successfully completed practical curriculum with high merit');
  const [issuing, setIssuing] = useState(false);
  const [issueSuccessMessage, setIssueSuccessMessage] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.verificationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.programName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || cert.certificateType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEvaluateReadiness = async (studentId: string) => {
    if (!studentId) return;
    setLoadingReadiness(true);
    setReadinessError(null);
    setReadinessReport(null);
    try {
      const res = await api.getCompletionReadiness(studentId);
      if (res && res.report) {
        setReadinessReport(res.report);
      } else {
        setReadinessReport(res);
      }
    } catch (err: any) {
      setReadinessError(err.message || 'Failed to evaluate student completion readiness.');
    } finally {
      setLoadingReadiness(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueStudentId) {
      setIssueError('Please select or specify a student.');
      return;
    }
    setIssuing(true);
    setIssueError(null);
    setIssueSuccessMessage(null);
    try {
      const payload = {
        studentId: issueStudentId,
        programName: issueProgramName.trim() || 'Advanced STEM Specialization',
        certificateType: issueCertType,
        achievement: issueAchievement.trim(),
      };
      const res = await api.issueCertificate(payload);
      setIssueSuccessMessage(
        `Certificate ${res.certificate?.certificateNumber || 'successfully issued'}! Notification email enqueued.`
      );
      onRefresh();
      setTimeout(() => {
        setShowIssueModal(false);
        setIssueSuccessMessage(null);
        setIssueStudentId('');
        setIssueProgramName('');
      }, 2000);
    } catch (err: any) {
      setIssueError(err.message || 'Failed to issue certificate.');
    } finally {
      setIssuing(false);
    }
  };

  const openIssueFromReadiness = (report: any) => {
    setIssueStudentId(report.studentId);
    setIssueProgramName(report.programName || '');
    setShowReadinessModal(false);
    setShowIssueModal(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Metric Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Institutional Certification & Graduation Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative registry of STEMPACT credential issuance and student completion readiness evaluation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReadinessModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700/80 hover:border-brand-500/50 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <UserCheck className="w-4 h-4 text-brand-400" />
            Evaluate Completion Readiness
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Issue Certificate
          </button>
          <button
            onClick={onRefresh}
            title="Refresh Registry"
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Issued</span>
            <Award className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{certificates.length}</div>
          <div className="text-xs text-slate-500 mt-1">Verified credential records</div>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verification Active</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">100%</div>
          <div className="text-xs text-slate-500 mt-1">Directly queryable via public registry</div>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enrolled Candidates</span>
            <GraduationCap className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-300 mt-2">{students.length}</div>
          <div className="text-xs text-slate-500 mt-1">Eligible for completion assessment</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search certificate #, student, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-400 whitespace-nowrap">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Types</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="COMPLETION">Completion</option>
            <option value="HONORARY">Honorary</option>
            <option value="EXCELLENCE">Excellence</option>
          </select>
        </div>
      </div>

      {/* Certificates Registry Table */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-4 px-6">Certificate Reference</th>
                <th className="py-4 px-6">Graduate Student</th>
                <th className="py-4 px-6">Program & Specialization</th>
                <th className="py-4 px-6">Credential Type</th>
                <th className="py-4 px-6">Issue Date</th>
                <th className="py-4 px-6">Registry Status</th>
                <th className="py-4 px-6 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Award className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                    No certificate records found matching the current search parameters.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-white tracking-wider flex items-center gap-2">
                        <span>{cert.certificateNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Code: {cert.verificationCode}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{cert.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {cert.student?.studentIdNumber || cert.student?.id?.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">{cert.programName}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{cert.achievement}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        {cert.certificateType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={`/verify/${cert.certificateNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-semibold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Public Verification
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completion Readiness Evaluation Modal */}
      {showReadinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Student Completion Readiness Evaluator</h3>
                  <p className="text-xs text-slate-400">
                    Queries authoritative academic metrics and evaluates against institutional policy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReadinessModal(false);
                  setReadinessReport(null);
                  setSelectedStudentForReadiness('');
                }}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Student Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Select Enrolled Student Profile:</label>
              <div className="flex gap-2">
                <select
                  value={selectedStudentForReadiness}
                  onChange={(e) => {
                    setSelectedStudentForReadiness(e.target.value);
                    if (e.target.value) handleEvaluateReadiness(e.target.value);
                  }}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose a student to evaluate --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.user ? `${st.user.firstName} ${st.user.lastName}` : st.id} ({st.studentIdNumber || 'No ID Number'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedStudentForReadiness || loadingReadiness}
                  onClick={() => handleEvaluateReadiness(selectedStudentForReadiness)}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                >
                  {loadingReadiness ? 'Evaluating...' : 'Query Metrics'}
                </button>
              </div>
            </div>

            {readinessError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{readinessError}</span>
              </div>
            )}

            {readinessReport && (
              <div className="space-y-6 border-t border-white/5 pt-4">
                {/* Academic Context Card */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{readinessReport.fullName}</h4>
                      <p className="text-xs text-slate-400">
                        ID: <span className="font-mono text-slate-200">{readinessReport.studentIdNumber || 'N/A'}</span> • Cohort: <span className="text-brand-300 font-semibold">{readinessReport.cohortCode}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-300">{readinessReport.programName}</span>
                    </div>
                  </div>
                </div>

                {/* Factual Academic Evidence Grid */}
                {readinessReport.academicEvidence && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                      Authoritative Academic Evidence
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                          <span>Attendance</span>
                          <Percent className="w-3.5 h-3.5 text-brand-400" />
                        </div>
                        <div className="text-lg font-bold text-white">
                          {readinessReport.academicEvidence.attendanceRate ?? 0}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {readinessReport.academicEvidence.attendedSessions} / {readinessReport.academicEvidence.totalCohortSessions} sessions
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                          <span>Syllabus Progress</span>
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="text-lg font-bold text-white">
                          {readinessReport.academicEvidence.lessonCompletionRate ?? 0}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {readinessReport.academicEvidence.completedLessons} / {readinessReport.academicEvidence.totalLessons} lessons
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                          <span>Assignments</span>
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-lg font-bold text-white">
                          {readinessReport.academicEvidence.averageAssignmentGrade !== null
                            ? `${readinessReport.academicEvidence.averageAssignmentGrade}%`
                            : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {readinessReport.academicEvidence.completedAssignments} / {readinessReport.academicEvidence.totalAssignments} completed
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                          <span>Competencies</span>
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-lg font-bold text-white">
                          {readinessReport.academicEvidence.competencyAchievementRate ?? 0}%
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {readinessReport.academicEvidence.achievedCompetencies} / {readinessReport.academicEvidence.totalCompetencies} acquired
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Institutional Policy & Evaluation Card */}
                <div className="bg-slate-950/90 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Policy Evaluation Status:</span>
                    {readinessReport.evaluation?.status === 'POLICY_PENDING' ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        POLICY PENDING
                      </span>
                    ) : readinessReport.evaluation?.status === 'EVALUATED_ELIGIBLE' ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        ELIGIBLE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-red-500/10 border border-red-500/20 text-red-400">
                        DEFICITS IDENTIFIED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {readinessReport.evaluation?.summary ||
                      'Institutional completion criteria are pending official STEMPACT management definition. Factual academic metrics are presented for administrative evaluation.'}
                  </p>

                  {readinessReport.evaluation?.status === 'POLICY_PENDING' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400/90 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Institutional Notice:</strong> Formal completion readiness criteria are pending official management definition. Factual academic metrics do not confer automatic certificate eligibility. Issuance remains subject to authoritative backend validation and administrative approval.
                      </span>
                    </div>
                  )}

                  {readinessReport.evaluation?.deficits && readinessReport.evaluation.deficits.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {readinessReport.evaluation.deficits.map((def: string, idx: number) => (
                        <div key={idx} className="text-xs text-amber-400 flex items-center gap-1.5">
                          <span>•</span>
                          <span>{def}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action to Open Issuance Form */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openIssueFromReadiness(readinessReport)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-brand-500/20"
                  >
                    <Award className="w-4 h-4" />
                    Open Certificate Issuance Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Issue Official Certificate</h3>
                  <p className="text-xs text-slate-400">
                    Generates canonical certificate number, verification code, and dispatches email.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueError(null);
                  setIssueSuccessMessage(null);
                }}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            {issueSuccessMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{issueSuccessMessage}</span>
              </div>
            )}

            {issueError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <form onSubmit={handleIssueCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Student Candidate</label>
                <select
                  value={issueStudentId}
                  onChange={(e) => {
                    setIssueStudentId(e.target.value);
                    const matched = students.find((s) => s.id === e.target.value);
                    if (matched?.cohort?.program?.name && !issueProgramName) {
                      setIssueProgramName(matched.cohort.program.name);
                    }
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  <option value="">-- Select Student Candidate --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.user ? `${st.user.firstName} ${st.user.lastName}` : st.id} ({st.studentIdNumber || 'No ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Program / Specialization Title</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack & Cloud Systems Engineering"
                  value={issueProgramName}
                  onChange={(e) => setIssueProgramName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Certificate Type</label>
                <select
                  value={issueCertType}
                  onChange={(e) => setIssueCertType(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="PROFESSIONAL">PROFESSIONAL</option>
                  <option value="COMPLETION">COMPLETION</option>
                  <option value="HONORARY">HONORARY</option>
                  <option value="EXCELLENCE">EXCELLENCE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Achievement Description</label>
                <textarea
                  rows={3}
                  value={issueAchievement}
                  onChange={(e) => setIssueAchievement(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-semibold transition shadow-lg shadow-brand-500/20"
                >
                  {issuing ? 'Issuing Certificate...' : 'Confirm & Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
