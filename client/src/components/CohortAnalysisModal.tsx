import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { X, Users, DollarSign, Activity, Calendar, Download } from 'lucide-react';
import { Badge, LoadingSpinner } from './UIElements';

interface CohortAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
}

export const CohortAnalysisModal: React.FC<CohortAnalysisModalProps> = ({ isOpen, onClose, cohortId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && cohortId) {
      setLoading(true);
      api.getCohortAnalysis(cohortId)
        .then((res: any) => {
          setData(res);
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to fetch analysis');
          setLoading(false);
        });
    }
  }, [isOpen, cohortId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold">Cohort Analysis View</h3>
            <p className="text-sm opacity-80">{data?.cohortInfo?.name || 'Loading...'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
          ) : (
            <div className="space-y-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Enrollment</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{data.cohortInfo.enrolled} / {data.cohortInfo.capacity}</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-1">{data.analytics.fillRate.toFixed(1)}% Fill Rate</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Revenue Collected</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">₦{data.analytics.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Outstanding</span>
                  </div>
                  <div className="text-2xl font-black text-red-600">₦{data.analytics.totalOutstanding.toLocaleString()}</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Active Students</span>
                  </div>
                  <div className="text-2xl font-black text-blue-600">{data.analytics.activeStudents}</div>
                </div>
              </div>

              {/* Student Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900">Student Directory & Payment History</h4>
                  <button className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="p-4 font-bold">Student Name</th>
                          <th className="p-4 font-bold">Contact</th>
                          <th className="p-4 font-bold">Invoiced</th>
                          <th className="p-4 font-bold">Paid</th>
                          <th className="p-4 font-bold">Balance</th>
                          <th className="p-4 font-bold">Payment Status</th>
                          <th className="p-4 font-bold">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.students.map((student: any) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-semibold text-slate-900">{student.name}</td>
                            <td className="p-4">
                              <div className="text-slate-900">{student.email}</div>
                              <div className="text-slate-500">{student.phone}</div>
                            </td>
                            <td className="p-4 font-medium">₦{student.financials.totalInvoiced.toLocaleString()}</td>
                            <td className="p-4 font-medium text-emerald-600">₦{student.financials.totalPaid.toLocaleString()}</td>
                            <td className="p-4 font-medium text-red-600">₦{student.financials.balance.toLocaleString()}</td>
                            <td className="p-4">
                              <Badge variant={student.financials.status === 'PAID' ? 'green' : student.financials.status === 'PARTIAL' ? 'amber' : 'red'}>
                                {student.financials.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full w-16">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${student.attendanceRate}%` }}></div>
                                </div>
                                <span className="text-[10px] text-slate-500">{student.attendanceRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {data.students.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500">No students enrolled yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
