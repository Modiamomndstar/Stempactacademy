import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Sparkles,
  ClipboardList,
  Award,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Calendar,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  Check,
  ShieldCheck,
  X,
  Building,
  HelpCircle,
  FileCheck,
  DollarSign,
  Download,
} from 'lucide-react';

export const ApplicantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('status');
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [clearanceData, setClearanceData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // Payment Checkout Modal State
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentChannel, setPaymentChannel] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'>('PAYSTACK');
  const [senderBank, setSenderBank] = useState<string>('Access Bank');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [paying, setPaying] = useState<boolean>(false);

  // Decline Offer Modal State
  const [showDeclineModal, setShowDeclineModal] = useState<boolean>(false);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [declining, setDeclining] = useState<boolean>(false);

  // Document Preview Modal State
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [documentData, setDocumentData] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);

  // Enrolling state
  const [enrolling, setEnrolling] = useState<boolean>(false);

  const loadApplicantData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getApplicantDashboard();
      setDashboardData(data);

      if (data.admission?.id) {
        try {
          const clr = await api.getFinancialClearance(data.admission.id);
          setClearanceData(clr);
        } catch (cErr) {
          console.warn('Financial clearance check:', cErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to load applicant dashboard:', err);
      setError(err.message || 'Failed to load applicant records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicantData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'pending') {
      setActionSuccessMsg('Payment verification is pending. Your financial clearance will update after the payment is verified by STEMPACT Academy.');
    }
  }, []);

  const handleAcceptOffer = async () => {
    if (!dashboardData?.admission?.id) return;
    try {
      setActionSuccessMsg('');
      setError('');
      const res = await api.acceptAdmission(dashboardData.admission.id);
      setActionSuccessMsg(res.message || 'Admission offer accepted! Please complete financial clearance to finalize enrollment.');
      loadApplicantData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept admission offer');
    }
  };

  const handleDeclineOffer = async () => {
    if (!dashboardData?.admission?.id) return;
    setDeclining(true);
    try {
      setError('');
      const res = await api.declineAdmission(dashboardData.admission.id, declineReason);
      setShowDeclineModal(false);
      setActionSuccessMsg(res.message || 'Admission offer declined.');
      loadApplicantData();
    } catch (err: any) {
      setError(err.message || 'Failed to decline admission offer');
    } finally {
      setDeclining(false);
    }
  };

  const handleViewDocument = async () => {
    if (!dashboardData?.admission?.id) return;
    setShowDocModal(true);
    setLoadingDoc(true);
    try {
      const docRes = await api.getAdmissionDocument(dashboardData.admission.id);
      setDocumentData(docRes.data || docRes);
    } catch (err: any) {
      console.error('Failed to load admission document:', err);
      setError(err.message || 'Failed to retrieve admission document');
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleBankTransferSubmit = async () => {
    if (!dashboardData?.invoice?.id || !senderBank) {
      alert('Please specify your sending bank name.');
      return;
    }
    setPaying(true);
    try {
      await api.submitBankTransfer({
        invoiceId: dashboardData.invoice.id,
        amount: dashboardData.invoice.balance || dashboardData.invoice.totalAmount,
        senderBank,
        senderAccount: senderAccount || '0123456789',
        proofUrl: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        payerName: `${user?.firstName} ${user?.lastName}`,
        payerEmail: user?.email,
      });
      setShowCheckout(false);
      setActionSuccessMsg('Payment verification is pending. Your financial clearance will update after the payment is verified by STEMPACT Academy.');
      loadApplicantData();
    } catch (err: any) {
      alert('Transfer submission failed: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!dashboardData?.invoice?.id) return;
    setPaying(true);
    try {
      const res = await api.initializePayment({
        invoiceId: dashboardData.invoice.id,
        amount: dashboardData.invoice.balance || dashboardData.invoice.totalAmount,
        channel: paymentChannel,
        callbackUrl: `${window.location.origin}/portal/applicant?payment=pending`,
      });
      setShowCheckout(false);
      if (res.authorizationUrl) {
        window.open(res.authorizationUrl, '_blank');
      }
      setActionSuccessMsg('Payment verification is pending. Your financial clearance will update after the payment is verified by STEMPACT Academy.');
      loadApplicantData();
    } catch (err: any) {
      alert('Payment initialization error: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleFinalizeEnrollment = async () => {
    if (!dashboardData?.admission?.id) return;
    setEnrolling(true);
    try {
      const res = await api.enrollStudent(dashboardData.admission.id, 'Self-enrolled via Applicant Portal');
      setActionSuccessMsg(res.message || 'Student enrolled successfully and official dashboard activated!');
      setTimeout(() => {
        window.location.href = '/portal/student';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize enrollment. Please verify financial clearance.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">Loading Candidate Enrollment File...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const app = dashboardData?.application;
  const placement = dashboardData?.placement;
  const admission = dashboardData?.admission;
  const invoice = dashboardData?.invoice;
  const attempt = dashboardData?.assessmentAttempt;

  const stages = [
    { key: 'APPLICATION', title: 'Application', desc: 'Application profile submitted', done: true },
    { key: 'ASSESSMENT', title: 'Assessment', desc: 'Diagnostic assessment completed', done: !!attempt },
    { key: 'PLACEMENT', title: 'Placement / Decision', desc: 'Track verified by Academic Board', done: placement?.status === 'APPROVED' || !!admission },
    { key: 'ADMISSION_OFFER', title: 'Admission Offer', desc: 'Provisional offer issued', done: !!admission },
    { key: 'FINANCIAL_CLEARANCE', title: 'Financial Clearance', desc: 'Tuition clearance verified', done: !!clearanceData?.cleared },
    { key: 'ENROLLMENT', title: 'Enrollment', desc: 'Official letter delivered & enrolled', done: admission?.status === 'ENROLLED' || user?.role === 'STUDENT' },
  ];

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Applicant Portal • Cohort Admissions 2025/2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.firstName || 'Candidate'}!
            </h1>
            <p className="text-sm text-slate-300">
              Track your application status, diagnostic assessment, provisional admission offer, financial clearance, and cohort enrollment in real time.
            </p>
            {app && (
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                <span>Application No: <strong className="text-white font-bold">{app.applicationNumber}</strong></span>
                <span>•</span>
                <span>Program: <strong className="text-blue-300 font-bold">{app.programName}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-400 uppercase font-bold">{dashboardData?.currentStage}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Global Feedback Banners */}
        {actionSuccessMsg && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg('')}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-rose-600 hover:text-rose-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 6-Step Visual Lifecycle Stepper */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4">
            Enrollment Pipeline Lifecycle
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stages.map((stage, idx) => (
              <div
                key={stage.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  stage.done
                    ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-950'
                    : 'bg-slate-50 border-slate-200/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold">Stage 0{idx + 1}</span>
                  {stage.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-xs font-bold leading-snug">{stage.title}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{stage.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Application Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'assessment'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Diagnostic Assessment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admission')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'admission'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Admission Offer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tuition')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tuition'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tuition & Clearance
          </button>
        </div>

        {/* Tab 1: Application Overview */}
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Submitted Application Details
              </h3>
              {app ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Candidate Full Name</span>
                    <strong className="text-slate-900 text-sm">{app.fullName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Contact Email</span>
                    <strong className="text-slate-900 text-sm">{app.email}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Academic School</span>
                    <strong className="text-slate-900">{app.schoolName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Target Program</span>
                    <strong className="text-slate-900">{app.programName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Assigned Cohort</span>
                    <strong className="text-slate-900">{app.cohortName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Preferred Schedule</span>
                    <strong className="text-slate-900">{app.preferredSchedule}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No application record found. Start by submitting an application.
                </div>
              )}
            </div>

            {/* Next Action Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Next Required Action
              </h3>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-2">
                <div className="font-extrabold text-blue-950">
                  {dashboardData?.nextAction || 'Review Application Details'}
                </div>
                <p className="text-blue-900 text-[11px] leading-relaxed">
                  Follow the steps in the tabs above to advance your candidacy.
                </p>
              </div>

              {!attempt && (
                <Link
                  to={`/assessment?appId=${app?.id}&programId=${app?.programId || ''}`}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-center"
                >
                  <span>Launch Diagnostic Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {admission && admission.status !== 'ENROLLED' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('admission')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Review Provisional Offer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Diagnostic Assessment */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Diagnostic Placement Assessment</h3>
                <p className="text-xs text-slate-500">Evaluates your baseline competency for optimal cohort allocation.</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                attempt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {attempt ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>

            {attempt ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Raw Score</span>
                    <strong className="text-2xl font-black text-slate-900 font-mono">
                      {attempt.score} / {attempt.maxScore}
                    </strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Percentage</span>
                    <strong className="text-2xl font-black text-blue-600 font-mono">
                      {attempt.percentage}%
                    </strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Recommended Level</span>
                    <strong className="text-sm font-bold text-emerald-700 mt-1 block">
                      {attempt.recommendedLevel}
                    </strong>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Completed At</span>
                    <strong className="text-xs text-slate-700 mt-1 block">
                      {new Date(attempt.completedAt).toLocaleDateString('en-GB')}
                    </strong>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-1">
                  <span className="font-bold text-blue-950">Evaluator Placement Rationale:</span>
                  <p className="text-blue-900 leading-relaxed">{attempt.recommendationReason}</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Academic Board Ratification:</strong> Diagnostic test results are submitted to the Academic Admissions Committee for cohort assignment ratification.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Ready to Take Your Diagnostic?</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The assessment takes approximately 25–30 minutes. Ensure you have a quiet environment and stable internet connection.
                </p>
                <Link
                  to={`/assessment?appId=${app?.id}&programId=${app?.programId || ''}`}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span>Launch Diagnostic Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Offer of Admission & Provisional Document */}
        {activeTab === 'admission' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            {admission ? (
              <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                      {admission.status === 'ENROLLED' ? 'Official Matriculation' : 'Provisional Admission Offer'}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                      {admission.status === 'ENROLLED' ? 'Official Admission & Matriculation' : 'Offer of Provisional Admission'}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono">
                      Admission No: <strong>{admission.admissionNumber}</strong> • Student ID: <strong>{admission.studentIdNumber}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      admission.status === 'ACCEPTED'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : admission.status === 'ENROLLED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : admission.status === 'DECLINED'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {admission.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                  <p>
                    Dear <strong>{app?.fullName}</strong>,
                  </p>
                  <p>
                    The Academic Admissions Committee of STEMPACT Academy is pleased to offer you provisional admission into the <strong>{admission.programName}</strong> ({admission.level}) program for the upcoming academic session at the Ile-Ife Campus Hub.
                  </p>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Program Track:</span>
                      <strong className="text-slate-900">{admission.programName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Assigned Cohort Schedule:</span>
                      <strong className="text-slate-900">{admission.schedule}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Assigned Lab / Classroom:</span>
                      <strong className="text-slate-900">{admission.assignedClass}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Lead Faculty Instructor:</span>
                      <strong className="text-slate-900">{admission.instructorName}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Orientation Date:</span>
                      <strong className="text-slate-900">
                        {admission.orientationDate ? new Date(admission.orientationDate).toLocaleDateString('en-GB') : 'To Be Announced'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <FileCheck className="w-4 h-4 text-blue-700" />
                      <span>Document Status & Official Delivery Notice</span>
                    </div>
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      This represents your <strong>Provisional Admission Document</strong>. In accordance with STEMPACT governance, the <strong>Official Admission Letter</strong> is not officially delivered until financial clearance is verified and final cohort enrollment is completed.
                    </p>
                  </div>
                </div>

                {/* Offer Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {admission.status === 'ISSUED' && (
                    <>
                      <button
                        type="button"
                        onClick={handleAcceptOffer}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Offer of Admission</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeclineModal(true)}
                        className="px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Decline Offer
                      </button>
                    </>
                  )}

                  {admission.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('tuition')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Tuition & Clearance</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleViewDocument}
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {admission.status === 'ENROLLED'
                        ? 'View Official Admission Letter'
                        : 'View Provisional Admission Document'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">Provisional Offer in Processing</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Once your diagnostic assessment is reviewed and ratified by the Academic Admissions Board, your provisional offer of admission and assigned Student ID will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tuition & Enrollment */}
        {activeTab === 'tuition' && (
          <div className="space-y-6">
            {invoice ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invoice Breakdown */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Tuition & Financial Schedule</h3>
                      <div className="text-xs text-slate-500 font-mono">
                        Invoice Ref: <strong>{invoice.invoiceNumber}</strong>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      invoice.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : invoice.status === 'PARTIALLY_PAID'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Training & Lab Tuition Fee:</span>
                      <strong className="text-slate-900 font-mono">
                        ₦{Number(invoice.trainingFee || invoice.totalAmount).toLocaleString()}
                      </strong>
                    </div>
                    {invoice.registrationFee > 0 && (
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">Matriculation & Registration Fee:</span>
                        <strong className="text-slate-900 font-mono">
                          ₦{Number(invoice.registrationFee).toLocaleString()}
                        </strong>
                      </div>
                    )}
                    {invoice.certificationFee > 0 && (
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">Professional Certification Credential:</span>
                        <strong className="text-slate-900 font-mono">
                          ₦{Number(invoice.certificationFee).toLocaleString()}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                      <span>Total Invoice Amount:</span>
                      <strong className="text-slate-900 font-mono">
                        ₦{Number(invoice.totalAmount).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-700 font-semibold">
                      <span>Amount Cleared to Date:</span>
                      <span className="font-mono">
                        ₦{Number(invoice.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 text-sm font-bold bg-slate-50 px-4 rounded-xl">
                      <span className="text-slate-900">Remaining Balance:</span>
                      <span className="text-blue-600 font-mono">
                        ₦{Number(invoice.balance !== undefined ? invoice.balance : invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {invoice.balance > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowCheckout(true)}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Make Tuition Payment / Submit Bank Slip</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Full tuition cleared! Your financial standing is approved.</span>
                    </div>
                  )}
                </div>

                {/* Financial Clearance & Enrollment Gate */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Financial Clearance Status
                  </h3>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clearance Status:</span>
                      <strong className={`uppercase ${clearanceData?.cleared ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {clearanceData?.cleared ? 'CLEARED' : 'PENDING'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clearance Basis:</span>
                      <span className="text-slate-700 font-medium">
                        {clearanceData?.status || 'Tuition Deposit Verification'}
                      </span>
                    </div>
                  </div>

                  {clearanceData?.cleared ? (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                        Congratulations! You have satisfied institutional financial clearance requirements.
                      </div>
                      {admission?.status !== 'ENROLLED' ? (
                        <button
                          type="button"
                          disabled={enrolling}
                          onClick={handleFinalizeEnrollment}
                          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{enrolling ? 'Finalizing Enrollment...' : 'Finalize Cohort Enrollment'}</span>
                        </button>
                      ) : (
                        <Link
                          to="/portal/student"
                          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 text-center"
                        >
                          <span>Open Student Learning Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 leading-relaxed pt-2">
                      Official matriculation, student portal activation, and official admission letter delivery require verified financial clearance via online checkout, bank transfer verification, or an approved scholarship waiver.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
                <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Invoice Generated Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tuition invoices are generated upon offer of admission. Once your placement is approved, your tuition schedule will be published here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment / Bank Transfer Modal */}
      {showCheckout && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Tuition Payment Checkout</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentChannel('PAYSTACK')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentChannel === 'PAYSTACK'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Paystack
              </button>
              <button
                type="button"
                onClick={() => setPaymentChannel('FLUTTERWAVE')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentChannel === 'FLUTTERWAVE'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Flutterwave
              </button>
              <button
                type="button"
                onClick={() => setPaymentChannel('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentChannel === 'BANK_TRANSFER'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {paymentChannel === 'BANK_TRANSFER' ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">STEMPACT Academy Official Account:</div>
                  <div className="text-slate-600 font-mono">Bank: Access Bank Plc</div>
                  <div className="text-slate-600 font-mono">Account No: 1234567890</div>
                  <div className="text-slate-600">Account Name: STEMPACT Academy Ltd</div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Your Sending Bank *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GTBank, Zenith, Access"
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Account / Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0123456789 or Session ID"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={paying}
                  onClick={handleBankTransferSubmit}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paying ? 'Submitting Transfer Proof...' : 'Submit Transfer Confirmation'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  You will be securely routed to {paymentChannel} to complete your tuition deposit of{' '}
                  <strong className="text-slate-900 font-mono">
                    ₦{Number(invoice?.balance || invoice?.totalAmount || 0).toLocaleString()}
                  </strong>.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                  Upon return from the payment gateway, payment verification remains pending until confirmed by the gateway webhook. Your financial clearance and enrollment eligibility will update after the payment is verified by STEMPACT Academy.
                </div>
                <button
                  type="button"
                  disabled={paying}
                  onClick={handleOnlinePayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paying ? 'Initializing Gateway...' : `Proceed to ${paymentChannel} Checkout`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decline Offer Modal */}
      {showDeclineModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Decline Admission Offer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you wish to decline this offer of admission? Please provide a brief reason for our admissions board records:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Schedule conflict, enrolled in university, or financial constraints..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
            ></textarea>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={declining}
                onClick={handleDeclineOffer}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                {declining ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Admission Document Viewer Modal */}
      {showDocModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {admission?.status === 'ENROLLED'
                      ? 'Official Institutional Admission Letter'
                      : 'Provisional Admission Document'}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Document Ref: {documentData?.documentNumber || admission?.admissionNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDoc ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Rendering document preview...
              </div>
            ) : documentData ? (
              <div className="space-y-6">
                {admission?.status !== 'ENROLLED' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Notice:</strong> This is a Provisional Admission Document. The Official Admission Letter is officially delivered following financial clearance and finalized cohort enrollment.
                    </span>
                  </div>
                )}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs text-slate-700">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">Document Type:</span>
                    <strong className="text-slate-900">
                      {admission?.status === 'ENROLLED' ? 'Official Admission Letter' : 'Provisional Offer of Admission'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">Recipient:</span>
                    <strong className="text-slate-900">{documentData.recipientName} ({documentData.recipientEmail})</strong>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">Program Track:</span>
                    <strong className="text-slate-900">{documentData.programName}</strong>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">Cohort Code:</span>
                    <strong className="text-slate-900 font-mono">{documentData.cohortCode}</strong>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">Watermark / Classification:</span>
                    <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {documentData.watermarkedText || 'PROVISIONAL OFFER'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Print / Save Copy</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Document could not be previewed.
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
