import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, LoadingSpinner } from '../../components/UIElements';
import { PortalLayout } from '../../components/PortalLayout';
import { PageHeader } from '../../components/PageHeader';
import { AIProgramGeneratorModal } from '../../components/AIProgramGeneratorModal';
import { CohortAnalysisModal } from '../../components/CohortAnalysisModal';
import { AdmissionsManager } from '../../components/admin/AdmissionsManager';
import { FinanceManager } from '../../components/admin/FinanceManager';
import { AcademicOperationsManager } from '../../components/admin/AcademicOperationsManager';
import { CertificateManager } from '../../components/admin/CertificateManager';
import { AIAdminManager } from '../../components/admin/AIAdminManager';
import { NotificationDeliveriesManager } from '../../components/admin/NotificationDeliveriesManager';
import {
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  ShieldCheck,
  Plus,
  Sparkles,
  Award,
  Layers,
  Send,
  ShieldAlert,
  GraduationCap,
  Copy,
  Building,
  RefreshCw,
  Mail,
  UserCheck,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    isSuperAdmin,
    isAcademicAdmin,
    isFinanceAdmin,
    isAdmissionsAdmin,
    isCoordinator,
    isContentManager,
    isMarketingManager,
  } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  // Primary Data Collections
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [pendingPlacements, setPendingPlacements] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bankTransfers, setBankTransfers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [aiGenerations, setAiGenerations] = useState<any[]>([]);
  const [notificationDeliveries, setNotificationDeliveries] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Global action notifications
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // Modals & Sub-actions
  const [selectedCohortAnalysis, setSelectedCohortAnalysis] = useState<string | null>(null);
  const [showAIProgramModal, setShowAIProgramModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateInstructorModal, setShowCreateInstructorModal] = useState(false);

  // Cohort Fee Edit Modal State
  const [editingCohort, setEditingCohort] = useState<any | null>(null);
  const [cohortFeeForm, setCohortFeeForm] = useState({
    trainingFee: 65000,
    registrationFee: 5000,
    certificationFee: 10000,
    discountPercentage: 0,
    maxCapacity: 30,
    status: 'OPEN',
    schedule: '',
    mode: 'Hybrid (Onsite Ile-Ife & Virtual)',
    installmentPlan: 'full',
  });

  // Admin Creation Form
  const [adminFormData, setAdminFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    role: 'COORDINATOR_ADMIN' as 'COORDINATOR_ADMIN' | 'ACADEMIC_ADMIN' | 'FINANCE_ADMIN',
    password: '',
  });

  // Faculty Onboarding Form
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

  // Announcements & CMS State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState<'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'PARENTS'>('ALL');
  const [announcementPriority, setAnnouncementPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Extract enrolled students list from invoices and certificates for readiness evaluation
  const gatheredStudents = useMemo(() => {
    const map = new Map<string, any>();
    invoices.forEach((inv) => {
      if (inv.student && inv.student.id) {
        map.set(inv.student.id, {
          id: inv.student.id,
          studentIdNumber: inv.student.studentIdNumber,
          user: inv.student.user,
          cohort: inv.application?.cohort,
        });
      }
    });
    certificates.forEach((c) => {
      if (c.student && c.student.id && !map.has(c.student.id)) {
        map.set(c.student.id, {
          id: c.student.id,
          studentIdNumber: c.student.studentIdNumber,
          user: c.student.user,
          cohort: c.student.cohort,
        });
      }
    });
    return Array.from(map.values());
  }, [invoices, certificates]);

  const loadAllData = async () => {
    try {
      const [
        statsRes,
        appsRes,
        placementsRes,
        cohortsRes,
        progRes,
        schoolsRes,
        invRes,
        adminsRes,
        instructorsRes,
        certsRes,
        transfersRes,
        auditRes,
        aiRes,
        deliveriesRes,
        cmsRes,
      ] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getApplications().catch(() => ({ applications: [] })),
        api.getPendingPlacements().catch(() => ({ placements: [] })),
        api.getCohorts().catch(() => ({ cohorts: [] })),
        api.getPrograms().catch(() => ({ programs: [] })),
        api.getSchools().catch(() => ({ schools: [] })),
        api.getInvoices().catch(() => ({ invoices: [] })),
        api.getAdmins().catch(() => ({ admins: [] })),
        api.getInstructors().catch(() => ({ instructors: [] })),
        api.getCertificates().catch(() => ({ certificates: [] })),
        api.getBankTransfers().catch(() => ({ payments: [] })),
        api.getAuditLogs({ limit: 50 }).catch(() => ({ logs: [] })),
        api.getAIGenerations().catch(() => ({ data: [] })),
        api.getNotificationDeliveries().catch(() => ({ data: [] })),
        api.getCMSContent().catch(() => ({ announcements: [] })),
      ]);

      setStats(statsRes);
      setApplications(appsRes?.applications || []);
      setPendingPlacements(placementsRes?.placements || []);
      setCohorts(cohortsRes?.cohorts || []);
      setPrograms(progRes?.programs || []);
      setSchools(schoolsRes?.schools || []);
      setInvoices(invRes?.invoices || []);
      setAdmins(adminsRes?.admins || []);
      setInstructors(instructorsRes?.instructors || []);
      setCertificates(certsRes?.certificates || []);
      setBankTransfers(transfersRes?.payments || []);
      setAuditLogs(auditRes?.logs || []);
      setAiGenerations(aiRes?.data || []);
      setNotificationDeliveries(deliveriesRes?.data || []);
      setAnnouncements(cmsRes?.announcements || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Canonical tab registry with role-based visibility
  const availableTabs = useMemo(() => {
    return [
      { id: 'analytics', name: 'Executive Intelligence', icon: TrendingUp },
      {
        id: 'admissions',
        name: `Admissions & Placements (${applications.length})`,
        icon: Users,
        visible: isSuperAdmin || isAdmissionsAdmin || isAcademicAdmin || isCoordinator,
      },
      {
        id: 'academics',
        name: `Academic Operations (${programs.length})`,
        icon: BookOpen,
        visible: isSuperAdmin || isAcademicAdmin || isCoordinator,
      },
      {
        id: 'finance',
        name: `Financial Ledger (${invoices.length})`,
        icon: DollarSign,
        visible: isSuperAdmin || isFinanceAdmin,
      },
      {
        id: 'certificates',
        name: `Certifications (${certificates.length})`,
        icon: Award,
        visible: isSuperAdmin || isAcademicAdmin || isCoordinator,
      },
      {
        id: 'ai',
        name: `AI Governance (${aiGenerations.length})`,
        icon: Sparkles,
        visible: isSuperAdmin || isAcademicAdmin || isCoordinator,
      },
      {
        id: 'deliveries',
        name: `Communications Outbox (${notificationDeliveries.length})`,
        icon: Send,
        visible: isSuperAdmin || isAcademicAdmin || isAdmissionsAdmin || isCoordinator,
      },
      {
        id: 'instructors',
        name: `Faculty & Mentors (${instructors.length})`,
        icon: GraduationCap,
        visible: isSuperAdmin || isAcademicAdmin || isCoordinator,
      },
      {
        id: 'admins',
        name: `Admin Accounts (${admins.length})`,
        icon: ShieldCheck,
        visible: isSuperAdmin,
      },
      {
        id: 'cms',
        name: `School Bulletins (${announcements.length})`,
        icon: Layers,
        visible: isSuperAdmin || isContentManager || isMarketingManager || isCoordinator,
      },
      {
        id: 'audit',
        name: `Audit Trail (${auditLogs.length})`,
        icon: ShieldAlert,
        visible: isSuperAdmin,
      },
    ].filter((t) => t.visible !== false);
  }, [
    isSuperAdmin,
    isAcademicAdmin,
    isFinanceAdmin,
    isAdmissionsAdmin,
    isCoordinator,
    isContentManager,
    isMarketingManager,
    applications.length,
    programs.length,
    invoices.length,
    certificates.length,
    aiGenerations.length,
    notificationDeliveries.length,
    instructors.length,
    admins.length,
    auditLogs.length,
  ]);

  // URL-synchronized active tab
  const rawUrlTab = searchParams.get('tab');
  const activeTab = useMemo(() => {
    if (!rawUrlTab) return 'analytics';
    if (['admissions', 'applications', 'placements'].includes(rawUrlTab)) return 'admissions';
    if (['academics', 'programs', 'cohorts', 'calendar', 'sessions'].includes(rawUrlTab)) return 'academics';
    if (['finance', 'invoices', 'transfers'].includes(rawUrlTab)) return 'finance';
    if (['faculty', 'instructors'].includes(rawUrlTab)) return 'instructors';
    const match = availableTabs.find((t) => t.id === rawUrlTab);
    return match ? match.id : 'analytics';
  }, [rawUrlTab, availableTabs]);

  const handleTabChange = (newTabId: string) => {
    setSearchParams({ tab: newTabId });
  };

  // Broadcast Announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    try {
      await api.createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        targetAudience: announcementAudience,
        priority: announcementPriority,
      });
      setActionSuccess('School announcement broadcasted successfully!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      const cmsRes = await api.getCMSContent().catch(() => ({ announcements: [] }));
      setAnnouncements(cmsRes?.announcements || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create announcement');
    }
  };

  // Create Admin
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

  // Create Instructor
  const handleCreateInstructorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      const res = await api.createInstructor(instructorFormData);
      setActionSuccess(
        `Faculty account created successfully for ${instructorFormData.firstName} ${instructorFormData.lastName}. Staff Code: ${res.instructor.staffCode || res.instructor.instructorProfile?.staffCode}. Account is now active in directory.`
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

  // Open Edit Cohort Pricing Modal
  const handleOpenEditCohort = (c: any) => {
    setEditingCohort(c);
    setCohortFeeForm({
      trainingFee: c.trainingFee ?? 65000,
      registrationFee: c.registrationFee ?? 5000,
      certificationFee: c.certificationFee ?? 10000,
      discountPercentage: c.discountPercentage ?? 0,
      maxCapacity: c.maxCapacity ?? 30,
      status: c.status ?? 'OPEN',
      schedule: c.schedule ?? '',
      mode: c.mode ?? 'Hybrid (Onsite Ile-Ife & Virtual)',
      installmentPlan: c.installmentPlan ?? 'full',
    });
  };

  const handleSaveCohortFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCohort) return;
    setProcessingAction(true);
    try {
      await api.updateCohort(editingCohort.id, cohortFeeForm);
      setActionSuccess(`Pricing & schedule updated for cohort ${editingCohort.name}!`);
      setEditingCohort(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update cohort fee configuration');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout activeTab={activeTab} onTabChange={handleTabChange}>
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner message="Connecting to STEMPACT Administrative Ledger & Operational APIs..." />
        </div>
      </PortalLayout>
    );
  }

  const getPageHeaderConfig = () => {
    switch (activeTab) {
      case 'analytics':
        return {
          title: 'Executive Dashboard',
          subtitle: 'Institutional health metrics, student intake pacing, and financial ledger status.',
          badge: <Badge variant="blue">{user?.role?.replace(/_/g, ' ') || 'Staff'}</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      case 'academics':
        return {
          title: rawUrlTab === 'cohorts' ? 'Cohorts & Timetables' : 'Schools & Programs',
          subtitle:
            rawUrlTab === 'cohorts'
              ? 'Cohort rosters, session scheduling, capacity limits, and fee structures.'
              : 'Canonical academic curriculum structures, degree paths, and course syllabi.',
          badge: (
            <Badge variant="slate">
              {schools.length > 0 ? `${schools.length} Schools • ` : ''}
              {programs.length} Programs • {cohorts.length} Cohorts
            </Badge>
          ),
          actions: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAllData()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
              {(isSuperAdmin || isAcademicAdmin || isCoordinator) && (
                <button
                  onClick={() => setShowAIProgramModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white text-xs font-bold shadow-md transition"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Curriculum Architect</span>
                </button>
              )}
            </div>
          ),
        };
      case 'admissions':
        return {
          title: 'Admissions & Placements',
          subtitle: 'Applicant intake pipeline, diagnostic placement reviews, and cohort allocation.',
          badge: <Badge variant="slate">{applications.length} Applicants</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      case 'finance':
        return {
          title: 'Tuition & Financial Ledger',
          subtitle: 'Tuition invoice tracking, bank transfer reconciliation, and clearance records.',
          badge: <Badge variant="slate">{invoices.length} Invoices</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      case 'certificates':
        return {
          title: 'Certificates & Verification',
          subtitle: 'Issued credentials, cryptographic verification registry, and issuance desk.',
          badge: <Badge variant="slate">{certificates.length} Issued</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      case 'ai':
        return {
          title: 'AI Studio & Governance',
          subtitle: 'Autonomous curriculum generation audit logs, prompt safety, and review queue.',
          badge: <Badge variant="slate">{aiGenerations.length} Logs</Badge>,
          actions: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAllData()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
              {(isSuperAdmin || isAcademicAdmin || isCoordinator) && (
                <button
                  onClick={() => setShowAIProgramModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white text-xs font-bold shadow-md transition"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Curriculum Architect</span>
                </button>
              )}
            </div>
          ),
        };
      case 'deliveries':
        return {
          title: 'Communications Outbox',
          subtitle: 'Transactional notification dispatch logs, queue latency, and delivery reports.',
          badge: <Badge variant="slate">{notificationDeliveries.length} Messages</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      case 'instructors':
        return {
          title: 'Faculty & Mentors',
          subtitle: 'Instructional staff roster, specializations, credentials, and teaching assignments.',
          badge: <Badge variant="slate">{instructors.length} Faculty</Badge>,
          actions: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAllData()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
              {(isSuperAdmin || isAcademicAdmin || isCoordinator) && (
                <button
                  onClick={() => setShowCreateInstructorModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard Faculty</span>
                </button>
              )}
            </div>
          ),
        };
      case 'admins':
        return {
          title: 'Admin Accounts',
          subtitle: 'Operational administrator profiles, system security privileges, and RBAC roles.',
          badge: <Badge variant="slate">{admins.length} Staff</Badge>,
          actions: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAllData()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Admin</span>
                </button>
              )}
            </div>
          ),
        };
      case 'cms':
        return {
          title: 'School Bulletins & Announcements',
          subtitle: 'Official announcements and notices broadcast to students, faculty, and guardians.',
          badge: <Badge variant="slate">{announcements.length} Published</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      case 'audit':
        return {
          title: 'Security Audit Trail',
          subtitle: 'Immutable chronological record of administrative actions, data edits, and auth events.',
          badge: <Badge variant="slate">{auditLogs.length} Events</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
      default:
        return {
          title: 'Executive Console',
          subtitle: 'Institutional management and administration overview.',
          badge: <Badge variant="blue">{user?.role?.replace(/_/g, ' ') || 'Staff'}</Badge>,
          actions: (
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          ),
        };
    }
  };

  const pageHeader = getPageHeaderConfig();

  return (
    <PortalLayout activeTab={rawUrlTab || activeTab} onTabChange={handleTabChange}>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Dynamic Domain Page Header */}
        <PageHeader
          title={pageHeader.title}
          subtitle={pageHeader.subtitle}
          badge={pageHeader.badge}
          actions={pageHeader.actions}
        />

        {/* Global Action Banner */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span className="font-semibold">{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="font-bold text-emerald-950 hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: EXECUTIVE ANALYTICS */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Applicants</span>
                <div className="text-3xl font-black text-white mt-1">{stats?.metrics?.totalApplicants || 0}</div>
                <div className="text-[11px] text-brand-400 font-semibold mt-1">
                  {stats?.metrics?.newApplicants || 0} New Pending
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Admitted Learners</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{stats?.metrics?.admittedStudents || 0}</div>
                <div className="text-[11px] text-slate-400 font-semibold mt-1">
                  {stats?.metrics?.conversionRate || 0}% Conversion Rate
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue Collected</span>
                <div className="text-3xl font-black text-white mt-1">
                  ₦{(stats?.metrics?.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-400 font-semibold mt-1">
                  ₦{(stats?.metrics?.outstandingInvoices || stats?.metrics?.outstandingBalance || 0).toLocaleString()} Outstanding
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Cohorts</span>
                <div className="text-3xl font-black text-white mt-1">
                  {stats?.metrics?.activeCohorts || stats?.metrics?.cohortsCount || 0}
                </div>
                <div className="text-[11px] text-purple-400 font-semibold mt-1">
                  {stats?.metrics?.totalPrograms || stats?.metrics?.programsCount || 0} Academic Tracks
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  <span>Pipeline Distribution by Status</span>
                </h3>
                <div className="space-y-3">
                  {(stats?.applicationsByStatus || []).length > 0 ? (
                    (stats.applicationsByStatus || []).map((item: any) => (
                      <div key={item.status} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-300">
                          <span>{item.status?.replace(/_/g, ' ') || 'Pending'}</span>
                          <span>{item._count || 0} applicants</span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{
                              width: `${((item._count || 0) / (stats?.metrics?.totalApplicants || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">No application records found.</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Top Enrolled Academic Programs</span>
                </h3>
                <div className="space-y-3 text-xs">
                  {(stats?.popularPrograms || stats?.programsWithEnrolledCount || []).slice(0, 5).map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/5"
                    >
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.code} • {p.durationWeeks || 12} Weeks
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {p.applicantCount || p._count?.applications || 0} Enrolled
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADMISSIONS & PLACEMENT MANAGER */}
        {activeTab === 'admissions' && (
          <AdmissionsManager
            applications={applications}
            placements={pendingPlacements}
            cohorts={cohorts}
            programs={programs}
            onDataRefresh={loadAllData}
            isAdmissionsOrSuperAdmin={isSuperAdmin || isAdmissionsAdmin}
            isAcademicOrSuperAdmin={isSuperAdmin || isAcademicAdmin}
          />
        )}

        {/* TAB 3: ACADEMIC OPERATIONS MANAGER */}
        {activeTab === 'academics' && (
          <AcademicOperationsManager
            schools={schools}
            programs={programs}
            cohorts={cohorts}
            applications={applications}
            onDataRefresh={loadAllData}
            onOpenCohortAnalysis={(cohortId) => setSelectedCohortAnalysis(cohortId)}
            onOpenEditCohort={(c) => handleOpenEditCohort(c)}
            onOpenAIArchitect={() => setShowAIProgramModal(true)}
            isAcademicOrSuperAdmin={isSuperAdmin || isAcademicAdmin}
            initialSubTab={rawUrlTab === 'cohorts' ? 'cohorts' : (rawUrlTab === 'calendar' || rawUrlTab === 'sessions') ? 'calendar' : 'schools'}
          />
        )}

        {/* TAB 4: FINANCE MANAGER */}
        {activeTab === 'finance' && (
          <FinanceManager
            invoices={invoices}
            bankTransfers={bankTransfers}
            stats={stats}
            onDataRefresh={loadAllData}
            isFinanceOrSuperAdmin={isSuperAdmin || isFinanceAdmin}
          />
        )}

        {/* TAB 5: CERTIFICATE & COMPLETION MANAGER */}
        {activeTab === 'certificates' && (
          <CertificateManager
            certificates={certificates}
            students={gatheredStudents}
            onRefresh={loadAllData}
            currentUser={user}
          />
        )}

        {/* TAB 6: AI GOVERNANCE & ARCHITECT */}
        {activeTab === 'ai' && (
          <AIAdminManager
            generations={aiGenerations}
            onRefresh={loadAllData}
            onOpenCurriculumArchitect={() => setShowAIProgramModal(true)}
            currentUser={user}
          />
        )}

        {/* TAB 7: NOTIFICATION DELIVERIES OUTBOX */}
        {activeTab === 'deliveries' && (
          <NotificationDeliveriesManager
            deliveries={notificationDeliveries}
            onRefresh={loadAllData}
            currentUser={user}
          />
        )}

        {/* TAB 8: FACULTY & INSTRUCTORS */}
        {activeTab === 'instructors' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Faculty & Instructors Directory</h2>
                <p className="text-xs text-slate-400">
                  Onboard faculty mentors, generate staff codes, assign academic schools, and issue login credentials.
                </p>
              </div>
              <button
                onClick={() => setShowCreateInstructorModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Instructor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.length === 0 ? (
                <div className="col-span-3 py-12 text-center text-slate-500 text-xs">
                  No instructors found in directory.
                </div>
              ) : (
                instructors.map((inst: any) => (
                  <div
                    key={inst.id}
                    className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
                          {inst.firstName ? inst.firstName[0] : 'I'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">
                            {inst.firstName} {inst.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {inst.instructorProfile?.staffCode || `@${inst.username}`}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Faculty
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Specialization:</span>
                        <span className="font-medium text-slate-200 truncate max-w-[180px]">
                          {inst.instructorProfile?.specialization || 'STEM'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">School:</span>
                        <span className="font-medium text-slate-200 truncate max-w-[180px]">
                          {inst.instructorProfile?.assignedSchools || 'Engineering'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-300 font-mono text-[11px]">{inst.email}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: ADMIN ACCOUNTS */}
        {activeTab === 'admins' && isSuperAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Administrator Accounts</h2>
                <p className="text-xs text-slate-400">
                  Provision and govern institutional admin roles (Super Admin, Academic Admin, Finance Admin, Coordinator Admin).
                </p>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Admin Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map((adm: any) => (
                <div
                  key={adm.id}
                  className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm flex items-center justify-center">
                        {adm.firstName ? adm.firstName[0] : 'A'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">
                          {adm.firstName} {adm.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {adm.username ? `@${adm.username}` : adm.email}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        adm.role === 'SUPER_ADMIN'
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          : adm.role === 'COORDINATOR_ADMIN'
                          ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                          : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                      }`}
                    >
                      {adm.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-200">{adm.email}</span>
                    </div>
                    {adm.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-medium text-slate-200">{adm.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-emerald-400">Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: CMS & SCHOOL BULLETINS */}
        {activeTab === 'cms' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900">School Bulletins & Announcements</h2>
              <p className="text-xs text-slate-500">
                Publish and manage official school-wide announcements broadcasted to student, faculty, and parent portals.
              </p>
            </div>

            {/* Broadcast Form Card */}
            <form
              onSubmit={handleBroadcastAnnouncement}
              className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Compose New School Bulletin
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Broadcasts instantly to dashboards</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bulletin Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Orientation Schedule Update for Fall 2026 Cohorts"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Audience</label>
                  <select
                    value={announcementAudience}
                    onChange={(e: any) => setAnnouncementAudience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="ALL">All Academy (Students, Faculty & Parents)</option>
                    <option value="STUDENTS">Enrolled Students Only</option>
                    <option value="INSTRUCTORS">Faculty Mentors Only</option>
                    <option value="PARENTS">Parents & Guardians Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={announcementPriority}
                    onChange={(e: any) => setAnnouncementPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bulletin Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Type the message to be broadcasted to the school community..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast School Bulletin</span>
                </button>
              </div>
            </form>

            {/* Published Announcements Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Published School Bulletins
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {announcements.length} Total
                </span>
              </div>

              {announcements.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-xs text-slate-500">
                  No bulletins published yet. Use the form above to broadcast to students, faculty, or parents.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                item.priority === 'URGENT'
                                  ? 'bg-rose-100 text-rose-700'
                                  : item.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {item.priority || 'NORMAL'}
                            </span>
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Audience: {item.targetAudience || 'ALL'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        Broadcasted on {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 11: AUDIT TRAIL */}
        {activeTab === 'audit' && isSuperAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-white">System & Security Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Immutable chronological log of privileged administrative and academic state transitions.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Action</th>
                      <th className="py-4 px-6">Entity</th>
                      <th className="py-4 px-6">Staff Member</th>
                      <th className="py-4 px-6">IP / Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          No audit trail events logged yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-white">{log.action}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-brand-300 font-mono">{log.entityType || log.entityId}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-200">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId || 'System'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">{log.ipAddress || 'Internal'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Administrator Account</h3>
                  <p className="text-xs text-slate-400">Assign institutional administrative privileges.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={adminFormData.firstName}
                    onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={adminFormData.lastName}
                    onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={adminFormData.email}
                    onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={adminFormData.username}
                    onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={adminFormData.phone}
                    onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Administrative Role</label>
                  <select
                    value={adminFormData.role}
                    onChange={(e: any) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="COORDINATOR_ADMIN">COORDINATOR_ADMIN</option>
                    <option value="ACADEMIC_ADMIN">ACADEMIC_ADMIN</option>
                    <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold transition"
                >
                  {processingAction ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INSTRUCTOR MODAL */}
      {showCreateInstructorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Onboard Faculty Mentor</h3>
                  <p className="text-xs text-slate-400">Issues faculty credentials & assigns academic school.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateInstructorModal(false)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInstructorSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={instructorFormData.firstName}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, firstName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={instructorFormData.lastName}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, lastName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={instructorFormData.email}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, email: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={instructorFormData.username}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, username: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={instructorFormData.specialization}
                    onChange={(e) =>
                      setInstructorFormData({ ...instructorFormData, specialization: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned School</label>
                  <input
                    type="text"
                    value={instructorFormData.assignedSchools}
                    onChange={(e) =>
                      setInstructorFormData({ ...instructorFormData, assignedSchools: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={instructorFormData.password}
                  onChange={(e) => setInstructorFormData({ ...instructorFormData, password: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateInstructorModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold transition"
                >
                  {processingAction ? 'Onboarding...' : 'Onboard Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COHORT PRICING & SCHEDULE MODAL */}
      {editingCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cohort Pricing & Schedule</h3>
                  <p className="text-xs text-slate-400">{editingCohort.name} ({editingCohort.cohortCode})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCohort(null)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCohortFees} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Training Fee (₦)</label>
                  <input
                    type="number"
                    value={cohortFeeForm.trainingFee}
                    onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, trainingFee: Number(e.target.value) })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Registration (₦)</label>
                  <input
                    type="number"
                    value={cohortFeeForm.registrationFee}
                    onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, registrationFee: Number(e.target.value) })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Certification (₦)</label>
                  <input
                    type="number"
                    value={cohortFeeForm.certificationFee}
                    onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, certificationFee: Number(e.target.value) })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Merit Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cohortFeeForm.discountPercentage}
                    onChange={(e) =>
                      setCohortFeeForm({ ...cohortFeeForm, discountPercentage: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={cohortFeeForm.maxCapacity}
                    onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, maxCapacity: Number(e.target.value) })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cohort Status</label>
                  <select
                    value={cohortFeeForm.status}
                    onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, status: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="OPEN">OPEN (Accepting)</option>
                    <option value="ALMOST_FULL">ALMOST FULL</option>
                    <option value="FULL">FULL</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Delivery Mode</label>
                  <select
                    value={cohortFeeForm.mode}
                    onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, mode: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Hybrid (Onsite Ile-Ife & Virtual)">Hybrid (Ile-Ife & Virtual)</option>
                    <option value="100% Virtual / Remote">100% Virtual / Remote</option>
                    <option value="100% Onsite Lab Intensive">100% Onsite Lab Intensive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class Schedule & Timetable</label>
                <input
                  type="text"
                  value={cohortFeeForm.schedule}
                  onChange={(e) => setCohortFeeForm({ ...cohortFeeForm, schedule: e.target.value })}
                  placeholder="e.g. Mon, Wed, Fri (4:00 PM – 7:00 PM) & Saturdays"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingCohort(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/20"
                >
                  {processingAction ? 'Saving...' : 'Save & Apply Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI PROGRAM ARCHITECT MODAL */}
      <AIProgramGeneratorModal
        isOpen={showAIProgramModal}
        onClose={() => setShowAIProgramModal(false)}
        onProgramCreated={loadAllData}
      />

      {/* COHORT DEEP ANALYSIS MODAL */}
      <CohortAnalysisModal
        isOpen={!!selectedCohortAnalysis}
        onClose={() => setSelectedCohortAnalysis(null)}
        cohortId={selectedCohortAnalysis || ''}
      />
    </PortalLayout>
  );
};
