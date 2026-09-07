import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  CreditCard,
  Bell,
  User,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  Send,
  MessageSquare,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getStudentDashboard();
        setData(res.dashboard);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleAssignmentSubmit = async (assignmentId: string) => {
    if (!submissionText) return;
    try {
      await api.submitAssignment({
        assignmentId,
        content: submissionText,
      });
      setActionSuccess('Assignment work submitted to instructor successfully!');
      setSubmittingAssignment(null);
      setSubmissionText('');
      // Reload dashboard
      const res = await api.getStudentDashboard();
      setData(res.dashboard);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment');
    }
  };

  if (loading) return <LoadingSpinner message="Loading Student Portal & Learning Ledger..." />;
  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Student Profile Not Linked</h2>
        <p className="text-xs text-slate-500">
          Your account does not currently have an active student enrollment. Please submit an application.
        </p>
        <Link to="/apply" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">
          Submit Application
        </Link>
      </div>
    );
  }

  const { profile, cohort, program, metrics, attendances, assignments, submissions, invoices, certificates, announcements } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Student ID & Status */}
      <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {profile.fullName.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-700/60">
                ID: {profile.studentIdNumber}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                ACTIVE LEARNER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {profile.fullName}
            </h1>
            <p className="text-xs text-slate-400">
              {program?.name || 'Academic Specialization'} • {cohort?.cohortCode} • {profile.currentLevel}
            </p>
          </div>
        </div>

        {/* Community & Fast WhatsApp Connect */}
        <div className="flex items-center gap-3">
          <a
            href={cohort?.whatsappGroupUrl || 'https://chat.whatsapp.com/stempact-community'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Join Class WhatsApp Group</span>
          </a>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-900">×</button>
        </div>
      )}

      {/* Multi-Factor Learning Progress Bar Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Overall Completion Rate */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Program Completion</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.progressPercentage}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${metrics.progressPercentage}%` }}></div>
          </div>
        </Card>

        {/* Metric 2: Attendance Rate */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Attendance Rate</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.attendanceRate}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.attendanceRate}%` }}></div>
          </div>
        </Card>

        {/* Metric 3: Modules Completed */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Modules Mastered</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.modulesCompletedCount} / {metrics.totalModulesCount}
          </div>
          <div className="text-[11px] text-slate-400">Curriculum Sprints</div>
        </Card>

        {/* Metric 4: Competencies Achieved */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Verified Competencies</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.achievedCompetenciesCount} Done
          </div>
          <div className="text-[11px] text-slate-400">Industry Skills Verified</div>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          {[
            { id: 'overview', name: 'Overview & Schedule' },
            { id: 'curriculum', name: 'My Curriculum & Syllabus' },
            { id: 'attendance', name: 'Attendance Record' },
            { id: 'assignments', name: 'Assignments & Work' },
            { id: 'invoices', name: 'Tuition & Receipts' },
            { id: 'certificates', name: 'Certificates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & SCHEDULE */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Enrolled Cohort Details */}
              <Card className="p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Enrolled Academic Cohort
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {cohort?.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong className="text-slate-700 block">Schedule:</strong>
                    <span className="text-slate-600">{cohort?.schedule}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Location / Lab:</strong>
                    <span className="text-slate-600">{cohort?.location}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Lead Faculty Instructor:</strong>
                    <span className="text-slate-600">{cohort?.instructorName}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Learning Mode:</strong>
                    <span className="text-slate-600">{cohort?.mode}</span>
                  </div>
                </div>
              </Card>

              {/* Class Timetable Sessions */}
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>Class Timetable & Topics</span>
                  <span className="text-xs text-blue-600 font-semibold">Live Semester Schedule</span>
                </h3>

                <div className="space-y-3">
                  {cohort?.classSessions && cohort.classSessions.length > 0 ? (
                    cohort.classSessions.map((s: any) => (
                      <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{s.title}</span>
                          <span className="text-slate-500 font-medium">
                            {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {s.startTime} - {s.endTime}
                          </span>
                        </div>
                        <p className="text-slate-600">{s.topic}</p>
                        <div className="text-[11px] text-blue-600 font-semibold">{s.room}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Class timetable being published by faculty.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Announcements & Quick Resources */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-500" />
                  <span>Academy Announcements</span>
                </h3>
                <div className="space-y-3">
                  {announcements.map((ann: any) => (
                    <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-900">{ann.title}</div>
                      <p className="text-slate-600 leading-relaxed">{ann.content}</p>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ann.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 space-y-3">
                <h3 className="font-bold text-sm text-slate-900">Student Handbook & Guides</h3>
                <div className="space-y-2 text-xs">
                  <a
                    href="/resources/STEMPACT_Student_Handbook_2025.pdf"
                    target="_blank"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
                  >
                    <span>Download Student Handbook (PDF)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                  </a>
                  <a
                    href="https://wa.me/2348031234567"
                    target="_blank"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
                  >
                    <span>Academic Support Desk</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                  </a>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: CURRICULUM & SYLLABUS */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Program Course Outline & Modules</h2>
            {program?.courses?.map((course: any) => (
              <Card key={course.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-blue-600 uppercase">{course.code}</span>
                  <span className="text-xs font-semibold text-slate-500">Order #{course.order}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{course.title}</h3>
                <p className="text-xs text-slate-600">{course.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {course.modules?.map((m: any) => (
                    <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-900">{m.title}</div>
                      <p className="text-slate-500">{m.description}</p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {m.durationHours} Hours Dedicated Lab
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Attendance Log</h3>
                <p className="text-xs text-slate-500">Official log recorded by class faculty instructors.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Rate:</span>
                <span className="text-lg font-black text-emerald-600 ml-2">{metrics.attendanceRate}%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Class Session Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendances.map((att: any) => (
                    <tr key={att.id}>
                      <td className="py-3 px-3 font-semibold">
                        {new Date(att.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {att.classSession?.title || 'Class Session'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : att.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{att.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 4: ASSIGNMENTS & WORK */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Sprint Assignments & Deliverables</h2>
            <div className="space-y-4">
              {assignments.map((ass: any) => {
                const sub = submissions.find((s: any) => s.assignmentId === ass.id);
                return (
                  <Card key={ass.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600">Assignment Max: {ass.maxPoints} pts</span>
                      <span className="text-xs text-slate-500">
                        Due: {new Date(ass.dueDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{ass.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{ass.description}</p>

                    {sub ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span>Work Submitted ({new Date(sub.submittedAt).toLocaleDateString('en-GB')})</span>
                          {sub.grade !== null && (
                            <span className="text-sm text-emerald-800">Grade: {sub.grade}/{ass.maxPoints}</span>
                          )}
                        </div>
                        <p className="text-slate-700 font-mono text-[11px]">{sub.content}</p>
                        {sub.feedback && (
                          <div className="pt-2 border-t border-emerald-200 text-emerald-800 italic">
                            Faculty Feedback: "{sub.feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {submittingAssignment === ass.id ? (
                          <div className="space-y-3 pt-2">
                            <textarea
                              rows={3}
                              placeholder="Paste GitHub repository URL, Figma file link, or submission notes..."
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAssignmentSubmit(ass.id)}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                              >
                                Submit Deliverable
                              </button>
                              <button
                                onClick={() => setSubmittingAssignment(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSubmittingAssignment(ass.id)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                          >
                            Submit Deliverable
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: TUITION & RECEIPTS */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Tuition Invoices & Payment Receipts</h2>
            <div className="space-y-4">
              {invoices.map((inv: any) => (
                <Card key={inv.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-mono font-bold text-xs text-blue-600">{inv.invoiceNumber}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{inv.title}</h3>

                  <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Total Tuition</span>
                      <span className="font-bold text-slate-900">₦{inv.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Amount Paid</span>
                      <span className="font-bold text-emerald-600">₦{inv.amountPaid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Outstanding Balance</span>
                      <span className="font-bold text-slate-900">₦{inv.balance.toLocaleString()}</span>
                    </div>
                  </div>

                  {inv.payments && inv.payments.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-bold text-slate-700">Official Payment Receipts:</div>
                      {inv.payments.map((pay: any) => (
                        <div key={pay.id} className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-emerald-900">{pay.paymentReference}</span>
                            <span className="text-slate-500 ml-2">
                              (₦{pay.amount.toLocaleString()} via {pay.channel})
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">PAID & VERIFIED</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Official Certificates & Credentials</h2>
            {certificates && certificates.length > 0 ? (
              certificates.map((cert: any) => (
                <Card key={cert.id} className="p-8 space-y-4 border-2 border-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-500">REF: {cert.certificateNumber}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      VERIFIED
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900">{cert.programName}</h3>
                  <p className="text-xs text-slate-600">{cert.achievement}</p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Issued:{' '}
                      {new Date(cert.issueDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <Link
                      to={`/verify/${cert.certificateNumber}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      View Public Verification Page
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center space-y-2">
                <Award className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Certificate Under Milestone Progression</h3>
                <p className="text-xs text-slate-500">
                  Your official certificate will be generated and issued upon successful defense of your Capstone project.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
