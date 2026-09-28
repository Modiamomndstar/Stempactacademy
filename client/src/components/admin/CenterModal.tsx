import React, { useState, useEffect } from 'react';
import { X, MapPin, Globe, Building2, Sparkles, Users } from 'lucide-react';
import { api } from '../../services/api';

interface CenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCenter?: any | null;
  onSaved: () => void;
}

const CENTER_TYPES = [
  { value: 'MAIN_CAMPUS', label: 'Main Campus / Innovation Hub', emoji: '🏛️' },
  { value: 'SATELLITE_CENTER', label: 'Satellite Center (Intra-City)', emoji: '📡' },
  { value: 'GOVERNMENT_SPONSORED', label: 'Government Sponsored Hub', emoji: '🏛️' },
  { value: 'CORPORATE_PARTNER', label: 'Corporate / NGO Partner Hub', emoji: '🤝' },
  { value: 'VIRTUAL_GLOBAL', label: 'Virtual Global Campus', emoji: '🌐' },
];

export const CenterModal: React.FC<CenterModalProps> = ({
  isOpen,
  onClose,
  editingCenter,
  onSaved,
}) => {
  const [form, setForm] = useState({
    code: '',
    name: '',
    centerType: 'MAIN_CAMPUS',
    country: 'Nigeria',
    stateOrRegion: 'Osun State',
    cityOrTown: 'Ile-Ife',
    neighborhood: '',
    address: '',
    landmark: '',
    sponsorPartnerName: '',
    timezone: 'Africa/Lagos',
    capacity: 30,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCenter) {
      setForm({
        code: editingCenter.code || '',
        name: editingCenter.name || '',
        centerType: editingCenter.centerType || 'MAIN_CAMPUS',
        country: editingCenter.country || 'Nigeria',
        stateOrRegion: editingCenter.stateOrRegion || 'Osun State',
        cityOrTown: editingCenter.cityOrTown || 'Ile-Ife',
        neighborhood: editingCenter.neighborhood || '',
        address: editingCenter.address || '',
        landmark: editingCenter.landmark || '',
        sponsorPartnerName: editingCenter.sponsorPartnerName || '',
        timezone: editingCenter.timezone || 'Africa/Lagos',
        capacity: editingCenter.capacity || 30,
        isActive: editingCenter.isActive ?? true,
      });
    } else {
      setForm({
        code: '',
        name: '',
        centerType: 'MAIN_CAMPUS',
        country: 'Nigeria',
        stateOrRegion: 'Osun State',
        cityOrTown: 'Ile-Ife',
        neighborhood: '',
        address: '',
        landmark: '',
        sponsorPartnerName: '',
        timezone: 'Africa/Lagos',
        capacity: 30,
        isActive: true,
      });
    }
    setError('');
  }, [editingCenter, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.address.trim()) {
      setError('Center name, code, and address are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingCenter) {
        await api.updateCenter(editingCenter.id, form);
      } else {
        await api.createCenter(form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save learning center.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = CENTER_TYPES.find((t) => t.value === form.centerType);
  const isVirtual = form.centerType === 'VIRTUAL_GLOBAL';
  const isSponsored = ['GOVERNMENT_SPONSORED', 'CORPORATE_PARTNER'].includes(form.centerType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div
          className={`p-6 rounded-t-3xl text-white relative overflow-hidden ${
            isVirtual
              ? 'bg-gradient-to-br from-blue-800 to-indigo-900'
              : isSponsored
              ? 'bg-gradient-to-br from-emerald-700 to-teal-900'
              : 'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                  {selectedType?.emoji || '🏢'}
                </div>
                <div>
                  <h2 className="text-lg font-black">
                    {editingCenter ? 'Edit Learning Center' : 'Create Learning Center'}
                  </h2>
                  <p className="text-xs opacity-75">
                    {editingCenter
                      ? `Editing: ${editingCenter.name}`
                      : 'Add a new STEMPACT campus, neighborhood satellite center, or partner hub'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Type & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Center Type *</label>
              <select
                name="centerType"
                value={form.centerType}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-300"
              >
                {CENTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Center Code * <span className="font-normal text-slate-400">(e.g. IFE-MAIN, IFE-MAYFAIR)</span>
              </label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                placeholder="IFE-MAIN"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Center Full Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. STEMPACT Innovation Hub – Fajuyi Central, Ile-Ife"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Location Grid */}
          {!isVirtual && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Country</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">State / Region</label>
                <input
                  name="stateOrRegion"
                  value={form.stateOrRegion}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">City / Town *</label>
                <input
                  name="cityOrTown"
                  value={form.cityOrTown}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ile-Ife"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          )}

          {!isVirtual && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Neighborhood / Wing</label>
                <input
                  name="neighborhood"
                  value={form.neighborhood}
                  onChange={handleChange}
                  placeholder="e.g. Fajuyi Central, Mayfair Wing, OAU Environs"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Landmark</label>
                <input
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  placeholder="e.g. Opposite Fajuyi Roundabout, Next to Tech Park"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          )}

          {!isVirtual && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Address *</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                required={!isVirtual}
                placeholder="Plot/Building number, Street, Area"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}

          {isVirtual && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Virtual Platform Note *</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                placeholder="e.g. 100% Online — STEMPACT LMS + Zoom Live Classrooms"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}

          {isSponsored && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Sponsor / Partner Organization
              </label>
              <input
                name="sponsorPartnerName"
                value={form.sponsorPartnerName}
                onChange={handleChange}
                placeholder="e.g. Osun State Ministry of Innovation, NITDA, UNDP, Bank CSR"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Capacity (Learner Seats)</label>
              <input
                name="capacity"
                type="number"
                min={1}
                max={1000}
                value={form.capacity}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Timezone</label>
              <select
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-300"
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
                <option value="Africa/Accra">Africa/Accra (GMT, UTC+0)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              name="isActive"
              id="centerIsActive"
              checked={form.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <label htmlFor="centerIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Center is Active and Accepting Cohort Intakes
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editingCenter ? 'Save Changes' : 'Create Center'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
