import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { School, Program, Cohort } from '../../types';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  Cpu,
  SunMedium,
  BrainCircuit,
  Code2,
  TrendingUp,
  GraduationCap,
  Rocket,
  CheckCircle2,
  Users,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Star,
  ExternalLink,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [featuredPrograms, setFeaturedPrograms] = useState<Program[]>([]);
  const [openCohorts, setOpenCohorts] = useState<Cohort[]>([]);
  const [cmsContent, setCmsContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolsRes, programsRes, cohortsRes, cmsRes] = await Promise.all([
          api.getSchools(),
          api.getPrograms({ featured: 'true' }),
          api.getCohorts({ openOnly: 'true' }),
          api.getCMSContent(),
        ]);
        setSchools(schoolsRes.schools || []);
        setFeaturedPrograms(programsRes.programs || []);
        setOpenCohorts(cohortsRes.cohorts || []);
        setCmsContent(cmsRes || {});
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
        {/* Subtle background glow spots matching STEM quadrants */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Admissions Live: 2025 Cohorts Now Open in Ile-Ife</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Stem Skills for <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-blue-400 to-emerald-400">
                  Real World Impact.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Welcome to <strong className="text-white">STEMPACT ACADEMY</strong>, the premier technical,
                vocational, and innovation academy in Ile-Ife, Osun State. We train youth, undergraduates, and
                professionals to engineer cutting-edge software, AI models, autonomous robotics, solar microgrids, and
                high-growth venture startups.
              </p>

              {/* 4 Brand Pillars / Quadrants Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border-l-4 border-rose-500">
                  <div className="text-[11px] font-bold text-rose-400 uppercase">Science</div>
                  <div className="text-xs text-slate-300 font-medium">Research & AI</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border-l-4 border-emerald-500">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase">Technology</div>
                  <div className="text-xs text-slate-300 font-medium">Software & Cloud</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border-l-4 border-blue-500">
                  <div className="text-[11px] font-bold text-blue-400 uppercase">Engineering</div>
                  <div className="text-xs text-slate-300 font-medium">Robotics & Solar</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border-l-4 border-amber-500">
                  <div className="text-[11px] font-bold text-amber-400 uppercase">Mathematics</div>
                  <div className="text-xs text-slate-300 font-medium">Logic & Analytics</div>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/apply"
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/programs"
                  className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-semibold text-sm border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Explore 50 Programs</span>
                </Link>

                <Link
                  to="/cohorts"
                  className="px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>View Current Cohorts</span>
                </Link>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Credentials</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Ile-Ife Onsite Campus Hub</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Kids to Executive Tracks</span>
                </div>
              </div>
            </div>

            {/* Right Col: Official Brand Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Official Logo Display with Proportions Preserved */}
                <div className="p-8 rounded-3xl bg-white shadow-2xl border-4 border-slate-800/80 flex flex-col items-center text-center space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
                  <div className="w-full flex justify-center">
                    <img
                      src="/brand/stempact_logo.jpg"
                      alt="STEMPACT ACADEMY Official Seal"
                      className="h-60 w-auto object-contain drop-shadow-md rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-4 w-full">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Accredited STEM & Innovation Hub
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      STEMPACT ACADEMY
                    </h3>
                    <p className="text-xs text-slate-600 font-medium italic">
                      "Stem Skills for Real World Impact"
                    </p>
                  </div>

                  {/* Quick diagnostic entry button */}
                  <Link
                    to="/assessment"
                    className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Take Online Diagnostic Placement Test</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ACADEMY INTRODUCTION & WHAT STEMPACT OFFERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="blue">Academy Introduction</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Building Africa's Next Generation of Technologists & Inventors
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            STEMPACT Academy was founded in Ile-Ife, Osun State, with a singular mission: to eliminate the gap between
            theoretical classroom memorization and industry-ready, practical technical craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 border-t-4 border-t-blue-600" hoverable>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Practical Engineering First</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every lesson is anchored in real code, circuit breadboards, solar inverters, or machine learning models.
              Our students do not just study systems—they deploy them.
            </p>
          </Card>

          <Card className="p-6 border-t-4 border-t-rose-600" hoverable>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Innovation & Startup Lab</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Top student projects are incubated into real startups and competition teams. We connect inventors directly
              with seed capital, legal incorporation, and international hackathons.
            </p>
          </Card>

          <Card className="p-6 border-t-4 border-t-emerald-600" hoverable>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Lifelong Progression Pathways</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              From curious 7-year-olds in STEMPACT Kids & Teens, to undergraduates mastering DevOps, to executives learning
              AI automation, we support your entire technical journey.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. THE 8 ACADEMIC SCHOOLS */}
      <section className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Badge variant="purple">Academic Structure</Badge>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Our 8 Academic Schools
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Explore specialized disciplines designed for deep technical and vocational competence.
              </p>
            </div>
            <Link
              to="/schools"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
            >
              <span>View All 8 Schools in Detail</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schools.map((school) => {
              const Icon = schoolIconMap[school.code] || BookOpen;
              return (
                <Card key={school.id} className="p-6 flex flex-col justify-between" hoverable>
                  <div className="space-y-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: school.color }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        {school.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                        {school.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {school.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {school._count?.programs || 6} Programs
                    </span>
                    <Link
                      to={`/programs?school=${school.code}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CURRENTLY OPEN COHORTS (LIVE TICKER & CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden relative">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Now Accepting Applications</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Currently Open Cohorts (2025 Cycle)
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                Seats are strictly capped per cohort to maintain 1-on-1 instructor attention and dedicated laboratory
                equipment. Register before deadlines expire.
              </p>
            </div>

            <Link
              to="/cohorts"
              className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shrink-0 transition-colors shadow-sm"
            >
              View All Open Cohorts
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 relative z-10">
            {openCohorts.slice(0, 4).map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-white flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-200 mb-1">
                    <span>{cohort.cohortCode}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {cohort.availableSeats ?? 8} Seats Left
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white leading-snug line-clamp-2">
                    {cohort.name}
                  </h3>
                  <div className="text-[11px] text-slate-300 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>Starts: {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span className="truncate">{cohort.schedule}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tuition</div>
                    <div className="font-extrabold text-sm text-white">
                      ₦{(cohort.trainingFee || 0).toLocaleString()}
                    </div>
                  </div>
                  <Link
                    to={`/apply?cohortId=${cohort.id}&programId=${cohort.programId}`}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-colors"
                  >
                    Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED PROGRAMS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="green">Featured Curricula</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Popular Programs with Real Outcomes
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Engineered with industry leaders to guarantee actionable competence upon graduation.
            </p>
          </div>
          <Link to="/programs" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <span>Browse All 50 Academic Programs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredPrograms.slice(0, 6).map((prog) => (
            <Card key={prog.id} className="flex flex-col justify-between" hoverable>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {prog.code}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: prog.school?.color || '#2563eb' }}
                  >
                    {prog.school?.name.split(' ')[0]}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {prog.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {prog.description}
                </p>

                <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                  <div>
                    <strong className="text-slate-700">Duration:</strong> {prog.duration} ({prog.contactHours} Contact Hours)
                  </div>
                  <div>
                    <strong className="text-slate-700">Tools:</strong> {prog.tools}
                  </div>
                  <div>
                    <strong className="text-slate-700">Capstone:</strong> {prog.capstone}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/programs/${prog.code}`}
                  className="text-xs font-bold text-slate-700 hover:text-blue-600"
                >
                  View Syllabus & Capstone
                </Link>
                <Link
                  to={`/apply?programId=${prog.id}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  Enroll Now
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. LEARNING METHODOLOGY & STUDENT OUTCOMES */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="amber">The STEMPACT Methodology</Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              How We Turn Beginners into Proven Builders
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We reject rote memorization. Our 4-stage pedagogical framework ensures every student graduates with a
              publicly verifiable portfolio of functioning code, circuits, and prototypes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="text-3xl font-black text-rose-400">01</div>
              <h3 className="font-bold text-base text-white">Foundational Deconstruction</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Understand the physical, mathematical, and algorithmic principles before touching framework abstractions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="text-3xl font-black text-emerald-400">02</div>
              <h3 className="font-bold text-base text-white">Daily Guided Lab Practicum</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Build alongside industry-active instructors in our Ile-Ife lab stations with immediate code and schematic
                reviews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="text-3xl font-black text-blue-400">03</div>
              <h3 className="font-bold text-base text-white">Industry Capstone Project</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Solve a tangible African or global challenge (CleanTech, FinTech, Agritech, Smart Cities) as a team.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="text-3xl font-black text-amber-400">04</div>
              <h3 className="font-bold text-base text-white">Public Defense & Incubation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Defend your work before an expert jury, receive official cryptographic credentials, and pitch to Startup Lab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INNOVATION, COMPETITIONS & STARTUP PATHWAYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Pathway 1: Competitions & Hackathons */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-orange-50 border border-rose-200/80 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Competition Pathway</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Represent STEMPACT on National & Global Stages
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We sponsor and train student squads for International Robotics Olympiads, Huawei ICT Championships,
              Kaggle ML Contests, and African CleanTech challenges. High performers receive specialized laboratory
              stipends and mentor coaching.
            </p>
            <Link
              to="/competitions"
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              <span>Explore Competition Teams & Hall of Fame</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pathway 2: Startup Lab & Venture Building */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-emerald-50 border border-blue-200/80 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Entrepreneurship Pathway</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                From Final Project to Market-Ready Venture
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In the STEMPACT Startup Lab, software engineers team up with AI specialists, hardware designers, and
              marketers. We guide squads through legal CAC registration, Paystack payment integration, and seed capital
              pitch days.
            </p>
            <Link
              to="/innovation-lab"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <span>Discover the Innovation & Startup Lab</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      {cmsContent?.testimonials && cmsContent.testimonials.length > 0 && (
        <section className="bg-slate-50 py-16 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <Badge variant="blue">Student & Parent Voices</Badge>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Trusted by Students, Parents & Industry
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cmsContent.testimonials.map((t: any) => (
                <Card key={t.id} className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex text-amber-400">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{t.content}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{t.name}</div>
                      <div className="text-[10px] text-slate-500">{t.role}</div>
                      {t.organization && <div className="text-[10px] text-blue-600">{t.organization}</div>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. CORPORATE & INSTITUTIONAL PARTNERS */}
      {cmsContent?.partners && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Institutional, Technology & Government Ecosystem Partners
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
            {cmsContent.partners.map((p: any) => (
              <div
                key={p.id}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-rose-700 text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to Build Real-World STEM Skills?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Applications for the 2025 cohort cycle are open now. Take the online placement test today or visit our
              campus in Ile-Ife to inspect our robotics, clean energy, and software engineering laboratories.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/apply"
                className="px-8 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Start Online Application
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3.5 rounded-xl bg-blue-900/60 hover:bg-blue-900/80 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Contact Admissions Office
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
