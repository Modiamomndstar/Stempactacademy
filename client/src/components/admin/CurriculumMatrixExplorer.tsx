import React, { useState, useEffect } from 'react';
import {
  Layers,
  School as SchoolIcon,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../UIElements';

interface CurriculumMatrixExplorerProps {
  schools: any[];
  programs: any[];
  onOpenCurriculumArchitect?: (program: any, levelCode?: string) => void;
}

export const CurriculumMatrixExplorer: React.FC<CurriculumMatrixExplorerProps> = ({
  schools,
  programs,
  onOpenCurriculumArchitect,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [matrixData, setMatrixData] = useState<any | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [activeLevelCode, setActiveLevelCode] = useState<string>('LEVEL_1_FOUNDATION');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Auto-select first school and program
  useEffect(() => {
    if (schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schools[0].id);
    }
  }, [schools, selectedSchoolId]);

  // When school changes, select first program under that school
  useEffect(() => {
    if (selectedSchoolId) {
      const progsForSchool = programs.filter(
        (p) => p.schoolId === selectedSchoolId || p.school?.id === selectedSchoolId || p.school?.code === selectedSchoolId
      );
      if (progsForSchool.length > 0) {
        setSelectedProgramId(progsForSchool[0].id);
      } else {
        setSelectedProgramId('');
        setMatrixData(null);
      }
    }
  }, [selectedSchoolId, programs]);

  // Fetch matrix when selected program changes
  useEffect(() => {
    if (selectedProgramId) {
      loadMatrix(selectedProgramId);
    }
  }, [selectedProgramId]);

  const loadMatrix = async (programId: string) => {
    setLoadingMatrix(true);
    try {
      const res = await api.getProgramCurriculumMatrix(programId);
      setMatrixData(res);
      if (res?.matrix?.length > 0) {
        setActiveLevelCode(res.matrix[0].code);
      }
    } catch (err: any) {
      console.warn('Matrix fetch error:', err);
      setMatrixData(null);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const programsForSelectedSchool = programs.filter(
    (p) => p.schoolId === selectedSchoolId || p.school?.id === selectedSchoolId || p.school?.code === selectedSchoolId
  );

  const selectedProgramObj = programs.find((p) => p.id === selectedProgramId);

  const currentLevelData = matrixData?.matrix?.find((m: any) => m.code === activeLevelCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Multi-Level Program Curriculum Matrix</span>
          </h2>
          <p className="text-xs text-slate-500">
            Inspect generated syllabus, modules, and video tutorials across all 4 progression levels (Level 1 Foundation through Level 4 Mastery).
          </p>
        </div>

        {selectedProgramObj && (
          <button
            type="button"
            onClick={() => onOpenCurriculumArchitect && onOpenCurriculumArchitect(selectedProgramObj, activeLevelCode)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch AI Curriculum Architect for {currentLevelData?.label || 'This Level'}</span>
          </button>
        )}
      </div>

      {/* Selectors Bar: School Selector & Program Selector */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        {/* School Chips / Select */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <SchoolIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Academic School:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {schools.map((school: any) => {
              const isSelected = selectedSchoolId === school.id;
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => setSelectedSchoolId(school.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{school.code}</span>
                  <span>{school.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Program Pills */}
        {programsForSelectedSchool.length > 0 ? (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Program Under School ({programsForSelectedSchool.length}):</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {programsForSelectedSchool.map((p: any) => {
                const isSelected = selectedProgramId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProgramId(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({p.code})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-2">
            No programs found under this school. Create one in the Programs tab.
          </div>
        )}
      </div>

      {/* Program Matrix View */}
      {loadingMatrix ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p>Loading multi-level curriculum matrix for selected program...</p>
        </div>
      ) : matrixData ? (
        <div className="space-y-6">
          {/* Program Metadata Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold font-mono tracking-wider">
                  {matrixData.program.code}
                </span>
                <span className="text-xs text-indigo-200 font-semibold">
                  {matrixData.program.schoolName}
                </span>
              </div>
              <h3 className="text-xl font-black mt-1">{matrixData.program.name}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Full 4-Level Academic Pathway • {matrixData.program.duration} Weeks per Level • {matrixData.program.contactHours} Contact Hours
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => loadMatrix(selectedProgramId)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            </div>
          </div>

          {/* Level Switcher Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {matrixData.matrix.map((lvl: any) => {
              const isActive = activeLevelCode === lvl.code;
              return (
                <div
                  key={lvl.code}
                  onClick={() => setActiveLevelCode(lvl.code)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer text-left ${
                    isActive
                      ? 'border-indigo-600 bg-white shadow-md'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-400">
                      {lvl.code.replace(/_/g, ' ')}
                    </span>
                    <Badge variant={lvl.hasContent ? 'green' : 'amber'}>
                      {lvl.hasContent ? 'GENERATED' : 'NOT STARTED'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{lvl.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lvl.badge}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>{lvl.modulesCount} Modules</span>
                    <span>{lvl.lessonsCount} Lessons</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Level Content Breakdown */}
          {currentLevelData && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{currentLevelData.label}</h4>
                    <Badge variant={currentLevelData.hasContent ? 'green' : 'amber'}>
                      {currentLevelData.hasContent ? `${currentLevelData.lessonsCount} Lessons Available` : 'Content Empty'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target academic stage: {currentLevelData.badge} • Total Courses: {currentLevelData.coursesCount}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenCurriculumArchitect && onOpenCurriculumArchitect(selectedProgramObj, currentLevelData.code)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentLevelData.hasContent ? 'Re-Architect with AI' : 'Generate This Level with AI'}</span>
                </button>
              </div>

              {!currentLevelData.hasContent ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div>
                    <h5 className="font-bold text-slate-700">No Learning Content Generated for {currentLevelData.label} Yet</h5>
                    <p className="text-slate-400 mt-0.5">
                      Use the AI Curriculum Architect to generate courses, weekly modules, video lessons, and capstones for this stage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenCurriculumArchitect && onOpenCurriculumArchitect(selectedProgramObj, currentLevelData.code)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Level Content with AI Architect</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentLevelData.courses.map((course: any) => (
                    <div key={course.id} className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-indigo-700 uppercase">{course.code}</span>
                          <h5 className="font-bold text-slate-900 text-sm">{course.title}</h5>
                          {course.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{course.description}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {course.modules?.length || 0} Modules
                        </span>
                      </div>

                      {/* Modules Accordion */}
                      <div className="space-y-2 pl-2">
                        {course.modules.map((mod: any, mIdx: number) => {
                          const isExpanded = expandedModuleId === mod.id;
                          return (
                            <div key={mod.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                              <div
                                onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                                className="p-3 bg-slate-50/60 hover:bg-slate-100 flex items-center justify-between transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-bold flex items-center justify-center">
                                    {mIdx + 1}
                                  </span>
                                  <div>
                                    <div className="font-bold text-slate-800 text-xs">{mod.title}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {mod.lessons?.length || 0} Lessons • {mod.practicalActivities?.length || 0} Labs
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-3 border-t border-slate-100 divide-y divide-slate-100 text-xs">
                                  {mod.lessons?.map((lsn: any, lIdx: number) => (
                                    <div key={lsn.id} className="py-2 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-mono">L{lIdx + 1}</span>
                                        <span className="font-semibold text-slate-800">{lsn.title}</span>
                                        {lsn.videoUrl && (
                                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Play className="w-2.5 h-2.5" /> Video Embedded
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                        {lsn.durationMinutes && <span>{lsn.durationMinutes} mins</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
