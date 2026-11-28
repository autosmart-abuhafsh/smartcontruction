export type UserRole = 'super_admin' | 'client' | 'contractor' | 'verifikator';

export type ProjectStatus =
  | 'Draft'
  | 'Menunggu persetujuan'
  | 'Aktif'
  | 'Dalam pengerjaan'
  | 'Menunggu verifikasi'
  | 'Selesai'
  | 'Dibatalkan';

export type ContractStatus =
  | 'Draft'
  | 'Menunggu persetujuan'
  | 'Disetujui'
  | 'Aktif'
  | 'Selesai'
  | 'Dibatalkan';

export type VerificationStatus =
  | 'Menunggu pemeriksaan'
  | 'Dalam pemeriksaan'
  | 'Disetujui'
  | 'Ditolak'
  | 'Memerlukan revisi';

export type PaymentStatus =
  | 'Belum memenuhi syarat'
  | 'Menunggu verifikasi'
  | 'Menunggu persetujuan'
  | 'Siap dibayarkan'
  | 'Diproses'
  | 'Berhasil'
  | 'Gagal'
  | 'Dibatalkan';

export type MenuId =
  | 'dashboard'
  | 'projects'
  | 'contracts'
  | 'policy'
  | 'progress'
  | 'bim'
  | 'verification'
  | 'payments'
  | 'transactions'
  | 'reports'
  | 'users'
  | 'settings'
  | 'help';

export interface Organization {
  id: string;
  name: string;
  type: 'Owner / Client' | 'Kontraktor Utama' | 'Konsultan Pengawas' | 'Platform';
  npwp: string;
  address: string;
  phone: string;
  verified: boolean;
}

export interface User {
  id: string;
  loginId?: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  position: string;
  phone: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  category: 'Gedung Komersial' | 'Fasilitas Publik' | 'Infrastruktur' | 'Residensial' | 'Industri';
  description: string;
  location: string;
  clientId: string;
  clientName: string;
  contractorId: string;
  contractorName: string;
  verifikatorId: string;
  verifikatorName: string;
  contractValue: number;
  startDate: string;
  targetEndDate: string;
  status: ProjectStatus;
  overallProgress: number;
  documents: { id: string; title: string; type: string; uploadedAt: string; size: string }[];
  photos: { id: string; caption: string; stage: string; uploadedAt: string }[];
  isDemo: boolean;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  roleInProject: UserRole;
  assignedAt: string;
}

export interface ContractMilestone {
  id: string;
  contractId: string;
  projectId: string;
  order: number;
  name: string;
  description: string;
  weightPercentage: number;
  targetProgress: number;
  realizedProgress: number;
  nominalValue: number;
  dueDate: string;
  status: 'Belum Dimulai' | 'Dalam Proses' | 'Menunggu Verifikasi' | 'Selesai';
  bimElementGroupId?: string;
}

export interface ContractParty {
  id: string;
  contractId: string;
  userId: string;
  role: 'Pengguna Jasa' | 'Penyedia Jasa';
  name: string;
  organization: string;
  approved: boolean;
  approvedAt?: string;
  digitalSignatureHash?: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  projectId: string;
  projectName: string;
  workDescription: string;
  totalValue: number;
  durationDays: number;
  contractDate: string;
  paymentTerms: string;
  rightsAndObligations: string;
  cancellationClause: string;
  disputeResolution: string;
  status: ContractStatus;
  clientApproved: boolean;
  contractorApproved: boolean;
  revisionHistory: {
    id: string;
    date: string;
    actor: string;
    summary: string;
  }[];
  isDemo: boolean;
}

export interface ProgressAttachment {
  id: string;
  reportId: string;
  fileName: string;
  fileType: 'Foto Dokumentasi' | 'Dokumen Teknis' | 'Data Lapangan';
  fileSize: string;
  uploadedAt: string;
  fileDataUrl?: string;
  mimeType?: string;
  description?: string;
  uploadedBy?: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  projectName: string;
  milestoneId: string;
  milestoneName: string;
  targetPercentage: number;
  submittedPercentage: number;
  reportDate: string;
  workDescription: string;
  contractorNotes: string;
  submittedBy: string;
  verificationStatus: VerificationStatus;
  attachments: ProgressAttachment[];
  bimObjectIds: string[];
  isDemo: boolean;
}

export interface VerificationRecord {
  id: string;
  reportId: string;
  projectId: string;
  projectName: string;
  milestoneId: string;
  milestoneName: string;
  submittedPercentage: number;
  approvedPercentage: number;
  verifierId: string;
  verifierName: string;
  verificationDate: string;
  notes: string;
  supportingEvidenceSummary: string;
  bimChecked: boolean;
  status: VerificationStatus;
  isDemo: boolean;
}

export interface BimObjectElement {
  id: string;
  code: string;
  name: string;
  category: 'Pondasi' | 'Struktur' | 'Dinding dan Atap' | 'Instalasi' | 'Finishing';
  level: string;
  material: string;
  volumeM3: number;
  milestoneOrder: number;
  completionRate: number;
  inspectionState: 'Terverifikasi' | 'Dalam Pengerjaan' | 'Belum Dimulai';
}

export interface BimModel {
  id: string;
  projectId: string;
  projectName: string;
  modelName: string;
  format: 'IFC 4.0' | 'RVT (Revit)' | 'GLTF 3D';
  version: string;
  fileSize: string;
  modelUrl: string;
  integrationStatus: 'Simulasi MVP (Metadata & Elemen 3D Terhubung)' | 'Siap Integrasi API BIM';
  lastUpdated: string;
  uploadedBy: string;
  elements: BimObjectElement[];
}

export interface SmartContractConfig {
  id: string;
  projectId: string;
  projectName: string;
  contractId: string;
  contractAddress: string;
  networkName: 'SmartBuild Local Simulation Ledger (DEMO)' | 'Polygon Amoy Testnet (Adapter Ready)' | 'Ethereum Sepolia Testnet (Adapter Ready)';
  deploymentStatus: 'Active (Simulasi Fungsional MVP)' | 'Draft Konfigurasi' | 'Paused';
  autoReleaseOnVerification: boolean;
  requireClientCoSign: boolean;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryAccountNumber?: string;
  lastTxHash: string;
  executionLogs: {
    id: string;
    timestamp: string;
    event: string;
    txHash: string;
    status: 'SIMULATED_SUCCESS' | 'PENDING' | 'REVERTED';
    details: string;
  }[];
}

export interface PaymentSchedule {
  id: string;
  contractId: string;
  projectId: string;
  projectName: string;
  milestoneId: string;
  termNumber: number;
  milestoneName: string;
  percentage: number;
  nominal: number;
  status: PaymentStatus;
  verificationId?: string;
  approvedByClient: boolean;
  paidAt?: string;
  txHash?: string;
  proofRef?: string;
  isDemo: boolean;
}

export interface PaymentRecord {
  id: string;
  scheduleId: string;
  projectId: string;
  projectName: string;
  termName: string;
  amount: number;
  status: PaymentStatus;
  processedAt: string;
  proofNumber: string;
}

export interface TransactionRecord {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  milestoneName: string;
  sender: string;
  receiver: string;
  nominal: number;
  paymentMethod: 'Simulasi Smart Contract Escrow (DEMO)' | 'Simulasi Transfer Bank Virtual (DEMO)';
  status: 'Berhasil (DEMO)' | 'Diproses (DEMO)' | 'Gagal (DEMO)';
  txHash: string;
  isDemo: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category:
    | 'Kontrak baru'
    | 'Persetujuan kontrak'
    | 'Laporan progres baru'
    | 'Permintaan verifikasi'
    | 'Progres disetujui'
    | 'Progres ditolak'
    | 'Pembayaran siap diproses'
    | 'Pembayaran berhasil'
    | 'Pembayaran gagal';
  createdAt: string;
  read: boolean;
  targetRoles: UserRole[];
  relatedProjectId?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  module: string;
  details: string;
  ipSimulation: string;
}

export interface SystemSettings {
  id: string;
  platformName: string;
  simulationModeBanner: boolean;
  bimAdapterEndpoint: string;
  blockchainRpcAdapter: string;
  escrowAutoTrigger: boolean;
  strictRbacEnforcement: boolean;
  maxUploadSizeMb: number;
  auditRetentionDays: number;
}

export interface SmartBuildDatabase {
  users: User[];
  organizations: Organization[];
  projects: Project[];
  project_members: ProjectMember[];
  contracts: Contract[];
  contract_parties: ContractParty[];
  contract_milestones: ContractMilestone[];
  progress_reports: ProgressReport[];
  progress_attachments: ProgressAttachment[];
  verifications: VerificationRecord[];
  bim_models: BimModel[];
  smart_contracts: SmartContractConfig[];
  payment_schedules: PaymentSchedule[];
  payments: PaymentRecord[];
  transactions: TransactionRecord[];
  notifications: AppNotification[];
  activity_logs: ActivityLog[];
  system_settings: SystemSettings;
}
