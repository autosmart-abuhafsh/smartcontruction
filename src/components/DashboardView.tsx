import React from 'react';
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
} from 'lucide-react';
import {
  MenuId,
  SmartBuildDatabase,
  User,
} from '../types/smartbuild';
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
      accent: 'text-[#071D49]',
    },
    {
      label: 'Total Proyek Aktif',
      value: `${stats.activeProjects} Proyek`,
      sub: 'Dalam pengerjaan & aktif',
      icon: TrendingUp,
      accent: 'text-[#1264F4]',
    },
    {
      label: 'Total Kontrak Aktif',
      value: `${stats.activeContracts} Kontrak`,
      sub: 'Telah disepakati kedua pihak',
      icon: FileSignature,
      accent: 'text-[#1264F4]',
    },
    {
      label: 'Total Nilai Kontrak',
      value: formatRupiah(stats.totalContractValue),
      sub: 'Akumulasi nilai proyek aktif',
      icon: Wallet,
      accent: 'text-[#071D49]',
    },
    {
      label: 'Total Pembayaran',
      value: formatRupiah(stats.totalPaidAmount),
      sub: 'Termin cair terverifikasi (DEMO)',
      icon: CheckCircle2,
      accent: 'text-[#10B981]',
    },
    {
      label: 'Total Pembayaran Tertunda',
      value: formatRupiah(stats.totalPendingPaymentAmount),
      sub: 'Menunggu verifikasi / pencairan',
      icon: Clock,
      accent: 'text-[#F59E0B]',
    },
    {
      label: 'Rata-rata Progres Proyek',
      value: `${stats.averageProgress}%`,
      sub: 'Realisasi konstruksi keseluruhan',
      icon: TrendingUp,
      accent: 'text-[#1264F4]',
    },
    {
      label: 'Menunggu Verifikasi',
      value: `${stats.pendingVerificationsCount} Pekerjaan`,
      sub: 'Membutuhkan pemeriksaan pengawas',
      icon: AlertCircle,
      accent: stats.pendingVerificationsCount > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Context Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">
            <span>Peran Aktif: {getRoleLabel(currentUser.role)}</span>
            <span aria-hidden="true"> · </span>
            <span>{currentUser.organizationName}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-semibold text-[#1264F4]">Lingkungan Simulasi DEMO</span>
          </div>
          <h1 className="text-xl font-bold text-[#071D49] mt-1">
            Ringkasan Eksekutif Konstruksi &amp; Smart Contract
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Pemantauan real-time kontrak digital, verifikasi tahapan pekerjaan berbasis BIM, dan
            jadwal pembayaran termin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="px-4 py-2 text-xs font-semibold bg-[#071D49] text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
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

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{card.label}</span>
                <IconComponent className={`w-4 h-4 ${card.accent}`} />
              </div>
              <div className={`text-xl font-bold tabular-nums mt-2 ${card.accent}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row: Grafik Perkembangan Proyek & Grafik Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Perkembangan Proyek */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#071D49]">
                Grafik Perkembangan Proyek &amp; Tahapan
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan target vs realisasi tahapan pada proyek utama:{' '}
                <span className="font-semibold text-slate-700">
                  {primaryProject?.name || 'Pembangunan Gedung Aula'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-[#1264F4] hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>Detail Progres</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {primaryMilestones.map((ms) => (
              <div key={ms.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Tahap {ms.order}: {ms.name}
                    </span>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-500 tabular-nums">
                      Bobot {ms.weightPercentage}% ({formatRupiah(ms.nominalValue)})
                    </span>
                  </div>
                  <div className="text-right tabular-nums font-semibold text-slate-800">
                    Realisasi {ms.realizedProgress}% / Target {ms.targetProgress}% · {ms.status}
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ms.realizedProgress >= 100
                        ? 'bg-[#10B981]'
                        : ms.realizedProgress > 0
                        ? 'bg-[#1264F4]'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${Math.min(100, ms.realizedProgress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-slate-500">Progres Tertimbang</div>
              <div className="text-base font-bold text-[#071D49] tabular-nums mt-0.5">
                {primaryProject?.overallProgress ?? 60}%
              </div>
            </div>
            <div>
              <div className="text-slate-500">Tahapan Selesai</div>
              <div className="text-base font-bold text-[#10B981] tabular-nums mt-0.5">
                {primaryMilestones.filter((m) => m.status === 'Selesai').length} /{' '}
                {primaryMilestones.length} Tahap
              </div>
            </div>
            <div>
              <div className="text-slate-500">Nilai Kontrak Proyek</div>
              <div className="text-base font-bold text-[#1264F4] tabular-nums mt-0.5">
                {formatRupiah(primaryProject?.contractValue ?? 100000000)}
              </div>
            </div>
          </div>
        </div>

        {/* Grafik Pembayaran Termin */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#071D49]">
                  Grafik Distribusi Pembayaran (DEMO)
                </h2>
                <p className="text-xs text-slate-500">
                  Realisasi pencairan termin berdasarkan verifikasi
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-[#1264F4] hover:underline whitespace-nowrap"
              >
                Modul Pembayaran
              </button>
            </div>

            {/* Visual stacked progress bar of payments */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 tabular-nums">
                <span>Tercairkan: {formatRupiah(stats.totalPaidAmount)}</span>
                <span>Tertunda: {formatRupiah(stats.totalPendingPaymentAmount)}</span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex">
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
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>Hijau: Termin Berhasil (DEMO)</span>
                <span>Oranye: Menunggu Verifikasi</span>
                <span>Abu: Belum Memenuhi Syarat</span>
              </div>
            </div>

            {/* Payment Bar Breakdown for Gedung Aula */}
            <div className="space-y-2.5">
              {db.payment_schedules
                .filter((s) => s.projectId === 'prj-001')
                .map((sch) => (
                  <div
                    key={sch.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{sch.milestoneName}</div>
                      <div className="text-[11px] text-slate-500">
                        Bobot {sch.percentage}% · Status: {sch.status}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 tabular-nums">
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
        {/* Daftar Proyek Terbaru */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#071D49]">Daftar Proyek Terbaru</h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-[#1264F4] hover:underline"
            >
              Lihat Semua Proyek
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Nama Proyek</th>
                  <th className="py-2.5 px-3 font-semibold">Pihak Terkait</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Nilai Kontrak</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Progres</th>
                  <th className="py-2.5 pl-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.projects.map((prj) => (
                  <tr key={prj.id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-slate-900">{prj.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {prj.code} · {prj.isDemo ? 'DEMO' : 'LIVE'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>Owner: {prj.clientName}</div>
                      <div className="text-[11px] text-slate-500">
                        Kontraktor: {prj.contractorName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {formatRupiah(prj.contractValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1264F4] tabular-nums">
                      {prj.overallProgress}%
                    </td>
                    <td className="py-3 pl-3 font-medium text-slate-700">{prj.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daftar Pembayaran yang Akan Datang */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#071D49]">
              Daftar Pembayaran yang Akan Datang
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-[#1264F4] hover:underline"
            >
              Kelola Termin
            </button>
          </div>
          <div className="space-y-3">
            {upcomingPayments.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {item.milestoneName} ({item.percentage}%)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.projectName} · Status: {item.status}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono tabular-nums text-[#071D49]">
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
        {/* Notifikasi Pekerjaan */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1264F4]" />
              <h2 className="text-base font-bold text-[#071D49]">Notifikasi Pekerjaan</h2>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {db.notifications.length} pemberitahuan
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {db.notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{n.title}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums">{n.createdAt}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Kategori: {n.category} · Status: {n.read ? 'Dibaca' : 'Baru'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terbaru (Audit Log) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#071D49]" />
              <h2 className="text-base font-bold text-[#071D49]">
                Aktivitas Sistem &amp; Audit Log Terbaru
              </h2>
            </div>
            <span className="text-xs text-slate-500">Tertelusur</span>
          </div>
          <div className="divide-y divide-slate-100">
            {db.activity_logs.slice(0, 4).map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    {log.actorName} ({getRoleLabel(log.actorRole)})
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {formatDateID(log.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Modul: {log.module} · Aksi: {log.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
