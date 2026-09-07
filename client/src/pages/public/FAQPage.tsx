import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card } from '../../components/UIElements';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Admissions & Diagnostic Assessment',
      q: 'Why do I need to take a diagnostic assessment before starting?',
      a: 'Unlike traditional schools that group students solely by age or certificate titles, STEMPACT uses diagnostic readiness testing to determine your real technical aptitude. This guarantees that advanced learners are placed into accelerated Level 2 tracks, while beginners receive thorough foundational guidance.',
    },
    {
      category: 'Admissions & Diagnostic Assessment',
      q: 'What is the minimum age to enroll?',
      a: 'We welcome learners from age 7 upwards! Our specialized STEMPACT Kids and Teens school features age-appropriate curricula (Creative Computing, Game Design, Snap Circuits, and Junior Robotics) for ages 7–16. Our professional and university-level tracks serve learners aged 16 and above.',
    },
    {
      category: 'Tuition & Payment Plans',
      q: 'Can I pay my tuition in installments?',
      a: 'Yes. We provide flexible installment plans allowing students to pay 50% upon admission, and the remainder across subsequent monthly milestones during their cohort.',
    },
    {
      category: 'Tuition & Payment Plans',
      q: 'What does the tuition fee cover?',
      a: 'Tuition covers all physical laboratory bench usage in Ile-Ife, workstation power and backup inverter systems, high-speed fiber internet, cloud sandbox environments, instructor code reviews, capstone supervision, and official verifiable certification.',
    },
    {
      category: 'Schedules & Remote Learning',
      q: 'Can I attend if I live outside Ile-Ife or Osun State?',
      a: 'Yes! All our flagship software engineering, data science, and digital marketing programs offer interactive hybrid and virtual streams with live mentor sessions, recorded laboratories, and remote Git project collaboration.',
    },
    {
      category: 'Hardware & Equipment',
      q: 'Do I need my own laptop or robotics kits?',
      a: 'While having a personal laptop is encouraged for home practice, our Ile-Ife innovation center provides fully equipped computer workstations, soldering stations, 3D printers, oscilloscopes, and robotics kits for all enrolled students.',
    },
    {
      category: 'Certificates & Career Support',
      q: 'How are STEMPACT certificates verified by employers?',
      a: 'Every STEMPACT certificate bears a unique verifiable certificate number (e.g. STP-2027-0001). Employers and foreign universities can verify certificate authenticity instantly on our public registry at /verify/:certNumber.',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Frequently Asked Questions</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Everything You Need to Know
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Find immediate answers regarding our academic admissions, diagnostic assessments, cohort schedules, tuition
            policies, and laboratory infrastructure in Ile-Ife.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    {faq.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Still Have Questions Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Still Have Questions?</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our admissions counselors can discuss specific prerequisites, scholarship opportunities, or cohort schedules.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/contact"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Contact Admissions
            </Link>
            <Link
              to="/apply"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Apply Online
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
