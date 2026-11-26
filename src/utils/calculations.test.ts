import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMilestoneNominal,
  calculateWeightedProjectProgress,
  canAccessMenu,
  canDeleteProject,
  canPerformAction,
  computeDashboardStats,
  evaluateSmartContractPaymentTrigger,
  formatRupiah,
  validateMilestonesTotalPercentage,
  verifyOwnerSettingsPassword,
} from './calculations';
import { ContractMilestone, PaymentSchedule, Project } from '../types/smartbuild';
import { isValidAppsScriptUrl } from '../services/appsScriptService';

test('verifyOwnerSettingsPassword validates website owner password 2026', () => {
  assert.equal(verifyOwnerSettingsPassword('2026'), true);
  assert.equal(verifyOwnerSettingsPassword(' 2026 '), true);
  assert.equal(verifyOwnerSettingsPassword('2025'), false);
  assert.equal(verifyOwnerSettingsPassword(''), false);
});

test('isValidAppsScriptUrl validates Google Apps Script Web App deployment URLs', () => {
  assert.equal(
    isValidAppsScriptUrl('https://script.google.com/macros/s/AKfycbz1234567890abcdef/exec'),
    true
  );
  assert.equal(isValidAppsScriptUrl('https://example.com/api'), false);
  assert.equal(isValidAppsScriptUrl(''), false);
});

test('formatRupiah formats Indonesian currency accurately', () => {
  assert.equal(formatRupiah(100000000), 'Rp100.000.000');
  assert.equal(formatRupiah(25000000), 'Rp25.000.000');
});

test('calculateMilestoneNominal computes exact payment termin from contract value', () => {
  assert.equal(calculateMilestoneNominal(100000000, 25), 25000000);
  assert.equal(calculateMilestoneNominal(100000000, 30), 30000000);
  assert.equal(calculateMilestoneNominal(100000000, 20), 20000000);
});

test('validateMilestonesTotalPercentage enforces 100% total weight', () => {
  const valid = validateMilestonesTotalPercentage([25, 30, 25, 20]);
  assert.equal(valid.valid, true);
  assert.equal(valid.total, 100);

  const invalid = validateMilestonesTotalPercentage([25, 30, 25, 10]);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.total, 90);
});

test('calculateWeightedProjectProgress calculates 60% for Gedung Aula PRD specification', () => {
  // Pondasi 25% (100% done = 25), Struktur 30% (100% done = 30), Dinding & Atap 25% (20% done = 5), Finishing 20% (0% done = 0) -> Total = 60%
  const milestones: ContractMilestone[] = [
    {
      id: 'm1',
      contractId: 'c1',
      projectId: 'p1',
      order: 1,
      name: 'Pondasi',
      description: 'Pekerjaan pondasi',
      weightPercentage: 25,
      targetProgress: 100,
      realizedProgress: 100,
      nominalValue: 25000000,
      dueDate: '2026-09-01',
      status: 'Selesai',
    },
    {
      id: 'm2',
      contractId: 'c1',
      projectId: 'p1',
      order: 2,
      name: 'Struktur',
      description: 'Pekerjaan struktur',
      weightPercentage: 30,
      targetProgress: 100,
      realizedProgress: 100,
      nominalValue: 30000000,
      dueDate: '2026-10-01',
      status: 'Selesai',
    },
    {
      id: 'm3',
      contractId: 'c1',
      projectId: 'p1',
      order: 3,
      name: 'Dinding dan Atap',
      description: 'Pekerjaan dinding dan atap',
      weightPercentage: 25,
      targetProgress: 100,
      realizedProgress: 20,
      nominalValue: 25000000,
      dueDate: '2026-11-15',
      status: 'Dalam Proses',
    },
    {
      id: 'm4',
      contractId: 'c1',
      projectId: 'p1',
      order: 4,
      name: 'Finishing',
      description: 'Penyelesaian akhir',
      weightPercentage: 20,
      targetProgress: 100,
      realizedProgress: 0,
      nominalValue: 20000000,
      dueDate: '2026-12-20',
      status: 'Belum Dimulai',
    },
  ];
  assert.equal(calculateWeightedProjectProgress(milestones), 60);
});

test('RBAC menu and action permissions restrict roles properly', () => {
  assert.equal(canAccessMenu('super_admin', 'users'), true);
  assert.equal(canAccessMenu('client', 'users'), false);
  assert.equal(canAccessMenu('verifikator', 'payments'), false);
  assert.equal(canAccessMenu('verifikator', 'verification'), true);

  assert.equal(canPerformAction('contractor', 'submit_progress'), true);
  assert.equal(canPerformAction('client', 'submit_progress'), false);
  assert.equal(canPerformAction('verifikator', 'verify_progress'), true);
  assert.equal(canPerformAction('contractor', 'verify_progress'), false);
});

test('evaluateSmartContractPaymentTrigger transitions payment state after verification approval', () => {
  assert.equal(
    evaluateSmartContractPaymentTrigger('Disetujui', 100, 'Menunggu verifikasi', true),
    'Siap dibayarkan'
  );
  assert.equal(
    evaluateSmartContractPaymentTrigger('Ditolak', 0, 'Menunggu verifikasi', true),
    'Belum memenuhi syarat'
  );
});

test('canDeleteProject blocks active projects and allows Draft/Dibatalkan projects', () => {
  const activeProject = { status: 'Dalam pengerjaan' } as Project;
  assert.equal(canDeleteProject(activeProject, true).allowed, false);

  const draftProject = { status: 'Draft' } as Project;
  assert.equal(canDeleteProject(draftProject, false).allowed, true);
});

test('computeDashboardStats aggregates financial and progress KPIs correctly', () => {
  const projects = [
    { status: 'Dalam pengerjaan', contractValue: 100000000, overallProgress: 60 },
    { status: 'Aktif', contractValue: 200000000, overallProgress: 20 },
  ] as Project[];
  const schedules = [
    { nominal: 25000000, status: 'Berhasil' },
    { nominal: 30000000, status: 'Berhasil' },
    { nominal: 25000000, status: 'Menunggu verifikasi' },
  ] as PaymentSchedule[];

  const stats = computeDashboardStats(projects, 2, schedules, 1);
  assert.equal(stats.totalProjects, 2);
  assert.equal(stats.activeProjects, 2);
  assert.equal(stats.totalContractValue, 300000000);
  assert.equal(stats.totalPaidAmount, 55000000);
  assert.equal(stats.totalPendingPaymentAmount, 25000000);
  assert.equal(stats.averageProgress, 40);
  assert.equal(stats.pendingVerificationsCount, 1);
});
