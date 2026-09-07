import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Plus,
  Send,
  Bell,
  Check,
  X,
  FileText,
} from 'lucide-react';

export const InstructorPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'cohorts' | 'attendance' | 'grading'>('cohorts');

  // Attendance Sheet State
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Assignment Grading State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        const res = await api.getInstructorDashboard();
        setData(res);
        if (res.cohorts && res.cohorts.length > 0) {
          setSelectedCohortId(res.cohorts[0].id);
        }
      } catch (err) {
        console.error('Failed to load instructor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructor();
  }, []);

  const handleMarkAttendanceSubmit = async () => {
    if (!selectedCohortId || !sessionTitle) {
      alert('Please provide a class session title.');
      return;
    }
    setSavingAttendance(true);
    try {
      // 1. Create class session
      const sessionRes = await api.createClassSession({
        cohortId: selectedCohortId,
        title: sessionTitle,
        date: new Date().toISOString(),
        startTime: '16:00',
        endTime: '19:00',
        topic: sessionTopic || sessionTitle,
      });

      // 2. Mark attendance for each student in cohort
      const cohortObj = data.cohorts.find((c: any) => c.id === selectedCohortId);
      const recordsToSubmit = (cohortObj?.studentProfiles || []).map((sp: any) => ({
        studentId: sp.id,
        status: attendanceRecords[sp.id] || 'PRESENT',
      }));

      await api.markAttendance({
        classSessionId: sessionRes.session.id,
        records: recordsToSubmit,
      });

      setFeedbackMsg(`Successfully logged attendance for ${recordsToSubmit.length} students!`);
      setSessionTitle('');
      setSessionTopic('');
      // Refresh
      const res = await api.getInstructorDashboard();
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to record attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleGradeSubmission = async (subId: string) => {
    try {
      await api.gradeSubmission(subId, {
        grade: gradeInput,
        feedback: feedbackInput || 'Great work on this practical milestone.',
      });
      setFeedbackMsg('Grade and feedback saved successfully!');
      setSelectedSubmissionId(null);
      // Refresh
      const res = await api.getInstructorDashboard();
      setData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    }
  };

  if (loading) return <LoadingSpinner message="Loading Faculty & Instructor Workstation..." />;
  if (!data) return null;

  const { instructor, cohorts, pendingSubmissions } = data;
  const currentCohort = cohorts.find((c: any) => c.id === selectedCohortId) || cohorts[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Faculty Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center">
            {instructor.name ? instructor.name[0] : 'F'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                STAFF: {instructor.staffCode}
              </span>
              <span className="text-xs font-bold text-blue-400">FACULTY INSTRUCTOR</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">{instructor.name}</h1>
            <p className="text-xs text-slate-400">{instructor.specialization || 'Technical Faculty Lead'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          Sign Out
        </button>
      </div>

      {feedbackMsg && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="font-bold text-emerald-900">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cohorts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assigned Cohorts & Rosters ({cohorts.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mark Class Attendance
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'grading' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Submissions & Grading ({pendingSubmissions.length})
          </button>
        </div>

        {/* TAB 1: ASSIGNED COHORTS & ROSTERS */}
        {activeTab === 'cohorts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((c: any) => (
                <Card key={c.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">{c.cohortCode}</span>
                    <Badge variant="green">{c.status}</Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Program:</strong> {c.program?.name}</div>
                    <div><strong>Schedule:</strong> {c.schedule}</div>
                    <div><strong>Enrolled Students:</strong> {c.studentProfiles?.length || c.currentEnrollment} students</div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedCohortId(c.id);
                        setActiveTab('attendance');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Take Attendance →
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MARK ATTENDANCE */}
        {activeTab === 'attendance' && (
          <Card className="p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Class Attendance Sheet</h2>
              <p className="text-xs text-slate-500">Record present, late, or absent status for today's lab session.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Cohort</label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cohortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Session Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Lab 4: Microcontroller FreeRTOS Interfacing"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Topic / Milestones</label>
                <input
                  type="text"
                  placeholder="e.g. Memory allocation, Mutex locking"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Student Roster Table */}
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-xs uppercase text-slate-400">
                Enrolled Students ({currentCohort?.studentProfiles?.length || 0})
              </h3>

              {currentCohort?.studentProfiles && currentCohort.studentProfiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 px-3">Student ID</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentCohort.studentProfiles.map((sp: any) => {
                        const status = attendanceRecords[sp.id] || 'PRESENT';
                        return (
                          <tr key={sp.id}>
                            <td className="py-3 px-3 font-mono font-semibold text-slate-500">
                              {sp.studentIdNumber}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {sp.user?.firstName} {sp.user?.lastName}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-[11px] font-bold">
                                {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      setAttendanceRecords((prev) => ({ ...prev, [sp.id]: st }))
                                    }
                                    className={`px-3 py-1 rounded-md transition-colors ${
                                      status === st
                                        ? st === 'PRESENT'
                                          ? 'bg-emerald-600 text-white'
                                          : st === 'LATE'
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-rose-600 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No students currently enrolled in this cohort batch.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                disabled={savingAttendance}
                onClick={handleMarkAttendanceSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                {savingAttendance ? 'Saving Attendance...' : 'Save & Calculate Attendance Rates'}
              </button>
            </div>
          </Card>
        )}

        {/* TAB 3: SUBMISSIONS & GRADING */}
        {activeTab === 'grading' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Student Assignment Submissions</h2>
            {pendingSubmissions.length === 0 ? (
              <Card className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Grading Queue Empty</h3>
                <p className="text-xs text-slate-500">All submitted student works have been evaluated.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((sub: any) => (
                  <Card key={sub.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600">{sub.student?.studentIdNumber}</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                          {sub.student?.user?.firstName} {sub.student?.user?.lastName}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">{sub.assignment?.title}</div>
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {sub.content}
                      </p>
                    </div>

                    {selectedSubmissionId === sub.id ? (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Grade (0 - 100)</label>
                            <input
                              type="number"
                              value={gradeInput}
                              onChange={(e) => setGradeInput(Number(e.target.value))}
                              className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Feedback</label>
                            <input
                              type="text"
                              value={feedbackInput}
                              onChange={(e) => setFeedbackInput(e.target.value)}
                              placeholder="Constructive feedback for learner..."
                              className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGradeSubmission(sub.id)}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs"
                          >
                            Save Grade & Feedback
                          </button>
                          <button
                            onClick={() => setSelectedSubmissionId(null)}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSubmissionId(sub.id);
                          setGradeInput(90);
                          setFeedbackInput('Well implemented. Clean structure and accurate test coverage.');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                      >
                        Grade This Submission
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
