import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge, Card, LoadingSpinner } from '../UIElements';
import {
  X,
  BookOpen,
  Calendar,
  Layers,
  Award,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Wrench,
  GraduationCap,
} from 'lucide-react';

interface ProgramDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  programIdOrCode: string;
  onProgramUpdated?: () => void;
  isAcademicOrSuperAdmin?: boolean;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  isOpen,
  onClose,
  programIdOrCode,
  onProgramUpdated,
  isAcademicOrSuperAdmin = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [program, setProgram] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'cohorts' | 'commercials' | 'competencies'>('curriculum');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadProgramDetail = async () => {
    if (!programIdOrCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getProgramByCode(programIdOrCode);
      setProgram(res.program);
      // Auto-expand first course and its first module by default
      const courses =
        res.program?.versions?.[0]?.curriculumVersion?.courses ||
        res.program?.courses ||
        [];
      if (courses.length > 0) {
        const firstCourse = courses[0];
        setExpandedCourses({ [firstCourse.id || 0]: true });
        if (firstCourse.modules && firstCourse.modules.length > 0) {
          setExpandedModules({ [firstCourse.modules[0].id || 0]: true });
        }
      }
    } catch (err: any) {
      console.error('Failed to load program detail:', err);
      setError(err.message || 'Failed to fetch program details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && programIdOrCode) {
      loadProgramDetail();
    } else {
      setProgram(null);
    }
  }, [isOpen, programIdOrCode]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!program) return;
    setUpdatingStatus(true);
    setStatusMessage('');
    try {
      await api.updateProgramStatus(program.id, { status: newStatus });
      setProgram((prev: any) => ({ ...prev, status: newStatus }));
      setStatusMessage(`Status updated to ${newStatus}`);
      if (onProgramUpdated) onProgramUpdated();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update program status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  // Resolve active curriculum version courses or legacy direct courses
  const currentVersion =
    program?.versions?.find((v: any) => v.isCurrent) ||
    program?.versions?.[0] ||
    null;

  const courses =
    currentVersion?.curriculumVersion?.courses ||
    program?.courses ||
    [];

  const cohorts = program?.cohorts || [];
  const competencies = program?.competencyList || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 shrink-0 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                  {program?.code || programIdOrCode}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {program?.school?.name || 'Academic School'}
                </span>
                {currentVersion && (
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    v{currentVersion.versionNumber} {currentVersion.isCurrent ? '(Active Canonical)' : ''}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {program?.name || 'Program Syllabus & Detail'}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl line-clamp-2">
                {program?.description}
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

          {/* Quick Status Control Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Catalog Status:</span>
              {isAcademicOrSuperAdmin ? (
                <select
                  value={program?.status || 'OPEN_FOR_APPLICATION'}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="OPEN_FOR_APPLICATION">OPEN FOR APPLICATION</option>
                  <option value="FULL">FULL</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              ) : (
                <Badge variant="blue">{program?.status}</Badge>
              )}
              {statusMessage && (
                <span className="text-emerald-400 font-semibold animate-pulse">
                  ✓ {statusMessage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <span>Duration: <strong>{program?.durationWeeks || 12} Weeks</strong></span>
              <span>•</span>
              <span>Level: <strong>{program?.level || 'Industry Ready'}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses & Lessons ({courses.length} Courses)</span>
          </button>

          <button
            onClick={() => setActiveTab('cohorts')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'cohorts'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Active Cohorts ({cohorts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('commercials')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'commercials'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Fees & Commercial Terms</span>
          </button>

          <button
            onClick={() => setActiveTab('competencies')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'competencies'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Competencies & Toolchains</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <LoadingSpinner message="Resolving canonical program architecture & lesson tree..." />
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: CURRICULUM, COURSES & LESSONS */}
              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">
                      Full Academic Syllabus Tree (Course → Modules → Lessons & Practicals)
                    </span>
                    <span className="font-mono">
                      {courses.reduce((acc: number, c: any) => acc + (c.modules?.length || 0), 0)} Modules Total
                    </span>
                  </div>

                  {courses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700">No canonical courses linked to this program yet.</p>
                      <p className="text-[11px]">Use the AI Curriculum Architect to draft structured course syllabi.</p>
                    </div>
                  ) : (
                    courses.map((course: any, cIdx: number) => {
                      const courseId = course.id || `course-${cIdx}`;
                      const isCourseOpen = !!expandedCourses[courseId];
                      const modules = course.modules || [];

                      return (
                        <div
                          key={courseId}
                          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden"
                        >
                          {/* Course Bar */}
                          <button
                            type="button"
                            onClick={() => toggleCourse(courseId)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 flex items-center justify-between transition text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {cIdx + 1}
                              </span>
                              <div>
                                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {course.code || `COURSE-${cIdx + 1}`}
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {course.title}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                                {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
                              </span>
                              {course.credits && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                  {course.credits} Credits
                                </span>
                              )}
                              {isCourseOpen ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Modules List */}
                          {isCourseOpen && (
                            <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                              {modules.length === 0 ? (
                                <p className="text-xs text-slate-400 italic p-2">No modules defined under this course.</p>
                              ) : (
                                modules.map((mod: any, mIdx: number) => {
                                  const modId = mod.id || `mod-${mIdx}`;
                                  const isModOpen = !!expandedModules[modId];
                                  const lessons = mod.lessons || [];
                                  const practicals = mod.practicalActivities || [];

                                  return (
                                    <div
                                      key={modId}
                                      className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden"
                                    >
                                      {/* Module Bar */}
                                      <button
                                        type="button"
                                        onClick={() => toggleModule(modId)}
                                        className="w-full p-3 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                                          <div>
                                            <span className="text-[11px] font-bold text-slate-500 uppercase">
                                              Module {mod.orderIndex || mIdx + 1}:
                                            </span>
                                            <strong className="text-xs text-slate-900 dark:text-white ml-1.5">
                                              {mod.title}
                                            </strong>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-500 font-medium">
                                            {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
                                          </span>
                                          {isModOpen ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                          )}
                                        </div>
                                      </button>

                                      {/* Module Description & Lessons */}
                                      {isModOpen && (
                                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                                          {mod.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pb-1">
                                              {mod.description}
                                            </p>
                                          )}

                                          {/* Lessons List */}
                                          {lessons.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Individual Lesson Units ({lessons.length}):
                                              </span>
                                              <div className="grid grid-cols-1 gap-1.5">
                                                {lessons.map((lesson: any, lIdx: number) => (
                                                  <div
                                                    key={lesson.id || lIdx}
                                                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                                                  >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                                                        {lIdx + 1}
                                                      </span>
                                                      <div className="truncate">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                                                          {lesson.title}
                                                        </span>
                                                        {lesson.summary && (
                                                          <span className="text-[10px] text-slate-500 block truncate">
                                                            {lesson.summary}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span>{lesson.durationMinutes || 45} mins</span>
                                                      </span>
                                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                        {lesson.type || 'PRACTICUM'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Practical Activities */}
                                          {practicals.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                                                Lab Practicum & Challenges ({practicals.length}):
                                              </span>
                                              <div className="grid grid-cols-1 gap-1.5">
                                                {practicals.map((act: any, aIdx: number) => (
                                                  <div
                                                    key={act.id || aIdx}
                                                    className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 text-xs"
                                                  >
                                                    <strong className="text-amber-950 dark:text-amber-200 block">
                                                      ⚡ {act.title}
                                                    </strong>
                                                    {act.description && (
                                                      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                                                        {act.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: COHORTS ACROSS ACADEMIC SESSIONS */}
              {activeTab === 'cohorts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">
                      Running Cohorts for {program?.name}
                    </span>
                    <span className="font-mono">{cohorts.length} Cohorts Found</span>
                  </div>

                  {cohorts.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      No active or scheduled cohorts currently running for this program.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cohorts.map((cohort: any) => (
                        <div
                          key={cohort.id}
                          className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                            <div>
                              <span className="font-mono font-bold text-blue-600 block">
                                {cohort.cohortCode}
                              </span>
                              <strong className="text-slate-900 dark:text-white text-sm">
                                {cohort.name}
                              </strong>
                            </div>
                            <Badge variant={cohort.status === 'OPEN' ? 'green' : 'amber'}>
                              {cohort.status}
                            </Badge>
                          </div>

                          <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                            {cohort.academicSession && (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded-lg">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Academic Session: {cohort.academicSession.name}</span>
                              </div>
                            )}
                            <div><strong>Schedule:</strong> {cohort.schedule}</div>
                            <div><strong>Delivery Mode:</strong> {cohort.mode}</div>
                            <div><strong>Capacity:</strong> {cohort.currentEnrollment} / {cohort.maxCapacity} seats filled</div>
                            <div><strong>Tuition Fee:</strong> ₦{Number(cohort.trainingFee).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FEES & COMMERCIALS */}
              {activeTab === 'commercials' && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Standard Training Fee</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₦{Number(cohorts[0]?.trainingFee || 65000).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500">Per enrolled cohort term</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Admission Registration</span>
                      <div className="text-2xl font-black text-emerald-600">
                        ₦{Number(cohorts[0]?.registrationFee || 5000).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium">Non-refundable application desk</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Certificate Assessment</span>
                      <div className="text-2xl font-black text-blue-600">
                        ₦{Number(cohorts[0]?.certificationFee || 10000).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-blue-600 font-medium">Cap-stone evaluation & credential</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Flexible Payment Structure</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      STEMPACT provides structured installment clearances for this program. Approved learners can settle tuition in three progressive milestones:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <strong className="block text-slate-900 dark:text-white font-bold">Tranche 1: 50%</strong>
                        <span className="text-[11px] text-slate-500">Initial clearance to unlock enrollment ID</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <strong className="block text-slate-900 dark:text-white font-bold">Tranche 2: 30%</strong>
                        <span className="text-[11px] text-slate-500">Mid-term curriculum milestone</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <strong className="block text-slate-900 dark:text-white font-bold">Tranche 3: 20%</strong>
                        <span className="text-[11px] text-slate-500">Prior to final capstone & certificate issuance</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COMPETENCIES & TOOLCHAINS */}
              {activeTab === 'competencies' && (
                <div className="space-y-6 text-xs">
                  {/* Tools */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <span>Industry Toolchains & Technologies</span>
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Learners in this program develop deep mastery across standard production tooling:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(program?.tools ? program.tools.split(',') : ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Git', 'TypeScript', 'TailwindCSS']).map((tool: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs"
                        >
                          {tool.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Competency Framework */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Competency Attainment Matrix</span>
                    </h4>
                    {competencies.length === 0 ? (
                      <p className="text-slate-500">Standard modular competencies mapped in relational syllabus.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {competencies.map((comp: any) => (
                          <div
                            key={comp.id}
                            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <strong className="text-slate-900 dark:text-white">{comp.title}</strong>
                              <span className="text-[10px] font-bold text-blue-600">{comp.category || 'TECHNICAL'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">{comp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
