import React, { useState } from 'react';
import { api } from '../services/api';
import { AIGenerationWorkspace } from './AIGenerationWorkspace';
import {
  Sparkles,
  X,
  Layers,
  GraduationCap,
  Calendar,
  Users,
  Target,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AcademicLevel, ProgramDraft } from '../types';

interface AIProgramGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramCreated?: (program: any) => void;
}

export const AIProgramGeneratorModal: React.FC<AIProgramGeneratorModalProps> = ({
  isOpen,
  onClose,
  onProgramCreated,
}) => {
  const [domain, setDomain] = useState('Full Stack Web Engineering & Cloud Native Systems');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(AcademicLevel.LEVEL_2_INTERMEDIATE);
  const [targetAudience, setTargetAudience] = useState('Polytechnic and university students, young tech professionals, and career switchers');
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [keywords, setKeywords] = useState('React, Node.js, PostgreSQL, Docker, REST APIs, Microservices, Deployment');
  const [specialInstructions, setSpecialInstructions] = useState('Emphasize hands-on real-world Nigerian fintech or logistics capstone projects.');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<ProgramDraft | null>(null);
  const [generationId, setGenerationId] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError('Please provide a program domain or topic.');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const res = await api.generateProgram({
        domain,
        academicLevel,
        targetAudience,
        durationWeeks: Number(durationWeeks),
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        specialInstructions,
      });

      setGeneratedDraft(res.draft);
      setGenerationId(res.generationId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate program draft. Please verify server connection.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublished = (program: any) => {
    if (onProgramCreated) {
      onProgramCreated(program);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* If draft generated, show AI Generation Workspace directly */}
        {generatedDraft ? (
          <div className="p-4">
            <AIGenerationWorkspace
              initialDraft={generatedDraft}
              generationId={generationId}
              onPublished={handlePublished}
              onCancel={() => setGeneratedDraft(null)}
            />
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Sparkles className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Academic Program Architect</h3>
                  <p className="text-xs text-slate-200 mt-1">
                    Design a production-grade, accredited curriculum with modules, competencies, and practical projects in seconds.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleGenerate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Domain */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Program Domain / Discipline <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Applied Artificial Intelligence & Computer Vision"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Academic Level */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Academic Level
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={AcademicLevel.LEVEL_0_ASSESSMENT}>Level 0: Foundation / Exploratory (Ages 7-12)</option>
                    <option value={AcademicLevel.LEVEL_1_FOUNDATION}>Level 1: Beginner / Discovery</option>
                    <option value={AcademicLevel.LEVEL_2_INTERMEDIATE}>Level 2: Intermediate / Builder (Recommended)</option>
                    <option value={AcademicLevel.LEVEL_3_ADVANCED}>Level 3: Accelerated / Specialist</option>
                    <option value={AcademicLevel.LEVEL_4_SPECIALIST}>Level 4: Advanced / Systems Architect</option>
                    <option value={AcademicLevel.LEVEL_5_INNOVATION}>Level 5: Executive / Industry Practitioner</option>
                    <option value={AcademicLevel.LEVEL_6_ENTREPRENEURSHIP}>Level 6: Startup Lab / Venture Capstone</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Program Duration (Weeks)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Target Audience */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Target Learner Segment
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Undergraduates, recent graduates, or high school leavers"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Keywords */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Technologies & Industry Focus Areas (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. Python, PyTorch, YOLO, OpenCV, Edge Deployment"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Special Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Pedagogical Guidelines & Regional Context
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Include local case studies, solar power lab constraints, or entrepreneurship capstones"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Powered by Gemini 2.5 Multi-Modal Academic Engine</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Generating Curriculum...' : 'Generate Academic Proposal'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
