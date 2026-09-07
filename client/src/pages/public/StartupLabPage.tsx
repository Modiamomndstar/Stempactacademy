import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card } from '../../components/UIElements';
import {
  Rocket,
  Users,
  Target,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const StartupLabPage: React.FC = () => {
  const roles = [
    { title: 'Founder & CEO', desc: 'Leads strategic vision, investor relations, and capital allocation.' },
    { title: 'Product Manager (PM)', desc: 'Owns user research, PRD documentation, and sprint backlogs.' },
    { title: 'Software Developer', desc: 'Builds full-stack web, mobile architectures, and resilient APIs.' },
    { title: 'AI & Data Engineer', desc: 'Trains ML algorithms, optimizes prompt pipelines, and builds data warehouses.' },
    { title: 'Hardware Engineer', desc: 'Designs schematics, solders PCB circuits, and manages 3D prints.' },
    { title: 'UI/UX Designer', desc: 'Creates high-fidelity wireframes, interactive user journeys, and brand assets.' },
    { title: 'Growth & Marketing Lead', desc: 'Runs user acquisition funnels, digital campaigns, and social channels.' },
    { title: 'Finance & Operations', desc: 'Builds financial unit economics, CAC/LTV models, and compliance.' },
  ];

  const ventureStages = [
    {
      stage: '01. Problem & Customer Discovery',
      detail: 'Conduct 50+ user validation interviews in Ile-Ife and surrounding commercial hubs to verify genuine willingness to pay.',
    },
    {
      stage: '02. Rapid Prototype & Lab Validation',
      detail: 'Assemble functional proof-of-concept prototypes in our laboratory stations within 2 to 4 sprint cycles.',
    },
    {
      stage: '03. MVP Launch & Payment Gateway Integration',
      detail: 'Deploy production cloud application with Paystack or Flutterwave automated payment infrastructure.',
    },
    {
      stage: '04. Unit Economics & Traction Growth',
      detail: 'Measure Daily Active Users, Monthly Recurring Revenue (MRR), and customer retention cohorts.',
    },
    {
      stage: '05. Investor Demo Day & Seed Pitch',
      detail: 'Pitch before a syndicate of angel investors, African venture capital funds, and grant partners.',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Venture Studio</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            STEMPACT Startup Lab
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            We don’t just train employees; we incubate tech founders. In the Startup Lab, student teams across software,
            hardware, AI, design, and business collaborate to build viable African technology enterprises.
          </p>

          <div className="pt-4">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              <span>Apply for Startup Lab Incubation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Multidisciplinary Team Roles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="purple">Cross-Functional Squads</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Startup Squad Team Architecture</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Great technology companies require complementary skillsets. We assemble squads reflecting genuine tech startups.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((r, i) => (
            <Card key={i} className="p-6 space-y-2" hoverable>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{r.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 5-Stage Incubation Blueprint */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/80 space-y-8">
          <div className="space-y-2">
            <Badge variant="amber">The Venture Pipeline</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900">From Lab Project to Bankable Enterprise</h2>
          </div>

          <div className="space-y-4">
            {ventureStages.map((v, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 flex items-start gap-4 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{v.stage}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Incorporation & Seed Investor Link */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black">Pitch at the STEMPACT Demo Day</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every cohort concludes with an in-person Demo Day in Ile-Ife, attended by venture capitalists, tech founders,
              and angel syndicates. Top prototypes receive follow-on incubation workspace and cloud infrastructure grants.
            </p>
          </div>
          <Link
            to="/apply"
            className="px-8 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs shrink-0 transition-colors shadow-md"
          >
            Apply for Next Venture Batch
          </Link>
        </div>
      </section>
    </div>
  );
};
