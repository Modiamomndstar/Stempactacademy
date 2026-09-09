import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { PortalLayout } from '../../components/PortalLayout';
import {
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  FileText,
  Filter,
  Check,
  X,
  CreditCard,
  Edit,
  ExternalLink,
  Send,
  ShieldAlert,
  GraduationCap,
  Copy,
  Key,
  Building,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isSuperAdmin, isCoordinatorAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [pendingPlacements, setPendingPlacements] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bankTransfers, setBankTransfers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<
    | 'analytics'
    | 'admins'
    | 'instructors'
    | 'placements'
    | 'applications'
    | 'cohorts'
    | 'programs'
    | 'invoices'
    | 'certificates'
    | 'cms'
  >('analytics');

  // Modal / Review States
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [reviewingPlacement, setReviewingPlacement] = useState<any | null>(null);
  const [approvedLevelInput, setApprovedLevelInput] = useState<string>('Level 2 (Accelerated)');
  const [adminNotesInput, setAdminNotesInput] = useState<string>('Approved following diagnostic assessment review.');
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // New Announcement / CMS state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Create Admin Modal State
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    role: 'COORDINATOR_ADMIN' as 'COORDINATOR_ADMIN' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN',
    password: '',
  });

  // Create Instructor Modal State
  const [showCreateInstructorModal, setShowCreateInstructorModal] = useState(false);
  const [instructorFormData, setInstructorFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    specialization: 'Software Engineering & AI',
    qualification: 'B.Sc Computer Science / Software Engineering',
    assignedSchools: 'School of Software & AI',
    bio: 'Experienced faculty member mentoring learners in hands-on industry practices.',
    password: '',
  });
  const [createdInstructorCard, setCreatedInstructorCard] = useState<any | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const loadAllData = async () => {
    try {
      const [
        statsRes,
        appsRes,
        placementsRes,
        cohortsRes,
        progRes,
        invRes,
        adminsRes,
        instructorsRes,
        certsRes,
        transfersRes,
      ] = await Promise.all([
        api.getAdminStats(),
        api.getApplications(),
        api.getPendingPlacements(),
        api.getCohorts(),
        api.getPrograms(),
        api.getInvoices(),
        api.getAdmins().catch(() => ({ admins: [] })),
        api.getInstructors().catch(() => ({ instructors: [] })),
        api.getCertificates().catch(() => ({ certificates: [] })),
        api.getBankTransfers().catch(() => ({ payments: [] })),
      ]);

      setStats(statsRes);
      setApplications(appsRes.applications || []);
      setPendingPlacements(placementsRes.placements || []);
      setCohorts(cohortsRes.cohorts || []);
      setPrograms(progRes.programs || []);
      setInvoices(invRes.invoices || []);
      setAdmins(adminsRes.admins || []);
      setInstructors(instructorsRes.instructors || []);
      setCertificates(certsRes.certificates || []);
      setBankTransfers(transfersRes.payments || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. Approve Placement
  const handleApprovePlacement = async (placementId: string) => {
    setProcessingAction(true);
    try {
      await api.reviewPlacement(placementId, {
        action: 'APPROVE',
        approvedLevel: approvedLevelInput,
        adminNotes: adminNotesInput,
      });
      setActionSuccess('Placement approved by Academic Board! Ready for admission issuance.');
      setReviewingPlacement(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve placement');
    } finally {
      setProcessingAction(false);
    }
  };

  // 2. Issue Admission
  const handleIssueAdmission = async (applicationId: string, cohortId?: string) => {
    setProcessingAction(true);
    try {
      const res = await api.issueAdmission({
        applicationId,
        cohortId,
        assignedClass: 'Turing Computer Lab 1',
      });
      setActionSuccess(
        `Admission issued successfully! Student ID: ${res.studentIdNumber} • Admission No: ${res.admissionNumber}`
      );
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to issue admission');
    } finally {
      setProcessingAction(false);
    }
  };

  // 3. Toggle Program Status
  const handleToggleProgramStatus = async (programId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN_FOR_APPLICATION' ? 'FULL' : 'OPEN_FOR_APPLICATION';
    try {
      await api.updateProgramStatus(programId, { status: newStatus });
      setActionSuccess(`Program status switched to ${newStatus}`);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update program status');
    }
  };

  // 4. Broadcast Announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    try {
      await api.createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        targetAudience: 'ALL',
        priority: 'HIGH',
      });
      setActionSuccess('Announcement broadcasted to all students and faculty!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to create announcement');
    }
  };

  // Bank Transfer Actions
  const handleApproveBankTransfer = async (paymentId: string) => {
    setProcessingAction(true);
    try {
      await api.approveBankTransfer(paymentId);
      setActionSuccess('Bank transfer payment verified & approved! Official receipt emitted.');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve bank transfer');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectBankTransfer = async (paymentId: string) => {
    const reason = window.prompt('Enter reason for rejecting this payment:', 'Payment could not be verified on bank statement');
    if (!reason) return;
    setProcessingAction(true);
    try {
      await api.rejectBankTransfer(paymentId, reason);
      setActionSuccess('Bank transfer has been rejected.');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject bank transfer');
    } finally {
      setProcessingAction(false);
    }
  };

  // 5. Handle Create Admin
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      await api.createAdmin(adminFormData);
      setActionSuccess(
        `Administrator account created for ${adminFormData.firstName} ${adminFormData.lastName} (${adminFormData.role})!`
      );
      setShowCreateAdminModal(false);
      setAdminFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phone: '',
        role: 'COORDINATOR_ADMIN',
        password: '',
      });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create administrator');
    } finally {
      setProcessingAction(false);
    }
  };

  // 6. Handle Create Instructor
  const handleCreateInstructorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      const res = await api.createInstructor(instructorFormData);
      setCreatedInstructorCard({
        instructor: res.instructor,
        tempPassword: instructorFormData.password,
        loginUrl: `${window.location.origin}/portal/instructor/login`,
      });
      setActionSuccess(
        `Faculty account created for ${instructorFormData.firstName} ${instructorFormData.lastName}! Staff Code: ${res.instructor.instructorProfile?.staffCode}`
      );
      setShowCreateInstructorModal(false);
      setInstructorFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phone: '',
        specialization: 'Software Engineering & AI',
        qualification: 'B.Sc Computer Science / Software Engineering',
        assignedSchools: 'School of Software & AI',
        bio: 'Experienced faculty member mentoring learners in hands-on industry practices.',
        password: '',
      });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create instructor');
    } finally {
      setProcessingAction(false);
    }
  };

  const copyInstructorCredentials = () => {
    if (!createdInstructorCard) return;
    const text = `STEMPACT ACADEMY - FACULTY CREDENTIALS
Name: ${createdInstructorCard.instructor.firstName} ${createdInstructorCard.instructor.lastName}
Staff Code: ${createdInstructorCard.instructor.instructorProfile?.staffCode}
Username: ${createdInstructorCard.instructor.username}
Email: ${createdInstructorCard.instructor.email}
Password: ${createdInstructorCard.tempPassword}
Faculty Login Portal: ${createdInstructorCard.loginUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  if (loading) return <LoadingSpinner message="Loading Executive Management Console..." />;

  return (
    <PortalLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)}>
      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
                  EXECUTIVE ACADEMIC CONSOLE
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {user?.role.replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                STEMPACT Administration Hub
              </h1>
              <p className="text-xs text-slate-400">
                Ile-Ife Campus Operations • Admissions Pipeline • Faculty Governance • Financial Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllData()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Refresh Data
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Admin</span>
              </button>
            )}
            <button
              onClick={() => setShowCreateInstructorModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Instructor</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span className="font-semibold">{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-900">
              ×
            </button>
          </div>
        )}

        {/* Horizontal Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-thin">
          {[
            { id: 'analytics', name: 'Executive KPIs' },
            { id: 'admins', name: `Admin Accounts (${admins.length})`, superOnly: true },
            { id: 'instructors', name: `Faculty & Instructors (${instructors.length})` },
            { id: 'placements', name: `Placements Queue (${pendingPlacements.length})` },
            { id: 'applications', name: `Admissions Pipeline (${applications.length})` },
            { id: 'cohorts', name: `Cohorts (${cohorts.length})` },
            { id: 'programs', name: `Programs (${programs.length})` },
            { id: 'invoices', name: `Revenue (${invoices.length})` },
            { id: 'certificates', name: `Certificates (${certificates.length})` },
            { id: 'cms', name: 'CMS & Bulletins' },
          ]
            .filter((tab) => !tab.superOnly || isSuperAdmin)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.name}
              </button>
            ))}
        </div>

        {/* TAB 1: EXECUTIVE ANALYTICS */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Applicants</span>
                <div className="text-2xl font-black text-slate-900">{stats?.metrics?.totalApplicants || 0}</div>
                <div className="text-[11px] text-blue-600 font-semibold">{stats?.metrics?.newApplicants || 0} New Pending</div>
              </Card>

              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Admitted Learners</span>
                <div className="text-2xl font-black text-emerald-600">{stats?.metrics?.admittedStudents || 0}</div>
                <div className="text-[11px] text-slate-500 font-semibold">{stats?.metrics?.conversionRate || 0}% Conversion Rate</div>
              </Card>

              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue Collected</span>
                <div className="text-2xl font-black text-slate-900">
                  ₦{(stats?.metrics?.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-600 font-semibold">
                  ₦{(stats?.metrics?.outstandingInvoices || stats?.metrics?.outstandingBalance || 0).toLocaleString()} Outstanding
                </div>
              </Card>

              <Card className="p-5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Cohorts</span>
                <div className="text-2xl font-black text-slate-900">
                  {stats?.metrics?.activeCohorts || stats?.metrics?.cohortsCount || 0}
                </div>
                <div className="text-[11px] text-purple-600 font-semibold">
                  {stats?.metrics?.totalPrograms || stats?.metrics?.programsCount || 0} Academic Tracks
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Pipeline Distribution by Status</span>
                </h3>
                <div className="space-y-3">
                  {(stats?.applicationsByStatus || []).length > 0 ? (
                    (stats.applicationsByStatus || []).map((item: any) => (
                      <div key={item.status} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.status?.replace(/_/g, ' ') || 'Pending'}</span>
                          <span>{item._count || 0} applicants</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${((item._count || 0) / (stats?.metrics?.totalApplicants || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">No application records found.</div>
                  )}
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Top Enrolled Academic Programs</span>
                </h3>
                <div className="space-y-3 text-xs">
                  {(stats?.popularPrograms || stats?.programsWithEnrolledCount || []).slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.code} • {p.durationWeeks || 12} Weeks</div>
                      </div>
                      <Badge variant="blue">{p.applicantCount || p._count?.applications || 0} Enrolled</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN ACCOUNTS MANAGEMENT */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Administrator Accounts</h2>
                <p className="text-xs text-slate-500">
                  Provision and govern institutional admin roles (Super Admin, Coordinator Admin, Academic Admin, Finance Admin).
                </p>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Admin Account</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map((adm: any) => (
                <Card key={adm.id} className="p-5 space-y-4 border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                        {adm.firstName ? adm.firstName[0] : 'A'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {adm.firstName} {adm.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {adm.username ? `@${adm.username}` : adm.email}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        adm.role === 'SUPER_ADMIN'
                          ? 'bg-rose-100 text-rose-800'
                          : adm.role === 'COORDINATOR_ADMIN'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {adm.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-medium text-slate-800">{adm.email}</span>
                    </div>
                    {adm.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-medium text-slate-800">{adm.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-emerald-600">Active</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY & INSTRUCTORS MANAGEMENT */}
        {activeTab === 'instructors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Faculty & Instructors Directory</h2>
                <p className="text-xs text-slate-500">
                  Onboard faculty mentors, generate staff codes, assign academic schools, and issue login credentials.
                </p>
              </div>
              <button
                onClick={() => setShowCreateInstructorModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Instructor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map((ins: any) => (
                <Card key={ins.id} className="p-5 space-y-4 border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center">
                        {ins.firstName ? ins.firstName[0] : 'I'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {ins.firstName} {ins.lastName}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-mono font-bold">
                          {ins.instructorProfile?.staffCode || 'STP-INS-FACULTY'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="green">Faculty</Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Specialization:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {ins.instructorProfile?.specialization || 'STEM / Technology'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qualification:</span>
                      <span className="text-slate-700 text-right truncate max-w-[180px]">
                        {ins.instructorProfile?.qualification || 'Certified Professional'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-mono text-slate-800">{ins.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned School:</span>
                      <span className="font-medium text-slate-800 text-right">
                        {ins.instructorProfile?.assignedSchools || 'School of Software & AI'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PLACEMENTS REVIEW QUEUE */}
        {activeTab === 'placements' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Academic Board Placement Queue</h2>
              <p className="text-xs text-slate-500">
                Review diagnostic assessment results and approve student level placement.
              </p>
            </div>

            {pendingPlacements.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <div className="font-bold text-slate-700">Placement Review Queue is Clean</div>
                <p className="text-xs">All completed diagnostic assessments have been processed by the Board.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingPlacements.map((plc: any) => (
                  <Card key={plc.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {plc.application?.fullName}
                        </span>
                        <Badge variant="blue">App: {plc.application?.applicationNumber}</Badge>
                      </div>
                      <div className="text-xs text-slate-600">
                        Target Program: <span className="font-semibold">{plc.application?.program?.name}</span>
                      </div>
                      <div className="text-xs text-amber-700 font-semibold">
                        Algorithm Recommendation: {plc.recommendedLevel} ({plc.reason})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReviewingPlacement(plc)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                      >
                        Review & Approve
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: APPLICATIONS PIPELINE */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Admissions Intake Pipeline</h2>
              <p className="text-xs text-slate-500">
                Manage registered learners, verify entry criteria, and issue official admissions.
              </p>
            </div>

            <div className="space-y-3">
              {applications.map((app: any) => (
                <Card key={app.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{app.fullName}</span>
                      <span className="text-xs font-mono text-slate-500">{app.applicationNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === 'ADMITTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {app.program?.name} • {app.email} • {app.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {app.status !== 'ADMITTED' && (
                      <button
                        onClick={() => handleIssueAdmission(app.id, app.cohortId)}
                        disabled={processingAction}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                      >
                        Issue Official Admission
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: COHORTS */}
        {activeTab === 'cohorts' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900">Cohorts & Class Schedules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohorts.map((c: any) => (
                <Card key={c.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono text-blue-600 font-bold">{c.code}</div>
                      <div className="font-bold text-sm text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.program?.name}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Schedule: {c.schedule}</div>
                    <div>Capacity: {c.maxSeats} Seats (Enrolled: {c.enrolledCount || 0})</div>
                    <div>
                      Dates: {c.startDate ? new Date(c.startDate).toLocaleDateString() : 'TBA'} –{' '}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'TBA'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: PROGRAMS */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900">Academic Programs Catalog</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((p: any) => (
                <Card key={p.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600">{p.code}</span>
                      <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                    </div>
                    <button
                      onClick={() => handleToggleProgramStatus(p.id, p.status)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'OPEN_FOR_APPLICATION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
                    <span>₦{(p.tuitionFeeNgn || p.cohorts?.[0]?.trainingFee || 0).toLocaleString()}</span>
                    <span className="text-slate-400">{p.durationWeeks || p.duration || '12 Weeks'}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: REVENUE & BANK TRANSFERS */}
        {activeTab === 'invoices' && (
          <div className="space-y-8">
            {/* 1. Bank Transfer Verification Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-emerald-600" />
                    <span>Bank Transfer Verification Queue ({bankTransfers.filter(t => t.status === 'PENDING').length} Pending)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review and verify student payment receipts/tellers against official bank statements.
                  </p>
                </div>
              </div>

              {bankTransfers.length === 0 ? (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No bank transfer submissions recorded.
                </Card>
              ) : (
                <div className="space-y-3">
                  {bankTransfers.map((tx: any) => (
                    <Card key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600">{tx.paymentReference}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700">
                          <strong>Payer:</strong> {tx.senderAccount || 'Student'} • <strong>Bank:</strong> {tx.senderBank || 'Access Bank'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Invoice: {tx.invoice?.invoiceNumber || tx.invoiceId} • Submitted: {new Date(tx.paidAt).toLocaleString()}
                        </div>
                        {tx.proofUrl && (
                          <div className="pt-1">
                            <a
                              href={tx.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Uploaded Teller / Proof</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-base block">₦{(tx.amount || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400">NGN Direct Deposit</span>
                        </div>

                        {tx.status === 'PENDING' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleApproveBankTransfer(tx.id)}
                              disabled={processingAction}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectBankTransfer(tx.id)}
                              disabled={processingAction}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Institutional Invoices Ledger */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-lg font-black text-slate-900">All Academic Invoices ({invoices.length})</h2>
              <div className="space-y-3">
                {invoices.map((inv: any) => (
                  <Card key={inv.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-500">{inv.invoiceNumber}</div>
                      <div className="font-bold text-sm text-slate-900">{inv.title}</div>
                      <div className="text-xs text-slate-500">
                        Paid: ₦{(inv.amountPaid || 0).toLocaleString()} • Balance: ₦{(inv.balance || 0).toLocaleString()} • Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="font-black text-slate-900 text-sm block">
                        ₦{(inv.totalAmount || 0).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Accredited Certificates & Clearances</h2>
                <p className="text-xs text-slate-500">
                  Manage cryptographically verifiable student certificates and graduation clearances.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {certificates.length === 0 ? (
                <Card className="p-10 text-center text-slate-400">
                  <Award className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                  <div className="font-bold text-slate-700">No Certificates Issued Yet</div>
                  <p className="text-xs">Certificates appear here as cohorts finish capstones and graduation review.</p>
                </Card>
              ) : (
                certificates.map((cert: any) => (
                  <Card key={cert.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-600">{cert.certificateNumber}</div>
                      <div className="font-bold text-sm text-slate-900">{cert.title}</div>
                      <div className="text-xs text-slate-500">Recipient: {cert.student?.user?.firstName} {cert.student?.user?.lastName}</div>
                    </div>
                    <Link
                      to={`/verify/${cert.certificateNumber}`}
                      target="_blank"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Public Verification</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 10: CMS & ANNOUNCEMENTS */}
        {activeTab === 'cms' && (
          <Card className="p-8 space-y-6">
            <h3 className="font-bold text-base text-slate-900">Broadcast Campus Announcement</h3>
            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Announcement Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update for 2025 Full-Stack Sprint"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Announcement Content *</label>
                <textarea
                  rows={4}
                  placeholder="Official memo broadcasted across Student, Parent, and Instructor dashboards..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast Announcement</span>
              </button>
            </form>
          </Card>
        )}
      </div>

      {/* MODAL: CREATE ADMIN */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Create Administrator Account</h3>
                  <p className="text-xs text-slate-500">Super Admin Governance Action</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Oluwaseun"
                    value={adminFormData.firstName}
                    onChange={(e) =>
                      setAdminFormData({ ...adminFormData, firstName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Adeleke"
                    value={adminFormData.lastName}
                    onChange={(e) =>
                      setAdminFormData({ ...adminFormData, lastName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Email *</label>
                <input
                  type="email"
                  placeholder="name@stempact.org"
                  value={adminFormData.email}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, email: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. seun.admin"
                    value={adminFormData.username}
                    onChange={(e) =>
                      setAdminFormData({ ...adminFormData, username: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Admin Role *</label>
                  <select
                    value={adminFormData.role}
                    onChange={(e) =>
                      setAdminFormData({ ...adminFormData, role: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="COORDINATOR_ADMIN">Coordinator Admin</option>
                    <option value="ACADEMIC_ADMIN">Academic Admin</option>
                    <option value="FINANCE_ADMIN">Finance Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={adminFormData.password}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, password: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {processingAction ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INSTRUCTOR */}
      {showCreateInstructorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Onboard Faculty Instructor</h3>
                  <p className="text-xs text-slate-500">Auto-generates STP-INS Staff Code</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateInstructorModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInstructorSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Babatunde"
                    value={instructorFormData.firstName}
                    onChange={(e) =>
                      setInstructorFormData({ ...instructorFormData, firstName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ogunleye"
                    value={instructorFormData.lastName}
                    onChange={(e) =>
                      setInstructorFormData({ ...instructorFormData, lastName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    placeholder="instructor@stempact.org"
                    value={instructorFormData.email}
                    onChange={(e) =>
                      setInstructorFormData({ ...instructorFormData, email: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. b.ogunleye"
                    value={instructorFormData.username}
                    onChange={(e) =>
                      setInstructorFormData({ ...instructorFormData, username: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Specialization *</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Web, Embedded Systems, Python AI"
                  value={instructorFormData.specialization}
                  onChange={(e) =>
                    setInstructorFormData({
                      ...instructorFormData,
                      specialization: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Highest Qualification *</label>
                <input
                  type="text"
                  placeholder="e.g. B.Sc Computer Engineering, OAU"
                  value={instructorFormData.qualification}
                  onChange={(e) =>
                    setInstructorFormData({
                      ...instructorFormData,
                      qualification: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Assigned Academic School</label>
                <select
                  value={instructorFormData.assignedSchools}
                  onChange={(e) =>
                    setInstructorFormData({
                      ...instructorFormData,
                      assignedSchools: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="School of Software & AI">School of Software & AI</option>
                  <option value="School of Robotics & Embedded Systems">
                    School of Robotics & Embedded Systems
                  </option>
                  <option value="School of Applied Science & Labs">
                    School of Applied Science & Labs
                  </option>
                  <option value="School of Digital Design & Media">
                    School of Digital Design & Media
                  </option>
                  <option value="School of Mathematical Sciences">
                    School of Mathematical Sciences
                  </option>
                  <option value="School of Renewable Energy & AgriTech">
                    School of Renewable Energy & AgriTech
                  </option>
                  <option value="School of Vocational Tech & Fabrication">
                    School of Vocational Tech & Fabrication
                  </option>
                  <option value="School of Innovation & Entrepreneurship">
                    School of Innovation & Entrepreneurship
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={instructorFormData.password}
                  onChange={(e) =>
                    setInstructorFormData({ ...instructorFormData, password: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInstructorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                >
                  {processingAction ? 'Onboarding...' : 'Onboard Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSTRUCTOR CREDENTIALS SUCCESS CARD */}
      {createdInstructorCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                Faculty Account Ready
              </span>
              <h3 className="text-xl font-black text-slate-900">
                {createdInstructorCard.instructor.firstName} {createdInstructorCard.instructor.lastName}
              </h3>
              <p className="text-xs text-slate-500">
                Share these credentials with the instructor to access the faculty cockpit.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400">Staff Code: </span>
                <span className="font-bold text-emerald-700">
                  {createdInstructorCard.instructor.instructorProfile?.staffCode}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Username: </span>
                <span className="font-bold text-slate-800">
                  {createdInstructorCard.instructor.username}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Email: </span>
                <span className="text-slate-800">{createdInstructorCard.instructor.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Password: </span>
                <span className="font-bold text-indigo-700">
                  {createdInstructorCard.tempPassword}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Faculty Portal: </span>
                <span className="text-blue-600 underline break-all">
                  {createdInstructorCard.loginUrl}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyInstructorCredentials}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Credentials Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setCreatedInstructorCard(null)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PLACEMENT REVIEW */}
      {reviewingPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base">Review Diagnostic Placement</h3>
                <p className="text-xs text-slate-500">Applicant: {reviewingPlacement.application?.fullName}</p>
              </div>
              <button onClick={() => setReviewingPlacement(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">
                  Target: {reviewingPlacement.application?.program?.name}
                </div>
                <div className="text-blue-600 font-semibold">
                  Algorithm Recommendation: {reviewingPlacement.recommendedLevel}
                </div>
                <div className="text-slate-500">{reviewingPlacement.reason}</div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approved Level *</label>
                <select
                  value={approvedLevelInput}
                  onChange={(e) => setApprovedLevelInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Level 1 (Foundation)">Level 1 (Foundation)</option>
                  <option value="Level 2 (Accelerated)">Level 2 (Accelerated)</option>
                  <option value="Level 3 (Advanced Specialization)">Level 3 (Advanced Specialization)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Academic Board Review Notes</label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingPlacement(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApprovePlacement(reviewingPlacement.id)}
                  disabled={processingAction}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {processingAction ? 'Approving...' : 'Confirm Academic Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
