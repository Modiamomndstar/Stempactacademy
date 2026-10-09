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
  Sparkles,
  Building2,
} from 'lucide-react';

export const CohortsPage: React.FC = () => {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [schools, setSchools] = useState<School[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cohortsRes, schoolsRes, sessionsRes, centersRes] = await Promise.all([
          api.getCohorts({ currentSessionOnly: 'true', openOnly: 'true' }),
          api.getSchools(),
          api.getAcademicSessions().catch(() => ({ sessions: [] })),
          api.getCenters().catch(() => ({ centers: [] })),
        ]);

        const sessionsList = sessionsRes?.sessions || [];
        const currentActive = sessionsList.find((s: any) => s.isCurrent) || sessionsList[0] || null;
        setActiveSession(currentActive);

        // If currentSessionOnly returned cohorts, use them; if empty, fallback to open cohorts
        if (cohortsRes?.cohorts && cohortsRes.cohorts.length > 0) {
          setCohorts(cohortsRes.cohorts);
        } else {
          // Fallback to open cohorts
          const fallbackRes = await api.getCohorts({ openOnly: 'true' });
          setCohorts(fallbackRes?.cohorts || []);
        }

        setSchools(schoolsRes.schools || []);
        setCenters(centersRes?.centers || []);
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
      if (c.program?.school?.code !== selectedSchool && c.program?.schoolId !== selectedSchool) return false;
    }
    if (selectedCity !== 'ALL') {
      const centerCity = (c as any).learningCenter?.cityOrTown || '';
      if (centerCity !== selectedCity) return false;
    }
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading active cohort timetable & seats..." />;

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="blue">Real-Time Schedules & Seats</Badge>
            {activeSession && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeSession.name}</span>
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Academic Intakes & Open Class Sections
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            All STEMPACT intake cohorts and class sections feature capped capacity (20–25 learners) to ensure dedicated hardware lab access, live mentoring, and personalized career coaching.
          </p>

          {/* School Filter Chips */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedSchool('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSchool === s.code
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>

          {/* City / Center Filter Chips */}
          {centers.length > 0 && (() => {
            const cities = Array.from(new Set(centers.map((c: any) => c.cityOrTown).filter(Boolean))) as string[];
            return cities.length > 1 ? (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">City:</span>
                <button
                  onClick={() => setSelectedCity('ALL')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    selectedCity === 'ALL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  All Locations
                </button>
                {cities.map((city: string) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedCity === city ? 'bg-white text-slate-900 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* Cohorts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {filteredCohorts.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-4">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                No Cohorts Open for Registration
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Admissions for the upcoming intake session are currently being scheduled.
                Please check back shortly or explore our academic programs catalog.
              </p>
            </div>
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
            >
              <span>Explore All Academic Programs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
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
                <Card key={cohort.id} className="flex flex-col justify-between border border-slate-200 rounded-3xl" hoverable>
                  <div className="p-6 space-y-5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {cohort.cohortCode}
                        </span>
                        {cohort.academicSession?.code ? (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {cohort.academicSession.code}
                          </span>
                        ) : cohort.academicSession?.name ? (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {cohort.academicSession.name.split(' ')[0]}
                          </span>
                        ) : null}
                      </div>
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
                          {isFull ? 'FULL' : isAlmostFull ? 'ALMOST FULL' : 'OPEN'}
                        </span>
                      </div>
                    </div>

                    {/* Program & Title */}
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                        {cohort.program?.school?.name || cohort.program?.name || 'Academy School'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                        {cohort.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{cohort.level}</p>
                    </div>

                    {/* Schedule Details */}
                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          Start Date:{' '}
                          <strong className="text-slate-800">
                            {new Date(cohort.startDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          Schedule:{' '}
                          <strong className="text-slate-800">{cohort.schedule}</strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          Location & Mode:{' '}
                          <strong className="text-slate-800">{cohort.mode}</strong>
                          <br />
                          <span className="text-[11px] text-slate-500">• {cohort.location}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          Lead Instructor:{' '}
                          <strong className="text-slate-800">{cohort.instructorName}</strong>
                        </span>
                      </div>
                      {(cohort as any).learningCenter && (
                        <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>
                            Learning Center:{' '}
                            <strong className="text-slate-800">{(cohort as any).learningCenter.name}</strong>
                            {(cohort as any).learningCenter.neighborhood && (
                              <span className="text-[11px] text-slate-500 block">• {(cohort as any).learningCenter.neighborhood}, {(cohort as any).learningCenter.cityOrTown}</span>
                            )}
                            {(cohort as any).sponsorName && (
                              <span className="text-[11px] text-emerald-600 font-semibold block">Sponsored by: {(cohort as any).sponsorName}</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Seat Availability Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Seat Availability:</span>
                        <span className="font-bold text-slate-800">
                          {availableSeats} of {cohort.maxCapacity} seats remaining
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isFull ? 'bg-rose-500' : isAlmostFull ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${Math.min(100, ((cohort.maxCapacity - availableSeats) / cohort.maxCapacity) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs border border-slate-100 font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Training Tuition:</span>
                        <div className="text-right">
                          {hasDiscount && (
                            <span className="line-through text-slate-400 mr-1.5">
                              ₦{cohort.trainingFee.toLocaleString()}
                            </span>
                          )}
                          <strong className="text-slate-900 font-bold">₦{discountedFee.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Registration / Portal:</span>
                        <span>₦{cohort.registrationFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Official Credential Fee:</span>
                        <span>₦{cohort.certificationFee.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Deadline Notice */}
                    <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>
                        Deadline:{' '}
                        {new Date(cohort.applicationDeadline).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-6 pt-0">
                    {isOpen ? (
                      <Link
                        to={`/apply?cohortId=${cohort.id}&programId=${cohort.programId}`}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow transition cursor-pointer"
                      >
                        <span>Apply for this Cohort</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed text-center"
                      >
                        Cohort Intake Closed
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Institutional Guarantee Strip */}
      <section className="bg-slate-50 border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Capped Small Batches</h4>
                <p className="text-xs text-slate-600 mt-1">
                  12 to 25 learners maximum per class to ensure each participant receives dedicated faculty
                  support.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Guaranteed Lab Bench Access</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Dedicated hardware microcontrollers, IoT test rigs, and high-speed campus compute infrastructure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Accredited Credentials</h4>
                <p className="text-xs text-slate-600 mt-1">
                  QR-code cryptographically verifiable completion certificates endorsed by STEMPACT Academy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
