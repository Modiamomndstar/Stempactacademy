import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  X,
  BookOpen,
  Sparkles,
  Check,
  AlertCircle,
  Layers,
  Award,
  DollarSign,
  Clock,
  Shield,
  Briefcase,
  FolderGit2,
  Lock,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../UIElements';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  schools: any[];
  programToEdit?: any | null; // If provided, edit mode; otherwise create mode
  initialSchoolId?: string; // Preselect school if launched from school drilldown
  activeCohortCount?: number;
}

export const ProgramModal: React.FC<ProgramModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  schools,
  programToEdit,
  initialSchoolId,
  activeCohortCount = 0,
}) => {
  const isEditMode = Boolean(programToEdit);
  const [activeTab, setActiveTab] = useState<'identity' | 'curriculum' | 'tuition'>('identity');

  // Form State
  const [schoolId, setSchoolId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [award, setAward] = useState('Professional Certificate');
  const [status, setStatus] = useState('OPEN_FOR_APPLICATION');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isKidsTrack, setIsKidsTrack] = useState(false);
  const [targetAgeGroup, setTargetAgeGroup] = useState('Ages 16+');
  const [totalLevels, setTotalLevels] = useState<number>(4);

  // Curriculum State
  const [duration, setDuration] = useState('12 Weeks');
  const [contactHours, setContactHours] = useState<number>(72);

  const handleDurationChange = (newVal: string) => {
    setDuration(newVal);
    const match = newVal.match(/\d+/);
    if (match) {
      const weeks = parseInt(match[0], 10);
      if (weeks > 0 && weeks <= 52) {
        setContactHours(weeks * 6);
      }
    }
  };
  const [targetLearner, setTargetLearner] = useState('Aspiring technologists, computer science students, and career changers.');
  const [entryRequirements, setEntryRequirements] = useState('Basic computer literacy, high school education, and analytical mindset.');
  const [prerequisites, setPrerequisites] = useState('None (starts from foundational principles).');
  const [learningLevels, setLearningLevels] = useState(
    'Level 1: Foundation (Core Concepts) | Level 2: Applied (Practical Implementation) | Level 3: Advanced (Architecture & Scalability) | Level 4: Mastery (Industry Capstone)'
  );
  const [tools, setTools] = useState('Git, VS Code, Linux, Cloud Platforms');
  const [projects, setProjects] = useState('Hands-on weekly lab deliverables and production-grade prototypes');
  const [capstone, setCapstone] = useState('Comprehensive production capstone defense evaluated by industry mentors');
  const [assessmentCriteria, setAssessmentCriteria] = useState('Weekly practical labs (40%), capstone project (40%), attendance & defense (20%)');
  const [competencies, setCompetencies] = useState('Industry-aligned technical workflows, code architecture, testing, and deployment');
  const [certification, setCertification] = useState('STEMPACT Certified Technology Specialist Credential');
  const [careerPathways, setCareerPathways] = useState('Junior Developer, Systems Engineer, Technology Specialist, Tech Founder');
  const [progressionPathway, setProgressionPathway] = useState('Students progress level-by-level across cohorts upon satisfying academic clearance.');

  // Tuition State
  const [standardTuitionFee, setStandardTuitionFee] = useState<number>(65000);
  const [registrationFee, setRegistrationFee] = useState<number>(5000);
  const [certificationFee, setCertificationFee] = useState<number>(10000);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [curatingVideos, setCuratingVideos] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (programToEdit) {
      setSchoolId(programToEdit.schoolId || programToEdit.school?.id || initialSchoolId || schools[0]?.id || '');
      setName(programToEdit.name || '');
      setCode(programToEdit.code || '');
      setDescription(programToEdit.description || '');
      setAward(programToEdit.award || 'Professional Certificate');
      setStatus(programToEdit.status || 'OPEN_FOR_APPLICATION');
      setIsFeatured(Boolean(programToEdit.isFeatured));
      setIsKidsTrack(Boolean(programToEdit.isKidsTrack));
      setTargetAgeGroup(programToEdit.targetAgeGroup || (programToEdit.isKidsTrack ? 'Ages 7-16' : 'Ages 16+'));
      setTotalLevels(programToEdit.totalLevels || 4);

      const initialDur = programToEdit.duration || `${programToEdit.durationWeeks || 12} Weeks`;
      setDuration(initialDur);
      const initialWeeks = parseInt(initialDur.replace(/\D/g, ''), 10) || 12;
      setContactHours(programToEdit.contactHours || initialWeeks * 6);
      setTargetLearner(programToEdit.targetLearner || 'Aspiring technologists and developers');
      setEntryRequirements(programToEdit.entryRequirements || 'Basic computer literacy');
      setPrerequisites(programToEdit.prerequisites || 'None');
      setLearningLevels(programToEdit.learningLevels || 'Level 1: Foundation, Level 2: Intermediate, Level 3: Advanced, Level 4: Mastery');
      setTools(programToEdit.tools || '');
      setProjects(programToEdit.projects || '');
      setCapstone(programToEdit.capstone || '');
      setAssessmentCriteria(programToEdit.assessmentCriteria || '');
      setCompetencies(programToEdit.competencies || '');
      setCertification(programToEdit.certification || '');
      setCareerPathways(programToEdit.careerPathways || '');
      setProgressionPathway(programToEdit.progressionPathway || '');

      setStandardTuitionFee(Number(programToEdit.standardTuitionFee) || 65000);
      setRegistrationFee(Number(programToEdit.registrationFee) || 5000);
      setCertificationFee(Number(programToEdit.certificationFee) || 10000);
    } else {
      setSchoolId(initialSchoolId || schools[0]?.id || '');
      setName('');
      setCode('');
      setDescription('');
      setAward('Professional Certificate');
      setStatus('OPEN_FOR_APPLICATION');
      setIsFeatured(false);
      setIsKidsTrack(false);
      setTargetAgeGroup('Ages 16+');
      setTotalLevels(4);

      setDuration('12 Weeks');
      setContactHours(120);
      setTargetLearner('Aspiring technologists, university students, and career switchers.');
      setEntryRequirements('Basic computer literacy, analytical mindset.');
      setPrerequisites('None (starts from foundational principles).');
      setLearningLevels('Level 1: Foundation (Core Concepts) | Level 2: Applied (Practical Implementation) | Level 3: Advanced (Architecture) | Level 4: Mastery (Industry Capstone)');
      setTools('Git, VS Code, Linux, Cloud Platforms');
      setProjects('Hands-on lab assignments and milestone portfolio projects');
      setCapstone('Production capstone project evaluated by academy faculty');
      setAssessmentCriteria('Practical assignments (40%), capstone project (40%), attendance & defense (20%)');
      setCompetencies('Industry workflows, modern toolchains, and collaborative delivery');
      setCertification('STEMPACT Certified Specialist Credential');
      setCareerPathways('Junior Engineer, Solutions Specialist, Technical Founder');
      setProgressionPathway('Progresses level-by-level across distinct cohorts upon satisfying completion criteria.');

      setStandardTuitionFee(65000);
      setRegistrationFee(5000);
      setCertificationFee(10000);
    }
    setError('');
    setSuccess('');
    setActiveTab('identity');
  }, [programToEdit, initialSchoolId, schools, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!schoolId) {
      setError('Please select an Academic School for this program.');
      return;
    }
    if (!name.trim()) {
      setError('Program Name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Program Code is required (e.g. AIML, FSWD).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        schoolId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        award,
        status,
        isFeatured,
        isKidsTrack,
        targetAgeGroup,
        totalLevels: Number(totalLevels) || 4,
        duration,
        contactHours: Number(contactHours) || 120,
        targetLearner,
        entryRequirements,
        prerequisites,
        learningLevels,
        tools,
        projects,
        capstone,
        assessmentCriteria,
        competencies,
        certification,
        careerPathways,
        progressionPathway,
        standardTuitionFee: Number(standardTuitionFee),
        registrationFee: Number(registrationFee),
        certificationFee: Number(certificationFee),
      };

      if (isEditMode) {
        await api.updateProgram(programToEdit.id, payload);
        setSuccess(`Program "${name}" updated successfully.`);
      } else {
        await api.createProgram(payload);
        setSuccess(`Program "${name}" cataloged successfully.`);
      }

      await onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Program save error:', err);
      setError(err.message || 'Failed to save program details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCurateVideos = async () => {
    if (!programToEdit?.id) return;
    setCuratingVideos(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.curateProgramVideos(programToEdit.id);
      setSuccess(`AI Video Curator dispatched! Curated ${res?.lessonsCount || 0} module lessons with verified YouTube tutorial iframes.`);
      await onSaved();
    } catch (err: any) {
      setError(err.message || 'AI Video curation failed.');
    } finally {
      setCuratingVideos(false);
    }
  };

  const selectedSchoolObj = schools.find((s) => s.id === schoolId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 shrink-0 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                {isEditMode ? 'Program Catalog Configuration' : 'New Academic Program'}
              </span>
              {selectedSchoolObj && (
                <span className="text-xs text-slate-300">
                  {selectedSchoolObj.name}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isEditMode ? `Edit Program: ${programToEdit.name}` : 'Create Academic Program'}
            </h2>
            <p className="text-xs text-slate-300">
              Establish accredited STEMPACT programs, level progression criteria, practical milestones, and syllabus parameters.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cohort Version Immutability Notice (If active cohorts exist) */}
        {isEditMode && activeCohortCount > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cohort Version Lock Active:</strong> {activeCohortCount} ongoing/past cohort(s) use this program. Updates here update the master curriculum template and will apply to <strong>future cohorts and new intakes</strong>, protecting current enrolled students from mid-flight syllabus changes.
            </span>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`px-4 py-2.5 rounded-t-xl font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'identity'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Identity & Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`px-4 py-2.5 rounded-t-xl font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Academic Syllabus & Levels</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tuition')}
            className={`px-4 py-2.5 rounded-t-xl font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'tuition'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Tuition & Deliverables</span>
          </button>

          {isEditMode && (
            <div className="ml-auto">
              <button
                type="button"
                disabled={curatingVideos}
                onClick={handleCurateVideos}
                className="px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>{curatingVideos ? 'Curating Videos...' : 'AI Curate Videos'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: IDENTITY & FACULTY */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Host School / Faculty *
                  </label>
                  <select
                    required
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select Faculty --</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Artificial Intelligence & Machine Learning"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Canonical Program Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    placeholder="e.g. AIML"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Academic Award / Credential
                  </label>
                  <select
                    value={award}
                    onChange={(e) => setAward(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Professional Certificate">Professional Certificate</option>
                    <option value="Executive Diploma">Executive Diploma</option>
                    <option value="Foundational Badge">Foundational Badge (Kids/Teens)</option>
                    <option value="Micro-Credential">Micro-Credential</option>
                    <option value="Postgraduate Specialization">Postgraduate Specialization</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Admissions Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="OPEN_FOR_APPLICATION">Open for Admissions</option>
                    <option value="FULL">Intake Cohort Full</option>
                    <option value="CLOSED">Admissions Closed</option>
                    <option value="ARCHIVED">Archived / Deprecated</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  Program Overview & Executive Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the core objective, industry relevance, and high-level training roadmap..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Kids/Teens Gamified Track Options */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-900">Young Innovators Track (Kids & Teens)</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isKidsTrack}
                      onChange={(e) => setIsKidsTrack(e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className="font-semibold text-indigo-900">Enable Gamified Kid UI</span>
                  </label>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Enabling Kids Track automatically activates the badge-reward gamified dashboard variant in the student portal and customizes the parent guardian dashboard views.
                </p>
                {isKidsTrack && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="font-bold text-indigo-900">Target Age Group</label>
                      <input
                        type="text"
                        placeholder="e.g. Ages 7-12 or Ages 13-17"
                        value={targetAgeGroup}
                        onChange={(e) => setTargetAgeGroup(e.target.value)}
                        className="w-full p-2 rounded-lg border border-indigo-200 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-indigo-900">Total Academic Levels</label>
                      <select
                        value={totalLevels}
                        onChange={(e) => setTotalLevels(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-indigo-200 bg-white text-xs"
                      >
                        <option value={2}>2 Levels</option>
                        <option value={3}>3 Levels</option>
                        <option value={4}>4 Levels (Full Academy Track)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CURRICULUM & LEVELS */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Duration per Level / Cohort</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold font-mono">
                      {parseInt((duration || '').replace(/\D/g, ''), 10) || 12} Weeks
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8 Weeks (or 3 Months)"
                    value={duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {/* Quick Duration Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '4w', weeks: 4, hrs: 24 },
                      { label: '6w', weeks: 6, hrs: 36 },
                      { label: '8w', weeks: 8, hrs: 48 },
                      { label: '10w', weeks: 10, hrs: 60 },
                      { label: '12w', weeks: 12, hrs: 72 },
                      { label: '16w', weeks: 16, hrs: 96 },
                    ].map((preset) => {
                      const isSelected = (parseInt((duration || '').replace(/\D/g, ''), 10) || 0) === preset.weeks;
                      return (
                        <button
                          key={preset.weeks}
                          type="button"
                          onClick={() => {
                            setDuration(`${preset.weeks} Weeks`);
                            setContactHours(preset.hrs);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {preset.weeks} Weeks ({preset.hrs}h)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Total Contact / Mentorship Hours</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                      {contactHours} Hours Total
                    </span>
                  </label>
                  <input
                    type="number"
                    min={6}
                    value={contactHours}
                    onChange={(e) => setContactHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Calculated standard: {(() => {
                      const w = parseInt((duration || '').replace(/\D/g, ''), 10) || 8;
                      return `${w} weeks × 6 hrs/week = ${w * 6} contact hours`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Level Progression Framework */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Academic Level Progression Breakdown (Level 1 → Level 4)</span>
                </label>
                <textarea
                  rows={2}
                  value={learningLevels}
                  onChange={(e) => setLearningLevels(e.target.value)}
                  placeholder="Level 1: Foundation (Core Principles) | Level 2: Intermediate (Implementation) | Level 3: Advanced | Level 4: Mastery"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Students advance through these levels cohort-by-cohort upon achieving level certificate clearance.
                </p>
              </div>

              {/* Target Learners & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Target Learners
                  </label>
                  <textarea
                    rows={2}
                    value={targetLearner}
                    onChange={(e) => setTargetLearner(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Prerequisites & Entry Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={entryRequirements}
                    onChange={(e) => setEntryRequirements(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tools & Practical Projects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Industry Tools & Tech Stack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Python, React, PostgreSQL, Docker, Git"
                    value={tools}
                    onChange={(e) => setTools(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Career Pathways
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Stack Developer, AI Engineer, Technical Lead"
                    value={careerPathways}
                    onChange={(e) => setCareerPathways(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Capstone Project & Assessment Criteria */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Capstone Project Requirements</span>
                </label>
                <textarea
                  rows={2}
                  value={capstone}
                  onChange={(e) => setCapstone(e.target.value)}
                  placeholder="Define the practical capstone project deliverable students must defend for level clearance..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TUITION & FEES */}
          {activeTab === 'tuition' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1.5 text-xs text-blue-900">
                <strong className="block font-bold">Standard Cohort Tuition Baseline</strong>
                <p className="text-blue-700">
                  These fee baselines are automatically inherited as defaults when batch-generating cohorts under this program, but can still be adjusted per intake or for government/partner-sponsored free cohorts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Tuition Fee (NGN ₦) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={standardTuitionFee}
                    onChange={(e) => setStandardTuitionFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Registration Fee (NGN ₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Certification Fee (NGN ₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={certificationFee}
                    onChange={(e) => setCertificationFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assessment & Certification details */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Certification Title Issued upon Graduation</span>
                </label>
                <input
                  type="text"
                  value={certification}
                  onChange={(e) => setCertification(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  Assessment Weighting Criteria
                </label>
                <textarea
                  rows={2}
                  value={assessmentCriteria}
                  onChange={(e) => setAssessmentCriteria(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== 'tuition' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'identity' ? 'curriculum' : 'tuition')}
                  className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                >
                  Next Step →
                </button>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? 'Saving Program...' : isEditMode ? 'Update Program' : 'Catalog Program'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
