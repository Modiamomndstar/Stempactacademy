import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Sparkles,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  Cpu,
  Layers,
  FileCode,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';

interface AIAdminManagerProps {
  generations: any[];
  onRefresh: () => void;
  onOpenCurriculumArchitect?: () => void;
  currentUser: any;
}

export const AIAdminManager: React.FC<AIAdminManagerProps> = ({
  generations,
  onRefresh,
  onOpenCurriculumArchitect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedGeneration, setSelectedGeneration] = useState<any | null>(null);

  // Review modal state
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_REVISION'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const filteredGenerations = generations.filter((gen) => {
    const promptStr = typeof gen.promptContext === 'string' ? gen.promptContext : JSON.stringify(gen.promptContext || {});
    const matchesSearch =
      gen.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gen.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promptStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || gen.actionType === actionFilter;
    const matchesStatus = statusFilter === 'ALL' || gen.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const handleReviewDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGeneration) return;
    setSubmittingReview(true);
    setReviewError(null);
    setReviewMessage(null);
    try {
      await api.reviewAIDraft(selectedGeneration.id, {
        action: reviewAction,
        notes: reviewNotes.trim(),
      });
      setReviewMessage(`Draft successfully marked as ${reviewAction}!`);
      onRefresh();
      setTimeout(() => {
        setReviewMessage(null);
        setSelectedGeneration(null);
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit draft review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                AI Generation Governance & Curriculum Architect
              </h2>
              <p className="text-xs text-slate-400">
                Audit trail, token expenditure metrics, and human-in-the-loop review for AI-generated artifacts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenCurriculumArchitect && (
            <button
              onClick={onOpenCurriculumArchitect}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-purple-500/20"
            >
              <Zap className="w-4 h-4" />
              Launch Curriculum Architect
            </button>
          )}
          <button
            onClick={onRefresh}
            title="Refresh AI Audit Trail"
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Generations</span>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{generations.length}</div>
          <div className="text-xs text-slate-500 mt-1">Recorded AI executions</div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {generations.filter((g) => g.status === 'PENDING_REVIEW' || g.status === 'DRAFT').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Awaiting academic board sign-off</div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Artifacts</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {generations.filter((g) => g.status === 'APPROVED').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Approved into canonical curriculum</div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Default Model</span>
            <Sparkles className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-lg font-bold text-brand-300 mt-2">Gemini 2.5 Flash</div>
          <div className="text-xs text-slate-500 mt-1">Google AI Studio Engine</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action type, model, prompt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 whitespace-nowrap">Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Actions</option>
              <option value="PROGRAM_GENERATION">Program Generation</option>
              <option value="CURRICULUM_GENERATION">Curriculum Generation</option>
              <option value="SYLLABUS_GENERATION">Syllabus Generation</option>
              <option value="LESSON_PLAN_GENERATION">Lesson Plan Generation</option>
              <option value="ASSESSMENT_GENERATION">Assessment Generation</option>
              <option value="QUALITY_CHECK">Quality Check</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generations Audit Table */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-4 px-6">Action & Artifact Type</th>
                <th className="py-4 px-6">Model & Provider</th>
                <th className="py-4 px-6">Tokens (Prompt / Compl.)</th>
                <th className="py-4 px-6">Initiated By</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6 text-right">Human-in-the-Loop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredGenerations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Sparkles className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                    No AI generation records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredGenerations.map((gen) => (
                  <tr key={gen.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{gen.actionType}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                        ID: {gen.id}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-purple-300">{gen.model}</div>
                      <div className="text-[10px] text-slate-500">{gen.provider}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-slate-300">
                        {gen.tokensPrompt} / {gen.tokensCompletion}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total: {gen.tokensPrompt + gen.tokensCompletion}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">
                        {gen.requestedBy ? `${gen.requestedBy.firstName} ${gen.requestedBy.lastName}` : 'System'}
                      </div>
                      <div className="text-[10px] text-slate-500">{gen.requestedBy?.role || 'Service'}</div>
                    </td>
                    <td className="py-4 px-6">
                      {gen.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      ) : gen.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-red-500/10 border border-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Clock className="w-3 h-3" />
                          {gen.status || 'DRAFT'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {gen.createdAt ? new Date(gen.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedGeneration(gen);
                          setReviewAction(gen.status === 'APPROVED' ? 'APPROVE' : 'APPROVE');
                          setReviewNotes('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Review Modal */}
      {selectedGeneration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    AI Generation Dossier: {selectedGeneration.actionType}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedGeneration.id} • Model: {selectedGeneration.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedGeneration(null);
                  setReviewError(null);
                  setReviewMessage(null);
                }}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            {reviewMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{reviewMessage}</span>
              </div>
            )}

            {reviewError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Prompt Context & Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Prompt Context / Constraints
                </span>
                <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-3 bg-slate-900 rounded-lg max-h-48">
                  {typeof selectedGeneration.promptContext === 'object'
                    ? JSON.stringify(selectedGeneration.promptContext, null, 2)
                    : selectedGeneration.promptContext}
                </pre>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Execution Metrics & Audit
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500">Provider:</span> {selectedGeneration.provider}
                  </div>
                  <div>
                    <span className="text-slate-500">Model:</span> {selectedGeneration.model}
                  </div>
                  <div>
                    <span className="text-slate-500">Prompt Tokens:</span> {selectedGeneration.tokensPrompt}
                  </div>
                  <div>
                    <span className="text-slate-500">Completion Tokens:</span> {selectedGeneration.tokensCompletion}
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <span className="font-bold text-amber-300">{selectedGeneration.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>{' '}
                    {new Date(selectedGeneration.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Output Viewer */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Generated Output Artifact
                </span>
                <span className="text-[10px] text-slate-500">JSON Schema Validated</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-400/90 overflow-x-auto p-4 bg-slate-900 rounded-lg max-h-64">
                {selectedGeneration.structuredOutput
                  ? JSON.stringify(selectedGeneration.structuredOutput, null, 2)
                  : selectedGeneration.rawOutput}
              </pre>
            </div>

            {/* Human-in-the-Loop Review Form */}
            <form onSubmit={handleReviewDraft} className="bg-slate-950/90 p-5 rounded-xl border border-purple-500/20 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Human-in-the-Loop Academic Review
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs transition ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="APPROVE"
                    checked={reviewAction === 'APPROVE'}
                    onChange={() => setReviewAction('APPROVE')}
                    className="sr-only"
                  />
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">APPROVE</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs transition ${
                    reviewAction === 'REQUEST_REVISION'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="REQUEST_REVISION"
                    checked={reviewAction === 'REQUEST_REVISION'}
                    onChange={() => setReviewAction('REQUEST_REVISION')}
                    className="sr-only"
                  />
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">REQUEST REVISION</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs transition ${
                    reviewAction === 'REJECT'
                      ? 'bg-red-500/10 border-red-500 text-red-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewAction"
                    value="REJECT"
                    checked={reviewAction === 'REJECT'}
                    onChange={() => setReviewAction('REJECT')}
                    className="sr-only"
                  />
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="font-semibold">REJECT</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reviewer Notes / Academic Feedback:
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide pedagogical rationale or revisions required..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGeneration(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-purple-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Submit Academic Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
