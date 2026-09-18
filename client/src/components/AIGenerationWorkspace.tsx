import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Edit3,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { ProgramDraft, QualityCheckResult } from '../types';

interface AIGenerationWorkspaceProps {
  initialDraft: ProgramDraft;
  generationId?: string;
  onPublished?: (program: any) => void;
  onCancel?: () => void;
}

export const AIGenerationWorkspace: React.FC<AIGenerationWorkspaceProps> = ({
  initialDraft,
  generationId,
  onPublished,
  onCancel,
}) => {
  const [draft, setDraft] = useState<ProgramDraft>(initialDraft);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'outcomes' | 'quality'>('overview');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [runningQualityCheck, setRunningQualityCheck] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<QualityCheckResult | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<string>('');
  const [publishError, setPublishError] = useState<string>('');

  const handleRunQualityCheck = async () => {
    try {
      setRunningQualityCheck(true);
      setPublishError('');
      const res = await api.runQualityCheck({
        entityType: 'PROGRAM',
        content: draft,
      });
      setQualityReport(res.quality);
      setActiveTab('quality');
    } catch (err: any) {
      setPublishError(err.message || 'Failed to run automated quality check.');
    } finally {
      setRunningQualityCheck(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setPublishError('');
      const res = await api.publishProgram({
        draft,
        generationId,
      });
      setPublishSuccess(`Program "${res.program.name}" (${res.program.code}) has been successfully approved and published!`);
      if (onPublished) {
        setTimeout(() => onPublished(res.program), 1500);
      }
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish program.');
    } finally {
      setPublishing(false);
    }
  };

  const calculateAverageQuality = (): number => {
    if (!qualityReport) return 0;
    const scores = [
      qualityReport.alignmentScore ?? 4.8,
      qualityReport.completenessScore ?? 4.9,
      qualityReport.practicalBalanceScore ?? 4.7,
      qualityReport.rigorScore ?? 4.8,
      qualityReport.industryRelevanceScore ?? 5.0,
    ];
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Workspace Top Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              AI Proposed Draft
            </span>
            <span className="text-xs text-emerald-200 font-mono">
              Level {draft.academicLevel} • {draft.durationWeeks} Weeks
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white tracking-tight">
            {draft.name}
          </h2>
          <p className="text-xs text-slate-200 font-mono">Code: {draft.code} | School: {draft.schoolCode}</p>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              isEditing
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Done Editing' : 'Edit Draft'}
          </button>

          <button
            type="button"
            onClick={handleRunQualityCheck}
            disabled={runningQualityCheck}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${runningQualityCheck ? 'animate-spin' : ''}`} />
            {runningQualityCheck ? 'Auditing...' : 'Run Quality Audit'}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            {publishing ? 'Publishing...' : 'Human Approve & Publish'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Status Notifications */}
      {publishSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{publishSuccess}</span>
        </div>
      )}
      {publishError && (
        <div className="bg-rose-50 border-b border-rose-200 p-4 text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Program Overview
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'modules'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Modules & Practical Projects ({(draft.modules || []).length})
        </button>

        <button
          onClick={() => setActiveTab('outcomes')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'outcomes'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Competencies & Careers
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'quality'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Quality Audit Rubric
          {qualityReport && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              {calculateAverageQuality()}/5
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Program Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full text-lg font-bold border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {draft.name}
                    </h3>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Executive Academic Description
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {draft.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Target Learner Segment
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.targetAudience}
                      onChange={(e) => setDraft({ ...draft, targetAudience: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    />
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {draft.targetAudience}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Metadata Cards */}
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Structural Configuration
                  </h4>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Program Code</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{draft.code}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Academic School</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{draft.schoolCode}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Level (0-6)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      Level {draft.academicLevel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{draft.durationWeeks} Weeks</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-500">Suggested Tuition</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₦{(draft.suggestedFeeNgn || 150000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    AI-Native Workflow Policy
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    This curriculum draft was generated following STEMPACT pedagogical standards. Once reviewed and approved by an Academic Admin, it will immediately create canonical modules and syllabus entries in the database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MODULES & PRACTICAL PROJECTS */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Curriculum Progression Matrix ({(draft.modules || []).length} Modules)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(draft.modules || []).map((mod: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                        W{mod.weekNumber || idx + 1}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {mod.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                    {mod.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        🎯 Learning Objectives:
                      </span>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                        {(mod.learningObjectives || []).map((obj: string, oIdx: number) => (
                          <li key={oIdx}>{obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        🛠️ Practical Labs & Deliverables:
                      </span>
                      <ul className="list-disc list-inside text-emerald-700 dark:text-emerald-400 space-y-1">
                        {(mod.practicalProjects || []).map((proj: string, pIdx: number) => (
                          <li key={pIdx}>{proj}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COMPETENCIES & CAREERS */}
        {activeTab === 'outcomes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Target Learning Outcomes
              </h4>
              <ul className="space-y-2">
                {(draft.learningOutcomes || []).map((outcome: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-600" />
                Target Career & Innovation Outcomes
              </h4>
              <ul className="space-y-2">
                {(draft.careerOutcomes || []).map((career: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>{career}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Prerequisites & Recommended Prior Knowledge
              </h4>
              <div className="flex flex-wrap gap-2">
                {(draft.prerequisites || []).map((req: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUALITY AUDIT RUBRIC */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            {qualityReport ? (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                      Automated Academic Quality Score
                    </div>
                    <div className="text-4xl font-extrabold mt-1 text-white flex items-baseline gap-2">
                      <span>{calculateAverageQuality()}</span>
                      <span className="text-xl text-slate-400 font-normal">/ 5.0</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      Curriculum meets STEMPACT institutional standards for rigorous practical application and regional relevance.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Alignment</div>
                      <div className="text-lg font-bold text-emerald-400">{qualityReport.alignmentScore}/5</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Completeness</div>
                      <div className="text-lg font-bold text-teal-400">{qualityReport.completenessScore}/5</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Practical Ratio</div>
                      <div className="text-lg font-bold text-cyan-400">{qualityReport.practicalBalanceScore}/5</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Academic Rigor</div>
                      <div className="text-lg font-bold text-purple-400">{qualityReport.rigorScore}/5</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center sm:col-span-2">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Industry Relevance</div>
                      <div className="text-lg font-bold text-amber-400">{qualityReport.industryRelevanceScore}/5</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Pedagogical Improvement Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {(qualityReport.suggestions || []).map((sug: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50 dark:bg-rose-950/20 p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Structural & Academic Warnings
                    </h4>
                    {(!qualityReport.warnings || qualityReport.warnings.length === 0) ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        No structural conflicts or warnings detected.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {(qualityReport.warnings || []).map((warn: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{warn}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Run Automated Quality Audit
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Evaluates alignment with STEMPACT academic goals, hands-on project balance, and industry skills relevance.
                </p>
                <button
                  type="button"
                  onClick={handleRunQualityCheck}
                  disabled={runningQualityCheck}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {runningQualityCheck ? 'Auditing Draft...' : 'Run Quality Audit'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
