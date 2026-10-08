import React, { useState } from 'react';
import { X, Tag, Percent, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  programs?: any[];
  cohorts?: any[];
}

export const CreateCouponModal: React.FC<CreateCouponModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  programs = [],
  cohorts = [],
}) => {
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscount: '',
    minInvoiceTotal: '',
    maxUses: 100,
    expiresAt: '',
    programId: '',
    cohortId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().trim() : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError('Coupon code is required.');
      return;
    }
    if (Number(form.discountValue) <= 0) {
      setError('Discount value must be greater than zero.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.createCoupon({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        minInvoiceTotal: form.minInvoiceTotal ? Number(form.minInvoiceTotal) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        programId: form.programId || undefined,
        cohortId: form.cohortId || undefined,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generate Tuition Coupon / Waiver</h3>
              <p className="text-[11px] text-slate-400">Issue marketing promo discount or fee reduction code</p>
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
            <label className="font-bold text-slate-700">Coupon / Waiver Code *</label>
            <input
              type="text"
              name="code"
              placeholder="e.g. EARLYBIRD2026, STEMWOMEN50, OSUNSCHOLAR"
              value={form.code}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase tracking-wider text-slate-900 bg-white focus:ring-2 focus:ring-purple-300"
              required
            />
            <p className="text-[10px] text-slate-400">Students and applicants will enter this code at checkout.</p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Internal Description / Campaign</label>
            <input
              type="text"
              name="description"
              placeholder="e.g. 20% discount for early bird registrants"
              value={form.description}
              onChange={handleChange}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Discount Structure *</label>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="PERCENTAGE">Percentage (%) Off</option>
                <option value="FIXED_AMOUNT">Fixed ₦ Amount Off</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">
                {form.discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Amount to Deduct (₦) *'}
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-500 font-bold">
                  {form.discountType === 'PERCENTAGE' ? '%' : '₦'}
                </span>
                <input
                  type="number"
                  name="discountValue"
                  min="1"
                  max={form.discountType === 'PERCENTAGE' ? 100 : 500000}
                  value={form.discountValue}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Usage Limit (Max Uses)</label>
              <input
                type="number"
                name="maxUses"
                min="1"
                placeholder="e.g. 50"
                value={form.maxUses}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
              />
              <p className="text-[10px] text-slate-400">Leave blank for unlimited.</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Expiry Date</label>
              <input
                type="date"
                name="expiresAt"
                value={form.expiresAt}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
              <p className="text-[10px] text-slate-400">Leave blank for no expiration.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Max Discount Cap (₦)</label>
              <input
                type="number"
                name="maxDiscount"
                min="0"
                placeholder="e.g. 50000"
                value={form.maxDiscount}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Min. Invoice Amount (₦)</label>
              <input
                type="number"
                name="minInvoiceTotal"
                min="0"
                placeholder="e.g. 30000"
                value={form.minInvoiceTotal}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          {programs.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Program Scope (Optional)</label>
              <select
                name="programId"
                value={form.programId}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">— Applicable to All Programs —</option>
                {programs.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'Creating Coupon...' : 'Activate Coupon Code'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
