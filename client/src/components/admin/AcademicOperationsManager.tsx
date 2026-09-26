import React, { useState, useMemo } from 'react';
import { api } from '../../services/api';
import { Card, Badge } from '../UIElements';
import {
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Edit,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  School as SchoolIcon,
  ArrowLeft,
  Search,
  ExternalLink,
  GraduationCap,
  DollarSign,
  Shield,
  Tag,
  Check,
  Award,
} from 'lucide-react';
import { ProgramDetailModal } from './ProgramDetailModal';
import { CohortDetailModal } from './CohortDetailModal';

interface AcademicOperationsManagerProps {
  schools?: any[];
  programs: any[];
  cohorts: any[];
  onDataRefresh: () => Promise<void>;
  onOpenEditCohort: (cohort: any) => void;
  onOpenCohortAnalysis: (cohortId: string) => void;
  onOpenAIArchitect: () => void;
  isAcademicOrSuperAdmin: boolean;
  initialSubTab?: 'schools' | 'programs' | 'cohorts';
}

export const AcademicOperationsManager: React.FC<AcademicOperationsManagerProps> = ({
  schools = [],
  programs = [],
  cohorts = [],
  onDataRefresh,
  onOpenEditCohort,
  onOpenCohortAnalysis,
  onOpenAIArchitect,
  isAcademicOrSuperAdmin,
  initialSubTab = 'schools',
}) => {
  const [subTab, setSubTab] = useState<'schools' | 'programs' | 'cohorts'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Drilldown & Modals state
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [selectedProgramIdOrCode, setSelectedProgramIdOrCode] = useState<string | null>(null);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  // Filters
  const [schoolSearch, setSchoolSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [programStatusFilter, setProgramStatusFilter] = useState('');
  const [selectedAcademicSessionId, setSelectedAcademicSessionId] = useState<string>('ALL');
  const [cohortStatusFilter, setCohortStatusFilter] = useState('');
  const [cohortSearch, setCohortSearch] = useState('');

  // In-place canonical syllabus accordion
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Extract distinct academic sessions from cohorts
  const academicSessions = useMemo(() => {
    const map = new Map<string, any>();
    cohorts.forEach((c) => {
      if (c.academicSession && c.academicSession.id) {
        if (!map.has(c.academicSession.id)) {
          map.set(c.academicSession.id, {
            ...c.academicSession,
            cohortCount: 1,
            enrolledTotal: c.currentEnrollment || 0,
            capacityTotal: c.maxCapacity || 0,
          });
        } else {
          const existing = map.get(c.academicSession.id);
          existing.cohortCount += 1;
          existing.enrolledTotal += c.currentEnrollment || 0;
          existing.capacityTotal += c.maxCapacity || 0;
        }
      }
    });
    return Array.from(map.values());
  }, [cohorts]);

  // Fallback schools list if schools prop is empty: derive from programs.school
  const effectiveSchools = useMemo(() => {
    if (schools && schools.length > 0) return schools;
    const map = new Map<string, any>();
    programs.forEach((p) => {
      if (p.school && p.school.id) {
        if (!map.has(p.school.id)) {
          map.set(p.school.id, {
            ...p.school,
            _count: { programs: 1 },
          });
        } else {
          const item = map.get(p.school.id);
          item._count.programs += 1;
        }
      }
    });
    return Array.from(map.values());
  }, [schools, programs]);

  // Update Program Catalog Status via backend API
  const handleUpdateProgramStatus = async (programId: string, newStatus: string) => {
    setProcessing(true);
    setActionError('');
    try {
      await api.updateProgramStatus(programId, { status: newStatus });
      setActionSuccess(`Program catalog status updated to ${newStatus}.`);
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update program status');
    } finally {
      setProcessing(false);
    }
  };

  // Filtered schools
  const filteredSchools = effectiveSchools.filter((s) => {
    if (!schoolSearch) return true;
    const query = schoolSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(query) ||
      s.code?.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    );
  });

  // Filtered programs
  const filteredPrograms = programs.filter((p) => {
    if (selectedSchool) {
      if (p.schoolId !== selectedSchool.id && p.school?.code !== selectedSchool.code) {
        return false;
      }
    } else if (schoolFilter && p.school?.code !== schoolFilter) {
      return false;
    }
    if (programStatusFilter && p.status !== programStatusFilter) return false;
    if (programSearch) {
      const q = programSearch.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCode = p.code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  // Filtered cohorts
  const filteredCohorts = cohorts.filter((c) => {
    if (selectedAcademicSessionId !== 'ALL') {
      if (c.academicSessionId !== selectedAcademicSessionId && c.academicSession?.id !== selectedAcademicSessionId) {
        return false;
      }
    }
    if (cohortStatusFilter && c.status !== cohortStatusFilter) return false;
    if (cohortSearch) {
      const q = cohortSearch.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCode = (c.cohortCode || c.code || '').toLowerCase().includes(q);
      const matchProg = c.program?.name?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchProg) return false;
    }
    return true;
  });

  // Distinct programs running in the selected academic session with version info
  const runningProgramsInSession = useMemo(() => {
    const list = selectedAcademicSessionId === 'ALL'
      ? cohorts
      : cohorts.filter(
          (c) =>
            c.academicSessionId === selectedAcademicSessionId ||
            c.academicSession?.id === selectedAcademicSessionId
        );

    const programMap = new Map<string, {
      program: any;
      programVersion?: any;
      curriculumVersion?: any;
      cohorts: any[];
    }>();

    list.forEach((c) => {
      const progId = c.programId || c.program?.id;
      if (!progId) return;
      if (!programMap.has(progId)) {
        programMap.set(progId, {
          program: c.program,
          programVersion: c.programVersion,
          curriculumVersion: c.curriculumVersion,
          cohorts: [c],
        });
      } else {
        const item = programMap.get(progId)!;
        item.cohorts.push(c);
        if (!item.programVersion && c.programVersion) item.programVersion = c.programVersion;
        if (!item.curriculumVersion && c.curriculumVersion) item.curriculumVersion = c.curriculumVersion;
      }
    });

    return Array.from(programMap.values());
  }, [cohorts, selectedAcademicSessionId]);

  // Current selected session details
  const activeSessionDetails = useMemo(() => {
    if (selectedAcademicSessionId === 'ALL') return null;
    return academicSessions.find((s) => s.id === selectedAcademicSessionId) || null;
  }, [academicSessions, selectedAcademicSessionId]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSubTab('schools');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'schools'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SchoolIcon className="w-3.5 h-3.5" />
            <span>Academic Schools ({effectiveSchools.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('programs');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'programs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Programs & Syllabi ({programs.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('cohorts');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'cohorts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Sessions & Cohorts ({cohorts.length})</span>
          </button>
        </div>

        {isAcademicOrSuperAdmin && (
          <button
            onClick={onOpenAIArchitect}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>AI Curriculum Architect</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl font-semibold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-950">×</button>
        </div>
      )}
      {actionError && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold text-rose-950">×</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 1: ACADEMIC SCHOOLS                                */}
      {/* ========================================================= */}
      {subTab === 'schools' && (
        <div className="space-y-6">
          {selectedSchool ? (
            /* School Portfolio Drilldown View */
            <div className="space-y-6">
              {/* Breadcrumb Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to All Schools</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Academic Schools</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="font-bold text-slate-800">{selectedSchool.name}</span>
                </div>
              </div>

              {/* School Banner Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-lg space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner font-mono font-bold text-lg"
                      style={{ backgroundColor: selectedSchool.color || '#2563eb' }}
                    >
                      {selectedSchool.code?.slice(0, 4) || 'SCH'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/50 px-2.5 py-0.5 rounded border border-blue-700/50">
                          {selectedSchool.code}
                        </span>
                        <span className="text-xs text-slate-400">Canonical School Entity</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{selectedSchool.name}</h3>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        {selectedSchool.description || 'Specialized faculty discipline offering accredited degree and professional certification tracks.'}
                      </p>
                    </div>
                  </div>

                  {/* School KPIs */}
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center min-w-[90px]">
                      <div className="text-xl font-extrabold text-blue-400">
                        {programs.filter((p) => p.schoolId === selectedSchool.id || p.school?.code === selectedSchool.code).length}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Programs</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center min-w-[90px]">
                      <div className="text-xl font-extrabold text-emerald-400">
                        {cohorts.filter((c) => c.program?.schoolId === selectedSchool.id || c.program?.school?.code === selectedSchool.code).length}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Cohorts</div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-center min-w-[90px]">
                      <div className="text-xl font-extrabold text-purple-400">
                        {cohorts
                          .filter((c) => c.program?.schoolId === selectedSchool.id || c.program?.school?.code === selectedSchool.code)
                          .reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Students</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* School Programs Header & Filters */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Programs Offered Under {selectedSchool.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search school programs..."
                      value={programSearch}
                      onChange={(e) => setProgramSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    {filteredPrograms.length} Programs
                  </span>
                </div>
              </div>

              {/* School Program Cards */}
              <div className="grid grid-cols-1 gap-4">
                {filteredPrograms.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
                    No programs currently cataloged under this school.
                  </div>
                ) : (
                  filteredPrograms.map((p) => {
                    const isExpanded = expandedProgramId === p.id;
                    const courses = p.courses || [];
                    const activeProgCohorts = cohorts.filter((c) => c.programId === p.id);

                    return (
                      <Card key={p.id} className="p-6 space-y-4 hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {p.code}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {p.durationWeeks || 12} Weeks • {p.award || 'Professional Certificate'}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                            <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {isAcademicOrSuperAdmin ? (
                              <div className="flex items-center gap-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-bold">Status:</label>
                                <select
                                  value={p.status}
                                  disabled={processing}
                                  onChange={(e) => handleUpdateProgramStatus(p.id, e.target.value)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                    p.status === 'OPEN_FOR_APPLICATION'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : p.status === 'FULL'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : p.status === 'CLOSED'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-slate-50 text-slate-800 border-slate-300'
                                  }`}
                                >
                                  <option value="OPEN_FOR_APPLICATION">OPEN FOR APPLICATION</option>
                                  <option value="FULL">FULL</option>
                                  <option value="UPCOMING">UPCOMING</option>
                                  <option value="CLOSED">CLOSED</option>
                                  <option value="PUBLISHED">PUBLISHED</option>
                                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                                  <option value="DRAFT">DRAFT</option>
                                  <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-800 border-slate-300">
                                {p.status?.replace(/_/g, ' ')}
                              </span>
                            )}

                            <button
                              onClick={() => setSelectedProgramIdOrCode(p.code || p.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Program Console & Syllabus</span>
                            </button>

                            <button
                              onClick={() => setExpandedProgramId(isExpanded ? null : p.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                            >
                              <Layers className="w-3.5 h-3.5 text-slate-500" />
                              <span>{isExpanded ? 'Collapse' : 'Inspect Structure'}</span>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Program Quick Meta Strip */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <strong>{courses.length}</strong> Courses Linked
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <strong>{activeProgCohorts.length}</strong> Active Cohorts
                          </span>
                          {p.standardTuitionFee && (
                            <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                              Tuition: ₦{Number(p.standardTuitionFee).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* In-place Accordion */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Canonical Structure (Course → Module → Lesson)
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                {courses.length} Courses
                              </span>
                            </div>

                            {courses.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                                No canonical courses currently linked in relational schema. Use AI Curriculum Architect to draft program structures.
                              </div>
                            ) : (
                              courses.map((course: any, cIdx: number) => (
                                <div key={course.id || cIdx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono font-bold text-blue-700">
                                      Course {cIdx + 1}: {course.code} — {course.title}
                                    </span>
                                    {course.credits && (
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                        {course.credits} Credits
                                      </span>
                                    )}
                                  </div>

                                  {course.modules && course.modules.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Modules ({course.modules.length}):
                                      </span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {course.modules.map((mod: any, mIdx: number) => (
                                          <div key={mod.id || mIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                            <div className="font-semibold text-slate-800">
                                              Mod {mod.orderIndex || mIdx + 1}: {mod.title}
                                            </div>
                                            {mod.lessons && (
                                              <div className="text-[10px] text-slate-500">
                                                {mod.lessons.length} lessons linked
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Schools Grid View (All 8 Schools) */
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search schools by name or code..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
                  />
                </div>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  Showing {filteredSchools.length} of {effectiveSchools.length} Academic Schools
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredSchools.map((s) => {
                  const schoolPrograms = programs.filter(
                    (p) => p.schoolId === s.id || p.school?.code === s.code
                  );
                  const schoolCohorts = cohorts.filter(
                    (c) => c.program?.schoolId === s.id || c.program?.school?.code === s.code
                  );
                  const totalStudents = schoolCohorts.reduce(
                    (sum, c) => sum + (c.currentEnrollment || 0),
                    0
                  );

                  return (
                    <Card
                      key={s.id}
                      onClick={() => setSelectedSchool(s)}
                      className="p-5 space-y-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs"
                            style={{ backgroundColor: s.color || '#2563eb' }}
                          >
                            {s.code?.slice(0, 4) || 'SCH'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {s.code}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {s.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {s.description || 'Specialized faculty division delivering foundational through expert curricula.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-3 gap-1 text-center font-mono">
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <div className="text-xs font-bold text-slate-800">{schoolPrograms.length}</div>
                            <div className="text-[9px] text-slate-400">Programs</div>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <div className="text-xs font-bold text-slate-800">{schoolCohorts.length}</div>
                            <div className="text-[9px] text-slate-400">Cohorts</div>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <div className="text-xs font-bold text-emerald-700">{totalStudents}</div>
                            <div className="text-[9px] text-slate-400">Students</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-blue-600 font-bold pt-1 group-hover:translate-x-0.5 transition-transform">
                          <span>View Programs & Curricula</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: PROGRAMS & CANONICAL SYLLABI                    */}
      {/* ========================================================= */}
      {subTab === 'programs' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Schools</option>
                {effectiveSchools.map((s) => (
                  <option key={s.id || s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>

              <select
                value={programStatusFilter}
                onChange={(e) => setProgramStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Program Statuses</option>
                <option value="OPEN_FOR_APPLICATION">OPEN FOR APPLICATION</option>
                <option value="FULL">FULL</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="CLOSED">CLOSED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <span className="text-xs font-mono text-slate-500 font-semibold">
              Showing {filteredPrograms.length} of {programs.length} programs
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredPrograms.map((p) => {
              const isExpanded = expandedProgramId === p.id;
              const courses = p.courses || [];

              return (
                <Card key={p.id} className="p-6 space-y-4 hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {p.code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.school?.name || 'School of Advanced Computing'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isAcademicOrSuperAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400 uppercase font-bold">Status:</label>
                          <select
                            value={p.status}
                            disabled={processing}
                            onChange={(e) => handleUpdateProgramStatus(p.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                              p.status === 'OPEN_FOR_APPLICATION'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : p.status === 'FULL'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : p.status === 'CLOSED'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-slate-50 text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="OPEN_FOR_APPLICATION">OPEN FOR APPLICATION</option>
                            <option value="FULL">FULL</option>
                            <option value="UPCOMING">UPCOMING</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl border bg-slate-50 text-slate-800 border-slate-300">
                          {p.status?.replace(/_/g, ' ')}
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedProgramIdOrCode(p.code || p.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Program Console & Syllabus</span>
                      </button>

                      <button
                        onClick={() => setExpandedProgramId(isExpanded ? null : p.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isExpanded ? 'Collapse' : 'Inspect Structure'}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Canonical Structure Inspector: Course -> Modules -> Lessons */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 bg-slate-50/50 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Canonical Curriculum Structure (Course → Module → Lesson)
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {courses.length} Courses Linked
                        </span>
                      </div>

                      {courses.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                          No canonical courses currently linked in relational schema. Use AI Curriculum Architect to draft program structures.
                        </div>
                      ) : (
                        courses.map((course: any, cIdx: number) => (
                          <div key={course.id || cIdx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-blue-700">
                                Course {cIdx + 1}: {course.code} — {course.title}
                              </span>
                              {course.credits && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                  {course.credits} Credits
                                </span>
                              )}
                            </div>

                            {course.modules && course.modules.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Modules ({course.modules.length}):
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {course.modules.map((mod: any, mIdx: number) => (
                                    <div key={mod.id || mIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                      <div className="font-semibold text-slate-800">
                                        Mod {mod.orderIndex || mIdx + 1}: {mod.title}
                                      </div>
                                      {mod.lessons && (
                                        <div className="text-[10px] text-slate-500">
                                          {mod.lessons.length} lessons linked
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: ACADEMIC SESSIONS & COHORT OPERATIONS          */}
      {/* ========================================================= */}
      {subTab === 'cohorts' && (
        <div className="space-y-6">
          {/* Academic Session Selector & Control Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    Academic Governance
                  </span>
                  <span className="text-xs text-slate-300">Session-Driven Cohorts & Versioning</span>
                </div>
                <h3 className="text-lg font-bold text-white">Academic Sessions Control Desk</h3>
              </div>

              {/* Session Selector Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedAcademicSessionId('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedAcademicSessionId === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  All Academic Sessions
                </button>
                {academicSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedAcademicSessionId(session.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedAcademicSessionId === session.id
                        ? 'bg-blue-500 text-white shadow-xs'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span>{session.name}</span>
                    {session.isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Intelligence Stats if specific session selected */}
            {activeSessionDetails && (
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Active Academic Session</div>
                  <div className="font-bold text-sm text-white mt-0.5">{activeSessionDetails.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{activeSessionDetails.code}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Cohorts Active</div>
                  <div className="font-bold text-sm text-emerald-300 mt-0.5">
                    {activeSessionDetails.cohortCount} Cohorts
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Under this session</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Programs Running</div>
                  <div className="font-bold text-sm text-blue-300 mt-0.5">
                    {runningProgramsInSession.length} Unique Programs
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Anchored to versions</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Enrollment Capacity</div>
                  <div className="font-bold text-sm text-amber-300 mt-0.5">
                    {activeSessionDetails.enrolledTotal} / {activeSessionDetails.capacityTotal} Seats
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {Math.round((activeSessionDetails.enrolledTotal / (activeSessionDetails.capacityTotal || 1)) * 100)}% Utilized
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Programs Running in this Academic Session (Versioning Matrix) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Programs Running in {activeSessionDetails ? activeSessionDetails.name : 'All Sessions'}
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Anchored to Backend ProgramVersion & CurriculumVersion
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {runningProgramsInSession.map(({ program, programVersion, curriculumVersion, cohorts: progCohorts }) => (
                <div
                  key={program?.id || Math.random()}
                  className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {program?.code}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 mt-1">{program?.name}</h5>
                    </div>
                    <button
                      onClick={() => setSelectedProgramIdOrCode(program?.code || program?.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Inspect Program Console & Syllabus"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                      Prog v{programVersion?.versionNumber || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Curr v{curriculumVersion?.versionNumber || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {progCohorts.length} {progCohorts.length === 1 ? 'Cohort' : 'Cohorts'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters for Cohort Cards */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cohorts..."
                  value={cohortSearch}
                  onChange={(e) => setCohortSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <select
                value={cohortStatusFilter}
                onChange={(e) => setCohortStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Cohort Statuses</option>
                <option value="OPEN">OPEN (Accepting)</option>
                <option value="ALMOST_FULL">ALMOST FULL</option>
                <option value="FULL">FULL</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <span className="text-xs font-mono text-slate-500 font-semibold">
              Showing {filteredCohorts.length} cohorts
            </span>
          </div>

          {/* Cohorts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCohorts.map((c) => {
              const trainingFee = c.trainingFee || 65000;
              const regFee = c.registrationFee || 5000;
              const certFee = c.certificationFee || 10000;
              const discount = c.discountPercentage || 0;
              const netTuition = trainingFee * (1 - discount / 100);
              const totalInvoiced = netTuition + regFee + certFee;
              const fillPct = Math.round(((c.currentEnrollment || 0) / (c.maxCapacity || 1)) * 100);

              return (
                <Card
                  key={c.id}
                  className="p-6 space-y-4 hover:border-blue-300 transition-all cursor-pointer group"
                  onClick={() => setSelectedCohortId(c.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.cohortCode || c.code}
                        </span>
                        {c.academicSession && (
                          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {c.academicSession.name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </h4>
                      <div className="text-xs text-slate-500">{c.program?.name}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        c.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'ALMOST_FULL'
                          ? 'bg-amber-100 text-amber-800'
                          : c.status === 'FULL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Version Anchors */}
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-slate-400">Anchors:</span>
                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold">
                      Prog v{c.programVersion?.versionNumber || 1}
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Curr v{c.curriculumVersion?.versionNumber || 1}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Capacity Utilization</span>
                      <span className="font-mono font-bold text-slate-900">
                        {c.currentEnrollment || 0} / {c.maxCapacity} Seats ({fillPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${fillPct >= 90 ? 'bg-amber-600' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(fillPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-700">
                      <span>Tuition Fee:</span>
                      <strong className="text-slate-900">₦{trainingFee.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Registration + Certification:</span>
                      <span>₦{(regFee + certFee).toLocaleString()}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span>Net Student Invoiced:</span>
                      <span className="text-emerald-700">₦{totalInvoiced.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Cohort Action Buttons */}
                  <div
                    className="flex items-center justify-between text-xs pt-2 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedCohortId(c.id)}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Cohort Console & Students Roster</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {isAcademicOrSuperAdmin && (
                      <button
                        onClick={() => onOpenEditCohort(c)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-300" />
                        <span>Edit Pricing</span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Program Detail Console Modal */}
      {selectedProgramIdOrCode && (
        <ProgramDetailModal
          programIdOrCode={selectedProgramIdOrCode}
          isOpen={!!selectedProgramIdOrCode}
          onClose={() => setSelectedProgramIdOrCode(null)}
          isAcademicOrSuperAdmin={isAcademicOrSuperAdmin}
          onProgramUpdated={async () => {
            await onDataRefresh();
          }}
        />
      )}

      {/* Cohort Detail Console Modal */}
      {selectedCohortId && (
        <CohortDetailModal
          cohortId={selectedCohortId}
          isOpen={!!selectedCohortId}
          onClose={() => setSelectedCohortId(null)}
          isSuperOrAcademicAdmin={isAcademicOrSuperAdmin}
          onCohortUpdated={async () => {
            await onDataRefresh();
          }}
        />
      )}
    </div>
  );
};
