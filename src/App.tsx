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
  Building2,
  Bell,
  LogOut,
  Menu,
  X,
  RotateCcw,
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
  getRoleLabel,
} from './utils/calculations';
import { AuthViews } from './components/AuthViews';
import { DashboardView } from './components/DashboardView';
import { ContractsView, ProjectsView } from './components/ProjectsAndContractsView';
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

const STORAGE_KEY = 'smartbuild_enterprise_db_v1';

const MENU_ITEMS: { id: MenuId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyek Saya', icon: FolderKanban },
  { id: 'contracts', label: 'Kontrak Digital', icon: FileSignature },
  { id: 'progress', label: 'Progress Proyek', icon: TrendingUp },
  { id: 'bim', label: 'BIM Viewer', icon: Box },
  { id: 'verification', label: 'Verifikasi Pekerjaan', icon: ClipboardCheck },
  { id: 'payments', label: 'Pembayaran', icon: Wallet },
  { id: 'transactions', label: 'Riwayat Transaksi', icon: History },
  { id: 'reports', label: 'Laporan', icon: BarChart3 },
  { id: 'users', label: 'Pengguna', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
  { id: 'help', label: 'Bantuan', icon: HelpCircle },
];

export default function App() {
  const [db, setDb] = useState<SmartBuildDatabase>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as SmartBuildDatabase;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_DATABASE;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return INITIAL_DATABASE.users[0];
  });
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore storage errors
    }
  }, [db]);

  // Ensure active menu is accessible when switching roles
  const handleRoleSwitch = (userId: string) => {
    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) return;
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
        id: `log-${Date.now()}`,
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
              id: `notif-${Date.now()}`,
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
        id: `prj-${Date.now()}`,
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

      // Create milestones & payment schedules
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
              id: `rev-${Date.now()}`,
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
      const reportId = `rep-${Date.now()}`;
      const verId = `ver-${Date.now()}`;
      const newReport: ProgressReport = {
        ...newReportData,
        id: reportId,
        attachments: newReportData.attachments.map((a) => ({ ...a, reportId })),
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

      // Recalculate overall project progress
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

      // Update BIM object completion rate if linked
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

      // Evaluate Smart Contract payment trigger
      const scConfig = prev.smart_contracts.find(
        (sc) => sc.projectId === targetVer.projectId
      );
      const autoRelease = scConfig?.autoReleaseOnVerification ?? true;

      const updatedSchedules = prev.payment_schedules.map((s) => {
        if (s.milestoneId !== targetVer.milestoneId) return s;
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

      // Append Smart Contract execution log if approved
      const simHash = `0xSIMULATED_${Date.now().toString(16)}a8f4c2`;
      const updatedSmartContracts = prev.smart_contracts.map((sc) => {
        if (sc.projectId !== targetVer.projectId) return sc;
        return {
          ...sc,
          lastTxHash: simHash,
          executionLogs: [
            {
              id: `scl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              event: `VerificationRecorded(${targetVer.milestoneName}, ${newStatus}, ${approvedPercentage}%)`,
              txHash: simHash,
              status: 'SIMULATED_SUCCESS' as const,
              details:
                newStatus === 'Disetujui' && approvedPercentage >= 100
                  ? `Verifikasi tahapan ${targetVer.milestoneName} disetujui 100%. Termin pembayaran dibuka menjadi "Siap dibayarkan".`
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
        `Verifikasi tahapan "${targetVer.milestoneName}" (${targetVer.projectName}): ${newStatus} (${approvedPercentage}%). Progres proyek kini ${newOverallProgress}%.`,
        newStatus === 'Disetujui' ? 'Progres disetujui' : 'Progres ditolak',
        `Hasil Verifikasi: ${targetVer.milestoneName} (${newStatus})`
      );

      return {
        ...prev,
        verifications: updatedVerifications,
        progress_reports: updatedReports,
        contract_milestones: updatedMilestones,
        projects: updatedProjects,
        bim_models: updatedBimModels,
        payment_schedules: updatedSchedules,
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
      const proofRef = `INV-DEMO-2026-${String(prev.transactions.length + 1).padStart(4, '0')}`;

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
        id: `TRX-DEMO-2026-${String(prev.transactions.length + 1).padStart(3, '0')}`,
        date: today,
        projectId: targetSch.projectId,
        projectName: targetSch.projectName,
        milestoneName: `${targetSch.milestoneName} (${targetSch.percentage}%)`,
        sender: `${targetProject?.clientName || 'Budi Santoso'} (Pengguna Jasa)`,
        receiver: `${targetProject?.contractorName || 'PT Maju Karya'} (Penyedia Jasa)`,
        nominal: targetSch.nominal,
        paymentMethod: 'Simulasi Smart Contract Escrow (DEMO)' as const,
        status: 'Berhasil (DEMO)' as const,
        txHash: simTxHash,
        isDemo: true,
      };

      const newPayment = {
        id: `pay-${Date.now()}`,
        scheduleId: targetSch.id,
        projectId: targetSch.projectId,
        projectName: targetSch.projectName,
        termName: `${targetSch.milestoneName} (${targetSch.percentage}%)`,
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
                  id: `scl-${Date.now()}`,
                  timestamp: nowTime,
                  event: `MilestonePaymentReleased(${targetSch.milestoneName}, Rp${targetSch.nominal.toLocaleString('id-ID')})`,
                  txHash: simTxHash,
                  status: 'SIMULATED_SUCCESS' as const,
                  details: `Pembayaran simulasi Termin #${targetSch.termNumber} berhasil dieksekusi dan dicatat pada Riwayat Transaksi (DEMO).`,
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
        `Pembayaran simulasi ${targetSch.milestoneName} (${targetSch.projectName}) sebesar Rp${targetSch.nominal.toLocaleString(
          'id-ID'
        )} berhasil dicairkan (DEMO).`,
        'Pembayaran berhasil',
        `Pembayaran Berhasil: ${targetSch.milestoneName} (DEMO)`
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
      <AuthViews
        users={db.users}
        organizations={db.organizations}
        onLogin={(user) => {
          setCurrentUser(user);
          setActiveMenu('dashboard');
        }}
        onRegister={(newUser, newOrgName) => {
          const createdUser: User = {
            ...newUser,
            id: `usr-${Date.now()}`,
            status: 'Aktif',
            createdAt: new Date().toISOString().split('T')[0],
          };
          setDb((prev) => ({
            ...prev,
            users: [...prev.users, createdUser],
            organizations: newOrgName
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
          setCurrentUser(createdUser);
          setActiveMenu('dashboard');
        }}
      />
    );
  }

  const visibleMenus = MENU_ITEMS.filter((item) =>
    canAccessMenu(currentUser.role, item.id)
  );
  const currentMenuMeta =
    MENU_ITEMS.find((m) => m.id === activeMenu) || MENU_ITEMS[0];
  const unreadNotifCount = db.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#071D49] text-white shrink-0 border-r border-slate-800 no-print">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1264F4] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight whitespace-nowrap">
            SmartBuild
          </span>
        </div>

        <div className="px-4 py-3 border-b border-white/10 text-xs">
          <div className="text-slate-400">Akun &amp; Peran Aktif</div>
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
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setDb(INITIAL_DATABASE);
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
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-[#071D49] text-white flex flex-col z-10">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-lg font-bold">SmartBuild</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Tutup menu navigasi"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract for SaaS Dashboard */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-6 sticky top-0 z-30 no-print">
          {/* Left Zone: Mobile Menu Trigger + Breadcrumb Trail */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-500 truncate">
              <span className="font-semibold text-[#071D49]">SmartBuild</span>
              <span aria-hidden="true"> / </span>
              <span className="font-semibold text-slate-900">{currentMenuMeta.label}</span>
            </div>
          </div>

          {/* Right Zone: Role Switcher, Notifications & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <label htmlFor="header-role-switch" className="text-slate-500 font-medium whitespace-nowrap">
                Simulasi Peran (RBAC):
              </label>
              <select
                id="header-role-switch"
                value={currentUser.id}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs font-semibold text-[#071D49]"
              >
                {db.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getRoleLabel(u.role)} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
                aria-label="Panel Notifikasi"
              >
                <Bell className="w-3.5 h-3.5 text-[#1264F4]" />
                <span>Notifikasi ({unreadNotifCount})</span>
              </button>

              {showNotifPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-[#071D49]">Notifikasi Sistem</span>
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
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {db.notifications.slice(0, 6).map((n) => (
                      <div key={n.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="font-semibold text-slate-900">{n.title}</div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
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
              className="px-3 py-1.5 rounded-lg bg-[#071D49] hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Halaman Login
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
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

          {activeMenu === 'progress' && (
            <ProgressView
              db={db}
              currentUser={currentUser}
              onSubmitProgressReport={handleSubmitProgressReport}
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
              onAddUser={(newUser) => {
                setDb((prev) => ({
                  ...prev,
                  users: [
                    ...prev.users,
                    {
                      ...newUser,
                      id: `usr-${Date.now()}`,
                      createdAt: new Date().toISOString().split('T')[0],
                    },
                  ],
                }));
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
              currentUser={currentUser}
              systemSettings={db.system_settings}
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
    </div>
  );
}
