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
  Landmark,
  Users,
  BarChart3,
  PieChart,
  HelpCircle,
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
  const primarySchedules = db.payment_schedules.filter(
    (s) => s.projectId === (primaryProject?.id || 'prj-001')
  );

  const primaryPaidNominal = primarySchedules
    .filter((s) => s.status === 'Berhasil')
    .reduce((acc, s) => acc + s.nominal, 0);
  const primaryPendingNominal = primarySchedules
    .filter((s) => s.status === 'Menunggu verifikasi' || s.status === 'Siap dibayarkan')
    .reduce((acc, s) => acc + s.nominal, 0);
  const primaryRemainingNominal = Math.max(
    0,
    (primaryProject?.contractValue || 100000000) - primaryPaidNominal - primaryPendingNominal
  );

  const primaryTotalContract = primaryProject?.contractValue || 100000000;
  const paidPct = Math.round((primaryPaidNominal / primaryTotalContract) * 100);
  const pendingPct = Math.round((primaryPendingNominal / primaryTotalContract) * 100);
  const remainingPct = Math.max(0, 100 - paidPct - pendingPct);

  // SVG Donut chart calculations (r = 54, circumference = 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const paidStroke = (paidPct / 100) * circumference;
  const pendingStroke = (pendingPct / 100) * circumference;

  const stage3Milestone = primaryMilestones.find((m) => m.order === 3);

  const statCards = [
    {
      label: 'Total Proyek',
      value: `${stats.totalProjects} Proyek`,
      sub: 'Terdaftar pada sistem perusahaan',
      icon: FolderKanban,
      accent: 'text-[#071D49] dark:text-slate-100',
    },
    {
      label: 'Proyek Aktif',
      value: `${stats.activeProjects} Proyek`,
      sub: 'Sedang berjalan di lapangan',
      icon: TrendingUp,
      accent: 'text-[#1264F4] dark:text-blue-400',
    },
    {
      label: 'Kontrak Digital Aktif',
      value: `${stats.activeContracts} Kontrak`,
      sub: 'Disetujui Pemilik & Kontraktor',
      icon: FileSignature,
      accent: 'text-[#1264F4] dark:text-blue-400',
    },
    {
      label: 'Nilai Kontrak Utama',
      value: formatRupiah(primaryTotalContract),
      sub: 'Rumah Gang Mahanggi Tenggarong',
      icon: Wallet,
      accent: 'text-[#071D49] dark:text-slate-100',
    },
    {
      label: 'Dana Sudah Cair (Proyek Utama)',
      value: formatRupiah(primaryPaidNominal),
      sub: `${paidPct}% dari kontrak utama telah dibayarkan`,
      icon: CheckCircle2,
      accent: 'text-[#10B981] dark:text-emerald-400',
    },
    {
      label: 'Dana Menunggu Verifikasi',
      value: formatRupiah(primaryPendingNominal),
      sub: 'Siap cair otomatis setelah disetujui',
      icon: Clock,
      accent: 'text-[#F59E0B] dark:text-amber-400',
    },
    {
      label: 'Progres Konstruksi Utama',
      value: `${primaryProject?.overallProgress ?? 60}%`,
      sub: 'Akumulasi bobot tahapan selesai',
      icon: TrendingUp,
      accent: 'text-[#1264F4] dark:text-blue-400',
    },
    {
      label: 'Antrean Verifikasi',
      value: `${stats.pendingVerificationsCount} Tahapan`,
      sub: 'Menunggu persetujuan pengawas',
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-[#071D49] dark:text-slate-200">
              Peran Aktif: {getRoleLabel(currentUser.role)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentUser.organizationName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#1264F4] dark:text-blue-400">
              Dashboard Eksekutif Perusahaan
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white mt-1">
            Ringkasan Eksekutif Konstruksi &amp; Pencairan Smart Contract
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Laporan visual perkembangan pembangunan, bukti digital lapangan (Digital Evidence), dan
            pencairan dana otomatis per tahapan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="px-3.5 py-2 text-xs font-semibold border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-[#1264F4] dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen Akun &amp; ID</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('progress')}
            className="px-3.5 py-2 text-xs font-semibold bg-[#071D49] dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            Simulasi &amp; Upload Bukti
          </button>
          <button
            type="button"
            onClick={() => onNavigate('verification')}
            className="px-4 py-2 text-xs font-semibold bg-[#1264F4] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Verifikasi Pekerjaan ({stats.pendingVerificationsCount})
          </button>
        </div>
      </div>

      {/* Ringkasan Brief Proyek Utama & Rekening Pencairan Otomatis */}
      <div className="bg-gradient-to-r from-[#071D49] to-[#0F2D6B] text-white rounded-xl p-4 sm:p-5 border border-blue-500/30 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="p-3.5 rounded-lg bg-white/10 border border-white/10">
            <div className="text-blue-200 text-[11px] font-medium">1. Nama Pekerjaan Utama</div>
            <div className="font-bold text-sm text-white mt-0.5 leading-snug">
              {primaryProject?.name || 'Pembangunan Rumah di Gang Mahanggi Tenggarong'}
            </div>
            <div className="text-[11px] text-blue-200 mt-1">
              Lokasi: {primaryProject?.location || 'Gang Mahanggi, Tenggarong'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-white/10 border border-white/10">
            <div className="text-blue-200 text-[11px] font-medium">
              2. Pengguna Jasa (Pemilik Proyek)
            </div>
            <div className="font-bold text-sm text-white mt-0.5">
              {primaryProject?.clientName || 'Citra Ayu Deswina Maharani'}
            </div>
            <div className="text-[11px] text-blue-200 mt-1">Owner / Pemberi Tugas</div>
          </div>

          <div className="p-3.5 rounded-lg bg-white/10 border border-white/10">
            <div className="text-blue-200 text-[11px] font-medium">
              3. Penyedia Jasa (Kontraktor)
            </div>
            <div className="font-bold text-sm text-white mt-0.5">
              {primaryProject?.contractorName || 'Muhajirin Kasim'}
            </div>
            <div className="text-[11px] text-blue-200 mt-1">Kontraktor Pelaksana</div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold">
              <Landmark className="w-3.5 h-3.5" />
              <span>Rekening Otomatis Dibayarkan</span>
            </div>
            <div className="font-bold text-sm text-white mt-0.5">MUHAJIRIN KASIM</div>
            <div className="font-mono text-xs text-emerald-200 font-semibold mt-1">
              Bank Mandiri · 1480025086508
            </div>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-2xs"
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

      {/* Corporate Charts Row: Grafik Tahapan Konstruksi & Grafik Eksekutif Pencairan Dana */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Corporate Grouped Column Chart & Stage Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1264F4] dark:text-blue-400 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                    Grafik Realisasi vs Target Tahapan Konstruksi
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proyek:{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {primaryProject?.name || 'Pembangunan Rumah di Gang Mahanggi Tenggarong'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('progress')}
                className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                <span>Buka Simulasi Tahap 3</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-4 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-xs bg-slate-300 dark:bg-slate-600 inline-block" />
                  Target Kontrak (100%)
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-xs bg-[#10B981] inline-block" />
                  Selesai &amp; Cair (100%)
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-xs bg-[#1264F4] inline-block" />
                  Sedang Dikerjakan
                </span>
              </div>
              <span className="font-bold text-[#071D49] dark:text-blue-300 tabular-nums">
                Total Progres Proyek: {primaryProject?.overallProgress ?? 60}%
              </span>
            </div>

            {/* Visual Vertical Column Chart for the 4 Construction Stages */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-4 pb-3 px-2 sm:px-4 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
              {primaryMilestones.map((ms) => {
                const isDone = ms.realizedProgress >= 100;
                const isWorking = ms.realizedProgress > 0 && ms.realizedProgress < 100;
                const contribution = Math.round((ms.weightPercentage * ms.realizedProgress) / 100);
                return (
                  <div key={ms.id} className="flex flex-col items-center">
                    {/* Percentage Pill on top of bar */}
                    <div
                      className={`text-[11px] font-bold font-mono tabular-nums px-2 py-0.5 rounded-md mb-2 ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : isWorking
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ms.realizedProgress}%
                    </div>

                    {/* Vertical Bar Container representing 100% Target */}
                    <div className="w-full max-w-[68px] h-36 bg-slate-200/80 dark:bg-slate-800 rounded-t-lg relative overflow-hidden flex items-end border-b-2 border-slate-400 dark:border-slate-600">
                      {/* Target Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                        <div className="border-b border-dashed border-slate-500 w-full h-1/4" />
                        <div className="border-b border-dashed border-slate-500 w-full h-1/4" />
                        <div className="border-b border-dashed border-slate-500 w-full h-1/4" />
                      </div>

                      {/* Realized Fill Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(4, Math.min(100, ms.realizedProgress))}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className={`w-full rounded-t-md relative z-10 ${
                          isDone
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            : isWorking
                            ? 'bg-gradient-to-t from-[#1264F4] to-cyan-400'
                            : 'bg-slate-400 dark:bg-slate-700'
                        }`}
                      />
                    </div>

                    {/* Stage Label below column */}
                    <div className="text-center mt-2.5">
                      <div className="text-xs font-bold text-[#071D49] dark:text-white">
                        Tahap {ms.order}
                      </div>
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1">
                        {ms.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Bobot {ms.weightPercentage}% (+{contribution}%)
                      </div>
                      <div className="text-[10px] font-semibold text-[#1264F4] dark:text-blue-400 font-mono">
                        {formatRupiah(ms.nominalValue)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plain-Indonesian Explanation Box for Stage 3 */}
            {stage3Milestone && (
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-xs">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#1264F4] dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-[#071D49] dark:text-white">
                      Cara Membaca Grafik Tahap 3 ({stage3Milestone.name} — Bobot{' '}
                      {stage3Milestone.weightPercentage}% /{' '}
                      {formatRupiah(stage3Milestone.nominalValue)}):
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {stage3Milestone.realizedProgress < 100 ? (
                        <>
                          Saat ini pekerjaan fisik <strong>Tahap 3 (Dinding &amp; Atap)</strong> baru
                          tercatat selesai <strong>{stage3Milestone.realizedProgress}%</strong> dari
                          target <strong>100%</strong> (menyumbang{' '}
                          <strong>
                            +
                            {Math.round(
                              (stage3Milestone.weightPercentage *
                                stage3Milestone.realizedProgress) /
                                100
                            )}
                            %
                          </strong>{' '}
                          ke total progres proyek). Agar grafik Tahap 3 naik menjadi{' '}
                          <strong>100%</strong> dan dana{' '}
                          <strong>{formatRupiah(stage3Milestone.nominalValue)}</strong> cair otomatis
                          ke <strong>Bank Mandiri 1480025086508 (MUHAJIRIN KASIM)</strong>, silakan
                          buka menu <strong>Progress Proyek</strong> untuk upload bukti atau jalankan
                          simulasi 1-klik.
                        </>
                      ) : (
                        <>
                          <strong>Tahap 3 (Dinding &amp; Atap) telah selesai 100%!</strong> Dana
                          termin sebesar <strong>{formatRupiah(stage3Milestone.nominalValue)}</strong>{' '}
                          telah dicairkan otomatis ke rekening{' '}
                          <strong>Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM</strong>, dan total
                          progres proyek naik menjadi{' '}
                          <strong>{primaryProject?.overallProgress}%</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Total Progres Proyek</div>
              <div className="text-base font-bold text-[#071D49] dark:text-white tabular-nums mt-0.5">
                {primaryProject?.overallProgress ?? 60}% dari 100%
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Tahapan Tuntas 100%</div>
              <div className="text-base font-bold text-[#10B981] dark:text-emerald-400 tabular-nums mt-0.5">
                {primaryMilestones.filter((m) => m.realizedProgress >= 100).length} dari{' '}
                {primaryMilestones.length} Tahap
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Nilai Kontrak Utama</div>
              <div className="text-base font-bold text-[#1264F4] dark:text-blue-400 tabular-nums mt-0.5">
                {formatRupiah(primaryTotalContract)}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Corporate Financial Donut Chart & Termin Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                    Grafik Pencairan Dana Kontrak
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Distribusi dana kontrak {formatRupiah(primaryTotalContract)} per termin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
              >
                Rincian Termin
              </button>
            </div>

            {/* Corporate SVG Donut Chart + Financial Summary */}
            <div className="flex flex-col sm:flex-row items-center gap-5 my-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  {/* Background Ring (Remaining / Unstarted) */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="14"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  {/* Pending Segment (Amber) */}
                  {pendingPct > 0 && (
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="14"
                      strokeDasharray={`${pendingStroke} ${circumference}`}
                      strokeDashoffset={-paidStroke}
                    />
                  )}
                  {/* Paid Segment (Emerald Green) */}
                  {paidPct > 0 && (
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="14"
                      strokeDasharray={`${paidStroke} ${circumference}`}
                      strokeDashoffset={0}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-[#071D49] dark:text-white tabular-nums">
                    {paidPct}%
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Dana Cair
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Sudah Cair ({paidPct}%)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatRupiah(primaryPaidNominal)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Proses Verifikasi ({pendingPct}%)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatRupiah(primaryPendingNominal)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Tahap Berikutnya ({remainingPct}%)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {formatRupiah(primaryRemainingNominal)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Termin Payment Cards */}
            <div className="space-y-2 mt-3">
              {primarySchedules.map((sch) => {
                const isPaid = sch.status === 'Berhasil';
                const isWaiting =
                  sch.status === 'Menunggu verifikasi' || sch.status === 'Siap dibayarkan';
                return (
                  <div
                    key={sch.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {sch.milestoneName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>Bobot {sch.percentage}%</span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            isPaid
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isWaiting
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isPaid
                            ? 'Sudah Ditransfer ke Mandiri 1480025086508'
                            : isWaiting
                            ? 'Menunggu Verifikasi Selesai 100%'
                            : 'Belum Jatuh Tempo'}
                        </span>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatRupiah(sch.nominal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Split: Daftar Proyek & Daftar Pembayaran Akan Datang */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#071D49] dark:text-white">
              Daftar Proyek Konstruksi
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-[#1264F4] dark:text-blue-400 hover:underline"
            >
              Kelola Semua Proyek
            </button>
          </div>

          {/* Mobile Friendly Cards for Smartphones */}
          <div className="md:hidden space-y-3">
            {db.projects.map((prj) => (
              <div
                key={prj.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{prj.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {prj.code} · {prj.location}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#1264F4] dark:text-blue-300 font-bold font-mono">
                    {prj.overallProgress}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Pemilik Proyek:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {prj.clientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kontraktor:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {prj.contractorName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-mono font-bold text-[#071D49] dark:text-blue-300">
                    {formatRupiah(prj.contractValue)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {prj.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                        {prj.code} · {prj.location}
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
              Jadwal Termin Berikutnya
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
                  <div className="text-[10px] text-slate-400">Escrow Otomatis</div>
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
