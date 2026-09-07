import React from 'react';
import { Link } from 'react-router-dom';
import { STEMLogo } from '../../components/STEMLogo';
import { Badge, Card } from '../../components/UIElements';
import {
  MapPin,
  ShieldCheck,
  Target,
  Sparkles,
  Award,
  Users,
  Compass,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 lg:py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">About STEMPACT</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Pioneering Practical STEM Excellence in Africa
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Headquartered in the historic cradle of Ile-Ife, Osun State, STEMPACT Academy is a world-class educational
            ecosystem dedicated to empowering the next generation with technical mastery, engineering rigor, and
            entrepreneurial resilience.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 border-l-4 border-l-blue-600 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To be Africa’s foremost decentralized catalyst for STEM innovation, technical vocational craftsmanship,
              and venture creation—transforming local youth into globally competitive creators of technology.
            </p>
          </Card>

          <Card className="p-8 border-l-4 border-l-rose-600 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To deliver rigorous, project-driven training in software, artificial intelligence, robotics, clean energy,
              and digital media; equipping learners with practical competencies, verifiable portfolios, and startup
              incubation pathways.
            </p>
          </Card>
        </div>
      </section>

      {/* Why Ile-Ife & The Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <Badge variant="amber">The Location</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Rooted in Ile-Ife, Scaled for Global Reach
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ile-Ife is renowned globally as an epicenter of culture, intellect, and academic excellence, anchored by the
              esteemed Obafemi Awolowo University. STEMPACT Academy bridges this profound scholarly tradition with
              cutting-edge 21st-century applied technology.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our modern campus hub features high-speed fiber internet, dedicated robotics benches, a digital fabrication
              3D printing lab, solar inverter training yards, and collaborative sprint rooms. While Ile-Ife is our launchpad,
              our hybrid virtual infrastructure connects learners across all 36 Nigerian states and international borders.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>14 Fajuyi Road, Ile-Ife, Osun State, Nigeria</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 w-full max-w-sm text-center space-y-4">
              <div className="flex justify-center">
                <STEMLogo size="lg" showSubtitle={false} />
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                Official Academy Seal & Identity
              </div>
              <div className="text-[11px] text-slate-400">
                Preserving our colors: Science Red, Tech Green, Engineering Blue, Math Amber.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="green">Our Philosophy</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Core Values That Guide Us</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Action Over Theory</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We measure learning through functioning code, running motors, and deployed prototypes rather than exam sheets alone.
            </p>
          </Card>
          <Card className="p-6 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Inclusion & Youth Development</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Providing affordable tuition, gender-inclusive coding drives, and junior maker programs from age 7 upwards.
            </p>
          </Card>
          <Card className="p-6 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Uncompromising Rigor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We uphold international engineering standards in every line of code, circuit schematic, and safety procedure.
            </p>
          </Card>
          <Card className="p-6 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Venture Creation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Encouraging students to transition from job-seekers into founders of sustainable African tech enterprises.
            </p>
          </Card>
        </div>
      </section>

      {/* Academic Leadership */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="purple">Faculty & Leadership</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Governing Academic Council</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 font-black text-2xl flex items-center justify-center mx-auto">
              BO
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Babatunde Olatunji</h3>
              <p className="text-xs text-blue-600 font-semibold">President & Executive Director</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tech entrepreneur and educational visionary championing vocational STEM decentralization across southwestern Nigeria.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-700 font-black text-2xl flex items-center justify-center mx-auto">
              FA
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Dr. Folashade Adeleke</h3>
              <p className="text-xs text-rose-600 font-semibold">Director of Academic Affairs</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Researcher in Artificial Intelligence & Pedagogy with extensive experience designing outcome-based STEM curricula.
            </p>
          </Card>

          <Card className="p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 font-black text-2xl flex items-center justify-center mx-auto">
              DA
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Engr. Damilola Adeyemi</h3>
              <p className="text-xs text-emerald-600 font-semibold">Lead Faculty - Hardware & IoT</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Senior Embedded Systems Engineer, robotics mentor, and clean energy consultant with 8+ years hands-on field experience.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <Link
          to="/apply"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
        >
          <span>Join STEMPACT Academy</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
