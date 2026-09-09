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
} from 'lucide-react';

export const InnovationDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    loadCompetitions();
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
      </div>
    </PortalLayout>
  );
};
