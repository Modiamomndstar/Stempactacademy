import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { PortalLayout } from '../../components/PortalLayout';
import { PageHeader } from '../../components/PageHeader';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Plus,
  Send,
  Bell,
  Check,
  X,
  FileText,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Video,
  MapPin,
  Search,
  Layers,
  Play,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { AILessonPlanModal } from '../../components/AILessonPlanModal';
import { AIFeedbackModal } from '../../components/AIFeedbackModal';

export const InstructorPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFromUrl = searchParams.get('tab') || 'cohorts';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(currentTabFromUrl);

  // Tab & Cohort Selection State
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  // Attendance Sheet State
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // New Class Session Modal State
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);
  const [newSessionTitle, setNewSessionTitle] = useState<string>('');
  const [newSessionDate, setNewSessionDate] = useState<string>('');
  const [newSessionStart, setNewSessionStart] = useState<string>('16:00');
  const [newSessionEnd, setNewSessionEnd] = useState<string>('19:00');
  const [newSessionTopic, setNewSessionTopic] = useState<string>('');
  const [newSessionRoom, setNewSessionRoom] = useState<string>('Turing Lab 1');
  const [newSessionMeetingUrl, setNewSessionMeetingUrl] = useState<string>('');
  const [creatingSession, setCreatingSession] = useState<boolean>(false);

  // Assignment Grading State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState<boolean>(false);

  // Competency Evaluation State
  const [evalStudentId, setEvalStudentId] = useState<string>('');
  const [evalCompetencyId, setEvalCompetencyId] = useState<string>('');
  const [evalStatus, setEvalStatus] = useState<string>('ACQUIRED');
  const [evalScore, setEvalScore] = useState<number>(85);
  const [evalEvidence, setEvalEvidence] = useState<string>('');
  const [evaluatingComp, setEvaluatingComp] = useState<boolean>(false);

  // AI Assistant States
  const [showLessonPlanModal, setShowLessonPlanModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [activeAiFeedbackSub, setActiveAiFeedbackSub] = useState<any | null>(null);

  // AI Grade Assistant State
  const [aiGradeDraftLoading, setAiGradeDraftLoading] = useState<string | null>(null); // stores submissionId being processed
  const [aiGradeDrafts, setAiGradeDrafts] = useState<Record<string, any>>({}); // submissionId -> draft result

  // Capstone Project Evaluation State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectScore, setProjectScore] = useState<number>(90);
  const [projectFeedback, setProjectFeedback] = useState<string>('');
  const [savingProjectEval, setSavingProjectEval] = useState<boolean>(false);

  // Curriculum Lesson Preview State
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);

  // Sync Tab with URL
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

  // Load Instructor Dashboard
  const loadInstructorData = async () => {
    try {
      setLoading(true);
      const res = await api.getInstructorDashboard();
      setData(res);
      if (res.cohorts && res.cohorts.length > 0) {
        if (!selectedCohortId || !res.cohorts.some((c: any) => c.id === selectedCohortId)) {
          setSelectedCohortId(res.cohorts[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load instructor dashboard:', err);
      setErrorMsg(err.message || 'Failed to load instructor records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructorData();
  }, []);

  // Submit Class Attendance Action
  const handleMarkAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !sessionTitle) {
      alert('Please specify a cohort and session title.');
      return;
    }
    setSavingAttendance(true);
    setFeedbackMsg('');
    setErrorMsg('');
    try {
      // 1. Create or anchor class session
      const sessionRes = await api.createClassSession({
        cohortId: selectedCohortId,
        title: sessionTitle,
        date: new Date().toISOString(),
        startTime: '16:00',
        endTime: '19:00',
        topic: sessionTopic || sessionTitle,
        room: 'Lab Room 2',
      });

      // 2. Mark attendance for each student in the assigned cohort
      const cohortObj = data?.cohorts?.find((c: any) => c.id === selectedCohortId);
      const recordsToSubmit = (cohortObj?.studentProfiles || []).map((sp: any) => ({
        studentId: sp.id,
        status: attendanceRecords[sp.id] || 'PRESENT',
        remarks: attendanceRemarks[sp.id] || undefined,
      }));

      await api.markAttendance({
        classSessionId: sessionRes.session.id,
        records: recordsToSubmit,
      });

      setFeedbackMsg(`Successfully recorded attendance for ${recordsToSubmit.length} students in ${cohortObj?.name}!`);
      setSessionTitle('');
      setSessionTopic('');
      await loadInstructorData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Create Scheduled Class Session Action
  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohortId || !newSessionTitle || !newSessionDate) return;
    setCreatingSession(true);
    setErrorMsg('');
    try {
      await api.createClassSession({
        cohortId: selectedCohortId,
        title: newSessionTitle,
        date: new Date(newSessionDate).toISOString(),
        startTime: newSessionStart,
        endTime: newSessionEnd,
        topic: newSessionTopic || newSessionTitle,
        room: newSessionRoom,
        meetingUrl: newSessionMeetingUrl || undefined,
        status: 'SCHEDULED',
      });
      setShowNewSessionModal(false);
      setFeedbackMsg('Class session scheduled successfully!');
      setNewSessionTitle('');
      setNewSessionDate('');
      setNewSessionTopic('');
      setNewSessionMeetingUrl('');
      await loadInstructorData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule class session');
    } finally {
      setCreatingSession(false);
    }
  };

  // Grade Assignment Submission Action
  const handleGradeSubmission = async (subId: string) => {
    setSavingGrade(true);
    setErrorMsg('');
    try {
      await api.gradeSubmission(subId, {
        grade: Number(gradeInput),
        feedback: feedbackInput || 'Evaluation verified by lead faculty.',
      });
      setFeedbackMsg('Grade and feedback recorded successfully!');
      setSelectedSubmissionId(null);
      await loadInstructorData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit grade');
    } finally {
      setSavingGrade(false);
    }
  };

  // AI Grade Draft Handler
  const handleGenerateAiGradeDraft = async (subId: string) => {
    setAiGradeDraftLoading(subId);
    setErrorMsg('');
    try {
      const res = await api.generateAiGradeDraft(subId);
      setAiGradeDrafts((prev) => ({ ...prev, [subId]: res }));
      // Pre-fill grade and feedback with AI suggestion if not already set
      if (res.suggestedGrade !== undefined) {
        setGradeInput(Number(res.suggestedGrade));
      }
      if (res.feedbackDraft) {
        setFeedbackInput(res.feedbackDraft);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI grade assistant failed. Please grade manually.');
    } finally {
      setAiGradeDraftLoading(null);
    }
  };

  // Evaluate Competency Action
  const handleEvaluateCompetencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalStudentId || !evalCompetencyId) {
      alert('Please select both a student and competency.');
      return;
    }
    setEvaluatingComp(true);
    setErrorMsg('');
    try {
      await api.evaluateCompetency({
        studentId: evalStudentId,
        competencyId: evalCompetencyId,
        status: evalStatus,
        score: Number(evalScore),
        evidenceNotes: evalEvidence || undefined,
      });
      setFeedbackMsg('Competency evaluation saved and verified successfully!');
      setEvalEvidence('');
      await loadInstructorData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to evaluate competency');
    } finally {
      setEvaluatingComp(false);
    }
  };

  // Evaluate Capstone Project Action
  const handleEvaluateProject = async (projectId: string) => {
    setSavingProjectEval(true);
    setErrorMsg('');
    try {
      await api.evaluateProject(projectId, {
        score: Number(projectScore),
        feedback: projectFeedback || 'Capstone project reviewed and verified by lead faculty.',
      });
      setFeedbackMsg('Capstone project evaluated and grade recorded successfully!');
      setSelectedProjectId(null);
      await loadInstructorData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit capstone evaluation');
    } finally {
      setSavingProjectEval(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Faculty & Instructor Workstation..." />;
  if (!data) return null;

  const { instructor, cohorts, pendingSubmissions, recentSessions } = data;
  const currentCohort = cohorts.find((c: any) => c.id === selectedCohortId) || cohorts[0] || null;

  const getPageHeaderConfig = () => {
    switch (activeTab) {
      case 'attendance':
        return {
          title: 'Mark Class Attendance',
          subtitle: 'Verify live participation, log attendance registers, and submit authorized session records.',
          badge: <Badge variant="green">Register Open</Badge>,
        };
      case 'grading':
        return {
          title: 'Submissions & Grading Queue',
          subtitle: 'Review student coursework submissions, assign grades, and provide qualitative mentor feedback.',
          badge: <Badge variant="blue">{pendingSubmissions?.length || 0} Pending</Badge>,
        };
      case 'competencies':
        return {
          title: 'Competency Evaluation Desk',
          subtitle: 'Rate student practical skill acquisition against ratified academic syllabus standards.',
          badge: <Badge variant="purple">Competency Engine</Badge>,
        };
      case 'sessions':
        return {
          title: 'Class Sessions & Timetable',
          subtitle: 'Schedule upcoming lecture sessions, lab practicums, and virtual class links.',
          badge: <Badge variant="blue">{recentSessions?.length || 0} Sessions</Badge>,
          actions: (
            <button
              type="button"
              onClick={() => setShowNewSessionModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          ),
        };
      case 'curriculum':
        return {
          title: 'Curriculum & Course Materials',
          subtitle: 'Inspect module syllabi, video lectures, lesson notes, and hands-on practicums for your classes.',
          badge: <Badge variant="blue">Curriculum Matrix</Badge>,
        };
      case 'projects':
        return {
          title: 'Capstone Projects Desk',
          subtitle: 'Review student capstone projects, inspect GitHub code repositories, and verify live demos.',
          badge: <Badge variant="purple">Capstone Studio</Badge>,
        };
      case 'cohorts':
      case 'cockpit':
      default:
        return null;
    }
  };

  const instructorPageHeader = getPageHeaderConfig();

  return (
    <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Dynamic Header: If specific sub-domain, show PageHeader; otherwise show Faculty Profile Header */}
        {instructorPageHeader ? (
          <PageHeader
            title={instructorPageHeader.title}
            subtitle={instructorPageHeader.subtitle}
            badge={instructorPageHeader.badge}
            actions={instructorPageHeader.actions}
          />
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border border-emerald-400/30">
                {instructor.name ? instructor.name[0] : 'F'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    STAFF: {instructor.staffCode}
                  </span>
                  <span className="text-xs font-bold text-blue-400">FACULTY INSTRUCTOR</span>
                </div>
                <h1 className="text-2xl font-black text-white mt-1">{instructor.name}</h1>
                <p className="text-xs text-slate-300">{instructor.specialization || 'Technical Faculty Lead'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLessonPlanModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>AI Lesson Assistant</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Global Feedback Banners */}
        {feedbackMsg && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg('')} className="font-bold text-emerald-900 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="font-bold text-rose-900 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: ASSIGNED COHORTS & ROSTERS */}
        {(activeTab === 'cohorts' || activeTab === 'cockpit') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((c: any) => (
                <Card key={c.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">{c.cohortCode}</span>
                    <Badge variant="green">{c.status}</Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Program:</strong> {c.program?.name}</div>
                    <div><strong>Schedule:</strong> {c.schedule}</div>
                    <div><strong>Enrolled Roster:</strong> {c.studentProfiles?.length || c.currentEnrollment || 0} students</div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCohortId(c.id);
                        handleTabChange('attendance');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Take Attendance →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCohortId(c.id);
                        handleTabChange('sessions');
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Sessions ({c.classSessions?.length || 0})
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Current Cohort Roster Table */}
            {currentCohort && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Roster: {currentCohort.name} ({currentCohort.cohortCode})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Authorized enrolled student ledger under your faculty instruction.
                    </p>
                  </div>
                  <Badge variant="blue">
                    {currentCohort.studentProfiles?.length || 0} Students
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Attendance Rate</th>
                        <th className="py-2.5 px-3">Completion Rate</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(currentCohort.studentProfiles || []).map((sp: any) => (
                        <tr key={sp.id}>
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">
                            {sp.studentIdNumber}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {sp.user?.firstName} {sp.user?.lastName}
                          </td>
                          <td className="py-3 px-3 text-slate-500">{sp.user?.email}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-700">{sp.attendanceRate || 100}%</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-blue-700">{sp.completionRate || 0}%</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEvalStudentId(sp.id);
                                handleTabChange('competencies');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                            >
                              Evaluate Skills
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: CLASS SESSIONS & TIMETABLE */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Scheduled Class Sessions</h2>
                <p className="text-xs text-slate-500">
                  Manage syllabus delivery dates, lecture topics, physical lab rooms, and hybrid video meeting links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSessionModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Session</span>
              </button>
            </div>

            <div className="space-y-4">
              {recentSessions && recentSessions.length > 0 ? (
                recentSessions.map((session: any) => (
                  <Card key={session.id} className="p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                          {session.cohort?.name} ({session.cohort?.cohortCode})
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{session.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          {session.date ? new Date(session.date).toLocaleDateString('en-GB') : 'TBA'} • {session.startTime} - {session.endTime}
                        </span>
                        <Badge variant="blue">{session.status}</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">{session.topic}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      {session.room && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.room}</span>
                        </div>
                      )}
                      {session.meetingUrl && (
                        <a
                          href={session.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Virtual Classroom</span>
                        </a>
                      )}
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{session.attendances?.length || 0} Attended</span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No sessions created yet. Schedule your first session above.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MARK ATTENDANCE */}
        {activeTab === 'attendance' && (
          <Card className="p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Class Attendance Sheet</h2>
                <p className="text-xs text-slate-500">Record present, late, absent, or excused status for today's lab session.</p>
              </div>
            </div>

            <form onSubmit={handleMarkAttendanceSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Select Cohort *</label>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => setSelectedCohortId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {cohorts.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cohortCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab 4: Microcontroller FreeRTOS Interfacing"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Topic / Milestones Covered</label>
                  <input
                    type="text"
                    placeholder="e.g. Memory allocation, Mutex locking"
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-xs uppercase text-slate-400">
                  Enrolled Students ({currentCohort?.studentProfiles?.length || 0})
                </h3>

                {currentCohort?.studentProfiles && currentCohort.studentProfiles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 px-3">Student ID</th>
                          <th className="py-2 px-3">Learner Name</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3">Remarks (Optional)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentCohort.studentProfiles.map((sp: any) => {
                          const status = attendanceRecords[sp.id] || 'PRESENT';
                          return (
                            <tr key={sp.id}>
                              <td className="py-3 px-3 font-mono font-semibold text-slate-500">
                                {sp.studentIdNumber}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900">
                                {sp.user?.firstName} {sp.user?.lastName}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-[11px] font-bold">
                                  {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() =>
                                        setAttendanceRecords((prev) => ({ ...prev, [sp.id]: st }))
                                      }
                                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                        status === st
                                          ? st === 'PRESENT'
                                            ? 'bg-emerald-600 text-white'
                                            : st === 'LATE'
                                            ? 'bg-amber-500 text-white'
                                            : st === 'EXCUSED'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-rose-600 text-white'
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="text"
                                  placeholder="e.g. Active participation"
                                  value={attendanceRemarks[sp.id] || ''}
                                  onChange={(e) =>
                                    setAttendanceRemarks((prev) => ({ ...prev, [sp.id]: e.target.value }))
                                  }
                                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3">No students currently enrolled in this cohort batch.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingAttendance}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingAttendance ? 'Saving Attendance...' : 'Save & Calculate Attendance Rates'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 4: SUBMISSIONS & GRADING */}
        {activeTab === 'grading' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Student Assignment Submissions</h2>
            {pendingSubmissions.length === 0 ? (
              <Card className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Grading Queue Empty</h3>
                <p className="text-xs text-slate-500">All submitted student works have been evaluated.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600 font-mono">{sub.student?.studentIdNumber}</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                          {sub.student?.user?.firstName} {sub.student?.user?.lastName}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">{sub.assignment?.title}</div>
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {sub.content}
                      </p>
                    </div>

                    {selectedSubmissionId === sub.id ? (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 text-xs">
                        {/* AI Grade Draft Result */}
                        {aiGradeDrafts[sub.id] && (
                          <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-violet-900">
                              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                              <span>AI Grade Suggestion</span>
                              {aiGradeDrafts[sub.id].suggestedGrade !== undefined && (
                                <span className="ml-auto text-violet-700 font-mono">
                                  Score: {aiGradeDrafts[sub.id].suggestedGrade}/{sub.assignment?.maxPoints || 100}
                                </span>
                              )}
                            </div>
                            {aiGradeDrafts[sub.id].feedbackDraft && (
                              <p className="text-[11px] text-violet-800 italic leading-relaxed">{aiGradeDrafts[sub.id].feedbackDraft}</p>
                            )}
                            {aiGradeDrafts[sub.id].rubricScores && (
                              <div className="pt-1 space-y-1">
                                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide">Rubric Breakdown:</span>
                                {Object.entries(aiGradeDrafts[sub.id].rubricScores).map(([criterion, score]: [string, any]) => (
                                  <div key={criterion} className="flex justify-between text-[11px] text-violet-700">
                                    <span className="capitalize">{criterion.replace(/_/g, ' ')}</span>
                                    <span className="font-bold">{String(score)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-[10px] text-violet-500 italic">AI suggestion only — verify and adjust before submitting.</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">
                              Grade (0 - {sub.assignment?.maxPoints || 100})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={sub.assignment?.maxPoints || 100}
                              value={gradeInput}
                              onChange={(e) => setGradeInput(Number(e.target.value))}
                              className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Feedback</label>
                            <input
                              type="text"
                              value={feedbackInput}
                              onChange={(e) => setFeedbackInput(e.target.value)}
                              placeholder="Constructive feedback for learner..."
                              className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={savingGrade}
                            onClick={() => handleGradeSubmission(sub.id)}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                          >
                            {savingGrade ? 'Saving Grade...' : 'Save Grade & Feedback'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAiFeedbackSub(sub);
                              setShowFeedbackModal(true);
                            }}
                            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>AI Feedback Assistant</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionId(null)}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmissionId(sub.id);
                            setGradeInput(sub.assignment?.maxPoints ? Math.round(sub.assignment.maxPoints * 0.9) : 90);
                            setFeedbackInput('Well implemented. Demonstrates clear engineering understanding.');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                        >
                          Grade This Submission
                        </button>
                        <button
                          type="button"
                          disabled={aiGradeDraftLoading === sub.id}
                          onClick={() => {
                            setSelectedSubmissionId(sub.id);
                            setGradeInput(sub.assignment?.maxPoints ? Math.round(sub.assignment.maxPoints * 0.9) : 90);
                            setFeedbackInput('');
                            handleGenerateAiGradeDraft(sub.id);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                          <span>{aiGradeDraftLoading === sub.id ? 'Analyzing...' : 'AI Grade Assistant'}</span>
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: COMPETENCY EVALUATION */}
        {activeTab === 'competencies' && (
          <Card className="p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Competency Evaluation Bench</h2>
              <p className="text-xs text-slate-500">
                Authoritative evaluation of student technical competencies tied to active academic coursework.
              </p>
            </div>

            <form onSubmit={handleEvaluateCompetencySubmit} className="space-y-4 max-w-xl text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Student *</label>
                <select
                  required
                  value={evalStudentId}
                  onChange={(e) => setEvalStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="">-- Choose enrolled learner --</option>
                  {(currentCohort?.studentProfiles || []).map((sp: any) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.user?.firstName} {sp.user?.lastName} ({sp.studentIdNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Competency Name / Skill Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COMP-SW-01 or Full-Stack REST API Architecture"
                  value={evalCompetencyId}
                  onChange={(e) => setEvalCompetencyId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Competency Status *</label>
                  <select
                    value={evalStatus}
                    onChange={(e) => setEvalStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="ACQUIRED">ACQUIRED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="NEEDS_PRACTICE">NEEDS_PRACTICE</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Score (0 - 100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={evalScore}
                    onChange={(e) => setEvalScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Faculty Evidence & Observations</label>
                <textarea
                  rows={3}
                  placeholder="Notes on student code implementation, lab participation, and test cases..."
                  value={evalEvidence}
                  onChange={(e) => setEvalEvidence(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={evaluatingComp}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {evaluatingComp ? 'Saving Evaluation...' : 'Submit Competency Evaluation'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB: CURRICULUM & COURSE MATERIALS */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Curriculum & Learning Content</h2>
                <p className="text-xs text-slate-500">
                  Inspect the academic structure, modules, lessons, video lectures, and practical activities for your classes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Active Cohort:</span>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800"
                >
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.levelCode?.replace(/_/g, ' ') || 'Foundation'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentCohort && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20">
                    {currentCohort.program?.school?.name || 'STEMPACT Academy'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    {currentCohort.levelCode?.replace(/_/g, ' ') || 'Level 1 Foundation'}
                  </span>
                  {currentCohort.learningCenter && (
                    <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {currentCohort.learningCenter.name}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black">{currentCohort.program?.name || currentCohort.name}</h3>
                <p className="text-xs text-slate-300 max-w-3xl">
                  {currentCohort.program?.description || 'Comprehensive industry-aligned STEM training track.'}
                </p>
              </div>
            )}

            {currentCohort?.curriculumVersion?.courses && currentCohort.curriculumVersion.courses.length > 0 ? (
              <div className="space-y-6">
                {currentCohort.curriculumVersion.courses.map((course: any, cIdx: number) => (
                  <div key={course.id || cIdx} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {course.code || `CRS-${cIdx + 1}`}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1">{course.title}</h4>
                        <p className="text-xs text-slate-500">{course.description}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 shrink-0">
                        {course.modules?.length || 0} Modules
                      </span>
                    </div>

                    <div className="space-y-4 pt-2">
                      {course.modules?.map((mod: any, mIdx: number) => (
                        <div key={mod.id || mIdx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {mIdx + 1}
                              </span>
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs">{mod.title}</h5>
                                <p className="text-[10px] text-slate-400">{mod.durationHours || 12} contact hours</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {mod.lessons?.length || 0} Lessons
                            </span>
                          </div>

                          {mod.lessons && mod.lessons.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {mod.lessons.map((les: any, lIdx: number) => (
                                <div
                                  key={les.id || lIdx}
                                  className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-blue-400 transition flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-800 truncate">{les.title}</span>
                                      {les.videoUrl && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                                          <Play className="w-2.5 h-2.5" /> Video
                                        </span>
                                      )}
                                      {les.interactiveLabType && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-50 text-purple-700">
                                          {les.interactiveLabType}
                                        </span>
                                      )}
                                    </div>
                                    {les.videoDurationMin && (
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        Duration: {les.videoDurationMin} mins
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLesson(les)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                      title="Preview Lesson & Video"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSessionTopic(les.title);
                                        setShowLessonPlanModal(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer"
                                      title="Generate AI Lesson Plan"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-white">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No Curriculum Modules Configured</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This cohort currently uses standard syllabus milestones. Course modules will appear here as they are published by the Academic Administrator.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: CAPSTONE PROJECTS DESK */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Capstone Projects Studio</h2>
                <p className="text-xs text-slate-500">
                  Review student capstone projects, inspect GitHub repositories, verify live deployment links, and evaluate final project submissions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Cohort:</span>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800"
                >
                  <option value="">All My Cohorts</option>
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const projectsToDisplay = (cohorts || []).flatMap((c: any) => {
                if (selectedCohortId && c.id !== selectedCohortId) return [];
                return (c.projects || []).map((p: any) => ({ ...p, cohortName: c.name }));
              });

              if (projectsToDisplay.length === 0) {
                return (
                  <div className="p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-white">
                    <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-700 text-sm">No Capstone Projects Logged</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Student teams in your assigned cohorts have not initiated capstone project submissions yet.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectsToDisplay.map((proj: any) => {
                    const isEvaluating = selectedProjectId === proj.id;
                    return (
                      <div
                        key={proj.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 uppercase px-2 py-0.5 rounded-md bg-blue-50">
                                {proj.cohortName}
                              </span>
                              <h3 className="font-black text-slate-900 text-sm mt-1">{proj.title}</h3>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                proj.status === 'EVALUATED' || proj.score !== null
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : proj.status === 'SUBMITTED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {proj.score !== null && proj.score !== undefined
                                ? `Score: ${proj.score}%`
                                : proj.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2">
                            {proj.description || 'Hands-on practical capstone project submission.'}
                          </p>

                          {proj.members && proj.members.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-slate-400">Team Members:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {proj.members.map((m: any, mIdx: number) => (
                                  <span
                                    key={m.id || mIdx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700"
                                  >
                                    {m.student?.user?.firstName} {m.student?.user?.lastName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-1 text-xs">
                            {proj.githubUrl && (
                              <a
                                href={proj.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>GitHub Repository</span>
                              </a>
                            )}
                            {proj.liveDemoUrl && (
                              <a
                                href={proj.liveDemoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Live Demo</span>
                              </a>
                            )}
                          </div>

                          {proj.feedback && !isEvaluating && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                              <strong className="text-slate-800">Faculty Evaluation:</strong> {proj.feedback}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          {isEvaluating ? (
                            <div className="space-y-3 p-4 rounded-xl bg-purple-50/50 border border-purple-200">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-purple-900">Project Evaluation Desk</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProjectId(null)}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-700">Final Score (0 - 100):</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={projectScore}
                                  onChange={(e) => setProjectScore(Number(e.target.value))}
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-700">Qualitative Rubric Feedback:</label>
                                <textarea
                                  rows={3}
                                  placeholder="Provide detailed feedback on architecture, UI/UX, code clarity, and execution..."
                                  value={projectFeedback}
                                  onChange={(e) => setProjectFeedback(e.target.value)}
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProjectId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={savingProjectEval}
                                  onClick={() => handleEvaluateProject(proj.id)}
                                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                  {savingProjectEval ? 'Submitting...' : 'Save Evaluation'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {proj.updatedAt ? `Updated ${new Date(proj.updatedAt).toLocaleDateString()}` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProjectId(proj.id);
                                  setProjectScore(proj.score ?? 85);
                                  setProjectFeedback(proj.feedback || '');
                                }}
                                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                              >
                                {proj.score !== null && proj.score !== undefined ? 'Re-Evaluate Project' : 'Evaluate Project'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* SCHEDULE NEW SESSION MODAL */}
      {showNewSessionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Schedule Class Session</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSession} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Cohort</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robotics Sensor Calibration Lab"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Start</label>
                  <input
                    type="time"
                    value={newSessionStart}
                    onChange={(e) => setNewSessionStart(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">End</label>
                  <input
                    type="time"
                    value={newSessionEnd}
                    onChange={(e) => setNewSessionEnd(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Topic Covered</label>
                <input
                  type="text"
                  placeholder="e.g. Ultrasonic sensors, PWM signals"
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Room</label>
                  <input
                    type="text"
                    value={newSessionRoom}
                    onChange={(e) => setNewSessionRoom(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={newSessionMeetingUrl}
                    onChange={(e) => setNewSessionMeetingUrl(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSession}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  {creatingSession ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI LESSON PLAN MODAL */}
      <AILessonPlanModal
        isOpen={showLessonPlanModal}
        onClose={() => setShowLessonPlanModal(false)}
        programTitle={currentCohort?.program?.name || currentCohort?.name}
        defaultTopic={sessionTopic || sessionTitle}
      />

      {/* AI CONSTRUCTIVE FEEDBACK MODAL */}
      <AIFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setActiveAiFeedbackSub(null);
        }}
        submissionId={activeAiFeedbackSub?.id}
        studentName={
          activeAiFeedbackSub
            ? `${activeAiFeedbackSub.student?.user?.firstName} ${activeAiFeedbackSub.student?.user?.lastName}`
            : undefined
        }
        assignmentTitle={activeAiFeedbackSub?.assignment?.title}
        submissionContent={activeAiFeedbackSub?.content}
        onApplyFeedback={({ score, comments }) => {
          setGradeInput(score);
          setFeedbackInput(comments);
          setShowFeedbackModal(false);
        }}
      />

      {/* FOCUSED LESSON PREVIEW & VIDEO PLAYER MODAL */}
      {previewLesson && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Lesson Material</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{previewLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            {previewLesson.videoUrl && (() => {
              const getYouTubeId = (url: string): string | null => {
                const patterns = [
                  /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
                ];
                for (const pattern of patterns) {
                  const match = url.match(pattern);
                  if (match) return match[1];
                }
                return null;
              };
              const videoId = getYouTubeId(previewLesson.videoUrl);
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Play className="w-4 h-4 text-rose-600" />
                    <span>Curated Video Lecture</span>
                    {previewLesson.videoDurationMin && (
                      <span className="ml-auto text-slate-400 font-normal">
                        {previewLesson.videoDurationMin} mins
                      </span>
                    )}
                  </div>
                  {videoId ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        title={previewLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
                      />
                    </div>
                  ) : (
                    <a
                      href={previewLesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch External Video Resource
                    </a>
                  )}
                  {previewLesson.videoSummary && (
                    <p className="text-[11px] text-slate-500 leading-relaxed p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <strong className="text-slate-700">Lecture Summary:</strong> {previewLesson.videoSummary}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Instructional Content */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Lesson Content / Overview:</span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {previewLesson.content || 'Content guidelines available in syllabus.'}
              </div>
            </div>

            {/* Resources & Labs */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              {previewLesson.resources ? (
                <a
                  href={previewLesson.resources}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Learning Resources
                </a>
              ) : (
                <span className="text-slate-400">No external links</span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSessionTopic(previewLesson.title);
                  setShowLessonPlanModal(true);
                  setPreviewLesson(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Lesson Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default InstructorPortalPage;
