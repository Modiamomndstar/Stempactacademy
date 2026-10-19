import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ClipboardList,
  Calendar,
  GraduationCap,
  Layers,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Play,
  AlertTriangle,
  Sparkles,
  FileText,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../UIElements';

interface StudentLearningInspectorModalProps {
  studentId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const StudentLearningInspectorModal: React.FC<StudentLearningInspectorModalProps> = ({
  studentId,
  onClose,
  onUpdated,
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'units' | 'assignments' | 'attendance' | 'competencies' | 'readiness'
  >('units');
  const [collapsedUnitIds, setCollapsedUnitIds] = useState<string[]>([]);

  // Inline Competency Evaluation State
  const [evaluatingCompId, setEvaluatingCompId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  // Inline Submission Grading State
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(90);
  const [feedbackValue, setFeedbackValue] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState<boolean>(false);

  const fetchLearningProfile = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getStudentLearningProfile(id);
      setProfile(res?.profile || res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load student learning profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchLearningProfile(studentId);
    } else {
      setProfile(null);
    }
  }, [studentId]);

  if (!studentId) return null;

  const handleQuickCompetencyEval = async (
    competencyId: string,
    status: 'ACQUIRED' | 'IN_PROGRESS' | 'NEEDS_PRACTICE'
  ) => {
    if (!profile?.student?.id) return;
    setEvaluatingCompId(competencyId);
    setActionMsg('');
    try {
      await api.evaluateCompetency({
        studentId: profile.student.id,
        competencyId,
        status,
        score: status === 'ACQUIRED' ? 95 : status === 'IN_PROGRESS' ? 70 : 45,
        evidenceNotes: `Evaluated via Student Learning Inspector (${status})`,
      });
      setActionMsg('Competency evaluation updated.');
      await fetchLearningProfile(profile.student.id);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Failed to evaluate competency.');
    } finally {
      setEvaluatingCompId(null);
    }
  };

  const handleQuickGradeSave = async (submissionId: string) => {
    if (!profile?.student?.id) return;
    setSavingGrade(true);
    setActionMsg('');
    try {
      await api.gradeSubmission(submissionId, {
        grade: Number(gradeValue),
        feedback: feedbackValue || 'Reviewed and graded via Student Learning Inspector.',
      });
      setActionMsg('Assignment grade saved and progress recalculated.');
      setGradingSubId(null);
      await fetchLearningProfile(profile.student.id);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Failed to save grade.');
    } finally {
      setSavingGrade(false);
    }
  };

  const toggleUnit = (unitId: string) => {
    setCollapsedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {loading && !profile ? (
          <div className="p-16 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Loading Student Learning & Academic Progress Dossier...
            </p>
          </div>
        ) : error && !profile ? (
          <div className="p-12 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Top Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 relative shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-10">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl font-black shrink-0">
                    {profile.student?.firstName?.[0]}
                    {profile.student?.lastName?.[0]}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white">
                        {profile.student?.fullName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/15 text-indigo-200 border border-white/15">
                        {profile.student?.studentIdNumber}
                      </span>
                      <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-400/20 text-amber-200 border border-amber-400/30 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {profile.student?.levelDisplayName || profile.student?.levelCode?.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {profile.student?.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-300" />
                        {profile.student?.email}
                      </span>
                      {profile.student?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-indigo-300" />
                          {profile.student?.phone}
                        </span>
                      )}
                      {profile.program && (
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                          {profile.program.name}
                        </span>
                      )}
                      {profile.cohort && (
                        <span className="flex items-center gap-1 text-indigo-200">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                          Section: <strong>{profile.cohort.name}</strong> ({profile.cohort.cohortCode})
                        </span>
                      )}
                      {profile.cohort?.learningCenter?.name && (
                        <span className="flex items-center gap-1 text-emerald-200">
                          <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                          {profile.cohort.learningCenter.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Lessons Completed
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-white">
                      {profile.metrics?.completedLessons || 0} / {profile.metrics?.totalLessons || 0}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {profile.metrics?.syllabusProgressPercentage || 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${profile.metrics?.syllabusProgressPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Units Completed
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-white">
                      {profile.metrics?.completedUnits || 0} / {profile.metrics?.totalUnits || 0}
                    </span>
                    <span className="text-xs font-semibold text-indigo-200">UoPeople Units</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Intro + Weekly Units + Final Project
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Attendance & Labs
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-emerald-300">
                      {profile.metrics?.attendanceRate ?? 100}%
                    </span>
                    <span className="text-xs text-slate-300">
                      {profile.metrics?.attendedSessions || 0}/{profile.metrics?.totalSessions || 0} Sessions
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Coursework: {profile.metrics?.completedAssignments || 0}/
                    {profile.metrics?.totalAssignments || 0} submitted
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Overall Completion
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-white">
                      {profile.metrics?.completionRate ?? 0}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        profile.readinessReport?.evaluation?.isPolicyMet
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : 'bg-amber-500/30 text-amber-200'
                      }`}
                    >
                      {profile.readinessReport?.evaluation?.isPolicyMet ? 'CERT ELIGIBLE' : 'IN PROGRESS'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Skills: {profile.metrics?.achievedCompetencies || 0}/
                    {profile.metrics?.totalCompetencies || 0} acquired
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-white/10 text-xs">
                {[
                  {
                    id: 'units',
                    label: `Units & Lessons (${profile.metrics?.completedLessons || 0}/${profile.metrics?.totalLessons || 0})`,
                    icon: BookOpen,
                  },
                  {
                    id: 'assignments',
                    label: `Assignments & Grades (${profile.assignments?.length || 0})`,
                    icon: ClipboardList,
                  },
                  {
                    id: 'attendance',
                    label: `Attendance Log (${profile.attendances?.length || 0})`,
                    icon: Calendar,
                  },
                  {
                    id: 'competencies',
                    label: `Competencies (${profile.metrics?.achievedCompetencies || 0}/${profile.metrics?.totalCompetencies || 0})`,
                    icon: Sparkles,
                  },
                  {
                    id: 'readiness',
                    label: 'Level Completion & Certificate Gate',
                    icon: Award,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action / Feedback Banner */}
            {(actionMsg || error) && (
              <div
                className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
                  error ? 'bg-rose-50 text-rose-700 border-b border-rose-200' : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                }`}
              >
                <span>{error || actionMsg}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActionMsg('');
                    setError('');
                  }}
                  className="text-xs underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60 text-xs text-slate-700">
              {/* TAB 1: UNITS & LESSONS PROGRESS */}
              {activeTab === 'units' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Unit-by-Unit & Lesson-by-Lesson Learning Tracker
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Inspect which Course Introduction sections, Weekly Learning Units, Self-Quizzes, and Final Level Project steps {profile.student?.firstName} has completed.
                      </p>
                    </div>
                    {profile.units && profile.units.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = profile.units.map((u: any) => u.id);
                          const allCollapsed = allIds.every((id: string) => collapsedUnitIds.includes(id));
                          setCollapsedUnitIds(allCollapsed ? [] : allIds);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] shrink-0 cursor-pointer"
                      >
                        {profile.units.every((u: any) => collapsedUnitIds.includes(u.id))
                          ? 'Expand All Units'
                          : 'Collapse All Units'}
                      </button>
                    )}
                  </div>

                  {profile.units && profile.units.length > 0 ? (
                    <div className="space-y-3">
                      {profile.units.map((unit: any, uIdx: number) => {
                        const isCollapsed = collapsedUnitIds.includes(unit.id);
                        const isIntro = uIdx === 0 || /course\s*introduction/i.test(unit.title);
                        const isFinalProject = /final\s*level\s*project|certificate/i.test(unit.title);

                        return (
                          <div
                            key={unit.id}
                            className={`rounded-2xl border bg-white overflow-hidden shadow-2xs ${
                              unit.isCompleted
                                ? 'border-emerald-300'
                                : isIntro
                                ? 'border-indigo-200'
                                : isFinalProject
                                ? 'border-amber-300'
                                : 'border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleUnit(unit.id)}
                              className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                    unit.isCompleted
                                      ? 'bg-emerald-600 text-white'
                                      : isIntro
                                      ? 'bg-indigo-600 text-white'
                                      : isFinalProject
                                      ? 'bg-amber-500 text-slate-950'
                                      : 'bg-slate-900 text-white'
                                  }`}
                                >
                                  {unit.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : isIntro ? (
                                    'IN'
                                  ) : isFinalProject ? (
                                    'PR'
                                  ) : (
                                    `U${uIdx}`
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-black text-slate-900 truncate">
                                      {unit.title}
                                    </h4>
                                    {unit.isCompleted && (
                                      <Badge variant="green">Unit Completed</Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {unit.completedLessons} of {unit.totalLessons} Lessons Completed ({unit.progressPercentage}%)
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="hidden sm:block w-28">
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        unit.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                                      }`}
                                      style={{ width: `${unit.progressPercentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </button>

                            {!isCollapsed && (
                              <div className="border-t border-slate-100 divide-y divide-slate-100">
                                {(unit.lessons || []).map((lesson: any, lIdx: number) => {
                                  const isDone = lesson.status === 'COMPLETED';
                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`px-4 py-3 flex items-center justify-between gap-3 ${
                                        isDone ? 'bg-emerald-50/30' : 'bg-white'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            isDone
                                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                              : 'bg-slate-100 text-slate-500'
                                          }`}
                                        >
                                          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : lIdx + 1}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-slate-800 truncate">
                                            {lesson.title}
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                            <span className="uppercase font-semibold text-indigo-600">
                                              {lesson.interactiveLabType || 'LESSON'}
                                            </span>
                                            {lesson.hasVideo && (
                                              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                                                <Play className="w-2.5 h-2.5" />
                                                Video ({lesson.videoDurationMin || 15}m)
                                              </span>
                                            )}
                                            {lesson.timeSpentMin > 0 && (
                                              <span>• Time spent: {lesson.timeSpentMin} min</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="shrink-0 text-right">
                                        {isDone ? (
                                          <div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                              <CheckCircle2 className="w-3 h-3" /> Completed
                                            </span>
                                            {lesson.completedAt && (
                                              <div className="text-[10px] text-slate-400 mt-0.5">
                                                {new Date(lesson.completedAt).toLocaleDateString('en-GB')}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                            <Clock className="w-3 h-3" /> Not Started
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                      No curriculum units found for this student&apos;s level yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ASSIGNMENTS & SUBMISSIONS */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-black text-slate-900">
                      Coursework Assignments & Submissions
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Review submitted assignments, attachments, scores, and grade pending work directly.
                    </p>
                  </div>

                  {profile.assignments && profile.assignments.length > 0 ? (
                    <div className="space-y-3">
                      {profile.assignments.map((item: any) => (
                        <div
                          key={item.assignmentId}
                          className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                <Badge
                                  variant={
                                    item.status === 'GRADED'
                                      ? 'green'
                                      : item.status === 'SUBMITTED'
                                      ? 'blue'
                                      : 'amber'
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-slate-900">
                                {item.grade !== null && item.grade !== undefined
                                  ? `${item.grade} / ${item.maxPoints} pts`
                                  : `Max ${item.maxPoints} pts`}
                              </span>
                              {item.dueDate && (
                                <div className="text-[10px] text-slate-400">
                                  Due: {new Date(item.dueDate).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.submissionId ? (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span className="font-bold text-slate-700">Student Submission:</span>
                                {item.submittedAt && (
                                  <span>
                                    Submitted {new Date(item.submittedAt).toLocaleString('en-GB')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-800 whitespace-pre-wrap">
                                {item.content || 'No text content provided.'}
                              </p>
                              {item.attachmentUrl && (
                                <a
                                  href={item.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open Submitted Evidence / Link</span>
                                </a>
                              )}
                              {item.feedback && (
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                                  <strong>Instructor Feedback:</strong> {item.feedback}
                                </div>
                              )}

                              {gradingSubId === item.submissionId ? (
                                <div className="pt-2 border-t border-slate-200 space-y-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-600 block">
                                        Score (out of {item.maxPoints})
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={item.maxPoints}
                                        value={gradeValue}
                                        onChange={(e) => setGradeValue(Number(e.target.value))}
                                        className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-[10px] font-bold text-slate-600 block">
                                        Constructive Feedback
                                      </label>
                                      <input
                                        type="text"
                                        value={feedbackValue}
                                        onChange={(e) => setFeedbackValue(e.target.value)}
                                        placeholder="Enter evaluation feedback..."
                                        className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setGradingSubId(null)}
                                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingGrade}
                                      onClick={() => handleQuickGradeSave(item.submissionId)}
                                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                                    >
                                      {savingGrade ? 'Saving...' : 'Save Grade'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGradingSubId(item.submissionId);
                                      setGradeValue(item.grade ?? Math.round((item.maxPoints || 100) * 0.85));
                                      setFeedbackValue(item.feedback || '');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    {item.grade !== null ? 'Update Grade' : 'Grade Submission'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                              Student has not submitted this assignment yet.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                      No cohort assignments published yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ATTENDANCE LOG */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Scheduled Class Sessions & Attendance Record
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Overall Attendance Rate: <strong>{profile.metrics?.attendanceRate ?? 100}%</strong> ({profile.metrics?.attendedSessions || 0} of {profile.metrics?.totalSessions || 0} cohort sessions attended)
                      </p>
                    </div>
                  </div>

                  {profile.attendances && profile.attendances.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                          <tr>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Session Title & Topic</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.attendances.map((att: any) => (
                            <tr key={att.id}>
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {att.sessionDate ? new Date(att.sessionDate).toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{att.sessionTitle}</div>
                                {att.sessionTopic && (
                                  <div className="text-[11px] text-slate-500">{att.sessionTopic}</div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={
                                    att.status === 'PRESENT'
                                      ? 'green'
                                      : att.status === 'LATE'
                                      ? 'amber'
                                      : 'red'
                                  }
                                >
                                  {att.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-slate-500">{att.remarks || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                      No attendance records logged for this student yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COMPETENCIES & SKILLS */}
              {activeTab === 'competencies' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-black text-slate-900">
                      Competency Mastery & Practical Skill Verification
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Evaluate and certify the student&apos;s technical competencies for {profile.student?.levelDisplayName}.
                    </p>
                  </div>

                  {profile.competencies && profile.competencies.length > 0 ? (
                    <div className="space-y-3">
                      {profile.competencies.map((comp: any) => (
                        <div
                          key={comp.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {comp.code && (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {comp.code}
                                </span>
                              )}
                              <h4 className="text-sm font-bold text-slate-900">{comp.name}</h4>
                              <Badge
                                variant={
                                  comp.status === 'ACQUIRED'
                                    ? 'green'
                                    : comp.status === 'IN_PROGRESS'
                                    ? 'blue'
                                    : comp.status === 'NEEDS_PRACTICE'
                                    ? 'amber'
                                    : 'slate'
                                }
                              >
                                {comp.status?.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500">{comp.description}</p>
                            {comp.evidenceNotes && (
                              <p className="text-[10px] text-indigo-600 font-medium">
                                Note: {comp.evidenceNotes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <button
                              type="button"
                              disabled={evaluatingCompId === comp.id}
                              onClick={() => handleQuickCompetencyEval(comp.id, 'ACQUIRED')}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                comp.status === 'ACQUIRED'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              Acquired
                            </button>
                            <button
                              type="button"
                              disabled={evaluatingCompId === comp.id}
                              onClick={() => handleQuickCompetencyEval(comp.id, 'IN_PROGRESS')}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                comp.status === 'IN_PROGRESS'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                              }`}
                            >
                              In Progress
                            </button>
                            <button
                              type="button"
                              disabled={evaluatingCompId === comp.id}
                              onClick={() => handleQuickCompetencyEval(comp.id, 'NEEDS_PRACTICE')}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                comp.status === 'NEEDS_PRACTICE'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              Needs Practice
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                      No specific competency items registered for this program version.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: COMPLETION READINESS & CERTIFICATE GATE */}
              {activeTab === 'readiness' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>
                            {profile.readinessReport?.institutionalPolicy?.policyName ||
                              'STEMPACT Academic Council Completion Readiness'}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {profile.readinessReport?.institutionalPolicy?.notes}
                        </p>
                      </div>
                      <Badge
                        variant={
                          profile.readinessReport?.evaluation?.isPolicyMet ? 'green' : 'amber'
                        }
                      >
                        {profile.readinessReport?.evaluation?.status || 'IN PROGRESS'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Lesson Completion Gate (Min 90%)
                        </div>
                        <div className="text-lg font-black text-slate-900 mt-1">
                          {profile.metrics?.syllabusProgressPercentage || 0}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {profile.metrics?.completedLessons || 0} of {profile.metrics?.totalLessons || 0} lessons completed
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Attendance Gate (Min 75%)
                        </div>
                        <div className="text-lg font-black text-slate-900 mt-1">
                          {profile.metrics?.attendanceRate ?? 100}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {profile.metrics?.attendedSessions || 0} of {profile.metrics?.totalSessions || 0} sessions attended
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Assignment Passing Gate (Min 50%)
                        </div>
                        <div className="text-lg font-black text-slate-900 mt-1">
                          {profile.metrics?.averageAssignmentGrade !== null &&
                          profile.metrics?.averageAssignmentGrade !== undefined
                            ? `${profile.metrics.averageAssignmentGrade}%`
                            : 'No Graded Work Yet'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {profile.metrics?.completedAssignments || 0} of {profile.metrics?.totalAssignments || 0} assignments submitted
                        </div>
                      </div>
                    </div>

                    {profile.readinessReport?.evaluation?.deficits?.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Remaining Requirements Before Certificate Issuance:</span>
                        </div>
                        <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-1">
                          {profile.readinessReport.evaluation.deficits.map(
                            (def: string, idx: number) => (
                              <li key={idx}>{def}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Issued Certificates */}
                    {profile.certificates && profile.certificates.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-800">Issued Certificates</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profile.certificates.map((cert: any) => (
                            <div
                              key={cert.id}
                              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-emerald-950">
                                  {cert.certificateNumber}
                                </div>
                                <div className="text-[10px] text-emerald-700">
                                  Issued {new Date(cert.issueDate).toLocaleDateString('en-GB')}
                                </div>
                              </div>
                              <Badge variant="green">{cert.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                STEMPACT Academic Delivery & Student Learning Inspector • Synchronized across Student, Instructor & Admin Portals
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
