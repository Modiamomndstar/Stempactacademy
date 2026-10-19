import React, { useState, useEffect } from 'react';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Competition } from '../../types';
import {
  Lightbulb,
  Award,
  Users,
  Plus,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Trophy,
  Rocket,
  FileText,
  Globe,
  Eye,
  Layers,
  X,
} from 'lucide-react';
import { isInnovationLabSchool, isInnovationLabProgram } from '../../utils/schoolClassifier';

export const InnovationDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ventureApplications, setVentureApplications] = useState<any[]>([]);
  const [loadingVentures, setLoadingVentures] = useState<boolean>(false);
  const [selectedVentureApp, setSelectedVentureApp] = useState<any | null>(null);

  // Modal: Create Competition
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('HACKATHON');
  const [description, setDescription] = useState<string>('');
  const [prizePool, setPrizePool] = useState<string>('₦1,000,000');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal: Score Team
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [score, setScore] = useState<number>(85);
  const [rank, setRank] = useState<number>(1);
  const [feedback, setFeedback] = useState<string>('');

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const res = await api.getCompetitions();
      setCompetitions(res.competitions || []);
    } catch (err) {
      console.error('Failed to load competitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVentures = async () => {
    try {
      setLoadingVentures(true);
      const res = await api.getApplications();
      const apps = res.applications || [];
      const filtered = apps.filter((a: any) =>
        isInnovationLabSchool(a.program?.school) || isInnovationLabProgram(a.program)
      );
      setVentureApplications(filtered);
    } catch (err) {
      console.warn('Failed to load venture applications:', err);
    } finally {
      setLoadingVentures(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
    loadVentures();
  }, []);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      await api.createCompetition({
        title,
        category,
        description,
        prizePool,
        startDate,
        endDate,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadCompetitions();
    } catch (err: any) {
      alert('Failed to create competition: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setSubmitting(true);
    try {
      await api.scoreCompetitionTeam(selectedTeam.id, {
        score,
        rank,
        feedback,
      });
      setShowScoreModal(false);
      setSelectedTeam(null);
      loadCompetitions();
    } catch (err: any) {
      alert('Failed to score team: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>STEMPACT Innovation Lab & Olympiad Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Innovation & Competition Management
            </h1>
            <p className="text-sm text-slate-300">
              Mobilize student innovation squads, sponsor hackathons, challenge problem statements, and curate public exhibition showcases.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('competitions')}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === 'competitions'
                  ? 'border-amber-600 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Active Hackathons ({competitions.length})
            </button>
            <button
              onClick={() => setActiveTab('squads')}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === 'squads'
                  ? 'border-amber-600 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Team Squads & Submissions
            </button>
            <button
              onClick={() => setActiveTab('ventures')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'ventures'
                  ? 'border-amber-600 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span>Venture Applications & Pitch Decks ({ventureApplications.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Author New Hackathon</span>
          </button>
        </div>

        {/* Tab 1: Competitions Roster */}
        {activeTab === 'competitions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No active competitions authored yet. Click "Author New Hackathon" to publish your first innovation challenge.
              </div>
            ) : (
              competitions.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                        {comp.category}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(comp.startDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{comp.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{comp.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Prize Grant Pool:</span>
                      <strong className="text-emerald-700 font-mono font-black">{comp.prizePool || '₦500,000'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Registered Squads:</span>
                      <strong className="text-slate-900 font-bold">{comp.teams?.length || 0} teams</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Team Squads & Judging */}
        {activeTab === 'squads' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Student Innovation Squads & Submissions</h3>
            <div className="space-y-4">
              {competitions.flatMap((c) => (c.teams || []).map((t) => ({ ...t, competitionTitle: c.title }))).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No squad teams currently registered for competitions.
                </div>
              ) : (
                competitions.flatMap((c) => (c.teams || []).map((t) => ({ ...t, competitionTitle: c.title }))).map((team) => (
                  <div key={team.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{team.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                          {team.competitionTitle}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Members: {team.members?.map((m: any) => `${m.student?.user?.firstName || 'Learner'} (${m.role})`).join(', ') || '3 Engineers'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {team.score !== null && team.score !== undefined ? (
                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-emerald-700">Score: {team.score}/100</div>
                          {team.rank && <div className="text-[10px] text-amber-600 font-bold">Rank #{team.rank}</div>}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowScoreModal(true);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Score & Judge</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Venture Applications & Pitch Decks */}
        {activeTab === 'ventures' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-sky-600" />
                  <span>Innovation &amp; Startup Lab Applications</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Review applicant venture theses, pitch decks, demo URLs, and incubator candidate readiness.
                </p>
              </div>
              <button
                type="button"
                onClick={loadVentures}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
              >
                Refresh Applications
              </button>
            </div>

            {loadingVentures ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading venture applications...</div>
            ) : ventureApplications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                No applicants currently enrolled in or applying to Innovation &amp; Startup Lab programs.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ventureApplications.map((app: any) => {
                  const attempt = app.assessmentAttempts?.[0];
                  let parsedAnswers: Record<string, any> = {};
                  try {
                    parsedAnswers = attempt?.answers ? JSON.parse(attempt.answers) : {};
                  } catch {
                    parsedAnswers = {};
                  }

                  let pitchDeckUrl = '';
                  let prototypeUrl = '';
                  const problemStatement = app.statementOfPurpose || '';

                  for (const [, val] of Object.entries(parsedAnswers)) {
                    const strVal = String(val || '');
                    if (strVal.startsWith('http') && (strVal.includes('docs.google') || strVal.includes('pitch') || strVal.includes('slides') || strVal.includes('canva'))) {
                      pitchDeckUrl = strVal;
                    } else if (strVal.startsWith('http') && (strVal.includes('github') || strVal.includes('vercel') || strVal.includes('loom') || strVal.includes('youtube') || strVal.includes('figma'))) {
                      prototypeUrl = strVal;
                    } else if (!pitchDeckUrl && strVal.startsWith('http')) {
                      pitchDeckUrl = strVal;
                    }
                  }

                  const hasSubmittedDossier = Boolean(attempt);

                  return (
                    <div
                      key={app.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all bg-white shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{app.fullName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                              {app.program?.name || 'Innovation Lab Track'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{app.applicationNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500">{app.email} &bull; {app.phone}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              app.status === 'ADMITTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : hasSubmittedDossier
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status === 'ADMITTED' ? 'ADMITTED' : hasSubmittedDossier ? 'DOSSIER SUBMITTED' : 'DOSSIER PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* Pitch & Prototype Quick Links */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {pitchDeckUrl ? (
                          <a
                            href={pitchDeckUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold border border-sky-200 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Pitch Deck</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No pitch deck link provided</span>
                        )}

                        {prototypeUrl ? (
                          <a
                            href={prototypeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 transition"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Demo / Prototype / GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No prototype link provided</span>
                        )}

                        {app.previousProjects && (
                          <span className="text-[11px] text-slate-500">
                            <strong>Prior Projects:</strong> {app.previousProjects}
                          </span>
                        )}
                      </div>

                      {/* Problem Statement Snippet */}
                      {problemStatement && (
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          <strong className="text-slate-800">Problem Statement / Purpose:</strong> {problemStatement}
                        </p>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-[11px] text-slate-400">
                          Applied: {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVentureApp(app)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Full Dossier</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Author Competition */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Author Innovation Challenge</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCompetition} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Challenge Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Southwest AgriTech Robotics Hackathon 2025"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    >
                      <option value="HACKATHON">Hackathon</option>
                      <option value="OLYMPIAD">Science Olympiad</option>
                      <option value="ROBOTICS_EXPO">Robotics Expo</option>
                      <option value="AI_CHALLENGE">AI & LLM Challenge</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Prize Grant Pool</label>
                    <input
                      type="text"
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Problem Statement & Scope</label>
                  <textarea
                    rows={3}
                    placeholder="Outline the technical criteria, hardware constraints, and deliverables..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kickoff Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Grand Finale Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    {submitting ? 'Publishing...' : 'Publish Challenge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Score Team */}
        {showScoreModal && selectedTeam && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Score Team: {selectedTeam.name}</h3>
                <button onClick={() => setShowScoreModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleScoreSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Score (0–100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={score}
                      onChange={(e) => setScore(parseFloat(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Leaderboard Rank</label>
                    <input
                      type="number"
                      min={1}
                      value={rank}
                      onChange={(e) => setRank(parseInt(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Judges Feedback</label>
                  <textarea
                    rows={3}
                    placeholder="Provide technical feedback and recommendations..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScoreModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    {submitting ? 'Submitting...' : 'Save & Publish Rank'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Full Venture Dossier Inspection */}
        {selectedVentureApp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    <Rocket className="w-3 h-3" />
                    <span>Level 5 — Venture Lab Candidate</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedVentureApp.firstName} {selectedVentureApp.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedVentureApp.program?.name || 'Venture & Applied Innovation Track'} · {selectedVentureApp.program?.school?.name || 'School of Innovation & Startup Lab'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVentureApp(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contact & Status Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                  <a href={`mailto:${selectedVentureApp.email}`} className="font-semibold text-blue-600 hover:underline truncate block">
                    {selectedVentureApp.email}
                  </a>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedVentureApp.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                  <span className="font-semibold text-slate-800">{selectedVentureApp.status}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Applied Date</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedVentureApp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Key Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Deliverable Assets & Pitch Materials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-amber-50/50 space-y-1.5">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" /> Pitch Deck / Executive Deck
                    </span>
                    {selectedVentureApp.pitchDeckUrl ? (
                      <a
                        href={selectedVentureApp.pitchDeckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 underline break-all"
                      >
                        <span>{selectedVentureApp.pitchDeckUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No deck link provided</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-emerald-50/50 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-600" /> Prototype / Demo / Repository
                    </span>
                    {selectedVentureApp.prototypeUrl ? (
                      <a
                        href={selectedVentureApp.prototypeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline break-all"
                      >
                        <span>{selectedVentureApp.prototypeUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No demo link provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Statement & Thesis */}
              {selectedVentureApp.problemStatement && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Venture Problem Statement & Purpose</h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedVentureApp.problemStatement}
                  </div>
                </div>
              )}

              {/* Prior Projects & Technical Background */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedVentureApp.previousProjects && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Prior Technical Builds / Projects</h4>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedVentureApp.previousProjects}
                    </div>
                  </div>
                )}

                {selectedVentureApp.technicalBackground && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Technical Competencies</h4>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedVentureApp.technicalBackground}
                    </div>
                  </div>
                )}
              </div>

              {/* Statement of Intent / Essay */}
              {(selectedVentureApp.essay || selectedVentureApp.whyInterested) && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Commercialization Thesis / Motivation</h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedVentureApp.essay || selectedVentureApp.whyInterested}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedVentureApp(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};
