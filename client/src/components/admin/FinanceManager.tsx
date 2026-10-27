import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, Badge } from '../UIElements';
import { CreateCouponModal } from './CreateCouponModal';
import { CustomInvoiceModal } from './CustomInvoiceModal';
import { SignatoriesModal } from './SignatoriesModal';
import { LearnerPaymentHistoryModal } from './LearnerPaymentHistoryModal';
import { PaymentSettingsModal } from './PaymentSettingsModal';
import { PayerProfileAuditModal } from './PayerProfileAuditModal';
import {
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Plus,
  ShieldCheck,
  TrendingUp,
  X,
  FileText,
  DollarSign,
  AlertTriangle,
  Gift,
  HelpCircle,
  Tag,
  Percent,
  Receipt,
  Send,
  Eye,
  Mail,
  Award,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  User,
  BookOpen,
  Layers,
  School,
  Phone,
  Clock,
  Check,
} from 'lucide-react';

interface FinanceManagerProps {
  invoices: any[];
  bankTransfers: any[];
  stats: any;
  onDataRefresh: () => Promise<void>;
  isFinanceOrSuperAdmin: boolean;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  invoices,
  bankTransfers,
  stats,
  onDataRefresh,
  isFinanceOrSuperAdmin,
}) => {
  const [subTab, setSubTab] = useState<'transfers' | 'ledger' | 'coupons' | 'invoices' | 'clearance' | 'signatories'>('transfers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Enhanced Transfers & Payment Filter States
  const [transferSearch, setTransferSearch] = useState('');
  const [transferStatusFilter, setTransferStatusFilter] = useState('ALL');
  const [transferChannelFilter, setTransferChannelFilter] = useState('ALL');
  const [transferClearanceFilter, setTransferClearanceFilter] = useState('ALL');
  const [transferPayerTypeFilter, setTransferPayerTypeFilter] = useState('ALL');
  const [transferDateFilter, setTransferDateFilter] = useState('ALL');
  const [inspectingPayment, setInspectingPayment] = useState<any | null>(null);

  // Helper to resolve full payer and enrollment identity
  const resolvePaymentDossier = (tx: any) => {
    const inv = tx.invoice || {};
    const student = inv.student;
    const application = inv.application;
    const admission = inv.admission;
    const cohort = inv.cohort || admission?.cohort || application?.cohort;
    const program =
      cohort?.program ||
      admission?.cohort?.program ||
      application?.program ||
      student?.enrollments?.[0]?.cohort?.program;

    const candidateName =
      student?.user
        ? `${student.user.firstName} ${student.user.lastName}`
        : application?.fullName ||
          tx.payerName ||
          inv.payerName ||
          tx.senderAccount ||
          'Candidate';

    const candidateId =
      student?.registrationNumber ||
      admission?.admissionNumber ||
      application?.applicationNumber ||
      inv.invoiceNumber ||
      'STP-ID';

    const candidateEmail =
      student?.user?.email || application?.email || inv.payerEmail || '';
    const candidatePhone =
      student?.user?.phone || application?.phone || '';

    const isEnrolledStudent = Boolean(student || admission?.status === 'ENROLLED');
    const isApplicant = Boolean(application && !isEnrolledStudent);
    const isParent = tx.payerType === 'PARENT' || inv.payerType === 'PARENT';
    const isSponsor = tx.payerType === 'SPONSOR' || inv.payerType === 'SPONSOR';

    let roleLabel = '📝 New Applicant';
    let roleBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
    if (isEnrolledStudent) {
      roleLabel = '🎓 Enrolled Student';
      roleBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (isParent) {
      roleLabel = '👨‍👩‍👦 Parent / Guardian';
      roleBadgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (isSponsor) {
      roleLabel = '🏢 Corporate / Sponsor';
      roleBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    }

    const programName = program?.name || 'Academic Specialization';
    const schoolName = program?.school?.name || 'STEMPACT Academy';
    const cohortName = cohort?.name || application?.cohortName || 'Assigned Cohort';
    const cohortCode = cohort?.cohortCode || '';
    const level =
      cohort?.level ||
      application?.intendedLevel?.replace(/_/g, ' ') ||
      'Level 1 (Foundation)';

    const totalInv = Number(inv.totalAmount || tx.amount || 0);
    const paidInv = Number(
      inv.amountPaid !== undefined
        ? inv.amountPaid
        : tx.status === 'PAID'
        ? tx.amount
        : 0
    );
    const balance = Number(
      inv.balance !== undefined ? inv.balance : Math.max(0, totalInv - paidInv)
    );
    const isFullPayment = balance <= 0;

    return {
      candidateName,
      candidateId,
      candidateEmail,
      candidatePhone,
      isEnrolledStudent,
      isApplicant,
      roleLabel,
      roleBadgeClass,
      programName,
      schoolName,
      cohortName,
      cohortCode,
      level,
      totalInv,
      paidInv,
      balance,
      isFullPayment,
    };
  };

  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Ledger & Financial Overview State
  const [financialOverview, setFinancialOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('ALL');

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Modal Visibility States
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [showCustomInvoiceModal, setShowCustomInvoiceModal] = useState(false);
  const [showSignatoriesModal, setShowSignatoriesModal] = useState(false);
  const [showPaymentSettingsModal, setShowPaymentSettingsModal] = useState(false);
  const [selectedLearnerRecord, setSelectedLearnerRecord] = useState<any | null>(null);

  // Reminder Dispatch State
  const [sendingReminderInvoiceId, setSendingReminderInvoiceId] = useState<string | null>(null);

  // Rejection modal
  const [rejectingTransferId, setRejectingTransferId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment could not be matched against official bank statements');

  // Financial Waiver Modal
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [waiverAdmissionId, setWaiverAdmissionId] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [waiverAmount, setWaiverAmount] = useState<number | ''>('');

  // Financial Adjustment Modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjInvoiceId, setAdjInvoiceId] = useState('');
  const [adjType, setAdjType] = useState('SCHOLARSHIP');
  const [adjAmount, setAdjAmount] = useState<number>(10000);
  const [adjReason, setAdjReason] = useState('Merit scholarship awarded by Academic Board');
  const [adjSponsor, setAdjSponsor] = useState('');

  // Payment Arrangement Modal
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [arrAdmissionId, setArrAdmissionId] = useState('');
  const [arrPlanType, setArrPlanType] = useState('INSTALLMENT_50_50');
  const [arrInitialPayment, setArrInitialPayment] = useState<number>(35000);
  const [arrFundingSource, setArrFundingSource] = useState('SELF');
  const [arrSponsorName, setArrSponsorName] = useState('');
  const [arrNotes, setArrNotes] = useState('Approved payment arrangement for cohort participation');

  // Authoritative Clearance Evaluator Modal
  const [inspectClearanceId, setInspectClearanceId] = useState('');
  const [clearanceResult, setClearanceResult] = useState<any | null>(null);
  const [evaluatingClearance, setEvaluatingClearance] = useState(false);

  // 1. Approve Bank Transfer
  const handleApproveBankTransfer = async (paymentId: string) => {
    setProcessing(true);
    setActionError('');
    try {
      await api.approveBankTransfer(paymentId);
      setActionSuccess('Bank transfer payment verified & approved! Official receipt emitted.');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve bank transfer');
    } finally {
      setProcessing(false);
    }
  };

  // 2. Reject Bank Transfer
  const handleRejectBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTransferId) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.rejectBankTransfer(rejectingTransferId, rejectionReason);
      setActionSuccess('Bank transfer rejected.');
      setRejectingTransferId(null);
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject bank transfer');
    } finally {
      setProcessing(false);
    }
  };

  // 3. Grant Financial Waiver
  const handleGrantWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiverAdmissionId || !waiverReason) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.grantFinancialWaiver({
        admissionId: waiverAdmissionId,
        reason: waiverReason,
        waiverAmount: waiverAmount !== '' ? Number(waiverAmount) : undefined,
      });
      setActionSuccess('Financial clearance waiver granted successfully.');
      setShowWaiverModal(false);
      setWaiverAdmissionId('');
      setWaiverReason('');
      setWaiverAmount('');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to grant waiver');
    } finally {
      setProcessing(false);
    }
  };

  // 4. Apply Financial Adjustment
  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjInvoiceId || !adjAmount || !adjReason) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.applyFinancialAdjustment({
        invoiceId: adjInvoiceId,
        adjustmentType: adjType,
        amount: Number(adjAmount),
        reason: adjReason,
        sponsorDetails: adjSponsor ? { sponsorName: adjSponsor } : undefined,
      });
      setActionSuccess('Financial adjustment applied to invoice balance.');
      setShowAdjustmentModal(false);
      setAdjInvoiceId('');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to apply adjustment');
    } finally {
      setProcessing(false);
    }
  };

  // 5. Approve Payment Arrangement
  const handleApproveArrangement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrAdmissionId) return;
    setProcessing(true);
    setActionError('');
    try {
      await api.approvePaymentArrangement({
        admissionId: arrAdmissionId,
        planType: arrPlanType,
        requiredInitialPayment: arrInitialPayment !== undefined ? Number(arrInitialPayment) : undefined,
        fundingSource: arrFundingSource,
        sponsorName: arrSponsorName || undefined,
        notes: arrNotes,
      });
      setActionSuccess('Institutional payment arrangement approved.');
      setShowArrangementModal(false);
      setArrAdmissionId('');
      await onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve arrangement');
    } finally {
      setProcessing(false);
    }
  };

  // 6. Evaluate Authoritative Clearance
  const handleInspectClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectClearanceId) return;
    setEvaluatingClearance(true);
    setActionError('');
    try {
      const res = await api.getFinancialClearance(inspectClearanceId);
      setClearanceResult(res);
    } catch (err: any) {
      setActionError(err.message || 'Failed to evaluate financial clearance');
      setClearanceResult(null);
    } finally {
      setEvaluatingClearance(false);
    }
  };

  // 7. Load Financial Ledger Overview
  const loadFinancialOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.getFinancialOverview({
        search: ledgerSearch || undefined,
        status: ledgerStatusFilter !== 'ALL' ? ledgerStatusFilter : undefined,
      });
      setFinancialOverview(res);
    } catch (err: any) {
      console.warn('Financial overview fetch error:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // 8. Load Active Coupons
  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await api.getCoupons();
      setCoupons(res.coupons || []);
    } catch (err: any) {
      console.warn('Coupons fetch error:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (subTab === 'ledger') {
      loadFinancialOverview();
    } else if (subTab === 'coupons') {
      loadCoupons();
    }
  }, [subTab, ledgerStatusFilter]);

  // 9. Send Tuition Payment Reminder
  const handleSendReminder = async (invoiceId: string, customNote?: string) => {
    setSendingReminderInvoiceId(invoiceId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.sendPaymentReminder(invoiceId, customNote);
      setActionSuccess(res.message || 'Tuition payment reminder dispatched successfully!');
      await loadFinancialOverview();
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch payment reminder.');
    } finally {
      setSendingReminderInvoiceId(null);
    }
  };

  // 10. Toggle Coupon Active State
  const handleToggleCoupon = async (couponId: string) => {
    try {
      await api.toggleCoupon(couponId);
      setActionSuccess('Coupon status updated.');
      await loadCoupons();
    } catch (err: any) {
      setActionError(err.message || 'Failed to toggle coupon status.');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchTitle = inv.title?.toLowerCase().includes(q);
      const matchUser =
        inv.student?.user?.firstName?.toLowerCase().includes(q) ||
        inv.student?.user?.lastName?.toLowerCase().includes(q) ||
        inv.application?.fullName?.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchUser) return false;
    }
    return true;
  });

  // Filtered transactions for the verification queue & ledger
  const filteredTransfers = bankTransfers.filter((tx) => {
    const dossier = resolvePaymentDossier(tx);

    // 1. Search Query
    if (transferSearch.trim()) {
      const q = transferSearch.toLowerCase();
      const matchName = dossier.candidateName.toLowerCase().includes(q);
      const matchId = dossier.candidateId.toLowerCase().includes(q);
      const matchEmail = dossier.candidateEmail.toLowerCase().includes(q);
      const matchPhone = dossier.candidatePhone.toLowerCase().includes(q);
      const matchProg = dossier.programName.toLowerCase().includes(q);
      const matchCohort = dossier.cohortName.toLowerCase().includes(q);
      const matchRef = (tx.paymentReference || '').toLowerCase().includes(q);
      const matchInv = (tx.invoice?.invoiceNumber || tx.invoiceId || '').toLowerCase().includes(q);
      const matchBank = (tx.senderBank || '').toLowerCase().includes(q);
      const matchAccount = (tx.senderAccount || '').toLowerCase().includes(q);

      if (
        !matchName &&
        !matchId &&
        !matchEmail &&
        !matchPhone &&
        !matchProg &&
        !matchCohort &&
        !matchRef &&
        !matchInv &&
        !matchBank &&
        !matchAccount
      ) {
        return false;
      }
    }

    // 2. Status Filter
    if (transferStatusFilter !== 'ALL' && tx.status !== transferStatusFilter) {
      return false;
    }

    // 3. Channel Filter
    if (transferChannelFilter !== 'ALL') {
      if (transferChannelFilter === 'BANK_TRANSFER' && tx.channel !== 'BANK_TRANSFER') return false;
      if (transferChannelFilter === 'PAYSTACK' && tx.channel !== 'PAYSTACK') return false;
      if (transferChannelFilter === 'FLUTTERWAVE' && tx.channel !== 'FLUTTERWAVE') return false;
      if (transferChannelFilter === 'GATEWAY' && tx.channel === 'BANK_TRANSFER') return false;
    }

    // 4. Clearance Filter
    if (transferClearanceFilter === 'FULL' && !dossier.isFullPayment) return false;
    if (transferClearanceFilter === 'PARTIAL' && dossier.isFullPayment) return false;

    // 5. Payer Type Filter
    if (transferPayerTypeFilter === 'APPLICANT' && !dossier.isApplicant) return false;
    if (transferPayerTypeFilter === 'STUDENT' && !dossier.isEnrolledStudent) return false;
    if (transferPayerTypeFilter === 'PARENT_SPONSOR' && (dossier.isApplicant || dossier.isEnrolledStudent)) return false;

    // 6. Date Filter
    if (transferDateFilter !== 'ALL' && tx.paidAt) {
      const txTime = new Date(tx.paidAt).getTime();
      const now = Date.now();
      if (transferDateFilter === 'TODAY') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (txTime < startOfToday.getTime()) return false;
      } else if (transferDateFilter === '7DAYS') {
        if (now - txTime > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (transferDateFilter === '30DAYS') {
        if (now - txTime > 30 * 24 * 60 * 60 * 1000) return false;
      }
    }

    return true;
  });

  const pendingTransfers = bankTransfers.filter((t) => t.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Financial Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue Collected</span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₦{(stats?.metrics?.totalRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Verified bank & gateway receipts</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Balances</span>
          <div className="text-2xl font-black text-amber-700 font-mono">
            ₦{(stats?.metrics?.outstandingInvoices || stats?.metrics?.outstandingBalance || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Unsettled student fee receivables</span>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Pending Bank Tellers</span>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {pendingTransfers.length}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">Awaiting finance audit & confirmation</span>
        </Card>
      </div>

      {/* Subtab Navigation & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSubTab('transfers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'transfers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Bank Transfer Approvals ({pendingTransfers.length})
          </button>
          <button
            onClick={() => setSubTab('ledger')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Learner Ledger & Reminders</span>
          </button>
          <button
            onClick={() => setSubTab('coupons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'coupons'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupons & Waivers ({coupons.length})</span>
          </button>
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Academic Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setSubTab('clearance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'clearance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Clearance
          </button>
          <button
            onClick={() => setSubTab('signatories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'signatories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Signatories & Seal</span>
          </button>
        </div>

        {isFinanceOrSuperAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCustomInvoiceModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>+ Issue Custom Invoice</span>
            </button>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>+ Create Coupon</span>
            </button>
            <button
              onClick={() => setShowWaiverModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grant Waiver</span>
            </button>
            <button
              onClick={() => setShowArrangementModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Approve Arrangement</span>
            </button>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Adjustment</span>
            </button>
            <button
              onClick={() => setShowPaymentSettingsModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Gateways & Accounts</span>
            </button>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl font-semibold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-950">×</button>
        </div>
      )}
      {actionError && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl font-semibold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold text-rose-950">×</button>
        </div>
      )}

      {/* SUBTAB 1: BANK TRANSFERS & COMPREHENSIVE PAYMENT AUDIT */}
      {subTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Payment Verification & Payer Audit Ledger</span>
              </h3>
              <p className="text-xs text-slate-500">
                Audit candidate payments, verify bank deposit tellers, inspect online gateway settlements, and view full payer profiles.
              </p>
            </div>
            {pendingTransfers.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 animate-pulse self-start md:self-auto">
                {pendingTransfers.length} Payment(s) Awaiting Verification
              </span>
            )}
          </div>

          {/* Multi-Criteria Robust Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search Field */}
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, ID, program, cohort, ref, bank..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={transferStatusFilter}
                  onChange={(e) => setTransferStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">🟡 Pending Verification</option>
                  <option value="PAID">🟢 Verified & Cleared (PAID)</option>
                  <option value="REJECTED">🔴 Rejected</option>
                </select>
              </div>

              {/* Channel / Gateway Filter */}
              <div>
                <select
                  value={transferChannelFilter}
                  onChange={(e) => setTransferChannelFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="BANK_TRANSFER">🏦 Direct Bank Transfer</option>
                  <option value="PAYSTACK">💳 Paystack Gateway</option>
                  <option value="FLUTTERWAVE">⚡ Flutterwave Gateway</option>
                  <option value="GATEWAY">🌐 Any Online Gateway</option>
                </select>
              </div>

              {/* Clearance Standing Filter */}
              <div>
                <select
                  value={transferClearanceFilter}
                  onChange={(e) => setTransferClearanceFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Settlements</option>
                  <option value="FULL">✅ Full Payment (₦0 Bal)</option>
                  <option value="PARTIAL">⏳ Part Payment (Balance Due)</option>
                </select>
              </div>

              {/* Payer Type Filter */}
              <div>
                <select
                  value={transferPayerTypeFilter}
                  onChange={(e) => setTransferPayerTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Payer Roles</option>
                  <option value="APPLICANT">📝 New Applicants</option>
                  <option value="STUDENT">🎓 Enrolled Students</option>
                  <option value="PARENT_SPONSOR">👨‍👩‍👦 Parents & Sponsors</option>
                </select>
              </div>
            </div>

            {/* Filter Summary & Timeframe Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Showing <strong className="text-slate-900 font-bold">{filteredTransfers.length}</strong> of{' '}
                  {bankTransfers.length} transactions
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-bold text-slate-400">Filter Period:</span>
                <div className="inline-flex gap-1">
                  {[
                    { key: 'ALL', label: 'All Time' },
                    { key: 'TODAY', label: 'Today' },
                    { key: '7DAYS', label: 'Last 7 Days' },
                    { key: '30DAYS', label: 'This Month' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setTransferDateFilter(p.key)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                        transferDateFilter === p.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {(transferSearch ||
                transferStatusFilter !== 'ALL' ||
                transferChannelFilter !== 'ALL' ||
                transferClearanceFilter !== 'ALL' ||
                transferPayerTypeFilter !== 'ALL' ||
                transferDateFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setTransferSearch('');
                    setTransferStatusFilter('ALL');
                    setTransferChannelFilter('ALL');
                    setTransferClearanceFilter('ALL');
                    setTransferPayerTypeFilter('ALL');
                    setTransferDateFilter('ALL');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>

          {filteredTransfers.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 text-xs space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">No payment records matching the selected criteria.</p>
              <p className="text-[11px]">Try modifying your search or clearing active filters.</p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredTransfers.map((tx) => {
                const dossier = resolvePaymentDossier(tx);

                return (
                  <Card
                    key={tx.id}
                    className="p-5 hover:border-blue-300 transition-all shadow-2xs space-y-3 bg-white"
                  >
                    {/* Top Status & Channel Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {tx.paymentReference}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tx.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {tx.status === 'PAID'
                            ? 'VERIFIED & PAID'
                            : tx.status === 'PENDING'
                            ? 'AWAITING VERIFICATION'
                            : 'REJECTED'}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          {tx.channel === 'BANK_TRANSFER'
                            ? '🏦 Direct Bank Transfer'
                            : tx.channel === 'PAYSTACK'
                            ? '💳 Paystack'
                            : tx.channel === 'FLUTTERWAVE'
                            ? '⚡ Flutterwave'
                            : tx.channel}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dossier.isFullPayment
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {dossier.isFullPayment
                            ? '✅ Full Tuition Cleared (₦0 Bal)'
                            : `⏳ Part Payment (₦${dossier.balance.toLocaleString()} Due)`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Submitted: {tx.paidAt ? new Date(tx.paidAt).toLocaleString() : '—'}
                      </div>
                    </div>

                    {/* Middle: Rich Payer, Program & Bank Details */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Candidate Identity & Program Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                            {dossier.candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-slate-900 leading-tight">
                                {dossier.candidateName}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${dossier.roleBadgeClass}`}
                              >
                                {dossier.roleLabel}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {dossier.candidateId}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 pt-0.5 flex items-center gap-3 flex-wrap">
                              {dossier.candidateEmail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{dossier.candidateEmail}</span>
                                </span>
                              )}
                              {dossier.candidatePhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{dossier.candidatePhone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Program & Cohort Line */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Enrolled Program Track:
                            </span>
                            <span className="font-bold text-slate-800 line-clamp-1">
                              {dossier.programName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Intake Cohort & Level:
                            </span>
                            <span className="font-bold text-blue-900">
                              {dossier.cohortName}
                              {dossier.cohortCode && ` (${dossier.cohortCode})`}
                              <span className="text-slate-400 font-normal"> · {dossier.level}</span>
                            </span>
                          </div>
                        </div>

                        {/* Bank Transfer Sender Info (if bank transfer) */}
                        <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                          <span>
                            <strong>Bank:</strong> {tx.senderBank || 'Bank Transfer'}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Payer Account / Note:</strong> {tx.senderAccount || tx.payerName || 'Direct Deposit'}
                          </span>
                          <span>•</span>
                          <span>
                            Invoice: <strong>{tx.invoice?.invoiceNumber || tx.invoiceId}</strong>
                          </span>
                          {tx.proofUrl && (
                            <a
                              href={tx.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 ml-auto"
                            >
                              <span>View Bank Teller</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Payment Amount & Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                        <div className="text-left lg:text-right">
                          <span className="font-mono font-black text-slate-900 text-lg sm:text-xl block">
                            ₦{Number(tx.amount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Invoice Total: ₦{dossier.totalInv.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setInspectingPayment(tx)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-300" />
                            <span>View Payer Profile</span>
                          </button>

                          {tx.status === 'PENDING' && isFinanceOrSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveBankTransfer(tx.id)}
                                disabled={processing}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingTransferId(tx.id)}
                                disabled={processing}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs disabled:opacity-50 cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: INVOICES LEDGER */}
      {subTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice number, title, or student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
              >
                <option value="">All Invoice Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="UNPAID">UNPAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="text-xs font-mono text-slate-500 font-semibold">
              Showing {filteredInvoices.length} invoices
            </div>
          </div>

          <div className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-xs">
                No invoices matching search criteria.
              </Card>
            ) : (
              filteredInvoices.map((inv) => (
                <Card key={inv.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {inv.invoiceNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{inv.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Recipient: {inv.student?.user?.firstName ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : inv.application?.fullName || 'Enrolled Student'}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Paid: ₦{(inv.amountPaid || 0).toLocaleString()} • Balance: ₦{(inv.balance || 0).toLocaleString()} • Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 text-base block">
                        ₦{(inv.totalAmount || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Total Net Amount</span>
                    </div>

                    {isFinanceOrSuperAdmin && (
                      <button
                        onClick={() => {
                          setAdjInvoiceId(inv.id);
                          setShowAdjustmentModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Adjust
                      </button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: CLEARANCE EVALUATOR */}
      {subTab === 'clearance' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Authoritative Financial Clearance Evaluator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Query authoritative backend clearance status for any admission offer without client-side assumptions.
            </p>

            <form onSubmit={handleInspectClearance} className="flex gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Enter Admission ID (UUID)..."
                value={inspectClearanceId}
                onChange={(e) => setInspectClearanceId(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                required
              />
              <button
                type="submit"
                disabled={evaluatingClearance}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {evaluatingClearance ? 'Evaluating...' : 'Query Clearance'}
              </button>
            </form>

            {clearanceResult && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Clearance Status:</span>
                  <Badge variant={clearanceResult.isCleared ? 'green' : 'amber'}>
                    {clearanceResult.clearanceStatus || (clearanceResult.isCleared ? 'CLEARED' : 'PENDING')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>Total Invoiced: ₦{(clearanceResult.totalInvoiced || 0).toLocaleString()}</div>
                  <div>Total Paid: ₦{(clearanceResult.totalPaid || 0).toLocaleString()}</div>
                  <div>Net Balance: ₦{(clearanceResult.balance || 0).toLocaleString()}</div>
                  <div>Waiver Amount: ₦{(clearanceResult.waiverAmount || 0).toLocaleString()}</div>
                </div>

                {clearanceResult.reason && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600 text-[11px] italic">
                    Clearance Basis: "{clearanceResult.reason}"
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SUBTAB 4: STUDENT LEDGER & PAYMENT REMINDERS */}
      {subTab === 'ledger' && (
        <div className="space-y-6">
          {/* Header & Metrics Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Authoritative Learner Billing & Payment Ledger</span>
              </h3>
              <p className="text-xs text-slate-500">
                Track full payment records, outstanding receivables, and dispatch tuition reminders.
              </p>
            </div>
            <button
              onClick={loadFinancialOverview}
              disabled={loadingOverview}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {financialOverview?.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Billed</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₦{Number(financialOverview.metrics.totalBilled || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Total Collected</span>
                <span className="text-lg font-black text-emerald-800 font-mono">
                  ₦{Number(financialOverview.metrics.totalCollected || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Outstanding Balance</span>
                <span className="text-lg font-black text-amber-900 font-mono">
                  ₦{Number(financialOverview.metrics.totalOutstanding || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">Payment Breakdown</span>
                <div className="text-xs font-bold text-blue-900 flex items-center gap-2 mt-1">
                  <span className="text-emerald-700">{financialOverview.metrics.fullyPaidCount} Paid</span> •{' '}
                  <span className="text-amber-700">{financialOverview.metrics.partialCount} Part</span> •{' '}
                  <span className="text-rose-700">{financialOverview.metrics.unpaidCount} Due</span>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search learner name, email, phone, or invoice ref..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFinancialOverview()}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'].map((st) => (
                <button
                  key={st}
                  onClick={() => setLedgerStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    ledgerStatusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Records Table */}
          {loadingOverview ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading learner ledger records...</div>
          ) : !financialOverview?.records?.length ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No billing ledger records matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Learner & Contact</th>
                    <th className="p-3.5">Program / Cohort</th>
                    <th className="p-3.5">Invoice Ref</th>
                    <th className="p-3.5">Billed</th>
                    <th className="p-3.5">Paid</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialOverview.records.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{rec.learnerName}</div>
                        <div className="text-[10px] text-slate-400">{rec.learnerEmail}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 line-clamp-1">{rec.programTitle}</div>
                        {rec.selectedPlanType && (
                          <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {rec.selectedPlanType}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-slate-700">
                        {rec.invoiceNumber}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        ₦{Number(rec.totalAmount).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-emerald-700">
                        ₦{Number(rec.amountPaid).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-amber-700">
                        ₦{Number(rec.balance).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={rec.status === 'PAID' ? 'green' : rec.status === 'PARTIALLY_PAID' ? 'amber' : 'red'}>
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLearnerRecord(rec)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                            title="View Complete Billing History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {rec.balance > 0 && (
                            <button
                              type="button"
                              disabled={sendingReminderInvoiceId === rec.id}
                              onClick={() => handleSendReminder(rec.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Send Reminder Email & Portal Alert"
                            >
                              <Send className="w-3 h-3" />
                              <span>{sendingReminderInvoiceId === rec.id ? 'Sending...' : 'Remind'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: PROMO COUPONS & WAIVER CODES */}
      {subTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <span>Promo Discount Coupons & Fee Waiver Codes</span>
              </h3>
              <p className="text-xs text-slate-500">
                Generate and distribute marketing discount codes and tuition reduction coupons.
              </p>
            </div>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New Coupon</span>
            </button>
          </div>

          {loadingCoupons ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Tag className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No coupon or waiver codes generated yet.</p>
              <button
                onClick={() => setShowCreateCouponModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create First Coupon
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((cpn: any) => (
                <div
                  key={cpn.id}
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    cpn.isActive
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-black text-base text-slate-900 tracking-wider">
                        {cpn.code}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cpn.description || 'General promotion'}</p>
                    </div>
                    <Badge variant={cpn.isActive ? 'green' : 'slate'}>
                      {cpn.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                    <span className="text-xs text-purple-900 font-semibold">Discount:</span>
                    <strong className="text-sm font-mono text-purple-700 font-bold">
                      {cpn.discountType === 'PERCENTAGE'
                        ? `${cpn.discountValue}% OFF`
                        : `₦${Number(cpn.discountValue).toLocaleString()} OFF`}
                    </strong>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Redeemed Count:</span>
                      <strong className="text-slate-800">{cpn.usedCount} {cpn.maxUses ? `/ ${cpn.maxUses} uses` : 'times'}</strong>
                    </div>
                    {cpn.expiresAt && (
                      <div className="flex justify-between">
                        <span>Expires On:</span>
                        <span className="text-slate-800 font-medium">
                          {new Date(cpn.expiresAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    )}
                    {cpn.program && (
                      <div className="flex justify-between">
                        <span>Program Scope:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">{cpn.program.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleCoupon(cpn.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        cpn.isActive
                          ? 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {cpn.isActive ? 'Deactivate' : 'Activate Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 6: INSTITUTIONAL SIGNATORIES & SEALS */}
      {subTab === 'signatories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span>Institutional Signatories & Official Document Seals</span>
              </h3>
              <p className="text-xs text-slate-500">
                Super Admin and Academic Admin settings for legal signatures appearing on admission offers and graduation credentials.
              </p>
            </div>
            <button
              onClick={() => setShowSignatoriesModal(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Edit Institutional Signatories</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Official Document Verification Preview</h4>
                <p className="text-xs text-slate-500">
                  These authoritative names and digital stamps appear at the footer of all provisional admissions letters and verified credentials.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {/* Dean Signature */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Academic Dean / Provost</span>
                <div className="font-serif italic text-base text-slate-900 font-bold">
                  Dr. Kehinde Adeleke
                </div>
                <div className="text-[11px] font-bold text-slate-700">Dean of Academic Affairs & Faculty</div>
                <div className="text-[10px] text-slate-400">STEMPACT Academy Directorate</div>
              </div>

              {/* Official Seal */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Institutional Seal</span>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600/70 bg-amber-50 p-1 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-700" />
                </div>
                <div className="text-[10px] font-bold text-amber-900">STEMPACT OS OFFICIAL SEAL</div>
              </div>

              {/* Registrar */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registrar & Records</span>
                <div className="font-serif italic text-base text-slate-900 font-bold">
                  Office of the Registrar
                </div>
                <div className="text-[11px] font-bold text-slate-700">Registrar & Student Records</div>
                <div className="text-[10px] text-slate-400">Accredited Academic Registry</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSignatoriesModal(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Customize Names, Titles & Upload Signatures
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT BANK TRANSFER */}
      {rejectingTransferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-900 text-base">Reject Bank Transfer</h3>
              <button onClick={() => setRejectingTransferId(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectBankTransfer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingTransferId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GRANT FINANCIAL WAIVER */}
      {showWaiverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Grant Financial Clearance Waiver</h3>
                <p className="text-xs text-slate-500">Audited administrative action (Finance/Super Admin only)</p>
              </div>
              <button onClick={() => setShowWaiverModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantWaiver} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Admission Offer ID (UUID) *</label>
                <input
                  type="text"
                  placeholder="Enter admission UUID..."
                  value={waiverAdmissionId}
                  onChange={(e) => setWaiverAdmissionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Waiver Amount (₦) [Optional: Leave blank for full waiver]</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 50000 or blank for 100%"
                  value={waiverAmount}
                  onChange={(e) => setWaiverAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Audited Rationale *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Presidential CSR grant recipient; verified full tuition scholarship."
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWaiverModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Granting...' : 'Grant Clearance Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FINANCIAL ADJUSTMENT */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Apply Financial Adjustment</h3>
                <p className="text-xs text-slate-500">Scholarship, merit discount, or corporate sponsor grant</p>
              </div>
              <button onClick={() => setShowAdjustmentModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Invoice ID *</label>
                <input
                  type="text"
                  placeholder="Enter invoice UUID..."
                  value={adjInvoiceId}
                  onChange={(e) => setAdjInvoiceId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Adjustment Type *</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="SCHOLARSHIP">SCHOLARSHIP</option>
                    <option value="DISCOUNT">MERIT DISCOUNT</option>
                    <option value="SPONSORSHIP">CORPORATE SPONSORSHIP</option>
                    <option value="GRANT">GRANT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Amount (₦) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Sponsor / Partner Name (if applicable)</label>
                <input
                  type="text"
                  placeholder="e.g. MTN Foundation, Shell CSR, OAU Tech Hub"
                  value={adjSponsor}
                  onChange={(e) => setAdjSponsor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason / Governance Reference *</label>
                <textarea
                  rows={3}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Audited reason for this financial ledger modification..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT ARRANGEMENT */}
      {showArrangementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Approve Institutional Payment Arrangement</h3>
                <p className="text-xs text-slate-500">Custom installment schedule or sponsor payment guarantee</p>
              </div>
              <button onClick={() => setShowArrangementModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveArrangement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Admission Offer ID (UUID) *</label>
                <input
                  type="text"
                  placeholder="Enter admission UUID..."
                  value={arrAdmissionId}
                  onChange={(e) => setArrAdmissionId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Plan Structure *</label>
                  <select
                    value={arrPlanType}
                    onChange={(e) => setArrPlanType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="INSTALLMENT_50_50">50% Initial / 50% Milestone</option>
                    <option value="INSTALLMENT_40_30_30">40% / 30% / 30% Tranches</option>
                    <option value="SPONSOR_DEFERRED">Sponsor Deferred Guarantee</option>
                    <option value="CUSTOM">Custom Management Arrangement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Required Initial Deposit (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={arrInitialPayment}
                    onChange={(e) => setArrInitialPayment(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approved Arrangement Notes</label>
                <textarea
                  rows={3}
                  value={arrNotes}
                  onChange={(e) => setArrNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArrangementModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Approving...' : 'Approve Arrangement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      <CreateCouponModal
        isOpen={showCreateCouponModal}
        onClose={() => setShowCreateCouponModal(false)}
        onSaved={async () => {
          setShowCreateCouponModal(false);
          await loadCoupons();
          await onDataRefresh();
        }}
      />

      {/* CUSTOM INVOICE MODAL */}
      <CustomInvoiceModal
        isOpen={showCustomInvoiceModal}
        onClose={() => setShowCustomInvoiceModal(false)}
        onSaved={async () => {
          setShowCustomInvoiceModal(false);
          await loadFinancialOverview();
          await onDataRefresh();
        }}
      />

      {/* INSTITUTIONAL SIGNATORIES MODAL */}
      <SignatoriesModal
        isOpen={showSignatoriesModal}
        onClose={() => setShowSignatoriesModal(false)}
        onSaved={async () => {
          setShowSignatoriesModal(false);
          await onDataRefresh();
        }}
      />

      {/* LEARNER PAYMENT HISTORY MODAL */}
      <LearnerPaymentHistoryModal
        isOpen={!!selectedLearnerRecord}
        record={selectedLearnerRecord}
        onClose={() => setSelectedLearnerRecord(null)}
        onSendReminder={(invoiceId) => handleSendReminder(invoiceId)}
      />

      {/* PAYMENT SETTINGS & TRANSFER ACCOUNTS MODAL */}
      <PaymentSettingsModal
        isOpen={showPaymentSettingsModal}
        onClose={() => setShowPaymentSettingsModal(false)}
        onSaved={async () => {
          await onDataRefresh();
        }}
      />
      {/* PAYER PROFILE & AUDIT DOSSIER MODAL */}
      <PayerProfileAuditModal
        isOpen={!!inspectingPayment}
        onClose={() => setInspectingPayment(null)}
        payment={inspectingPayment}
        onApprove={async (pid) => {
          await handleApproveBankTransfer(pid);
          setInspectingPayment(null);
        }}
        onReject={async (pid, reason) => {
          setProcessing(true);
          setActionError('');
          try {
            await api.rejectBankTransfer(pid, reason);
            setActionSuccess('Bank transfer rejected.');
            setInspectingPayment(null);
            await onDataRefresh();
          } catch (err: any) {
            setActionError(err.message || 'Failed to reject bank transfer');
          } finally {
            setProcessing(false);
          }
        }}
        processing={processing}
        isFinanceOrSuperAdmin={isFinanceOrSuperAdmin}
      />
    </div>
  );
};
