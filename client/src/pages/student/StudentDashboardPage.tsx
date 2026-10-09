import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { PortalLayout } from '../../components/PortalLayout';
import { PageHeader } from '../../components/PageHeader';
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
  Coins,
  Copy,
  UploadCloud,
  Search,
  ChevronDown,
  Check,
  Plus,
  Maximize2,
  MapPin,
} from 'lucide-react';
import { StudentCopilotModal } from '../../components/StudentCopilotModal';
import { getVideoPlayerInfo } from '../../components/admin/ProgramDetailModal';

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
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);

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
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER' | 'CRYPTO'>('PAYSTACK');
  const [senderBank, setSenderBank] = useState<string>('Access Bank');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [tellerProofUrl, setTellerProofUrl] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [copiedBank, setCopiedBank] = useState<string>('');
  const [copiedCrypto, setCopiedCrypto] = useState<boolean>(false);
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  // AI Copilot Modal
  const [showCopilot, setShowCopilot] = useState<boolean>(false);

  // Progression Journey State
  const [progressionData, setProgressionData] = useState<any>(null);
  const [loadingProgression, setLoadingProgression] = useState(false);
  const [claimingProgression, setClaimingProgression] = useState(false);
  const [progressionCohortId, setProgressionCohortId] = useState('');

  // Project Video Evidence & New Capstone Submission State
  const [projectVideoUrl, setProjectVideoUrl] = useState<string>('');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState<boolean>(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    category: 'Software Engineering',
    description: '',
    youtubeVideoUrl: '',
    liveDemoUrl: '',
    githubUrl: '',
    skills: '',
    tools: '',
  });
  const [creatingProject, setCreatingProject] = useState<boolean>(false);

  // UoPeople-inspired Dual-Pane Curriculum Studio State
  const [curriculumSearch, setCurriculumSearch] = useState<string>('');
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());

  const coursesList = curriculumData?.courses || data?.curriculum?.courses || [];

  // Flattened lesson list for sequential UoPeople-style navigation
  const flatLessonsList = useMemo(() => {
    const list: any[] = [];
    coursesList.forEach((course: any) => {
      (course.modules || []).forEach((mod: any, mIdx: number) => {
        (mod.lessons || []).forEach((les: any, lIdx: number) => {
          list.push({
            ...les,
            courseTitle: course.title,
            courseCode: course.code,
            moduleTitle: mod.title,
            moduleId: mod.id || `mod-${mIdx}`,
            unitNumber: mIdx + 1,
            lessonNumber: lIdx + 1,
          });
        });
      });
    });
    return list;
  }, [coursesList]);

  // Current lesson sequential indices
  const currentLessonIndex = useMemo(() => {
    if (!selectedLesson) return -1;
    return flatLessonsList.findIndex((l: any) => l.id === selectedLesson.id);
  }, [selectedLesson, flatLessonsList]);

  const prevLesson = currentLessonIndex > 0 ? flatLessonsList[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < flatLessonsList.length - 1
      ? flatLessonsList[currentLessonIndex + 1]
      : null;

  // Auto-select first lesson when curriculum loads if none selected
  useEffect(() => {
    if (activeTab === 'curriculum' && !selectedLesson && flatLessonsList.length > 0) {
      const firstUncompleted = flatLessonsList.find(
        (l: any) => !completedLessonIds.has(l.id) && l.progress?.status !== 'COMPLETED'
      );
      const target = firstUncompleted || flatLessonsList[0];
      setSelectedLesson(target);
      setSelectedCourseTitle(target.courseTitle);
      setSelectedModuleTitle(target.moduleTitle);
      if (target.moduleId) {
        setExpandedUnitIds((prev) => new Set([...prev, target.moduleId]));
      }
    }
  }, [activeTab, flatLessonsList, selectedLesson, completedLessonIds]);

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

      // Load active payment gateways and transfer settings
      try {
        const paySettings = await api.getPublicPaymentSettings();
        setPaymentSettings(paySettings);
        if (paySettings?.channels) {
          if (paySettings.channels.paystack) {
            setPaymentMethod('PAYSTACK');
          } else if (paySettings.channels.bankTransfer) {
            setPaymentMethod('BANK_TRANSFER');
          } else if (paySettings.channels.crypto) {
            setPaymentMethod('CRYPTO');
          } else if (paySettings.channels.flutterwave) {
            setPaymentMethod('FLUTTERWAVE');
          }
        }
      } catch (pErr) {
        console.warn('Student public payment settings error:', pErr);
      }

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
    if ((activeTab === 'completion' || activeTab === 'certificates') && !completionReport) {
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

  // Lazy Load Progression Journey when tab opens
  useEffect(() => {
    if (activeTab === 'progression' && !progressionData) {
      const fetchProgression = async () => {
        setLoadingProgression(true);
        try {
          const res = await api.getAcademicJourney();
          setProgressionData(res?.journey || res || null);
        } catch (err: any) {
          console.error('Failed to load progression journey:', err);
        } finally {
          setLoadingProgression(false);
        }
      };
      fetchProgression();
    }
  }, [activeTab, progressionData]);

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

  // Claim Progression to Next Level
  // progressionCohortId stores "eligibilityId:targetCohortId" for proper API call
  const handleClaimProgression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressionCohortId) return;
    const [eligibilityId, targetCohortId] = progressionCohortId.split('|');
    if (!targetCohortId) return;
    setClaimingProgression(true);
    setActionError('');
    try {
      await api.claimProgression({ eligibilityId: eligibilityId || '', targetCohortId });
      setActionSuccess('Successfully claimed enrollment in the next level cohort! Check your dashboard for updated cohort details.');
      setProgressionData(null); // Force refresh
      setProgressionCohortId('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim progression enrollment.');
    } finally {
      setClaimingProgression(false);
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
        liveDemoUrl: projectLiveUrl || projectVideoUrl,
        thumbnail: projectVideoUrl || undefined,
      });
      setActionSuccess('Project evidence, YouTube demo, and repositories updated successfully!');
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

  // Submit New Capstone Project
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title.trim() || !newProjectForm.description.trim()) {
      setActionError('Project title and description are required.');
      return;
    }
    setCreatingProject(true);
    setActionError('');
    try {
      await api.createProject({
        title: newProjectForm.title.trim(),
        category: newProjectForm.category,
        description: newProjectForm.description.trim(),
        githubUrl: newProjectForm.githubUrl.trim() || undefined,
        liveDemoUrl: newProjectForm.liveDemoUrl.trim() || newProjectForm.youtubeVideoUrl.trim() || undefined,
        thumbnail: newProjectForm.youtubeVideoUrl.trim() || undefined,
        skills: newProjectForm.skills.trim() || undefined,
        tools: newProjectForm.tools.trim() || undefined,
      });
      setActionSuccess('Capstone project submitted to showcase portfolio! View it live on the Projects page.');
      setShowCreateProjectModal(false);
      setNewProjectForm({
        title: '',
        category: 'Software Engineering',
        description: '',
        youtubeVideoUrl: '',
        liveDemoUrl: '',
        githubUrl: '',
        skills: '',
        tools: '',
      });
      const res = await api.getStudentDashboard();
      setData(res.dashboard);
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit capstone project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleStudentReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const res = await api.uploadFile(file, 'receipts');
      setTellerProofUrl(res.url);
      setReceiptFileName(file.name);
    } catch (err: any) {
      alert('Failed to upload proof of payment: ' + err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Online Payment / Transfer Initiation (No Client-Side Mutation)
  const handleInitiatePayment = async () => {
    if (!selectedInvoiceForPayment) return;
    setPaymentProcessing(true);
    setActionError('');
    try {
      if (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CRYPTO') {
        const isCrypto = paymentMethod === 'CRYPTO';
        await api.submitBankTransfer({
          invoiceId: selectedInvoiceForPayment.id,
          amount: paymentAmount,
          channel: isCrypto ? 'CRYPTO' : 'BANK_TRANSFER',
          senderBank: isCrypto
            ? `${paymentSettings?.cryptoDetails?.currency || 'USDT'} (${paymentSettings?.cryptoDetails?.network || 'TRC20'})`
            : (senderBank || 'Access Bank'),
          senderAccount: senderAccount || (isCrypto ? 'Crypto-TxHash' : '0123456789'),
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

  const academicLevelLabel = profile?.currentLevel || cohort?.levelCode?.replace(/_/g, ' ') || cohort?.level || 'Level 1 Foundation';
  const cohortSectionLabel = cohort?.cohortCode ? `${cohort.name} (${cohort.cohortCode})` : cohort?.name || 'Class Batch';

  const getPageHeaderConfig = () => {
    switch (activeTab) {
      case 'curriculum':
        return {
          title: 'Curriculum & Lessons',
          subtitle: `${program?.name || 'Academic Program'} • ${academicLevelLabel} • ${cohortSectionLabel}`,
          badge: (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {academicLevelLabel}
              </span>
              <Badge variant="blue">{coursesList.length} Courses</Badge>
            </div>
          ),
          actions: (
            <button
              type="button"
              onClick={() => setShowCopilot(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Ask AI Copilot</span>
            </button>
          ),
        };
      case 'assignments':
      case 'projects':
      case 'competencies':
        return {
          title: 'Assignments & Projects',
          subtitle: `${program?.name || 'Academic Program'} • ${academicLevelLabel} • ${cohortSectionLabel}`,
          badge: (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {academicLevelLabel}
              </span>
              <Badge variant="blue">{assignments?.length || 0} Assignments</Badge>
            </div>
          ),
        };
      case 'attendance':
        return {
          title: 'Timetable & Attendance Register',
          subtitle: `${program?.name || 'Academic Program'} • ${academicLevelLabel} • ${cohortSectionLabel}`,
          badge: (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {academicLevelLabel}
              </span>
              <Badge variant={metrics?.totalClasses === 0 ? 'blue' : 'green'}>
                {metrics?.totalClasses === 0 ? 'Pending Session Start' : `${metrics?.attendanceRate || 0}% Attendance`}
              </Badge>
            </div>
          ),
        };
      case 'finance':
        return {
          title: 'Tuition & Clearance',
          subtitle: 'Tuition billing ledger, payment receipts, and official institutional financial clearance.',
          badge: <Badge variant="blue">{invoices?.length || 0} Invoices</Badge>,
        };
      case 'certificates':
      case 'completion':
        return {
          title: 'Completion Readiness & Certificates',
          subtitle: 'Graduation criteria checklist and cryptographically verifiable academic certificates.',
          badge: <Badge variant="purple">{certificates?.length || 0} Issued</Badge>,
        };
      case 'progression':
        return {
          title: 'Academic Progression Journey',
          subtitle: 'Track your level completions, progression eligibility, and enroll in next-level cohorts when ready.',
          badge: <Badge variant="blue">{academicLevelLabel}</Badge>,
        };
      case 'notifications':
        return {
          title: 'Notifications & Announcements',
          subtitle: 'Official institutional updates, faculty communications, schedule changes, and cohort alerts.',
          badge: <Badge variant="blue">{announcements?.length || 0} Notices</Badge>,
        };
      case 'overview':
      default:
        return null;
    }
  };

  const studentPageHeader = getPageHeaderConfig();

  return (
    <PortalLayout activeTab={activeTab === 'certificates' ? 'certificates' : activeTab} onTabChange={handleTabChange}>
      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Dynamic Header: If on overview, show learner identity banner; otherwise show PageHeader */}
        {studentPageHeader ? (
          <PageHeader
            title={studentPageHeader.title}
            subtitle={studentPageHeader.subtitle}
            badge={studentPageHeader.badge}
            actions={studentPageHeader.actions}
          />
        ) : (
          /* Top Student Institutional Banner for Overview */
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
                  {(cohort as any)?.learningCenter && (
                    <span className="block text-[11px] text-blue-200 mt-0.5">
                      📍 Campus: <strong>{(cohort as any).learningCenter.name}</strong>
                      {(cohort as any).learningCenter.neighborhood ? ` · ${(cohort as any).learningCenter.neighborhood}` : ''}
                      {(cohort as any).sponsorName ? ` (Sponsored by ${(cohort as any).sponsorName})` : ''}
                    </span>
                  )}
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
        )}

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

        {/* Learning Workflow Metrics Grid: Only on Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Syllabus Progress</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics?.totalLessonsCount === 0 ? 0 : (metrics?.syllabusProgressPercentage ?? metrics?.progressPercentage ?? 0)}%
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.totalLessonsCount === 0 ? 0 : (metrics?.syllabusProgressPercentage ?? metrics?.progressPercentage ?? 0)}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-400">
                {metrics?.totalLessonsCount === 0 ? 'Curriculum Pending Setup' : `${metrics?.completedLessonsCount || 0} of ${metrics?.totalLessonsCount || 0} Units`}
              </div>
            </Card>

            <Card className="p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Attendance Rate</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics?.totalClasses === 0 ? (
                  <span className="text-base text-slate-500 font-bold">Pending Start</span>
                ) : (
                  `${metrics?.attendanceRate ?? 0}%`
                )}
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.totalClasses === 0 ? 0 : (metrics?.attendanceRate ?? 0)}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-400">
                {metrics?.totalClasses === 0 ? 'No Sessions Held Yet' : `${metrics?.attendedClasses || 0} of ${metrics?.totalClasses || 0} Attended`}
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
        )}

        {/* Contextual subtabs for assignments / projects / competencies */}
        {['assignments', 'projects', 'competencies'].includes(activeTab) && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => handleTabChange('assignments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'assignments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Assignments & Tasks ({assignments?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('projects')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'projects'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Practical Projects ({projects?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('competencies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'competencies'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Competencies ({competencies?.length || 0})
            </button>
          </div>
        )}

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

        {/* TAB 2: ACTIVE RELATIONAL CURRICULUM — UOPEOPLE DUAL-PANE LEARNING STUDIO */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Interactive Learning Studio</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    Dual-Pane Classroom
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Unit-based curriculum pacing with sequential navigation, embedded video lectures, and practical activities.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  Progress: <strong className="text-blue-600">{completedLessonIds.size}</strong> of{' '}
                  <strong className="text-slate-900">{flatLessonsList.length}</strong> Completed (
                  {flatLessonsList.length > 0
                    ? Math.round((completedLessonIds.size / flatLessonsList.length) * 100)
                    : 0}
                  %)
                </div>
              </div>
            </div>

            {/* Academic Standing & Cohort Level Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-300" />
                  {academicLevelLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-200">
                  Cohort: {cohort?.name} ({cohort?.cohortCode || 'STP'})
                </span>
                {(cohort as any)?.learningCenter && (
                  <span className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {(cohort as any).learningCenter.name}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300">
                Specialization Track: <strong className="text-white">{program?.name}</strong>
              </div>
            </div>

            {loadingCurriculum ? (
              <div className="py-20 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Connecting to syllabus and loading multimedia lecture modules...
              </div>
            ) : coursesList.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs">
                No active courses mapped to this curriculum version yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT PANE: UOPEOPLE-STYLE MODULE & UNIT ACCORDION SYLLABUS TREE (35% width) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search units, topics, lessons..."
                      value={curriculumSearch}
                      onChange={(e) => setCurriculumSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs focus:outline-none"
                    />
                  </div>

                  {/* Modules Accordion List */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
                    {coursesList.map((course: any, cIdx: number) => {
                      return (course.modules || []).map((mod: any, mIdx: number) => {
                        const unitId = mod.id || `unit-${cIdx}-${mIdx}`;
                        const isExpanded =
                          expandedUnitIds.has(unitId) ||
                          (curriculumSearch.trim().length > 0) ||
                          selectedLesson?.moduleId === mod.id;

                        const lessonsInMod = mod.lessons || [];
                        const completedCount = lessonsInMod.filter(
                          (l: any) => completedLessonIds.has(l.id) || l.progress?.status === 'COMPLETED'
                        ).length;

                        // Filter lessons by search query if present
                        const displayedLessons = lessonsInMod.filter((l: any) => {
                          if (!curriculumSearch.trim()) return true;
                          const q = curriculumSearch.toLowerCase();
                          return (
                            l.title?.toLowerCase().includes(q) ||
                            mod.title?.toLowerCase().includes(q) ||
                            l.content?.toLowerCase().includes(q)
                          );
                        });

                        if (curriculumSearch.trim() && displayedLessons.length === 0) {
                          return null;
                        }

                        const isAllCompleted = lessonsInMod.length > 0 && completedCount === lessonsInMod.length;

                        return (
                          <div key={unitId} className="group">
                            {/* Unit Accordion Header */}
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedUnitIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(unitId)) {
                                    next.delete(unitId);
                                  } else {
                                    next.add(unitId);
                                  }
                                  return next;
                                });
                              }}
                              className={`w-full p-4 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                                isExpanded ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="space-y-1 min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                                    Unit {mIdx + 1}
                                  </span>
                                  {isAllCompleted ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Completed</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      {completedCount}/{lessonsInMod.length} Completed
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                                  {mod.title}
                                </h4>
                              </div>

                              <div className="text-slate-400 group-hover:text-slate-600 shrink-0 mt-1">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                            </button>

                            {/* Unit Items (Lessons & Activities) */}
                            {isExpanded && (
                              <div className="bg-slate-50/40 px-2 py-1.5 space-y-1 border-t border-slate-100">
                                {displayedLessons.map((lesson: any, lIdx: number) => {
                                  const isSelected = selectedLesson?.id === lesson.id;
                                  const isDone =
                                    completedLessonIds.has(lesson.id) ||
                                    lesson.progress?.status === 'COMPLETED';

                                  return (
                                    <button
                                      key={lesson.id || lIdx}
                                      type="button"
                                      onClick={() => {
                                        setSelectedLesson(lesson);
                                        setSelectedCourseTitle(course.title);
                                        setSelectedModuleTitle(mod.title);
                                      }}
                                      className={`w-full p-3 rounded-xl text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                                          : 'bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                            isSelected
                                              ? 'bg-white/20 text-white'
                                              : isDone
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : 'bg-slate-100 text-slate-500'
                                          }`}
                                        >
                                          {lesson.videoUrl ? (
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                          ) : (
                                            <BookOpen className="w-3.5 h-3.5" />
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <div
                                            className={`text-[10px] leading-tight truncate ${
                                              isSelected ? 'text-blue-100' : 'text-slate-400'
                                            }`}
                                          >
                                            {mIdx + 1}.{lIdx + 1} • {lesson.durationMinutes || 30} mins
                                          </div>
                                          <div className="text-xs font-semibold truncate mt-0.5">
                                            {lesson.title}
                                          </div>
                                        </div>
                                      </div>

                                      {isDone && (
                                        <CheckCircle2
                                          className={`w-4 h-4 shrink-0 ${
                                            isSelected ? 'text-white' : 'text-emerald-600'
                                          }`}
                                        />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>

                {/* RIGHT PANE: ACTIVE LESSON & READING WORKSPACE (65% width) */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  {selectedLesson ? (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                      {/* Top Navigation & Breadcrumb Bar */}
                      <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono uppercase font-bold text-blue-400 tracking-wider">
                            {selectedCourseTitle || 'Core Course'} • {selectedModuleTitle || 'Active Unit'}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                            {selectedLesson.title}
                          </h3>
                        </div>

                        {/* Sequential Navigation Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (prevLesson) {
                                setSelectedLesson(prevLesson);
                                setSelectedCourseTitle(prevLesson.courseTitle);
                                setSelectedModuleTitle(prevLesson.moduleTitle);
                              }
                            }}
                            disabled={!prevLesson}
                            aria-label="Previous lesson"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (nextLesson) {
                                if (!completedLessonIds.has(selectedLesson.id)) {
                                  handleRecordLessonProgress(selectedLesson.id);
                                }
                                setSelectedLesson(nextLesson);
                                setSelectedCourseTitle(nextLesson.courseTitle);
                                setSelectedModuleTitle(nextLesson.moduleTitle);
                              }
                            }}
                            disabled={!nextLesson}
                            aria-label="Next lesson"
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowLessonModal(true)}
                            title="Expand to Fullscreen Theater View"
                            aria-label="Theater Mode"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-blue-300" />
                            <span className="hidden sm:inline">Theater</span>
                          </button>
                        </div>
                      </div>

                      {/* Main Reading / Media Content */}
                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Video Player */}
                        {selectedLesson.videoUrl && (() => {
                          const playerInfo = getVideoPlayerInfo(selectedLesson.videoUrl);
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <Play className="w-4 h-4 text-rose-600 fill-rose-600" />
                                  <span>Video Lecture Presentation</span>
                                </div>
                                {selectedLesson.videoDurationMin && (
                                  <span className="text-slate-400 font-normal">
                                    {selectedLesson.videoDurationMin} mins
                                  </span>
                                )}
                              </div>

                              {playerInfo?.isDirectVideo ? (
                                <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-md border border-slate-200 aspect-video">
                                  <video
                                    src={playerInfo.embedUrl}
                                    controls
                                    controlsList="nodownload"
                                    className="w-full h-full object-contain"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ) : playerInfo && (playerInfo.type === 'youtube' || playerInfo.type === 'gdrive' || playerInfo.type === 'vimeo') ? (
                                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-black aspect-video">
                                  <iframe
                                    src={playerInfo.embedUrl}
                                    title={selectedLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full border-0"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={selectedLesson.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>Launch External Lecture Video Resource</span>
                                </a>
                              )}

                              {selectedLesson.videoSummary && (
                                <p className="text-[11px] text-slate-500 leading-relaxed p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <strong className="text-slate-700">Video Abstract:</strong> {selectedLesson.videoSummary}
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Lesson Meta Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                          <div className="space-y-1">
                            <h2 className="text-xl font-black text-slate-900">{selectedLesson.title}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>Estimated time: <strong>{selectedLesson.durationMinutes || 45} mins</strong></span>
                              <span>•</span>
                              <span>Milestone: <strong>{selectedLesson.order || 1}</strong></span>
                            </div>
                          </div>

                          <div>
                            {completedLessonIds.has(selectedLesson.id) || selectedLesson.progress?.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Lesson Completed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                <Clock className="w-4 h-4" />
                                <span>In Progress</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Lesson Content / Reading Text */}
                        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                          {selectedLesson.content ? (
                            <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {selectedLesson.content}
                            </div>
                          ) : (
                            <p className="text-slate-500 italic">
                              Review the lecture video and practice the hands-on lab exercises provided in this milestone.
                            </p>
                          )}
                        </div>

                        {/* Objectives Box */}
                        {selectedLesson.objectives && (
                          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-900 space-y-2">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              <span>Learning Competencies & Mastery Outcomes</span>
                            </h4>
                            <p className="text-xs leading-relaxed text-blue-800">
                              {selectedLesson.objectives}
                            </p>
                          </div>
                        )}

                        {/* Action Footer Bar */}
                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => handleRecordLessonProgress(selectedLesson.id)}
                            disabled={completingLesson || completedLessonIds.has(selectedLesson.id)}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-default"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {completedLessonIds.has(selectedLesson.id)
                                ? 'Marked as Complete ✓'
                                : completingLesson
                                ? 'Saving Progress...'
                                : 'Mark Lesson as Complete'}
                            </span>
                          </button>

                          {nextLesson && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!completedLessonIds.has(selectedLesson.id)) {
                                  handleRecordLessonProgress(selectedLesson.id);
                                }
                                setSelectedLesson(nextLesson);
                                setSelectedCourseTitle(nextLesson.courseTitle);
                                setSelectedModuleTitle(nextLesson.moduleTitle);
                              }}
                              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              <span>Next Lesson ({nextLesson.title.slice(0, 24)}...)</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="font-bold text-slate-800 text-base">Select a Unit or Lesson to Begin</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Click any unit item in the syllabus tree on the left to load the instructional reading, video lecture, and practical tasks.
                      </p>
                    </div>
                  )}
                </div>
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
                  Industry-grade capstone challenges. Submit YouTube recordings, GitHub repositories, and live deployments to showcase your work publicly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit Capstone Project
              </button>
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

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
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
                        {(proj.videoUrl || (proj.thumbnail && proj.thumbnail.includes('youtu')) || (proj.liveDemoUrl && proj.liveDemoUrl.includes('youtu'))) && (
                          <a
                            href={proj.videoUrl || (proj.thumbnail && proj.thumbnail.includes('youtu') ? proj.thumbnail : proj.liveDemoUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                          >
                            <Play className="w-3.5 h-3.5 fill-rose-600" />
                            <span>Video Demo</span>
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectForEvidence(proj);
                          setProjectGithubUrl(proj.githubUrl || '');
                          setProjectLiveUrl(proj.liveDemoUrl || '');
                          setProjectVideoUrl(proj.videoUrl || (proj.thumbnail && proj.thumbnail.includes('youtu') ? proj.thumbnail : ''));
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
                  <Card className="p-8 text-center text-slate-400 text-xs space-y-3">
                    <p>No active practical projects registered yet. Submit your capstone project or complete course milestones.</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateProjectModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Submit First Capstone Project
                    </button>
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

        {/* TAB: ACADEMIC PROGRESSION JOURNEY */}
        {activeTab === 'progression' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Academic Progression Journey</h2>
              <p className="text-xs text-slate-500">
                Track your level completions, progression eligibility, and enroll in next-level cohorts when ready.
              </p>
            </div>

            {loadingProgression ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading your academic journey...
              </div>
            ) : progressionData ? (
              <div className="space-y-4">
                {/* Active Cohort Status */}
                {progressionData.activeCohort ? (
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                      <Clock className="w-4 h-4" />
                      <span>Currently Enrolled</span>
                      <Badge variant="blue">{progressionData.activeCohort.levelCode?.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-xs text-blue-700">
                      <strong>{progressionData.activeCohort.name}</strong> — You must complete this cohort before progressing to the next level.
                    </p>
                    <p className="text-[11px] text-blue-600">
                      Cohort runs: {progressionData.activeCohort.startDate ? new Date(progressionData.activeCohort.startDate).toLocaleDateString('en-GB') : '—'} → {progressionData.activeCohort.endDate ? new Date(progressionData.activeCohort.endDate).toLocaleDateString('en-GB') : '—'}
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      No active cohort — you are eligible to enroll in the next level.
                    </div>
                  </div>
                )}

                {/* Completed Levels */}
                {progressionData.completedLevels && progressionData.completedLevels.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Completed Academic Levels</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {progressionData.completedLevels.map((level: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{level.cohortName || level.name}</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <Badge variant="green">{level.levelCode?.replace(/_/g, ' ')}</Badge>
                          {level.completionDate && (
                            <p className="text-[10px] text-slate-400">Completed: {new Date(level.completionDate).toLocaleDateString('en-GB')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progression Entitlements */}
                {progressionData.entitlements && progressionData.entitlements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Progression Entitlements</h3>
                    {progressionData.entitlements.map((ent: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-900">
                            Eligible for: {ent.nextLevel?.replace(/_/g, ' ')}
                          </span>
                          {ent.program && <span className="text-[11px] text-indigo-600">— {ent.program.name}</span>}
                        </div>
                        <p className="text-[11px] text-indigo-700">
                          You have earned progression eligibility. You may choose to enroll in any future cohort at this level — there is no obligation to join immediately.
                        </p>
                        {ent.availableCohorts && ent.availableCohorts.length > 0 ? (
                          <form onSubmit={handleClaimProgression} className="space-y-2">
                            <label className="text-[11px] font-bold text-indigo-800 block">Select Next Cohort to Enroll:</label>
                            <select
                              required
                              value={progressionCohortId}
                              onChange={(e) => setProgressionCohortId(e.target.value)}
                              className="w-full p-2 rounded-lg border border-indigo-200 bg-white text-xs"
                            >
                              <option value="">— Choose an open cohort —</option>
                              {ent.availableCohorts.map((c: any) => (
                                <option key={c.id} value={`${ent.id || ''}|${c.id}`}>
                                  {c.name} {c.startDate ? `· Starts ${new Date(c.startDate).toLocaleDateString('en-GB')}` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              disabled={claimingProgression || !progressionCohortId}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              {claimingProgression ? 'Enrolling...' : 'Claim Next Level Enrollment'}
                            </button>
                          </form>
                        ) : (
                          <p className="text-[11px] text-indigo-600 italic">
                            No open cohorts for this level yet. Check back when new cohorts are launched.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!progressionData.activeCohort && (!progressionData.entitlements || progressionData.entitlements.length === 0) && (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    Complete your first enrolled cohort to unlock progression eligibility.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">Could not load progression data. Please refresh.</div>
            )}
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
                <div className="text-xl font-black text-emerald-600">
                  {metrics?.totalClasses === 0 ? 'Pending Start' : `${metrics?.attendanceRate || 0}%`}
                </div>
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
                        <strong className="text-emerald-700 font-mono">
                          ₦{Number(inv.amountPaid ?? inv.paidAmount ?? 0).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Remaining Balance</span>
                        <strong className="text-blue-700 font-mono">
                          ₦{Number(inv.balance !== undefined ? inv.balance : Math.max(0, inv.totalAmount - (inv.amountPaid ?? inv.paidAmount ?? 0))).toLocaleString()}
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

        {/* TAB 8: COMPLETION & READINESS / CERTIFICATES */}
        {(activeTab === 'completion' || activeTab === 'certificates') && (
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
                  {certificates.map((cert: any) => {
                    const isDiploma = cert.isTrackDiploma || cert.certificateType === 'DIPLOMA';
                    return (
                      <Card key={cert.id} className={`p-6 space-y-3 ${isDiploma ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/40 to-white' : 'border-emerald-200'}`}>
                        <div className="flex items-center justify-between">
                          <Badge variant={isDiploma ? 'purple' : 'green'}>
                            {isDiploma ? 'Track Graduation Diploma' : 'Level Completion Certificate'}
                          </Badge>
                          <span className="text-[11px] font-mono text-slate-500 font-bold">
                            {cert.certificateNumber}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{cert.programName || cert.title || program?.name}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{cert.achievement}</p>
                        </div>
                        {cert.issueDate && (
                          <div className="text-[10px] text-slate-400">
                            Issued: {new Date(cert.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <Link
                            to={`/verify/${cert.certificateNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1.5"
                          >
                            <span>View & Verify Credential</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/verify/${cert.certificateNumber}`}
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                          >
                            Print Certificate
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No graduation certificates issued yet. Certificates are emitted following final cohort completion and board approval.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: ACADEMY NOTIFICATIONS & BROADCASTS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Notifications & Announcements</h2>
              <p className="text-xs text-slate-500">
                Official institutional updates, faculty communications, schedule changes, and cohort alerts.
              </p>
            </div>

            {/* Live Announcements */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Academy Broadcasts & Notices ({announcements?.length || 0})
              </h3>

              {announcements && announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((item: any) => (
                    <Card key={item.id} className="p-5 space-y-2 border-l-4 border-l-blue-600">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="blue">{item.type || 'OFFICIAL'}</Badge>
                          <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.content || item.message}
                      </p>
                      {item.author && (
                        <p className="text-[10px] text-slate-400">
                          Broadcast by: <strong className="text-slate-600">{item.author}</strong>
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No broadcasts or academy notices at this time.
                </Card>
              )}
            </div>

            {/* Academic Status Alerts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Matriculation & Enrolled Ledger
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4 bg-emerald-50/60 border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Financial Clearance Cleared</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your cohort tuition has been verified and approved by STEMPACT Finance Administration.
                  </p>
                </Card>
                <Card className="p-4 bg-blue-50/60 border-blue-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Matriculated Active Learner</span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Student ID #{profile.studentIdNumber} issued. You have institutional access to campus hubs and learning systems.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOCUSED LESSON PLAYER MODAL (THEATER / POPUP MODE) */}
      {showLessonModal && selectedLesson && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowLessonModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  {selectedCourseTitle} • {selectedModuleTitle}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Multi-Platform Video Player */}
            {selectedLesson.videoUrl && (() => {
              const playerInfo = getVideoPlayerInfo(selectedLesson.videoUrl);
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Play className="w-4 h-4 text-rose-600" />
                    <span>Video Lecture</span>
                    {playerInfo && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {playerInfo.label}
                      </span>
                    )}
                    {selectedLesson.videoDurationMin && (
                      <span className="ml-auto text-slate-400 font-normal">{selectedLesson.videoDurationMin} min</span>
                    )}
                  </div>
                  {playerInfo?.isDirectVideo ? (
                    <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-sm border border-slate-200">
                      <video
                        src={playerInfo.embedUrl}
                        controls
                        controlsList="nodownload"
                        className="w-full max-h-[460px] object-contain mx-auto"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : playerInfo && (playerInfo.type === 'youtube' || playerInfo.type === 'gdrive' || playerInfo.type === 'vimeo') ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={playerInfo.embedUrl}
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
                      />
                    </div>
                  ) : (
                    <a
                      href={selectedLesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch Video Resource
                    </a>
                  )}
                  {selectedLesson.videoSummary && (
                    <p className="text-[11px] text-slate-500 leading-relaxed p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <strong className="text-slate-700">Video Summary:</strong> {selectedLesson.videoSummary}
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Instructional Lesson Reading & Study Guide:</span>
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-xs space-y-2">
                  {selectedLesson.content || selectedLesson.summary || 'In this lesson, you will master baseline conceptual principles, review architectural patterns, and implement hands-on practical exercises guided by your faculty mentor.'}
                </div>
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
                onClick={() => setShowLessonModal(false)}
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

              <div className="space-y-1">
                <label className="font-bold text-slate-700">YouTube Video Presentation / Demo URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={projectVideoUrl}
                  onChange={(e) => setProjectVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <p className="text-[10px] text-slate-400">Add a YouTube walkthrough video to feature in the interactive project showcase player.</p>
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

      {/* CREATE CAPSTONE PROJECT MODAL */}
      {showCreateProjectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Portfolio & Capstone</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Submit Capstone Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Crop Disease Diagnostic Web Platform"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category / Domain *</label>
                <select
                  value={newProjectForm.category}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Software Engineering">Software Engineering & AI</option>
                  <option value="Robotics & IoT">Robotics & IoT</option>
                  <option value="Renewable Energy">Renewable Energy & CleanTech</option>
                  <option value="Creative Tech">Creative Tech & Game Dev</option>
                  <option value="FinTech">FinTech & Blockchain</option>
                  <option value="Cybersecurity">Cybersecurity & Cloud</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what problem this project solves, architecture, and key innovations..."
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">YouTube Video Presentation / Demo URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={newProjectForm.youtubeVideoUrl}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, youtubeVideoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <p className="text-[10px] text-slate-400">Embeds an interactive video player on the public showcase!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Live Demo / Deployment URL</label>
                  <input
                    type="url"
                    placeholder="https://my-app.vercel.app"
                    value={newProjectForm.liveDemoUrl}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, liveDemoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">GitHub Repository URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={newProjectForm.githubUrl}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tools / Stack</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, Python, OpenCV, Tailwind"
                    value={newProjectForm.tools}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, tools: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Skills Acquired</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Vision, Full-Stack, CI/CD"
                    value={newProjectForm.skills}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, skills: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {creatingProject ? 'Submitting...' : 'Publish to Showcase'}
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

            {/* Payment Method Selector */}
            {(() => {
              const channels = [
                ...(paymentSettings?.channels?.paystack !== false ? [{ id: 'PAYSTACK' as const, label: 'Paystack', badge: 'Card / USSD' }] : []),
                ...(paymentSettings?.channels?.flutterwave ? [{ id: 'FLUTTERWAVE' as const, label: 'Flutterwave', badge: 'Card / Mobile Money' }] : []),
                ...(paymentSettings?.channels?.bankTransfer !== false ? [{ id: 'BANK_TRANSFER' as const, label: 'Bank Transfer', badge: 'Direct Deposit' }] : []),
                ...(paymentSettings?.channels?.crypto ? [{ id: 'CRYPTO' as const, label: 'Crypto (USDT)', badge: 'Web3 / Global' }] : []),
              ];

              return (
                <div className={`grid grid-cols-${Math.min(channels.length, 4)} gap-2`}>
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setPaymentMethod(ch.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === ch.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{ch.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{ch.badge}</div>
                    </button>
                  ))}
                </div>
              );
            })()}

            {paymentMethod === 'BANK_TRANSFER' ? (
              <div className="space-y-4 text-xs">
                {/* Official Bank Account Card */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      STEMPACT Official Bank Account
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Primary</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Bank Name</div>
                      <div className="font-bold text-slate-900">{paymentSettings?.bankDetails?.bankName || 'Access Bank Plc'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Account Name</div>
                      <div className="font-semibold text-slate-900">{paymentSettings?.bankDetails?.accountName || 'STEMPACT Academy Ltd'}</div>
                    </div>
                  </div>

                  {/* Account Number with 1-click Copy */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Account Number</div>
                      <div className="font-mono text-sm font-extrabold text-slate-900 tracking-wider">
                        {paymentSettings?.bankDetails?.accountNumber || '1234567890'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const acc = paymentSettings?.bankDetails?.accountNumber || '1234567890';
                        navigator.clipboard.writeText(acc);
                        setCopiedBank(acc);
                        setTimeout(() => setCopiedBank(''), 3000);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                    >
                      {copiedBank === (paymentSettings?.bankDetails?.accountNumber || '1234567890') ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                    💡 <strong className="text-slate-700">Narration Instruction:</strong>{' '}
                    {paymentSettings?.bankDetails?.instructions || 'Please input your Matriculation Number or Full Name in transfer narration.'}
                  </div>

                  {/* Additional Bank Accounts if configured */}
                  {Array.isArray(paymentSettings?.bankDetails?.additionalAccounts) && paymentSettings.bankDetails.additionalAccounts.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700">Alternative Institutional Accounts:</div>
                      {paymentSettings.bankDetails.additionalAccounts.map((acc: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{acc.bankName} <span className="text-[10px] text-slate-400 font-normal">({acc.currency || 'NGN'})</span></div>
                            <div className="font-mono text-slate-600">{acc.accountNumber} · <span className="text-[11px]">{acc.accountName}</span></div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(acc.accountNumber);
                              setCopiedBank(acc.accountNumber);
                              setTimeout(() => setCopiedBank(''), 3000);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                          >
                            {copiedBank === acc.accountNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <label className="font-semibold text-slate-700">Sender Account / Reference / Narration</label>
                  <input
                    type="text"
                    placeholder="e.g. 0123456789 or Session ID"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Bank Transfer Proof / Teller *</span>
                    </span>
                    {uploadingReceipt && <span className="text-[10px] text-blue-600 animate-pulse">Uploading to Cloud...</span>}
                  </label>

                  <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleStudentReceiptUpload}
                      disabled={uploadingReceipt}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {tellerProofUrl ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[240px]">{receiptFileName || 'Receipt uploaded successfully'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <p className="text-slate-600 text-xs font-medium">Click or drag receipt image / PDF here</p>
                        <p className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP, or PDF (up to 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={paymentProcessing || uploadingReceipt}
                  onClick={handleInitiatePayment}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paymentProcessing ? 'Submitting Transfer Proof...' : 'Submit Transfer Confirmation'}
                </button>
              </div>
            ) : paymentMethod === 'CRYPTO' ? (
              <div className="space-y-4 text-xs">
                {/* Official Crypto Deposit Card */}
                <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-600" />
                      STEMPACT Official Crypto Treasury
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                      {paymentSettings?.cryptoDetails?.currency || 'USDT'} · {paymentSettings?.cryptoDetails?.network || 'TRC-20'}
                    </span>
                  </div>

                  {/* Wallet Address with 1-click Copy */}
                  <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Deposit Wallet Address:</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900 break-all select-all">
                        {paymentSettings?.cryptoDetails?.walletAddress || 'Contact Admin for TRC-20 Address'}
                      </span>
                      {paymentSettings?.cryptoDetails?.walletAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentSettings.cryptoDetails.walletAddress);
                            setCopiedCrypto(true);
                            setTimeout(() => setCopiedCrypto(false), 3000);
                          }}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition cursor-pointer"
                        >
                          {copiedCrypto ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-900 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
                    ⚠️ <strong className="text-amber-950">Deposit Instructions:</strong>{' '}
                    {paymentSettings?.cryptoDetails?.instructions || 'Send equivalent tuition value in USDT via TRC-20 network only. Other networks may result in permanent loss.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Sender Wallet Address / Transaction Hash (TxID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0x... or 32-character Transaction Hash"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Transaction Screenshot / Transfer Proof *</span>
                    </span>
                    {uploadingReceipt && <span className="text-[10px] text-amber-600 animate-pulse">Uploading to Cloud...</span>}
                  </label>

                  <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleStudentReceiptUpload}
                      disabled={uploadingReceipt}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {tellerProofUrl ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[240px]">{receiptFileName || 'Proof uploaded successfully'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <p className="text-slate-600 text-xs font-medium">Click or drag transaction receipt screenshot / PDF</p>
                        <p className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP, PDF (up to 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={paymentProcessing || uploadingReceipt}
                  onClick={handleInitiatePayment}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paymentProcessing ? 'Submitting Crypto Deposit...' : 'Submit Crypto Deposit Confirmation'}
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
