import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { PortalLayout } from '../../components/PortalLayout';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  TrendingUp,
  Sparkles,
  ChevronRight,
  UserCheck,
  AlertCircle,
  FileText,
  FolderGit2,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { ParentAssistantModal } from '../../components/ParentAssistantModal';
import { PageHeader } from '../../components/PageHeader';

export const ParentPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFromUrl = searchParams.get('tab') || 'overview';
  const wardIdFromUrl = searchParams.get('wardId') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(currentTabFromUrl);
  const [selectedWardId, setSelectedWardId] = useState<string>(wardIdFromUrl);
  const [academicSubTab, setAcademicSubTab] = useState<'lessons' | 'assignments'>('lessons');

  // Detailed Academic Records for Selected Ward
  const [detailedWardRecord, setDetailedWardRecord] = useState<any | null>(null);
  const [loadingDetailedRecord, setLoadingDetailedRecord] = useState<boolean>(false);
  const [recordError, setRecordError] = useState<string>('');

  // AI Assistant Modal
  const [showGuardianAi, setShowGuardianAi] = useState<boolean>(false);

  // Register Ward Modal State
  const [showRegisterWardModal, setShowRegisterWardModal] = useState(false);
  const [wardPrograms, setWardPrograms] = useState<any[]>([]);
  const [wardCenters, setWardCenters] = useState<any[]>([]);
  const [loadingWardResources, setLoadingWardResources] = useState(false);
  const [registeringWard, setRegisteringWard] = useState(false);
  const [registerWardError, setRegisterWardError] = useState('');
  const [registerWardSuccess, setRegisterWardSuccess] = useState('');
  // Ward application fields
  const [wardFullName, setWardFullName] = useState('');
  const [wardEmail, setWardEmail] = useState('');
  const [wardPhone, setWardPhone] = useState('');
  const [wardDob, setWardDob] = useState('');
  const [wardGender, setWardGender] = useState('');
  const [wardAddress, setWardAddress] = useState('');
  const [wardEducationLevel, setWardEducationLevel] = useState('');
  const [wardCareerGoals, setWardCareerGoals] = useState('');
  const [wardLearningObjectives, setWardLearningObjectives] = useState('');
  const [wardStatement, setWardStatement] = useState('');
  const [wardPreferredSchedule, setWardPreferredSchedule] = useState('');
  const [wardProgramId, setWardProgramId] = useState('');
  const [wardCohortId, setWardCohortId] = useState('');
  const [wardCenterId, setWardCenterId] = useState('');
  const [wardRelationship, setWardRelationship] = useState('Parent');

  // Synchronize Tab & Ward with URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tabId);
      if (selectedWardId) p.set('wardId', selectedWardId);
      return p;
    });
  };

  const handleSelectWard = (wId: string) => {
    setSelectedWardId(wId);
    setDetailedWardRecord(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('wardId', wId);
      p.set('tab', activeTab);
      return p;
    });
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    const wFromUrl = searchParams.get('wardId');
    if (wFromUrl && wFromUrl !== selectedWardId) {
      setSelectedWardId(wFromUrl);
    }
  }, [searchParams]);

  // Load Parent Overview
  useEffect(() => {
    const fetchParentDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.getParentDashboard();
        setData(res);
        if (res.wards && res.wards.length > 0) {
          if (!selectedWardId || !res.wards.some((w: any) => w.studentId === selectedWardId)) {
            setSelectedWardId(res.wards[0].studentId);
          }
        }
      } catch (err) {
        console.error('Failed to load parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchParentDashboard();
  }, []);

  // Fetch detailed academic records when switching ward or opening deeper tabs
  useEffect(() => {
    if (!selectedWardId) return;
    const fetchWardDetails = async () => {
      setLoadingDetailedRecord(true);
      setRecordError('');
      try {
        const res = await api.getWardAcademicRecords(selectedWardId);
        setDetailedWardRecord(res.ward);
      } catch (err: any) {
        console.warn('Detailed ward records could not be fetched:', err);
        setRecordError(err.message || 'Detailed records currently restricted or unavailable.');
      } finally {
        setLoadingDetailedRecord(false);
      }
    };
    fetchWardDetails();
  }, [selectedWardId]);

  if (loading) return <LoadingSpinner message="Loading Parent & Guardian Academic Ledger..." />;

  const wards = data?.wards || [];
  const announcements = data?.announcements || [];
  const currentWard = wards.find((w: any) => w.studentId === selectedWardId) || wards[0] || null;

  // Open Register Ward modal and lazy-fetch resources
  const handleOpenRegisterWardModal = async () => {
    setShowRegisterWardModal(true);
    setRegisterWardError('');
    setRegisterWardSuccess('');
    if (wardPrograms.length === 0) {
      setLoadingWardResources(true);
      try {
        const [progsRes, centersRes] = await Promise.all([
          api.getPrograms(),
          api.getCenters(),
        ]);
        setWardPrograms(progsRes.programs || progsRes || []);
        setWardCenters(centersRes.centers || centersRes || []);
      } catch (err) {
        console.warn('Could not load ward resources:', err);
      } finally {
        setLoadingWardResources(false);
      }
    }
  };

  const handleRegisterWardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringWard(true);
    setRegisterWardError('');
    setRegisterWardSuccess('');
    try {
      await api.registerWard({
        fullName: wardFullName,
        email: wardEmail,
        phone: wardPhone,
        dateOfBirth: wardDob ? new Date(wardDob).toISOString() : undefined,
        gender: wardGender || undefined,
        address: wardAddress,
        educationLevel: wardEducationLevel,
        careerGoals: wardCareerGoals,
        learningObjectives: wardLearningObjectives,
        statementOfPurpose: wardStatement,
        preferredSchedule: wardPreferredSchedule,
        programId: wardProgramId || undefined,
        cohortId: wardCohortId || undefined,
        preferredCenterId: wardCenterId || undefined,
        relationship: wardRelationship,
      });
      setRegisterWardSuccess(`Ward application for "${wardFullName}" submitted! Admissions will review and link them to your account.`);
      setWardFullName(''); setWardEmail(''); setWardPhone('');
      setWardDob(''); setWardGender(''); setWardAddress('');
      setWardEducationLevel(''); setWardCareerGoals('');
      setWardLearningObjectives(''); setWardStatement('');
      setWardPreferredSchedule(''); setWardProgramId('');
      setWardCohortId(''); setWardCenterId('');
    } catch (err: any) {
      setRegisterWardError(err.message || 'Failed to register ward application.');
    } finally {
      setRegisteringWard(false);
    }
  };

  return (
    <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Parent Header Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Parent & Guardian Portal
              </span>
              <h1 className="text-2xl font-black text-white">
                {user?.firstName} {user?.lastName} ({data?.parent?.relationship || 'Authorized Guardian'})
              </h1>
              <p className="text-xs text-slate-300">
                Monitoring {wards.length} enrolled {wards.length === 1 ? 'ward' : 'wards'} at STEMPACT Academy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleOpenRegisterWardModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Register a Ward</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGuardianAi(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Ask AI Guardian</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {wards.length === 0 ? (
          <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">No Enrolled Wards Linked Yet</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your guardian account does not currently have active enrolled students mapped via an approved Student-Guardian relationship. If your ward recently submitted an application, admissions clearance is currently in review.
            </p>
            {data?.applications && data.applications.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-2 mt-4">
                <span className="text-xs font-bold text-slate-700">Pending Applications Linked by Guardian Email:</span>
                {data.applications.map((app: any) => (
                  <div key={app.id} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
                    <div>
                      <strong className="text-slate-900 block">{app.fullName}</strong>
                      <span className="text-[11px] text-slate-500">{app.program?.name} • App #{app.applicationNumber}</span>
                    </div>
                    <Badge variant="blue">{app.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* WARD SELECTOR (Multiple Wards Support) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Active Ward Inspection:
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {wards.map((ward: any) => (
                  <button
                    key={ward.studentId}
                    type="button"
                    onClick={() => handleSelectWard(ward.studentId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      selectedWardId === ward.studentId
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{ward.fullName}</span>
                    <span className="text-[10px] font-mono opacity-80">({ward.studentIdNumber})</span>
                  </button>
                ))}
              </div>
            </div>

            {activeTab !== 'overview' && currentWard && (
              <PageHeader
                title={
                  activeTab === 'progress'
                    ? 'Academic Progress & Coursework'
                    : activeTab === 'attendance'
                    ? 'Attendance Register & Class Logs'
                    : activeTab === 'finance'
                    ? 'Tuition Invoices & Financial Clearance'
                    : 'Ward Performance'
                }
                subtitle={`Authoritative academic ledger for ${currentWard.fullName}`}
                badge={
                  <Badge variant={activeTab === 'attendance' ? 'green' : activeTab === 'finance' ? 'purple' : 'blue'}>
                    {activeTab === 'progress'
                      ? 'Academic Standing'
                      : activeTab === 'attendance'
                      ? `${currentWard.attendanceRate}% Attendance`
                      : 'Tuition Ledger'}
                  </Badge>
                }
              />
            )}

            {/* Selected Ward Profile Card */}
            {currentWard && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Student ID: {currentWard.studentIdNumber}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{currentWard.fullName}</h2>
                    <p className="text-xs text-slate-500">
                      {currentWard.program?.name} • Cohort: <strong>{currentWard.cohort?.name}</strong> • Level: <strong>{currentWard.currentLevel}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Attendance Rate</div>
                      <div className="text-xl font-black text-emerald-600">{currentWard.attendanceRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Syllabus Completion</div>
                      <div className="text-xl font-black text-blue-600">{currentWard.completionRate || 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Contextual Sub-Tabs only when in Academic Progress */}
                {activeTab === 'progress' && (
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setAcademicSubTab('lessons')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        academicSubTab === 'lessons'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Curriculum & Lessons
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcademicSubTab('assignments')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        academicSubTab === 'assignments'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Assignments & Grades
                    </button>
                  </div>
                )}

                {recordError && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    {recordError}
                  </div>
                )}

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Completed Lessons</span>
                        <div className="text-lg font-black text-slate-900 mt-1">
                          {currentWard.completedLessonsCount || detailedWardRecord?.progress?.completedLessons || 0}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Attended Sessions</span>
                        <div className="text-lg font-black text-emerald-700 mt-1">
                          {currentWard.attendances?.length || detailedWardRecord?.attendances?.length || 0}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Submissions</span>
                        <div className="text-lg font-black text-purple-700 mt-1">
                          {currentWard.recentAssignments?.length || detailedWardRecord?.submissions?.length || 0}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Practical Projects</span>
                        <div className="text-lg font-black text-blue-700 mt-1">
                          {currentWard.projects?.length || detailedWardRecord?.projects?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                      {/* Left: Attendance Log Sample */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>Recent Class Attendance Log</span>
                        </h3>
                        <div className="space-y-2">
                          {(currentWard.attendances || detailedWardRecord?.attendances || []).slice(0, 4).map((att: any) => (
                            <div key={att.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {att.classSession?.title || 'Class Session'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {att.date ? new Date(att.date).toLocaleDateString('en-GB') : '—'}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  att.status === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {att.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Recent Assignments & Faculty Feedback */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>Recent Graded Work & Feedback</span>
                        </h3>
                        <div className="space-y-2">
                          {(currentWard.recentAssignments || detailedWardRecord?.submissions || []).slice(0, 3).map((sub: any) => (
                            <div key={sub.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800">
                                  {sub.assignment?.title || 'Practical Deliverable'}
                                </span>
                                {sub.grade !== null && (
                                  <span className="font-bold text-emerald-700">
                                    Grade: {sub.grade}/{sub.assignment?.maxPoints || 100}
                                  </span>
                                )}
                              </div>
                              {sub.feedback && (
                                <p className="text-[11px] text-slate-500 italic">
                                  "{sub.feedback}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: DETAILED PROGRESS - LESSONS */}
                {activeTab === 'progress' && academicSubTab === 'lessons' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-slate-900">Curriculum Lesson Progression</h3>
                    {loadingDetailedRecord ? (
                      <div className="py-8 text-center text-xs text-slate-500">Loading lesson logs...</div>
                    ) : (detailedWardRecord?.lessonProgress || []).length > 0 ? (
                      <div className="space-y-2">
                        {detailedWardRecord.lessonProgress.map((lp: any) => (
                          <div key={lp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <strong className="text-slate-900 block">{lp.lesson?.title || 'Lesson Unit'}</strong>
                              <span className="text-[10px] text-slate-400">
                                Time Dedicated: {lp.timeSpentMinutes || 30} mins • Completed: {lp.completedAt ? new Date(lp.completedAt).toLocaleDateString('en-GB') : '—'}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {lp.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No individual lesson progress logs recorded yet.</p>
                    )}
                  </div>
                )}

                {/* TAB 3: ASSIGNMENTS & GRADES */}
                {((activeTab === 'progress' && academicSubTab === 'assignments') || activeTab === 'assignments') && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-slate-900">All Submitted Work & Instructor Grades</h3>
                    {(detailedWardRecord?.submissions || currentWard.recentAssignments || []).length > 0 ? (
                      <div className="space-y-3">
                        {(detailedWardRecord?.submissions || currentWard.recentAssignments || []).map((sub: any) => (
                          <div key={sub.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <strong className="text-slate-900">{sub.assignment?.title || 'Coursework Deliverable'}</strong>
                              {sub.grade !== null ? (
                                <span className="text-sm font-bold text-emerald-700">
                                  Grade: {sub.grade} / {sub.assignment?.maxPoints || 100}
                                </span>
                              ) : (
                                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                  Pending Instructor Grading
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 font-mono text-[11px]">{sub.content}</p>
                            {sub.feedback && (
                              <div className="pt-2 text-slate-700 italic text-[11px] border-t border-slate-100">
                                <strong>Instructor Comments:</strong> "{sub.feedback}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No assignment submissions logged yet.</p>
                    )}
                  </div>
                )}

                {/* TAB 4: ATTENDANCE */}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-slate-900">Session Attendance Log</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Class Session</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(detailedWardRecord?.attendances || currentWard.attendances || []).map((att: any) => (
                            <tr key={att.id}>
                              <td className="py-3 px-3 font-semibold">
                                {att.date ? new Date(att.date).toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td className="py-3 px-3 font-medium">
                                {att.classSession?.title || 'Class Session'}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    att.status === 'PRESENT'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
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
                  </div>
                )}

                {/* TAB 5: FINANCE */}
                {activeTab === 'finance' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-slate-900">Tuition & Financial Standing</h3>
                    {(currentWard.invoices || []).length > 0 ? (
                      <div className="space-y-3">
                        {currentWard.invoices.map((inv: any) => (
                          <div key={inv.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <div>
                                <span className="font-mono text-slate-400 font-bold block">Ref: {inv.invoiceNumber}</span>
                                <strong className="text-slate-900">Cohort Tuition Schedule</strong>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Total Amount</span>
                                <strong className="font-mono">₦{Number(inv.totalAmount).toLocaleString()}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Paid Amount</span>
                                <strong className="font-mono text-emerald-700">₦{Number(inv.paidAmount || 0).toLocaleString()}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Outstanding Balance</span>
                                <strong className="font-mono text-blue-700">
                                  ₦{Number(inv.balance !== undefined ? inv.balance : inv.totalAmount - (inv.paidAmount || 0)).toLocaleString()}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No invoice records found for this ward.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI PARENT GUARDIAN ASSISTANT MODAL */}
      <ParentAssistantModal
        isOpen={showGuardianAi}
        onClose={() => setShowGuardianAi(false)}
        wardName={currentWard?.fullName || 'Your Ward'}
      />

      {/* REGISTER A WARD MODAL */}
      {showRegisterWardModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 my-8 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white p-6 rounded-t-3xl flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Parent Portal</span>
                <h2 className="text-xl font-black text-white mt-0.5">Register a Ward Application</h2>
                <p className="text-xs text-amber-100 mt-1">Submit an application for your ward to join STEMPACT Academy. Admissions will review and link them to your account.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterWardModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterWardSubmit} className="p-6 space-y-5 text-xs overflow-y-auto max-h-[72vh]">
              {registerWardError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">{registerWardError}</div>
              )}
              {registerWardSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">{registerWardSuccess}</div>
              )}

              {/* Personal Info */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input required type="text" value={wardFullName} onChange={(e) => setWardFullName(e.target.value)}
                    placeholder="Ward's full legal name" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address *</label>
                  <input required type="email" value={wardEmail} onChange={(e) => setWardEmail(e.target.value)}
                    placeholder="ward@email.com" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input type="tel" value={wardPhone} onChange={(e) => setWardPhone(e.target.value)}
                    placeholder="+234..." className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date of Birth *</label>
                  <input required type="date" value={wardDob} onChange={(e) => setWardDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Gender</label>
                  <select value={wardGender} onChange={(e) => setWardGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                    <option value="">-- Select --</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Your Relationship *</label>
                  <select required value={wardRelationship} onChange={(e) => setWardRelationship(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sponsor">Sponsor / Corporate</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Home Address *</label>
                <input required type="text" value={wardAddress} onChange={(e) => setWardAddress(e.target.value)}
                  placeholder="Full home address" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Education Level *</label>
                <select required value={wardEducationLevel} onChange={(e) => setWardEducationLevel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  <option value="">-- Select highest education level --</option>
                  <option value="Primary School">Primary School</option>
                  <option value="Junior Secondary School (JSS3)">Junior Secondary School (JSS3)</option>
                  <option value="Senior Secondary School (WAEC/NECO)">Senior Secondary School (WAEC/NECO)</option>
                  <option value="OND / NCE">OND / NCE</option>
                  <option value="HND / Bachelor's Degree">HND / Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              {/* Program & Center */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Program Preference</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Program of Interest</label>
                  <select value={wardProgramId} onChange={(e) => setWardProgramId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                    <option value="">-- Any program --</option>
                    {wardPrograms.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Preferred Learning Center</label>
                  <select value={wardCenterId} onChange={(e) => setWardCenterId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                    <option value="">-- No preference / Virtual --</option>
                    {wardCenters.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} {c.city ? `· ${c.city}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Preferred Schedule *</label>
                <select required value={wardPreferredSchedule} onChange={(e) => setWardPreferredSchedule(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white">
                  <option value="">-- Select schedule preference --</option>
                  <option value="Weekday Evenings (Mon, Wed, Fri 4–7pm)">Weekday Evenings (Mon, Wed, Fri 4–7pm)</option>
                  <option value="Weekend Intensive (Saturdays 10am–3pm)">Weekend Intensive (Saturdays 10am–3pm)</option>
                  <option value="Morning (Mon–Thu 9am–1pm)">Morning (Mon–Thu 9am–1pm)</option>
                  <option value="Flexible / Self-Paced Online">Flexible / Self-Paced Online</option>
                </select>
              </div>

              {/* Motivation fields */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Details</span>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Career Goals *</label>
                <textarea required rows={2} value={wardCareerGoals} onChange={(e) => setWardCareerGoals(e.target.value)}
                  placeholder="What does your ward want to achieve in their career?" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs resize-none" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Learning Objectives *</label>
                <textarea required rows={2} value={wardLearningObjectives} onChange={(e) => setWardLearningObjectives(e.target.value)}
                  placeholder="What specific skills or knowledge do they want to gain?" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs resize-none" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Statement of Purpose *</label>
                <textarea required rows={3} value={wardStatement} onChange={(e) => setWardStatement(e.target.value)}
                  placeholder="Why does your ward want to join STEMPACT Academy?" className="w-full p-2.5 rounded-xl border border-slate-200 text-xs resize-none" />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowRegisterWardModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={registeringWard || loadingWardResources}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer">
                  {registeringWard ? 'Submitting Application...' : 'Submit Ward Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default ParentPortalPage;
