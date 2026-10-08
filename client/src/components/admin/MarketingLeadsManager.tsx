import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../UIElements';
import {
  PhoneCall,
  Mail,
  MessageSquare,
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Send,
  X,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  DollarSign,
  Flame,
  Phone,
  RefreshCw,
} from 'lucide-react';

interface MarketingLeadsManagerProps {
  currentUser: any;
  onRefresh?: () => Promise<void>;
}

export const MarketingLeadsManager: React.FC<MarketingLeadsManagerProps> = ({ currentUser, onRefresh }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [funnelFilter, setFunnelFilter] = useState<string>('ALL');
  const [minorsOnly, setMinorsOnly] = useState<boolean>(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Follow-up Log Modal State
  const [logModalLead, setLogModalLead] = useState<any | null>(null);
  const [contactChannel, setContactChannel] = useState<'PHONE_CALL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'IN_PERSON'>('PHONE_CALL');
  const [contactTarget, setContactTarget] = useState<'APPLICANT' | 'PARENT_GUARDIAN' | 'SPONSOR'>('APPLICANT');
  const [callOutcome, setCallOutcome] = useState<'CONNECTED_INTERESTED' | 'CONNECTED_COMMITTED_PAYMENT' | 'NO_ANSWER' | 'LEFT_VOICEMAIL' | 'REQUESTED_CALLBACK' | 'NOT_INTERESTED' | 'WRONG_NUMBER'>('CONNECTED_INTERESTED');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [savingLog, setSavingLog] = useState<boolean>(false);

  // Send Direct Email Modal State
  const [emailModalLead, setEmailModalLead] = useState<any | null>(null);
  const [emailRecipientType, setEmailRecipientType] = useState<'APPLICANT' | 'PARENT' | 'BOTH'>('APPLICANT');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  // Status Update Inline State
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  const loadLeads = async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await api.getMarketingLeads({
        search: search.trim() || undefined,
        marketingStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
        funnelStage: funnelFilter !== 'ALL' ? funnelFilter : undefined,
        isMinor: minorsOnly ? 'true' : undefined,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load marketing leads:', err);
      setActionError(err.message || 'Failed to fetch marketing leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [statusFilter, funnelFilter, minorsOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  // Helper to format WhatsApp phone numbers (stripping +, leading 0, spaces)
  const formatWhatsAppUrl = (phone: string, name?: string) => {
    if (!phone) return '#';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1);
    }
    const greeting = name ? `Hello ${name}, this is STEMPACT Academy Admissions & Marketing Team.` : 'Hello, this is STEMPACT Academy Admissions Team.';
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(greeting)}`;
  };

  // Handle Marketing Status Inline Change
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingStatusId(applicationId);
    try {
      await api.updateLeadMarketingStatus(applicationId, { marketingStatus: newStatus });
      setActionSuccess('Lead marketing status updated.');
      setTimeout(() => setActionSuccess(''), 3000);
      setData((prev: any) => ({
        ...prev,
        leads: prev.leads.map((l: any) => (l.id === applicationId ? { ...l, marketingStatus: newStatus } : l)),
      }));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Submit Follow-Up Interaction Log
  const handleRecordFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logModalLead) return;
    setSavingLog(true);
    try {
      await api.recordLeadFollowUp({
        applicationId: logModalLead.id,
        contactChannel,
        contactTarget,
        outcome: callOutcome,
        notes: followUpNotes,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
      });
      setActionSuccess('Follow-up call interaction logged successfully.');
      setTimeout(() => setActionSuccess(''), 3500);
      setLogModalLead(null);
      setFollowUpNotes('');
      setNextFollowUpDate('');
      loadLeads();
    } catch (err: any) {
      alert('Failed to record follow-up: ' + err.message);
    } finally {
      setSavingLog(false);
    }
  };

  // Submit Direct Follow-Up Email via Resend
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalLead || !emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    try {
      await api.sendLeadFollowUpEmail({
        applicationId: emailModalLead.id,
        recipientTarget: emailRecipientType === 'PARENT' ? 'PARENT' : 'APPLICANT',
        subject: emailSubject,
        message: emailBody,
      });
      setActionSuccess('Outreach email dispatched successfully via Resend.');
      setTimeout(() => setActionSuccess(''), 3500);
      setEmailModalLead(null);
      setEmailSubject('');
      setEmailBody('');
    } catch (err: any) {
      alert('Failed to dispatch email: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  // Open Email Modal with Context Pre-filled
  const openEmailModal = (lead: any) => {
    setEmailModalLead(lead);
    setEmailRecipientType(lead.isMinor && lead.parentEmail ? 'BOTH' : 'APPLICANT');
    if (lead.funnelStage === 'ASSESSMENT_PENDING') {
      setEmailSubject(`Complete Your STEMPACT Diagnostic Assessment — ${lead.program?.name || 'Program Intake'}`);
      setEmailBody(`Dear ${lead.fullName},\n\nWe noticed you started your application for ${lead.program?.name || 'STEMPACT Academy'}, but have not yet completed your diagnostic readiness assessment.\n\nCompleting this short assessment takes about 15 minutes and helps our Academic Faculty place you in the best academic cohort level.\n\nPlease log in to your candidate portal at https://stempactacademy.onrender.com/portal/applicant to complete your assessment today.\n\nWarm regards,\nSTEMPACT Academy Admissions Team`);
    } else if (lead.funnelStage === 'ADMISSION_OFFERED') {
      setEmailSubject(`Your Admission Offer is Ready — Secure Your Seat at STEMPACT Academy`);
      setEmailBody(`Dear ${lead.fullName},\n\nCongratulations! Your provisional admission into ${lead.program?.name || 'the program'} has been approved.\n\nTo secure your placement in the upcoming cohort, please complete your tuition clearance or select an installment payment plan in your applicant dashboard.\n\nLog in now: https://stempactacademy.onrender.com/portal/applicant\n\nBest regards,\nSTEMPACT Academy Admissions Team`);
    } else {
      setEmailSubject(`Following Up On Your Application — STEMPACT Academy`);
      setEmailBody(`Dear ${lead.fullName},\n\nThank you for choosing STEMPACT Academy. Our admissions advisors are available to answer any questions you or your parents may have regarding cohort schedules, fees, or course progression.\n\nFeel free to reply directly to this email or call our admissions hotline.\n\nWarm regards,\nSTEMPACT Academy Team`);
    }
  };

  const metrics = data?.metrics || {};
  const leads = data?.leads || [];
  const registeredOnly = data?.registeredOnlyUsers || [];

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Funnel Analytics Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Total Pipeline</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{metrics.totalLeads ?? 0}</div>
          <div className="text-[10px] text-slate-500">{metrics.totalApplications ?? 0} submitted apps</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">New Today</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600">{metrics.newLeadsToday ?? 0}</div>
          <div className="text-[10px] text-slate-500">Last 24 hours</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Pending Test</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600">{metrics.assessmentPendingCount ?? 0}</div>
          <div className="text-[10px] text-slate-500">Need assessment nudge</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Admitted (Pending Fee)</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-600">{metrics.admissionOfferedCount ?? 0}</div>
          <div className="text-[10px] text-slate-500">Offer letter ready</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Hot: Committed</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-600">{metrics.paymentCommittedCount ?? 0}</div>
          <div className="text-[10px] text-slate-500">Promised payment</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Minors (Parents)</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">{metrics.minorsWithParentsCount ?? 0}</div>
          <div className="text-[10px] text-slate-500">Parent phone on file</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, parent name/phone, application number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Leads</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setFunnelFilter('ALL');
              setMinorsOnly(false);
              loadLeads();
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Funnel:
          </span>
          <select
            value={funnelFilter}
            onChange={(e) => setFunnelFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-200"
          >
            <option value="ALL">All Funnel Stages</option>
            <option value="ASSESSMENT_PENDING">Assessment Pending</option>
            <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
            <option value="ADMISSION_OFFERED">Admission Offered</option>
            <option value="TUITION_PARTIALLY_PAID">Tuition Partially Paid</option>
            <option value="TUITION_CLEARED">Tuition Fully Cleared</option>
          </select>

          <span className="text-slate-400 font-semibold ml-2">CRM Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-200"
          >
            <option value="ALL">All CRM Statuses</option>
            <option value="NEW_LEAD">New Lead</option>
            <option value="CONTACTED">Contacted</option>
            <option value="INTERESTED">Interested</option>
            <option value="FOLLOWING_UP">Following Up</option>
            <option value="PAYMENT_COMMITTED">Payment Committed</option>
            <option value="CONVERTED_ENROLLED">Converted / Enrolled</option>
            <option value="DROPPED_OUT">Dropped Out</option>
            <option value="COLD_UNRESPONSIVE">Cold / Unresponsive</option>
          </select>

          <label className="flex items-center gap-1.5 ml-auto cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={minorsOnly}
              onChange={(e) => setMinorsOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-blue-600"
            />
            <span>Minors Only (Has Guardian Contact)</span>
          </label>
        </div>
      </div>

      {/* Main Leads List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading marketing leads dossier...
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No Leads Found</h3>
          <p className="text-xs text-slate-400">No applicants match your current search and filter settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Showing {leads.length} Active Applicant Leads</span>
            <span>Click any lead row to view call history & follow-up logs</span>
          </div>

          <div className="space-y-3">
            {leads.map((lead: any) => {
              const isExpanded = expandedLeadId === lead.id;
              const hasFollowUps = Array.isArray(lead.followUps) && lead.followUps.length > 0;

              const getStageBadge = (stage: string) => {
                switch (stage) {
                  case 'ASSESSMENT_PENDING':
                    return <Badge variant="red">Test Pending</Badge>;
                  case 'ASSESSMENT_COMPLETED':
                    return <Badge variant="blue">Test Passed</Badge>;
                  case 'ADMISSION_OFFERED':
                    return <Badge variant="purple">Admitted</Badge>;
                  case 'TUITION_PARTIALLY_PAID':
                    return <Badge variant="amber">Partial Paid</Badge>;
                  case 'TUITION_CLEARED':
                    return <Badge variant="green">Cleared / Enrolled</Badge>;
                  default:
                    return <Badge variant="slate">{stage}</Badge>;
                }
              };

              const getCrmStatusColor = (st: string) => {
                switch (st) {
                  case 'PAYMENT_COMMITTED':
                    return 'bg-amber-100 text-amber-900 border-amber-300';
                  case 'CONVERTED_ENROLLED':
                    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
                  case 'INTERESTED':
                  case 'FOLLOWING_UP':
                    return 'bg-blue-100 text-blue-900 border-blue-300';
                  case 'CONTACTED':
                    return 'bg-purple-100 text-purple-900 border-purple-300';
                  case 'DROPPED_OUT':
                  case 'COLD_UNRESPONSIVE':
                    return 'bg-slate-100 text-slate-700 border-slate-300';
                  default:
                    return 'bg-slate-100 text-slate-800 border-slate-200';
                }
              };

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-blue-300"
                >
                  {/* Lead Main Header Bar */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Applicant & Program Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                        {lead.fullName?.charAt(0) || 'L'}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm">{lead.fullName}</h4>
                          {lead.isMinor && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Minor (Under 18)
                            </span>
                          )}
                          {getStageBadge(lead.funnelStage)}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="font-semibold text-slate-700">{lead.program?.name || 'General Program'}</span>
                          {lead.cohort && <span>• Cohort: <strong className="text-slate-700">{lead.cohort.name}</strong></span>}
                          {lead.preferredCenter && (
                            <span>• Center: <strong className="text-slate-700">{lead.preferredCenter.cityOrTown || lead.preferredCenter.name}</strong></span>
                          )}
                          <span className="text-slate-400 font-mono text-[10px]">#{lead.applicationNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Channels (Phone, WhatsApp, Email) */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Applicant Direct Call & WhatsApp */}
                      {lead.phone && (
                        <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                          <a
                            href={`tel:${lead.phone}`}
                            title={`Call Applicant: ${lead.phone}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={formatWhatsAppUrl(lead.phone, lead.fullName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat with Applicant on WhatsApp"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition font-bold text-[10px] flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}

                      {/* Parent / Guardian Direct Call & WhatsApp (if minor or present) */}
                      {lead.parentPhone && (
                        <div className="flex items-center gap-1 p-1 bg-rose-50 border border-rose-200 rounded-xl">
                          <span className="text-[10px] font-bold text-rose-700 px-1">Guardian:</span>
                          <a
                            href={`tel:${lead.parentPhone}`}
                            title={`Call Parent: ${lead.parentName} (${lead.parentPhone})`}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={formatWhatsAppUrl(lead.parentPhone, lead.parentName || 'Parent')}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp Parent"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition font-bold text-[10px] flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Parent WA</span>
                          </a>
                        </div>
                      )}

                      {/* Direct Email via Resend */}
                      <button
                        type="button"
                        onClick={() => openEmailModal(lead)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Email</span>
                      </button>

                      {/* Log Interaction Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => setLogModalLead(lead)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Log Call</span>
                      </button>

                      {/* Status Selector */}
                      <select
                        value={lead.marketingStatus}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        disabled={updatingStatusId === lead.id}
                        className={`text-xs font-bold p-2 rounded-xl border transition cursor-pointer ${getCrmStatusColor(
                          lead.marketingStatus
                        )}`}
                      >
                        <option value="NEW_LEAD">New Lead</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="FOLLOWING_UP">Following Up</option>
                        <option value="PAYMENT_COMMITTED">Payment Committed</option>
                        <option value="CONVERTED_ENROLLED">Converted / Enrolled</option>
                        <option value="DROPPED_OUT">Dropped Out</option>
                        <option value="COLD_UNRESPONSIVE">Cold / Unresponsive</option>
                      </select>

                      {/* Expand / Collapse History */}
                      <button
                        type="button"
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>Email: <strong className="text-slate-800">{lead.email}</strong></span>
                      <span>Phone: <strong className="text-slate-800">{lead.phone || '—'}</strong></span>
                      {lead.isMinor && lead.parentName && (
                        <span>Parent: <strong className="text-rose-800">{lead.parentName} ({lead.parentRelationship || 'Guardian'}) · {lead.parentPhone}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {lead.latestAttempt && (
                        <span>Test Score: <strong className="text-blue-700">{lead.latestAttempt.percentage}% ({lead.latestAttempt.recommendedLevel?.replace(/_/g, ' ') || 'Level 1'})</strong></span>
                      )}
                      {lead.invoice && (
                        <span>Tuition: <strong className="text-slate-800">₦{lead.invoice.amountPaid?.toLocaleString()} paid</strong> / ₦{lead.invoice.balance?.toLocaleString()} bal</span>
                      )}
                      {hasFollowUps && (
                        <span className="text-blue-600 font-semibold">{lead.followUps.length} follow-up(s) logged</span>
                      )}
                    </div>
                  </div>

                  {/* Expandable Interaction Log History */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Admissions & Follow-Up Interaction History</span>
                        </h5>
                        <button
                          type="button"
                          onClick={() => setLogModalLead(lead)}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          + Log New Follow-Up
                        </button>
                      </div>

                      {hasFollowUps ? (
                        <div className="space-y-2">
                          {lead.followUps.map((log: any) => (
                            <div
                              key={log.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{log.contactChannel?.replace(/_/g, ' ')}</span>
                                  <span className="text-slate-400">→</span>
                                  <span className="text-slate-700 font-semibold">{log.contactTarget?.replace(/_/g, ' ')}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                    {log.outcome?.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleString('en-GB')} by {log.recordedBy?.firstName} {log.recordedBy?.lastName}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-[11px]">{log.notes}</p>
                              {log.nextFollowUpDate && (
                                <p className="text-[10px] text-amber-700 font-semibold">
                                  📅 Callback Scheduled: {new Date(log.nextFollowUpDate).toLocaleDateString('en-GB')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">
                          No previous calls or follow-ups logged for this lead yet. Click "Log Call" to record outreach.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top of Funnel: Registered Users (No Application Yet) */}
      {registeredOnly.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Registered Candidates (Not Yet Completed Application)</span>
              </h3>
              <p className="text-xs text-slate-500">
                These users registered an account but haven't chosen a program or submitted an application. High conversion priority.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              {registeredOnly.length} Leads
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {registeredOnly.map((u: any) => (
              <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{u.firstName} {u.lastName}</span>
                  <span className="text-[10px] text-slate-400">
                    Registered {new Date(u.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] truncate">{u.email}</div>
                {u.phone && <div className="text-slate-600 text-[11px] font-mono">{u.phone}</div>}
                <div className="flex items-center gap-2 pt-1">
                  {u.phone && (
                    <>
                      <a
                        href={`tel:${u.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] hover:bg-blue-100 transition"
                      >
                        Call
                      </a>
                      <a
                        href={formatWhatsAppUrl(u.phone, u.firstName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] hover:bg-emerald-100 transition"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                  <a
                    href={`mailto:${u.email}?subject=Welcome%20to%20STEMPACT%20Academy%20%E2%80%94%20Complete%20Your%20Application`}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] hover:bg-slate-200 transition"
                  >
                    Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: LOG FOLLOW-UP CALL / INTERACTION */}
      {logModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-blue-600" />
                  <span>Log Follow-Up Interaction</span>
                </h3>
                <p className="text-xs text-slate-500">Applicant: <strong>{logModalLead.fullName}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setLogModalLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordFollowUp} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Contact Channel</label>
                  <select
                    value={contactChannel}
                    onChange={(e: any) => setContactChannel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="EMAIL">Email Outreach</option>
                    <option value="SMS">SMS Text</option>
                    <option value="IN_PERSON">In-Person Visit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Person</label>
                  <select
                    value={contactTarget}
                    onChange={(e: any) => setContactTarget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="APPLICANT">Applicant Directly</option>
                    <option value="PARENT_GUARDIAN">Parent / Guardian</option>
                    <option value="SPONSOR">Corporate / NGO Sponsor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Interaction Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e: any) => setCallOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CONNECTED_INTERESTED">Connected & Highly Interested</option>
                  <option value="CONNECTED_COMMITTED_PAYMENT">Connected & Promised Payment</option>
                  <option value="REQUESTED_CALLBACK">Requested Callback Later</option>
                  <option value="NO_ANSWER">Ringing / No Answer</option>
                  <option value="LEFT_VOICEMAIL">Left Voicemail / SMS</option>
                  <option value="NOT_INTERESTED">Not Interested / Declining</option>
                  <option value="WRONG_NUMBER">Wrong Phone Number</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Call / Meeting Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the candidate's situation, payment intentions, concerns raised, or promises made..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Schedule Next Callback (Optional)</label>
                <input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLogModalLead(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLog || !followUpNotes.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {savingLog ? 'Saving Log...' : 'Save Interaction Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND DIRECT EMAIL OUTREACH VIA RESEND */}
      {emailModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Send Direct Email Outreach</span>
                </h3>
                <p className="text-xs text-slate-500">Applicant: <strong>{emailModalLead.fullName}</strong> ({emailModalLead.email})</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              {emailModalLead.isMinor && emailModalLead.parentEmail && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Target</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="recip"
                        checked={emailRecipientType === 'APPLICANT'}
                        onChange={() => setEmailRecipientType('APPLICANT')}
                        className="accent-blue-600"
                      />
                      <span>Applicant Only ({emailModalLead.email})</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="recip"
                        checked={emailRecipientType === 'PARENT'}
                        onChange={() => setEmailRecipientType('PARENT')}
                        className="accent-blue-600"
                      />
                      <span>Parent Only ({emailModalLead.parentEmail})</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="recip"
                        checked={emailRecipientType === 'BOTH'}
                        onChange={() => setEmailRecipientType('BOTH')}
                        className="accent-blue-600"
                      />
                      <span>Both (Applicant + Parent)</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject *</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Message Content *</label>
                <textarea
                  required
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-300 leading-relaxed"
                />
                <p className="text-[10px] text-slate-400">
                  This message will be dispatched directly through STEMPACT's Resend email infrastructure.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEmailModalLead(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Sending Email...' : 'Send Outreach Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
