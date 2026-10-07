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
  Play,
  Video,
  Edit2,
  Link2,
  RotateCw,
  Trash2,
  Check,
  Eye,
} from 'lucide-react';

interface ProgramDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  programIdOrCode: string;
  onProgramUpdated?: () => void;
  isAcademicOrSuperAdmin?: boolean;
}

export const extractYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

export interface VideoPlayerInfo {
  type: 'youtube' | 'gdrive' | 'vimeo' | 'direct' | 'external';
  embedUrl: string;
  isDirectVideo: boolean;
  label: string;
}

export const getVideoPlayerInfo = (url?: string | null): VideoPlayerInfo | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      isDirectVideo: false,
      label: 'YouTube Embed',
    };
  }

  // 2. Google Drive video share link: /file/d/{ID}/view -> /file/d/{ID}/preview
  const gDriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`,
      isDirectVideo: false,
      label: 'Google Drive Stream',
    };
  }

  // 3. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      isDirectVideo: false,
      label: 'Vimeo Video',
    };
  }

  // 4. Direct video file (Cloudflare R2, AWS S3, MP4, WebM)
  const isDirect = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed) || trimmed.includes('.r2.dev') || trimmed.includes('r2.cloudflarestorage.com');
  if (isDirect) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      isDirectVideo: true,
      label: 'Direct Storage / R2 Video',
    };
  }

  // 5. External URL
  return {
    type: 'external',
    embedUrl: trimmed,
    isDirectVideo: false,
    label: 'External Video',
  };
};

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

  // Video Inspection, Playback & Manual Embed Editor State
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [videoEditForm, setVideoEditForm] = useState<{
    videoUrl: string;
    videoDurationMin: number | '';
    videoSummary: string;
  }>({ videoUrl: '', videoDurationMin: 15, videoSummary: '' });
  const [savingVideo, setSavingVideo] = useState(false);
  const [curatingAllVideos, setCuratingAllVideos] = useState(false);
  const [curatingLessonId, setCuratingLessonId] = useState<string | null>(null);
  const [curateSuccessMessage, setCurateSuccessMessage] = useState<string>('');

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

  // Helper to update a lesson in local state recursively
  const updateLessonInLocalState = (lessonId: string, updates: any) => {
    setProgram((prev: any) => {
      if (!prev) return prev;
      const updateModules = (modules: any[]) =>
        modules.map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l: any) =>
            l.id === lessonId ? { ...l, ...updates } : l
          ),
        }));

      const updateCourses = (courses: any[]) =>
        courses.map((c) => ({
          ...c,
          modules: updateModules(c.modules || []),
        }));

      const newProg = { ...prev };
      if (newProg.courses) {
        newProg.courses = updateCourses(newProg.courses);
      }
      if (newProg.versions && newProg.versions.length > 0) {
        newProg.versions = newProg.versions.map((v: any) => {
          if (v.curriculumVersion?.courses) {
            return {
              ...v,
              curriculumVersion: {
                ...v.curriculumVersion,
                courses: updateCourses(v.curriculumVersion.courses),
              },
            };
          }
          return v;
        });
      }
      return newProg;
    });
  };

  const handleOpenVideoPreview = (lesson: any) => {
    setPreviewLesson(lesson);
  };

  const handleOpenVideoEditor = (lesson: any) => {
    setEditingLesson(lesson);
    setVideoEditForm({
      videoUrl: lesson.videoUrl || '',
      videoDurationMin: lesson.videoDurationMin || 15,
      videoSummary: lesson.videoSummary || '',
    });
  };

  const handleSaveLessonVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    setSavingVideo(true);
    try {
      const playerInfo = getVideoPlayerInfo(videoEditForm.videoUrl);
      const cleanUrl = playerInfo
        ? playerInfo.embedUrl
        : (videoEditForm.videoUrl ? videoEditForm.videoUrl.trim() : null);

      await api.updateLessonVideo(editingLesson.id, {
        videoUrl: cleanUrl,
        videoDurationMin: videoEditForm.videoDurationMin ? Number(videoEditForm.videoDurationMin) : null,
        videoSummary: videoEditForm.videoSummary ? videoEditForm.videoSummary.trim() : null,
      });

      updateLessonInLocalState(editingLesson.id, {
        videoUrl: cleanUrl,
        videoDurationMin: videoEditForm.videoDurationMin ? Number(videoEditForm.videoDurationMin) : null,
        videoSummary: videoEditForm.videoSummary,
      });

      if (previewLesson && previewLesson.id === editingLesson.id) {
        setPreviewLesson((prev: any) => prev ? {
          ...prev,
          videoUrl: cleanUrl,
          videoDurationMin: videoEditForm.videoDurationMin,
          videoSummary: videoEditForm.videoSummary,
        } : null);
      }

      setCurateSuccessMessage(`Video tutorial embed updated for "${editingLesson.title}".`);
      setTimeout(() => setCurateSuccessMessage(''), 4000);
      setEditingLesson(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update lesson video embed');
    } finally {
      setSavingVideo(false);
    }
  };

  const handleCurateSingleLesson = async (lesson: any) => {
    setCuratingLessonId(lesson.id);
    try {
      const res = await api.curateSingleLessonVideo(lesson.id);
      const curated = res.result;
      updateLessonInLocalState(lesson.id, {
        videoUrl: curated.videoUrl,
        videoDurationMin: curated.videoDurationMin,
        videoSummary: curated.videoSummary,
      });
      if (previewLesson && previewLesson.id === lesson.id) {
        setPreviewLesson((prev: any) => prev ? {
          ...prev,
          videoUrl: curated.videoUrl,
          videoDurationMin: curated.videoDurationMin,
          videoSummary: curated.videoSummary,
        } : null);
      }
      setCurateSuccessMessage(`AI Curated video tutorial for "${lesson.title}".`);
      setTimeout(() => setCurateSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to curate video for lesson');
    } finally {
      setCuratingLessonId(null);
    }
  };

  const handleCurateAllVideos = async () => {
    if (!program?.id) return;
    setCuratingAllVideos(true);
    try {
      const res = await api.curateProgramVideos(program.id, { overwrite: true });
      setCurateSuccessMessage(`AI Video Curator dispatched! Curated ${res?.result?.totalCurated || res?.lessonsCount || 0} module lessons with verified YouTube tutorial iframes.`);
      await loadProgramDetail();
      setTimeout(() => setCurateSuccessMessage(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Batch video curation failed');
    } finally {
      setCuratingAllVideos(false);
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
                  {curateSuccessMessage && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{curateSuccessMessage}</span>
                    </div>
                  )}

                  {/* Syllabus Tree Toolbar: Video Curation & Coverage */}
                  {courses.length > 0 && (() => {
                    const allLessons = courses.flatMap((c: any) => (c.modules || []).flatMap((m: any) => m.lessons || []));
                    const lessonsWithVideos = allLessons.filter((l: any) => !!l.videoUrl);
                    const coveragePct = allLessons.length > 0 ? Math.round((lessonsWithVideos.length / allLessons.length) * 100) : 0;

                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              Digital Lecture Coverage
                            </span>
                            <span className="text-xs text-slate-300 font-mono">
                              {lessonsWithVideos.length} / {allLessons.length} Lessons ({coveragePct}%)
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Verified educational video tutorials are embedded directly into student lesson players.
                          </p>
                          <div className="w-full sm:w-64 h-1.5 rounded-full bg-white/10 overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${coveragePct}%` }}
                            />
                          </div>
                        </div>

                        {isAcademicOrSuperAdmin && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={curatingAllVideos || loading}
                              onClick={handleCurateAllVideos}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${curatingAllVideos ? 'animate-spin' : ''}`} />
                              <span>{curatingAllVideos ? 'Curating All Videos...' : coveragePct === 100 ? 'Re-Curate All Videos' : 'AI Curate All Program Videos'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
                                                {lessons.map((lesson: any, lIdx: number) => {
                                                  const hasVideo = !!lesson.videoUrl;
                                                  const isThisCurating = curatingLessonId === lesson.id;

                                                  return (
                                                    <div
                                                      key={lesson.id || lIdx}
                                                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-blue-300 dark:hover:border-blue-700 transition"
                                                    >
                                                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                        <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                                          {lIdx + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                          <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                              {lesson.title}
                                                            </span>

                                                            {/* Video Pill */}
                                                            {hasVideo ? (
                                                              <button
                                                                type="button"
                                                                onClick={() => handleOpenVideoPreview(lesson)}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer"
                                                                title="Click to preview & test play video"
                                                              >
                                                                <Play className="w-2.5 h-2.5 fill-current" />
                                                                <span>Video Lecture ({lesson.videoDurationMin || 15}m)</span>
                                                              </button>
                                                            ) : (
                                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                                <Video className="w-2.5 h-2.5 text-slate-400" />
                                                                <span>No video embed</span>
                                                              </span>
                                                            )}
                                                          </div>

                                                          {lesson.summary && (
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                              {lesson.summary}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>

                                                      {/* Actions Strip */}
                                                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                        {hasVideo && (
                                                          <button
                                                            type="button"
                                                            onClick={() => handleOpenVideoPreview(lesson)}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                                            title="Watch / test play tutorial video"
                                                          >
                                                            <Play className="w-3 h-3 fill-current" />
                                                            <span>Play</span>
                                                          </button>
                                                        )}

                                                        {isAcademicOrSuperAdmin && (
                                                          <>
                                                            <button
                                                              type="button"
                                                              onClick={() => handleOpenVideoEditor(lesson)}
                                                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                                              title={hasVideo ? 'Edit YouTube URL, duration, or summary' : 'Manually embed YouTube video link'}
                                                            >
                                                              <Link2 className="w-3 h-3 text-blue-600" />
                                                              <span>{hasVideo ? 'Edit Video' : 'Embed Video'}</span>
                                                            </button>

                                                            <button
                                                              type="button"
                                                              disabled={isThisCurating}
                                                              onClick={() => handleCurateSingleLesson(lesson)}
                                                              className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                                              title="Use AI to automatically find and embed the best tutorial for this lesson"
                                                            >
                                                              <Sparkles className={`w-3 h-3 text-violet-600 ${isThisCurating ? 'animate-spin' : ''}`} />
                                                              <span>{isThisCurating ? 'Curating...' : hasVideo ? 'AI Re-Curate' : 'AI Curate'}</span>
                                                            </button>
                                                          </>
                                                        )}

                                                        <span className="text-[10px] text-slate-400 font-mono ml-1 hidden sm:inline">
                                                          {lesson.durationMinutes || 45}m
                                                        </span>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
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

      {/* VIDEO PREVIEW MODAL */}
      {previewLesson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-sm text-white truncate">
                    {previewLesson.title}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Video Lecture • {previewLesson.videoDurationMin ? `${previewLesson.videoDurationMin} mins` : 'Estimated 15 mins'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAcademicOrSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenVideoEditor(previewLesson);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Embed</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewLesson(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                  aria-label="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Player & Details */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {(() => {
                const playerInfo = getVideoPlayerInfo(previewLesson.videoUrl);
                if (!playerInfo) {
                  return (
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                      <Video className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">No video tutorial currently embedded for this lesson.</p>
                    </div>
                  );
                }

                if (playerInfo.isDirectVideo) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Play className="w-3.5 h-3.5" />
                        <span>Playing: {playerInfo.label}</span>
                      </div>
                      <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800" style={{ paddingBottom: '56.25%' }}>
                        <video
                          src={playerInfo.embedUrl}
                          controls
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  );
                }

                if (playerInfo.type === 'youtube' || playerInfo.type === 'gdrive' || playerInfo.type === 'vimeo') {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        <Play className="w-3.5 h-3.5" />
                        <span>Source: {playerInfo.label}</span>
                      </div>
                      <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={playerInfo.embedUrl}
                          title={previewLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 0 }}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                    <Video className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        External Video Source:
                      </p>
                      <a
                        href={previewLesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {previewLesson.videoUrl}
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Video Summary */}
              {previewLesson.videoSummary && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Curated Lecture Summary & Concepts</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {previewLesson.videoSummary}
                  </p>
                </div>
              )}

              {/* Instructional Lesson Reading & Study Guide */}
              {previewLesson.content && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Instructional Lesson Reading & Practical Study Guide</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                    {previewLesson.content}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {previewLesson.videoUrl && (
                <a
                  href={
                    previewLesson.videoUrl.includes('embed/')
                      ? `https://www.youtube.com/watch?v=${extractYouTubeId(previewLesson.videoUrl) || ''}`
                      : previewLesson.videoUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open on YouTube</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                className="ml-auto px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL LESSON VIDEO EMBED EDITOR MODAL */}
      {editingLesson && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-sm text-white truncate">
                    Manual Video Embed & Curation
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate">
                    Lesson: {editingLesson.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveLessonVideo} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Video Source URL (YouTube, Google Drive, Cloudflare R2 / MP4, Vimeo) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Supports YouTube, Drive preview, Vimeo & MP4</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. YouTube watch link, Google Drive share link, or Cloudflare R2 .mp4 URL"
                  value={videoEditForm.videoUrl}
                  onChange={(e) => setVideoEditForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Preview If Valid Video Format */}
              {(() => {
                const liveInfo = getVideoPlayerInfo(videoEditForm.videoUrl);
                if (!liveInfo) return null;

                if (liveInfo.isDirectVideo) {
                  return (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Valid Direct Video File (Cloudflare R2 / MP4 Storage)</span>
                      </div>
                      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '45%' }}>
                        <video
                          src={liveInfo.embedUrl}
                          controls
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  );
                }

                if (liveInfo.type === 'youtube' || liveInfo.type === 'gdrive' || liveInfo.type === 'vimeo') {
                  return (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Valid {liveInfo.label} Stream Detected</span>
                      </div>
                      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '45%' }}>
                        <iframe
                          src={liveInfo.embedUrl}
                          title="Live Preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 0 }}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400">
                    ℹ️ Custom video URL detected ({liveInfo.embedUrl}). Will be linked directly in student portal.
                  </p>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Estimated Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    placeholder="15"
                    value={videoEditForm.videoDurationMin}
                    onChange={(e) => setVideoEditForm((prev) => ({ ...prev, videoDurationMin: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setVideoEditForm((prev) => ({ ...prev, videoUrl: '', videoSummary: '' }))}
                    className="px-3.5 py-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Video Embed</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Video Summary & Key Concepts
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of skills and hands-on exercises demonstrated in this video lecture..."
                  value={videoEditForm.videoSummary}
                  onChange={(e) => setVideoEditForm((prev) => ({ ...prev, videoSummary: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVideo}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingVideo ? 'Saving Embed...' : 'Save Video Embed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

