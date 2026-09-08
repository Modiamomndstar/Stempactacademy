import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Cohort, School } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const CohortsPage: React.FC = () => {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cohortsRes, schoolsRes] = await Promise.all([
          api.getCohorts(),
          api.getSchools(),
        ]);
        setCohorts(cohortsRes.cohorts || []);
        setSchools(schoolsRes.schools || []);
      } catch (err) {
        console.error('Failed to load cohorts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCohorts = cohorts.filter((c) => {
    if (selectedSchool !== 'ALL') {
      return c.program?.school?.code === selectedSchool || c.program?.schoolId === selectedSchool;
    }
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading active cohort timetable & seats..." />;

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Real-Time Schedules & Seats</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Current & Upcoming Academic Cohorts
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            All STEMPACT cohorts have capped capacity to maintain guaranteed hardware bench access and 1-on-1 instructor
            mentorship. Check seat availability and apply before application deadlines close.
          </p>

          {/* School Filter Chips */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedSchool('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                selectedSchool === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All Schools ({cohorts.length})
            </button>
            {schools.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSchool(s.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedSchool === s.code
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cohorts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCohorts.map((cohort) => {
            const availableSeats = cohort.availableSeats ?? Math.max(0, cohort.maxCapacity - cohort.currentEnrollment);
            const isFull = availableSeats <= 0 || cohort.status === 'FULL';
            const isAlmostFull = cohort.status === 'ALMOST_FULL' || availableSeats <= 3;
            const isOpen = ['OPEN', 'ALMOST_FULL'].includes(cohort.status);

            const hasDiscount = cohort.discountPercentage > 0;
            const discountedFee = hasDiscount
              ? cohort.trainingFee - (cohort.trainingFee * cohort.discountPercentage) / 100
              : cohort.trainingFee;

            return (
              <Card key={cohort.id} className="flex flex-col justify-between border border-slate-200" hoverable>
                <div className="p-6 space-y-5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {cohort.cohortCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasDiscount && (
                        <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">
                          {cohort.discountPercentage}% OFF
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-rose-100 text-rose-800'
                            : isAlmostFull
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {cohort.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Program Title & School */}
                  <div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white inline-block mb-1.5"
                      style={{ backgroundColor: cohort.program?.school?.color || '#2563eb' }}
                    >
                      {cohort.program?.school?.name.split(' ')[0]}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {cohort.name}
                    </h3>
                    <div className="text-xs text-blue-600 font-semibold mt-1">
                      {cohort.level}
                    </div>
                  </div>

                  {/* Schedule & Location Details */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Start Date:</strong>{' '}
                        {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }) : 'TBA'}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Schedule:</strong> {cohort.schedule}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Location & Mode:</strong> {cohort.mode} • {cohort.location}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Lead Instructor:</strong> {cohort.instructorName}
                      </div>
                    </div>
                  </div>

                  {/* Available Seats Progress Indicator */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Seat Availability:</span>
                      <span className={`font-bold ${isAlmostFull ? 'text-rose-600' : 'text-slate-800'}`}>
                        {availableSeats} of {cohort.maxCapacity} seats remaining
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isAlmostFull ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${Math.min(100, (cohort.currentEnrollment / cohort.maxCapacity) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Training Tuition:</span>
                      <span className="font-semibold">
                        {hasDiscount && (
                          <span className="line-through text-slate-400 mr-1.5">
                            ₦{(cohort.trainingFee || 0).toLocaleString()}
                          </span>
                        )}
                        ₦{(discountedFee || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Registration / Portal:</span>
                      <span>₦{(cohort.registrationFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Official Credential Fee:</span>
                      <span>₦{(cohort.certificationFee || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>
                      Deadline:{' '}
                      {cohort.applicationDeadline ? new Date(cohort.applicationDeadline).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : 'Open'}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/programs/${cohort.program?.code}`}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600"
                  >
                    Program Syllabus
                  </Link>
                  {isOpen && !isFull ? (
                    <Link
                      to={`/apply?cohortId=${cohort.id}&programId=${cohort.programId}`}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Apply for Cohort
                    </Link>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">Cohort Full</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};
