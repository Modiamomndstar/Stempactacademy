import React, { useState, useEffect } from 'react';
import { X, Award, UploadCloud, CheckCircle2, ShieldCheck, Sparkles, Image } from 'lucide-react';
import { api } from '../../services/api';

interface SignatoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SignatoriesModal: React.FC<SignatoriesModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    institutionName: 'STEMPACT Academy',
    tagline: 'Premier STEM, Vocational & Emerging Technology Academy',
    deanName: 'Dr. Kehinde Adeleke',
    deanTitle: 'Dean of Academic Affairs & Faculty',
    deanSignatureUrl: '',
    registrarName: 'Office of the Registrar',
    registrarTitle: 'Registrar & Student Records',
    registrarSignatureUrl: '',
    officialSealUrl: '',
    directorateLabel: 'STEMPACT Academy Directorate',
    registryLabel: 'Accredited Academic Registry',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getInstitutionalSettings();
        if (res) {
          setForm({
            institutionName: res.institutionName || 'STEMPACT Academy',
            tagline: res.tagline || 'Premier STEM, Vocational & Emerging Technology Academy',
            deanName: res.deanName || 'Dr. Kehinde Adeleke',
            deanTitle: res.deanTitle || 'Dean of Academic Affairs & Faculty',
            deanSignatureUrl: res.deanSignatureUrl || '',
            registrarName: res.registrarName || 'Office of the Registrar',
            registrarTitle: res.registrarTitle || 'Registrar & Student Records',
            registrarSignatureUrl: res.registrarSignatureUrl || '',
            officialSealUrl: res.officialSealUrl || '',
            directorateLabel: res.directorateLabel || 'STEMPACT Academy Directorate',
            registryLabel: res.registryLabel || 'Accredited Academic Registry',
          });
        }
      } catch (err: any) {
        console.warn('Could not load institutional settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'deanSignatureUrl' | 'registrarSignatureUrl' | 'officialSealUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const res = await api.uploadFile(file, 'signatures');
      setForm((prev) => ({ ...prev, [fieldName]: res.url }));
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Error uploading image'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateInstitutionalSettings(form);
      setSuccess('Institutional signatories and academic seal updated successfully!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save institutional settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Signatures & Document Seals</h3>
              <p className="text-[11px] text-slate-400">Configure signatories for official admission offers and issued certificates</p>
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

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Institution Brand Row */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                Institutional Header Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Institution Name</label>
                  <input
                    type="text"
                    name="institutionName"
                    value={form.institutionName}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tagline / Mission</label>
                  <input
                    type="text"
                    name="tagline"
                    value={form.tagline}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Dean Signatory */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dean / Academic Provost Signatory</span>
                </span>
                {form.deanSignatureUrl && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Signature Uploaded
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dean Full Name *</label>
                  <input
                    type="text"
                    name="deanName"
                    value={form.deanName}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dean Official Title</label>
                  <input
                    type="text"
                    name="deanTitle"
                    value={form.deanTitle}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Dean Signature Image / Stamp</span>
                  {uploadingField === 'deanSignatureUrl' && (
                    <span className="text-[10px] text-blue-600 animate-pulse">Uploading to R2...</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {form.deanSignatureUrl ? (
                    <div className="h-12 w-28 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center shrink-0">
                      <img src={form.deanSignatureUrl} alt="Dean Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'deanSignatureUrl')}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Registrar Signatory */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Registrar & Academic Records Signatory</span>
                </span>
                {form.registrarSignatureUrl && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Signature Uploaded
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Registrar Name *</label>
                  <input
                    type="text"
                    name="registrarName"
                    value={form.registrarName}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Registrar Title</label>
                  <input
                    type="text"
                    name="registrarTitle"
                    value={form.registrarTitle}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Registrar Signature Image / Stamp</span>
                  {uploadingField === 'registrarSignatureUrl' && (
                    <span className="text-[10px] text-blue-600 animate-pulse">Uploading to R2...</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {form.registrarSignatureUrl ? (
                    <div className="h-12 w-28 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center shrink-0">
                      <img src={form.registrarSignatureUrl} alt="Registrar Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'registrarSignatureUrl')}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Official Seal */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">
                Official Institutional Embossed Seal
              </span>
              <div className="flex items-center gap-4">
                {form.officialSealUrl ? (
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-white p-1 flex items-center justify-center shrink-0">
                    <img src={form.officialSealUrl} alt="Seal" className="w-full h-full object-contain rounded-full" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400 bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Upload Official Seal Image (PNG / SVG with transparency)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'officialSealUrl')}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-semibold cursor-pointer"
                  />
                </div>
              </div>
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
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{saving ? 'Saving...' : 'Save Signatory Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
