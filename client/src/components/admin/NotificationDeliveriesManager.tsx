import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Mail,
  Smartphone,
  Eye,
  Send,
  MessageSquare,
} from 'lucide-react';

interface NotificationDeliveriesManagerProps {
  deliveries: any[];
  onRefresh: () => void;
  currentUser: any;
}

export const NotificationDeliveriesManager: React.FC<NotificationDeliveriesManagerProps> = ({
  deliveries,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);

  const filteredDeliveries = deliveries.filter((item) => {
    const matchesSearch =
      item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'ALL' || item.channel === channelFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Institutional Notification Deliveries Outbox
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative delivery audit history across email (Resend), in-app push, and SMS dispatch channels.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            title="Refresh Deliveries"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Outbox
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Dispatches</span>
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{deliveries.length}</div>
          <div className="text-xs text-slate-500 mt-1">Logged communication events</div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Dispatched</span>
            <Mail className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-brand-300 mt-2">
            {deliveries.filter((d) => d.channel === 'EMAIL').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Resend SMTP / API</div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">In-App Alerts</span>
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-300 mt-2">
            {deliveries.filter((d) => d.channel === 'IN_APP').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Internal student/parent notifications</div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed / Bounced</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-red-400 mt-2">
            {deliveries.filter((d) => d.status === 'FAILED' || d.status === 'BOUNCED').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Delivery exceptions</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipient, subject, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 whitespace-nowrap">Channel:</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Channels</option>
              <option value="EMAIL">Email</option>
              <option value="IN_APP">In-App</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-4 px-6">Channel</th>
                <th className="py-4 px-6">Recipient</th>
                <th className="py-4 px-6">Subject / Headline</th>
                <th className="py-4 px-6">Provider</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Bell className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                    No notification deliveries found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                          del.channel === 'EMAIL'
                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                            : del.channel === 'IN_APP'
                            ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {del.channel === 'EMAIL' ? (
                          <Mail className="w-3 h-3" />
                        ) : del.channel === 'IN_APP' ? (
                          <MessageSquare className="w-3 h-3" />
                        ) : (
                          <Smartphone className="w-3 h-3" />
                        )}
                        {del.channel}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white font-mono">{del.recipient}</div>
                      {del.user && (
                        <div className="text-[10px] text-slate-400">
                          {del.user.firstName} {del.user.lastName} ({del.user.role})
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200 truncate max-w-xs">{del.subject || 'Notification'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{del.body}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300 font-mono text-[11px]">{del.provider || 'Internal'}</div>
                      {del.providerRef && (
                        <div className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">
                          Ref: {del.providerRef}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {del.status === 'DELIVERED' || del.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          {del.status}
                        </span>
                      ) : del.status === 'FAILED' || del.status === 'BOUNCED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-red-500/10 border border-red-500/20 text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          {del.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Clock className="w-3 h-3" />
                          {del.status || 'PENDING'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-[11px]">
                      {del.sentAt || del.createdAt
                        ? new Date(del.sentAt || del.createdAt).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedDelivery(del)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Notification Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Notification Delivery Record</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedDelivery.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Channel</span>
                  <span className="text-white font-semibold">{selectedDelivery.channel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-emerald-400 font-bold">{selectedDelivery.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recipient</span>
                  <span className="text-white font-mono">{selectedDelivery.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Provider Ref</span>
                  <span className="text-slate-300 font-mono">{selectedDelivery.providerRef || 'None'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Subject</span>
                <div className="p-3 bg-slate-950/80 rounded-xl text-white font-medium border border-white/5">
                  {selectedDelivery.subject || 'No Subject Provided'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Message Body</span>
                <div className="p-4 bg-slate-950/80 rounded-xl text-slate-300 border border-white/5 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedDelivery.body}
                </div>
              </div>

              {selectedDelivery.errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <span className="font-bold block mb-1">Delivery Error:</span>
                  <span>{selectedDelivery.errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
