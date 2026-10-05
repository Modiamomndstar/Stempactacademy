import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, setAuthToken } from '../../services/api';
import { School, Program, Cohort } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
  BookOpen,
  Send,
  AlertCircle,
  CreditCard,
  Building,
  HelpCircle,
  Eye,
  EyeOff,
  Check,
  Clock,
  MapPin,
  RefreshCw,
  GraduationCap,
  Award,
  Compass,
  MessageCircle,
  Laptop,
  CheckCircle,
} from 'lucide-react';

export const ApplicationWizardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedCohortData, setSelectedCohortData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [manualSelectionMode, setManualSelectionMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form State based strictly on backend Application schema
  const [formData, setFormData] = useState({
    schoolId: '',
    programId: searchParams.get('programId') || '',
    cohortId: searchParams.get('cohortId') || '',
    preferredCenterId: '',
    preferredSchedule: 'Weekday Evenings (4:00 PM - 7:00 PM WAT)',
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    educationLevel: 'Undergraduate (University/Poly)',
    institution: '',
    previousTraining: '',
    technicalExperience: '',
    relevantSkills: '',
    previousProjects: '',
    careerGoals: '',
    learningObjectives: '',
    statementOfPurpose: '',
    isMinor: false,
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelationship: 'Mother',
    consentAccepted: true,
    // Funding and payment preferences (Phase 6 architecture)
    fundingSourcePreference: 'SELF',
    requestedPaymentPlan: 'FULL_UPFRONT',
    sponsorshipDetails: '',
    scholarshipRequested: false,
    financialAssistanceReason: '',
    financialNotes: '',
    password: '',
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [schoolsRes, programsRes, cohortsRes, sessionsRes, centersRes] = await Promise.all([
          api.getSchools(),
          api.getPrograms(),
          api.getCohorts({ openOnly: 'true' }),
          api.getAcademicSessions(),
          api.getCenters().catch(() => ({ centers: [] })),
        ]);
        const scList = schoolsRes.schools || [];
        const prList = programsRes.programs || [];
        const coList = cohortsRes.cohorts || [];
        const sessList = sessionsRes.academicSessions || [];

        setSchools(scList);
        setPrograms(prList);
        setCohorts(coList);
        setCenters(centersRes?.centers || []);

        const currentSess = sessList.find((s: any) => s.isCurrent) || sessList[0];
        setActiveSession(currentSess);

        const initialCohortId = searchParams.get('cohortId');
        const initialProgramId = searchParams.get('programId');

        let targetCohort: any = null;
        if (initialCohortId) {
          targetCohort = coList.find((c: any) => c.id === initialCohortId);
          if (!targetCohort) {
            try {
              const singleRes = await api.getCohortById(initialCohortId);
              targetCohort = singleRes.cohort;
            } catch (err) {
              console.warn('Could not fetch cohort by id:', err);
            }
          }
        }

        if (targetCohort) {
          setSelectedCohortData(targetCohort);
          const progId = targetCohort.programId || initialProgramId;
          const matchedProg = prList.find((p: Program) => p.id === progId);
          const schId = targetCohort.program?.schoolId || matchedProg?.schoolId || '';
          setFormData((prev) => ({
            ...prev,
            cohortId: targetCohort.id,
            programId: progId || prev.programId,
            schoolId: schId || prev.schoolId,
            preferredSchedule: targetCohort.schedule || prev.preferredSchedule,
          }));
        } else if (initialProgramId) {
          const matchedProg = prList.find((p: Program) => p.id === initialProgramId);
          if (matchedProg) {
            setFormData((prev) => ({
              ...prev,
              schoolId: matchedProg.schoolId,
              programId: matchedProg.id,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load initial application catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [searchParams]);

  // Dynamically calculate age from date of birth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const ageDiffMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiffMs);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      setFormData((prev) => ({ ...prev, isMinor: calculatedAge < 18 }));
    }
  }, [formData.dateOfBirth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const filteredPrograms = formData.schoolId
    ? programs.filter((p) => p.schoolId === formData.schoolId)
    : programs;

  const filteredCohorts = formData.programId
    ? cohorts.filter((c) => c.programId === formData.programId)
    : cohorts;

  const currentProgram = programs.find((p) => p.id === formData.programId);
  const currentSchool = schools.find((s) => s.id === formData.schoolId) || currentProgram?.school;
  const currentCenter = centers.find((c) => c.id === formData.preferredCenterId);
  const currentCohort = cohorts.find((c) => c.id === formData.cohortId) || selectedCohortData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 8) {
      setErrorMsg('A secure password of at least 8 characters is required for your applicant account.');
      return;
    }

    if (formData.isMinor && (!formData.parentName.trim() || !formData.parentPhone.trim() || !formData.parentEmail.trim())) {
      setErrorMsg('Safeguarding Requirement: Parent/Guardian contact details are required for applicants under 18.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.submitApplication(formData);
      if (response && response.token) {
        setAuthToken(response.token);
      }
      setSuccessData(response);
    } catch (err: any) {
      console.error('Application submission error:', err);
      setErrorMsg(err.message || 'Failed to submit application. Please review all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing STEMPACT Application Portal..." />;
  }

  // Submission Confirmation Screen
  if (successData) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="green">Application Submitted Successfully</Badge>
            <h1 className="text-3xl font-black text-slate-900">
              Welcome to STEMPACT Academy, {formData.fullName.split(' ')[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Your application has been received and registered into our admissions database.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-500 font-medium">Official Application Number:</span>
              <span className="text-sm font-black text-blue-600 tracking-wider font-mono">
                {successData.applicationNumber}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
              <span className="text-slate-500 font-medium">Applicant Account Email:</span>
              <span className="font-semibold text-slate-800">{formData.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Current Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                ASSESSMENT PENDING
              </span>
            </div>
          </div>

          {/* Mandatory Next Step Prompt */}
          <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-left space-y-3">
            <h3 className="font-bold text-sm text-blue-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Mandatory Next Step: Complete Diagnostic Placement Test</span>
            </h3>
            <p className="text-xs text-blue-900 leading-relaxed">
              To determine your optimal curriculum starting track (Foundation, Intermediate, or Specialist) and allow the Academic Board to evaluate your placement, please complete the diagnostic test now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to={`/assessment?appId=${successData.applicationId}&programId=${formData.programId}`}
              className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Take Diagnostic Placement Test Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/portal/applicant"
              className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              View Applicant Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* 1. Full-Width Premium Hero Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-5 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Admissions Portal • {activeSession?.name || '2026 Academic Session'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Begin Your Journey at STEMPACT Academy
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Register your candidate profile, select your engineering track and preferred training center, and complete your diagnostic placement assessment in 6 guided steps.
            </p>
          </div>

          {/* Quick Value Highlights */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-300 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified Credentials</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              <span>Campus & Virtual Hubs</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Diagnostic Placement</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body Container with 2-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20 space-y-6">
        {/* Interactive Progress Stepper Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Application Progress:</span>
              <span className="text-blue-600 font-black">Step {step} of 6</span>
            </span>
            <span className="font-mono text-slate-500 font-semibold">
              {Math.round((step / 6) * 100)}% Completed
            </span>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>

          {/* Stepper Steps Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { num: 1, label: 'Program Track', short: 'Track' },
              { num: 2, label: 'Personal Info', short: 'Profile' },
              { num: 3, label: 'Education', short: 'Education' },
              { num: 4, label: 'Career Goals', short: 'Goals' },
              { num: 5, label: 'Tuition Plan', short: 'Tuition' },
              { num: 6, label: 'Consent & Finish', short: 'Finish' },
            ].map((s) => (
              <div
                key={s.num}
                className={`p-2 rounded-xl text-center transition-all ${
                  step === s.num
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs font-bold'
                    : step > s.num
                    ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-medium'
                    : 'bg-slate-50 border border-slate-100 text-slate-400 font-normal'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs mb-0.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s.num
                        ? 'bg-blue-600 text-white'
                        : step > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step > s.num ? '✓' : s.num}
                  </span>
                </div>
                <div className="text-[11px] truncate hidden sm:block">{s.label}</div>
                <div className="text-[10px] truncate sm:hidden">{s.short}</div>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout: Form on Left, Snapshot Sidebar on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Column (8 cols on lg) */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg space-y-8">
        {/* STEP 1: SCHOOL, PROGRAM & COHORT */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Step 1: Academic Discipline & Cohort Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">
                Review your selected cohort track or choose your academic school and program manually.
              </p>
            </div>

            {/* PREFILLED CONFIRMED COHORT VIEW (When navigating from Cohorts or Programs page) */}
            {selectedCohortData && !manualSelectionMode ? (
              <div className="space-y-4">
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200">
                          {selectedCohortData.cohortCode || 'COHORT'}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {selectedCohortData.program?.school?.name ||
                            schools.find((s) => s.id === formData.schoolId)?.name ||
                            'STEMPACT School'}
                        </span>
                        {selectedCohortData.academicSession && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {selectedCohortData.academicSession.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {selectedCohortData.name}
                      </h3>
                      <p className="text-xs font-bold text-blue-900">
                        Track: {selectedCohortData.program?.name || currentProgram?.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setManualSelectionMode(true)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Change Program / Cohort</span>
                    </button>
                  </div>

                  {/* Cohort Schedule, Mode, & Start Date Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3 border-t border-blue-200/60 text-xs">
                    <div className="flex items-start gap-2.5 text-slate-800">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Commencement Date
                        </span>
                        <span className="font-bold text-slate-900">
                          {selectedCohortData.startDate
                            ? new Date(selectedCohortData.startDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'To Be Announced'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-slate-800">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Class Schedule Pattern
                        </span>
                        <span className="font-bold text-slate-900">
                          {selectedCohortData.schedule || formData.preferredSchedule}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-slate-800">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Delivery Venue & Mode
                        </span>
                        <span className="font-bold text-slate-900">
                          {selectedCohortData.mode || 'Hybrid (Onsite Ile-Ife & Virtual)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-blue-200/40 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">
                        Intake status: <strong className="text-emerald-700">Open for Enrollment</strong>
                      </span>
                    </div>

                    {selectedCohortData.trainingFee !== undefined && Number(selectedCohortData.trainingFee) > 0 && (
                      <span className="font-bold text-slate-900">
                        Tuition Fee: ₦{Number(selectedCohortData.trainingFee).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* MANUAL DROPDOWN SELECTION (When entering via admissions or when toggling change) */
              <div className="space-y-4">
                {selectedCohortData && manualSelectionMode && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-600 font-medium">
                      Manually customizing selection (previously: <strong>{selectedCohortData.name}</strong>)
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualSelectionMode(false)}
                      className="font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Restore Selected Cohort
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Academic School *</label>
                    <select
                      name="schoolId"
                      value={formData.schoolId}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((prev) => ({ ...prev, programId: '', cohortId: '' }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required
                    >
                      <option value="">-- Choose Academic School --</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Target Program Track *</label>
                    <select
                      name="programId"
                      value={formData.programId}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((prev) => ({ ...prev, cohortId: '' }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required
                    >
                      <option value="">-- Choose Program Track --</option>
                      {filteredPrograms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.duration})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Select Available Cohort (Optional)</label>
                    <select
                      name="cohortId"
                      value={formData.cohortId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const matched = cohorts.find((c) => c.id === cid);
                        setFormData((prev) => ({
                          ...prev,
                          cohortId: cid,
                          preferredSchedule: matched?.schedule || prev.preferredSchedule,
                        }));
                        if (matched) {
                          setSelectedCohortData(matched);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Open Cohort (Assigned upon placement) --</option>
                      {filteredCohorts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.cohortCode} • Starts{' '}
                          {c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB') : 'TBA'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Learning Center */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Preferred Learning Center / Campus</span>
                      <span className="text-slate-400 font-normal text-[11px]">(optional)</span>
                    </label>
                    <select
                      name="preferredCenterId"
                      value={formData.preferredCenterId}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Virtual / No Fixed Center Preference --</option>
                      {centers.map((center: any) => (
                        <option key={center.id} value={center.id}>
                          {center.name}{center.cityOrTown ? ` · ${center.cityOrTown}` : ''}{center.stateOrRegion ? ` (${center.stateOrRegion})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">Choose your nearest physical neighborhood hub, or select Virtual for remote access.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Preferred Learning Schedule *</label>
                    <input
                      type="text"
                      name="preferredSchedule"
                      value={formData.preferredSchedule}
                      onChange={handleChange}
                      placeholder="e.g. Weekday Evenings (4:00 PM - 7:00 PM WAT)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentProgram && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {currentProgram.code}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {currentProgram.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {currentProgram.description}
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="text-xs font-black text-slate-900">
                    {currentProgram.duration}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {currentProgram.contactHours} Contact Hours
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!formData.programId) {
                    setErrorMsg('Please choose an academic program track.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(2);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Continue to Personal Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL INFORMATION */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Step 2: Applicant Personal Details</span>
              </h2>
              <p className="text-xs text-slate-500">Official identification and contact information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Full Legal Name *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Oluwaseun Samuel Adeleke"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
                {formData.isMinor && (
                  <p className="text-[11px] text-amber-700 font-semibold">
                    Applicant is under 18. Parent/Guardian information will be verified in Step 6.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. +234 816 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Residential Address *</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. 12 Ede Road, Ile-Ife, Osun State"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.fullName.trim() || !formData.dateOfBirth || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim()) {
                    setErrorMsg('Please complete all personal details before proceeding.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(3);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Continue to Background</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EDUCATION & BACKGROUND */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Step 3: Education & Technical Background</span>
              </h2>
              <p className="text-xs text-slate-500">Helps our academic board evaluate your starting readiness.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Current Highest Education Level *</label>
                <select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="Primary School">Primary School (Junior track)</option>
                  <option value="Junior Secondary (JSS)">Junior Secondary (JSS)</option>
                  <option value="Senior Secondary (SSS / WAEC)">Senior Secondary (SSS / WAEC)</option>
                  <option value="Undergraduate (University/Poly)">Undergraduate (University/Poly)</option>
                  <option value="Graduate (HND/B.Sc/B.Tech)">Graduate (HND/B.Sc/B.Tech)</option>
                  <option value="Working Professional">Working Professional</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">School / Institution Name</label>
                <input
                  type="text"
                  name="institution"
                  placeholder="e.g. Obafemi Awolowo University, Ile-Ife"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Existing Technical Experience</label>
                <textarea
                  name="technicalExperience"
                  placeholder="Mention any programming languages, tools, electronics breadboarding, robotics, or design knowledge you have encountered..."
                  value={formData.technicalExperience}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                ></textarea>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Previous Projects or Repositories (if any)</label>
                <input
                  type="text"
                  name="previousProjects"
                  placeholder="e.g. Built a simple calculator in Python, or link to GitHub"
                  value={formData.previousProjects}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Continue to Goals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CAREER GOALS & STATEMENT OF PURPOSE */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Step 4: Goals, Motivation & Statement of Purpose</span>
              </h2>
              <p className="text-xs text-slate-500">Why do you want to join STEMPACT Academy?</p>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">What are your primary learning objectives? *</label>
                <textarea
                  name="learningObjectives"
                  placeholder="e.g. I want to build production-grade web APIs, deploy autonomous robots, or start a clean energy enterprise in Osun State..."
                  value={formData.learningObjectives}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Statement of Purpose / Why STEMPACT? *</label>
                <textarea
                  name="statementOfPurpose"
                  placeholder="Explain your passion for technology and why you believe hands-on project learning will accelerate your personal and career trajectory..."
                  value={formData.statementOfPurpose}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                ></textarea>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.statementOfPurpose.trim() || !formData.learningObjectives.trim()) {
                    setErrorMsg('Please complete your learning objectives and statement of purpose.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(5);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Continue to Funding Preferences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FUNDING & PAYMENT PREFERENCES (PHASE 6 ARCHITECTURE) */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Step 5: Funding Source & Tuition Payment Preference</span>
              </h2>
              <p className="text-xs text-slate-500">
                Indicate your expected sponsorship or installment schedule.
              </p>
            </div>

            {/* Official Disclaimer Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Admissions & Financial Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Payment preferences, installment structures, and scholarship requests indicate candidate preference only.
                Final tuition arrangements and financial clearances are verified by the Finance Committee upon academic placement ratification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Primary Funding Source *</label>
                <select
                  name="fundingSourcePreference"
                  value={formData.fundingSourcePreference}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                >
                  <option value="SELF">Self-Funded (Candidate)</option>
                  <option value="PARENT_GUARDIAN">Parent / Legal Guardian</option>
                  <option value="EMPLOYER">Employer / Corporate Sponsorship</option>
                  <option value="SPONSOR">Third-Party Sponsor / Philanthropist</option>
                  <option value="SCHOLARSHIP">Applying for Need-Based / Merit Scholarship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Preferred Payment Structure *</label>
                <select
                  name="requestedPaymentPlan"
                  value={formData.requestedPaymentPlan}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                >
                  <option value="FULL_UPFRONT">Full Upfront Payment (Standard)</option>
                  <option value="TWO_INSTALLMENTS">Two Installments (50% / 50%)</option>
                  <option value="THREE_INSTALLMENTS">Three Installments (40% / 30% / 30%)</option>
                  <option value="MONTHLY">Monthly Structured Arrangement</option>
                </select>
              </div>

              {/* Sponsor Details if Applicable */}
              {(formData.fundingSourcePreference === 'SPONSOR' || formData.fundingSourcePreference === 'EMPLOYER') && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-semibold text-slate-700">Sponsor / Organization Details *</label>
                  <input
                    type="text"
                    name="sponsorshipDetails"
                    placeholder="e.g. Osun Tech Foundation / Contact: Dr. Adeleke (adeleke@sponsor.org)"
                    value={formData.sponsorshipDetails}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
              )}

              {/* Scholarship Request Details */}
              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    name="scholarshipRequested"
                    checked={formData.scholarshipRequested || formData.fundingSourcePreference === 'SCHOLARSHIP'}
                    onChange={handleChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Request Consideration for STEMPACT Tuition Assistance / Scholarship</span>
                </label>

                {(formData.scholarshipRequested || formData.fundingSourcePreference === 'SCHOLARSHIP') && (
                  <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="font-semibold text-slate-700">Financial Assistance Statement / Justification *</label>
                    <textarea
                      name="financialAssistanceReason"
                      placeholder="Briefly state your financial circumstances and why assistance is needed to complete this program..."
                      value={formData.financialAssistanceReason}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep(6);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Continue to Final Consent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: MINOR SAFEGUARDING, PASSWORD & FINAL SUBMISSION */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Step 6: Safeguarding, Portal Security & Certification</span>
              </h2>
              <p className="text-xs text-slate-500">Confirm details and create your applicant portal account.</p>
            </div>

            {/* Parent/Guardian Section if Minor */}
            {formData.isMinor && (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <User className="w-4 h-4 text-amber-700" />
                  <span>Minor Learner Safeguarding: Parent / Guardian Information</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  As the applicant is under 18 years of age, parental/guardian authorization is required to access our physical laboratory stations and receive academic progress reports.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Parent / Guardian Full Name *</label>
                    <input
                      type="text"
                      name="parentName"
                      placeholder="e.g. Mrs. Funke Adeleke"
                      value={formData.parentName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Parent / Guardian Phone Number *</label>
                    <input
                      type="tel"
                      name="parentPhone"
                      placeholder="e.g. +234 809 123 4567"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Parent / Guardian Email *</label>
                    <input
                      type="email"
                      name="parentEmail"
                      placeholder="parent@example.com"
                      value={formData.parentEmail}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Relationship *</label>
                    <select
                      name="parentRelationship"
                      value={formData.parentRelationship}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="School Sponsor">School Sponsor</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Portal Password */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">
                Create Portal Password (required to log into your applicant portal & track placement) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  name="consentAccepted"
                  checked={formData.consentAccepted}
                  onChange={handleChange}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="leading-relaxed">
                  I hereby certify that all information provided in this application is accurate and true. I understand
                  that admission into STEMPACT Academy is contingent upon completing the diagnostic placement assessment
                  and academic board review.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg transition-transform transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span>Registering Application...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Application & Proceed to Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
            </form>
          </div>

          {/* Sticky Sidebar (4 cols on lg screens) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            {/* Card 1: Your Application Snapshot */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Application Snapshot
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Step {step} of 6
                </span>
              </div>

              {currentProgram ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {currentProgram.code}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 truncate">
                        {currentSchool?.name || currentProgram.school?.name || 'Academic School'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {currentProgram.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                      <strong className="text-slate-800">{currentProgram.duration || '6 Weeks'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Stage</span>
                      <strong className="text-slate-800">{currentProgram.level?.replace(/_/g, ' ') || 'Level 1 Foundation'}</strong>
                    </div>
                  </div>

                  {/* Learning Center */}
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>Preferred Campus Hub:</span>
                    </span>
                    <p className="font-bold text-slate-800 text-xs pl-4">
                      {currentCenter
                        ? `${currentCenter.name} (${currentCenter.cityOrTown || 'Onsite'})`
                        : 'Virtual Global Campus (100% Online)'}
                    </p>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>Class Timetable:</span>
                    </span>
                    <p className="font-medium text-slate-700 text-xs pl-4">
                      {formData.preferredSchedule}
                    </p>
                  </div>

                  {/* Tuition Note */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Standard Tuition:</span>
                    <strong className="text-slate-900 font-black">
                      {selectedCohortData?.trainingFee
                        ? `₦${Number(selectedCohortData.trainingFee).toLocaleString()}`
                        : '₦65,000'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Program Selected Yet</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Choose your academic school and engineering track in Step 1 to preview your curriculum and schedule snapshot.
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Admissions Roadmap */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-md space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Admissions Process</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">Register Application</strong>
                    <span className="text-slate-500 text-[11px]">Submit candidate profile & program choice.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">15-Min Placement Test</strong>
                    <span className="text-slate-500 text-[11px]">Immediate diagnostic placement test.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">Provisional Offer & Student ID</strong>
                    <span className="text-slate-500 text-[11px]">Academic Board ratifies placement & issues offer.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">Clearance & Station Allocation</strong>
                    <span className="text-slate-500 text-[11px]">Tuition clearance activates your workstation and student portal.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Support & Help Desk */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>Admissions Counseling Desk</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need guidance choosing between onsite physical hubs (Ile-Ife & centers) or 100% virtual programs?
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <Link to="/faq" className="text-blue-300 hover:text-white underline font-semibold">
                  Admissions FAQ →
                </Link>
                <Link to="/contact" className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition">
                  Contact Counselor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
