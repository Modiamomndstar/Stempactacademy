import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Project } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  GitBranch,
  ExternalLink,
  BookOpen,
  Award,
  Users,
  Search,
  Filter,
  Play,
  X,
  Sparkles,
  School,
  Calendar,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const CATEGORY_CHIPS = [
  { id: 'ALL', label: 'All Domains' },
  { id: 'Software Engineering', label: 'Software & AI' },
  { id: 'Robotics & Hardware', label: 'Robotics & IoT' },
  { id: 'Renewable Energy', label: 'CleanTech & Solar' },
  { id: 'Creative Tech', label: 'Creative & Media Tech' },
  { id: 'Business Tech', label: 'FinTech & Product' },
];

const getYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedCohort, setSelectedCohort] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Video Modal State
  const [activeVideoModal, setActiveVideoModal] = useState<{
    videoId: string;
    project: Project;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, schoolsRes, progRes, cohortsRes] = await Promise.all([
          api.getProjects(),
          api.getSchools().catch(() => ({ schools: [] })),
          api.getPrograms().catch(() => ({ programs: [] })),
          api.getCohorts().catch(() => ({ cohorts: [] })),
        ]);
        setProjects(projRes.projects || []);
        setSchools(schoolsRes.schools || schoolsRes || []);
        setPrograms(progRes.programs || progRes || []);
        setCohorts(cohortsRes.cohorts || cohortsRes || []);
      } catch (err) {
        console.error('Failed to load portfolio showcase data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered Programs based on selected school
  const availablePrograms = useMemo(() => {
    if (selectedSchool === 'ALL') return programs;
    return programs.filter(
      (p) => p.schoolId === selectedSchool || p.school?.id === selectedSchool
    );
  }, [programs, selectedSchool]);

  // Multi-dimensional filtering logic
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = (p.category || '').toLowerCase();
        const target = selectedCategory.toLowerCase();
        if (!cat.includes(target) && !target.includes(cat)) {
          return false;
        }
      }

      // School filter
      if (selectedSchool !== 'ALL') {
        const projSchoolId = p.program?.schoolId || p.program?.school?.id;
        if (projSchoolId && projSchoolId !== selectedSchool) {
          return false;
        }
      }

      // Program filter
      if (selectedProgram !== 'ALL') {
        if (p.programId && p.programId !== selectedProgram) {
          return false;
        }
      }

      // Cohort filter
      if (selectedCohort !== 'ALL') {
        if (p.cohortId && p.cohortId !== selectedCohort) {
          return false;
        }
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = p.title?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const skillsMatch = p.skills?.toLowerCase().includes(q);
        const toolsMatch = p.tools?.toLowerCase().includes(q);
        const creatorMatch = p.members?.some((m) =>
          `${m.student?.user?.firstName || ''} ${m.student?.user?.lastName || ''}`
            .toLowerCase()
            .includes(q)
        );
        if (!titleMatch && !descMatch && !skillsMatch && !toolsMatch && !creatorMatch) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedCategory, selectedSchool, selectedProgram, selectedCohort, searchQuery]);

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedSchool !== 'ALL' ||
    selectedProgram !== 'ALL' ||
    selectedCohort !== 'ALL' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedSchool('ALL');
    setSelectedProgram('ALL');
    setSelectedCohort('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-12 pb-24 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-16 sm:py-20 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Portfolio Showcase & Capstone Exhibition</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Built by STEMPACT Learners
          </h1>

          <p className="text-slate-300 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            Explore live software applications, CleanTech IoT hardware prototypes, autonomous robotics rover code,
            and AI models engineered by students across our Ile-Ife learning centers and virtual campus cohorts.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <strong className="text-white font-mono">{projects.length}</strong> Published Capstones
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-white font-mono">{cohorts.length}</strong> Running Cohorts
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-white font-mono">{schools.length}</strong> Specialized Schools
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Multi-Dimensional Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, skills, tools, student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            {/* School Dropdown */}
            <div className="relative">
              <select
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setSelectedProgram('ALL');
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Schools</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Dropdown */}
            <div className="relative">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Programs</option>
                {availablePrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cohort Dropdown */}
            <div className="relative">
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Cohort Batches</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-900">{filteredProjects.length}</strong> of{' '}
                  <strong className="text-slate-900">{projects.length}</strong> capstone projects
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Loading STEMPACT student capstone portfolio..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4 p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">No projects matched your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing search terms or selecting a different academic school or domain category.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((proj) => {
              const youtubeId =
                getYouTubeId(proj.videoUrl) ||
                getYouTubeId(proj.liveDemoUrl) ||
                getYouTubeId(proj.thumbnail);

              const creatorMember = proj.members?.[0];
              const creatorName = creatorMember?.student?.user
                ? `${creatorMember.student.user.firstName} ${creatorMember.student.user.lastName}`
                : null;

              const isDirectLiveDemo = proj.liveDemoUrl && !getYouTubeId(proj.liveDemoUrl);

              return (
                <div
                  key={proj.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Media Header / Video Play Badge */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                      {youtubeId ? (
                        <>
                          <img
                            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                            alt={proj.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />
                          <button
                            type="button"
                            onClick={() => setActiveVideoModal({ videoId: youtubeId, project: proj })}
                            aria-label={`Play presentation video for ${proj.title}`}
                            className="absolute z-10 w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
                          >
                            <Play className="w-6 h-6 fill-white ml-1" />
                          </button>
                          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5">
                            <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                            <span>Video Presentation</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-indigo-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2">
                          <Layers className="w-10 h-10 text-indigo-400 opacity-80" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {proj.category || 'Engineering Capstone'}
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
                          {proj.category}
                        </span>
                        {proj.score && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-600 text-white shadow-xs">
                            Score: {proj.score}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-6 space-y-4">
                      {/* School & Cohort Meta */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                        {proj.program?.school && (
                          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <School className="w-3 h-3" />
                            <span>{proj.program.school.name}</span>
                          </span>
                        )}
                        {proj.cohort && (
                          <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{proj.cohort.name}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {proj.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>

                      {/* Skills & Tools */}
                      <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100">
                        {proj.skills && (
                          <div className="flex items-start gap-1">
                            <strong className="text-slate-700 shrink-0">Skills:</strong>
                            <span className="text-slate-600 truncate">{proj.skills}</span>
                          </div>
                        )}
                        {proj.tools && (
                          <div className="flex items-start gap-1">
                            <strong className="text-slate-700 shrink-0">Tech:</strong>
                            <span className="text-slate-600 truncate">{proj.tools}</span>
                          </div>
                        )}
                      </div>

                      {/* Creator Info */}
                      {creatorName && (
                        <div className="flex items-center gap-2 pt-2 text-xs text-slate-700">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                            {creatorName.charAt(0)}
                          </div>
                          <span className="font-semibold">{creatorName}</span>
                          <span className="text-[10px] text-slate-400">
                            • {creatorMember?.role || 'Lead Creator'}
                          </span>
                        </div>
                      )}

                      {/* Evaluator Feedback */}
                      {proj.feedback && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                          "{proj.feedback}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Links */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-bold gap-2">
                    {youtubeId ? (
                      <button
                        type="button"
                        onClick={() => setActiveVideoModal({ videoId: youtubeId, project: proj })}
                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-rose-600" />
                        <span>Watch Video</span>
                      </button>
                    ) : (
                      <span></span>
                    )}

                    <div className="flex items-center gap-3">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-700 hover:text-blue-600 flex items-center gap-1 transition"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>Code</span>
                        </a>
                      )}

                      {isDirectLiveDemo && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* INTERACTIVE YOUTUBE VIDEO PLAYER MODAL */}
      {activeVideoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Student Project Presentation
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 line-clamp-1">
                  {activeVideoModal.project.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Iframe */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideoModal.project.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 sm:p-6 space-y-3 bg-slate-950">
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeVideoModal.project.description}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Skills: <strong>{activeVideoModal.project.skills}</strong></span>
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  {activeVideoModal.project.githubUrl && (
                    <a
                      href={activeVideoModal.project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>View GitHub Code</span>
                    </a>
                  )}
                  {activeVideoModal.project.liveDemoUrl && !getYouTubeId(activeVideoModal.project.liveDemoUrl) && (
                    <a
                      href={activeVideoModal.project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>Open Live Demo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
