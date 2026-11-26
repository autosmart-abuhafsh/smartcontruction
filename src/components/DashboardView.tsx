import React from 'react';
import { motion } from 'motion/react';
import {
  FolderKanban,
  FileSignature,
  Wallet,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  AlertCircle,
  Bell,
  Activity,
  Database,
  Landmark,
  Users,
} from 'lucide-react';
import { MenuId, SmartBuildDatabase, User } from '../types/smartbuild';
import {
  computeDashboardStats,
  formatDateID,
  formatRupiah,
  getRoleLabel,
} from '../utils/calculations';

interface DashboardViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onNavigate: (menu: MenuId, projectId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  currentUser,
  onNavigate,
}) => {
  const activeContractsCount = db.contracts.filter(
    (c) => c.status === 'Aktif' || c.status === 'Disetujui'
  ).length;
  const pendingVerificationsCount = db.verifications.filter(
    (v) => v.status === 'Menunggu pemeriksaan' || v.status === 'Dalam pemeriksaan'
  ).length;

  const stats = computeDashboardStats(
    db.projects,
    activeContractsCount,
    db.payment_schedules,
    pendingVerificationsCount
  );

  const upcomingPayments = db.payment_schedules.filter(
    (p) => p.status !== 'Berhasil' && p.status !== 'Dibatalkan'
  );

  const primaryProject = db.projects[0];
  const primaryMilestones = db.contract_milestones.filter(
    (m) => m.projectId === (primaryProject?.id || 'prj-001')
  );

  const statCards = [
    {
      label: 'Total Proyek',
      value: `${stats.totalProjects} Proyek`,
      sub: 'Terdaftar pada sistem (DEMO)',
      icon: FolderKanban,
      accent: 'text-[#071D49] dark:text-slate-100',
    },
    {
      label: 'Total Proyek Aktif',
      value: `${stats.activeProjects} Proyek`,
      sub: 'Dalam pengerjaan & aktif',
      icon: TrendingUp,
      accent: 'text-[#1264F4] dark:text-blue-400',
    },
    {
      label: 'Total Kontrak Aktif',
      value: `${stats.activeContracts} Kontrak`,
      sub: 'Telah disepakati kedua pihak',
      icon: FileSignature,
      accent: 'text-[#1264F4] dark:text-blue-400',
    },
    {
      label: 'Total Nilai Kontrak',
      value: formatRupiah(stats.totalContractValue),
      sub: 'Akumulasi nilai proyek aktif',
      icon: Wallet,
      accent: 'text-[#071D49] dark:text-slate-100',
    },
    {
      label: 'Total Pembayaran',
      value: formatRupiah(stats.totalPaidAmount),
      sub: 'Termin cair terverifikasi (DEMO)',
      icon: CheckCircle2,
      accent: 'text-[#10B981] dark:text-emerald-400',
    },
    {
      label: 'Total Pembayaran Tertunda',
      value: formatRupiah(stats.totalPendingPaymentAmount),
      sub: 'Menunggu verifikasi / pencairan',
      icon: Clock,
      accent: 'text-[#F59E0B] dark:text-amber-400',
    },
    {
      label: 'Rata-rata Progres Proyek',
      value: `${stats.averageProgress}%`,
      sub: 'Realisasi konstruksi aktif',
      icon: TrendingUp,
      accent: 'text-[#1264F4] dark:text-blue-400',
    },
    {
      label: 'Menunggu Verifikasi',
      value: `${stats.pendingVerificationsCount} Pekerjaan`,
      sub: 'Membutuhkan pemeriksaan pengawas',
      icon: AlertCircle,
      accent:
        stats.pendingVerificationsCount > 0
          ? 'text-[#F59E0B] dark:text-amber-400'
          : 'text-[#10B981] dark:text-emerald-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Context Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Peran Aktif: {getRoleLabel(currentUser.role)}</span>
            <span aria-hidden="true"> · </span>
            <span>{currentUser.organizationName}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-semibold text-[#1264F4] dark:text-blue-400">
              Lingkungan Simulasi DEMO
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white mt-1">
            Ringkasan Eksekutif Konstruksi &amp; Smart Contract
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Pemantauan real-time kontrak digital, verifikasi tahapan pekerjaan berbasis BIM, dan
            jadwal pembayaran termin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="px-3.5 py-2 text-xs font-semibold border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-[#1264F4] dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen Akun</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Database className="w-3.5 h-3.5 text-[#1264F4]" />
            <span>DB Apps Script &amp; Vercel</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="px-4 py-2 text-xs font-semibold bg-[#071D49] dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            Kelola Proyek
          </button>
          <button
            type="button"
            onClick={() => onNavigate('verification')}
            className="px-4 py-2 text-xs font-semibold bg-[#1264F4] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Periksa Verifikasi ({stats.pendingVerificationsCount})
          </button>
        </div>
      </div>

      {/* Ringkasan Brief Proyek Utama & Rekening Pencairan Otomatis */}
      <div className="bg-gradient-to-r from-[#071D49] to-[#0F2D6B] text-white rounded-xl p-4 sm:p-5 border border-blue-500/30 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-white/10 border border-white/10">
            <div className="text-blue-200 text-[11px] font-medium">1. Nama Pekerjaan Utama</div>
            <div className="font-bold text-sm text-white mt-0.5">
              {primaryProject?.name || 'Pembangunan Rumah di Gang Mahanggi Tenggarong'}
            </div>
            <div className="text-[11px] text-blue-200 mt-0.5">
              {primaryProject?.location || 'Gang Mahanggi, Tenggarong'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/10 border border-white/10">
            <div className="text-blue-200 text-[11px] font-medium">
              2. Pengguna Jasa (Pemilik Proyek)
            </div>
            <div className="font-bold text-sm text-white mt-0.5">
              {primaryProject?.clientName || 'Citra Ayu Deswina Maharani'}
            </div>
            <div className="text-[11px] text-blue-200 mt-0.5">Owner / Pemberi Tugas</div>
          </div>

          <div className="p-3 rounded-lg bg-white/10 border border-white/10">
            <div className="text-blue-200 text-[11px] font-medium">
              3. Penyedia Jasa (Kontraktor)
            </div>
            <div className="font-bold text-sm text-white mt-0.5">
              {primaryProject?.contractorName || 'Muhajirin Kasim'}
            </div>
            <div className="text-[11px] text-blue-200 mt-0.5">Kontraktor Pelaksana</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/40">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold">
              <Landmark className="w-3.5 h-3.5" />
              <span>Rekening Otomatis Dibayarkan</span>
            </div>
            <div className="font-bold text-sm text-white mt-0.5">MUHAJIRIN KASIM</div>
            <div className="font-mono text-xs text-emerald-200 font-semibold mt-0.5">
              Bank Mandiri · 1480025086508
            </div>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid with Staggered Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{card.label}</span>
                <IconComponent className={`w-4 h-4 ${card.accent}`} />
              </div>
              <div className={`text-xl font-bold tabular-nums mt-2 ${card.accent}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{card.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row: Grafik Perkembangan Proyek & Grafik Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Perkembangan Proyek */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                Grafik Perkembangan Proyek &amp; Tahapan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbandingan target vs realisasi tahapan pada proyek utama:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {primaryProject?.name || 'Pembangunan Rumah di Gang Mahanggi Tenggarong'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Detail Progres</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {primaryMilestones.map((ms) => (
              <div key={ms.id} className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      Tahap {ms.order}: {ms.name}
                    </span>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      Bobot {ms.weightPercentage}% ({formatRupiah(ms.nominalValue)})
                    </span>
                  </div>
                  <div className="sm:text-right tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                    Realisasi {ms.realizedProgress}% / Target {ms.targetProgress}% · {ms.status}
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ms.realizedProgress)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      ms.realizedProgress >= 100
                        ? 'bg-[#10B981]'
                        : ms.realizedProgress > 0
                        ? 'bg-[#1264F4]'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Progres Tertimbang</div>
              <div className="text-base font-bold text-[#071D49] dark:text-white tabular-nums mt-0.5">
                {primaryProject?.overallProgress ?? 60}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Tahapan Selesai</div>
              <div className="text-base font-bold text-[#10B981] dark:text-emerald-400 tabular-nums mt-0.5">
                {primaryMilestones.filter((m) => m.status === 'Selesai').length} /{' '}
                {primaryMilestones.length} Tahap
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Nilai Kontrak Proyek</div>
              <div className="text-base font-bold text-[#1264F4] dark:text-blue-400 tabular-nums mt-0.5">
                {formatRupiah(primaryProject?.contractValue ?? 100000000)}
              </div>
            </div>
          </div>
        </div>

        {/* Grafik Pembayaran Termin */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                  Grafik Distribusi Pembayaran (DEMO)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Realisasi pencairan termin berdasarkan verifikasi
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                Modul Pembayaran
              </button>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1.5 tabular-nums">
                <span>Tercairkan: {formatRupiah(stats.totalPaidAmount)}</span>
                <span>Tertunda: {formatRupiah(stats.totalPendingPaymentAmount)}</span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                <div
                  className="bg-[#10B981] h-full"
                  style={{
                    width: `${
                      stats.totalContractValue > 0
                        ? Math.round((stats.totalPaidAmount / stats.totalContractValue) * 100)
                        : 0
                    }%`,
                  }}
                  title="Pembayaran Berhasil"
                />
                <div
                  className="bg-[#F59E0B] h-full"
                  style={{
                    width: `${
                      stats.totalContractValue > 0
                        ? Math.round(
                            (stats.totalPendingPaymentAmount / stats.totalContractValue) * 100
                          )
                        : 0
                    }%`,
                  }}
                  title="Menunggu Verifikasi / Siap Dibayarkan"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <span>Hijau: Termin Berhasil (DEMO)</span>
                <span>Oranye: Menunggu Verifikasi</span>
                <span>Abu: Belum Memenuhi Syarat</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {db.payment_schedules
                .filter((s) => s.projectId === 'prj-001')
                .map((sch) => (
                  <div
                    key={sch.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {sch.milestoneName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Bobot {sch.percentage}% · Status: {sch.status}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatRupiah(sch.nominal)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Split: Daftar Proyek Terbaru & Daftar Pembayaran Akan Datang */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#071D49] dark:text-white">
              Daftar Proyek Terbaru
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline"
            >
              Lihat Semua Proyek
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-3 font-semibold">Nama Proyek</th>
                  <th className="py-2.5 px-3 font-semibold">Pihak Terkait</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Nilai Kontrak</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Progres</th>
                  <th className="py-2.5 pl-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {db.projects.map((prj) => (
                  <tr key={prj.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{prj.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {prj.code} · {prj.isDemo ? 'DEMO' : 'LIVE'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div>Owner: {prj.clientName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Kontraktor: {prj.contractorName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                      {formatRupiah(prj.contractValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
                      {prj.overallProgress}%
                    </td>
                    <td className="py-3 pl-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {prj.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daftar Pembayaran yang Akan Datang */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#071D49] dark:text-white">
              Daftar Pembayaran yang Akan Datang
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline"
            >
              Kelola Termin
            </button>
          </div>
          <div className="space-y-3">
            {upcomingPayments.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {item.milestoneName} ({item.percentage}%)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.projectName} · Status: {item.status}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono tabular-nums text-[#071D49] dark:text-blue-300">
                    {formatRupiah(item.nominal)}
                  </div>
                  <div className="text-[10px] text-slate-400">Simulasi DEMO</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Notifikasi Pekerjaan & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1264F4]" />
              <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                Notifikasi Pekerjaan
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {db.notifications.length} pemberitahuan
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {db.notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {n.createdAt}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Kategori: {n.category} · Status: {n.read ? 'Dibaca' : 'Baru'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#071D49] dark:text-blue-400" />
              <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                Aktivitas Sistem &amp; Audit Log Terbaru
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Tertelusur</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {db.activity_logs.slice(0, 4).map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {log.actorName} ({getRoleLabel(log.actorRole)})
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                    {formatDateID(log.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{log.details}</p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Modul: {log.module} · Aksi: {log.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
