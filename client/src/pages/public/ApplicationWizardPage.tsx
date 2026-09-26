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
} from 'lucide-react';

export const ApplicationWizardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
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
        const [schoolsRes, programsRes, cohortsRes] = await Promise.all([
          api.getSchools(),
          api.getPrograms(),
          api.getCohorts({ openOnly: 'true' }),
        ]);
        setSchools(schoolsRes.schools || []);
        setPrograms(programsRes.programs || []);
        setCohorts(cohortsRes.cohorts || []);

        const initialProgramId = searchParams.get('programId');
        if (initialProgramId) {
          const matchedProg = (programsRes.programs || []).find((p: Program) => p.id === initialProgramId);
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
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Stepper Header */}
      <div className="text-center space-y-3">
        <Badge variant="blue">Official Online Application</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Join STEMPACT ACADEMY 2025/2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Complete the sections below to register your academic profile and initiate your placement review.
        </p>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-4">
          {[
            { num: 1, label: 'Program' },
            { num: 2, label: 'Personal' },
            { num: 3, label: 'Education' },
            { num: 4, label: 'Goals' },
            { num: 5, label: 'Funding' },
            { num: 6, label: 'Consent' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              {s.num < 6 && (
                <div
                  className={`w-4 sm:w-8 h-1 rounded ${
                    step > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
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

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg space-y-8">
        {/* STEP 1: SCHOOL, PROGRAM & COHORT */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Step 1: Academic Discipline & Cohort Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose the academic school and target program track you are applying to.
              </p>
            </div>

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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="">-- Open Cohort (Assigned upon placement) --</option>
                  {filteredCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cohortCode} • Starts {c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB') : 'TBA'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Preferred Learning Schedule *</label>
                <select
                  name="preferredSchedule"
                  value={formData.preferredSchedule}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  required
                >
                  <option value="Weekday Evenings (4:00 PM - 7:00 PM WAT)">Weekday Evenings (4:00 PM - 7:00 PM WAT)</option>
                  <option value="Weekend Executive (Saturdays 9:00 AM - 3:00 PM WAT)">Weekend Executive (Saturdays 9:00 AM - 3:00 PM WAT)</option>
                  <option value="Morning Intensive (9:00 AM - 1:00 PM WAT)">Morning Intensive (9:00 AM - 1:00 PM WAT)</option>
                  <option value="After-School (Kids & Teens 3:30 PM - 5:30 PM)">After-School (Kids & Teens 3:30 PM - 5:30 PM)</option>
                  <option value="Hybrid (Weekend Lab & Virtual Midweek)">Hybrid (Weekend Lab & Virtual Midweek)</option>
                </select>
              </div>
            </div>

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
  );
};
