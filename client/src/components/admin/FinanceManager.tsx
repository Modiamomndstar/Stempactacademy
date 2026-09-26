import React, { useState } from 'react';
import { api } from '../../services/api';
import { Card, Badge } from '../UIElements';
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
  const [subTab, setSubTab] = useState<'transfers' | 'invoices' | 'clearance'>('transfers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('transfers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'transfers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Bank Transfer Approvals ({pendingTransfers.length})
          </button>
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Academic Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setSubTab('clearance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'clearance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Clearance & Waivers
          </button>
        </div>

        {isFinanceOrSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWaiverModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grant Waiver</span>
            </button>
            <button
              onClick={() => setShowArrangementModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Approve Arrangement</span>
            </button>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Financial Adjustment</span>
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

      {/* SUBTAB 1: BANK TRANSFERS */}
      {subTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Direct Bank Deposit Verification Queue</h3>
            <p className="text-xs text-slate-500">
              Inspect uploaded bank payment tellers, match against official statement records, and emit verified receipts.
            </p>
          </div>

          {bankTransfers.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 text-xs">
              No bank transfer submissions recorded.
            </Card>
          ) : (
            <div className="space-y-3">
              {bankTransfers.map((tx) => (
                <Card key={tx.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {tx.paymentReference}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong>Payer:</strong> {tx.senderAccount || tx.payerName || 'Student'} • <strong>Bank:</strong> {tx.senderBank || 'Access Bank'}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Invoice ID: {tx.invoice?.invoiceNumber || tx.invoiceId} • Submitted: {new Date(tx.paidAt).toLocaleString()}
                    </div>

                    {tx.proofUrl && (
                      <div className="pt-1">
                        <a
                          href={tx.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>View Uploaded Bank Teller / Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 text-base block">
                        ₦{(tx.amount || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">Direct Deposit</span>
                    </div>

                    {tx.status === 'PENDING' && isFinanceOrSuperAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveBankTransfer(tx.id)}
                          disabled={processing}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingTransferId(tx.id)}
                          disabled={processing}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
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
    </div>
  );
};
