import React, { useState } from 'react';
import { X, Receipt, DollarSign, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface CustomInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CustomInvoiceModal: React.FC<CustomInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    recipientType: 'STUDENT',
    studentId: '',
    applicationId: '',
    title: '',
    amount: 15000,
    dueDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Invoice title or description is required.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Valid amount greater than zero is required.');
      return;
    }
    if (form.recipientType === 'STUDENT' && !form.studentId.trim()) {
      setError('Student ID / UUID is required.');
      return;
    }
    if (form.recipientType === 'APPLICATION' && !form.applicationId.trim()) {
      setError('Application ID / UUID is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.createCustomInvoice({
        title: form.title.trim(),
        amount: Number(form.amount),
        studentId: form.recipientType === 'STUDENT' ? form.studentId.trim() : undefined,
        applicationId: form.recipientType === 'APPLICATION' ? form.applicationId.trim() : undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        notes: form.notes.trim() || undefined,
        items: [{ name: form.title.trim(), amount: Number(form.amount) }],
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue custom payment invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Issue Ad-Hoc / Custom Payment</h3>
              <p className="text-[11px] text-slate-400">Bill student for lab kits, materials, excursion, or special fees</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Recipient Target *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, recipientType: 'STUDENT' }))}
                className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                  form.recipientType === 'STUDENT'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Enrolled Student
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, recipientType: 'APPLICATION' }))}
                className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                  form.recipientType === 'APPLICATION'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Applicant / Candidate
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              {form.recipientType === 'STUDENT' ? 'Student ID or UUID *' : 'Application UUID *'}
            </label>
            <input
              type="text"
              name={form.recipientType === 'STUDENT' ? 'studentId' : 'applicationId'}
              placeholder={form.recipientType === 'STUDENT' ? 'Enter Student ID (e.g. STP-2026-0042) or UUID' : 'Enter Application UUID'}
              value={form.recipientType === 'STUDENT' ? form.studentId : form.applicationId}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 bg-white focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Invoice Title / Fee Category *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Robotics Starter Lab Hardware Kit, Capstone Certification Assessment, Field Trip"
              value={form.title}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Fee Amount (₦) *</label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-500 font-bold">₦</span>
                <input
                  type="number"
                  name="amount"
                  min="500"
                  step="500"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Payment Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Internal Remarks / Instruction Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Mandatory hardware kit for Level 2 physical laboratories."
              value={form.notes}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 text-[11px] leading-relaxed">
            Upon creation, this invoice will automatically appear in the learner's student portal under Tuition & Invoices for immediate payment via Paystack, Flutterwave, or bank transfer.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>{saving ? 'Issuing Invoice...' : 'Issue Invoice to Learner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
