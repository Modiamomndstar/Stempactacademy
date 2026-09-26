import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import {
  X,
  Calendar,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Check,
  School,
  Layers,
  Search,
} from 'lucide-react';
import { Badge, LoadingSpinner } from '../UIElements';

interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCohortCreated: () => Promise<void>;
  programs: any[];
  academicSessions: any[];
  initialProgramId?: string;
  initialAcademicSessionId?: string;
}

interface ProgramIntakeConfig {
  programId: string;
  programName: string;
  programCode: string;
  schoolName: string;
  schoolCode: string;
  maxCapacity: number;
  trainingFee: number;
  registrationFee: number;
  certificationFee: number;
  discountPercentage: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
}

export const CreateCohortModal: React.FC<CreateCohortModalProps> = ({
  isOpen,
  onClose,
  onCohortCreated,
  programs,
  academicSessions,
  initialProgramId,
  initialAcademicSessionId,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Academic Session & Intake Batch Identity
  const [academicSessionId, setAcademicSessionId] = useState(
    initialAcademicSessionId || (academicSessions.find((s) => s.isCurrent)?.id || academicSessions[0]?.id || '')
  );
  const [batchName, setBatchName] = useState('Alpha Intake 2026');
  const [schedule, setSchedule] = useState('Mondays, Wednesdays, Fridays (4:00 PM – 7:00 PM WAT)');
  const [mode, setMode] = useState('Hybrid (Onsite Ile-Ife Hub & Virtual Interactive)');
  const [location, setLocation] = useState('STEMPACT Innovation Hub, 14 Fajuyi Road, Ile-Ife, Osun State');
  const [instructorName, setInstructorName] = useState('Lead Faculty Mentor & Academy Engineers');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');

  // Step 2: Multi-Program Activation
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');
  const [programSearch, setProgramSearch] = useState<string>('');
  const [activeConfigs, setActiveConfigs] = useState<Record<string, ProgramIntakeConfig>>({});

  // Auto-fill default dates
  useEffect(() => {
    if (!startDate) {
      const now = new Date();
      const start = new Date(now.getTime() + 14 * 86400000); // 2 weeks ahead
      const end = new Date(start.getTime() + 90 * 86400000); // 3 months duration
      const deadline = new Date(start.getTime() - 3 * 86400000); // 3 days before start

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setApplicationDeadline(deadline.toISOString().split('T')[0]);
    }
  }, [startDate]);

  // Keep academicSessionId in sync with props
  useEffect(() => {
    if (initialAcademicSessionId) {
      setAcademicSessionId(initialAcademicSessionId);
    } else if (!academicSessionId && academicSessions.length > 0) {
      const current = academicSessions.find((s) => s.isCurrent)?.id || academicSessions[0]?.id || '';
      setAcademicSessionId(current);
    }
  }, [initialAcademicSessionId, academicSessions, academicSessionId]);

  // If an initialProgramId was passed, activate it by default
  useEffect(() => {
    if (initialProgramId && programs.length > 0) {
      const p = programs.find((prog) => prog.id === initialProgramId);
      if (p) {
        setActiveConfigs((prev) => ({
          ...prev,
          [p.id]: {
            programId: p.id,
            programName: p.name,
            programCode: p.code,
            schoolName: p.school?.name || 'Academy School',
            schoolCode: p.school?.code || 'SCH',
            maxCapacity: 25,
            trainingFee: Number(p.standardTuitionFee) || 65000,
            registrationFee: 5000,
            certificationFee: 10000,
            discountPercentage: 0,
            status: 'OPEN',
          },
        }));
      }
    }
  }, [initialProgramId, programs]);

  // Distinct schools
  const distinctSchools = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    programs.forEach((p) => {
      if (p.school && p.school.code) {
        map.set(p.school.code, { code: p.school.code, name: p.school.name });
      }
    });
    return Array.from(map.values());
  }, [programs]);

  // Filtered program selection list
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (selectedSchoolFilter !== 'ALL' && p.school?.code !== selectedSchoolFilter) return false;
      if (programSearch) {
        const q = programSearch.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [programs, selectedSchoolFilter, programSearch]);

  const toggleProgram = (prog: any) => {
    setActiveConfigs((prev) => {
      const next = { ...prev };
      if (next[prog.id]) {
        delete next[prog.id];
      } else {
        next[prog.id] = {
          programId: prog.id,
          programName: prog.name,
          programCode: prog.code,
          schoolName: prog.school?.name || 'Academy School',
          schoolCode: prog.school?.code || 'SCH',
          maxCapacity: 25,
          trainingFee: Number(prog.standardTuitionFee) || 65000,
          registrationFee: 5000,
          certificationFee: 10000,
          discountPercentage: 0,
          status: 'OPEN',
        };
      }
      return next;
    });
  };

  const updateConfig = (progId: string, field: keyof ProgramIntakeConfig, value: any) => {
    setActiveConfigs((prev) => {
      if (!prev[progId]) return prev;
      return {
        ...prev,
        [progId]: {
          ...prev[progId],
          [field]: value,
        },
      };
    });
  };

  if (!isOpen) return null;

  const selectedCount = Object.keys(activeConfigs).length;
  const currentSession = academicSessions.find((s) => s.id === academicSessionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedCount === 0) {
      setError('Please select at least one program to activate for this cohort intake batch.');
      return;
    }
    if (!batchName.trim()) {
      setError('Please provide a cohort intake batch name.');
      return;
    }
    if (!startDate || !endDate || !applicationDeadline) {
      setError('Please provide start date, end date, and application deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const configs = Object.values(activeConfigs);
      let createdCount = 0;

      for (let i = 0; i < configs.length; i++) {
        const cfg = configs[i];
        setProgressMsg(`Creating cohort for ${cfg.programName} (${i + 1}/${configs.length})...`);

        const cohortFullName = `${cfg.programName} — ${batchName.trim()}`;

        await api.createCohort({
          name: cohortFullName,
          programId: cfg.programId,
          academicSessionId: academicSessionId || undefined,
          level: 'Level 1 (Foundation)',
          maxCapacity: Number(cfg.maxCapacity),
          trainingFee: Number(cfg.trainingFee),
          registrationFee: Number(cfg.registrationFee),
          certificationFee: Number(cfg.certificationFee),
          discountPercentage: Number(cfg.discountPercentage),
          schedule: schedule.trim(),
          mode: mode.trim(),
          location: location.trim(),
          instructorName: instructorName.trim(),
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          applicationDeadline: new Date(applicationDeadline).toISOString(),
          status: cfg.status,
        });

        createdCount++;
      }

      setSuccess(`Successfully launched ${createdCount} program cohorts under "${batchName}"! Public registration is now open.`);
      await onCohortCreated();
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Failed to create cohorts:', err);
      setError(err.message || 'Failed to create cohort intake batch.');
    } finally {
      setSubmitting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 shrink-0 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Cohort Intake Architecture
              </span>
              <span className="text-xs text-slate-300">Multi-Program Batch Setup</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create Cohort Intake Batch
            </h2>
            <p className="text-xs text-slate-300">
              Establish an intake batch under an Academic Session and activate programs with customized capacity limits.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* STEP 1: ACADEMIC SESSION & BATCH TIMING */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Step 1: Academic Session & Intake Batch Identity</span>
              </h4>
              <Badge variant="blue">
                {currentSession?.name || 'Selected Academic Session'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Target Academic Session <span className="text-rose-500">*</span>
                </label>
                <select
                  value={academicSessionId}
                  onChange={(e) => setAcademicSessionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                >
                  {academicSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? '(ACTIVE SESSION)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Cohort Intake Batch Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alpha Intake 2026 or Spring 2027 Accelerated Batch"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Application Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Cohort Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Graduation Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Class Schedule Pattern
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Delivery Venue & Mode
                </label>
                <input
                  type="text"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: MULTI-PROGRAM SELECTION ACROSS THE 8 SCHOOLS */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <span>Step 2: Select Programs to Run in this Cohort Intake</span>
              </h4>
              <span className="font-bold text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-full">
                {selectedCount} Programs Activated
              </span>
            </div>

            {/* School Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedSchoolFilter('ALL')}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                  selectedSchoolFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Schools ({programs.length})
              </button>
              {distinctSchools.map((sch) => (
                <button
                  key={sch.code}
                  type="button"
                  onClick={() => setSelectedSchoolFilter(sch.code)}
                  className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                    selectedSchoolFilter === sch.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sch.code}
                </button>
              ))}
            </div>

            {/* Program Selection Checkbox Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {filteredPrograms.map((p) => {
                const isSelected = !!activeConfigs[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProgram(p)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {p.code}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{p.school?.code}</span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {p.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: INDIVIDUAL PROGRAM INTAKE CAPACITY & PRICING CUSTOMIZATION */}
          {selectedCount > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Step 3: Customize Intake Capacity & Fees for Each Program</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Set program-specific maximum capacity limits and open/closed registration status.
                </span>
              </div>

              <div className="space-y-3">
                {Object.values(activeConfigs).map((cfg) => (
                  <div
                    key={cfg.programId}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {cfg.programCode}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {cfg.schoolName}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {cfg.programName}
                        </h5>
                      </div>

                      {/* Status toggle for this program in this cohort */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">
                          Intake Status:
                        </label>
                        <select
                          value={cfg.status}
                          onChange={(e) => updateConfig(cfg.programId, 'status', e.target.value)}
                          className={`text-xs font-bold px-3 py-1 rounded-xl border cursor-pointer ${
                            cfg.status === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : cfg.status === 'UPCOMING'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="OPEN">OPEN (Accepting Applications)</option>
                          <option value="UPCOMING">UPCOMING (Announced, Not Yet Open)</option>
                          <option value="CLOSED">CLOSED (Intake Closed)</option>
                        </select>
                      </div>
                    </div>

                    {/* Program Custom Intake & Fee Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Max Seat Capacity
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={cfg.maxCapacity}
                          onChange={(e) => updateConfig(cfg.programId, 'maxCapacity', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-blue-600"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Tuition Fee (₦)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={cfg.trainingFee}
                          onChange={(e) => updateConfig(cfg.programId, 'trainingFee', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Registration Fee (₦)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={cfg.registrationFee}
                          onChange={(e) => updateConfig(cfg.programId, 'registrationFee', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono focus:outline-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={cfg.discountPercentage}
                          onChange={(e) => updateConfig(cfg.programId, 'discountPercentage', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono focus:outline-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {progressMsg || `Ready to launch ${selectedCount} program cohorts in "${batchName}"`}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedCount === 0}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner message="" />
                    <span>Launching Intake Batch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Cohort Intake Batch ({selectedCount} Programs)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
