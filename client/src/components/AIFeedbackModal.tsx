import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  X,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { FeedbackDraft } from '../types';

interface AIFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId?: string;
  studentName?: string;
  assignmentTitle?: string;
  submissionContent?: string;
  onApplyFeedback?: (feedback: { score: number; comments: string }) => void;
}

export const AIFeedbackModal: React.FC<AIFeedbackModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  studentName = 'Learner',
  assignmentTitle = 'Practical Capstone Deliverable',
  submissionContent = '',
  onApplyFeedback,
}) => {
  const [content, setContent] = useState(submissionContent);
  const [rubric, setRubric] = useState('Code correctness, architectural structure, practical functionality, and edge-case handling');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackDraft | null>(null);
  const [customScore, setCustomScore] = useState<number>(85);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setGenerating(true);
      setError('');
      const res = await api.generateFeedback({
        submissionContent: content,
        assignmentTitle,
        rubric,
      });
      setFeedback(res.draft);
      setCustomScore(res.draft.suggestedScore);
    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!feedback) return;
    const formattedComments = `### Evaluation
**Strengths:**
${feedback.strengths.map((s: string) => `- ${s}`).join('\n')}

**Growth Areas:**
${feedback.areasForImprovement.map((a: string) => `- ${a}`).join('\n')}

**Note:**
${feedback.encouragement}`;

    if (onApplyFeedback) {
      onApplyFeedback({
        score: customScore,
        comments: formattedComments,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Constructive Grading Assistant</h3>
              <p className="text-xs text-slate-200">
                Evaluating {studentName} • {assignmentTitle}
              </p>
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
          {!feedback ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Student Submission Content or GitHub / Drive URL
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste submission text, code excerpt, or notes here..."
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Grading Rubric / Key Evaluation Focus
                </label>
                <input
                  type="text"
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Analyzing Submission...' : 'Generate Constructive Feedback'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Scorecard */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    Recommended Score
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-0.5">
                    {customScore} / 100
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-300">Adjust Score:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customScore}
                    onChange={(e) => setCustomScore(Number(e.target.value))}
                    className="w-20 px-2.5 py-1 text-sm font-bold bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <h5 className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  Key Strengths
                </h5>
                <ul className="space-y-1">
                  {feedback.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvement Areas */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <h5 className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  Actionable Growth Opportunities
                </h5>
                <ul className="space-y-1">
                  {feedback.areasForImprovement.map((a: string, i: number) => (
                    <li key={i} className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Encouragement */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 italic">
                "{feedback.encouragement}"
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Apply Feedback & Grade
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
