import React from 'react';
import { Link } from 'react-router-dom';
import { STEMLogo } from './STEMLogo';
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Globe,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      {/* 4 Quadrants Color Ribbon */}
      <div className="grid grid-cols-4 h-1.5 w-full">
        <div className="bg-rose-500" title="Science"></div>
        <div className="bg-emerald-500" title="Technology"></div>
        <div className="bg-blue-600" title="Engineering"></div>
        <div className="bg-amber-500" title="Mathematics"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/95 rounded-xl p-3 inline-block shadow-inner">
              <STEMLogo size="md" showSubtitle={false} />
            </div>

            <h3 className="text-white font-extrabold text-lg tracking-tight">
              STEMPACT ACADEMY
            </h3>
            <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
              Stem Skills for Real World Impact
            </p>
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              Premier STEM, digital skills, technical, vocational, innovation and entrepreneurship academy.
              Empowering youth, students, and professionals in Ile-Ife, Osun State, and across Africa to build
              sustainable technologies and global careers.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/verify"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/50 border border-blue-700/50 text-blue-300 text-xs font-medium hover:bg-blue-800/50 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Verify Student Certificate</span>
              </Link>
              <Link
                to="/admissions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 text-xs font-medium hover:bg-emerald-800/50 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admissions 2025</span>
              </Link>
            </div>
          </div>

          {/* Col 2: Academic Schools */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Academic Schools
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  Computing & Software Engineering
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  AI, Data & Machine Learning
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  Robotics, IoT & Hardware
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  Renewable Energy & Solar
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  Digital Media & AI Productivity
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  Business & Entrepreneurship
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  STEMPACT Kids & Teens
                </Link>
              </li>
              <li>
                <Link to="/schools" className="hover:text-white transition-colors">
                  Innovation & Startup Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Academy Hub */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Academy Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/cohorts" className="hover:text-white flex items-center gap-1">
                  <span>Current Cohorts</span>
                  <span className="text-[9px] bg-rose-500 text-white px-1 rounded font-bold">Open</span>
                </Link>
              </li>
              <li>
                <Link to="/assessment" className="hover:text-white">
                  Online Diagnostic Assessment
                </Link>
              </li>
              <li>
                <Link to="/innovation-lab" className="hover:text-white">
                  Innovation & Hardware Lab
                </Link>
              </li>
              <li>
                <Link to="/competitions" className="hover:text-white">
                  Competitions & Hackathons
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-white">
                  Student Project Showcase
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white">
                  Workshops & Demo Days
                </Link>
              </li>
              <li>
                <Link to="/portal/login" className="hover:text-white text-blue-400 font-semibold">
                  Student & Staff Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Campus */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Ile-Ife Campus Hub
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  STEMPACT Innovation Hub, 14 Fajuyi Road, Ile-Ife, Osun State, Nigeria
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+234 803 123 4567 / +234 816 567 8901</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>admissions@stempact.org</span>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/2348031234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  <span>Chat on WhatsApp</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} STEMPACT ACADEMY. All rights reserved. Stem Skills for Real World Impact.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/faq" className="hover:text-white">FAQs</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <span>•</span>
            <Link to="/verify" className="hover:text-white">Certificate Verification</Link>
            <span>•</span>
            <span className="text-slate-600">v1.0.0-mvp</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
