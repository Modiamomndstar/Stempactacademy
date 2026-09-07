import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Project } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Rocket,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  GitBranch,
  Award,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';

export const InnovationLabPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects({ featuredOnly: 'true' });
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === 'ALL') return true;
    return p.category.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">R&D & Rapid Prototyping</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            STEMPACT Innovation Lab
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Where multidisciplinary squads converge to build working hardware, software, CleanTech solutions, and
            robotics prototypes. Transforming ambitious ideas into deployable African inventions.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/startup-lab"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>Explore Startup Lab Incubation</span>
            </Link>
            <Link
              to="/competitions"
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Competition & Hackathon Teams</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Innovation Lab Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 border-t-4 border-t-rose-600" hoverable>
            <Cpu className="w-8 h-8 text-rose-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-base mb-2">Hardware & Embedded Systems</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Custom PCB design, 3D printing prototyping, STM32 / ESP32 microcontrollers, and low-power IoT sensor
              mesh networks engineered for African climatic conditions.
            </p>
          </Card>

          <Card className="p-6 border-t-4 border-t-emerald-600" hoverable>
            <Sparkles className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-base mb-2">Applied AI & Machine Learning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Edge computer vision models for agricultural pest detection, local language NLP tools, and automated
              decision engines deployed on embedded edge accelerators.
            </p>
          </Card>

          <Card className="p-6 border-t-4 border-t-amber-600" hoverable>
            <Rocket className="w-8 h-8 text-amber-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-base mb-2">Clean Energy & Smart Microgrids</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Smart power telemetry, automated changeover ATS logic, lithium BMS optimization, and decentralized solar
              power monitoring gateways.
            </p>
          </Card>
        </div>
      </section>

      {/* Featured Student Prototypes Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="green">Lab Showcase</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Featured Inventions & Capstone Prototypes
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Real projects conceived, prototyped, and defended by STEMPACT Academy students.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {['ALL', 'Software', 'Robotics', 'Renewable'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading Innovation Lab prototypes..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((proj) => (
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

                  <div className="space-y-1 pt-2 text-[11px] text-slate-500">
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
                      <span>Code Repo</span>
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
