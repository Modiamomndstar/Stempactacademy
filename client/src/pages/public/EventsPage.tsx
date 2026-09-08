import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { EventItem } from '../../types';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Users,
  Sparkles,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getCMSContent();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="blue">Academy Calendar</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Events, Workshops & Demo Days
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join hackathons, CleanTech symposia, youth maker fairs, and international tech masterclasses hosted at our
            Ile-Ife campus and streamed globally.
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <LoadingSpinner message="Loading upcoming events..." />
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No scheduled events at this moment</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((e) => (
              <Card key={e.id} className="p-6 flex flex-col justify-between space-y-4" hoverable>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="purple">{e.category}</Badge>
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{e.startDate ? new Date(e.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {e.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {e.description}
                  </p>

                  <div className="pt-2 text-xs text-slate-500 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{e.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/apply"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Register to Attend</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[11px] font-semibold text-emerald-600">Open Access</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
