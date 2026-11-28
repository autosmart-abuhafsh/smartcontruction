import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileSignature,
  TrendingUp,
  Box,
  ClipboardCheck,
  Wallet,
  History,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  X,
  RotateCcw,
  Moon,
  Sun,
  Sparkles,
  Cloud,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import { INITIAL_DATABASE } from './data/seedData';
import {
  BimModel,
  Contract,
  ContractMilestone,
  MenuId,
  ProgressReport,
  Project,
  SmartBuildDatabase,
  SmartContractConfig,
  SystemSettings,
  User,
  UserRole,
  VerificationStatus,
} from './types/smartbuild';
import {
  calculateMilestoneNominal,
  calculateWeightedProjectProgress,
  canAccessMenu,
  evaluateSmartContractPaymentTrigger,
  generateNextTransactionId,
  generateUniqueId,
  getRoleLabel,
  sanitizeSmartBuildDatabase,
} from './utils/calculations';
import {
  AppsScriptConfig,
  DEFAULT_APPS_SCRIPT_CONFIG,
  isValidAppsScriptUrl,
  pullDatabaseFromAppsScript,
  resolveInitialAppsScriptConfig,
  syncDatabaseToAppsScript,
} from './services/appsScriptService';
import { SmartBuildLoadingOverlay, SmartBuildLogo } from './components/SmartBuildBrand';
import { AuthViews } from './components/AuthViews';
import { DashboardView } from './components/DashboardView';
import {
  ContractPolicyView,
  ContractsView,
  ProjectsView,
} from './components/ProjectsAndContractsView';
import {
  BimViewerView,
  ProgressView,
  VerificationView,
} from './components/ProgressBimVerificationView';
import {
  HelpView,
  PaymentsAndSmartContractView,
  ReportsView,
  SettingsView,
  TransactionsView,
  UsersManagementView,
} from './components/PaymentsTransactionsReportsView';

const STORAGE_KEY = 'smartbuild_enterprise_db_v3_mahanggi';
const THEME_STORAGE_KEY = 'smartbuild_theme_dark_v1';
const GAS_CONFIG_KEY = 'smartbuild_gas_config_v1';

const MENU_ITEMS: { id: MenuId; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyek Saya', shortLabel: 'Proyek', icon: FolderKanban },
  { id: 'contracts', label: 'Kontrak Digital', shortLabel: 'Kontrak', icon: FileSignature },
  { id: 'policy', label: 'Kebijakan', shortLabel: 'Kebijakan', icon: SlidersHorizontal },
  { id: 'progress', label: 'Progress Proyek', shortLabel: 'Progres', icon: TrendingUp },
  { id: 'bim', label: 'BIM Viewer', shortLabel: 'BIM 3D', icon: Box },
  { id: 'verification', label: 'Verifikasi Pekerjaan', shortLabel: 'Verifikasi', icon: ClipboardCheck },
  { id: 'payments', label: 'Pembayaran', shortLabel: 'Bayar', icon: Wallet },
  { id: 'transactions', label: 'Riwayat Transaksi', shortLabel: 'Transaksi', icon: History },
  { id: 'reports', label: 'Laporan', shortLabel: 'Laporan', icon: BarChart3 },
  { id: 'users', label: 'Pengguna', shortLabel: 'Pengguna', icon: Users },
  { id: 'settings', label: 'Pengaturan', shortLabel: 'Setting', icon: Settings },
  { id: 'help', label: 'Bantuan', shortLabel: 'Bantuan', icon: HelpCircle },
];

export default function App() {
  const [db, setDb] = useState<SmartBuildDatabase>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return sanitizeSmartBuildDatabase(
          JSON.parse(saved) as Partial<SmartBuildDatabase>,
          INITIAL_DATABASE
        );
      }
    } catch {
      // ignore storage errors
    }
    return sanitizeSmartBuildDatabase(INITIAL_DATABASE, INITIAL_DATABASE);
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [appsScriptConfig, setAppsScriptConfig] = useState<AppsScriptConfig>(() => {
    try {
      const saved = localStorage.getItem(GAS_CONFIG_KEY);
      return resolveInitialAppsScriptConfig(saved);
    } catch {
      return DEFAULT_APPS_SCRIPT_CONFIG;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return INITIAL_DATABASE.users[0];
  });
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [isOwnerUsersUnlocked, setIsOwnerUsersUnlocked] = useState(false);
  const [isOwnerSettingsUnlocked, setIsOwnerSettingsUnlocked] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState<{
    visible: boolean;
    message?: string;
    subMessage?: string;
  }>({ visible: false });

  const triggerLoadingAnimation = (message?: string, subMessage?: string, durationMs = 650) => {
    setLoadingOverlay({ visible: true, message, subMessage });
    window.setTimeout(() => {
      setLoadingOverlay({ visible: false });
    }, durationMs);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
    } catch {
      // ignore storage errors
    }
  }, [isDarkMode]);

  // Initial Cloud Database Hydration when Vercel Environment Variable or Apps Script URL is active
  useEffect(() => {
    if (!isValidAppsScriptUrl(appsScriptConfig.webAppUrl)) return;
    let isCancelled = false;

    const bootstrapFromAppsScript = async () => {
      const pullRes = await pullDatabaseFromAppsScript(appsScriptConfig.webAppUrl);
      if (isCancelled) return;
      if (
        pullRes.ok &&
        pullRes.data &&
        Array.isArray(pullRes.data.projects) &&
        pullRes.data.projects.length > 0
      ) {
        setDb((prev) =>
          sanitizeSmartBuildDatabase(
            {
              ...prev,
              ...pullRes.data,
            },
            INITIAL_DATABASE
          )
        );
        setAppsScriptConfig((prev) => ({
          ...prev,
          connectionStatus: 'connected',
          lastSyncedAt: new Date().toISOString(),
          lastMessage: prev.isFromEnv
            ? `Database disinkronkan dari Google Sheets via Vercel Env (${prev.envVarName || 'VITE_APPS_SCRIPT_URL'}).`
            : 'Database berhasil dimuat dari Google Sheets Apps Script.',
        }));
      } else if (appsScriptConfig.autoSync) {
        const pushRes = await syncDatabaseToAppsScript(appsScriptConfig.webAppUrl, db);
        if (isCancelled) return;
        setAppsScriptConfig((prev) => ({
          ...prev,
          connectionStatus: pushRes.ok ? 'connected' : 'error',
          lastSyncedAt: pushRes.timestamp || prev.lastSyncedAt,
          lastMessage: pushRes.message,
        }));
      }
    };

    void bootstrapFromAppsScript();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore storage errors
    }

    if (
      appsScriptConfig.autoSync &&
      isValidAppsScriptUrl(appsScriptConfig.webAppUrl)
    ) {
      void syncDatabaseToAppsScript(appsScriptConfig.webAppUrl, db);
    }
  }, [db]);

  useEffect(() => {
    try {
      localStorage.setItem(GAS_CONFIG_KEY, JSON.stringify(appsScriptConfig));
    } catch {
      // ignore storage errors
    }
  }, [appsScriptConfig]);

  // Ensure active menu is accessible when switching roles
  const handleRoleSwitch = (userId: string) => {
    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) return;
    triggerLoadingAnimation(
      `Mengaktifkan Peran ${getRoleLabel(targetUser.role)}...`,
      `Memuat hak akses RBAC untuk ${targetUser.name}`,
      500
    );
    setCurrentUser(targetUser);
    if (!canAccessMenu(targetUser.role, activeMenu)) {
      setActiveMenu('dashboard');
    }
  };

  const appendLogAndNotif = (
    prev: SmartBuildDatabase,
    action: string,
    moduleName: string,
    details: string,
    notifCategory?: SmartBuildDatabase['notifications'][0]['category'],
    notifTitle?: string,
    targetRoles: UserRole[] = ['super_admin', 'client', 'contractor', 'verifikator']
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const actor = currentUser || prev.users[0];
    const nextLogs = [
      {
        id: generateUniqueId('log'),
        timestamp: nowStr,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        module: moduleName,
        details,
        ipSimulation: '10.24.18.100',
      },
      ...prev.activity_logs,
    ];
    const nextNotifs =
      notifCategory && notifTitle
        ? [
            {
              id: generateUniqueId('notif'),
              title: notifTitle,
              message: details,
              category: notifCategory,
              createdAt: nowStr,
              read: false,
              targetRoles,
            },
            ...prev.notifications,
          ]
        : prev.notifications;

    return { nextLogs, nextNotifs };
  };

  // Handlers
  const handleAddProject = (newProj: Omit<Project, 'id' | 'code'>) => {
    setDb((prev) => {
      const nextNum = prev.projects.length + 1;
      const project: Project = {
        ...newProj,
        id: generateUniqueId('prj'),
        code: `PRJ-2026-${String(nextNum).padStart(3, '0')}`,
      };
      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'CREATE_PROJECT',
        'Proyek Saya',
        `Membuat proyek baru "${project.name}" (${project.code}).`
      );
      return {
        ...prev,
        projects: [project, ...prev.projects],
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleUpdateProject = (updated: Project) => {
    setDb((prev) => {
      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'UPDATE_PROJECT',
        'Proyek Saya',
        `Memperbarui informasi proyek "${updated.name}" (Status: ${updated.status}).`
      );
      return {
        ...prev,
        projects: prev.projects.map((p) => (p.id === updated.id ? updated : p)),
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setDb((prev) => {
      const target = prev.projects.find((p) => p.id === projectId);
      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'DELETE_PROJECT',
        'Proyek Saya',
        `Menghapus proyek "${target?.name || projectId}".`
      );
      return {
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleCreateOrUpdateContract = (
    contract: Contract,
    milestoneInputs: { name: string; description: string; weightPercentage: number; dueDate: string }[]
  ) => {
    setDb((prev) => {
      const exists = prev.contracts.some((c) => c.id === contract.id);
      const updatedContracts = exists
        ? prev.contracts.map((c) => (c.id === contract.id ? contract : c))
        : [contract, ...prev.contracts];

      const otherMilestones = prev.contract_milestones.filter(
        (m) => m.contractId !== contract.id
      );
      const otherSchedules = prev.payment_schedules.filter(
        (s) => s.contractId !== contract.id
      );

      const newMilestones: ContractMilestone[] = milestoneInputs.map((m, idx) => {
        const msId = `ms-${contract.id}-${idx + 1}`;
        return {
          id: msId,
          contractId: contract.id,
          projectId: contract.projectId,
          order: idx + 1,
          name: m.name,
          description: m.description,
          weightPercentage: m.weightPercentage,
          targetProgress: 100,
          realizedProgress: 0,
          nominalValue: calculateMilestoneNominal(contract.totalValue, m.weightPercentage),
          dueDate: m.dueDate,
          status: 'Belum Dimulai',
        };
      });

      const newSchedules = newMilestones.map((ms) => ({
        id: `pay-sch-${ms.id}`,
        contractId: contract.id,
        projectId: contract.projectId,
        projectName: contract.projectName,
        milestoneId: ms.id,
        termNumber: ms.order,
        milestoneName: `Tahap ${ms.order}: ${ms.name}`,
        percentage: ms.weightPercentage,
        nominal: ms.nominalValue,
        status: 'Belum memenuhi syarat' as const,
        approvedByClient: false,
        isDemo: true,
      }));

      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        exists ? 'UPDATE_CONTRACT' : 'CREATE_CONTRACT',
        'Kontrak Digital',
        `Kontrak digital ${contract.contractNumber} (${contract.projectName}) disimpan.`,
        'Kontrak baru',
        `Kontrak Digital ${contract.contractNumber}`
      );

      return {
        ...prev,
        contracts: updatedContracts,
        contract_milestones: [...otherMilestones, ...newMilestones],
        payment_schedules: [...otherSchedules, ...newSchedules],
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleSendContractForApproval = (contractId: string) => {
    setDb((prev) => ({
      ...prev,
      contracts: prev.contracts.map((c) =>
        c.id === contractId ? { ...c, status: 'Menunggu persetujuan' } : c
      ),
    }));
  };

  const handleApproveContract = (contractId: string, partyRole: 'client' | 'contractor') => {
    setDb((prev) => {
      const updatedContracts = prev.contracts.map((c) => {
        if (c.id !== contractId) return c;
        const clientApproved = partyRole === 'client' ? true : c.clientApproved;
        const contractorApproved = partyRole === 'contractor' ? true : c.contractorApproved;
        const bothApproved = clientApproved && contractorApproved;
        return {
          ...c,
          clientApproved,
          contractorApproved,
          status: bothApproved ? ('Aktif' as const) : ('Menunggu persetujuan' as const),
          revisionHistory: [
            ...c.revisionHistory,
            {
              id: generateUniqueId('rev'),
              date: new Date().toISOString().split('T')[0],
              actor: currentUser?.name || partyRole,
              summary: `Persetujuan kontrak digital diberikan oleh ${
                partyRole === 'client' ? 'Pengguna Jasa' : 'Penyedia Jasa'
              }.`,
            },
          ],
        };
      });

      const targetContract = updatedContracts.find((c) => c.id === contractId);
      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'APPROVE_CONTRACT',
        'Kontrak Digital',
        `Kontrak ${targetContract?.contractNumber} disetujui oleh ${
          partyRole === 'client' ? 'Pengguna Jasa' : 'Penyedia Jasa'
        }.`,
        'Persetujuan kontrak',
        'Persetujuan Kontrak Digital'
      );

      return {
        ...prev,
        contracts: updatedContracts,
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleSubmitProgressReport = (newReportData: Omit<ProgressReport, 'id'>) => {
    setDb((prev) => {
      const reportId = generateUniqueId('rep');
      const verId = generateUniqueId('ver');
      const newReport: ProgressReport = {
        ...newReportData,
        id: reportId,
        attachments: newReportData.attachments.map((a) => ({
          ...a,
          id: a.id || generateUniqueId('att'),
          reportId,
        })),
      };

      const newVerification = {
        id: verId,
        reportId,
        projectId: newReport.projectId,
        projectName: newReport.projectName,
        milestoneId: newReport.milestoneId,
        milestoneName: newReport.milestoneName,
        submittedPercentage: newReport.submittedPercentage,
        approvedPercentage: 0,
        verifierId: 'usr-verifier',
        verifierName: 'Ir. Dian Permatasari, MT',
        verificationDate: newReport.reportDate,
        notes: 'Menunggu pemeriksaan dokumen lapangan dan kesesuaian objek BIM.',
        supportingEvidenceSummary: newReport.attachments.map((a) => a.fileName).join(', '),
        bimChecked: false,
        status: 'Menunggu pemeriksaan' as const,
        isDemo: true,
      };

      const updatedMilestones = prev.contract_milestones.map((m) =>
        m.id === newReport.milestoneId
          ? { ...m, status: 'Menunggu Verifikasi' as const }
          : m
      );

      const updatedSchedules = prev.payment_schedules.map((s) =>
        s.milestoneId === newReport.milestoneId && s.status !== 'Berhasil'
          ? { ...s, status: 'Menunggu verifikasi' as const, verificationId: verId }
          : s
      );

      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'SUBMIT_PROGRESS_REPORT',
        'Progress Proyek',
        `Laporan progres tahapan "${newReport.milestoneName}" (${newReport.submittedPercentage}%) dikirim untuk proyek ${newReport.projectName}.`,
        'Permintaan verifikasi',
        `Laporan Progres Baru: ${newReport.milestoneName}`
      );

      return {
        ...prev,
        progress_reports: [newReport, ...prev.progress_reports],
        verifications: [newVerification, ...prev.verifications],
        contract_milestones: updatedMilestones,
        payment_schedules: updatedSchedules,
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleProcessVerification = (
    verificationId: string,
    newStatus: VerificationStatus,
    approvedPercentage: number,
    notes: string,
    bimChecked: boolean
  ) => {
    setDb((prev) => {
      const targetVer = prev.verifications.find((v) => v.id === verificationId);
      if (!targetVer) return prev;

      const updatedVerifications = prev.verifications.map((v) =>
        v.id === verificationId
          ? {
              ...v,
              status: newStatus,
              approvedPercentage,
              notes,
              bimChecked,
              verificationDate: new Date().toISOString().split('T')[0],
            }
          : v
      );

      const updatedReports = prev.progress_reports.map((r) =>
        r.id === targetVer.reportId ? { ...r, verificationStatus: newStatus } : r
      );

      const updatedMilestones = prev.contract_milestones.map((m) => {
        if (m.id !== targetVer.milestoneId) return m;
        if (newStatus === 'Disetujui') {
          return {
            ...m,
            realizedProgress: approvedPercentage,
            status:
              approvedPercentage >= 100
                ? ('Selesai' as const)
                : ('Dalam Proses' as const),
          };
        }
        return {
          ...m,
          status: 'Dalam Proses' as const,
        };
      });

      const projectMilestones = updatedMilestones.filter(
        (m) => m.projectId === targetVer.projectId
      );
      const newOverallProgress = calculateWeightedProjectProgress(projectMilestones);

      const updatedProjects = prev.projects.map((p) =>
        p.id === targetVer.projectId
          ? {
              ...p,
              overallProgress: newOverallProgress,
              status:
                newOverallProgress >= 100
                  ? ('Selesai' as const)
                  : ('Dalam pengerjaan' as const),
            }
          : p
      );

      const targetMs = updatedMilestones.find((m) => m.id === targetVer.milestoneId);
      const updatedBimModels = prev.bim_models.map((bm) => {
        if (bm.projectId !== targetVer.projectId) return bm;
        return {
          ...bm,
          elements: bm.elements.map((el) =>
            el.id === targetMs?.bimElementGroupId || el.category === targetMs?.name
              ? {
                  ...el,
                  completionRate:
                    newStatus === 'Disetujui' ? approvedPercentage : el.completionRate,
                  inspectionState:
                    newStatus === 'Disetujui' && approvedPercentage >= 100
                      ? ('Terverifikasi' as const)
                      : ('Dalam Pengerjaan' as const),
                }
              : el
          ),
        };
      });

      const scConfig = prev.smart_contracts.find(
        (sc) => sc.projectId === targetVer.projectId
      );
      const autoRelease = scConfig?.autoReleaseOnVerification ?? true;
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const simHash = `0xSIMULATED_${Date.now().toString(16)}a8f4c2`;
      const proofRef = `MANDIRI-AUTO-1480025086508-${Date.now().toString().slice(-4)}`;

      let autoPaidSchedule: typeof prev.payment_schedules[0] | null = null;

      const updatedSchedules = prev.payment_schedules.map((s) => {
        if (s.milestoneId !== targetVer.milestoneId) return s;
        if (newStatus === 'Disetujui' && approvedPercentage >= 100 && autoRelease && s.status !== 'Berhasil') {
          autoPaidSchedule = s;
          return {
            ...s,
            status: 'Berhasil' as const,
            verificationId,
            approvedByClient: true,
            paidAt: today,
            txHash: simHash,
            proofRef,
          };
        }
        const nextPayStatus = evaluateSmartContractPaymentTrigger(
          newStatus,
          approvedPercentage,
          s.status,
          autoRelease
        );
        return {
          ...s,
          status: nextPayStatus,
          verificationId,
        };
      });

      const targetProject = prev.projects.find((p) => p.id === targetVer.projectId);

      const nextPayments = autoPaidSchedule
        ? [
            {
              id: generateUniqueId('pay'),
              scheduleId: (autoPaidSchedule as typeof prev.payment_schedules[0]).id,
              projectId: targetVer.projectId,
              projectName: targetVer.projectName,
              termName: `${(autoPaidSchedule as typeof prev.payment_schedules[0]).milestoneName} (${(autoPaidSchedule as typeof prev.payment_schedules[0]).percentage}%) -> Bank Mandiri 1480025086508 (MUHAJIRIN KASIM)`,
              amount: (autoPaidSchedule as typeof prev.payment_schedules[0]).nominal,
              status: 'Berhasil' as const,
              processedAt: nowTime,
              proofNumber: proofRef,
            },
            ...prev.payments,
          ]
        : prev.payments;

      const nextTransactions = autoPaidSchedule
        ? [
            {
              id: generateNextTransactionId(prev.transactions),
              date: today,
              projectId: targetVer.projectId,
              projectName: targetVer.projectName,
              milestoneName: `${(autoPaidSchedule as typeof prev.payment_schedules[0]).milestoneName} (${(autoPaidSchedule as typeof prev.payment_schedules[0]).percentage}%)`,
              sender: `${targetProject?.clientName || 'Citra Ayu Deswina Maharani'} (Pengguna Jasa)`,
              receiver: 'MUHAJIRIN KASIM — Bank Mandiri 1480025086508 (Penyedia Jasa)',
              nominal: (autoPaidSchedule as typeof prev.payment_schedules[0]).nominal,
              paymentMethod: 'Simulasi Smart Contract Escrow (DEMO)' as const,
              status: 'Berhasil (DEMO)' as const,
              txHash: simHash,
              isDemo: true,
            },
            ...prev.transactions,
          ]
        : prev.transactions;

      const updatedSmartContracts = prev.smart_contracts.map((sc) => {
        if (sc.projectId !== targetVer.projectId) return sc;
        return {
          ...sc,
          lastTxHash: simHash,
          executionLogs: [
            {
              id: generateUniqueId('scl'),
              timestamp: nowTime,
              event:
                newStatus === 'Disetujui' && approvedPercentage >= 100
                  ? `AutoPayoutReleased(${targetVer.milestoneName} -> Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM)`
                  : `VerificationRecorded(${targetVer.milestoneName}, ${newStatus}, ${approvedPercentage}%)`,
              txHash: simHash,
              status: 'SIMULATED_SUCCESS' as const,
              details:
                newStatus === 'Disetujui' && approvedPercentage >= 100
                  ? `Verifikasi tahapan ${targetVer.milestoneName} selesai 100%. Dana otomatis dibayarkan ke rekening MUHAJIRIN KASIM — Bank Mandiri (1480025086508).`
                  : `Status verifikasi tahapan ${targetVer.milestoneName}: ${newStatus}.`,
            },
            ...sc.executionLogs,
          ],
        };
      });

      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'PROCESS_VERIFICATION',
        'Verifikasi Pekerjaan',
        `Verifikasi tahapan "${targetVer.milestoneName}" (${targetVer.projectName}): ${newStatus} (${approvedPercentage}%).${
          autoPaidSchedule
            ? ' Pembayaran otomatis telah ditransfer ke MUHAJIRIN KASIM — Bank Mandiri 1480025086508.'
            : ''
        }`,
        newStatus === 'Disetujui' ? 'Pembayaran berhasil' : 'Progres ditolak',
        `Hasil Verifikasi & Pencairan Otomatis: ${targetVer.milestoneName} (${newStatus})`
      );

      return {
        ...prev,
        verifications: updatedVerifications,
        progress_reports: updatedReports,
        contract_milestones: updatedMilestones,
        projects: updatedProjects,
        bim_models: updatedBimModels,
        payment_schedules: updatedSchedules,
        payments: nextPayments,
        transactions: nextTransactions,
        smart_contracts: updatedSmartContracts,
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  const handleExecuteSimulatedPayment = (scheduleId: string) => {
    setDb((prev) => {
      const targetSch = prev.payment_schedules.find((s) => s.id === scheduleId);
      if (!targetSch) return prev;

      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const simTxHash = `0xSIMULATED_${Date.now().toString(16)}e91b44d0`;
      const proofRef = `MANDIRI-AUTO-1480025086508-T${targetSch.termNumber}`;

      const updatedSchedules = prev.payment_schedules.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              status: 'Berhasil' as const,
              approvedByClient: true,
              paidAt: today,
              txHash: simTxHash,
              proofRef,
            }
          : s
      );

      const targetProject = prev.projects.find((p) => p.id === targetSch.projectId);

      const newTransaction = {
        id: generateNextTransactionId(prev.transactions),
        date: today,
        projectId: targetSch.projectId,
        projectName: targetSch.projectName,
        milestoneName: `${targetSch.milestoneName} (${targetSch.percentage}%)`,
        sender: `${targetProject?.clientName || 'Citra Ayu Deswina Maharani'} (Pengguna Jasa)`,
        receiver: 'MUHAJIRIN KASIM — Bank Mandiri 1480025086508 (Penyedia Jasa)',
        nominal: targetSch.nominal,
        paymentMethod: 'Simulasi Smart Contract Escrow (DEMO)' as const,
        status: 'Berhasil (DEMO)' as const,
        txHash: simTxHash,
        isDemo: true,
      };

      const newPayment = {
        id: generateUniqueId('pay'),
        scheduleId: targetSch.id,
        projectId: targetSch.projectId,
        projectName: targetSch.projectName,
        termName: `${targetSch.milestoneName} (${targetSch.percentage}%) -> Bank Mandiri 1480025086508 (MUHAJIRIN KASIM)`,
        amount: targetSch.nominal,
        status: 'Berhasil' as const,
        processedAt: nowTime,
        proofNumber: proofRef,
      };

      const updatedSmartContracts = prev.smart_contracts.map((sc) =>
        sc.projectId === targetSch.projectId
          ? {
              ...sc,
              lastTxHash: simTxHash,
              executionLogs: [
                {
                  id: generateUniqueId('scl'),
                  timestamp: nowTime,
                  event: `AutoPayoutReleased(${targetSch.milestoneName}, Rp${targetSch.nominal.toLocaleString('id-ID')} -> Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM)`,
                  txHash: simTxHash,
                  status: 'SIMULATED_SUCCESS' as const,
                  details: `Pembayaran Termin #${targetSch.termNumber} otomatis dicairkan ke MUHAJIRIN KASIM — Bank Mandiri (1480025086508).`,
                },
                ...sc.executionLogs,
              ],
            }
          : sc
      );

      const { nextLogs, nextNotifs } = appendLogAndNotif(
        prev,
        'EXECUTE_SIMULATED_PAYMENT',
        'Pembayaran',
        `Pembayaran ${targetSch.milestoneName} (${targetSch.projectName}) sebesar Rp${targetSch.nominal.toLocaleString(
          'id-ID'
        )} berhasil dicairkan ke MUHAJIRIN KASIM — Bank Mandiri 1480025086508.`,
        'Pembayaran berhasil',
        `Pembayaran Berhasil: ${targetSch.milestoneName} (Bank Mandiri 1480025086508)`
      );

      return {
        ...prev,
        payment_schedules: updatedSchedules,
        payments: [newPayment, ...prev.payments],
        transactions: [newTransaction, ...prev.transactions],
        smart_contracts: updatedSmartContracts,
        activity_logs: nextLogs,
        notifications: nextNotifs,
      };
    });
  };

  if (!currentUser) {
    return (
      <>
        {loadingOverlay.visible && (
          <SmartBuildLoadingOverlay
            title={loadingOverlay.message}
            subtitle={loadingOverlay.subMessage}
          />
        )}
        <AuthViews
          users={db.users}
          organizations={db.organizations}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((d) => !d)}
          onLogin={(user) => {
            triggerLoadingAnimation(
              `Menyiapkan Ruang Kerja ${user.name}...`,
              'Menyinkronkan Model BIM 3D & Ledger Smart Contract',
              650
            );
            setCurrentUser(user);
            setActiveMenu('dashboard');
          }}
          onRegister={(newUser, newOrgName) => {
            const createdUser: User = {
              ...newUser,
              id: generateUniqueId('usr'),
              status: 'Aktif',
              createdAt: new Date().toISOString().split('T')[0],
            };
            setDb((prev) => ({
              ...prev,
              users: [...prev.users, createdUser],
              organizations:
                newOrgName &&
                !prev.organizations.some((o) => o.id === createdUser.organizationId)
                  ? [
                      ...prev.organizations,
                      {
                        id: createdUser.organizationId,
                        name: newOrgName,
                        type:
                          createdUser.role === 'client'
                            ? 'Owner / Client'
                            : createdUser.role === 'contractor'
                            ? 'Kontraktor Utama'
                            : 'Konsultan Pengawas',
                        npwp: '09.876.543.2-100.000',
                        address: 'Indonesia',
                        phone: createdUser.phone,
                        verified: true,
                      },
                    ]
                  : prev.organizations,
            }));
            triggerLoadingAnimation(
              `Mendaftarkan Akun ${createdUser.name}...`,
              'Menginisialisasi akses proyek & kontrak digital',
              650
            );
            setCurrentUser(createdUser);
            setActiveMenu('dashboard');
          }}
        />
      </>
    );
  }

  const visibleMenus = MENU_ITEMS.filter((item) =>
    canAccessMenu(currentUser.role, item.id)
  );
  const currentMenuMeta =
    MENU_ITEMS.find((m) => m.id === activeMenu) || MENU_ITEMS[0];
  const unreadNotifCount = db.notifications.filter((n) => !n.read).length;

  // Pick up to 5 key menus for mobile bottom bar
  const mobileQuickMenus = visibleMenus.filter((m) =>
    ['dashboard', 'projects', 'bim', 'verification', 'settings'].includes(m.id)
  ).slice(0, 5);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {loadingOverlay.visible && (
        <SmartBuildLoadingOverlay
          title={loadingOverlay.message}
          subtitle={loadingOverlay.subMessage}
        />
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#071D49] dark:bg-slate-900 text-white shrink-0 border-r border-slate-800 no-print">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <SmartBuildLogo className="w-8 h-8" />
          <div>
            <span className="text-lg font-bold tracking-tight whitespace-nowrap block leading-none">
              SmartBuild
            </span>
            <span className="text-[10px] text-blue-300 font-medium tracking-wider uppercase">
              BIM &amp; Smart Contract
            </span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/10 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Akun &amp; Peran Aktif</span>
            {appsScriptConfig.connectionStatus === 'connected' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                <Cloud className="w-2.5 h-2.5" /> GAS DB
              </span>
            )}
          </div>
          <div className="font-bold text-white truncate mt-0.5">{currentUser.name}</div>
          <div className="text-[#60A5FA] font-medium truncate">
            {getRoleLabel(currentUser.role)}
          </div>
        </div>

        <nav
          aria-label="Navigasi Utama SmartBuild"
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
        >
          {visibleMenus.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1264F4] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {((item.id === 'users' && !isOwnerUsersUnlocked) ||
                  (item.id === 'settings' && !isOwnerSettingsUnlocked)) && (
                  <Lock className="w-3.5 h-3.5 ml-auto text-amber-400 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={() =>
              triggerLoadingAnimation(
                'Menyinkronkan Mesin BIM 3D & Smart Contract...',
                'Memeriksa sinkronisasi data kontrak, progres lapangan & BIM 3D',
                950
              )
            }
            className="w-full px-3 py-2 rounded-lg border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Efek Animasi Loading</span>
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setDb(INITIAL_DATABASE);
              triggerLoadingAnimation(
                'Mereset Data Proyek...',
                'Mengembalikan data proyek Pembangunan Rumah di Gang Mahanggi Tenggarong',
                600
              );
            }}
            className="w-full px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-red-600/80 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-[#071D49] dark:bg-slate-900 text-white flex flex-col z-10 shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SmartBuildLogo className="w-7 h-7" />
                <span className="text-lg font-bold">SmartBuild</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Tutup menu navigasi"
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Mobile Active Account Info inside Drawer */}
            <div className="px-4 py-3 border-b border-white/10 space-y-0.5 text-xs">
              <div className="text-slate-400 text-[11px]">Akun Aktif Saat Ini</div>
              <div className="font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[#60A5FA] font-medium truncate">
                {getRoleLabel(currentUser.role)}
              </div>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {visibleMenus.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveMenu(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      isActive
                        ? 'bg-[#1264F4] text-white'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {((item.id === 'users' && !isOwnerUsersUnlocked) ||
                      (item.id === 'settings' && !isOwnerSettingsUnlocked)) && (
                      <Lock className="w-3.5 h-3.5 ml-auto text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setCurrentUser(null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-red-600/80 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Halaman Login</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Bar Contract for SaaS Dashboard */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 no-print transition-colors">
          {/* Left Zone: Mobile Menu Trigger + Breadcrumb Trail */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="lg:hidden shrink-0">
              <SmartBuildLogo className="w-6 h-6" />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-[#071D49] dark:text-white hidden sm:inline">SmartBuild</span>
              <span aria-hidden="true" className="hidden sm:inline"> / </span>
              <span className="font-semibold text-slate-900 dark:text-white">{currentMenuMeta.label}</span>
            </div>
          </div>

          {/* Right Zone: Dark Mode Toggle, Notifications & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode((d) => !d)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              aria-label={isDarkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Malam'}
              title={isDarkMode ? 'Mode Terang (Light)' : 'Mode Malam (Dark)'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#1264F4]" />
                  <span className="hidden sm:inline">Mode Malam</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
                aria-label="Panel Notifikasi"
              >
                <Bell className="w-3.5 h-3.5 text-[#1264F4]" />
                <span className="hidden sm:inline">Notifikasi</span>
                <span>({unreadNotifCount})</span>
              </button>

              {showNotifPanel && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 z-50 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-[#071D49] dark:text-white">Notifikasi Sistem</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDb((prev) => ({
                          ...prev,
                          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
                        }));
                      }}
                      className="text-[11px] font-semibold text-[#1264F4] hover:underline"
                    >
                      Tandai Semua Dibaca
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {db.notifications.slice(0, 6).map((n) => (
                      <div key={n.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="font-semibold text-slate-900 dark:text-white">{n.title}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {n.category} · {n.createdAt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#071D49] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Halaman Login
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto">
          {activeMenu === 'dashboard' && (
            <DashboardView
              db={db}
              currentUser={currentUser}
              onNavigate={(menu) => setActiveMenu(menu)}
            />
          )}

          {activeMenu === 'projects' && (
            <ProjectsView
              db={db}
              currentUser={currentUser}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {activeMenu === 'contracts' && (
            <ContractsView
              db={db}
              currentUser={currentUser}
              onCreateOrUpdateContract={handleCreateOrUpdateContract}
              onApproveContract={handleApproveContract}
              onSendContractForApproval={handleSendContractForApproval}
            />
          )}

          {activeMenu === 'policy' && <ContractPolicyView db={db} />}

          {activeMenu === 'progress' && (
            <ProgressView
              db={db}
              currentUser={currentUser}
              onSubmitProgressReport={handleSubmitProgressReport}
              onProcessVerification={handleProcessVerification}
              onResetStage3Simulation={() => {
                setDb((prev) => {
                  const updatedMilestones = prev.contract_milestones.map((m) =>
                    m.id === 'ms-003' || (m.projectId === 'prj-001' && m.order === 3)
                      ? { ...m, realizedProgress: 20, status: 'Dalam Proses' as const }
                      : m
                  );
                  const prj1Milestones = updatedMilestones.filter((m) => m.projectId === 'prj-001');
                  const newOverall = calculateWeightedProjectProgress(prj1Milestones);
                  return {
                    ...prev,
                    contract_milestones: updatedMilestones,
                    projects: prev.projects.map((p) =>
                      p.id === 'prj-001' ? { ...p, overallProgress: newOverall } : p
                    ),
                    payment_schedules: prev.payment_schedules.map((s) =>
                      s.milestoneId === 'ms-003'
                        ? {
                            ...s,
                            status: 'Menunggu verifikasi' as const,
                            paidAt: undefined,
                            txHash: undefined,
                            proofRef: undefined,
                          }
                        : s
                    ),
                    verifications: INITIAL_DATABASE.verifications,
                    progress_reports: INITIAL_DATABASE.progress_reports,
                  };
                });
                triggerLoadingAnimation(
                  'Mengulang Simulasi Tahap 3...',
                  'Mengembalikan Tahap 3 (Dinding & Atap) ke kondisi awal 20% Dalam Proses',
                  500
                );
              }}
            />
          )}

          {activeMenu === 'bim' && (
            <BimViewerView
              db={db}
              onUpdateBimModel={(updatedModel: BimModel) => {
                setDb((prev) => ({
                  ...prev,
                  bim_models: prev.bim_models.map((m) =>
                    m.id === updatedModel.id ? updatedModel : m
                  ),
                }));
              }}
            />
          )}

          {activeMenu === 'verification' && (
            <VerificationView
              db={db}
              currentUser={currentUser}
              onProcessVerification={handleProcessVerification}
            />
          )}

          {activeMenu === 'payments' && (
            <PaymentsAndSmartContractView
              db={db}
              currentUser={currentUser}
              onExecuteSimulatedPayment={handleExecuteSimulatedPayment}
              onUpdateSmartContractConfig={(updatedSc: SmartContractConfig) => {
                setDb((prev) => ({
                  ...prev,
                  smart_contracts: prev.smart_contracts.map((s) =>
                    s.id === updatedSc.id ? updatedSc : s
                  ),
                }));
              }}
            />
          )}

          {activeMenu === 'transactions' && <TransactionsView db={db} />}

          {activeMenu === 'reports' && <ReportsView db={db} />}

          {activeMenu === 'users' && (
            <UsersManagementView
              db={db}
              currentUser={currentUser}
              isOwnerUnlocked={isOwnerUsersUnlocked}
              onSetOwnerUnlocked={setIsOwnerUsersUnlocked}
              onAddUser={(newUser) => {
                setDb((prev) => ({
                  ...prev,
                  users: [
                    ...prev.users,
                    {
                      ...newUser,
                      id: generateUniqueId('usr'),
                      createdAt: new Date().toISOString().split('T')[0],
                    },
                  ],
                }));
              }}
              onUpdateUser={(updatedUser, loginAfterSave) => {
                setDb((prev) => ({
                  ...prev,
                  users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
                }));
                if (loginAfterSave || currentUser.id === updatedUser.id) {
                  setCurrentUser(updatedUser);
                  if (loginAfterSave) {
                    triggerLoadingAnimation(
                      `Masuk Sebagai ${updatedUser.name}...`,
                      `Peran Aktif: ${getRoleLabel(updatedUser.role)}`,
                      500
                    );
                  }
                }
              }}
              onDeleteUser={(userId) => {
                setDb((prev) => {
                  if (prev.users.length <= 1) return prev;
                  const remaining = prev.users.filter((u) => u.id !== userId);
                  if (currentUser.id === userId) {
                    setCurrentUser(remaining[0]);
                  }
                  return {
                    ...prev,
                    users: remaining,
                  };
                });
              }}
              onLoginAsUser={(userId) => {
                handleRoleSwitch(userId);
              }}
              onToggleUserStatus={(userId) => {
                setDb((prev) => ({
                  ...prev,
                  users: prev.users.map((u) =>
                    u.id === userId
                      ? { ...u, status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
                      : u
                  ),
                }));
              }}
            />
          )}

          {activeMenu === 'settings' && (
            <SettingsView
              db={db}
              currentUser={currentUser}
              systemSettings={db.system_settings}
              appsScriptConfig={appsScriptConfig}
              isOwnerUnlocked={isOwnerSettingsUnlocked}
              onSetOwnerUnlocked={setIsOwnerSettingsUnlocked}
              onUpdateAppsScriptConfig={(nextCfg) => setAppsScriptConfig(nextCfg)}
              onReplaceDatabaseFromCloud={(cloudData) => {
                setDb((prev) =>
                  sanitizeSmartBuildDatabase(
                    {
                      ...prev,
                      ...cloudData,
                    },
                    INITIAL_DATABASE
                  )
                );
              }}
              onUpdateProfile={(updatedUser) => {
                setCurrentUser(updatedUser);
                setDb((prev) => ({
                  ...prev,
                  users: prev.users.map((u) =>
                    u.id === updatedUser.id ? updatedUser : u
                  ),
                }));
              }}
              onUpdateSystemSettings={(updatedSys: SystemSettings) => {
                setDb((prev) => ({
                  ...prev,
                  system_settings: updatedSys,
                }));
              }}
            />
          )}

          {activeMenu === 'help' && <HelpView />}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar for Smartphone Ergonomics */}
      <nav
        aria-label="Navigasi Cepat Mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around no-print"
      >
        {mobileQuickMenus.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveMenu(item.id)}
              className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-[#1264F4] dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
