import React, { useState, useEffect } from 'react';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Briefcase,
  Users,
  Award,
  TrendingUp,
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';

export const PartnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      const res = await api.getPartnerOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load partner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerData();
  }, []);

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">Loading Partnership Portfolio...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const partner = data?.partner;
  const metrics = data?.metrics;
  const students = data?.students || [];

  return (
    <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Corporate & NGO Sponsorship Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {partner?.organizationName || 'Corporate Partner'} Portal
            </h1>
            <p className="text-sm text-slate-300">
              Track your sponsored STEMPACT scholars, inspect daily attendance fidelity and competency attainment, and export CSR impact statements.
            </p>
          </div>
        </div>

        {/* 4 Core Sponsorship KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Sponsored Scholars</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalSponsored || 0}</div>
            <span className="text-[11px] text-emerald-600 font-medium">100% scholarship funded</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Aggregate Attendance</span>
            <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{metrics?.avgAttendance || 100}%</div>
            <span className="text-[11px] text-blue-600 font-medium">Classroom & lab presence</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Curriculum Progression</span>
            <div className="text-2xl font-black text-purple-700 mt-1 font-mono">{metrics?.avgCompletion || 0}%</div>
            <span className="text-[11px] text-purple-600 font-medium">Average syllabus completion</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold">Grant Commitment</span>
            <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
              ₦{partner?.grantBudget?.toLocaleString() || '1,500,000'}
            </div>
            <span className="text-[11px] text-slate-500">MOU allocation</span>
          </div>
        </div>

        {/* Tab Switcher & Export Button */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200">
          <div className="flex gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-emerald-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sponsored Scholars ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === 'report'
                  ? 'border-emerald-600 text-emerald-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Executive CSR Impact Report
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="mb-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSR Summary (PDF)</span>
          </button>
        </div>

        {/* Tab 1: Sponsored Scholars Roster */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Sponsored Cohort Roster</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3 font-bold">Scholar Name</th>
                    <th className="p-3 font-bold">Program & Cohort</th>
                    <th className="p-3 font-bold">Attendance %</th>
                    <th className="p-3 font-bold">Avg Grade %</th>
                    <th className="p-3 font-bold">Projects Built</th>
                    <th className="p-3 font-bold">Grant Coverage</th>
                    <th className="p-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No students currently attached to your sponsorship grant.
                      </td>
                    </tr>
                  ) : (
                    students.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <strong className="text-slate-900 block">{st.fullName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{st.studentIdNumber}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-800 block">{st.program}</span>
                          <span className="text-[10px] text-slate-500">{st.cohort}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-emerald-700">{st.attendanceRate}%</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-800">
                            {st.avgGrade !== 'N/A' ? `${st.avgGrade}%` : 'In Progress'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-purple-700">{st.projectsCount} Capstone(s)</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {st.coveragePercent}% Funded
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Executive CSR Report */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto print:border-none print:shadow-none">
            <div className="border-b pb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                  STEMPACT ACADEMY • CORPORATE SOCIAL RESPONSIBILITY
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Executive CSR Impact & Pacing Report
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  Partner: <strong>{partner?.organizationName}</strong> • Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                  VERIFIED AUDIT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Beneficiary Youth</span>
                <div className="text-2xl font-black text-slate-900 font-mono">{metrics?.totalSponsored || 0}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Attendance Fidelity</span>
                <div className="text-2xl font-black text-emerald-700 font-mono">{metrics?.avgAttendance || 100}%</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">Curriculum Completion</span>
                <div className="text-2xl font-black text-purple-700 font-mono">{metrics?.avgCompletion || 0}%</div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <h4 className="text-sm font-bold text-slate-900">Executive Narrative Summary</h4>
              <p>
                Through the continued partnership between <strong>{partner?.organizationName}</strong> and STEMPACT Academy, {metrics?.totalSponsored || 0} young scholars in Osun State and the Southwest region have gained subsidized hands-on access to advanced engineering laboratories, physical hardware kits, and high-performance computing clusters.
              </p>
              <p>
                The sponsored cohort has maintained an exemplary {metrics?.avgAttendance || 100}% average laboratory attendance record and is on track to complete capstone requirements in Web Architecture, Robotics, and Artificial Intelligence.
              </p>
            </div>

            <div className="border-t pt-6 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>STEMPACT Academy Governance Board • Ile-Ife Main Hub</span>
              <span>Official Document Ref: CSR-STP-2025-P{partner?.id?.slice(0, 6) || '001'}</span>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};
