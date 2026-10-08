import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  RotateCcw,
  Bell,
  Printer,
  MapPin,
  Building2,
  GraduationCap,
  Tag,
  Percent,
} from 'lucide-react';

export const ApplicantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'status';
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (t: string) => {
    setActiveTab(t);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', t);
      return next;
    });
  };

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
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
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

  // Institutional Signatories State
  const [institutionalSettings, setInstitutionalSettings] = useState<any>(null);

  // Coupon / Waiver Code State
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [applyingCoupon, setApplyingCoupon] = useState<boolean>(false);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string>('');
  const [couponErrorMsg, setCouponErrorMsg] = useState<string>('');

  // Payment Options & Installment Plan State
  const [selectedPlanType, setSelectedPlanType] = useState<string>('FULL');
  const [savingPlan, setSavingPlan] = useState<boolean>(false);
  const [paymentModeChoice, setPaymentModeChoice] = useState<'MINIMUM_INSTALLMENT' | 'FULL_BALANCE' | 'CUSTOM'>('MINIMUM_INSTALLMENT');
  const [customPayAmount, setCustomPayAmount] = useState<string>('');

  // In-App Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const loadApplicantData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getApplicantDashboard();
      setDashboardData(data);

      if (data.invoice?.selectedPlanType) {
        setSelectedPlanType(data.invoice.selectedPlanType);
      }

      if (data.admission?.id) {
        try {
          const clr = await api.getFinancialClearance(data.admission.id);
          setClearanceData(clr);
        } catch (cErr) {
          console.warn('Financial clearance check:', cErr);
        }
      }

      // Load institutional settings (signatories, seal)
      try {
        const settingsRes = await api.getInstitutionalSettings();
        setInstitutionalSettings(settingsRes);
      } catch (sErr) {
        console.warn('Institutional settings fetch:', sErr);
      }

      // Load applicant notifications
      try {
        const notifRes = await api.getNotifications(25);
        setNotifications(notifRes.notifications || []);
        setUnreadCount(notifRes.unreadCount || 0);
      } catch (nErr) {
        console.warn('Failed to load applicant notifications:', nErr);
      }
    } catch (err: any) {
      console.error('Failed to load applicant dashboard:', err);
      setError(err.message || 'Failed to load applicant records');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
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

  // Determine amount payable based on plan choice & user selection
  const getPayableAmount = (): number => {
    const inv = dashboardData?.invoice;
    if (!inv) return 0;
    const balance = Number(inv.balance !== undefined ? inv.balance : inv.totalAmount || 0);
    if (balance <= 0) return 0;

    if (paymentModeChoice === 'FULL_BALANCE') {
      return balance;
    }
    if (paymentModeChoice === 'CUSTOM') {
      const customVal = Number(customPayAmount);
      if (customVal && customVal > 0) {
        return Math.min(balance, Math.max(1000, customVal));
      }
    }

    // Default: Minimum / next installment
    let schedule: any = null;
    if (inv.installmentScheduleJson) {
      try {
        schedule = typeof inv.installmentScheduleJson === 'string'
          ? JSON.parse(inv.installmentScheduleJson)
          : inv.installmentScheduleJson;
      } catch (e) {}
    }

    if (schedule?.milestones?.length) {
      const pendingMilestone = schedule.milestones.find((m: any) => m.status !== 'PAID');
      if (pendingMilestone) {
        return Math.min(balance, Number(pendingMilestone.amount));
      }
    }

    if (selectedPlanType === 'INSTALLMENT_50_50') {
      return Math.min(balance, Math.round(balance * 0.5));
    }
    if (selectedPlanType === 'INSTALLMENT_40_30_30') {
      return Math.min(balance, Math.round(balance * 0.4));
    }

    return balance;
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardData?.invoice?.id || !couponCodeInput.trim()) return;
    setApplyingCoupon(true);
    setCouponErrorMsg('');
    setCouponSuccessMsg('');
    try {
      const res = await api.applyCoupon({
        invoiceId: dashboardData.invoice.id,
        code: couponCodeInput.trim().toUpperCase(),
      });
      setCouponSuccessMsg(res.message || 'Coupon code applied successfully! Balance updated.');
      setCouponCodeInput('');
      await loadApplicantData();
    } catch (err: any) {
      setCouponErrorMsg(err.message || 'Failed to apply coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSelectPlan = async (planType: string) => {
    if (!dashboardData?.invoice?.id) return;
    setSavingPlan(true);
    setSelectedPlanType(planType);
    try {
      await api.selectInstallmentPlan({
        invoiceId: dashboardData.invoice.id,
        planType,
      });
      await loadApplicantData();
    } catch (err: any) {
      console.warn('Installment plan selection error:', err);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const res = await api.uploadFile(file, 'receipts');
      setProofUrl(res.url);
      setReceiptFileName(file.name);
    } catch (err: any) {
      alert('Failed to upload bank transfer receipt: ' + err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleBankTransferSubmit = async () => {
    if (!dashboardData?.invoice?.id || !senderBank) {
      alert('Please specify your sending bank name.');
      return;
    }
    const payableAmount = getPayableAmount();
    setPaying(true);
    try {
      await api.submitBankTransfer({
        invoiceId: dashboardData.invoice.id,
        amount: payableAmount,
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
    const payableAmount = getPayableAmount();
    setPaying(true);
    try {
      const res = await api.initializePayment({
        invoiceId: dashboardData.invoice.id,
        amount: payableAmount,
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

  const isReassessmentRequired = placement?.status === 'RETURNED_FOR_REASSESSMENT';

  const stages = [
    { key: 'APPLICATION', title: 'Application', desc: 'Application profile submitted', done: true },
    {
      key: 'ASSESSMENT',
      title: 'Assessment',
      desc: isReassessmentRequired
        ? 'Reassessment requested by Board'
        : attempt
        ? 'Diagnostic assessment completed'
        : 'Diagnostic assessment pending',
      done: !!attempt && !isReassessmentRequired,
      warning: isReassessmentRequired,
    },
    {
      key: 'PLACEMENT',
      title: 'Placement / Decision',
      desc: isReassessmentRequired ? 'Awaiting test retake' : 'Track verified by Academic Board',
      done: !isReassessmentRequired && (placement?.status === 'APPROVED' || placement?.status === 'MODIFIED' || !!admission),
    },
    { key: 'ADMISSION_OFFER', title: 'Admission Offer', desc: 'Provisional offer issued', done: !!admission },
    { key: 'FINANCIAL_CLEARANCE', title: 'Financial Clearance', desc: 'Tuition clearance verified', done: !!clearanceData?.cleared },
    { key: 'ENROLLMENT', title: 'Enrollment', desc: 'Official letter delivered & enrolled', done: admission?.status === 'ENROLLED' || user?.role === 'STUDENT' },
  ];

  return (
    <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
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
                  stage.warning
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950 ring-2 ring-amber-300/80 shadow-xs'
                    : stage.done
                    ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-950'
                    : 'bg-slate-50 border-slate-200/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold">Stage 0{idx + 1}</span>
                  {stage.warning ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
                  ) : stage.done ? (
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
            onClick={() => handleTabChange('status')}
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
            onClick={() => handleTabChange('assessment')}
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
            onClick={() => handleTabChange('admission')}
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
            onClick={() => handleTabChange('tuition')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tuition'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tuition & Clearance
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('notifications')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Admissions Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Application Overview */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Admissions Directives & In-App Alerts Banner */}
            {notifications.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Admissions Notifications & Board Directives</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                            {unreadCount} Unread
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500">Live operational decisions and official academic communications</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('notifications')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all ({notifications.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notifications.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        item.type === 'WARNING'
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                          : item.type === 'SUCCESS'
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : item.type === 'ALERT'
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              item.type === 'WARNING'
                                ? 'bg-amber-200/90 text-amber-900'
                                : item.type === 'SUCCESS'
                                ? 'bg-emerald-200/90 text-emerald-900'
                                : item.type === 'ALERT'
                                ? 'bg-rose-200/90 text-rose-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="font-bold text-xs">{item.title}</span>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            • {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs opacity-90 leading-relaxed pl-1">{item.message}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {item.link && (
                          <Link
                            to={item.link}
                            onClick={() => !item.isRead && handleMarkNotificationRead(item.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
                          >
                            <span>Open Directive</span>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                          </Link>
                        )}
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkNotificationRead(item.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <span className="text-slate-500 block">Intended Starting Level</span>
                    <strong className="text-indigo-700 font-bold">
                      {app.intendedLevel ? app.intendedLevel.replace(/_/g, ' ') : 'Level 1 Foundation'}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Assigned Cohort</span>
                    <strong className="text-slate-900">{app.cohortName || 'Pending Allocation'}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Preferred Schedule</span>
                    <strong className="text-slate-900">{app.preferredSchedule}</strong>
                  </div>
                  {app.preferredCenterName && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-500 block">Preferred Learning Center</span>
                      <strong className="text-slate-900">{app.preferredCenterName}</strong>
                    </div>
                  )}
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

              {(!attempt || isReassessmentRequired) && (
                <Link
                  to={`/portal/applicant/assessment?appId=${app?.id}&programId=${app?.programId || ''}`}
                  className={`w-full py-3 px-4 ${
                    isReassessmentRequired ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-center`}
                >
                  {isReassessmentRequired ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isReassessmentRequired ? 'Retake Diagnostic Assessment' : 'Launch Diagnostic Test'}</span>
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

          {/* Academic Placement & Level Progression Architecture Panel */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-wide uppercase border border-indigo-400/20">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Orientation & Admissions Policy Guide
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Academic Placement & 4-Level Progression Architecture
                </h3>
                <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
                  Understand how your diagnostic assessment score, intended starting level, and school evaluation shape your journey from admission to graduation.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('assessment')}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-indigo-50 transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>View Diagnostic Status</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </button>
              </div>
            </div>

            {/* 3 Pillars of Placement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  01
                </div>
                <h4 className="font-bold text-white text-sm">Purpose of Diagnostic Assessment</h4>
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  The placement assessment consists of <strong>30% general foundation</strong> (digital literacy & analytical reasoning) and <strong>70% program-specific</strong> technical problems. It is a benchmark diagnostic, not an exclusionary exam.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xs">
                  02
                </div>
                <h4 className="font-bold text-white text-sm">Intended vs. Ratified Level</h4>
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  Your selected preference (e.g. <em>{app?.intendedLevel ? app.intendedLevel.replace(/_/g, ' ') : 'Level 1'}</em>) informs the Admissions Committee, but final placement is determined by your diagnostic score and available cohort levels in this cycle.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  03
                </div>
                <h4 className="font-bold text-white text-sm">Cohort-to-Cohort Continuity</h4>
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  Once you complete a level, you earn guaranteed progression eligibility. You can advance immediately into the next cohort cycle or defer to any future term that fits your schedule.
                </p>
              </div>
            </div>

            {/* 4 Progression Tiers */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                STEMPACT 4-Tier Academic Progression Structure
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400/40 transition space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Level 1</span>
                  <h5 className="font-bold text-white text-xs">Foundation Stage</h5>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Zero-to-one fundamentals, core syntax, environment setup, and foundational principles. Ideal for career starters.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/40 transition space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Level 2</span>
                  <h5 className="font-bold text-white text-xs">Intermediate Stage</h5>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Applied industry toolsets, intermediate architectures, data structures, and practical group projects.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition space-y-1.5">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Level 3</span>
                  <h5 className="font-bold text-white text-xs">Advanced Specialization</h5>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Complex enterprise workflows, advanced optimization, systems integration, and production deployment.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Level 4</span>
                  <h5 className="font-bold text-white text-xs">Mastery & Capstone</h5>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Autonomous research, commercial capstone development, mentorship readiness, and industry certification.
                  </p>
                </div>
              </div>
            </div>
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
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isReassessmentRequired
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : attempt
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {isReassessmentRequired ? 'REASSESSMENT REQUIRED' : attempt ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>

            {/* Reassessment Alert Callout */}
            {isReassessmentRequired && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-200/70 text-amber-900">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 text-sm">Diagnostic Reassessment Required</h4>
                    <p className="text-xs text-amber-800">The Academic Admissions Board reviewed your file and requested that you retake the diagnostic test.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-amber-950 shadow-xs">
                  <strong className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                    Academic Board Rationale / Feedback:
                  </strong>
                  <p className="leading-relaxed">
                    {placement?.adminNotes || 'The Academic Admissions Board has requested that you retake the diagnostic assessment to recalibrate your competency level.'}
                  </p>
                </div>

                <div className="pt-1">
                  <Link
                    to={`/portal/applicant/assessment?appId=${app?.id}&programId=${app?.programId || ''}`}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Diagnostic Assessment Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {attempt ? (
              <div className="space-y-6">
                {isReassessmentRequired && (
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pt-2 border-t border-slate-100">
                    <span>Previous Diagnostic Attempt (Superseded)</span>
                  </div>
                )}
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

                {!isReassessmentRequired && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Academic Board Ratification:</strong> Diagnostic test results are submitted to the Academic Admissions Committee for cohort assignment ratification.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {app ? `Diagnostic Placement Assessment for ${app.programName || 'Your Specialization'}` : 'Diagnostic Placement Assessment'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
                    This comprehensive diagnostic placement assessment evaluates your baseline competency: <strong>30% general foundational principles</strong> (digital literacy, logic, systems thinking) and <strong>70% program-specific</strong> technical problems in {app?.programName || 'your applied specialization'}.
                  </p>
                  {app?.intendedLevel && (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                      <span>Your Stated Level Preference:</span>
                      <strong>{app.intendedLevel.replace(/_/g, ' ')}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to={`/portal/applicant/assessment?appId=${app?.id || ''}&programId=${app?.programId || ''}`}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <span>Launch Diagnostic Test Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {!app && (
                    <Link
                      to="/apply"
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Submit Official Application</span>
                    </Link>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Timed for 25–30 minutes. Once submitted, your diagnostic report is reviewed by the Academic Board for final cohort and level placement.
                </p>
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
                      Admission No: <strong>{admission.admissionNumber}</strong> • Student ID: <strong>{admission.studentIdNumber || 'Assigned Upon Clearance'}</strong>
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
                    The Academic Admissions Committee of STEMPACT Academy is pleased to offer you provisional admission into the <strong>{admission.programName}</strong> ({admission.level}) program for the upcoming academic session at {admission.location || admission.cohort?.learningCenter?.name || 'STEMPACT Training Hub & Campus Network'}.
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
                    {(invoice.couponCode || (invoice.discountAmount && invoice.discountAmount > 0)) && (
                      <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-700 font-semibold bg-emerald-50/50 px-3 rounded-lg">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Discount / Fee Waiver Applied ({invoice.couponCode || 'COUPON'}):</span>
                        </span>
                        <strong className="font-mono">
                          -₦{Number(invoice.discountAmount || 0).toLocaleString()}
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

                  {/* Coupon & Tuition Waiver Input Box */}
                  {invoice.balance > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Tuition Discount or Fee Waiver Code</span>
                        </label>
                        {invoice.couponCode && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            Active: {invoice.couponCode}
                          </span>
                        )}
                      </div>

                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. EARLYBIRD2026, WAIVER50"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase bg-white focus:ring-2 focus:ring-indigo-300"
                        />
                        <button
                          type="submit"
                          disabled={applyingCoupon || !couponCodeInput.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {applyingCoupon ? 'Applying...' : 'Apply Code'}
                        </button>
                      </form>

                      {couponSuccessMsg && (
                        <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{couponSuccessMsg}</span>
                        </p>
                      )}
                      {couponErrorMsg && (
                        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{couponErrorMsg}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Flexible Payment Plan Selector */}
                  {invoice.balance > 0 && (() => {
                    let schedule: any = null;
                    if (invoice.installmentScheduleJson) {
                      try {
                        schedule = typeof invoice.installmentScheduleJson === 'string'
                          ? JSON.parse(invoice.installmentScheduleJson)
                          : invoice.installmentScheduleJson;
                      } catch (e) {}
                    }
                    const activePlan = invoice.selectedPlanType || selectedPlanType || 'FULL';
                    const totalInv = Number(invoice.totalAmount || 0);

                    return (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            <span>Select Your Desired Payment Plan</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Choose single full settlement or staged cohort installments.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Option 1: Full Payment */}
                          <div
                            onClick={() => handleSelectPlan('FULL')}
                            className={`p-3 rounded-xl border-2 transition cursor-pointer text-left ${
                              activePlan === 'FULL'
                                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">Full Payment</span>
                              {activePlan === 'FULL' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">100% upfront settlement</p>
                            <div className="text-xs font-bold text-blue-700 font-mono mt-2">
                              ₦{totalInv.toLocaleString()}
                            </div>
                          </div>

                          {/* Option 2: 2 Installments (50/50) */}
                          <div
                            onClick={() => handleSelectPlan('INSTALLMENT_50_50')}
                            className={`p-3 rounded-xl border-2 transition cursor-pointer text-left ${
                              activePlan === 'INSTALLMENT_50_50'
                                ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">2 Installments</span>
                              {activePlan === 'INSTALLMENT_50_50' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">50% now • 50% midterm</p>
                            <div className="text-xs font-bold text-indigo-700 font-mono mt-2">
                              ₦{Math.round(totalInv * 0.5).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ part</span>
                            </div>
                          </div>

                          {/* Option 3: 3 Installments (40/30/30) */}
                          <div
                            onClick={() => handleSelectPlan('INSTALLMENT_40_30_30')}
                            className={`p-3 rounded-xl border-2 transition cursor-pointer text-left ${
                              activePlan === 'INSTALLMENT_40_30_30'
                                ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">3 Installments</span>
                              {activePlan === 'INSTALLMENT_40_30_30' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">40% now • 30% • 30%</p>
                            <div className="text-xs font-bold text-purple-700 font-mono mt-2">
                              ₦{Math.round(totalInv * 0.4).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">1st part</span>
                            </div>
                          </div>
                        </div>

                        {/* Milestone Schedule Breakdown */}
                        {schedule?.milestones?.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Installment Milestone Breakdown:
                            </span>
                            <div className="space-y-1.5">
                              {schedule.milestones.map((m: any, idx: number) => {
                                const isPaid = m.status === 'PAID';
                                return (
                                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <div className="font-semibold text-slate-800">{m.title}</div>
                                        <div className="text-[10px] text-slate-400">
                                          {m.percentage}% of total {m.dueDate ? `• Due by ${new Date(m.dueDate).toLocaleDateString('en-GB')}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono font-bold text-slate-900">₦{Number(m.amount).toLocaleString()}</div>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {isPaid ? 'PAID' : 'DUE / PENDING'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {invoice.balance > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowCheckout(true)}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Payment Checkout / Submit Bank Slip</span>
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

            {/* Payment Amount Choice (Installment vs Full vs Custom) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Payment Amount:</span>
                <span className="font-mono font-extrabold text-blue-700 text-sm">
                  ₦{getPayableAmount().toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentModeChoice('MINIMUM_INSTALLMENT')}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    paymentModeChoice === 'MINIMUM_INSTALLMENT'
                      ? 'border-blue-600 bg-blue-100/60 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">Plan Stage</div>
                  <div className="font-mono font-bold text-[11px]">Installment</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentModeChoice('FULL_BALANCE')}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    paymentModeChoice === 'FULL_BALANCE'
                      ? 'border-blue-600 bg-blue-100/60 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">Full Outstanding</div>
                  <div className="font-mono font-bold text-[11px]">Balance</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentModeChoice('CUSTOM')}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    paymentModeChoice === 'CUSTOM'
                      ? 'border-blue-600 bg-blue-100/60 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">Other Amount</div>
                  <div className="font-mono font-bold text-[11px]">Custom</div>
                </button>
              </div>

              {paymentModeChoice === 'CUSTOM' && (
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">₦</span>
                    <input
                      type="number"
                      min="1000"
                      max={invoice?.balance || invoice?.totalAmount || 500000}
                      placeholder="e.g. 25000"
                      value={customPayAmount}
                      onChange={(e) => setCustomPayAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Minimum deposit: ₦1,000. Balance cap: ₦{Number(invoice?.balance !== undefined ? invoice.balance : invoice?.totalAmount || 0).toLocaleString()}.
                  </p>
                </div>
              )}
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

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Payment Receipt / Teller *</span>
                    </span>
                    {uploadingReceipt && <span className="text-[10px] text-blue-600 animate-pulse">Uploading to Cloud...</span>}
                  </label>

                  <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptUpload}
                      disabled={uploadingReceipt}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {proofUrl ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[240px]">{receiptFileName || 'Receipt uploaded successfully'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <p className="text-slate-600 text-xs font-medium">
                          Click or drag receipt image / PDF here
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Supports PNG, JPG, WEBP, or PDF (up to 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={paying || uploadingReceipt}
                  onClick={handleBankTransferSubmit}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {paying ? 'Submitting Transfer Proof...' : `Submit ₦${getPayableAmount().toLocaleString()} Transfer Confirmation`}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  You will be securely routed to {paymentChannel} to complete your tuition payment of{' '}
                  <strong className="text-slate-900 font-mono">
                    ₦{getPayableAmount().toLocaleString()}
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
                  {paying ? 'Initializing Gateway...' : `Proceed to ${paymentChannel} (₦${getPayableAmount().toLocaleString()})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Admissions Notifications & Alerts Center */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Admissions Notifications & Alerts</h3>
                <p className="text-xs text-slate-500">Official academic directives, review outcomes, and action notices</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    notifFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    notifFilter === 'unread' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {notifications.filter((n) => (notifFilter === 'unread' ? !n.isRead : true)).length === 0 ? (
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Notifications in View</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {notifFilter === 'unread'
                  ? 'All notifications have been read. You are completely up to date!'
                  : 'There are no active admissions notifications recorded for this account.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications
                .filter((n) => (notifFilter === 'unread' ? !n.isRead : true))
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.type === 'WARNING'
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                        : item.type === 'SUCCESS'
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : item.type === 'ALERT'
                        ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                        : 'bg-slate-50/80 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              item.type === 'WARNING'
                                ? 'bg-amber-200 text-amber-900'
                                : item.type === 'SUCCESS'
                                ? 'bg-emerald-200 text-emerald-900'
                                : item.type === 'ALERT'
                                ? 'bg-rose-200 text-rose-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {item.type}
                          </span>
                          <h4 className="font-extrabold text-sm">{item.title}</h4>
                          {!item.isRead && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">{item.message}</p>
                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          Received {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {item.link && (
                          <Link
                            to={item.link}
                            onClick={() => !item.isRead && handleMarkNotificationRead(item.id)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Take Action</span>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                          </Link>
                        )}
                        {!item.isRead ? (
                          <button
                            type="button"
                            onClick={() => handleMarkNotificationRead(item.id)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 text-xs font-bold transition cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold px-2">Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
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
      {/* Official Institutional Admission Document Modal */}
      {showDocModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:border-none print:m-0">
            {/* Top Bar for Screen (Hidden in Print) */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    {admission?.status === 'ENROLLED'
                      ? 'Official Institutional Admission Letter'
                      : 'Provisional Offer of Admission Document'}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Official Reference: <strong>{documentData?.admission?.admissionNumber || admission?.admissionNumber}</strong>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingDoc ? (
              <div className="py-16 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Rendering official academic document preview...
              </div>
            ) : documentData ? (() => {
              const studentName = documentData.student?.name || documentData.recipientName || app?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admitted Candidate';
              const studentEmail = documentData.student?.email || documentData.recipientEmail || app?.email || user?.email || '—';
              const studentPhone = documentData.student?.phone || app?.phone || '—';
              const studentIdNumber = documentData.student?.studentId || admission?.studentIdNumber || 'Assigned Upon Matriculation';
              const programName = documentData.academic?.programName || documentData.programName || admission?.programName || app?.programName || 'STEM Program Track';
              const programCode = documentData.academic?.programCode || '—';
              const schoolName = documentData.academic?.schoolName || app?.schoolName || 'STEMPACT Academy';
              const cohortName = documentData.academic?.cohortName || admission?.cohortName || app?.cohortName || 'Intake Cohort';
              const cohortCode = documentData.academic?.cohortCode || documentData.cohortCode || admission?.cohortCode || '—';
              const sessionName = documentData.academic?.academicSessionName || admission?.academicSessionName || '2026 Academic Session';
              const deliveryMode = documentData.academic?.deliveryMode || admission?.mode || 'Hybrid (Onsite Campus & Virtual)';
              const locationVenue = admission?.location || admission?.cohort?.learningCenter?.name || 'STEMPACT Innovation Hub, Ile-Ife & Training Centers';
              const classSchedule = admission?.schedule || app?.preferredSchedule || 'Assigned Cohort Schedule';
              const leadInstructor = admission?.instructorName || 'Lead Faculty Mentor & Academy Engineers';
              const tuitionFee = documentData.financial?.tuitionFee ?? admission?.trainingFee ?? 0;
              const clearanceStatus = documentData.financial?.clearanceStatus || admission?.clearanceStatus || 'PENDING';
              const verificationHash = documentData.verificationHash || `STP-VERIF-${admission?.admissionNumber || 'ADM-2026'}`;
              const docNumber = documentData.admission?.admissionNumber || admission?.admissionNumber || 'ADM-2026-001';
              const isOfficial = admission?.status === 'ENROLLED' || admission?.status === 'FINANCIALLY_CLEARED';

              return (
                <div className="space-y-6">
                  {/* Print Notice (Hidden in Print) */}
                  {!isOfficial && (
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-950 text-xs flex items-center gap-2.5 print:hidden">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="leading-relaxed">
                        <strong>Notice:</strong> This is an Official Provisional Admission Document. Following tuition verification and financial clearance, your matriculation record and student cockpit credentials will be fully activated.
                      </span>
                    </div>
                  )}

                  {/* FORMAL INSTITUTIONAL LETTERHEAD CONTAINER */}
                  <div className="p-6 sm:p-10 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-6 text-slate-800 font-sans print:border-none print:p-0">
                    {/* Header Strip */}
                    <div className="border-b-2 border-slate-900 pb-5">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex items-center justify-center text-white shadow-md">
                            <GraduationCap className="w-8 h-8" />
                          </div>
                          <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                              STEMPACT ACADEMY
                            </h1>
                            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                              Premier STEM, Vocational & Emerging Technology Academy
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Campus & Hubs: Ile-Ife Main Innovation Hub • Training Center Network • Virtual Global Campus
                            </p>
                          </div>
                        </div>

                        <div className="text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                            Office of Academic Admissions
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">
                            Ref: {docNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Security Verification Bar */}
                      <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                        <span>SECURITY AUTHENTICATION HASH: <strong className="text-slate-800">{verificationHash}</strong></span>
                        <span className={`px-2 py-0.5 rounded font-sans font-bold uppercase ${
                          isOfficial ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {isOfficial ? 'OFFICIAL MATRICULATION DOCUMENT' : 'PROVISIONAL ADMISSION OFFER'}
                        </span>
                      </div>
                    </div>

                    {/* Candidate & Placement Dossier */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Candidate Full Name:</span>
                          <strong className="text-slate-900 text-sm font-black">{studentName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Registered Email & Contact:</span>
                          <span className="text-slate-700">{studentEmail} • {studentPhone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Institutional Student ID:</span>
                          <span className="font-mono font-bold text-blue-700">{studentIdNumber}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Academic Faculty / School:</span>
                          <strong className="text-slate-900 font-bold">{schoolName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Admitted Program Track & Stage:</span>
                          <span className="text-slate-900 font-bold">{programName} ({admission.level || 'Level 1 Foundation'})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Assigned Cohort & Session:</span>
                          <span className="text-slate-700 font-medium">{cohortName} ({cohortCode}) • {sessionName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Letter Body Text */}
                    <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed text-justify">
                      <p>
                        Dear <strong>{studentName}</strong>,
                      </p>
                      <p>
                        On behalf of the Governing Academic Board and the Admissions Directorate of <strong>STEMPACT Academy</strong>, we are pleased to officially convey your offer of admission for the <strong>{sessionName}</strong> into the accredited program: <strong>{programName}</strong>.
                      </p>
                      <p>
                        Your selection into this cohort follows a rigorous evaluation of your academic foundation, problem-solving aptitude, and diagnostic placement results. STEMPACT Academy is committed to delivering world-class, hands-on, project-driven technical mastery with personalized mentorship and industry-grade laboratory environments.
                      </p>

                      {/* Timetable & Lab Allocation Box */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Official Timetable & Laboratory Station Allocation</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600">
                          <div>• Class Timetable: <strong className="text-slate-800">{classSchedule}</strong></div>
                          <div>• Delivery Mode: <strong className="text-slate-800">{deliveryMode}</strong></div>
                          <div>• Campus / Center: <strong className="text-slate-800">{locationVenue}</strong></div>
                          <div>• Assigned Lab Bench: <strong className="text-slate-800">{admission.assignedClass || 'Main Computer Lab Station'}</strong></div>
                          <div>• Lead Faculty: <strong className="text-slate-800">{leadInstructor}</strong></div>
                          <div>• Orientation Date: <strong className="text-slate-800">{admission.orientationDate ? new Date(admission.orientationDate).toLocaleDateString('en-GB') : 'To Be Announced'}</strong></div>
                        </div>
                      </div>

                      {/* Financial Terms & Clearance Statement */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-slate-900 text-xs">Program Tuition & Financial Clearance:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isOfficial ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Status: {clearanceStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          Program tuition is <strong>₦{Number(tuitionFee).toLocaleString()}</strong>. {isOfficial 
                            ? 'Your financial clearance has been certified by the Bursary. Your workstation and full student cockpit have been unlocked.' 
                            : 'This offer remains provisional pending payment verification. Complete tuition clearance via your portal to secure your physical lab seat and receive verified credentials.'}
                        </p>
                      </div>

                      <p>
                        We warmly welcome you to the STEMPACT learning community and look forward to partnering with you on your journey of technological excellence and real-world innovation.
                      </p>
                    </div>

                    {/* Official Signatures & Institutional Seal */}
                    <div className="pt-6 border-t border-slate-200 mt-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                        {/* Dean Signature */}
                        <div className="space-y-1">
                          {institutionalSettings?.deanSignatureUrl ? (
                            <img
                              src={institutionalSettings.deanSignatureUrl}
                              alt="Dean Signature"
                              className="h-10 object-contain mx-auto sm:mx-0 mb-1"
                            />
                          ) : (
                            <div className="font-serif italic text-base text-slate-800 font-bold tracking-wider">
                              {institutionalSettings?.deanName || 'Dr. Kehinde Adeleke'}
                            </div>
                          )}
                          <div className="w-40 h-0.5 bg-slate-300"></div>
                          <div className="text-[10px] font-bold uppercase text-slate-700">
                            {institutionalSettings?.deanTitle || 'Dean of Academic Affairs & Faculty'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {institutionalSettings?.directorateLabel || 'STEMPACT Academy Directorate'}
                          </div>
                        </div>

                        {/* Official Embossed Seal Badge */}
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-600/70 bg-amber-50/60 p-1 flex items-center justify-center text-center shadow-xs">
                          {institutionalSettings?.officialSealUrl ? (
                            <img
                              src={institutionalSettings.officialSealUrl}
                              alt="Official Seal"
                              className="w-full h-full object-contain rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full border border-amber-600/80 flex flex-col items-center justify-center p-1">
                              <Award className="w-5 h-5 text-amber-700" />
                              <span className="text-[7px] font-black uppercase tracking-tighter text-amber-900 leading-tight">STEMPACT</span>
                              <span className="text-[6px] font-bold text-amber-800 leading-tight">OFFICIAL SEAL</span>
                            </div>
                          )}
                        </div>

                        {/* Registrar Signature */}
                        <div className="space-y-1 text-center sm:text-right">
                          {institutionalSettings?.registrarSignatureUrl ? (
                            <img
                              src={institutionalSettings.registrarSignatureUrl}
                              alt="Registrar Signature"
                              className="h-10 object-contain mx-auto sm:ml-auto mb-1"
                            />
                          ) : (
                            <div className="font-serif italic text-base text-slate-800 font-bold tracking-wider">
                              {institutionalSettings?.registrarName || 'Office of the Registrar'}
                            </div>
                          )}
                          <div className="w-40 h-0.5 bg-slate-300 ml-auto"></div>
                          <div className="text-[10px] font-bold uppercase text-slate-700">
                            {institutionalSettings?.registrarTitle || 'Registrar & Student Records'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {institutionalSettings?.registryLabel || 'Accredited Academic Registry'}
                          </div>
                        </div>
                      </div>

                      {/* Footer Legal Verification */}
                      <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>STEMPACT OS • Verified Document Registry</span>
                        <span>https://stempactacademy.vercel.app/verify</span>
                        <span>Doc Ref: {docNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar (Hidden in Print) */}
                  <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => setShowDocModal(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Save PDF Copy</span>
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="py-12 text-center text-xs text-slate-500">
                Document could not be previewed.
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
