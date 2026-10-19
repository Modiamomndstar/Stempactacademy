import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  Award,
  Search,
  Filter,
  Layers,
  RefreshCw,
  Eye,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge, Card } from '../UIElements';
import { StudentLearningInspectorModal } from '../academic/StudentLearningInspectorModal';

interface StudentLearningManagerProps {
  programs?: any[];
  cohorts?: any[];
}

export const StudentLearningManager: React.FC<StudentLearningManagerProps> = ({
  programs = [],
  cohorts = [],
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedCohortId, setSelectedCohortId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);

  const fetchLearningDirectory = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentsLearningDirectory();
      setStudents(res?.students || []);
      setSummary(res?.summary || null);
    } catch (err) {
      console.error('Failed to load students learning directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningDirectory();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedLevel !== 'ALL' && s.levelCode !== selectedLevel) {
        return false;
      }
      if (selectedProgramId !== 'ALL' && s.program?.id !== selectedProgramId) {
        return false;
      }
      if (selectedCohortId !== 'ALL' && s.cohort?.id !== selectedCohortId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (s.fullName || '').toLowerCase().includes(q) ||
          (s.studentIdNumber || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.program?.name || '').toLowerCase().includes(q) ||
          (s.cohort?.name || '').toLowerCase().includes(q) ||
          (s.cohort?.cohortCode || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [students, selectedLevel, selectedProgramId, selectedCohortId, searchQuery]);

  const levelBadgeColor = (levelCode: string) => {
    if (levelCode === 'LEVEL_4_SPECIALIST' || levelCode === 'LEVEL_4_MASTERY') {
      return 'bg-amber-100 text-amber-900 border border-amber-300';
    }
    if (levelCode === 'LEVEL_3_ADVANCED') {
      return 'bg-purple-100 text-purple-900 border border-purple-300';
    }
    if (levelCode === 'LEVEL_2_INTERMEDIATE') {
      return 'bg-blue-100 text-blue-900 border border-blue-300';
    }
    return 'bg-indigo-100 text-indigo-900 border border-indigo-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Student Learning & Academic Progress Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor unit-by-unit lesson completion, cohort class sections across Levels 1–4, attendance, coursework grades, and certificate readiness. Click any student&apos;s name to inspect their full learning profile.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLearningDirectory}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Progress</span>
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Active Learners</span>
            <h3 className="text-2xl font-black text-slate-900">
              {summary?.totalStudents ?? students.length}
            </h3>
            <p className="text-[10px] text-slate-500">
              Across Levels 1–4 class sections
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Avg Syllabus Progress
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {summary?.averageLessonCompletion ?? 0}%
            </h3>
            <p className="text-[10px] text-blue-600 font-semibold">
              UoPeople Units & Lessons
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Avg Attendance Rate
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {summary?.averageAttendanceRate ?? 100}%
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold">
              Scheduled lab & class sessions
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Certificate Ready / Issued
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {summary?.eligibleForCertificateCount ?? 0}
            </h3>
            <p className="text-[10px] text-slate-500">
              Met ≥90% lessons & ≥75% attendance
            </p>
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Level Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Academic Level:
            </span>
            {[
              { code: 'ALL', label: `All Levels (${students.length})` },
              {
                code: 'LEVEL_1_FOUNDATION',
                label: `Level 1 — Foundation (${summary?.byLevelCounts?.LEVEL_1_FOUNDATION ?? 0})`,
              },
              {
                code: 'LEVEL_2_INTERMEDIATE',
                label: `Level 2 — Intermediate (${summary?.byLevelCounts?.LEVEL_2_INTERMEDIATE ?? 0})`,
              },
              {
                code: 'LEVEL_3_ADVANCED',
                label: `Level 3 — Advanced (${summary?.byLevelCounts?.LEVEL_3_ADVANCED ?? 0})`,
              },
              {
                code: 'LEVEL_4_SPECIALIST',
                label: `Level 4 — Specialist (${summary?.byLevelCounts?.LEVEL_4_SPECIALIST ?? 0})`,
              },
            ].map((lvl) => (
              <button
                key={lvl.code}
                type="button"
                onClick={() => setSelectedLevel(lvl.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedLevel === lvl.code
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {programs.length > 0 && (
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white max-w-[200px] truncate"
              >
                <option value="ALL">All Programs</option>
                {programs.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {cohorts.length > 0 && (
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white max-w-[200px] truncate"
              >
                <option value="ALL">All Class Sections</option>
                {cohorts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cohortCode})
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, ID, class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white w-52 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Student Learning Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Enrolled Learners & Live Curriculum Progress ({filteredStudents.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Click on any student&apos;s name to open their full unit-by-unit and lesson-by-lesson learning inspector.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              Synchronizing student lesson progress across all cohorts...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">No students match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Learner Name</th>
                  <th className="py-2.5 px-3">Program & Class Section</th>
                  <th className="py-2.5 px-3">Academic Level</th>
                  <th className="py-2.5 px-3">Units & Lessons Completed</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Overall Progress</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-indigo-50/30 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-500">
                      {st.studentIdNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => setInspectingStudentId(st.id)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-black text-indigo-700 group-hover:text-indigo-900 group-hover:underline flex items-center gap-1.5">
                          <span>{st.fullName}</span>
                          <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        </div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </button>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{st.program?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {st.cohort?.name} ({st.cohort?.cohortCode})
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${levelBadgeColor(
                          st.levelCode
                        )}`}
                      >
                        {st.levelDisplayName || st.levelCode?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                          {st.metrics?.completedLessons || 0} / {st.metrics?.totalLessons || 0} Lessons
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({st.metrics?.completedUnits || 0}/{st.metrics?.totalUnits || 0} Units)
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-emerald-700">
                        {st.metrics?.attendanceRate ?? 100}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${st.metrics?.completionRate || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900">
                          {st.metrics?.completionRate || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingStudentId(st.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Inspect Learning</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Student Learning Inspector Modal */}
      <StudentLearningInspectorModal
        studentId={inspectingStudentId}
        onClose={() => setInspectingStudentId(null)}
        onUpdated={fetchLearningDirectory}
      />
    </div>
  );
};
