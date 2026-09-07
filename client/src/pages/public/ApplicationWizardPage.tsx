import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
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

  // Form State
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
    educationLevel: 'Undergraduate',
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
            setFormData((prev) => ({ ...prev, schoolId: matchedProg.schoolId }));
          }
        }
      } catch (err) {
        console.error('Failed to load initial application data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [searchParams]);

  // Dynamically check if applicant is minor based on DOB
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const ageDiffMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiffMs);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      const isUnder18 = calculatedAge < 18;
      setFormData((prev) => ({ ...prev, isMinor: isUnder18 }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const response = await api.submitApplication(formData);
      setSuccessData(response);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Preparing STEMPACT Application Portal..." />;

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
              <span className="text-sm font-black text-blue-600 tracking-wider">
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

          {/* Next Steps Prompt */}
          <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-left space-y-3">
            <h3 className="font-bold text-sm text-blue-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Mandatory Next Step: Complete Placement Assessment</span>
            </h3>
            <p className="text-xs text-blue-900 leading-relaxed">
              To determine your optimal starting level (Level 1 Foundation, Level 2 Accelerated, or Specialist Track),
              please complete the 30-minute diagnostic placement test now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to={`/assessment?appId=${successData.applicationId}`}
              className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Take Diagnostic Placement Test Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Step Header */}
      <div className="text-center space-y-3">
        <Badge variant="blue">Official Online Application</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Join STEMPACT ACADEMY 2025
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Complete the 5 sections below to register your academic profile and reserve your seat.
        </p>

        {/* Stepper Tabs */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === i
                    ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                    : step > i
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > i ? '✓' : i}
              </div>
              {i < 5 && <div className={`w-6 sm:w-10 h-1 rounded ${step > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
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
                <span>Step 1: Academic School, Program & Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">Select your intended discipline and current available cohort.</p>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
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
                <label className="font-semibold text-slate-700">Academic Program *</label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
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
                <label className="font-semibold text-slate-700">Select Open Cohort *</label>
                <select
                  name="cohortId"
                  value={formData.cohortId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Cohort Batch --</option>
                  {filteredCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cohortCode} • Starts {new Date(c.startDate).toLocaleDateString('en-GB')})
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="Weekday Evenings (4:00 PM - 7:00 PM WAT)">Weekday Evenings (4:00 PM - 7:00 PM WAT)</option>
                  <option value="Weekend Executive (Saturdays 9:00 AM - 2:00 PM)">Weekend Executive (Saturdays 9:00 AM - 2:00 PM)</option>
                  <option value="Morning Intensive (9:00 AM - 1:00 PM WAT)">Morning Intensive (9:00 AM - 1:00 PM WAT)</option>
                  <option value="After-School (Kids & Teens 3:30 PM - 5:30 PM)">After-School (Kids & Teens 3:30 PM - 5:30 PM)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!formData.schoolId && !formData.programId) {
                    setErrorMsg('Please select an academic school and program.');
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
                  placeholder="e.g. Toluwalase Samuel Adeleke"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formData.isMinor && (
                  <p className="text-[11px] text-amber-700 font-semibold">
                    Applicant is under 18. Parent/Guardian information will be collected in Step 5.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  if (!formData.fullName || !formData.dateOfBirth || !formData.email || !formData.phone) {
                    setErrorMsg('Please fill in your name, date of birth, phone, and email.');
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Primary School">Primary School (Kids track)</option>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-700">Existing Technical Experience</label>
                <textarea
                  name="technicalExperience"
                  placeholder="Mention any programming languages, tools, electronics breadboarding, or solar knowledge you have encountered..."
                  value={formData.technicalExperience}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  placeholder="e.g. I want to build production-grade web APIs, deploy autonomous robots, or start a clean energy company in Osun State..."
                  value={formData.learningObjectives}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Statement of Purpose / Why STEMPACT? *</label>
                <textarea
                  name="statementOfPurpose"
                  placeholder="Explain your passion for technology and why you believe hands-on project learning will accelerate your goals..."
                  value={formData.statementOfPurpose}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
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
                  if (!formData.statementOfPurpose || !formData.learningObjectives) {
                    setErrorMsg('Please complete your learning objectives and statement of purpose.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(5);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>Continue to Final Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: MINOR CONSENT & FINAL SUBMISSION */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Step 5: Consent, Parent/Guardian (for Minors) & Submit</span>
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
                  As the applicant is under 18 years old, parental/guardian authorization is required to access our
                  physical laboratory stations and receive academic progress reports.
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                      required={formData.isMinor}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Relationship *</label>
                    <select
                      name="parentRelationship"
                      value={formData.parentRelationship}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
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
                Create Portal Password (for logging into Student Dashboard)
              </label>
              <input
                type="password"
                name="password"
                placeholder="Minimum 8 characters (or leave blank to use default temporary key)"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              />
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
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg transition-transform transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
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
