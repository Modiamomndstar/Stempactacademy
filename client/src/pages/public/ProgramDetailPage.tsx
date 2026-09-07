import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Program } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  Award,
  CheckCircle2,
  Users,
  Wrench,
  Rocket,
  Compass,
  Briefcase,
  BookOpen,
} from 'lucide-react';

export const ProgramDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!code) return;
      try {
        const data = await api.getProgramByCode(code);
        setProgram(data.program);
      } catch (err) {
        console.error('Failed to load program:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [code]);

  if (loading) return <LoadingSpinner message="Loading detailed curriculum..." />;
  if (!program) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Program Not Found</h2>
        <p className="text-slate-500 text-sm">The requested curriculum code could not be located in our catalog.</p>
        <Link to="/programs" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">
          Return to All Programs
        </Link>
      </div>
    );
  }

  const isOpen = program.status === 'OPEN_FOR_APPLICATION';

  return (
    <div className="space-y-16 pb-20">
      {/* Program Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/programs" className="text-xs text-slate-400 hover:text-white">
              Programs
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-semibold">{program.school?.name}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-300">{program.code}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                  style={{ backgroundColor: program.school?.color || '#2563eb' }}
                >
                  {program.school?.name}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isOpen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {program.status.replace(/_/g, ' ')}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                {program.name}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {program.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Duration</div>
                  <div className="font-extrabold text-white mt-0.5">{program.duration}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Contact Hours</div>
                  <div className="font-extrabold text-white mt-0.5">{program.contactHours} Hours</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Prerequisites</div>
                  <div className="font-extrabold text-white mt-0.5 truncate">{program.prerequisites}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Credential</div>
                  <div className="font-extrabold text-white mt-0.5 truncate">{program.certification}</div>
                </div>
              </div>
            </div>

            {/* Right Action Card */}
            <div className="lg:col-span-4 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Academic Enrollment
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {isOpen ? 'Admissions Active' : 'Cohort Full / Upcoming'}
                </div>
                <p className="text-xs text-slate-500">
                  Includes full lab equipment usage, faculty code review, and official credential upon defense.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Learners:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                    {program.targetLearner}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Entry Requirements:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                    {program.entryRequirements}
                  </span>
                </div>
              </div>

              {isOpen ? (
                <div className="space-y-2">
                  <Link
                    to={`/apply?programId=${program.id}`}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs text-center block shadow-md transition-transform transform hover:-translate-y-0.5"
                  >
                    Apply for Next Cohort
                  </Link>
                  <Link
                    to="/assessment"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center block transition-colors"
                  >
                    Take Diagnostic Placement Test
                  </Link>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed"
                >
                  Cohort Registration Closed
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Details: Syllabus, Modules, Tools, Capstone */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Col: Curriculum Breakdown */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. Learning Levels & Modular Syllabus */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Syllabus & Course Modules</span>
              </h2>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <strong>Progressive Mastery Levels:</strong> {program.learningLevels}
              </div>

              {program.courses && program.courses.length > 0 ? (
                <div className="space-y-4">
                  {program.courses.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-slate-200 p-6 bg-white space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                          {c.code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Part {c.order}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900">{c.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                      {c.modules && c.modules.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <div className="text-xs font-bold text-slate-700">Included Modules:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {c.modules.map((m) => (
                              <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                <div className="font-semibold text-slate-800">{m.title}</div>
                                <div className="text-[11px] text-slate-500 mt-1">{m.description}</div>
                                <div className="text-[10px] text-blue-600 font-bold mt-2">
                                  {m.durationHours} Hours Dedicated Lab
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Modular syllabus being structured for upcoming batch.</p>
              )}
            </div>

            {/* 2. Capstone Project Specification */}
            <div className="rounded-3xl bg-slate-900 text-white p-8 space-y-4 shadow-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase">
                <Rocket className="w-4 h-4 text-rose-400" />
                <span>Graduation Requirement</span>
              </div>
              <h3 className="text-2xl font-black">Mandatory Capstone Project</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {program.capstone}
              </p>
              <div className="pt-2 text-xs text-slate-400 border-t border-slate-800">
                <strong>Assessment & Defense:</strong> {program.assessmentCriteria}
              </div>
            </div>
          </div>

          {/* Right Col: Tools, Competencies, Careers */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tools & Tech Stack */}
            <Card className="p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>Industry Tools & Technologies</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {program.tools}
              </p>
            </Card>

            {/* Core Competencies */}
            <Card className="p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Verifiable Competencies</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {program.competencies}
              </p>
            </Card>

            {/* Career Pathways */}
            <Card className="p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>Career Pathways</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {program.careerPathways}
              </p>
            </Card>

            {/* Progression Pathway */}
            <Card className="p-6 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-600" />
                <span>Progression Next Steps</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {program.progressionPathway}
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
