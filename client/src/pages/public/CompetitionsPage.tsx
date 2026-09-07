import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card } from '../../components/UIElements';
import {
  Award,
  Trophy,
  Calendar,
  Users,
  Target,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export const CompetitionsPage: React.FC = () => {
  const competitions = [
    {
      id: 'COMP-01',
      title: 'International Robotics Olympiad (IRO)',
      category: 'Robotics & Embedded Systems',
      status: 'Team in Active Training',
      date: 'November 2025',
      teamName: 'STEMPACT RoboSquad Alpha',
      membersCount: 4,
      projectFocus: 'Autonomous Obstacle Navigation & Gripper Rover',
      award: '2024 Southwest Nigeria Gold Medalist',
    },
    {
      id: 'COMP-02',
      title: 'Ile-Ife CleanTech & Smart Energy Hackathon',
      category: 'Renewable Energy & IoT',
      status: 'Open Registrations',
      date: 'October 2025',
      teamName: 'MicroGrid Squad 1',
      membersCount: 5,
      projectFocus: 'Decentralized Solar Telemetry with GSM Load Shedding',
      award: 'Prize Pool: ₦2,500,000 in Seed Capital',
    },
    {
      id: 'COMP-03',
      title: 'Huawei ICT Global Collegiate Challenge',
      category: 'Cloud Computing & Networking',
      status: 'Qualifying Round',
      date: 'December 2025',
      teamName: 'STEMPACT Cloud Knights',
      membersCount: 3,
      projectFocus: 'Enterprise VPC Security & Kubernetes Resiliency',
      award: 'National Finalist Qualification',
    },
    {
      id: 'COMP-04',
      title: 'African AI & Agritech Innovation Challenge',
      category: 'Artificial Intelligence & Vision',
      status: 'Submission In Review',
      date: 'September 2025',
      teamName: 'AgriVision Lab',
      membersCount: 4,
      projectFocus: 'Early Fall Armyworm Detection Using YOLOv8 on Edge Hardware',
      award: 'Top 10 Continental Shortlist',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="red">Elite Competitive Engineering</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Competitions, Hackathons & Olympiads
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            We coach and sponsor high-performing student squads to compete on state, national, and international stages—proving
            that world-class engineering solutions originate right here in Ile-Ife.
          </p>

          <div className="pt-4">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>Join a Competition Team</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Competitions Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="blue">Active Rosters</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Current Competitive Challenges</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {competitions.map((comp) => (
            <Card key={comp.id} className="p-8 space-y-5 border border-slate-200" hoverable>
              <div className="flex items-center justify-between">
                <Badge variant="purple">{comp.category}</Badge>
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{comp.status}</span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {comp.title}
                </h3>
                <div className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Competition Date: {comp.date}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Assigned Team:</span>
                  <span className="font-bold text-slate-800">{comp.teamName} ({comp.membersCount} Engineers)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Prototype Focus:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{comp.projectFocus}</span>
                </div>
                <div className="flex items-center justify-between text-amber-700 font-bold pt-1 border-t border-slate-200/60">
                  <span>Record / Honors:</span>
                  <span>{comp.award}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  to="/apply"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Apply for Squad Tryouts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-slate-400 font-medium">STEMPACT Team Registry</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
