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
import { isInnovationLabProgram, isInnovationLabSchool } from '../utils/schoolClassifier';

interface AIProgramGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramCreated?: (program: any) => void;
  existingPrograms?: any[];
  initialProgramId?: string;
}

const DOMAIN_PRESETS = [
  {
    name: 'AI for Digital Marketing',
    level: AcademicLevel.LEVEL_1_FOUNDATION,
    weeks: 6,
    learners: 'Marketing professionals, copywriters, digital creators, growth hackers, and agency entrepreneurs',
    tech: 'ChatGPT, Copy.ai, Midjourney, Canva AI, Meta Ads Advantage+, Google Ads AI, Ahrefs, SEMrush, Zapier, HubSpot',
    guidelines: 'Emphasize AI-driven direct response copywriting, automated Meta/Google ad creative variants, SEO keyword clusters, and high-ticket client retainers.',
  },
  {
    name: 'Full Stack Web Engineering & Cloud Native Systems',
    level: AcademicLevel.LEVEL_1_FOUNDATION,
    weeks: 12,
    learners: 'Polytechnic and university students, young tech professionals, coding bootcamp graduates, and career switchers',
    tech: 'TypeScript, React, Next.js, Node.js, Express, PostgreSQL, Prisma, Docker, REST APIs, Git, Tailwind CSS, CI/CD',
    guidelines: 'Focus on full-stack architecture, relational database modeling, clean RESTful API design, authentication security, and deploying production web applications.',
  },
  {
    name: 'Applied Artificial Intelligence & Machine Learning',
    level: AcademicLevel.LEVEL_2_INTERMEDIATE,
    weeks: 10,
    learners: 'Computer science undergraduates, software developers, data analysts, and aspiring AI engineers',
    tech: 'Python, NumPy, Pandas, Scikit-Learn, PyTorch, Hugging Face Transformers, Computer Vision, FastAPI, Docker, MLflow, Vector Databases',
    guidelines: 'Hands-on neural network training, model evaluation metrics, fine-tuning open-source LLMs, and deploying scalable REST inference APIs.',
  },
  {
    name: 'Robotics, IoT & Embedded Systems Engineering',
    level: AcademicLevel.LEVEL_1_FOUNDATION,
    weeks: 8,
    learners: 'Mechatronics students, makers, embedded software developers, and automation engineers',
    tech: 'ESP32, Arduino, C/C++, Sensors, PWM Motor Drivers, I2C/SPI, FreeRTOS, MQTT, Edge AI, KiCAD PCB Design',
    guidelines: 'Closed-loop autonomous navigation, breadboard prototyping, sensor calibration, and IoT MQTT telemetry dashboards.',
  },
  {
    name: 'Computer Systems & Hardware Engineering',
    level: AcademicLevel.LEVEL_1_FOUNDATION,
    weeks: 8,
    learners: 'Aspiring computer engineers, hardware technicians, electronics hobbyists, and IT support professionals',
    tech: 'Digital Multimeter, Hot-Air SMD Rework, Soldering, UEFI BIOS, Oscilloscope, CH341A SPI Flash, Thermal Dynamics, Power Delivery, ATX PSU',
    guidelines: 'Mandatory ESD workbench safety, schematic analysis, voltage injection short-circuit isolation, and physical hardware repair lab exercises.',
  },
  {
    name: 'Solar & Renewable Clean Energy Engineering',
    level: AcademicLevel.LEVEL_1_FOUNDATION,
    weeks: 8,
    learners: 'Electrical technicians, clean energy installers, facilities managers, and renewable energy entrepreneurs',
    tech: 'Photovoltaic Panels, MPPT Charge Controllers, Pure Sine Wave Inverters, Lithium LiFePO4 & Gel Batteries, Solar Sizing, AC/DC Disconnects',
    guidelines: 'Hands-on solar bench sizing, battery bank wiring, inverter safety testing, and real-world Nigerian off-grid solar installation case studies.',
  },
];

export const AIProgramGeneratorModal: React.FC<AIProgramGeneratorModalProps> = ({
  isOpen,
  onClose,
  onProgramCreated,
  existingPrograms = [],
  initialProgramId,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(initialProgramId || '');
  const [domain, setDomain] = useState('Full Stack Web Engineering & Cloud Native Systems');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(AcademicLevel.LEVEL_1_FOUNDATION);
  const [targetAudience, setTargetAudience] = useState('Polytechnic and university students, young tech professionals, and career switchers');
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [keywords, setKeywords] = useState('React, Node.js, PostgreSQL, Docker, REST APIs, Microservices, Deployment');
  const [specialInstructions, setSpecialInstructions] = useState('Emphasize hands-on real-world Nigerian fintech or logistics capstone projects.');

  const [generating, setGenerating] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [error, setError] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<ProgramDraft | null>(null);
  const [generationId, setGenerationId] = useState<string | undefined>(undefined);

  const handleAutoFill = async (overrideDomain?: string) => {
    const targetDomain = (overrideDomain || domain || '').trim();
    if (!targetDomain) return;
    setAutoFilling(true);
    try {
      const targetProg = existingPrograms.find((p) => p.id === selectedProgramId || p.code === selectedProgramId);
      const res = await api.autofillProgramMeta({
        domain: targetDomain,
        academicLevel,
        schoolCode: targetProg?.school?.code,
        programCode: targetProg?.code,
      });
      if (res?.meta) {
        if (res.meta.targetAudience) setTargetAudience(res.meta.targetAudience);
        if (res.meta.keywords) setKeywords(res.meta.keywords);
        if (res.meta.specialInstructions) setSpecialInstructions(res.meta.specialInstructions);
        if (res.meta.durationWeeks) setDurationWeeks(res.meta.durationWeeks);
      }
    } catch {
      // Robust local fallback
      const match = DOMAIN_PRESETS.find((p) =>
        targetDomain.toLowerCase().includes(p.name.toLowerCase().slice(0, 8))
      );
      if (match) {
        setTargetAudience(match.learners);
        setKeywords(match.tech);
        setSpecialInstructions(match.guidelines);
        setDurationWeeks(match.weeks);
        setAcademicLevel(match.level);
      }
    } finally {
      setAutoFilling(false);
    }
  };

  React.useEffect(() => {
    if (initialProgramId) {
      setSelectedProgramId(initialProgramId);
    }
  }, [initialProgramId, isOpen]);

  React.useEffect(() => {
    if (selectedProgramId && existingPrograms.length > 0) {
      const prog = existingPrograms.find((p) => p.id === selectedProgramId || p.code === selectedProgramId);
      if (prog) {
        setDomain(prog.name || '');
        if (isInnovationLabProgram(prog) || isInnovationLabSchool(prog.school)) {
          setAcademicLevel(AcademicLevel.LEVEL_5_INNOVATION);
        } else if (
          prog.level &&
          ([
            AcademicLevel.LEVEL_1_FOUNDATION,
            AcademicLevel.LEVEL_2_INTERMEDIATE,
            AcademicLevel.LEVEL_3_ADVANCED,
            AcademicLevel.LEVEL_4_SPECIALIST,
          ] as string[]).includes(String(prog.level))
        ) {
          setAcademicLevel(prog.level as AcademicLevel);
        } else {
          setAcademicLevel(AcademicLevel.LEVEL_1_FOUNDATION);
        }
        if (prog.duration || prog.durationWeeks) {
          const parsed = prog.duration
            ? parseInt(String(prog.duration).replace(/\D/g, ''), 10)
            : Number(prog.durationWeeks);
          if (parsed && !isNaN(parsed)) {
            setDurationWeeks(parsed);
          }
        }
        if (prog.targetLearner) {
          setTargetAudience(prog.targetLearner);
        } else {
          handleAutoFill(prog.name);
        }
        if (prog.tools || prog.competencies) setKeywords(prog.tools || prog.competencies || '');
        if (prog.description) setSpecialInstructions(prog.description);
      }
    }
  }, [selectedProgramId, existingPrograms]);

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
      const targetProg = existingPrograms.find((p) => p.id === selectedProgramId || p.code === selectedProgramId);

      const res = await api.generateProgram({
        domain,
        academicLevel,
        targetAudience,
        durationWeeks: Number(durationWeeks),
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        specialInstructions,
        schoolCode: targetProg?.school?.code,
        programCode: targetProg?.code,
      });

      const draft = {
        ...res.draft,
        code: targetProg?.code || res.draft.code,
        schoolCode: targetProg?.school?.code || res.draft.schoolCode,
        name: targetProg?.name || res.draft.name,
      };

      setGeneratedDraft(draft);
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 flex flex-col max-h-[90vh]">
        {/* If draft generated, show AI Generation Workspace directly */}
        {generatedDraft ? (
          <div className="p-4 overflow-y-auto">
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
                {/* Target Existing Program Selector */}
                <div className="md:col-span-2 bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Target Academic Program:
                    </span>
                    <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                      Select an existing catalog program or draft a new one
                    </span>
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full border border-emerald-300 dark:border-emerald-700 rounded-xl px-3.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— Draft Brand-New Academic Program —</option>
                    {existingPrograms.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} ({p.school?.code || 'STEM'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Domain */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Program Domain / Discipline <span className="text-emerald-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAutoFill()}
                      disabled={autoFilling || !domain.trim()}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-700/60 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Click to automatically suggest target learners, technologies, and guidelines for this domain"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${autoFilling ? 'animate-spin' : ''}`} />
                      {autoFilling ? 'AI Auto-Filling...' : '✨ AI Smart Auto-Fill'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. AI for Digital Marketing, Full Stack Web Engineering..."
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {/* Quick Domain Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] font-semibold text-slate-400">Quick Presets:</span>
                    {DOMAIN_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setDomain(preset.name);
                          setAcademicLevel(preset.level);
                          setDurationWeeks(preset.weeks);
                          setTargetAudience(preset.learners);
                          setKeywords(preset.tech);
                          setSpecialInstructions(preset.guidelines);
                        }}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          domain.toLowerCase() === preset.name.toLowerCase()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        {preset.name.includes('Marketing')
                          ? '🎯 AI Marketing'
                          : preset.name.includes('Web')
                          ? '💻 Web Engineering'
                          : preset.name.includes('Robotics')
                          ? '🤖 Robotics & IoT'
                          : preset.name.includes('Hardware')
                          ? '🔧 Hardware Repair'
                          : preset.name.includes('Solar')
                          ? '⚡ Solar Energy'
                          : '🧠 AI & ML'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    💡 <em>Tip: Type any domain or choose a preset, then click <strong>✨ AI Smart Auto-Fill</strong> to automatically configure industry-standard tools, learner profiles, and pedagogical guidelines.</em>
                  </p>
                </div>

                {/* Academic Level */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Academic Level / Pathway Tier
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <optgroup label="Core Academic Progression (Levels 1 – 4)">
                      <option value={AcademicLevel.LEVEL_1_FOUNDATION}>
                        Level 1 — Foundation (Beginner / Core Principles)
                      </option>
                      <option value={AcademicLevel.LEVEL_2_INTERMEDIATE}>
                        Level 2 — Intermediate (Applied Implementation)
                      </option>
                      <option value={AcademicLevel.LEVEL_3_ADVANCED}>
                        Level 3 — Advanced (Systems &amp; Architecture)
                      </option>
                      <option value={AcademicLevel.LEVEL_4_SPECIALIST}>
                        Level 4 — Specialist / Mastery (Production Capstone)
                      </option>
                    </optgroup>
                    <optgroup label="Post-Academic Accelerator Pathway">
                      <option value={AcademicLevel.LEVEL_5_INNOVATION}>
                        Venture Lab / Innovation Hub (Applied R&amp;D &amp; Commercialization)
                      </option>
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Standard programs follow Core Levels 1–4; Innovation Lab programs use the Venture Lab pathway.
                  </p>
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
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                    Calculates to {durationWeeks * 6} Total Contact Hours ({durationWeeks} weekly modules × 6 hrs/week).
                  </p>
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
