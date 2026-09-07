import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Program, School } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Flame,
} from 'lucide-react';

export const ProgramsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>(searchParams.get('school') || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'all' | 'openOnly'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, schoolRes] = await Promise.all([
          api.getPrograms(),
          api.getSchools(),
        ]);
        setPrograms(progRes.programs || []);
        setSchools(schoolRes.schools || []);
      } catch (err) {
        console.error('Failed to load programs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const schoolParam = searchParams.get('school');
    if (schoolParam) {
      setSelectedSchool(schoolParam);
    }
  }, [searchParams]);

  const filteredPrograms = programs.filter((p) => {
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tools.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // School filter
    if (selectedSchool !== 'ALL') {
      if (p.school?.code !== selectedSchool && p.schoolId !== selectedSchool) {
        return false;
      }
    }

    // Status filter
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
      return false;
    }

    // View mode filter (open cohorts vs all)
    if (viewMode === 'openOnly') {
      if (p.status !== 'OPEN_FOR_APPLICATION' || !p.cohorts || p.cohorts.length === 0) {
        return false;
      }
    }

    return true;
  });

  const openProgramsCount = programs.filter(
    (p) => p.status === 'OPEN_FOR_APPLICATION' && p.cohorts && p.cohorts.length > 0
  ).length;

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Program Catalog</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Explore All 50 Academic Programs
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            From foundation computing to autonomous robotics, renewable solar grids, AI models, and startup venture
            studios. Choose your learning pathway.
          </p>

          {/* Toggle: All Available Programs vs Currently Open Cohorts */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All Available Programs ({programs.length})
              </button>
              <button
                onClick={() => setViewMode('openOnly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'openOnly'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Currently Open Cohorts ({openProgramsCount})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by program name, tools (Python, React, ROS2)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* School Dropdown */}
            <div className="md:col-span-4">
              <select
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  if (e.target.value === 'ALL') {
                    searchParams.delete('school');
                    setSearchParams(searchParams);
                  } else {
                    setSearchParams({ school: e.target.value });
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All 8 Academic Schools</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN_FOR_APPLICATION">Open for Application</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="FULL">Full</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Showing {filteredPrograms.length} programs matching criteria</span>
            {(searchQuery || selectedSchool !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSchool('ALL');
                  setSelectedStatus('ALL');
                  searchParams.delete('school');
                  setSearchParams(searchParams);
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <LoadingSpinner message="Loading catalog programs..." />
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No matching programs found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try modifying your search keywords, switching academic schools, or removing filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((prog) => {
              const isOpen = prog.status === 'OPEN_FOR_APPLICATION';
              return (
                <Card key={prog.id} className="flex flex-col justify-between" hoverable>
                  <div className="p-6 space-y-4">
                    {/* Top School Badge & Status */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: prog.school?.color || '#2563eb' }}
                      >
                        {prog.school?.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOpen
                            ? 'bg-emerald-100 text-emerald-800'
                            : prog.status === 'UPCOMING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prog.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {prog.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                        {prog.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {prog.description}
                    </p>

                    <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                      <div>
                        <strong className="text-slate-700">Duration:</strong> {prog.duration} ({prog.contactHours} Contact Hours)
                      </div>
                      <div>
                        <strong className="text-slate-700">Tools:</strong> {prog.tools}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/programs/${prog.code}`}
                      className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1"
                    >
                      <span>Curriculum & Capstone</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {isOpen ? (
                      <Link
                        to={`/apply?programId=${prog.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                      >
                        Apply
                      </Link>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {prog.status === 'UPCOMING' ? 'Notify Me' : 'Closed'}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
