import React from 'react';
import { X, CreditCard, User, Mail, Phone, Calendar, CheckCircle2, AlertCircle, FileText, Send } from 'lucide-react';
import { Badge } from '../UIElements';

interface LearnerPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  onSendReminder: (invoiceId: string) => void;
}

export const LearnerPaymentHistoryModal: React.FC<LearnerPaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  record,
  onSendReminder,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Learner Payment & Ledger History</h3>
              <p className="text-[11px] text-slate-400">Comprehensive billing records and transaction timeline</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Learner Profile Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Learner Name:</span>
            <strong className="text-slate-900 text-sm">{record.learnerName}</strong>
            <div className="text-slate-600 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{record.learnerEmail}</span>
            </div>
            <div className="text-slate-600 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{record.learnerPhone || '—'}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Program Track & Cohort:</span>
            <strong className="text-slate-900">{record.programTitle}</strong>
            <div className="text-slate-500 mt-1">
              Invoice Ref: <span className="font-mono font-bold text-slate-800">{record.invoiceNumber}</span>
            </div>
            <div className="mt-1">
              <Badge variant={record.status === 'PAID' ? 'green' : record.status === 'PARTIALLY_PAID' ? 'amber' : 'red'}>
                {record.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ledger Balance Card */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Billed</span>
            <div className="text-lg font-black text-slate-900 font-mono">
              ₦{Number(record.totalAmount || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[10px] text-emerald-700 uppercase font-bold block">Total Cleared</span>
            <div className="text-lg font-black text-emerald-800 font-mono">
              ₦{Number(record.amountPaid || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <span className="text-[10px] text-amber-700 uppercase font-bold block">Outstanding Balance</span>
            <div className="text-lg font-black text-amber-900 font-mono">
              ₦{Number(record.balance || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Payment Plan & Milestones */}
        {record.selectedPlanType && (
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950">Active Payment Plan:</span>
              <span className="font-bold font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                {record.selectedPlanType}
              </span>
            </div>
            {record.couponCode && (
              <div className="text-[11px] text-emerald-700 font-semibold">
                Applied Coupon: <strong>{record.couponCode}</strong> (-₦{Number(record.discountAmount || 0).toLocaleString()})
              </div>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {record.balance > 0 ? (
            <button
              type="button"
              onClick={() => onSendReminder(record.id)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Tuition Payment Reminder</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Account is fully cleared
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
