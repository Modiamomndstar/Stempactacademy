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
  PowerOff,
  Power,
  Plus,
  CalendarDays,
  Lock,
  Building2,
  Globe,
} from 'lucide-react';
import { ProgramDetailModal } from './ProgramDetailModal';
import { CohortDetailModal } from './CohortDetailModal';
import { CreateCohortModal } from './CreateCohortModal';
import { AcademicCalendarManager } from './AcademicCalendarManager';
import { SchoolModal } from './SchoolModal';
import { ProgramModal } from './ProgramModal';
import { CenterModal } from './CenterModal';
import { CurriculumMatrixExplorer } from './CurriculumMatrixExplorer';

interface AcademicOperationsManagerProps {
  schools?: any[];
  programs: any[];
  cohorts: any[];
  applications?: any[];
  onDataRefresh: () => Promise<void>;
  onOpenEditCohort: (cohort: any) => void;
  onOpenCohortAnalysis: (cohortId: string) => void;
  onOpenAIArchitect: (progId?: string) => void;
  isAcademicOrSuperAdmin: boolean;
  initialSubTab?: 'calendar' | 'schools' | 'programs' | 'cohorts' | 'centers' | 'matrix';
}

export const AcademicOperationsManager: React.FC<AcademicOperationsManagerProps> = ({
  schools = [],
  programs = [],
  cohorts = [],
  applications = [],
  onDataRefresh,
  onOpenEditCohort,
  onOpenCohortAnalysis,
  onOpenAIArchitect,
  isAcademicOrSuperAdmin,
  initialSubTab = 'schools',
}) => {
  const [subTab, setSubTab] = useState<'calendar' | 'schools' | 'programs' | 'cohorts' | 'centers' | 'matrix'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Live database academic sessions
  const [dbSessions, setDbSessions] = useState<any[]>([]);

  const loadDbSessions = async () => {
    try {
      const res = await api.getAcademicSessions();
      if (res?.sessions) {
        setDbSessions(res.sessions);
      }
    } catch (e) {
      console.error('Failed to load db academic sessions:', e);
    }
  };

  React.useEffect(() => {
    loadDbSessions();
  }, []);

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

  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Create Cohort Modal State
  const [showCreateCohortModal, setShowCreateCohortModal] = useState(false);
  const [createCohortProgramId, setCreateCohortProgramId] = useState<string | undefined>(undefined);

  // School Modal State
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);

  // Program Modal State
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [newProgramSchoolId, setNewProgramSchoolId] = useState<string | undefined>(undefined);
  const [curatingProgramId, setCuratingProgramId] = useState<string | null>(null);

  // Center Modal & Directory State
  const [centers, setCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  const loadCenters = async () => {
    setLoadingCenters(true);
    try {
      const res = await api.getCenters();
      setCenters(res?.centers || []);
    } catch (err) {
      console.warn('Could not load centers:', err);
    } finally {
      setLoadingCenters(false);
    }
  };

  React.useEffect(() => {
    loadCenters();
  }, []);

  // Curate Program Videos Action
  const handleCurateProgramVideos = async (progId: string) => {
    setCuratingProgramId(progId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.curateProgramVideos(progId);
      setActionSuccess(`AI Video Curator dispatched! Curated ${res?.lessonsCount || 0} module lessons with verified YouTube video tutorials.`);
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to curate program videos.');
    } finally {
      setCuratingProgramId(null);
    }
  };

  // Quick 1-click cohort intake toggle (Open/Close intake at any time)
  const handleToggleCohortIntake = async (cohortId: string, currentStatus: string) => {
    setProcessing(true);
    setActionError('');
    const newStatus = (currentStatus === 'OPEN' || currentStatus === 'ALMOST_FULL') ? 'CLOSED' : 'OPEN';
    try {
      await api.updateCohort(cohortId, { status: newStatus });
      setActionSuccess(`Cohort intake status set to ${newStatus}. Public registration updated.`);
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update cohort intake');
    } finally {
      setProcessing(false);
    }
  };

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

  // Combined live database academic sessions & derived session objects
  const effectiveAcademicSessions = useMemo(() => {
    if (dbSessions && dbSessions.length > 0) {
      return dbSessions;
    }
    return academicSessions;
  }, [dbSessions, academicSessions]);

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
              setSubTab('calendar');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Academic Calendar ({effectiveAcademicSessions.length})</span>
          </button>

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
            <span>Cohorts & Class Sections ({cohorts.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('centers');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'centers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Learning Centers ({centers.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('matrix');
              setSelectedSchool(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curriculum Matrix by Level</span>
          </button>
        </div>

        {isAcademicOrSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreateCohortProgramId(undefined);
                setShowCreateCohortModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Cohort</span>
            </button>
            <button
              onClick={() => onOpenAIArchitect()}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>AI Curriculum Architect</span>
            </button>
          </div>
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
      {/* SUBTAB 0: ACADEMIC CALENDAR & SESSIONS                   */}
      {/* ========================================================= */}
      {subTab === 'calendar' && (
        <AcademicCalendarManager
          cohorts={cohorts}
          programs={programs}
          schools={effectiveSchools}
          applications={applications}
          onOpenCreateCohortForSession={(sessionId) => {
            setSelectedAcademicSessionId(sessionId);
            setCreateCohortProgramId(undefined);
            setShowCreateCohortModal(true);
          }}
          onDataRefresh={async () => {
            await Promise.all([onDataRefresh(), loadDbSessions()]);
          }}
          isAcademicOrSuperAdmin={isAcademicOrSuperAdmin}
        />
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

                  {/* School KPIs & Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
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

                    {isAcademicOrSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSchool(selectedSchool);
                          setShowSchoolModal(true);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/20"
                        title="Edit faculty branding and description"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Faculty</span>
                      </button>
                    )}
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

                  {isAcademicOrSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProgram(null);
                        setNewProgramSchoolId(selectedSchool.id);
                        setShowProgramModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Program</span>
                    </button>
                  )}
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
                                {p.duration
                                  ? (p.duration.toLowerCase().includes('week') || p.duration.toLowerCase().includes('month')
                                      ? p.duration
                                      : `${p.duration} Weeks`)
                                  : (p.durationWeeks ? `${p.durationWeeks} Weeks` : '12 Weeks')}
                                {' • '}
                                {p.certification || p.award || 'Professional Certificate'}
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

                            {isAcademicOrSuperAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProgram(p);
                                    setShowProgramModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                  title="Edit program parameters, curriculum levels, and syllabus"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={curatingProgramId === p.id}
                                  onClick={() => handleCurateProgramVideos(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                  title="Curate verified YouTube video tutorials for lessons"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                  <span>{curatingProgramId === p.id ? 'Curating...' : 'AI Curate'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCreateCohortProgramId(p.id);
                                    setShowCreateCohortModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                  title="Create & launch new intake cohort for this program"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Launch Cohort</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenAIArchitect(p.id)}
                                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                  title="Draft or refine curriculum using AI Curriculum Architect"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                  <span>AI Architect</span>
                                </button>
                              </>
                            )}

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
                              <div className="p-6 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200 space-y-2">
                                <p>No canonical courses currently linked in relational schema.</p>
                                {isAcademicOrSuperAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAIArchitect(p.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Draft Curriculum with AI Architect</span>
                                  </button>
                                )}
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
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    Showing {filteredSchools.length} of {effectiveSchools.length} Academic Schools
                  </span>
                  {isAcademicOrSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchool(null);
                        setShowSchoolModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New School</span>
                    </button>
                  )}
                </div>
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

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-500 font-semibold">
                Showing {filteredPrograms.length} of {programs.length} programs
              </span>

              {isAcademicOrSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProgram(null);
                    setNewProgramSchoolId(undefined);
                    setShowProgramModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Program</span>
                </button>
              )}
            </div>
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
                        type="button"
                        onClick={() => setSelectedProgramIdOrCode(p.code || p.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Console & Syllabus</span>
                      </button>

                      {isAcademicOrSuperAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProgram(p);
                              setShowProgramModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Edit program parameters, curriculum levels, and syllabus"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={curatingProgramId === p.id}
                            onClick={() => handleCurateProgramVideos(p.id)}
                            className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                            title="Curate verified YouTube video tutorials for lessons"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            <span>{curatingProgramId === p.id ? 'Curating...' : 'AI Curate'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCreateCohortProgramId(p.id);
                              setShowCreateCohortModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Create & launch new intake cohort for this program"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Launch Cohort</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenAIArchitect(p.id)}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Draft or refine curriculum using AI Curriculum Architect"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>AI Architect</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
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
                        <div className="p-6 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200 space-y-2">
                          <p>No canonical courses currently linked in relational schema.</p>
                          {isAcademicOrSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => onOpenAIArchitect(p.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Draft Curriculum with AI Architect</span>
                            </button>
                          )}
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
                  <span className="text-xs text-slate-300">Academic Year (AY), Cohorts & Class Sections</span>
                </div>
                <h3 className="text-lg font-bold text-white">Academic Intakes & Class Sections Control Desk</h3>
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
                  All Academic Years
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
                {isAcademicOrSuperAdmin && (
                  <button
                    onClick={() => {
                      setCreateCohortProgramId(undefined);
                      setShowCreateCohortModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Launch Cohort Intake Batch</span>
                  </button>
                )}
              </div>
            </div>

            {/* Session Intelligence Stats if specific session selected */}
            {activeSessionDetails && (
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Active Academic Year (AY)</div>
                  <div className="font-bold text-sm text-white mt-0.5">{activeSessionDetails.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{activeSessionDetails.code}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Class Sections Active</div>
                  <div className="font-bold text-sm text-emerald-300 mt-0.5">
                    {activeSessionDetails.cohortCount} Sections
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Under this academic intake</div>
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
                  placeholder="Search class sections & intakes..."
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
                <option value="">All Section Statuses</option>
                <option value="OPEN">OPEN (Accepting)</option>
                <option value="ALMOST_FULL">ALMOST FULL</option>
                <option value="FULL">FULL</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <span className="text-xs font-mono text-slate-500 font-semibold">
              Showing {filteredCohorts.length} class sections
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCohortIntake(c.id, c.status);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            (c.status === 'OPEN' || c.status === 'ALMOST_FULL')
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Toggle intake open/closed for public applications"
                        >
                          {(c.status === 'OPEN' || c.status === 'ALMOST_FULL') ? (
                            <>
                              <PowerOff className="w-3 h-3 text-rose-600" />
                              <span>Close Intake</span>
                            </>
                          ) : (
                            <>
                              <Power className="w-3 h-3 text-emerald-600" />
                              <span>Reopen Intake</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onOpenEditCohort(c)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-300" />
                          <span>Edit Pricing</span>
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: LEARNING CENTERS NETWORK */}
      {subTab === 'centers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Learning Centers & Hubs Network</h2>
              <p className="text-xs text-slate-500">
                Manage STEMPACT physical campuses, neighborhood satellite centers, government-sponsored hubs, and the virtual global campus.
              </p>
            </div>
            {isAcademicOrSuperAdmin && (
              <button
                onClick={() => {
                  setEditingCenter(null);
                  setShowCenterModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
              >
                <Building2 className="w-4 h-4" />
                <span>Add Learning Center</span>
              </button>
            )}
          </div>

          {/* City / Town Filter Chips */}
          {(() => {
            const cities = Array.from(new Set(centers.map((c: any) => c.cityOrTown).filter(Boolean))) as string[];
            return cities.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Filter by City:</span>
                <button
                  onClick={() => setSelectedCityFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    selectedCityFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Cities ({centers.length})
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCityFilter(city)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      selectedCityFilter === city
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            ) : null;
          })()}

          {loadingCenters ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading learning centers...</div>
          ) : centers.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Globe className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-700">No Learning Centers Configured Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Add your primary STEMPACT campus, neighborhood satellite branches, or partner-sponsored training centers.
                </p>
              </div>
              {isAcademicOrSuperAdmin && (
                <button
                  onClick={() => {
                    setEditingCenter(null);
                    setShowCenterModal(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition"
                >
                  Create First Center
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {centers
                .filter((c: any) => selectedCityFilter === 'ALL' || c.cityOrTown === selectedCityFilter)
                .map((center: any) => {
                  const typeBadge = {
                    MAIN_CAMPUS: { label: 'Main Campus', color: 'bg-blue-100 text-blue-800', emoji: '🏛️' },
                    SATELLITE_CENTER: { label: 'Satellite Center', color: 'bg-purple-100 text-purple-800', emoji: '📡' },
                    GOVERNMENT_SPONSORED: { label: 'Govt. Sponsored Hub', color: 'bg-emerald-100 text-emerald-800', emoji: '🏛️' },
                    CORPORATE_PARTNER: { label: 'Corporate / CSR Hub', color: 'bg-amber-100 text-amber-800', emoji: '🤝' },
                    VIRTUAL_GLOBAL: { label: 'Virtual Campus', color: 'bg-indigo-100 text-indigo-800', emoji: '🌐' },
                  }[center.centerType as string] || { label: center.centerType, color: 'bg-slate-100 text-slate-700', emoji: '🏢' };

                  return (
                    <div
                      key={center.id}
                      className={`relative p-5 rounded-2xl border shadow-xs space-y-4 ${
                        center.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl shrink-0 mt-0.5">{typeBadge.emoji}</div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadge.color}`}>
                                {typeBadge.label}
                              </span>
                              {!center.isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="font-black text-slate-900 text-sm mt-1 leading-snug">{center.name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono">{center.code}</p>
                          </div>
                        </div>
                        {isAcademicOrSuperAdmin && (
                          <button
                            onClick={() => {
                              setEditingCenter(center);
                              setShowCenterModal(true);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer shrink-0"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        {center.cityOrTown && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>
                              {center.neighborhood ? `${center.neighborhood}, ` : ''}
                              {center.cityOrTown}
                              {center.stateOrRegion ? `, ${center.stateOrRegion}` : ''}
                            </span>
                          </div>
                        )}
                        {center.landmark && (
                          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                            <span className="shrink-0">📍</span>
                            <span>{center.landmark}</span>
                          </div>
                        )}
                        {center.address && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">{center.address}</p>
                        )}
                        {center.sponsorPartnerName && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Sponsor: {center.sponsorPartnerName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>
                            Capacity: <strong>{center.capacity}</strong> seats
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{center.country}</span>
                        <span>{center.timezone}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* CURRICULUM MATRIX BY LEVEL */}
      {subTab === 'matrix' && (
        <CurriculumMatrixExplorer
          schools={effectiveSchools}
          programs={programs}
          onOpenCurriculumArchitect={(prog) => onOpenAIArchitect(prog?.id)}
        />
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
          applications={applications}
          isSuperOrAcademicAdmin={isAcademicOrSuperAdmin}
          onCohortUpdated={async () => {
            await onDataRefresh();
          }}
        />
      )}

      {/* Create New Cohort Modal */}
      {showCreateCohortModal && (
        <CreateCohortModal
          isOpen={showCreateCohortModal}
          onClose={() => {
            setShowCreateCohortModal(false);
            setCreateCohortProgramId(undefined);
          }}
          onCohortCreated={async () => {
            await onDataRefresh();
          }}
          programs={programs}
          academicSessions={effectiveAcademicSessions}
          initialProgramId={createCohortProgramId}
          initialAcademicSessionId={selectedAcademicSessionId !== 'ALL' ? selectedAcademicSessionId : undefined}
        />
      )}

      {/* School Create / Edit Modal */}
      {showSchoolModal && (
        <SchoolModal
          isOpen={showSchoolModal}
          onClose={() => {
            setShowSchoolModal(false);
            setEditingSchool(null);
          }}
          onSaved={async () => {
            await onDataRefresh();
            setActionSuccess(editingSchool ? `School updated successfully.` : `New academic school created successfully.`);
          }}
          schoolToEdit={editingSchool}
        />
      )}

      {/* Program Create / Edit Modal */}
      {showProgramModal && (
        <ProgramModal
          isOpen={showProgramModal}
          onClose={() => {
            setShowProgramModal(false);
            setEditingProgram(null);
            setNewProgramSchoolId(undefined);
          }}
          onSaved={async () => {
            await onDataRefresh();
            setActionSuccess(editingProgram ? `Program updated successfully.` : `New academic program cataloged successfully.`);
          }}
          schools={effectiveSchools}
          programToEdit={editingProgram}
          initialSchoolId={newProgramSchoolId}
          activeCohortCount={
            editingProgram
              ? cohorts.filter((c) => c.programId === editingProgram.id).length
              : 0
          }
        />
      )}

      {/* Center Create / Edit Modal */}
      {showCenterModal && (
        <CenterModal
          isOpen={showCenterModal}
          onClose={() => {
            setShowCenterModal(false);
            setEditingCenter(null);
          }}
          editingCenter={editingCenter}
          onSaved={async () => {
            await loadCenters();
            setActionSuccess(editingCenter ? 'Learning center updated successfully.' : 'New learning center created successfully.');
          }}
        />
      )}
    </div>
  );
};
