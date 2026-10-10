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
import { MarketingLeadsManager } from '../../components/admin/MarketingLeadsManager';
import { Directory360Manager } from '../../components/admin/Directory360Manager';
import {
  TrendingUp,
  Users,
  PhoneCall,
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
  Eye,
  EyeOff,
  Search,
  Filter,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  CreditCard,
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
  const [adminRoleFilter, setAdminRoleFilter] = useState<string>('ALL');
  const [instructors, setInstructors] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [aiGenerations, setAiGenerations] = useState<any[]>([]);
  const [notificationDeliveries, setNotificationDeliveries] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Audit Trail Search & Filter State
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  // Global action notifications
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // Modals & Sub-actions
  const [selectedCohortAnalysis, setSelectedCohortAnalysis] = useState<string | null>(null);
  const [showAIProgramModal, setShowAIProgramModal] = useState(false);
  const [aiProgramInitialId, setAiProgramInitialId] = useState<string | undefined>(undefined);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateInstructorModal, setShowCreateInstructorModal] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showInstructorPassword, setShowInstructorPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserForm, setEditUserForm] = useState({ firstName: '', lastName: '', phone: '', role: '' });
  const [banTarget, setBanTarget] = useState<any | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banProcessing, setBanProcessing] = useState(false);

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
    role: 'ACADEMIC_ADMIN',
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

  // Executive Institutional Intelligence Computations
  const executiveMetrics = useMemo(() => {
    // 1. Capacity & Pacing
    const totalCapacity = cohorts.reduce((acc, c) => acc + (c.maxCapacity || 25), 0);
    const totalEnrolled = cohorts.reduce((acc, c) => acc + (c.currentEnrollment || c.studentProfiles?.length || 0), 0);
    const capacityFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    // 2. Admissions Funnel
    const totalApps = applications.length;
    const stageSubmitted = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
    const stageTesting = applications.filter((a) => a.status === 'ASSESSMENT_COMPLETED' || a.status === 'PENDING_PLACEMENT').length;
    const stagePlaced = applications.filter((a) => a.status === 'PLACED' || a.status === 'ADMISSION_OFFERED').length;
    const stageAdmitted = applications.filter((a) => a.status === 'ADMITTED' || a.status === 'ACCEPTED').length;
    const stageEnrolled = applications.filter((a) => a.status === 'ENROLLED' || a.status === 'ACTIVE').length;

    // 3. Financial Telemetry
    const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const totalOutstanding = Math.max(0, totalBilled - totalPaid);
    const revenueCollectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const pendingTransfers = bankTransfers.filter((b) => b.status === 'PENDING' || !b.verifiedAt);
    const pendingTransferAmount = pendingTransfers.reduce((acc, b) => acc + (b.amount || 0), 0);

    // 4. Faculty & Operations
    const totalFaculty = instructors.length;
    const activeCohortsCount = cohorts.filter((c) => ['OPEN', 'ALMOST_FULL', 'IN_PROGRESS'].includes(c.status)).length;
    const facultyRatio = totalFaculty > 0 ? (totalEnrolled / totalFaculty).toFixed(1) : '—';

    // 5. Schools Matrix Aggregation
    const schoolsMatrix = schools.map((s) => {
      const schoolPrograms = programs.filter((p) => p.schoolId === s.id || p.school?.id === s.id);
      const schoolCohorts = cohorts.filter((c) => schoolPrograms.some((sp) => sp.id === c.programId));
      const schoolEnrolled = schoolCohorts.reduce((acc, c) => acc + (c.currentEnrollment || c.studentProfiles?.length || 0), 0);
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color || '#2563eb',
        programsCount: schoolPrograms.length,
        cohortsCount: schoolCohorts.length,
        enrolledCount: schoolEnrolled,
      };
    });

    return {
      totalCapacity,
      totalEnrolled,
      capacityFillRate,
      funnel: {
        total: totalApps,
        submitted: stageSubmitted,
        testing: stageTesting,
        placed: stagePlaced,
        admitted: stageAdmitted,
        enrolled: stageEnrolled,
      },
      finance: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        revenueCollectionRate,
        pendingTransfersCount: pendingTransfers.length,
        pendingTransferAmount,
      },
      faculty: {
        totalFaculty,
        activeCohortsCount,
        facultyRatio,
      },
      schoolsMatrix,
    };
  }, [cohorts, applications, invoices, bankTransfers, instructors, schools, programs]);

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
        api.getPrograms({ includeArchived: 'true' }).catch(() => ({ programs: [] })),
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

  const handleReloadAuditLogs = async (searchVal = auditSearch, actionVal = auditActionFilter) => {
    setLoadingAudit(true);
    try {
      const res = await api.getAuditLogs({
        limit: 100,
        search: searchVal.trim() || undefined,
        action: actionVal !== 'ALL' ? actionVal : undefined,
      });
      setAuditLogs(res?.logs || []);
    } catch (err) {
      console.warn('Failed to reload audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Canonical tab registry with role-based visibility
  const availableTabs = useMemo(() => {
    return [
      { id: 'analytics', name: 'Executive Intelligence', icon: TrendingUp },
      {
        id: 'directory',
        name: 'Learners & Directory',
        icon: Users,
        visible: isSuperAdmin || isAcademicAdmin || isFinanceAdmin || isAdmissionsAdmin || isCoordinator,
      },
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
        visible: isSuperAdmin || isAcademicAdmin || isAdmissionsAdmin || isCoordinator || isMarketingManager,
      },
      {
        id: 'marketing',
        name: `Applicant Leads & CRM`,
        icon: PhoneCall,
        visible: isSuperAdmin || isMarketingManager || isAdmissionsAdmin,
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
    if (['academics', 'programs', 'cohorts', 'calendar', 'sessions', 'centers'].includes(rawUrlTab)) return 'academics';
    if (['finance', 'invoices', 'transfers'].includes(rawUrlTab)) return 'finance';
    if (['faculty', 'instructors'].includes(rawUrlTab)) return 'instructors';
    if (['marketing', 'leads', 'crm'].includes(rawUrlTab)) return 'marketing';
    const match = availableTabs.find((t) => t.id === rawUrlTab);
    return match ? match.id : 'analytics';
  }, [rawUrlTab, availableTabs]);

  const handleTabChange = (newTabId: string) => {
    setSearchParams({ tab: newTabId });
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      handleReloadAuditLogs(auditSearch, auditActionFilter);
    }
  }, [activeTab, auditActionFilter]);

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

  // Open Edit User Modal
  const handleOpenEditUser = (adm: any) => {
    setEditingUser(adm);
    setEditUserForm({
      firstName: adm.firstName || '',
      lastName: adm.lastName || '',
      phone: adm.phone || '',
      role: adm.role || '',
    });
  };

  // Save Edited User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setProcessingAction(true);
    try {
      const isInstructor = editingUser.role === 'INSTRUCTOR';
      if (isInstructor) {
        await api.updateInstructor(editingUser.id, {
          firstName: editUserForm.firstName,
          lastName: editUserForm.lastName,
          phone: editUserForm.phone,
        });
      } else {
        await api.updateAdminUser(editingUser.id, {
          firstName: editUserForm.firstName,
          lastName: editUserForm.lastName,
          phone: editUserForm.phone,
          role: editUserForm.role,
        });
      }
      setActionSuccess(`${editUserForm.firstName} ${editUserForm.lastName}'s account updated successfully.`);
      setEditingUser(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setProcessingAction(false);
    }
  };

  // Ban / Unban a User
  const handleToggleBan = async (action: 'BAN' | 'UNBAN') => {
    if (!banTarget) return;
    setBanProcessing(true);
    try {
      const isInstructor = banTarget.role === 'INSTRUCTOR';
      if (isInstructor) {
        await api.toggleInstructorBan(banTarget.id, action, banReason);
      } else {
        await api.toggleUserBan(banTarget.id, action, banReason);
      }
      const label = action === 'BAN' ? 'banned' : 'reactivated';
      setActionSuccess(`${banTarget.firstName} ${banTarget.lastName}'s account has been ${label}.`);
      setBanTarget(null);
      setBanReason('');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setBanProcessing(false);
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
            </div>
          ),
        };
      case 'directory':
        return {
          title: 'Learners & Community Directory',
          subtitle: '360° dossiers for registered applicants, enrolled students, guardians, and faculty.',
          badge: <Badge variant="blue">360° Hub</Badge>,
          actions: null,
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
      case 'marketing':
        return {
          title: 'Applicant Leads & Marketing CRM',
          subtitle: 'Direct telephone calls, WhatsApp chat links, follow-up logs, and conversion tracking.',
          badge: <Badge variant="blue">{applications.length} Active Leads</Badge>,
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
            {/* Top KPI Command Center */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Applicants & Funnel Intake */}
              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Inquiries & Apps</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {stats?.metrics?.totalApplicants || applications.length || 0}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Pipeline In-Flow</span>
                  <span className="font-bold text-blue-600">
                    {stats?.metrics?.newApplicants || executiveMetrics.funnel.submitted} pending review
                  </span>
                </div>
              </div>

              {/* Card 2: Active Learners & Capacity */}
              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled Learners</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {executiveMetrics.totalEnrolled || stats?.metrics?.admittedStudents || 0}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Cohort Fill Rate</span>
                  <span className="font-bold text-emerald-600">
                    {executiveMetrics.capacityFillRate}% of {executiveMetrics.totalCapacity} capacity
                  </span>
                </div>
              </div>

              {/* Card 3: Financial Realization & Revenue */}
              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tuition Realization</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  ₦{((executiveMetrics.finance.totalPaid || stats?.metrics?.totalRevenue || 0)).toLocaleString()}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Collection Realized</span>
                  <span className="font-bold text-indigo-600">
                    {executiveMetrics.finance.revenueCollectionRate}% (₦{((executiveMetrics.finance.totalOutstanding || stats?.metrics?.outstandingInvoices || 0)).toLocaleString()} pending)
                  </span>
                </div>
              </div>

              {/* Card 4: Academic Cohorts & Faculty */}
              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-600" />
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Cohorts & Faculty</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {executiveMetrics.faculty.activeCohortsCount || stats?.metrics?.activeCohorts || 0}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Faculty Ratio</span>
                  <span className="font-bold text-amber-700">
                    {instructors.length} Instructors ({executiveMetrics.faculty.facultyRatio} : 1)
                  </span>
                </div>
              </div>
            </div>

            {/* Executive Rapid-Action Triage Desk */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Executive Rapid-Action Triage Desk</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        Live Attention Required
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cross-departmental checkpoints requiring senior administrator clearance and operational triage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTabChange('directory')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>360° Directory</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('academics')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Cohorts</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {/* Triage 1: Bank Transfers */}
                <div
                  onClick={() => handleTabChange('finance')}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Pending Bank Transfers</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {executiveMetrics.finance.pendingTransfersCount} Awaiting
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mt-2">
                    ₦{executiveMetrics.finance.pendingTransferAmount.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-300 transition">
                    <span>Audit and verify receipts in Finance</span>
                    <ArrowRight className="w-3 h-3 transition transform group-hover:translate-x-1" />
                  </p>
                </div>

                {/* Triage 2: Placements */}
                <div
                  onClick={() => handleTabChange('admissions')}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Awaiting Cohort Placement</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/20 text-blue-300 border border-blue-400/30">
                      {executiveMetrics.funnel.testing + executiveMetrics.funnel.submitted} Pending
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mt-2">
                    {pendingPlacements.length || executiveMetrics.funnel.testing} Applicants
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-blue-300 transition">
                    <span>Evaluate & issue admission offers</span>
                    <ArrowRight className="w-3 h-3 transition transform group-hover:translate-x-1" />
                  </p>
                </div>

                {/* Triage 3: Admitted Awaiting Clearance */}
                <div
                  onClick={() => handleTabChange('directory')}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Admitted (Pending Tuition)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      {executiveMetrics.funnel.admitted} Learners
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white mt-2">
                    {Math.round(((executiveMetrics.funnel.enrolled) / (executiveMetrics.funnel.total || 1)) * 100)}% Conversion
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-emerald-300 transition">
                    <span>Track payment reminders & follow-up</span>
                    <ArrowRight className="w-3 h-3 transition transform group-hover:translate-x-1" />
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Stage Institutional Admissions Intake Funnel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>5-Stage Institutional Admissions & Intake Funnel</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live end-to-end applicant progression through the recruitment, evaluation, and matriculation pipeline.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
                  Total Funnel Volume: <strong className="text-slate-900">{applications.length}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                {[
                  {
                    stage: 'Stage 1',
                    name: 'Submitted / Review',
                    count: executiveMetrics.funnel.submitted,
                    color: 'bg-blue-500',
                    border: 'border-blue-200',
                    bg: 'bg-blue-50/60',
                    text: 'text-blue-900',
                  },
                  {
                    stage: 'Stage 2',
                    name: 'Assessment & Test',
                    count: executiveMetrics.funnel.testing,
                    color: 'bg-amber-500',
                    border: 'border-amber-200',
                    bg: 'bg-amber-50/60',
                    text: 'text-amber-900',
                  },
                  {
                    stage: 'Stage 3',
                    name: 'Placement Approved',
                    count: executiveMetrics.funnel.placed,
                    color: 'bg-purple-500',
                    border: 'border-purple-200',
                    bg: 'bg-purple-50/60',
                    text: 'text-purple-900',
                  },
                  {
                    stage: 'Stage 4',
                    name: 'Officially Admitted',
                    count: executiveMetrics.funnel.admitted,
                    color: 'bg-indigo-500',
                    border: 'border-indigo-200',
                    bg: 'bg-indigo-50/60',
                    text: 'text-indigo-900',
                  },
                  {
                    stage: 'Stage 5',
                    name: 'Enrolled & Cleared',
                    count: executiveMetrics.funnel.enrolled,
                    color: 'bg-emerald-500',
                    border: 'border-emerald-200',
                    bg: 'bg-emerald-50/60',
                    text: 'text-emerald-900',
                  },
                ].map((step, idx) => {
                  const pct = applications.length > 0 ? Math.round((step.count / applications.length) * 100) : 0;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${step.border} ${step.bg} space-y-2 flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <span>{step.stage}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className={`text-xs font-black ${step.text} mt-1 leading-snug`}>{step.name}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-slate-900 mt-2">{step.count}</div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                          <div className={`h-full ${step.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operational Matrix & System Governance Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Cross-School Operational Matrix */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Cross-School Operational Matrix</span>
                  </h3>
                  <button
                    onClick={() => handleTabChange('academics')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Schools</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {executiveMetrics.schoolsMatrix.length > 0 ? (
                    executiveMetrics.schoolsMatrix.map((school) => (
                      <div
                        key={school.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: school.color }}
                            />
                            <span className="font-bold text-slate-900 text-xs">{school.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              {school.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-4.5">
                            {school.programsCount} Programs • {school.cohortsCount} Active Cohorts
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-slate-900">{school.enrolledCount}</div>
                          <div className="text-[10px] text-slate-500">Learners Enrolled</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">No schools configured.</div>
                  )}
                </div>

                {/* Top Programs */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>High-Demand Programs</span>
                  </h4>
                  <div className="space-y-2">
                    {(stats?.popularPrograms || stats?.programsWithEnrolledCount || []).slice(0, 4).map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.code} • {p.duration || (p.durationWeeks ? `${p.durationWeeks} Weeks` : '12 Weeks')}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                          {p.applicantCount || p._count?.applications || 0} Learners
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Governance Stream & Institutional Audit Logs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>System Governance & Audit Stream</span>
                  </h3>
                  <button
                    onClick={() => handleTabChange('audit')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Audit Trail</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Real-time security telemetry recording administrator actions, credential changes, and financial validations.
                </p>

                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-slate-800">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} •{' '}
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed truncate">
                        {log.details || 'System event recorded in ledger'}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Agent'}
                        </span>
                        {log.user?.role && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                            {log.user.role.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No system events recorded yet.
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Institutional Security Standard</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    All administrative activities, invoice generation, score modifications, and user state transitions are immutably logged with role accountability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LEARNERS & COMMUNITY DIRECTORY */}
        {activeTab === 'directory' && (
          <Directory360Manager />
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
            onOpenAIArchitect={(progId?: string) => {
              setAiProgramInitialId(progId);
              setShowAIProgramModal(true);
            }}
            isAcademicOrSuperAdmin={isSuperAdmin || isAcademicAdmin}
            initialSubTab={rawUrlTab === 'cohorts' ? 'cohorts' : rawUrlTab === 'centers' ? 'centers' : (rawUrlTab === 'calendar' || rawUrlTab === 'sessions') ? 'calendar' : 'schools'}
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

        {/* TAB: MARKETING LEADS & ADMISSIONS CRM */}
        {activeTab === 'marketing' && (
          <MarketingLeadsManager
            currentUser={user}
            onRefresh={loadAllData}
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
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status:</span>
                        <span className={`font-bold ${inst.isActive !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {inst.isActive !== false ? 'Active' : 'Banned'}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(inst)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setBanTarget(inst)}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              inst.isActive !== false
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            {inst.isActive !== false ? 'Ban' : 'Unban'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: ADMIN ACCOUNTS */}
        {/* TAB: ADMIN & STAFF ACCOUNTS */}
        {activeTab === 'admins' && isSuperAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Institutional Staff & Administrators</h2>
                <p className="text-xs text-slate-400">
                  Provision and govern all academy staff roles (Admissions, Academics, Finance, Counseling, Innovation, Marketing, Partners).
                </p>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Staff Account</span>
              </button>
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setAdminRoleFilter('ALL')}
                className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                  adminRoleFilter === 'ALL'
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Staff ({admins.length})
              </button>
              {Array.from(new Set(admins.map((a: any) => a.role))).map((r: any) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAdminRoleFilter(r)}
                  className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                    adminRoleFilter === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r.replace('_', ' ')} ({admins.filter((a: any) => a.role === r).length})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins
                .filter((adm: any) => adminRoleFilter === 'ALL' || adm.role === adminRoleFilter)
                .map((adm: any) => {
                  const getRoleBadgeStyle = (role: string) => {
                    switch (role) {
                      case 'SUPER_ADMIN':
                        return 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
                      case 'ACADEMIC_ADMIN':
                        return 'bg-blue-500/10 border border-blue-500/30 text-blue-400';
                      case 'FINANCE_ADMIN':
                        return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
                      case 'ADMISSIONS_ADMIN':
                        return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
                      case 'PROGRAM_COORDINATOR':
                      case 'COORDINATOR_ADMIN':
                        return 'bg-purple-500/10 border border-purple-500/30 text-purple-400';
                      case 'COUNSELOR':
                        return 'bg-pink-500/10 border border-pink-500/30 text-pink-400';
                      case 'INNOVATION_MANAGER':
                        return 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400';
                      case 'CONTENT_MANAGER':
                        return 'bg-violet-500/10 border border-violet-500/30 text-violet-400';
                      case 'MARKETING_MANAGER':
                        return 'bg-orange-500/10 border border-orange-500/30 text-orange-400';
                      case 'PARTNER':
                        return 'bg-teal-500/10 border border-teal-500/30 text-teal-400';
                      default:
                        return 'bg-slate-500/10 border border-slate-500/30 text-slate-400';
                    }
                  };

                  return (
                    <div
                      key={adm.id}
                      className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
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
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md text-right ${getRoleBadgeStyle(
                            adm.role
                          )}`}
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
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Status:</span>
                          <span className={`font-bold ${adm.isActive !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {adm.isActive !== false ? 'Active' : 'Banned'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(adm)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setBanTarget(adm)}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              adm.isActive !== false
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            {adm.isActive !== false ? 'Ban' : 'Unban'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white">System & Security Audit Trail</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {auditLogs.length} events logged
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable chronological audit logs capturing user authentication, staff privilege escalations, financial approvals, coupon issuances, and academic inquiries.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleReloadAuditLogs()}
                disabled={loadingAudit}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-white/10 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin text-blue-400' : ''}`} />
                <span>Refresh Audit Logs</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReloadAuditLogs(auditSearch, auditActionFilter);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search audit trail by actor name, action, resource, target ID, IP address..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="py-2.5 px-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Actions</option>
                    <optgroup label="Authentication & Users">
                      <option value="USER_LOGIN">USER_LOGIN</option>
                      <option value="USER_REGISTER">USER_REGISTER</option>
                      <option value="CREATE_ADMIN_ACCOUNT">CREATE_ADMIN_ACCOUNT</option>
                      <option value="CREATE_INSTRUCTOR_ACCOUNT">CREATE_INSTRUCTOR_ACCOUNT</option>
                      <option value="UPDATE_USER_ACCOUNT">UPDATE_USER_ACCOUNT</option>
                      <option value="BAN_USER">BAN_USER</option>
                      <option value="UNBAN_USER">UNBAN_USER</option>
                    </optgroup>
                    <optgroup label="Financial Operations">
                      <option value="APPROVE_BANK_TRANSFER">APPROVE_BANK_TRANSFER</option>
                      <option value="REJECT_BANK_TRANSFER">REJECT_BANK_TRANSFER</option>
                      <option value="CREATE_COUPON">CREATE_COUPON</option>
                      <option value="UPDATE_PAYMENT_SETTINGS">UPDATE_PAYMENT_SETTINGS</option>
                    </optgroup>
                    <optgroup label="Academic Inquiries">
                      <option value="SUBMIT_ACADEMIC_INQUIRY">SUBMIT_ACADEMIC_INQUIRY</option>
                      <option value="UPDATE_INQUIRY_STATUS">UPDATE_INQUIRY_STATUS</option>
                      <option value="REPLY_ACADEMIC_INQUIRY">REPLY_ACADEMIC_INQUIRY</option>
                    </optgroup>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuditSearch('');
                      setAuditActionFilter('ALL');
                      handleReloadAuditLogs('', 'ALL');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Action</th>
                      <th className="py-4 px-6">Resource / Entity</th>
                      <th className="py-4 px-6">Staff Member / User</th>
                      <th className="py-4 px-6">IP / Origin</th>
                      <th className="py-4 px-6 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {loadingAudit ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                          Loading audit trail events...
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No audit trail events match your current filter.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log: any) => {
                        const getActionBadgeColor = (action: string) => {
                          if (action.includes('BAN') || action.includes('REJECT')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                          if (action.includes('APPROVE') || action.includes('RESOLVE')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                          if (action.includes('CREATE') || action.includes('REGISTER')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                          if (action.includes('LOGIN')) return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
                          if (action.includes('PAYMENT') || action.includes('COUPON')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                          if (action.includes('INQUIRY')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                          return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                        };

                        const hasDiff = log.previousValue || log.newValue;

                        return (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition">
                            <td className="py-4 px-6 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }) : 'N/A'}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono border ${getActionBadgeColor(log.action)}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-white font-semibold">{log.resource || log.entityType || 'Resource'}</span>
                                {(log.resourceId || log.entityId) && (
                                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                                    ID: {log.resourceId || log.entityId}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-slate-200 font-medium">
                                  {log.userName || (log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId || 'System')}
                                </span>
                                {log.userRole && (
                                  <span className="text-[10px] text-indigo-400 uppercase font-semibold">
                                    {log.userRole.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                              <span>{log.ipAddress || 'Internal'}</span>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              {hasDiff ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAuditLog(log)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Diff</span>
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
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
                  <label className="block font-semibold text-slate-300 mb-1">Administrative / Staff Role</label>
                  <select
                    value={adminFormData.role}
                    onChange={(e: any) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ACADEMIC_ADMIN">Academic Administrator (Curriculum, Schools, Cohorts)</option>
                    <option value="FINANCE_ADMIN">Finance Administrator (Tuition, Ledger, Bank Approvals)</option>
                    <option value="ADMISSIONS_ADMIN">Admissions Administrator (Applications, Placements)</option>
                    <option value="PROGRAM_COORDINATOR">Program Coordinator (Pacing, Attendance, Operations)</option>
                    <option value="COORDINATOR_ADMIN">Coordinator Admin (Academic Operations Suite)</option>
                    <option value="COUNSELOR">Student Counselor (At-Risk Watchlist, Guidance)</option>
                    <option value="INNOVATION_MANAGER">Innovation Manager (Hackathons, Competitions)</option>
                    <option value="CONTENT_MANAGER">Content & LMS Manager (Courseware, Lessons)</option>
                    <option value="MARKETING_MANAGER">Marketing Manager (Bulletins, Announcements, Media)</option>
                    <option value="PARTNER">Corporate & NGO Partner (Grants, CSR Sponsorships)</option>
                    <option value="SUPER_ADMIN">Super Administrator (Full System Authority)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-brand-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                <div className="relative">
                  <input
                    type={showInstructorPassword ? 'text' : 'password'}
                    value={instructorFormData.password}
                    onChange={(e) => setInstructorFormData({ ...instructorFormData, password: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-brand-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowInstructorPassword(!showInstructorPassword)}
                    aria-label={showInstructorPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  >
                    {showInstructorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Max Capacity (Seats)</label>
                    {editingCohort && (
                      <span className="text-[10px] text-brand-400 font-mono">
                        Enrolled: {editingCohort.currentEnrollment || 0}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={editingCohort ? Math.max(1, editingCohort.currentEnrollment || 1) : 1}
                    value={cohortFeeForm.maxCapacity}
                    onChange={(e) => {
                      const newCap = Number(e.target.value);
                      const currentEnrolled = editingCohort?.currentEnrollment || 0;
                      // Auto-update status preview
                      let nextStatus = cohortFeeForm.status;
                      if (cohortFeeForm.status === 'FULL' && newCap > currentEnrolled) {
                        nextStatus = (newCap - currentEnrolled <= 3) ? 'ALMOST_FULL' : 'OPEN';
                      }
                      setCohortFeeForm({ ...cohortFeeForm, maxCapacity: newCap, status: nextStatus });
                    }}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Increase capacity to immediately accommodate more students. Reopens full cohorts automatically.
                  </p>
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

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit User Account</h3>
                  <p className="text-xs text-slate-400">
                    Modify profile information, contact number, and institutional authorization role.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email (Immutable)</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Institutional Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    disabled={editingUser.role === 'INSTRUCTOR'}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="ACADEMIC_ADMIN">Academic Administrator</option>
                    <option value="FINANCE_ADMIN">Finance Administrator</option>
                    <option value="ADMISSIONS_ADMIN">Admissions Administrator</option>
                    <option value="PROGRAM_COORDINATOR">Program Coordinator</option>
                    <option value="COORDINATOR_ADMIN">Coordinator Admin</option>
                    <option value="COUNSELOR">Student Counselor</option>
                    <option value="INNOVATION_MANAGER">Innovation Manager</option>
                    <option value="CONTENT_MANAGER">Content & LMS Manager</option>
                    <option value="MARKETING_MANAGER">Marketing Manager</option>
                    <option value="PARTNER">Corporate & NGO Partner</option>
                    <option value="INSTRUCTOR">Faculty Instructor</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold transition shadow-md"
                >
                  {processingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAN / UNBAN CONFIRMATION MODAL */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  banTarget.isActive !== false
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {banTarget.isActive !== false ? 'Ban User Account' : 'Reactivate User Account'}
                </h3>
                <p className="text-xs text-slate-400">
                  {banTarget.firstName} {banTarget.lastName} ({banTarget.role.replace('_', ' ')})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {banTarget.isActive !== false
                ? 'Banning this user will immediately revoke portal access and session authentication across all devices. Their historical records will remain intact for institutional auditing.'
                : 'Reactivating this user will restore their authorization and allow them to log into their assigned academy portal.'}
            </p>

            {banTarget.isActive !== false && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Ban (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Policy violation, administrative reassignment"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setBanTarget(null);
                  setBanReason('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={banProcessing}
                onClick={() => handleToggleBan(banTarget.isActive !== false ? 'BAN' : 'UNBAN')}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition shadow-md ${
                  banTarget.isActive !== false
                    ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-50'
                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50'
                }`}
              >
                {banProcessing
                  ? 'Processing...'
                  : banTarget.isActive !== false
                  ? 'Confirm Ban'
                  : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI PROGRAM ARCHITECT MODAL */}
      <AIProgramGeneratorModal
        isOpen={showAIProgramModal}
        onClose={() => {
          setShowAIProgramModal(false);
          setAiProgramInitialId(undefined);
        }}
        onProgramCreated={loadAllData}
        existingPrograms={programs}
        initialProgramId={aiProgramInitialId}
      />

      {/* COHORT DEEP ANALYSIS MODAL */}
      <CohortAnalysisModal
        isOpen={!!selectedCohortAnalysis}
        onClose={() => setSelectedCohortAnalysis(null)}
        cohortId={selectedCohortAnalysis || ''}
      />

      {/* AUDIT LOG INSPECTION / DIFF MODAL */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedAuditLog.action}
                  </span>
                  <span className="text-white font-bold text-sm">
                    {selectedAuditLog.resource}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Triggered by <strong>{selectedAuditLog.userName || 'System'}</strong> ({selectedAuditLog.userRole || 'ROLE'}) on {selectedAuditLog.createdAt ? new Date(selectedAuditLog.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-white transition text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Metadata bar */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-400">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">IP Address</span>
                <span className="font-mono text-slate-300">{selectedAuditLog.ipAddress || 'Internal'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Resource ID</span>
                <span className="font-mono text-slate-300 truncate block">{selectedAuditLog.resourceId || 'N/A'}</span>
              </div>
              {selectedAuditLog.userAgent && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">User Agent</span>
                  <span className="font-mono text-[11px] text-slate-400 truncate block">{selectedAuditLog.userAgent}</span>
                </div>
              )}
            </div>

            {/* Previous vs New State Diff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Previous State
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-white/5 text-rose-300 font-mono text-[11px] overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed">
                  {selectedAuditLog.previousValue
                    ? typeof selectedAuditLog.previousValue === 'object'
                      ? JSON.stringify(selectedAuditLog.previousValue, null, 2)
                      : String(selectedAuditLog.previousValue)
                    : '<Empty / None>'}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  New State / Applied Change
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-white/5 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed">
                  {selectedAuditLog.newValue
                    ? typeof selectedAuditLog.newValue === 'object'
                      ? JSON.stringify(selectedAuditLog.newValue, null, 2)
                      : String(selectedAuditLog.newValue)
                    : '<Empty / None>'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-white/5">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
