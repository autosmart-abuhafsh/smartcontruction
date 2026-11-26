import {
  ContractMilestone,
  MenuId,
  PaymentSchedule,
  PaymentStatus,
  Project,
  SmartBuildDatabase,
  UserRole,
  VerificationStatus,
} from '../types/smartbuild';

export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return 'Rp' + safeAmount.toLocaleString('id-ID');
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return dateStr;
  }
  return `${day} ${months[monthIdx]} ${year}`;
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'client':
      return 'Pengguna Jasa (Owner)';
    case 'contractor':
      return 'Penyedia Jasa (Kontraktor)';
    case 'verifikator':
      return 'Verifikator / Pengawas';
  }
}

const ROLE_MENU_ACCESS: Record<UserRole, MenuId[]> = {
  super_admin: [
    'dashboard',
    'projects',
    'contracts',
    'progress',
    'bim',
    'verification',
    'payments',
    'transactions',
    'reports',
    'users',
    'settings',
    'help',
  ],
  client: [
    'dashboard',
    'projects',
    'contracts',
    'progress',
    'bim',
    'verification',
    'payments',
    'transactions',
    'reports',
    'settings',
    'help',
  ],
  contractor: [
    'dashboard',
    'projects',
    'contracts',
    'progress',
    'bim',
    'verification',
    'payments',
    'transactions',
    'reports',
    'settings',
    'help',
  ],
  verifikator: [
    'dashboard',
    'projects',
    'progress',
    'bim',
    'verification',
    'reports',
    'settings',
    'help',
  ],
};

export function canAccessMenu(role: UserRole, menu: MenuId): boolean {
  return ROLE_MENU_ACCESS[role]?.includes(menu) ?? false;
}

export type AppAction =
  | 'create_project'
  | 'edit_project'
  | 'delete_project'
  | 'create_contract'
  | 'approve_contract_client'
  | 'approve_contract_contractor'
  | 'submit_progress'
  | 'verify_progress'
  | 'approve_payment_release'
  | 'execute_payment'
  | 'manage_users'
  | 'manage_system_settings';

export function canPerformAction(role: UserRole, action: AppAction): boolean {
  switch (action) {
    case 'create_project':
    case 'edit_project':
    case 'delete_project':
    case 'create_contract':
    case 'approve_contract_client':
    case 'approve_payment_release':
    case 'execute_payment':
      return role === 'super_admin' || role === 'client';
    case 'approve_contract_contractor':
    case 'submit_progress':
      return role === 'super_admin' || role === 'contractor';
    case 'verify_progress':
      return role === 'super_admin' || role === 'verifikator' || role === 'client';
    case 'manage_users':
    case 'manage_system_settings':
      return role === 'super_admin';
    default:
      return false;
  }
}

export function calculateMilestoneNominal(contractTotalValue: number, percentage: number): number {
  if (contractTotalValue <= 0 || percentage <= 0) return 0;
  return Math.round((contractTotalValue * percentage) / 100);
}

export function validateMilestonesTotalPercentage(percentages: number[]): {
  valid: boolean;
  total: number;
  message: string;
} {
  const total = Math.round(percentages.reduce((acc, val) => acc + (Number(val) || 0), 0) * 100) / 100;
  if (total !== 100) {
    return {
      valid: false,
      total,
      message: `Total persentase tahapan saat ini ${total}%. Harus tepat 100%.`,
    };
  }
  return {
    valid: true,
    total: 100,
    message: 'Total persentase tahapan valid (100%).',
  };
}

export function calculateWeightedProjectProgress(milestones: ContractMilestone[]): number {
  if (!milestones || milestones.length === 0) return 0;
  const totalProgress = milestones.reduce((acc, m) => {
    const realizedRatio = Math.min(100, Math.max(0, m.realizedProgress)) / 100;
    return acc + m.weightPercentage * realizedRatio;
  }, 0);
  return Math.round(totalProgress);
}

export function canDeleteProject(project: Project, hasActiveContract: boolean): {
  allowed: boolean;
  reason?: string;
} {
  if (hasActiveContract && project.status !== 'Dibatalkan' && project.status !== 'Draft') {
    return {
      allowed: false,
      reason: 'Proyek yang sedang berjalan dan memiliki kontrak aktif tidak dapat dihapus. Ubah status menjadi Dibatalkan atau hapus kontrak draft terlebih dahulu.',
    };
  }
  if (
    project.status === 'Aktif' ||
    project.status === 'Dalam pengerjaan' ||
    project.status === 'Menunggu verifikasi' ||
    project.status === 'Selesai'
  ) {
    return {
      allowed: false,
      reason: `Proyek berstatus "${project.status}" tidak dapat dihapus demi integritas audit. Hanya proyek berstatus "Draft" atau "Dibatalkan" yang dapat dihapus.`,
    };
  }
  return { allowed: true };
}

export function evaluateSmartContractPaymentTrigger(
  verificationStatus: VerificationStatus,
  approvedPercentage: number,
  currentPaymentStatus: PaymentStatus,
  autoReleaseOnVerification: boolean
): PaymentStatus {
  if (currentPaymentStatus === 'Berhasil') return 'Berhasil';
  if (verificationStatus === 'Disetujui' && approvedPercentage >= 100) {
    return autoReleaseOnVerification ? 'Siap dibayarkan' : 'Menunggu persetujuan';
  }
  if (verificationStatus === 'Menunggu pemeriksaan' || verificationStatus === 'Dalam pemeriksaan') {
    return 'Menunggu verifikasi';
  }
  if (verificationStatus === 'Ditolak' || verificationStatus === 'Memerlukan revisi') {
    return 'Belum memenuhi syarat';
  }
  return currentPaymentStatus;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  activeContracts: number;
  totalContractValue: number;
  totalPaidAmount: number;
  totalPendingPaymentAmount: number;
  averageProgress: number;
  pendingVerificationsCount: number;
}

export function computeDashboardStats(
  projects: Project[],
  activeContractsCount: number,
  paymentSchedules: PaymentSchedule[],
  pendingVerificationsCount: number
): DashboardMetrics {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) =>
      p.status === 'Aktif' ||
      p.status === 'Dalam pengerjaan' ||
      p.status === 'Menunggu verifikasi'
  ).length;

  const totalContractValue = projects
    .filter((p) => p.status !== 'Dibatalkan')
    .reduce((sum, p) => sum + p.contractValue, 0);

  const totalPaidAmount = paymentSchedules
    .filter((s) => s.status === 'Berhasil')
    .reduce((sum, s) => sum + s.nominal, 0);

  const totalPendingPaymentAmount = paymentSchedules
    .filter(
      (s) =>
        s.status === 'Siap dibayarkan' ||
        s.status === 'Menunggu verifikasi' ||
        s.status === 'Menunggu persetujuan' ||
        s.status === 'Diproses'
    )
    .reduce((sum, s) => sum + s.nominal, 0);

  const progressedPool = projects.filter(
    (p) => p.status !== 'Draft' && p.status !== 'Dibatalkan'
  );
  const baseForAvg = progressedPool.length > 0 ? progressedPool : projects;
  const averageProgress =
    baseForAvg.length > 0
      ? Math.round(baseForAvg.reduce((sum, p) => sum + p.overallProgress, 0) / baseForAvg.length)
      : 0;

  return {
    totalProjects,
    activeProjects,
    activeContracts: activeContractsCount,
    totalContractValue,
    totalPaidAmount,
    totalPendingPaymentAmount,
    averageProgress,
    pendingVerificationsCount,
  };
}

export const OWNER_SETTINGS_PASSWORD = '2026';

export function verifyOwnerSettingsPassword(input: string): boolean {
  return input.trim() === OWNER_SETTINGS_PASSWORD;
}

