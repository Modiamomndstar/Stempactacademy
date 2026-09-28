import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, School, Sparkles, Check, AlertCircle, Palette } from 'lucide-react';

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  schoolToEdit?: any | null; // If provided, edit mode; otherwise create mode
}

const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo Dream', hex: '#4f46e5' },
  { name: 'Purple Nebula', hex: '#7c3aed' },
  { name: 'Emerald Peak', hex: '#059669' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Rose Quartz', hex: '#e11d48' },
  { name: 'Cyan Horizon', hex: '#0891b2' },
  { name: 'Slate Steel', hex: '#475569' },
];

export const SchoolModal: React.FC<SchoolModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  schoolToEdit,
}) => {
  const isEditMode = Boolean(schoolToEdit);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('School');
  const [order, setOrder] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (schoolToEdit) {
      setName(schoolToEdit.name || '');
      setCode(schoolToEdit.code || '');
      setDescription(schoolToEdit.description || '');
      setColor(schoolToEdit.color || '#2563eb');
      setIcon(schoolToEdit.icon || 'School');
      setOrder(schoolToEdit.order !== undefined ? schoolToEdit.order : 0);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setColor('#2563eb');
      setIcon('School');
      setOrder(0);
    }
    setError('');
    setSuccess('');
  }, [schoolToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('School Name is required.');
      return;
    }
    if (!code.trim()) {
      setError('School Code is required (e.g. SAIET, SSE, SYI).');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.updateSchool(schoolToEdit.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          order: Number(order) || 0,
        });
        setSuccess(`"${name}" updated successfully.`);
      } else {
        await api.createSchool({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || `School of ${name.trim()} at STEMPACT Academy.`,
          color,
          icon,
          order: Number(order) || 0,
        });
        setSuccess(`"${name}" faculty created successfully.`);
      }

      await onSaved();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('School save error:', err);
      setError(err.message || 'Failed to save school information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-4">
        {/* Modal Header */}
        <div
          className="p-6 text-white relative transition-colors duration-300"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, #0f172a 100%)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-mono font-bold text-lg shadow-md border border-white/20"
                style={{ backgroundColor: color }}
              >
                {code ? code.slice(0, 4).toUpperCase() : 'SCH'}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {isEditMode ? 'Edit Academic School' : 'New Academic Faculty'}
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  {isEditMode ? `Edit: ${schoolToEdit.name}` : 'Create Academic School'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-white/80 mt-2">
            Academic schools are foundational faculties that house specialized programs, degree pathways, and certified curriculum tracks.
          </p>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* School Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">
                School / Faculty Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. School of Artificial Intelligence & Emerging Tech"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">
                Code *
              </label>
              <input
                type="text"
                required
                disabled={isEditMode}
                placeholder="e.g. SAIET"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              />
              {isEditMode && (
                <p className="text-[10px] text-slate-400">Canonical code is permanent.</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200">
              Description & Mission
            </label>
            <textarea
              rows={3}
              placeholder="State the academic purpose, disciplines, and learning outcomes under this faculty..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Brand Color Presets */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Faculty Brand Color</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setColor(p.hex)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                    color === p.hex
                      ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                >
                  {color === p.hex && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-transparent"
                  title="Custom hex color"
                />
                <span className="font-mono text-[11px] text-slate-500">{color}</span>
              </div>
            </div>
          </div>

          {/* Display Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">
                Display Order Priority
              </label>
              <input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">Lower numbers appear first in the catalog.</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">
                Faculty Icon
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="School">School / Academy</option>
                <option value="BookOpen">Book / Humanities</option>
                <option value="Sparkles">Sparkles / Emerging Tech</option>
                <option value="Layers">Layers / Architecture</option>
                <option value="Shield">Shield / Security</option>
                <option value="GraduationCap">Graduation Cap</option>
                <option value="Cpu">Cpu / Hardware & Robotics</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: color }}
            >
              {submitting ? 'Saving School...' : isEditMode ? 'Update School' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
