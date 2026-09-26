import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { PortalLayout } from '../../components/PortalLayout';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  CreditCard,
  Bell,
  User,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  Send,
  MessageSquare,
  Building,
  Upload,
  X,
  Sparkles,
  Play,
  ChevronRight,
  ChevronLeft,
  FolderGit2,
  ExternalLink,
  GraduationCap,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Download,
} from 'lucide-react';
import { StudentCopilotModal } from '../../components/StudentCopilotModal';

export const StudentDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFromUrl = searchParams.get('tab') || 'overview';

  const [data, setData] = useState<any>(null);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [completionReport, setCompletionReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState<boolean>(false);
  const [loadingCompletion, setLoadingCompletion] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>(currentTabFromUrl);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Lesson Player State
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>('');
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string>('');
  const [completingLesson, setCompletingLesson] = useState<boolean>(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // Assignment Work Submission Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [submissionAttachment, setSubmissionAttachment] = useState<string>('');
  const [submittingWork, setSubmittingWork] = useState<boolean>(false);

  // Project Evidence Modal State
  const [selectedProjectForEvidence, setSelectedProjectForEvidence] = useState<any | null>(null);
  const [projectGithubUrl, setProjectGithubUrl] = useState<string>('');
  const [projectLiveUrl, setProjectLiveUrl] = useState<string>('');
  const [savingEvidence, setSavingEvidence] = useState<boolean>(false);

  // Payment Checkout Modal State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'>('PAYSTACK');
  const [senderBank, setSenderBank] = useState<string>('Access Bank');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [tellerProofUrl, setTellerProofUrl] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);

  // AI Copilot Modal
  const [showCopilot, setShowCopilot] = useState<boolean>(false);

  // Synchronize Tab with URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load Main Student Dashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentDashboard();
      setData(res.dashboard);

      // If user returned from gateway with pending payment flag
      if (searchParams.get('payment') === 'pending') {
        setActionSuccess('Payment verification is pending. Your financial clearance will update after the payment is verified by STEMPACT Academy.');
      }
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      setActionError(err.message || 'Failed to load student learning file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Lazy Load Curriculum when tab opens
  useEffect(() => {
    if (activeTab === 'curriculum' && !curriculumData) {
      const fetchCurriculum = async () => {
        setLoadingCurriculum(true);
        try {
          const res = await api.getStudentCurriculum();
          setCurriculumData(res);
        } catch (err: any) {
          console.error('Failed to load curriculum:', err);
        } finally {
          setLoadingCurriculum(false);
        }
      };
      fetchCurriculum();
    }
  }, [activeTab, curriculumData]);

  // Lazy Load Completion Readiness when tab opens
  useEffect(() => {
    if (activeTab === 'completion' && !completionReport) {
      const fetchCompletion = async () => {
        setLoadingCompletion(true);
        try {
          const res = await api.getCompletionReadiness();
          setCompletionReport(res.report);
        } catch (err: any) {
          console.error('Failed to load completion report:', err);
        } finally {
          setLoadingCompletion(false);
        }
      };
      fetchCompletion();
    }
  }, [activeTab, completionReport]);

  // Lesson Completion Action
  const handleRecordLessonProgress = async (lessonId: string) => {
    setCompletingLesson(true);
    setActionError('');
    try {
      await api.recordLessonProgress(lessonId, {
        status: 'COMPLETED',
        timeSpentMinutes: 30,
        notes: 'Completed in focused lesson player',
      });
      setCompletedLessonIds((prev) => new Set(prev).add(lessonId));
      setActionSuccess('Lesson marked as completed! Learning progress updated.');
      // Refresh dashboard metrics
      const res = await api.getStudentDashboard();
      setData(res.dashboard);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record lesson progress.');
    } finally {
      setCompletingLesson(false);
    }
  };

  // Submit Assignment Action
  const handleSubmitAssignmentWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionContent.trim()) return;
    setSubmittingWork(true);
    setActionError('');
    try {
      await api.submitAssignment({
        assignmentId: selectedAssignment.id,
        content: submissionContent,
        attachmentUrl: submissionAttachment || undefined,
      });
      setActionSuccess('Assignment submitted to faculty review successfully!');
      setSelectedAssignment(null);
      setSubmissionContent('');
      setSubmissionAttachment('');
      // Reload dashboard submissions
      const res = await api.getStudentDashboard();
      setData(res.dashboard);
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit assignment.');
    } finally {
      setSubmittingWork(false);
    }
  };

  // Update Project Evidence Action
  const handleSaveProjectEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForEvidence) return;
    setSavingEvidence(true);
    setActionError('');
    try {
      await api.updateProjectEvidence(selectedProjectForEvidence.id, {
        githubUrl: projectGithubUrl,
        liveDemoUrl: projectLiveUrl,
      });
      setActionSuccess('Project evidence and repositories updated successfully!');
      setSelectedProjectForEvidence(null);
      // Reload dashboard projects
      const res = await api.getStudentDashboard();
      setData(res.dashboard);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update project evidence.');
    } finally {
      setSavingEvidence(false);
    }
  };

  // Online Payment Initiation (No Client-Side Mutation)
  const handleInitiatePayment = async () => {
    if (!selectedInvoiceForPayment) return;
    setPaymentProcessing(true);
    setActionError('');
    try {
      if (paymentMethod === 'BANK_TRANSFER') {
        await api.submitBankTransfer({
          invoiceId: selectedInvoiceForPayment.id,
          amount: paymentAmount,
          senderBank: senderBank || 'Access Bank',
          senderAccount: senderAccount || '0123456789',
          proofUrl: tellerProofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
          payerName: data?.profile?.fullName,
          payerEmail: user?.email,
        });
        setSelectedInvoiceForPayment(null);
        setActionSuccess('Payment verification is pending. Your financial clearance will update after the payment is verified by STEMPACT Academy.');
      } else {
        const res = await api.initializePayment({
          invoiceId: selectedInvoiceForPayment.id,
          amount: paymentAmount,
          channel: paymentMethod,
          callbackUrl: `${window.location.origin}/portal/student?tab=finance&payment=pending`,
        });
        setSelectedInvoiceForPayment(null);
        if (res.authorizationUrl) {
          window.open(res.authorizationUrl, '_blank');
        }
        setActionSuccess('Payment verification is pending. Your financial clearance will update after the payment is verified by STEMPACT Academy.');
      }
      const refreshed = await api.getStudentDashboard();
      setData(refreshed.dashboard);
    } catch (err: any) {
      setActionError(err.message || 'Payment initiation failed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Student Portal & Learning Ledger..." />;

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Student Profile Not Linked</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your account does not currently have an active, matriculated student enrollment. If you recently applied, check your candidate admissions portal.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/portal/applicant" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
            Go to Applicant Portal
          </Link>
          <Link to="/apply" className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            Start Application
          </Link>
        </div>
      </div>
    );
  }

  const {
    profile,
    cohort,
    program,
    metrics,
    attendances,
    assignments,
    submissions,
    invoices,
    certificates,
    competencies,
    projects,
    announcements,
  } = data;

  const coursesList = curriculumData?.courses || data.curriculum?.courses || [];

  return (
    <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Student Institutional Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
              {profile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-700/60">
                  ID: {profile.studentIdNumber}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  ACTIVE LEARNER
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {profile.fullName}
              </h1>
              <p className="text-xs text-slate-300">
                {program?.name || 'Academic Specialization'} • Cohort: <strong>{cohort?.cohortCode || cohort?.name}</strong> • Level: <strong>{profile.currentLevel}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              type="button"
              onClick={() => setShowCopilot(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Ask AI Copilot</span>
            </button>
            {cohort?.whatsappGroupUrl && (
              <a
                href={cohort.whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Class Community</span>
              </a>
            )}
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {actionSuccess && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-bold p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-rose-700 hover:text-rose-900 font-bold p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Learning Workflow Metrics Grid: Today -> Learning -> Practice -> Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Syllabus Progress</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics?.progressPercentage || 0}%
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.progressPercentage || 0}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Attendance Rate</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics?.attendanceRate || 100}%
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.attendanceRate || 100}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Lessons Mastered</span>
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics?.completedLessonsCount || 0} / {metrics?.totalLessonsCount || 0}
            </div>
            <div className="text-[11px] text-slate-400">Curriculum Units</div>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Competencies Verified</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics?.achievedCompetenciesCount || 0} / {metrics?.totalCompetenciesCount || 0}
            </div>
            <div className="text-[11px] text-slate-400">Industry Skills</div>
          </Card>
        </div>

        {/* Tab Navigation Chips */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          {[
            { id: 'overview', name: 'Today & Overview' },
            { id: 'curriculum', name: 'Curriculum & Lessons' },
            { id: 'assignments', name: 'Assignments & Submissions' },
            { id: 'projects', name: 'Practical Projects' },
            { id: 'competencies', name: 'Competencies' },
            { id: 'attendance', name: 'Attendance Register' },
            { id: 'finance', name: 'Tuition & Clearance' },
            { id: 'completion', name: 'Completion & Readiness' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Cohort Card */}
              <Card className="p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Enrolled Academic Cohort
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {cohort?.name}
                    </h3>
                  </div>
                  <Badge variant="blue">{cohort?.status}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong className="text-slate-700 block">Class Schedule:</strong>
                    <span className="text-slate-600">{cohort?.schedule}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Location / Lab Hub:</strong>
                    <span className="text-slate-600">{cohort?.location || 'Ile-Ife Campus'}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Lead Faculty Instructor:</strong>
                    <span className="text-slate-600">{cohort?.instructorName || 'Assigned Lead'}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Delivery Mode:</strong>
                    <span className="text-slate-600">{cohort?.mode || 'Hybrid In-Person'}</span>
                  </div>
                </div>
              </Card>

              {/* Class Timetable Sessions */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Upcoming Class Sessions</span>
                  </h3>
                  <span className="text-xs text-blue-600 font-semibold">Cohort Timetable</span>
                </div>

                <div className="space-y-3">
                  {cohort?.classSessions && cohort.classSessions.length > 0 ? (
                    cohort.classSessions.slice(0, 4).map((s: any) => (
                      <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{s.title}</span>
                          <span className="text-slate-500 font-medium">
                            {s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBA'} • {s.startTime || ''} - {s.endTime || ''}
                          </span>
                        </div>
                        <p className="text-slate-600">{s.topic}</p>
                        <div className="text-[11px] text-blue-600 font-semibold">{s.room || 'Main Lab'}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">No upcoming class sessions scheduled yet.</p>
                  )}
                </div>
              </Card>

              {/* Pending Assignments Quick Action */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Assignments Awaiting Submission</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleTabChange('assignments')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {assignments && assignments.filter((a: any) => !submissions.some((s: any) => s.assignmentId === a.id)).length > 0 ? (
                    assignments
                      .filter((a: any) => !submissions.some((s: any) => s.assignmentId === a.id))
                      .slice(0, 3)
                      .map((ass: any) => (
                        <div key={ass.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{ass.title}</span>
                            <span className="text-[11px] text-slate-500">
                              Due: {ass.dueDate ? new Date(ass.dueDate).toLocaleDateString('en-GB') : 'TBA'} • {ass.maxPoints} pts
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssignment(ass);
                              handleTabChange('assignments');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px]"
                          >
                            Submit
                          </button>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs text-center font-medium">
                      All assignments up to date! Great job maintaining pacing.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Announcements & Learning Resources */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-500" />
                  <span>Academy Announcements</span>
                </h3>
                <div className="space-y-3">
                  {announcements && announcements.length > 0 ? (
                    announcements.map((ann: any) => (
                      <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="font-bold text-slate-900">{ann.title}</div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
                        <div className="text-[10px] text-slate-400">
                          {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('en-GB') : ''}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">No active announcements.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6 space-y-3">
                <h3 className="font-bold text-sm text-slate-900">Learning Toolkit</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">STEMPACT LMS Terminal</span>
                    <Badge variant="blue">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">GitHub Code Repositories</span>
                    <Badge variant="green">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Ile-Ife Practical Hardware Lab</span>
                    <Badge variant="purple">Equipped</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE RELATIONAL CURRICULUM & FOCUSED LESSON PLAYER */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Curriculum & Coursework</h2>
                <p className="text-xs text-slate-500">
                  Version-anchored academic syllabus. Click any lesson to launch the focused lesson player.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Curriculum Version: <strong>{data?.curriculum?.versionNumber || 1}</strong>
              </div>
            </div>

            {loadingCurriculum ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading curriculum modules and practical activities...
              </div>
            ) : coursesList.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-xs">
                No active courses mapped to this curriculum version yet.
              </Card>
            ) : (
              <div className="space-y-6">
                {coursesList.map((course: any) => (
                  <Card key={course.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-600">{course.code}</span>
                        <h3 className="font-bold text-base text-slate-900">{course.title}</h3>
                      </div>
                      <Badge variant="blue">{course.credits || 3} Credits</Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>

                    {/* Modules List */}
                    <div className="space-y-3 pt-2">
                      {(course.modules || []).map((mod: any, mIdx: number) => (
                        <div key={mod.id || mIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Module {mIdx + 1}
                              </span>
                              <h4 className="font-bold text-xs text-slate-900">{mod.title}</h4>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {mod.durationHours || 4} Hours
                            </span>
                          </div>

                          {/* Lessons inside Module */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {(mod.lessons || []).map((lesson: any, lIdx: number) => {
                              const isCompleted = completedLessonIds.has(lesson.id) || lesson.progress?.status === 'COMPLETED';
                              return (
                                <button
                                  key={lesson.id || lIdx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedLesson(lesson);
                                    setSelectedCourseTitle(course.title);
                                    setSelectedModuleTitle(mod.title);
                                  }}
                                  className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all text-left flex items-center justify-between group cursor-pointer"
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <span className="text-[10px] text-slate-400 font-bold block">
                                      Lesson {lIdx + 1} • {lesson.durationMinutes || 45} mins
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                                      {lesson.title}
                                    </span>
                                  </div>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Play className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS & WORK */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assignments & Practical Submissions</h2>
                <p className="text-xs text-slate-500">
                  Submit code solutions, repository evidence, and review instructor grading feedback.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {assignments && assignments.length > 0 ? (
                assignments.map((ass: any) => {
                  const sub = submissions?.find((s: any) => s.assignmentId === ass.id);
                  return (
                    <Card key={ass.id} className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                        <div>
                          <span className="text-xs font-bold text-blue-600">Points: {ass.maxPoints} pts</span>
                          <h3 className="font-bold text-base text-slate-900">{ass.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Due: {ass.dueDate ? new Date(ass.dueDate).toLocaleDateString('en-GB') : 'TBA'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sub ? 'SUBMITTED' : 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{ass.description}</p>

                      {sub ? (
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                          <div className="flex items-center justify-between font-bold text-emerald-950">
                            <span>Submitted on {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB') : ''}</span>
                            {sub.grade !== null && (
                              <span className="text-sm font-black text-emerald-800">
                                Grade: {sub.grade} / {ass.maxPoints}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-emerald-100">
                            {sub.content}
                          </p>
                          {sub.feedback && (
                            <div className="pt-2 text-emerald-900 italic text-[11px]">
                              <strong>Faculty Feedback:</strong> "{sub.feedback}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedAssignment(ass)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Submit Work
                        </button>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No assignments posted for this cohort yet.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PRACTICAL ACTIVITIES & PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Practical Projects & Portfolio</h2>
                <p className="text-xs text-slate-500">
                  Industry-grade capstone challenges. Submit GitHub repositories and live deployments for evaluation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects && projects.length > 0 ? (
                projects.map((proj: any) => (
                  <Card key={proj.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        {proj.category || 'Practical Project'}
                      </span>
                      {proj.evaluationScore !== undefined && proj.evaluationScore !== null && (
                        <span className="text-xs font-black text-emerald-700">
                          Score: {proj.evaluationScore}/100
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{proj.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{proj.description}</p>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div><strong>Tools:</strong> {proj.tools || 'React, TypeScript, Git'}</div>
                      <div><strong>Skills:</strong> {proj.skills || 'Full-Stack Development'}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 font-semibold"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {proj.liveDemoUrl && (
                          <a
                            href={proj.liveDemoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectForEvidence(proj);
                          setProjectGithubUrl(proj.githubUrl || '');
                          setProjectLiveUrl(proj.liveDemoUrl || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        Update Evidence
                      </button>
                    </div>

                    {proj.feedback && (
                      <div className="p-3 rounded-lg bg-slate-50 text-[11px] text-slate-700 italic border border-slate-100">
                        <strong>Evaluation Feedback:</strong> "{proj.feedback}"
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="p-8 text-center text-slate-400 text-xs">
                    No active practical projects registered yet. Projects will populate as curriculum milestones advance.
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: COMPETENCIES */}
        {activeTab === 'competencies' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Verified Technical Competencies</h2>
              <p className="text-xs text-slate-500">
                Skills verified through coursework, project evaluations, and faculty assessments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {competencies && competencies.length > 0 ? (
                competencies.map((sc: any) => {
                  const comp = sc.competency || sc;
                  return (
                    <Card key={sc.id} className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                          {comp.category || 'Competency'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sc.status === 'ACQUIRED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sc.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : sc.status === 'NEEDS_PRACTICE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sc.status || 'IN_PROGRESS'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{comp.name || comp.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{comp.description}</p>

                      {sc.evidenceNotes && (
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                          Faculty Note: "{sc.evidenceNotes}"
                        </div>
                      )}
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <Card className="p-8 text-center text-slate-400 text-xs">
                    No competency evaluations logged yet. Complete module activities to trigger evaluations.
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Official Attendance Register</h2>
                <p className="text-xs text-slate-500">
                  Attendance is recorded per session by faculty mentors in accordance with institutional policy.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Attendance Rate</span>
                <div className="text-xl font-black text-emerald-600">{metrics?.attendanceRate || 100}%</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Class Session</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendances && attendances.length > 0 ? (
                    attendances.map((att: any) => (
                      <tr key={att.id}>
                        <td className="py-3 px-3 font-semibold">
                          {att.date ? new Date(att.date).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {att.classSession?.title || 'Class Session'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              att.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : att.status === 'LATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{att.remarks || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                        No attendance records logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 7: TUITION & FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tuition & Financial Schedule</h2>
              <p className="text-xs text-slate-500">
                View institutional tuition invoices, recorded payments, and submit bank transfer confirmations.
              </p>
            </div>

            <div className="space-y-4">
              {invoices && invoices.length > 0 ? (
                invoices.map((inv: any) => (
                  <Card key={inv.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-600">Ref: {inv.invoiceNumber}</span>
                        <h3 className="font-bold text-base text-slate-900">Cohort Tuition Schedule</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Total Tuition</span>
                        <strong className="text-slate-900 font-mono">₦{Number(inv.totalAmount).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Paid Amount</span>
                        <strong className="text-emerald-700 font-mono">₦{Number(inv.paidAmount || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Remaining Balance</span>
                        <strong className="text-blue-700 font-mono">
                          ₦{Number(inv.balance !== undefined ? inv.balance : inv.totalAmount - (inv.paidAmount || 0)).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Due Date</span>
                        <span className="text-slate-700 font-medium">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'Per Schedule'}
                        </span>
                      </div>
                    </div>

                    {inv.balance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceForPayment(inv);
                          setPaymentAmount(inv.balance);
                        }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Make Tuition Payment
                      </button>
                    )}
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No active invoices found for this student account.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: COMPLETION & READINESS (Configurable Policy Support) */}
        {activeTab === 'completion' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Graduation & Certificate Status</h2>
              <p className="text-xs text-slate-500">
                Official completion status evaluated by the Academic Board against ratified cohort graduation policies.
              </p>
            </div>

            {loadingCompletion ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Evaluating completion criteria against Academic Board policy...
              </div>
            ) : completionReport?.status === 'POLICY_PENDING' ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Completion Policy Pending Ratification</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-900">
                  The official graduation and certification criteria for this cohort version are currently awaiting final policy ratification by the Academic Board. Your academic progress (attendance, assignments, projects, and competencies) is actively tracked and will be evaluated automatically once the policy is published.
                </p>
              </div>
            ) : completionReport ? (
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Academic Completion Audit</h3>
                    <span className="text-xs text-slate-500">Official Graduation Evaluation</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    completionReport.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {completionReport.ready ? 'ELIGIBLE FOR GRADUATION' : 'CRITERIA IN PROGRESS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {Object.entries(completionReport.criteria || {}).map(([key, val]: any) => (
                    <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`font-bold ${val?.met ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {val?.met ? 'MET' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-6 space-y-3">
                <p className="text-xs text-slate-500">
                  Your graduation readiness report is processed automatically upon submission of all cohort coursework and practical milestones.
                </p>
              </Card>
            )}

            {/* Issued Certificates */}
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">Issued Institutional Certificates</h3>
              {certificates && certificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map((cert: any) => (
                    <Card key={cert.id} className="p-6 space-y-3 border-emerald-200">
                      <div className="flex items-center justify-between">
                        <Badge variant="green">Verified Credential</Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          {cert.certificateNumber}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{cert.title || program?.name}</h4>
                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to={`/verify/${cert.certificateNumber}`}
                          className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>Public Verification</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No graduation certificates issued yet. Certificates are emitted following final cohort completion and board approval.
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOCUSED LESSON PLAYER MODAL */}
      {selectedLesson && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  {selectedCourseTitle} • {selectedModuleTitle}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Instructional Content & Reading Brief:</span>
                </div>
                <p className="text-slate-600">
                  {selectedLesson.content || selectedLesson.summary || 'In this lesson, you will master baseline conceptual principles, review architectural patterns, and implement hands-on practical exercises guided by your faculty mentor.'}
                </p>
              </div>

              {selectedLesson.learningObjectives && (
                <div className="space-y-1.5">
                  <strong className="text-slate-900 block font-bold">Learning Objectives:</strong>
                  <p className="text-slate-600">{selectedLesson.learningObjectives}</p>
                </div>
              )}

              {selectedLesson.practicalActivity && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1.5">
                  <strong className="font-bold flex items-center gap-1.5">
                    <FolderGit2 className="w-4 h-4 text-blue-700" />
                    <span>Practical Activity & Deliverable:</span>
                  </strong>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    {selectedLesson.practicalActivity}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close Player
              </button>
              <button
                type="button"
                disabled={completingLesson || completedLessonIds.has(selectedLesson.id)}
                onClick={() => handleRecordLessonProgress(selectedLesson.id)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedLessonIds.has(selectedLesson.id)
                    ? 'Lesson Completed'
                    : completingLesson
                    ? 'Recording Progress...'
                    : 'Mark as Completed'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT SUBMISSION MODAL */}
      {selectedAssignment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Assignment Submission</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedAssignment.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignmentWork} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Your Submission / Solution Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste your solution text, architectural summary, or inline code notes..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Attachment / Repository URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/your-username/project-repo"
                  value={submissionAttachment}
                  onChange={(e) => setSubmissionAttachment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWork}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingWork ? 'Submitting Work...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT EVIDENCE MODAL */}
      {selectedProjectForEvidence && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Project Evidence</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedProjectForEvidence.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectForEvidence(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectEvidence} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">GitHub Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={projectGithubUrl}
                  onChange={(e) => setProjectGithubUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Live Demo / Deployment URL</label>
                <input
                  type="url"
                  placeholder="https://my-app.vercel.app"
                  value={projectLiveUrl}
                  onChange={(e) => setProjectLiveUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForEvidence(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvidence}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingEvidence ? 'Saving...' : 'Save Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TUITION PAYMENT CHECKOUT MODAL (No Simulation) */}
      {selectedInvoiceForPayment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Tuition Payment Checkout</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('PAYSTACK')}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === 'PAYSTACK'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Paystack
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('FLUTTERWAVE')}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === 'FLUTTERWAVE'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Flutterwave
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {paymentMethod === 'BANK_TRANSFER' ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">STEMPACT Academy Official Account:</div>
                  <div className="text-slate-600 font-mono">Bank: Access Bank Plc</div>
                  <div className="text-slate-600 font-mono">Account No: 1234567890</div>
                  <div className="text-slate-600">Account Name: STEMPACT Academy Ltd</div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Sending Bank *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GTBank, Zenith, Access"
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Account / Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0123456789 or Session ID"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={handleInitiatePayment}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paymentProcessing ? 'Submitting Transfer Proof...' : 'Submit Transfer Confirmation'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  You will be securely routed to {paymentMethod} to complete your tuition deposit of{' '}
                  <strong className="text-slate-900 font-mono">₦{paymentAmount.toLocaleString()}</strong>.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                  Payment verification remains pending until confirmed by the gateway webhook. Your financial clearance will update automatically once verified.
                </div>
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={handleInitiatePayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paymentProcessing ? 'Initializing Gateway...' : `Proceed to ${paymentMethod} Checkout`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI STUDENT COPILOT MODAL */}
      <StudentCopilotModal
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        programName={program?.name || 'STEMPACT Academy Program'}
      />
    </PortalLayout>
  );
};

export default StudentDashboardPage;
