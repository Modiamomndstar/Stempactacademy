import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Globe,
  Coins,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../UIElements';

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [envStatus, setEnvStatus] = useState<any>({
    paystackConfigured: false,
    flutterwaveConfigured: false,
    stripeConfigured: false,
  });

  const [form, setForm] = useState({
    paystackEnabled: true,
    flutterwaveEnabled: false,
    stripeEnabled: false,
    bankTransferEnabled: true,
    cryptoTransferEnabled: false,
    bankName: 'Access Bank Plc',
    bankAccountNumber: '1234567890',
    bankAccountName: 'STEMPACT Academy Ltd',
    bankSortCode: '',
    bankTransferInstructions: 'Include your Application Reference Number or Full Name in the transfer narration.',
    cryptoCurrency: 'USDT (TRC-20)',
    cryptoNetwork: 'TRON (TRC20)',
    cryptoWalletAddress: '',
    cryptoInstructions: 'Please send exact USDT equivalent to this wallet. After payment, paste the Transaction Hash (TxID) and upload screenshot proof.',
    customPaymentMethods: [] as any[],
  });

  // Additional Bank / Custom Method draft
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodAccount, setNewMethodAccount] = useState('');
  const [newMethodDetails, setNewMethodDetails] = useState('');
  const [newMethodType, setNewMethodType] = useState<'BANK' | 'CRYPTO' | 'OTHER'>('BANK');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminPaymentSettings();
      if (res?.settings) {
        let customMethods = [];
        try {
          if (res.settings.customPaymentMethodsJson) {
            customMethods = JSON.parse(res.settings.customPaymentMethodsJson);
          }
        } catch {
          customMethods = [];
        }

        setForm({
          paystackEnabled: res.settings.paystackEnabled ?? true,
          flutterwaveEnabled: res.settings.flutterwaveEnabled ?? false,
          stripeEnabled: res.settings.stripeEnabled ?? false,
          bankTransferEnabled: res.settings.bankTransferEnabled ?? true,
          cryptoTransferEnabled: res.settings.cryptoTransferEnabled ?? false,
          bankName: res.settings.bankName || 'Access Bank Plc',
          bankAccountNumber: res.settings.bankAccountNumber || '1234567890',
          bankAccountName: res.settings.bankAccountName || 'STEMPACT Academy Ltd',
          bankSortCode: res.settings.bankSortCode || '',
          bankTransferInstructions:
            res.settings.bankTransferInstructions ||
            'Include your Application Reference Number or Full Name in the transfer narration.',
          cryptoCurrency: res.settings.cryptoCurrency || 'USDT (TRC-20)',
          cryptoNetwork: res.settings.cryptoNetwork || 'TRON (TRC20)',
          cryptoWalletAddress: res.settings.cryptoWalletAddress || '',
          cryptoInstructions:
            res.settings.cryptoInstructions ||
            'Please send exact USDT equivalent to this wallet. After payment, paste the Transaction Hash (TxID) and upload screenshot proof.',
          customPaymentMethods: Array.isArray(customMethods) ? customMethods : [],
        });
      }
      if (res?.envStatus) {
        setEnvStatus(res.envStatus);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMethod = () => {
    if (!newMethodName.trim() || !newMethodAccount.trim()) return;
    const newEntry = {
      id: `mth-${Date.now()}`,
      type: newMethodType,
      name: newMethodName.trim(),
      accountNo: newMethodAccount.trim(),
      details: newMethodDetails.trim(),
      isActive: true,
    };
    setForm((prev) => ({
      ...prev,
      customPaymentMethods: [...prev.customPaymentMethods, newEntry],
    }));
    setNewMethodName('');
    setNewMethodAccount('');
    setNewMethodDetails('');
  };

  const handleRemoveCustomMethod = (id: string) => {
    setForm((prev) => ({
      ...prev,
      customPaymentMethods: prev.customPaymentMethods.filter((m) => m.id !== id),
    }));
  };

  const handleToggleCustomMethod = (id: string) => {
    setForm((prev) => ({
      ...prev,
      customPaymentMethods: prev.customPaymentMethods.map((m) =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updatePaymentSettings({
        ...form,
        customPaymentMethodsJson: JSON.stringify(form.customPaymentMethods),
      });
      setSuccess('Payment settings and account details updated successfully!');
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Payment Gateways & Transfer Accounts
              </h3>
              <p className="text-xs text-slate-500">
                Configure online gateways, bank accounts, and alternative transfer channels for student checkout
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading payment configurations...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* 1. ONLINE PAYMENT GATEWAYS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Online Payment Gateways</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Gateways only appear if configured in backend environment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Paystack Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  form.paystackEnabled && envStatus.paystackConfigured
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-sm text-slate-900 block">Paystack</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Cards, Bank Accounts, Apple Pay, USSD</p>
                    </div>
                    {envStatus.paystackConfigured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Configured in Render
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Key Missing in Env
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.paystackEnabled}
                        onChange={(e) => setForm({ ...form, paystackEnabled: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                      />
                      <span>Active for checkout</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {form.paystackEnabled && envStatus.paystackConfigured ? '🟢 Visible to users' : '⚪ Hidden from users'}
                    </span>
                  </div>
                </div>

                {/* Flutterwave Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  form.flutterwaveEnabled && envStatus.flutterwaveConfigured
                    ? 'bg-orange-50/50 border-orange-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-sm text-slate-900 block">Flutterwave</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pan-African cards, Mobile Money, M-Pesa</p>
                    </div>
                    {envStatus.flutterwaveConfigured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Configured in Render
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                        Not Configured in Render
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.flutterwaveEnabled}
                        onChange={(e) => setForm({ ...form, flutterwaveEnabled: e.target.checked })}
                        className="w-4 h-4 rounded text-orange-600 accent-orange-600"
                      />
                      <span>Active for checkout</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {form.flutterwaveEnabled && envStatus.flutterwaveConfigured ? '🟢 Visible to users' : '⚪ Hidden from users'}
                    </span>
                  </div>

                  {!envStatus.flutterwaveConfigured && (
                    <p className="text-[10px] text-amber-700 mt-2 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                      <strong>Auto-Hidden:</strong> Set <code className="font-mono">FLUTTERWAVE_SECRET_KEY</code> in Render Environment Variables to enable live processing.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. OFFICIAL BANK TRANSFER ACCOUNTS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Primary Official Bank Account</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.bankTransferEnabled}
                    onChange={(e) => setForm({ ...form, bankTransferEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600"
                  />
                  <span>Enable Bank Transfer</span>
                </label>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Access Bank Plc"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234567890"
                      value={form.bankAccountNumber}
                      onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STEMPACT Academy Ltd"
                      value={form.bankAccountName}
                      onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sort Code / Swift (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 044150149"
                      value={form.bankSortCode}
                      onChange={(e) => setForm({ ...form, bankSortCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Narration Guide for Learners</label>
                    <input
                      type="text"
                      placeholder="e.g. Include Application Number or Full Name"
                      value={form.bankTransferInstructions}
                      onChange={(e) => setForm({ ...form, bankTransferInstructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ADDITIONAL BANK & PAYMENT ACCOUNTS (e.g. USD Domiciliary, Zenith, Kuda) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Additional Accounts (e.g. USD Dom, GTBank, Microfinance)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {form.customPaymentMethods.length} extra accounts
                </span>
              </div>

              {form.customPaymentMethods.length > 0 && (
                <div className="space-y-2">
                  {form.customPaymentMethods.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-slate-100 font-bold text-[10px] text-slate-600">
                          {m.type}
                        </span>
                        <div>
                          <strong className="text-slate-900">{m.name}</strong>: <span className="font-mono text-slate-700">{m.accountNo}</span>
                          {m.details && <span className="text-slate-400 text-[10px] block">{m.details}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCustomMethod(m.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {m.isActive ? 'ACTIVE' : 'DISABLED'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomMethod(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add extra account inline row */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-2.5">
                <select
                  value={newMethodType}
                  onChange={(e: any) => setNewMethodType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="BANK">Bank Account</option>
                  <option value="CRYPTO">Crypto Wallet</option>
                  <option value="OTHER">Other / Regional</option>
                </select>

                <input
                  type="text"
                  placeholder="e.g. GTBank USD Domiciliary"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="w-full sm:w-1/3 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />

                <input
                  type="text"
                  placeholder="Account No / IBAN"
                  value={newMethodAccount}
                  onChange={(e) => setNewMethodAccount(e.target.value)}
                  className="w-full sm:w-1/3 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                />

                <button
                  type="button"
                  onClick={handleAddCustomMethod}
                  disabled={!newMethodName.trim() || !newMethodAccount.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Add Account
                </button>
              </div>
            </div>

            {/* 4. CRYPTOCURRENCY PAYMENTS (INTERNATIONAL STUDENTS) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Cryptocurrency Transfer (for International Students)</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.cryptoTransferEnabled}
                    onChange={(e) => setForm({ ...form, cryptoTransferEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <span>Enable Crypto Option</span>
                </label>
              </div>

              {form.cryptoTransferEnabled && (
                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Currency / Token *</label>
                      <input
                        type="text"
                        placeholder="e.g. USDT (TRC-20)"
                        value={form.cryptoCurrency}
                        onChange={(e) => setForm({ ...form, cryptoCurrency: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Blockchain Network *</label>
                      <input
                        type="text"
                        placeholder="e.g. TRON (TRC20) or Binance Smart Chain"
                        value={form.cryptoNetwork}
                        onChange={(e) => setForm({ ...form, cryptoNetwork: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Wallet Deposit Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. Txyz987456... or 0x..."
                      value={form.cryptoWalletAddress}
                      onChange={(e) => setForm({ ...form, cryptoWalletAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Instructions for Learner</label>
                    <textarea
                      rows={2}
                      value={form.cryptoInstructions}
                      onChange={(e) => setForm({ ...form, cryptoInstructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Changes apply instantly across all student checkout portals.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Payment Settings'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
