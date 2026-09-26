import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Calendar, Users, DollarSign, Clock, MapPin, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../UIElements';

interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCohortCreated: () => Promise<void>;
  programs: any[];
  academicSessions: any[];
  initialProgramId?: string;
  initialAcademicSessionId?: string;
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [programId, setProgramId] = useState(initialProgramId || (programs[0]?.id || ''));
  const [academicSessionId, setAcademicSessionId] = useState(
    initialAcademicSessionId || (academicSessions.find((s) => s.isCurrent)?.id || academicSessions[0]?.id || '')
  );
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Level 1 (Foundation)');
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [trainingFee, setTrainingFee] = useState(65000);
  const [registrationFee, setRegistrationFee] = useState(5000);
  const [certificationFee, setCertificationFee] = useState(10000);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [schedule, setSchedule] = useState('Saturdays (9:00 AM – 1:00 PM) & Sundays (2:00 PM – 5:00 PM)');
  const [mode, setMode] = useState('Hybrid (Onsite Ile-Ife & Virtual Interactive)');
  const [location, setLocation] = useState('STEMPACT Innovation Hub, 14 Fajuyi Road, Ile-Ife, Osun State');
  const [instructorName, setInstructorName] = useState('Lead Faculty Mentor');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'UPCOMING' | 'CLOSED'>('OPEN');

  // Auto-fill suggested cohort name and default fee when program changes
  useEffect(() => {
    if (programId) {
      const selectedProg = programs.find((p) => p.id === programId);
      if (selectedProg) {
        const sessionObj = academicSessions.find((s) => s.id === academicSessionId);
        const sessionYear = sessionObj?.name ? sessionObj.name.split(' ')[0] : new Date().getFullYear();
        setName(`${selectedProg.name} — ${sessionYear} Cohort`);
        if (selectedProg.standardTuitionFee) {
          setTrainingFee(Number(selectedProg.standardTuitionFee));
        }
      }
    }
  }, [programId, academicSessionId, programs, academicSessions]);

  // Set default dates if empty
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Cohort name is required.');
      return;
    }
    if (!programId) {
      setError('Please select an Academic Program.');
      return;
    }
    if (!startDate || !endDate || !applicationDeadline) {
      setError('Please provide start date, end date, and application deadline.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createCohort({
        name: name.trim(),
        programId,
        academicSessionId: academicSessionId || undefined,
        level,
        maxCapacity: Number(maxCapacity),
        trainingFee: Number(trainingFee),
        registrationFee: Number(registrationFee),
        certificationFee: Number(certificationFee),
        discountPercentage: Number(discountPercentage),
        schedule: schedule.trim(),
        mode: mode.trim(),
        location: location.trim(),
        instructorName: instructorName.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        applicationDeadline: new Date(applicationDeadline).toISOString(),
        status,
      });

      setSuccess('Cohort successfully created and configured! Publishing to catalog and public page...');
      await onCohortCreated();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create cohort:', err);
      setError(err.message || 'Failed to create cohort. Please verify parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProgram = programs.find((p) => p.id === programId);
  const netTuition = trainingFee * (1 - discountPercentage / 100);
  const totalInvoiced = netTuition + registrationFee + certificationFee;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 shrink-0 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Academic Administration
              </span>
              <span className="text-xs text-slate-300">New Cohort Setup & Public Publishing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Create & Launch New Cohort
            </h2>
            <p className="text-xs text-slate-300">
              Configure program capacity limits, schedule, fees, and launch for public applications.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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

          {/* SECTION 1: PROGRAM & ACADEMIC SESSION */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>1. Program & Academic Session Anchoring</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Target Academic Program <span className="text-rose-500">*</span>
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.school?.code || 'SCH'}] {p.code} — {p.name}
                    </option>
                  ))}
                </select>
                {selectedProgram && (
                  <span className="text-[11px] text-slate-500 block">
                    Duration: {selectedProgram.durationWeeks || 12} Weeks • Award: {selectedProgram.award || 'Professional Certificate'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Academic Session <span className="text-rose-500">*</span>
                </label>
                <select
                  value={academicSessionId}
                  onChange={(e) => setAcademicSessionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                >
                  {academicSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? '(CURRENT / ACTIVE)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 block">
                  Cohorts run within this registered academic session framework.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Cohort Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Full-Stack Software Engineering — Spring 2027 Cohort"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Target Academic Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                >
                  <option value="Level 1 (Foundation)">Level 1 (Foundation)</option>
                  <option value="Level 2 (Intermediate Accelerator)">Level 2 (Intermediate Accelerator)</option>
                  <option value="Level 3 (Advanced Specialization)">Level 3 (Advanced Specialization)</option>
                  <option value="Full Immersive (Level 1 to Level 3)">Full Immersive (Level 1 to Level 3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: INTAKE CAPACITY & PUBLIC AVAILABILITY */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>2. Maximum Intake Capacity & Registration Control</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Maximum Seat Intake (Capacity) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                  required
                />
                <span className="text-[10px] text-slate-500 block">
                  Intake limit for this program. Once filled, status moves to FULL.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Registration / Application Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold focus:outline-blue-600 ${
                    status === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : status === 'UPCOMING'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="OPEN">OPEN (Accepting Public Applications)</option>
                  <option value="UPCOMING">UPCOMING (Announced, Not Yet Open)</option>
                  <option value="CLOSED">CLOSED (Intake Closed / Not Open)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  Controls whether applicants can apply on the public /cohorts page.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Lead Faculty Mentor
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="e.g. Engr. Damilola Adeyemi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CALENDAR & TIMETABLE SCHEDULE */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>3. Calendar Dates & Class Timetable</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Cohort Graduation Date <span className="text-rose-500">*</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Class Schedule Pattern <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Mondays, Wednesdays, Fridays (4:00 PM – 7:00 PM WAT)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Delivery Mode & Venue
                </label>
                <input
                  type="text"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  placeholder="e.g. Hybrid (Onsite Ile-Ife & Virtual Interactive)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-blue-600"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: COMMERCIAL FEES & LEDGER MATRIX */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>4. Commercial Fee Matrix & Merit Discounts</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Tuition Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={trainingFee}
                  onChange={(e) => setTrainingFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Registration Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Certification Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={certificationFee}
                  onChange={(e) => setCertificationFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Merit Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-blue-600"
                />
              </div>
            </div>

            {/* Calculated Fee Summary Strip */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300">
                Calculated Invoiced Tuition (after {discountPercentage}% discount):
              </span>
              <strong className="text-emerald-600 text-sm">
                ₦{totalInvoiced.toLocaleString()} Total per Admitted Student
              </strong>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner message="" />
                  <span>Launching Cohort...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create & Publish Cohort</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
