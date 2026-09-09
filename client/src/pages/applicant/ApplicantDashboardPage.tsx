import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const ApplicantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('status');
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Payment Checkout Modal State
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentChannel, setPaymentChannel] = useState<'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER'>('PAYSTACK');
  const [senderBank, setSenderBank] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [paying, setPaying] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  const loadApplicantData = async () => {
    try {
      setLoading(true);
      const data = await api.getApplicantDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load applicant dashboard:', err);
      setError(err.message || 'Failed to load applicant records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicantData();
  }, []);

  const handleBankTransferSubmit = async () => {
    if (!dashboardData?.invoice?.id || !senderBank) {
      alert('Please specify your bank name.');
      return;
    }
    setPaying(true);
    try {
      await api.submitBankTransfer({
        invoiceId: dashboardData.invoice.id,
        amount: dashboardData.invoice.balance || dashboardData.invoice.totalAmount,
        senderBank,
        proofUrl: proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        payerName: `${user?.firstName} ${user?.lastName}`,
        payerEmail: user?.email,
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowCheckout(false);
        setPaymentSuccess(false);
        loadApplicantData();
      }, 2500);
    } catch (err: any) {
      alert('Transfer submission failed: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleOnlinePaymentSim = async () => {
    if (!dashboardData?.invoice?.id) return;
    setPaying(true);
    try {
      await api.payInvoice({
        invoiceId: dashboardData.invoice.id,
        amount: dashboardData.invoice.balance || dashboardData.invoice.totalAmount,
        channel: paymentChannel,
        payerName: `${user?.firstName} ${user?.lastName}`,
        payerEmail: user?.email,
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowCheckout(false);
        setPaymentSuccess(false);
        window.location.href = '/portal/student';
      }, 2000);
    } catch (err: any) {
      alert('Payment failed: ' + err.message);
    } finally {
      setPaying(false);
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
    { key: 'SUBMITTED', title: 'Application Submitted', desc: 'Personal details and credentials verified', done: true },
    { key: 'ASSESSMENT_COMPLETED', title: 'Diagnostic Assessment', desc: '15-question technical diagnostic completed', done: !!attempt },
    { key: 'PLACEMENT_APPROVED', title: 'Academic Placement', desc: 'Curriculum level ratified by Academic Board', done: placement?.status === 'APPROVED' },
    { key: 'ADMITTED', title: 'Admission Issued', desc: 'Official provisional letter generated', done: !!admission },
    { key: 'ENROLLED', title: 'Enrolled Student', desc: 'Tuition deposit cleared; active learner', done: admission?.status === 'ENROLLED' || user?.role === 'STUDENT' },
  ];

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Applicant Portal • Cohort 2025 Admissions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.firstName || 'Candidate'}!
            </h1>
            <p className="text-sm text-slate-300">
              Track your admission status, diagnostic test results, official offer letter, and tuition clearance in real time.
            </p>
            {app && (
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                <span>Application No: <strong className="text-white font-bold">{app.applicationNumber}</strong></span>
                <span>•</span>
                <span>Program: <strong className="text-blue-300 font-bold">{app.programName}</strong></span>
                <span>•</span>
                <span>Stage: <strong className="text-emerald-400 uppercase font-bold">{dashboardData?.currentStage}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* 5-Step Visual Progress Stepper */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4">
            Enrollment Pipeline Progression
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                  <span className="text-[10px] font-mono font-bold">Step 0{idx + 1}</span>
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

        {/* Active Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Application Overview
          </button>
          <button
            onClick={() => setActiveTab('assessment')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'assessment'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Diagnostic Assessment
          </button>
          <button
            onClick={() => setActiveTab('admission')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'admission'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Offer Letter
          </button>
          <button
            onClick={() => setActiveTab('tuition')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'tuition'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tuition & Enrollment
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
                    <span className="text-slate-500 block">Phone Number</span>
                    <strong className="text-slate-900 text-sm">{app.phone || 'N/A'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Preferred Learning Track</span>
                    <strong className="text-slate-900 text-sm">{app.programName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Learning Schedule</span>
                    <strong className="text-slate-900 text-sm">{app.preferredSchedule}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Intake Cohort</span>
                    <strong className="text-slate-900 text-sm">{app.cohortName}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No active enrollment application registered for this account.
                </div>
              )}
            </div>

            {/* Quick Next Step Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Action Required
                </span>
                <h3 className="text-lg font-bold mt-2">Next Step in Pipeline</h3>
                <p className="text-xs text-blue-100 mt-1">
                  {dashboardData?.nextAction}
                </p>
              </div>

              {admission ? (
                <button
                  onClick={() => setActiveTab('admission')}
                  className="w-full py-2.5 px-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Review Admission Letter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : attempt ? (
                <div className="p-3 bg-white/10 rounded-xl text-xs">
                  ✅ Diagnostic submitted ({attempt.percentage}%). Awaiting Academic Board level placement.
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('assessment')}
                  className="w-full py-2.5 px-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Take Diagnostic Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Diagnostic Assessment */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Technical Diagnostic Assessment</h3>
                <p className="text-xs text-slate-500">
                  Dynamic 15-question evaluation testing digital literacy, logical problem-solving, and foundational logic.
                </p>
              </div>
              {attempt && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Assessment Completed
                </span>
              )}
            </div>

            {attempt ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <span className="text-xs text-blue-700 font-semibold block">Overall Score</span>
                  <div className="text-2xl font-black text-blue-900 mt-1">{attempt.percentage}%</div>
                  <span className="text-[11px] text-blue-600">Passing score: 60%</span>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                  <span className="text-xs text-purple-700 font-semibold block">Recommended Level</span>
                  <div className="text-xl font-black text-purple-900 mt-1">{attempt.recommendedLevel}</div>
                  <span className="text-[11px] text-purple-600">Based on diagnostic rubric</span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-xs text-emerald-700 font-semibold block">Placement Status</span>
                  <div className="text-xl font-black text-emerald-900 mt-1">{placement?.status || 'UNDER REVIEW'}</div>
                  <span className="text-[11px] text-emerald-600">Academic Board disposition</span>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Ready to Take Your Diagnostic?</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The assessment takes approximately 25–30 minutes. Ensure you have a quiet environment and stable internet.
                </p>
                <button
                  onClick={() => {
                    alert('Redirecting to the dynamic interactive test engine...');
                    window.location.href = `/apply/assessment?applicationId=${app?.id}&programId=${app?.programId || ''}`;
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span>Launch Diagnostic Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Offer Letter */}
        {activeTab === 'admission' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            {admission ? (
              <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                      Official Offer of Provisional Admission
                    </h3>
                    <div className="text-xs text-slate-500 font-mono">
                      Admission Number: <strong>{admission.admissionNumber}</strong> • Student ID: <strong>{admission.studentIdNumber}</strong>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    OFFICIAL
                  </span>
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
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Lead Faculty Instructor:</span>
                      <strong className="text-slate-900">{admission.instructorName}</strong>
                    </div>
                  </div>
                  <p>
                    To accept this offer and guarantee your reserved seat in the laboratory workstation, kindly complete the tuition clearance deposit below.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('tuition')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Accept Offer & Proceed to Tuition Checkout</span>
                  </button>
                  <a
                    href={admission.handbookUrl || '/resources/STEMPACT_Student_Handbook_2025.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Student Handbook (PDF)</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">Admission Letter in Processing</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Once your diagnostic assessment is ratified by the Academic Board, your official offer letter and assigned Student ID will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tuition & Enrollment Checkout */}
        {activeTab === 'tuition' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tuition Clearance & Enrollment</h3>
              <p className="text-xs text-slate-500">
                Clear your enrollment deposit to unlock full LMS access, class schedules, and faculty mentorship.
              </p>
            </div>

            {invoice ? (
              <div className="max-w-2xl border border-slate-200 rounded-2xl p-6 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono">Invoice #{invoice.invoiceNumber}</span>
                    <h4 className="text-sm font-bold text-slate-900">{invoice.title}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>

                <div className="flex justify-between items-baseline py-2 border-b border-slate-200">
                  <span className="text-xs text-slate-600">Total Invoice Amount:</span>
                  <span className="text-lg font-black text-slate-900 font-mono">₦{invoice.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline py-2 border-b border-slate-200">
                  <span className="text-xs text-slate-600">Amount Paid:</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">₦{invoice.amountPaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline py-2">
                  <span className="text-xs text-slate-600">Outstanding Balance:</span>
                  <span className="text-xl font-black text-rose-700 font-mono">₦{invoice.balance?.toLocaleString()}</span>
                </div>

                {invoice.balance > 0 ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Tuition Online or via Bank Transfer</span>
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Tuition completely cleared! You are an active enrolled student.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No tuition invoices generated yet. Invoices are issued upon official admission offer.
              </div>
            )}
          </div>
        )}

        {/* Tuition Checkout Modal */}
        {showCheckout && invoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Tuition Checkout</h3>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {paymentSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="text-base font-bold text-slate-900">Payment Submitted!</h4>
                  <p className="text-xs text-slate-500">
                    Your payment has been logged. Transitioning you to your active student portal...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                    <span className="text-slate-500">Amount Due:</span>
                    <strong className="text-slate-900 font-mono text-sm">₦{invoice.balance?.toLocaleString()}</strong>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentChannel('PAYSTACK')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          paymentChannel === 'PAYSTACK'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Paystack
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentChannel('FLUTTERWAVE')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          paymentChannel === 'FLUTTERWAVE'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Flutterwave
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentChannel('BANK_TRANSFER')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          paymentChannel === 'BANK_TRANSFER'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  {paymentChannel === 'BANK_TRANSFER' ? (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-600 space-y-1">
                        <div>Bank: <strong>First Bank of Nigeria</strong></div>
                        <div>Account No: <strong className="font-mono text-blue-700">2041982341</strong></div>
                        <div>Account Name: <strong>STEMPACT ACADEMY LTD</strong></div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Your Bank Name:</label>
                        <input
                          type="text"
                          placeholder="e.g. Zenith Bank, GTBank"
                          value={senderBank}
                          onChange={(e) => setSenderBank(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Receipt URL / Teller No:</label>
                        <input
                          type="text"
                          placeholder="Receipt image link or transfer reference"
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <button
                        disabled={paying}
                        onClick={handleBankTransferSubmit}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                      >
                        {paying ? 'Submitting Transfer...' : 'Submit Transfer for Verification'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] text-slate-500">
                        You will be securely routed through the {paymentChannel} card and transfer gateway.
                      </p>
                      <button
                        disabled={paying}
                        onClick={handleOnlinePaymentSim}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm"
                      >
                        {paying ? 'Processing Payment...' : `Authorize ₦${invoice.balance?.toLocaleString()} with ${paymentChannel}`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};
