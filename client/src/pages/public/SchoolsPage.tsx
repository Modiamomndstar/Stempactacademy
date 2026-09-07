import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { School, Program } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Code2,
  BrainCircuit,
  Cpu,
  SunMedium,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Rocket,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeSchoolCode, setActiveSchoolCode] = useState<string>('CSE');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSchoolsAndPrograms = async () => {
      try {
        const [schoolsRes, progRes] = await Promise.all([
          api.getSchools(),
          api.getPrograms(),
        ]);
        setSchools(schoolsRes.schools || []);
        setPrograms(progRes.programs || []);
      } catch (err) {
        console.error('Failed to load schools:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolsAndPrograms();
  }, []);

  const schoolIconMap: Record<string, any> = {
    CSE: Code2,
    AIDM: BrainCircuit,
    RIOTH: Cpu,
    RETE: SunMedium,
    DMAP: Sparkles,
    BIE: TrendingUp,
    SKT: GraduationCap,
    ISL: Rocket,
  };

  if (loading) return <LoadingSpinner message="Loading STEMPACT Academic Schools..." />;

  const activeSchool = schools.find((s) => s.code === activeSchoolCode) || schools[0];
  const activePrograms = programs.filter((p) => p.school?.code === activeSchool?.code || p.schoolId === activeSchool?.id);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="purple">Academic Architecture</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Our 8 Academic Schools
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Every academic school at STEMPACT represents an ecosystem of practical excellence, combining fundamental
            theory with lab practicum, modern industry toolchains, and real-world project portfolios.
          </p>
        </div>
      </section>

      {/* Interactive School Tabs & Browser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin">
          {schools.map((s) => {
            const Icon = schoolIconMap[s.code] || BookOpen;
            const isActive = s.code === activeSchoolCode;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSchoolCode(s.code)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                ></span>
                <Icon className="w-4 h-4" />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected School Overview Card */}
        {activeSchool && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: activeSchool.color }}
                  >
                    {activeSchool.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    School #{activeSchool.order} of 8
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {activeSchool.name}
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                  {activeSchool.description}
                </p>
              </div>

              <Link
                to={`/apply?schoolId=${activeSchool.id}`}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
              >
                Apply to This School
              </Link>
            </div>

            {/* Programs List inside this school */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Programs in {activeSchool.name} ({activePrograms.length})</span>
                <Link
                  to={`/programs?school=${activeSchool.code}`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  View with full filters
                </Link>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePrograms.map((prog) => (
                  <Card key={prog.id} className="p-6 flex flex-col justify-between" hoverable>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          {prog.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prog.status === 'OPEN_FOR_APPLICATION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prog.status === 'UPCOMING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {prog.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {prog.name}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {prog.description}
                      </p>

                      <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                        <div>
                          <strong className="text-slate-700">Duration:</strong> {prog.duration}
                        </div>
                        <div>
                          <strong className="text-slate-700">Tools:</strong> {prog.tools}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <Link
                        to={`/programs/${prog.code}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>Full Curriculum</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link
                        to={`/apply?programId=${prog.id}`}
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                      >
                        Apply
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
