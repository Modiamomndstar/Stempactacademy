import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card } from '../../components/UIElements';
import {
  FileText,
  Sparkles,
  UserCheck,
  Award,
  BookOpen,
  CreditCard,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const AdmissionsPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Submit Online Application',
      description:
        'Complete our streamlined online form selecting your desired academic school, program track, preferred schedule, and background experience. For learners under 18, parental/guardian consent is securely captured.',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      step: '02',
      title: 'Diagnostic Readiness Assessment',
      description:
        'Take our 30-minute online placement assessment spanning digital literacy, logical reasoning, mathematics, and technical problem decomposition. Our assessment engine calculates your readiness profile.',
      icon: Sparkles,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      step: '03',
      title: 'Academic Board Placement Review',
      description:
        'To ensure optimal learning outcomes, an authorized STEMPACT academic board member reviews your diagnostic score, personal objectives, and interview notes to approve your ideal starting level (Level 1 Foundation, Level 2 Accelerated, or Specialist Track).',
      icon: UserCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      step: '04',
      title: 'Official Admission Letter & Student ID',
      description:
        'Upon approval, your official admission record is issued with your unique Student ID (e.g. STP-2025-0142), downloadable PDF Admission Letter, assigned laboratory bench, instructor, and schedule.',
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      step: '05',
      title: 'Onboarding & Dashboard Activation',
      description:
        'Log in to your Student Portal to access your syllabus, course modules, class timetable, student handbook, and join your cohort’s private faculty WhatsApp communication channel.',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Admissions 2025 Cycle</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Your Roadmap to STEMPACT Admission
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            We operate a merit-transparent admission pipeline designed to match every learner with their highest-impact
            starting level. Follow our 5-step journey below.
          </p>
          <div className="pt-4">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              <span>Begin Application Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5-Step Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="green">Step-by-Step Procedure</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">How Admission Works</h2>
        </div>

        <div className="space-y-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${s.bgColor} ${s.color} flex items-center justify-center font-black text-xl shrink-0`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                      Step {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tuition, Flexible Installments & Scholarships */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <Badge variant="amber">Financial Integrity</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900">Tuition & Flexible Payments</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              STEMPACT Academy is committed to educational accessibility. We provide transparent fee schedules with
              zero hidden charges. All tuition covers high-speed laboratory internet, workstation power, cloud developer
              credits, physical lab consumables, and official verifiable certification.
            </p>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Flexible Installment Plans (Pay in 2 to 3 tranches)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Integrated Nigerian Payment Gateways (Paystack, Bank Transfer)</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Academic Merit Discounts up to 20% on selected cohorts</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 text-center">
            <h3 className="font-bold text-slate-900 text-sm">Need Guidance on Choosing a Program?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our academic counselors in Ile-Ife can review your educational goals and recommend the optimal track.
            </p>
            <a
              href="https://wa.me/2348031234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              Chat with Admissions Counselor
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
