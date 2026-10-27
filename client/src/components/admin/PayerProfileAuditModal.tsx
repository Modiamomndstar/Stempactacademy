import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  School,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Download,
  Clock,
  Sparkles,
  FileText,
  BadgeAlert,
} from 'lucide-react';

interface PayerProfileAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any | null;
  onApprove: (paymentId: string) => Promise<void>;
  onReject: (paymentId: string, reason: string) => Promise<void>;
  processing: boolean;
  isFinanceOrSuperAdmin: boolean;
}

export const PayerProfileAuditModal: React.FC<PayerProfileAuditModalProps> = ({
  isOpen,
  onClose,
  payment,
  onApprove,
  onReject,
  processing,
  isFinanceOrSuperAdmin,
}) => {
  const [rejectReason, setRejectReason] = useState(
    'Payment could not be matched against official bank statements'
  );
  const [showRejectBox, setShowRejectBox] = useState(false);

  if (!isOpen || !payment) return null;

  const inv = payment.invoice || {};
  const student = inv.student;
  const application = inv.application;
  const admission = inv.admission;
  const cohort = inv.cohort || admission?.cohort || application?.cohort;
  const program =
    cohort?.program ||
    admission?.cohort?.program ||
    application?.program ||
    student?.enrollments?.[0]?.cohort?.program;

  // Resolve Candidate identity
  const candidateName =
    student?.user
      ? `${student.user.firstName} ${student.user.lastName}`
      : application?.fullName ||
        payment.payerName ||
        inv.payerName ||
        payment.senderAccount ||
        'Candidate';

  const candidateEmail =
    student?.user?.email || application?.email || inv.payerEmail || '—';
  const candidatePhone =
    student?.user?.phone || application?.phone || '—';

  const candidateId =
    student?.registrationNumber ||
    admission?.admissionNumber ||
    application?.applicationNumber ||
    inv.invoiceNumber;

  const isEnrolledStudent = Boolean(student || admission?.status === 'ENROLLED');
  const isApplicant = Boolean(application && !isEnrolledStudent);
  const isParentOrSponsor =
    payment.payerType === 'PARENT' ||
    payment.payerType === 'SPONSOR' ||
    inv.payerType === 'PARENT' ||
    inv.payerType === 'SPONSOR';

  const totalInv = Number(inv.totalAmount || payment.amount || 0);
  const paidInv = Number(
    inv.amountPaid !== undefined
      ? inv.amountPaid
      : payment.status === 'PAID'
      ? payment.amount
      : 0
  );
  const balance = Number(
    inv.balance !== undefined ? inv.balance : Math.max(0, totalInv - paidInv)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-black text-lg">
              {candidateName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-300">
                  {candidateId}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isEnrolledStudent
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : isApplicant
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                  }`}
                >
                  {isEnrolledStudent
                    ? '🎓 Enrolled Student'
                    : isApplicant
                    ? '📝 Application Candidate'
                    : '👨‍👩‍👦 Parent / Sponsor'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                {candidateName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Payer Contacts & Fast Lookup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Email Address
              </span>
              <a
                href={`mailto:${candidateEmail}`}
                className="font-semibold text-slate-900 hover:text-blue-600 break-all flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{candidateEmail}</span>
              </a>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Telephone Contact
              </span>
              <a
                href={`tel:${candidatePhone}`}
                className="font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{candidatePhone}</span>
              </a>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Directory 360 Record
              </span>
              {student?.id || application?.userId ? (
                <a
                  href={`/portal/admin?tab=directory&userId=${student?.userId || application?.userId || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full 360 Dossier</span>
                </a>
              ) : (
                <span className="text-slate-400">Linked to Application</span>
              )}
            </div>
          </div>

          {/* Academic Placement & Cohort Matrix */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-500">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Academic Enrolment Allocation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Program Track</span>
                <div className="font-black text-slate-900 text-xs line-clamp-2">
                  {program?.name || 'Academic Specialization'}
                </div>
                {program?.school && (
                  <span className="text-[10px] text-slate-500 block">
                    {program.school.name}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Intake Cohort</span>
                <div className="font-black text-blue-900 text-xs">
                  {cohort?.name || application?.cohortName || 'Assigned Cohort'}
                </div>
                {cohort?.cohortCode && (
                  <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                    {cohort.cohortCode}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Academic Level</span>
                <div className="font-bold text-indigo-700 text-xs">
                  {cohort?.level ||
                    application?.intendedLevel?.replace(/_/g, ' ') ||
                    'Level 1 (Foundation)'}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {cohort?.mode || 'Hybrid / Virtual LMS'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Transaction & Verification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Details Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-500">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Transaction Metadata</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Payment Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {payment.paymentReference}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Channel / Gateway:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {payment.channel === 'BANK_TRANSFER'
                      ? '🏦 Direct Bank Transfer'
                      : payment.channel === 'PAYSTACK'
                      ? '💳 Paystack Gateway'
                      : payment.channel === 'FLUTTERWAVE'
                      ? '⚡ Flutterwave Gateway'
                      : payment.channel}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Amount Paid:</span>
                  <strong className="font-mono text-sm text-emerald-700">
                    ₦{Number(payment.amount || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Submitted Timestamp:</span>
                  <span className="text-slate-700">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sender Bank:</span>
                  <span className="font-semibold text-slate-800">
                    {payment.senderBank || '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sender Account / Note:</span>
                  <span className="font-mono text-slate-800">
                    {payment.senderAccount || '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 pt-2">
                  <span className="text-slate-500">Verification Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      payment.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : payment.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {payment.status === 'PAID'
                      ? 'VERIFIED & CLEARED'
                      : payment.status === 'PENDING'
                      ? 'AWAITING AUDIT'
                      : 'REJECTED'}
                  </span>
                </div>

                {payment.verifiedBy && (
                  <div className="text-[10px] text-slate-400 pt-1">
                    Verified by: <strong>{payment.verifiedBy}</strong> on{' '}
                    {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : '—'}
                  </div>
                )}

                {payment.rejectionReason && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                    <strong>Rejection Reason:</strong> {payment.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Ledger & Invoice Breakdown Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-500">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Invoice Standing & Clearance</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {inv.invoiceNumber || 'INV-2026'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Program Investment:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₦{totalInv.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Cumulative Paid:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₦{paidInv.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
                  <span>Remaining Ledger Balance:</span>
                  <span
                    className={`font-mono text-sm ${
                      balance <= 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    ₦{balance.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-0.5">
                  <span className="font-bold block">Clearance Status:</span>
                  <p>
                    {balance <= 0
                      ? '✅ Full tuition satisfied. Candidate is completely cleared for official cohort matriculation.'
                      : `⏳ Installment in progress. Candidate has ₦${balance.toLocaleString()} outstanding balance.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Bank Teller / Proof of Payment */}
          {payment.proofUrl && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-slate-500">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Uploaded Proof of Payment / Bank Teller</span>
                </h3>
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Document</span>
                </a>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-72 flex items-center justify-center p-2">
                <img
                  src={payment.proofUrl}
                  alt="Bank transfer payment proof"
                  className="max-h-64 object-contain rounded-lg shadow-xs"
                  onError={(e) => {
                    // Fallback to text link if not an image
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Rejection Form Box */}
          {showRejectBox && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <label className="font-bold text-rose-900 text-xs block">
                Reason for Rejecting Payment Submission:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="State clearly why this bank transfer cannot be validated..."
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onReject(payment.id, rejectReason)}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Close Dossier
          </button>

          {isFinanceOrSuperAdmin && payment.status === 'PENDING' && !showRejectBox && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowRejectBox(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Reject Transfer
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => onApprove(payment.id)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{processing ? 'Verifying...' : 'Approve & Emit Official Receipt'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
