import React, { useState } from 'react';
import {
  Cpu,
  Wallet,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Search,
  Eye,
  Plus,
  Shield,
  HelpCircle,
  Settings,
  Users,
  X,
  Info,
  Code2,
} from 'lucide-react';
import {
  PaymentSchedule,
  SmartBuildDatabase,
  SmartContractConfig,
  SystemSettings,
  User,
  UserRole,
} from '../types/smartbuild';
import {
  canPerformAction,
  formatDateID,
  formatRupiah,
  getRoleLabel,
} from '../utils/calculations';

/* ============================================================================
 * MODUL G & H: SMART CONTRACT & MANAJEMEN PEMBAYARAN
 * ========================================================================== */

interface PaymentsAndSmartContractViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onExecuteSimulatedPayment: (scheduleId: string) => void;
  onUpdateSmartContractConfig: (config: SmartContractConfig) => void;
}

export const PaymentsAndSmartContractView: React.FC<PaymentsAndSmartContractViewProps> = ({
  db,
  currentUser,
  onExecuteSimulatedPayment,
  onUpdateSmartContractConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'smart_contract'>('payments');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<PaymentSchedule | null>(null);
  const [confirmExecutePayment, setConfirmExecutePayment] = useState<PaymentSchedule | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canPay = canPerformAction(currentUser.role, 'execute_payment');

  const filteredSchedules = db.payment_schedules.filter(
    (s) => selectedProjectId === 'ALL' || s.projectId === selectedProjectId
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#071D49]">
            Manajemen Pembayaran Termin &amp; Smart Contract
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Otomatisasi perhitungan termin berdasarkan persentase tahapan kontrak dan status
            verifikasi pekerjaan (Mode Simulasi Fungsional MVP - DEMO).
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-white text-[#071D49] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Jadwal &amp; Eksekusi Pembayaran</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('smart_contract')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'smart_contract'
                ? 'bg-white text-[#071D49] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Konfigurasi Smart Contract</span>
          </button>
        </div>
      </div>

      {/* Important Simulation Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Pemberitahuan Simulasi Pembayaran &amp; Smart Contract (DEMO):</span>{' '}
          Seluruh transaksi pada tahap MVP ini merupakan simulasi logika fungsional tanpa
          menggunakan uang sungguhan dan belum dikirim ke mainnet Blockchain publik. Service
          interface Solidity telah disiapkan terpisah untuk integrasi testnet/production pada Tahap 2.
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold text-emerald-700"
            aria-label="Tutup pesan pembayaran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'payments' ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              Daftar Termin Pembayaran Berdasarkan Persentase Kontrak
            </div>
            <select
              aria-label="Filter proyek pembayaran"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">Semua Proyek ({db.payment_schedules.length} Termin)</option>
              {db.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatRupiah(p.contractValue)})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-3 px-4 font-semibold">Termin &amp; Proyek</th>
                    <th className="py-3 px-4 font-semibold">Tahapan Pekerjaan</th>
                    <th className="py-3 px-4 font-semibold text-right">Persentase</th>
                    <th className="py-3 px-4 font-semibold text-right">Nilai Termin</th>
                    <th className="py-3 px-4 font-semibold">Status Pembayaran</th>
                    <th className="py-3 px-4 font-semibold">Bukti / Tx Hash (Simulasi)</th>
                    <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-slate-500">
                          Termin #{sch.termNumber} · {sch.isDemo ? 'DEMO' : 'LIVE'}
                        </div>
                        <div className="font-bold text-[#071D49] mt-0.5">{sch.projectName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {sch.milestoneName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1264F4] tabular-nums">
                        {sch.percentage}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(sch.nominal)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            sch.status === 'Berhasil'
                              ? 'text-[#10B981]'
                              : sch.status === 'Siap dibayarkan'
                              ? 'text-[#1264F4]'
                              : sch.status === 'Menunggu verifikasi'
                              ? 'text-[#F59E0B]'
                              : 'text-slate-500'
                          }`}
                        >
                          {sch.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {sch.txHash ? (
                          <div>
                            <div className="truncate max-w-[160px]">{sch.txHash}</div>
                            <div className="text-[10px] text-slate-400">
                              Ref: {sch.proofRef} · {formatDateID(sch.paidAt || '')}
                            </div>
                          </div>
                        ) : (
                          <span>Belum dieksekusi</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentDetail(sch)}
                            className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          {sch.status === 'Siap dibayarkan' && canPay && (
                            <button
                              type="button"
                              onClick={() => setConfirmExecutePayment(sch)}
                              className="px-3 py-1.5 rounded-md bg-[#10B981] hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Proses Pembayaran (DEMO)</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Smart Contract Management Tab */
        <div className="space-y-6">
          {db.smart_contracts.map((sc) => (
            <div
              key={sc.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    ID Konfigurasi: {sc.id} · Kontrak: {sc.contractId}
                  </div>
                  <h2 className="text-base font-bold text-[#071D49] mt-0.5">
                    Smart Contract Escrow Engine — {sc.projectName}
                  </h2>
                </div>
                <div className="text-xs font-semibold text-[#10B981]">
                  Status Deployment: {sc.deploymentStatus}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500">Alamat Kontrak Simulasi</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {sc.contractAddress}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Jaringan Blockchain</div>
                  <div className="font-semibold text-[#1264F4] mt-0.5">{sc.networkName}</div>
                </div>
                <div>
                  <div className="text-slate-500">Transaction Hash Terakhir (Simulasi)</div>
                  <div className="font-mono text-slate-800 truncate mt-0.5">{sc.lastTxHash}</div>
                </div>
              </div>

              {/* Aturan Otomatisasi */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sc.autoReleaseOnVerification}
                    onChange={(e) => {
                      onUpdateSmartContractConfig({
                        ...sc,
                        autoReleaseOnVerification: e.target.checked,
                      });
                      setFeedback('Konfigurasi otomatisasi Smart Contract diperbarui.');
                    }}
                    className="rounded border-slate-300"
                  />
                  <span>
                    Ubah status termin otomatis menjadi &quot;Siap dibayarkan&quot; saat Verifikator
                    menyetujui progres 100%
                  </span>
                </label>

                <span className="font-mono text-[11px] text-slate-500">
                  Adapter Interface: ISmartBuildEscrowAdapter v1.0 (Solidity Ready)
                </span>
              </div>

              {/* Riwayat Eksekusi Smart Contract */}
              <div className="border-t border-slate-200 pt-3">
                <div className="text-xs font-bold text-[#071D49] mb-2 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#1264F4]" />
                  <span>Riwayat Eksekusi Event Smart Contract (Log Simulasi)</span>
                </div>
                <div className="space-y-2">
                  {sc.executionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>{log.timestamp}</span>
                        <span className="text-emerald-400 font-bold">{log.status}</span>
                      </div>
                      <div className="font-semibold text-blue-300">{log.event}</div>
                      <div className="text-[11px] text-slate-300 font-sans">{log.details}</div>
                      <div className="text-[10px] text-slate-400">TxHash: {log.txHash}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Pembayaran */}
      {selectedPaymentDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="font-mono text-slate-500">
                  DETAIL TERMIN PEMBAYARAN · Termin #{selectedPaymentDetail.termNumber} · DEMO
                </div>
                <h2 className="text-base font-bold text-[#071D49] mt-0.5">
                  {selectedPaymentDetail.milestoneName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaymentDetail(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Tutup detail pembayaran"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Proyek:</span>
                <span className="font-bold text-slate-900">{selectedPaymentDetail.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Persentase Tahapan:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {selectedPaymentDetail.percentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Pembayaran:</span>
                <span className="font-mono font-bold text-[#1264F4] text-sm tabular-nums">
                  {formatRupiah(selectedPaymentDetail.nominal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className="font-bold text-slate-900">{selectedPaymentDetail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bukti Referensi:</span>
                <span className="font-mono text-slate-700">
                  {selectedPaymentDetail.proofRef || 'Belum diterbitkan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Simulasi Tx Hash:</span>
                <span className="font-mono text-slate-700 truncate max-w-[220px]">
                  {selectedPaymentDetail.txHash || '-'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedPaymentDetail(null)}
                className="px-4 py-2 rounded-lg bg-[#071D49] text-white font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Proses Pembayaran Simulasi */}
      {confirmExecutePayment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-[#071D49]">
              Konfirmasi Pencairan Termin Simulasi (DEMO)
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Anda akan menjalankan simulasi pencairan Smart Contract untuk{' '}
              <strong>{confirmExecutePayment.milestoneName}</strong> pada proyek{' '}
              <strong>{confirmExecutePayment.projectName}</strong> sebesar{' '}
              <strong className="font-mono text-[#1264F4]">
                {formatRupiah(confirmExecutePayment.nominal)}
              </strong>
              .
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Tindakan ini akan mencatat bukti transaksi simulasi (DEMO), membuat hash transaksi
              simulasi baru, dan memperbarui saldo pembayaran pada Dashboard serta Riwayat
              Transaksi.
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmExecutePayment(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onExecuteSimulatedPayment(confirmExecutePayment.id);
                  setFeedback(
                    `Pembayaran simulasi ${confirmExecutePayment.milestoneName} (${formatRupiah(
                      confirmExecutePayment.nominal
                    )}) berhasil diproses dan tercatat di Riwayat Transaksi (DEMO).`
                  );
                  setConfirmExecutePayment(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white font-semibold"
              >
                Konfirmasi &amp; Cairkan (DEMO)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * MODUL I: RIWAYAT TRANSAKSI
 * ========================================================================== */

export const TransactionsView: React.FC<{ db: SmartBuildDatabase }> = ({ db }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredTransactions = db.transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.id.toLowerCase().includes(q) ||
      t.projectName.toLowerCase().includes(q) ||
      t.milestoneName.toLowerCase().includes(q) ||
      t.txHash.toLowerCase().includes(q);
    const matchesProject = projectFilter === 'ALL' || t.projectId === projectFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesDate = !dateFilter || t.date >= dateFilter;
    return matchesSearch && matchesProject && matchesStatus && matchesDate;
  });

  const handleExportExcelCsv = () => {
    const headers = [
      'ID Transaksi',
      'Tanggal',
      'Nama Proyek',
      'Tahapan Pekerjaan',
      'Pengirim',
      'Penerima',
      'Nominal (Rp)',
      'Metode Pembayaran',
      'Status Transaksi',
      'Transaction Hash (Simulasi)',
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      `"${t.projectName}"`,
      `"${t.milestoneName}"`,
      `"${t.sender}"`,
      `"${t.receiver}"`,
      t.nominal,
      `"${t.paymentMethod}"`,
      `"${t.status}"`,
      t.txHash,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SmartBuild_Riwayat_Transaksi_DEMO.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#071D49]">
            Riwayat Transaksi &amp; Jejak Audit Pembayaran (DEMO)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Daftar lengkap pencairan termin pembayaran simulasi beserta pengirim, penerima, nominal,
            dan hash transaksi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcelCsv}
            className="px-3.5 py-2 rounded-lg bg-[#071D49] hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs no-print">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            aria-label="Cari riwayat transaksi"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID transaksi, tahapan, tx hash..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <select
            aria-label="Filter proyek transaksi"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Semua Proyek</option>
            {db.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            aria-label="Filter status transaksi"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">Semua Status Transaksi</option>
            <option value="Berhasil (DEMO)">Berhasil (DEMO)</option>
            <option value="Diproses (DEMO)">Diproses (DEMO)</option>
            <option value="Gagal (DEMO)">Gagal (DEMO)</option>
          </select>
        </div>
        <div>
          <input
            type="date"
            aria-label="Filter tanggal transaksi"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">ID Transaksi &amp; Tanggal</th>
                <th className="py-3 px-4 font-semibold">Proyek &amp; Tahapan</th>
                <th className="py-3 px-4 font-semibold">Pengirim &rarr; Penerima</th>
                <th className="py-3 px-4 font-semibold text-right">Nominal</th>
                <th className="py-3 px-4 font-semibold">Metode &amp; Tx Hash</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Tidak ada transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#071D49]">{trx.id}</div>
                      <div className="text-[11px] text-slate-500">{formatDateID(trx.date)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{trx.projectName}</div>
                      <div className="text-[11px] text-slate-500">{trx.milestoneName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>Dari: {trx.sender}</div>
                      <div className="text-[11px] text-slate-500">Ke: {trx.receiver}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(trx.nominal)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">{trx.paymentMethod}</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                        {trx.txHash}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#10B981]">{trx.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MODUL J: LAPORAN
 * ========================================================================== */

export const ReportsView: React.FC<{ db: SmartBuildDatabase }> = ({ db }) => {
  const [reportType, setReportType] = useState<
    'proyek' | 'progres' | 'kontrak' | 'pembayaran' | 'transaksi' | 'verifikasi'
  >('proyek');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [periodStart, setPeriodStart] = useState<string>('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2027-12-31');

  const reportTabs = [
    { id: 'proyek', label: 'Laporan Keseluruhan Proyek' },
    { id: 'progres', label: 'Laporan Progres' },
    { id: 'kontrak', label: 'Laporan Kontrak' },
    { id: 'pembayaran', label: 'Laporan Pembayaran' },
    { id: 'transaksi', label: 'Laporan Transaksi' },
    { id: 'verifikasi', label: 'Laporan Verifikasi' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#071D49]">
            Pusat Laporan &amp; Evaluasi Proyek Konstruksi
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Rekapitulasi data proyek, kontrak, realisasi progres, verifikasi pengawas, dan
            pembayaran termin berdasarkan filter proyek serta periode.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 no-print shrink-0"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Laporan PDF</span>
        </button>
      </div>

      {/* Report Category Selector & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === tab.id
                  ? 'bg-white text-[#071D49] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <label htmlFor="rep-filter-prj" className="block font-semibold text-slate-600 mb-1">
              Filter Proyek:
            </label>
            <select
              id="rep-filter-prj"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">Semua Proyek</option>
              {db.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-period-start" className="block font-semibold text-slate-600 mb-1">
              Periode Mulai:
            </label>
            <input
              id="rep-period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="rep-period-end" className="block font-semibold text-slate-600 mb-1">
              Periode Akhir:
            </label>
            <input
              id="rep-period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Report Table Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#071D49] mb-4">
          {reportTabs.find((t) => t.id === reportType)?.label} (DEMO)
        </h2>

        {reportType === 'proyek' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3">Kode &amp; Nama Proyek</th>
                <th className="py-2.5 px-3">Pengguna Jasa</th>
                <th className="py-2.5 px-3">Kontraktor</th>
                <th className="py-2.5 px-3 text-right">Nilai Kontrak</th>
                <th className="py-2.5 px-3 text-right">Progres</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.projects
                .filter((p) => selectedProjectId === 'ALL' || p.id === selectedProjectId)
                .map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-3 font-semibold text-slate-900">
                      {p.code} — {p.name}
                    </td>
                    <td className="py-3 px-3">{p.clientName}</td>
                    <td className="py-3 px-3">{p.contractorName}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {formatRupiah(p.contractValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1264F4] tabular-nums">
                      {p.overallProgress}%
                    </td>
                    <td className="py-3 pl-3 font-semibold">{p.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {reportType === 'progres' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3">Proyek</th>
                <th className="py-2.5 px-3">Tahapan</th>
                <th className="py-2.5 px-3 text-right">Bobot</th>
                <th className="py-2.5 px-3 text-right">Realisasi</th>
                <th className="py-2.5 pl-3">Status Tahapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.contract_milestones
                .filter((m) => selectedProjectId === 'ALL' || m.projectId === selectedProjectId)
                .map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 pr-3 font-semibold">
                      {db.projects.find((p) => p.id === m.projectId)?.name}
                    </td>
                    <td className="py-3 px-3">
                      Tahap {m.order}: {m.name}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {m.weightPercentage}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1264F4] tabular-nums">
                      {m.realizedProgress}%
                    </td>
                    <td className="py-3 pl-3 font-semibold">{m.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {reportType === 'kontrak' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3">Nomor Kontrak</th>
                <th className="py-2.5 px-3">Nama Proyek</th>
                <th className="py-2.5 px-3 text-right">Nilai Total</th>
                <th className="py-2.5 px-3">Persetujuan Pihak</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.contracts
                .filter((c) => selectedProjectId === 'ALL' || c.projectId === selectedProjectId)
                .map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-3 font-mono font-semibold">{c.contractNumber}</td>
                    <td className="py-3 px-3 font-semibold">{c.projectName}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {formatRupiah(c.totalValue)}
                    </td>
                    <td className="py-3 px-3">
                      Owner: {c.clientApproved ? 'Ya' : 'Belum'} · Kontraktor:{' '}
                      {c.contractorApproved ? 'Ya' : 'Belum'}
                    </td>
                    <td className="py-3 pl-3 font-semibold">{c.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {reportType === 'pembayaran' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3">Proyek</th>
                <th className="py-2.5 px-3">Termin Tahapan</th>
                <th className="py-2.5 px-3 text-right">Persentase</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 pl-3">Status Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.payment_schedules
                .filter((s) => selectedProjectId === 'ALL' || s.projectId === selectedProjectId)
                .map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-3 font-semibold">{s.projectName}</td>
                    <td className="py-3 px-3">{s.milestoneName}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{s.percentage}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      {formatRupiah(s.nominal)}
                    </td>
                    <td className="py-3 pl-3 font-semibold">{s.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {reportType === 'transaksi' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3">ID Transaksi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Proyek &amp; Termin</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.transactions
                .filter((t) => selectedProjectId === 'ALL' || t.projectId === selectedProjectId)
                .map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 pr-3 font-mono font-bold">{t.id}</td>
                    <td className="py-3 px-3">{formatDateID(t.date)}</td>
                    <td className="py-3 px-3">
                      {t.projectName} — {t.milestoneName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      {formatRupiah(t.nominal)}
                    </td>
                    <td className="py-3 pl-3 font-bold text-[#10B981]">{t.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {reportType === 'verifikasi' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3">ID Verifikasi</th>
                <th className="py-2.5 px-3">Proyek &amp; Tahapan</th>
                <th className="py-2.5 px-3">Verifikator</th>
                <th className="py-2.5 px-3 text-right">Disetujui</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.verifications
                .filter((v) => selectedProjectId === 'ALL' || v.projectId === selectedProjectId)
                .map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 pr-3 font-mono">{v.id}</td>
                    <td className="py-3 px-3 font-semibold">
                      {v.projectName} — {v.milestoneName}
                    </td>
                    <td className="py-3 px-3">{v.verifierName}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      {v.approvedPercentage}%
                    </td>
                    <td className="py-3 pl-3 font-semibold">{v.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * MODUL PENGGUNA, PENGATURAN (PROFIL & SISTEM) & BANTUAN
 * ========================================================================== */

interface UsersManagementViewProps {
  db: SmartBuildDatabase;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  db,
  onAddUser,
  onToggleUserStatus,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('contractor');
  const [orgName, setOrgName] = useState('PT Karya Konstruksi');
  const [position, setPosition] = useState('Site Manager');
  const [phone, setPhone] = useState('0812-9000-8000');
  const [showAdd, setShowAdd] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onAddUser({
      name: name.trim(),
      email: email.trim(),
      role,
      organizationId: 'org-3',
      organizationName: orgName.trim(),
      position: position.trim(),
      phone: phone.trim(),
      status: 'Aktif',
    });
    setName('');
    setEmail('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#071D49]">
            Manajemen Pengguna &amp; Organisasi (RBAC)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Kelola hak akses pengguna platform, perusahaan terdaftar, dan peran Role-Based Access
            Control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-[#1264F4] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs"
        >
          <div>
            <label htmlFor="usr-new-name" className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="usr-new-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="usr-new-email" className="block font-semibold text-slate-700 mb-1">
              Alamat Email
            </label>
            <input
              id="usr-new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="usr-new-role" className="block font-semibold text-slate-700 mb-1">
              Peran (Role)
            </label>
            <select
              id="usr-new-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="client">Pengguna Jasa (Owner)</option>
              <option value="contractor">Penyedia Jasa (Kontraktor)</option>
              <option value="verifikator">Verifikator / Pengawas</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="usr-new-org" className="block font-semibold text-slate-700 mb-1">
              Organisasi / Perusahaan
            </label>
            <input
              id="usr-new-org"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="usr-new-pos" className="block font-semibold text-slate-700 mb-1">
              Jabatan
            </label>
            <input
              id="usr-new-pos"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#071D49] text-white font-semibold rounded-lg"
            >
              Simpan Pengguna
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="py-3 px-4">Nama &amp; Email</th>
              <th className="py-3 px-4">Peran (RBAC)</th>
              <th className="py-3 px-4">Organisasi &amp; Jabatan</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {db.users.map((u) => (
              <tr key={u.id}>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-[#071D49]">{u.name}</div>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-[#1264F4]">
                  {getRoleLabel(u.role)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800">{u.organizationName}</div>
                  <div className="text-[11px] text-slate-500">{u.position}</div>
                </td>
                <td className="py-3.5 px-4 font-bold text-[#10B981]">{u.status}</td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onToggleUserStatus(u.id)}
                    className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  currentUser: User;
  systemSettings: SystemSettings;
  onUpdateProfile: (updated: User) => void;
  onUpdateSystemSettings: (updated: SystemSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  systemSettings,
  onUpdateProfile,
  onUpdateSystemSettings,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [position, setPosition] = useState(currentUser.position);
  const [bimEndpoint, setBimEndpoint] = useState(systemSettings.bimAdapterEndpoint);
  const [rpcEndpoint, setRpcEndpoint] = useState(systemSettings.blockchainRpcAdapter);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-xl font-bold text-[#071D49]">
          Pengaturan Profil Pengguna &amp; Konfigurasi Sistem
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Kelola identitas akun pengguna aktif serta parameter adapter integrasi BIM dan Blockchain.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {savedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pengaturan Profil */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateProfile({
              ...currentUser,
              name: name.trim() || currentUser.name,
              phone: phone.trim() || currentUser.phone,
              position: position.trim() || currentUser.position,
            });
            setSavedMsg('Profil pengguna berhasil diperbarui.');
          }}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs"
        >
          <h2 className="text-base font-bold text-[#071D49]">Pengaturan Profil Akun</h2>
          <div>
            <label htmlFor="prof-name" className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="prof-pos" className="block font-semibold text-slate-700 mb-1">
              Jabatan
            </label>
            <input
              id="prof-pos"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block font-semibold text-slate-700 mb-1">
              Nomor Telepon
            </label>
            <input
              id="prof-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1264F4] text-white font-semibold rounded-lg"
          >
            Simpan Profil
          </button>
        </form>

        {/* Pengaturan Sistem */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateSystemSettings({
              ...systemSettings,
              bimAdapterEndpoint: bimEndpoint,
              blockchainRpcAdapter: rpcEndpoint,
            });
            setSavedMsg('Konfigurasi sistem dan adapter integrasi berhasil disimpan.');
          }}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs"
        >
          <h2 className="text-base font-bold text-[#071D49]">
            Pengaturan Sistem &amp; Adapter Integrasi
          </h2>
          <div>
            <label htmlFor="sys-bim" className="block font-semibold text-slate-700 mb-1">
              Endpoint Adapter API BIM (Tahap 2 Ready)
            </label>
            <input
              id="sys-bim"
              type="text"
              value={bimEndpoint}
              onChange={(e) => setBimEndpoint(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label htmlFor="sys-rpc" className="block font-semibold text-slate-700 mb-1">
              Endpoint RPC Smart Contract Adapter
            </label>
            <input
              id="sys-rpc"
              type="text"
              value={rpcEndpoint}
              onChange={(e) => setRpcEndpoint(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
            Catatan Keamanan: Aplikasi tidak menyimpan private key atau secret wallet di sisi
            frontend. Otorisasi transaksi produksi wajib melalui backend gateway terenkripsi.
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#071D49] text-white font-semibold rounded-lg"
          >
            Simpan Konfigurasi Sistem
          </button>
        </form>
      </div>
    </div>
  );
};

export const HelpView: React.FC = () => {
  const workflowSteps = [
    '1. Pengguna Jasa (Owner) dan Penyedia Jasa (Kontraktor) membuat akun pada portal SmartBuild.',
    '2. Pengguna Jasa membuat proyek konstruksi baru beserta informasi lokasi, nilai kontrak, dan dokumen DED.',
    '3. Kedua belah pihak menyusun dan menyetujui Kontrak Digital yang memuat tahapan pekerjaan (total 100%).',
    '4. Sistem secara otomatis menyimpan jadwal tahapan dan termin pembayaran pada modul Smart Contract.',
    '5. Kontraktor melaksanakan pekerjaan konstruksi di lapangan sesuai spesifikasi.',
    '6. Kontraktor mengirim Laporan Progres tahapan beserta foto dokumentasi dan referensi objek BIM.',
    '7. Verifikator / Pengawas memeriksa bukti dokumentasi dan memvalidasi objek pada BIM Viewer 3D.',
    '8. Verifikator memberikan persetujuan, permintaan revisi, atau penolakan terhadap progres yang diajukan.',
    '9. Apabila verifikasi disetujui (100%), Smart Contract secara otomatis membuka kunci termin pembayaran menjadi "Siap dibayarkan".',
    '10. Pengguna Jasa mengeksekusi pembayaran termin (simulasi fungsional DEMO pada tahap MVP).',
    '11. Riwayat transaksi beserta hash transaksi simulasi tercatat secara permanen dan dapat diekspor ke PDF/Excel.',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-xl font-bold text-[#071D49]">
          Pusat Bantuan &amp; Panduan Alur Kerja SmartBuild
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Dokumentasi alur kerja standar pengelolaan kontrak konstruksi, verifikasi BIM, dan
          simulasi pembayaran berbasis Smart Contract.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
        <h2 className="text-base font-bold text-[#071D49]">
          Alur Kerja Utama Aplikasi (End-to-End Workflow)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflowSteps.map((step) => (
            <div
              key={step}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium leading-relaxed"
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
