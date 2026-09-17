import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  X,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Laptop,
  HelpCircle,
  FileText
} from 'lucide-react';
import { LessonPlanDraft } from '../types';

interface AILessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  programTitle?: string;
  defaultTopic?: string;
}

export const AILessonPlanModal: React.FC<AILessonPlanModalProps> = ({
  isOpen,
  onClose,
  programTitle = 'STEMPACT Cohort Class',
  defaultTopic = '',
}) => {
  const [topic, setTopic] = useState(defaultTopic || 'Object-Oriented Architecture & Practical Design Patterns');
  const [targetAudience, setTargetAudience] = useState('Intermediate learners with foundational JavaScript knowledge');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [availableEquipment, setAvailableEquipment] = useState('Computer Lab with VS Code, Node.js runtime, Projector');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lessonPlan, setLessonPlan] = useState<LessonPlanDraft | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      setError('');
      const res = await api.generateLessonPlan({
        topic,
        targetAudience,
        durationMinutes: Number(durationMinutes),
        availableEquipment: availableEquipment.split(',').map((e) => e.trim()),
      });
      setLessonPlan(res.draft);
    } catch (err: any) {
      setError(err.message || 'Failed to generate lesson plan.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Pedagogy & Lesson Plan Generator</h3>
              <p className="text-xs text-slate-200">{programTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6">
          {!lessonPlan ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Session Topic or Module Goal
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="360"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Target Learner Background
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Available Lab Equipment & Tools
                </label>
                <input
                  type="text"
                  value={availableEquipment}
                  onChange={(e) => setAvailableEquipment(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Drafting Lesson Breakdown...' : 'Generate AI Lesson Plan'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    {lessonPlan.topic}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {lessonPlan.durationMinutes} Minutes
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLessonPlan(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    Adjust Parameters
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow"
                  >
                    Use in Class
                  </button>
                </div>
              </div>

              {/* Objectives */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Session Learning Objectives
                </h5>
                <ul className="space-y-1">
                  {lessonPlan.objectives.map((obj: string, i: number) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timed Progression Blocks */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Timed Class Agenda
                </h5>
                {lessonPlan.agenda.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-4"
                  >
                    <div className="w-16 flex-shrink-0 text-center py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                        {item.timeMinutes}m
                      </span>
                    </div>
                    <div className="flex-1">
                      <h6 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.activity}
                      </h6>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {item.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lab Activity & Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                  <h6 className="font-bold text-xs uppercase text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-emerald-600" />
                    Hands-on Lab Exercise
                  </h6>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200">
                    {lessonPlan.handsOnExercise}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50">
                  <h6 className="font-bold text-xs uppercase text-cyan-800 dark:text-cyan-300 mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-600" />
                    Formative Check / Q&A
                  </h6>
                  <p className="text-xs text-cyan-900 dark:text-cyan-200">
                    {lessonPlan.formativeAssessment}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
