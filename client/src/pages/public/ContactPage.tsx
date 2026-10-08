import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge, Card } from '../../components/UIElements';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  ArrowUpRight,
  Building2,
  Globe,
  Sparkles,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [centers, setCenters] = useState<any[]>([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Program Inquiries',
    message: '',
  });

  useEffect(() => {
    api.getCenters().then((res) => {
      setCenters(res?.centers || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      await api.submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject,
        message: formData.message.trim(),
      });
      setFormSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Program Inquiries',
        message: '',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Connect with STEMPACT</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Contact Our Admissions & Learning Centers
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Have questions regarding academic tracks, cohort timetables, fees, or corporate partnerships?
            Our admissions counselors and campus coordinators across our centers are here to assist you.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Col: Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Physical Learning Centers</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visit our state-of-the-art computer labs, robotics workbenches, and clean energy training yards.
                </p>
              </div>

              {/* Dynamic Centers List */}
              <div className="space-y-4">
                {centers.length > 0 ? (
                  centers.map((center: any) => {
                    const isVirtual = center.centerType === 'VIRTUAL_GLOBAL';
                    return (
                      <div key={center.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold">{center.name}</strong>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                            {center.code}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span>{center.address}</span>
                            {center.neighborhood && <span className="text-slate-400"> • {center.neighborhood}</span>}
                            <span className="block text-slate-500 font-medium">
                              {center.cityOrTown}{center.stateOrRegion ? `, ${center.stateOrRegion}` : ''} ({center.country || 'Nigeria'})
                            </span>
                          </div>
                        </div>
                        {center.landmark && (
                          <div className="text-[11px] text-slate-500 pl-6">
                            📍 Landmark: {center.landmark}
                          </div>
                        )}
                        {center.sponsorPartnerName && (
                          <div className="text-[11px] text-emerald-700 font-semibold pl-6 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>Partner: {center.sponsorPartnerName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">Fajuyi Main Campus Hub</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                        IFE-MAIN
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span>14 Fajuyi Road, Central District, Ile-Ife, Osun State</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">Phone & WhatsApp:</strong>
                    <span>+234 803 123 4567 • +234 816 567 8901</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">Official Emails:</strong>
                    <span>admissions@stempact.org • info@stempact.org</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-semibold mb-0.5">Office & Lab Hours:</strong>
                    <span>Monday – Friday: 8:00 AM – 6:00 PM WAT</span>
                    <span className="block">Saturdays: 9:00 AM – 4:00 PM WAT</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://chat.whatsapp.com/C1ntPtG3qkh1Aguvh5zxN9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Join Our WhatsApp Channel</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>
          </div>

          {/* Right Col: Inquiry Form */}
          <div className="lg:col-span-7">
            <Card className="p-8 sm:p-10 shadow-md">
              {formSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Thank you for reaching out to STEMPACT Academy. An admissions officer will respond to your inquiry
                    within 24 hours.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Send an Academic Inquiry</h3>
                    <p className="text-xs text-slate-500">We typically reply within 2 to 4 business hours.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+234 ..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Subject *</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="Program Inquiries">Program & Syllabus Inquiries</option>
                        <option value="Cohort Schedule">Cohort Schedules & Dates</option>
                        <option value="Tuition & Installments">Tuition & Installment Plans</option>
                        <option value="Corporate Partnership">Corporate Training / Partnership</option>
                        <option value="Kids & Teens Academy">STEMPACT Kids & Teens Enrollment</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-slate-700">Your Message *</label>
                      <textarea
                        rows={4}
                        placeholder="Tell us how we can assist your learning or partnership goals..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                        required
                      ></textarea>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Inquiry...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
