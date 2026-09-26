import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { School, Program, Cohort } from '../../types';
import {
  BookOpen,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calendar,
  Mail,
  Lock,
  Phone,
  MapPin,
  AlertCircle,
  GraduationCap,
  Users,
  Check,
  Award,
  Eye,
  EyeOff,
  FileCheck,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [createdApplicationId, setCreatedApplicationId] = useState<string>('');

  // Form Fields
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    searchParams.get('programId') || ''
  );
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    searchParams.get('cohortId') || ''
  );
  const [accountType, setAccountType] = useState<'APPLICANT' | 'PARENT'>('APPLICANT');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [preferredSchedule, setPreferredSchedule] = useState(
    'Hybrid (Weekend & Evening)'
  );

  // Minor / Parent Safeguarding details
  const [isMinor, setIsMinor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Mother');
  const [consentAccepted, setConsentAccepted] = useState(true);

  // Load programs & schools
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [schoolsRes, progsRes, cohortsRes] = await Promise.all([
          api.getSchools(),
          api.getPrograms(),
          api.getCohorts({ openOnly: 'true' }),
        ]);

        setSchools(schoolsRes.schools || []);
        setPrograms(progsRes.programs || []);
        setCohorts(cohortsRes.cohorts || []);

        const initialProgId = searchParams.get('programId');
        if (initialProgId) {
          const match = (progsRes.programs || []).find(
            (p: Program) => p.id === initialProgId
          );
          if (match) {
            setSelectedSchoolId(match.schoolId);
            setSelectedProgramId(match.id);
          }
        }
      } catch (err) {
        console.error('Failed to load course catalog for registration:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [searchParams]);

  // Minor calculation
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const ageDiffMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      setIsMinor(age < 18);
    }
  }, [dateOfBirth]);

  const filteredPrograms = selectedSchoolId
    ? programs.filter((p) => p.schoolId === selectedSchoolId)
    : programs;

  const currentProgram = programs.find((p) => p.id === selectedProgramId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long for account security.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    if ((isMinor || accountType === 'PARENT') && (!parentName.trim() || !parentPhone.trim())) {
      setErrorMsg(
        'Safeguarding Notice: Parent or legal guardian name and phone number are required for minor applicants.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim() || email.split('@')[0].toLowerCase(),
        password,
        phone: phone.trim(),
        role: accountType, // Canonical identity: APPLICANT or PARENT (never premature STUDENT)
        programId: selectedProgramId || undefined,
        cohortId: selectedCohortId || undefined,
        dateOfBirth: dateOfBirth || undefined,
        parentDetails:
          isMinor || accountType === 'PARENT'
            ? {
                name: parentName.trim(),
                phone: parentPhone.trim(),
                email: parentEmail.trim(),
                relationship: parentRelationship,
              }
            : undefined,
      };

      const res = await api.register(payload);

      // Auto login
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setRegisteredUser(res.user);
      if (res.applicationId) {
        setCreatedApplicationId(res.applicationId);
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Registration failed. Please check your details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading STEMPACT Course Enrollment Catalog..." />;
  }

  // Registration Complete Celebration Screen
  if (registeredUser) {
    return (
      <div className="min-h-[85vh] bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-xl mx-auto w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {accountType === 'PARENT' ? 'Guardian Account Provisioned' : 'Applicant Profile Registered'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome to STEMPACT Academy, {registeredUser.firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {accountType === 'PARENT'
                ? 'Your parent portal account is active. You can now link your wards and monitor admissions.'
                : 'Your applicant account has been registered for the upcoming academic session at the Ile-Ife Campus Hub.'}
            </p>
          </div>

          {currentProgram && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-left flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Target Academic Program
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentProgram.name}
                </div>
                <div className="text-xs text-slate-500">
                  {currentProgram.duration} • {currentProgram.learningLevels}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Next Step: Complete Diagnostic Placement Assessment</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every applicant completes an automated diagnostic assessment to determine their baseline technical competency and allow the Academic Board to assign your optimal cohort placement.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (currentProgram) params.set('programId', currentProgram.id);
                if (createdApplicationId) params.set('appId', createdApplicationId);
                navigate(`/assessment${params.toString() ? `?${params.toString()}` : ''}`);
              }}
              className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Take Diagnostic Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                navigate(accountType === 'PARENT' ? '/portal/parent' : '/portal/applicant')
              }
              className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <span>Go to My Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <STEMLogo size="md" />
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions Intake 2025/2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Create Your Academy Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Register as a prospective applicant or parent/guardian to apply for programs, complete placement testing, and track your admission offer.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: PERSONA SELECTION */}
          <Card className="p-6 sm:p-8 space-y-6 shadow-md border-slate-200/80 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  1
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Who is Registering?</h2>
                  <p className="text-xs text-slate-500">
                    Specify whether you are the direct learner or a parent/guardian registering on their behalf.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setAccountType('APPLICANT')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  accountType === 'APPLICANT'
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  {accountType === 'APPLICANT' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900">I am a Prospective Student / Applicant</div>
                <div className="text-xs text-slate-500 mt-1">
                  I will take the diagnostic test, apply for admission, and study coursework.
                </div>
              </div>

              <div
                onClick={() => setAccountType('PARENT')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  accountType === 'PARENT'
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  {accountType === 'PARENT' && (
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900">
                  I am a Parent / Legal Guardian
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  I am enrolling my child/ward and monitoring their attendance, grades & invoices.
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 2: INTENDED PROGRAM SELECTION (OPTIONAL PRE-SELECTION) */}
          <Card className="p-6 sm:p-8 space-y-6 shadow-md border-slate-200/80 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  2
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Academic Program Interest (Optional)</h2>
                  <p className="text-xs text-slate-500">
                    You can indicate your preferred discipline now or finalize it after your diagnostic assessment.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Filter by Academic School</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => {
                    setSelectedSchoolId(e.target.value);
                    setSelectedProgramId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="">-- All 8 Schools --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Target Program</label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="">-- Select Target Program --</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration})
                    </option>
                  ))}
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
          </Card>

          {/* SECTION 3: PERSONAL DETAILS & CREDENTIALS */}
          <Card className="p-6 sm:p-8 space-y-6 shadow-md border-slate-200/80 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  3
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Personal Details & Login Credentials</h2>
                  <p className="text-xs text-slate-500">
                    Official identification for your student file and portal authentication.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oluwaseun"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adeleke"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="0816 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                {isMinor && (
                  <p className="text-[11px] text-amber-700 font-semibold">
                    Applicant is under 18 years old. Parent/Guardian safeguarding details are required below.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Username (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. seun_tech"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Password Fields */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Create Password (min 8 chars) *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Minor Safeguarding Section */}
            {(isMinor || accountType === 'PARENT') && (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>
                    Child Safeguarding & Parent / Guardian Details {isMinor && '(Applicant is under 18)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Parent / Guardian Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Mrs. Folashade Adebayo"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Guardian Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="08098765432"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Guardian Email</label>
                    <input
                      type="email"
                      placeholder="parent@domain.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Relationship *</label>
                    <select
                      value={parentRelationship}
                      onChange={(e) => setParentRelationship(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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

            {/* Schedule & Consent */}
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span>
                    I confirm that the information provided is accurate. I agree to abide by STEMPACT Academy's student code of conduct, safeguarding policies, and to participate in the required diagnostic assessment.
                  </span>
                </label>
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Registering Account & Preparing Portal...</span>
              ) : (
                <>
                  <span>Create Account & Continue to Placement</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Sign in to your portal here
              </Link>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};
