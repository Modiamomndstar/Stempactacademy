import React, { useState } from 'react';
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
} from 'lucide-react';

interface AcademicOperationsManagerProps {
  programs: any[];
  cohorts: any[];
  onDataRefresh: () => Promise<void>;
  onOpenEditCohort: (cohort: any) => void;
  onOpenCohortAnalysis: (cohortId: string) => void;
  onOpenAIArchitect: () => void;
  isAcademicOrSuperAdmin: boolean;
}

export const AcademicOperationsManager: React.FC<AcademicOperationsManagerProps> = ({
  programs,
  cohorts,
  onDataRefresh,
  onOpenEditCohort,
  onOpenCohortAnalysis,
  onOpenAIArchitect,
  isAcademicOrSuperAdmin,
}) => {
  const [subTab, setSubTab] = useState<'programs' | 'cohorts'>('programs');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [programStatusFilter, setProgramStatusFilter] = useState('');
  const [cohortStatusFilter, setCohortStatusFilter] = useState('');
  const [cohortYearFilter, setCohortYearFilter] = useState('');

  // Expanded program ID for deep canonical tree inspection
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const filteredPrograms = programs.filter((p) => {
    if (schoolFilter && p.school?.code !== schoolFilter) return false;
    if (programStatusFilter && p.status !== programStatusFilter) return false;
    return true;
  });

  const filteredCohorts = cohorts.filter((c) => {
    if (cohortStatusFilter && c.status !== cohortStatusFilter) return false;
    if (cohortYearFilter && c.academicSession?.name !== cohortYearFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('programs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'programs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Programs & Canonical Syllabi ({programs.length})
          </button>
          <button
            onClick={() => setSubTab('cohorts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'cohorts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Cohorts, Capacity & Fees ({cohorts.length})
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

      {/* SUBTAB 1: PROGRAMS CATALOG */}
      {subTab === 'programs' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Filter by school code (e.g. SENG, SROB)..."
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
              />

              <select
                value={programStatusFilter}
                onChange={(e) => setProgramStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Program Statuses</option>
                <option value="OPEN_FOR_APPLICATION">OPEN FOR APPLICATION</option>
                <option value="FULL">FULL</option>
                <option value="CLOSED">CLOSED</option>
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {p.code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.school?.name || 'School of Advanced Computing'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{p.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
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
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                            p.status === 'OPEN_FOR_APPLICATION'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-50 text-slate-800 border-slate-300'
                          }`}
                        >
                          {p.status?.replace(/_/g, ' ')}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedProgramId(isExpanded ? null : p.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isExpanded ? 'Collapse Syllabus' : 'Inspect Canonical Syllabus'}</span>
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

      {/* SUBTAB 2: COHORTS, CAPACITY & PRICING */}
      {subTab === 'cohorts' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Filter by Academic Year (e.g. 2025/2026)..."
                value={cohortYearFilter}
                onChange={(e) => setCohortYearFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
              />

              <select
                value={cohortStatusFilter}
                onChange={(e) => setCohortStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
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
                <Card key={c.id} className="p-6 space-y-4 hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-1">
                        {c.cohortCode || c.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
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

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onOpenCohortAnalysis(c.id)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Deep Cohort Analysis →
                    </button>
                    {isAcademicOrSuperAdmin && (
                      <button
                        onClick={() => onOpenEditCohort(c)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-300" />
                        <span>Edit Pricing & Schedule</span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
