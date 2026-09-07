import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filtered = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.skills.toLowerCase().includes(q) ||
      p.tools.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Student Portfolio Showcase</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Built by STEMPACT Learners
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Browse live applications, CleanTech IoT prototypes, autonomous robotics rover code, and AI models engineered
            by students at our Ile-Ife academy hub.
          </p>
        </div>
      </section>

      {/* Search and Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search projects by title, skill, or tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {loading ? (
          <LoadingSpinner message="Loading student portfolio showcase..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No projects matched your criteria</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((proj) => (
              <Card key={proj.id} className="flex flex-col justify-between" hoverable>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="blue">{proj.category}</Badge>
                    {proj.score && (
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Score: {proj.score}/100
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>

                  <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                    <div>
                      <strong className="text-slate-700">Skills:</strong> {proj.skills}
                    </div>
                    <div>
                      <strong className="text-slate-700">Tools:</strong> {proj.tools}
                    </div>
                  </div>

                  {proj.feedback && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                      "{proj.feedback}"
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  {proj.githubUrl ? (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 hover:text-blue-600 flex items-center gap-1.5"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Code Repository</span>
                    </a>
                  ) : (
                    <span></span>
                  )}

                  {proj.liveDemoUrl && (
                    <a
                      href={proj.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
