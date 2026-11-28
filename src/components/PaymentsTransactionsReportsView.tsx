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
  X,
  Info,
  Code2,
  Database,
  Copy,
  Download,
  RefreshCw,
  CloudUpload,
  CloudDownload,
  Globe,
  Check,
  Edit2,
  Trash2,
  LogIn,
  Lock,
  Unlock,
  EyeOff,
  UserCheck,
  KeyRound,
  Landmark,
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
  generateUniqueId,
  getRoleLabel,
  verifyOwnerSettingsPassword,
} from '../utils/calculations';
import {
  AppsScriptConfig,
  CODE_GS_SOURCE,
  SETUP_GS_SOURCE,
  pullDatabaseFromAppsScript,
  syncDatabaseToAppsScript,
  testAppsScriptConnection,
} from '../services/appsScriptService';

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Manajemen Pembayaran Termin &amp; Smart Contract
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Otomatisasi perhitungan termin berdasarkan persentase tahapan kontrak dan status
            verifikasi pekerjaan (Mode Simulasi Fungsional MVP - DEMO).
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-white dark:bg-slate-900 text-[#071D49] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                ? 'bg-white dark:bg-slate-900 text-[#071D49] dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Konfigurasi Smart Contract</span>
          </button>
        </div>
      </div>

      {/* Rekening Otomatis Dibayarkan Setelah Pekerjaan Selesai */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              Rekening Otomatis Dibayarkan Setelah Pekerjaan Selesai (Smart Contract Auto-Payout)
            </div>
            <div className="text-emerald-800 dark:text-emerald-300 mt-0.5">
              Setiap tahapan pekerjaan pada <strong>Pembangunan Rumah di Gang Mahanggi Tenggarong</strong> yang telah selesai &amp; disetujui verifikasinya akan otomatis dicairkan ke rekening Penyedia Jasa:
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Penerima Pencairan Otomatis
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">MUHAJIRIN KASIM</div>
          <div className="font-mono font-bold text-[#1264F4] dark:text-blue-400">
            Bank Mandiri · 1480025086508
          </div>
        </div>
      </div>

      {/* Important Simulation Safety Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">
            Pemberitahuan Simulasi Pembayaran &amp; Smart Contract (DEMO):
          </span>{' '}
          Seluruh transaksi pada tahap MVP ini merupakan simulasi logika fungsional tanpa
          menggunakan uang sungguhan dan belum dikirim ke mainnet Blockchain publik. Service
          interface Solidity telah disiapkan terpisah untuk integrasi testnet/production pada Tahap 2.
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold text-emerald-700 dark:text-emerald-300"
            aria-label="Tutup pesan pembayaran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'payments' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Daftar Termin Pembayaran Berdasarkan Persentase Kontrak
            </div>
            <select
              aria-label="Filter proyek pembayaran"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Proyek ({db.payment_schedules.length} Termin)</option>
              {db.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatRupiah(p.contractValue)})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Mobile Payment Termin Cards (< md) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSchedules.map((sch) => (
                <div key={sch.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        Termin #{sch.termNumber} · {sch.percentage}% Kontrak
                      </div>
                      <div className="font-bold text-[#071D49] dark:text-white text-sm mt-0.5 leading-snug">
                        {sch.milestoneName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sch.projectName}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] shrink-0 ${
                        sch.status === 'Berhasil'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]'
                          : sch.status === 'Siap dibayarkan'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1264F4] dark:text-blue-400'
                          : sch.status === 'Menunggu verifikasi'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {formatRupiah(sch.nominal)}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                        {sch.txHash ? `Ref: ${sch.proofRef}` : 'Menunggu penyelesaian 100%'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentDetail(sch)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                      {sch.status === 'Siap dibayarkan' && canPay && (
                        <button
                          type="button"
                          onClick={() => setConfirmExecutePayment(sch)}
                          className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cairkan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Payment Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4 font-semibold">Termin &amp; Proyek</th>
                    <th className="py-3 px-4 font-semibold">Tahapan Pekerjaan</th>
                    <th className="py-3 px-4 font-semibold text-right">Persentase</th>
                    <th className="py-3 px-4 font-semibold text-right">Nilai Termin</th>
                    <th className="py-3 px-4 font-semibold">Status Pembayaran</th>
                    <th className="py-3 px-4 font-semibold">Bukti / Tx Hash (Simulasi)</th>
                    <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSchedules.map((sch) => (
                    <tr
                      key={sch.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          Termin #{sch.termNumber} · {sch.isDemo ? 'DEMO' : 'LIVE'}
                        </div>
                        <div className="font-bold text-[#071D49] dark:text-white mt-0.5">
                          {sch.projectName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {sch.milestoneName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
                        {sch.percentage}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {formatRupiah(sch.nominal)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold whitespace-nowrap ${
                            sch.status === 'Berhasil'
                              ? 'text-[#10B981]'
                              : sch.status === 'Siap dibayarkan'
                              ? 'text-[#1264F4] dark:text-blue-400'
                              : sch.status === 'Menunggu verifikasi'
                              ? 'text-[#F59E0B]'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {sch.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
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
                            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          {sch.status === 'Siap dibayarkan' && canPay && (
                            <button
                              type="button"
                              onClick={() => setConfirmExecutePayment(sch)}
                              className="px-3 py-1.5 rounded-md bg-[#10B981] hover:bg-emerald-700 text-white font-semibold inline-flex items-center gap-1 whitespace-nowrap"
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    ID Konfigurasi: {sc.id} · Kontrak: {sc.contractId}
                  </div>
                  <h2 className="text-base font-bold text-[#071D49] dark:text-white mt-0.5">
                    Smart Contract Escrow Engine — {sc.projectName}
                  </h2>
                </div>
                <div className="text-xs font-semibold text-[#10B981]">
                  Status Deployment: {sc.deploymentStatus}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Alamat Kontrak Simulasi</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {sc.contractAddress}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Jaringan Blockchain</div>
                  <div className="font-semibold text-[#1264F4] dark:text-blue-400 mt-0.5">
                    {sc.networkName}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Transaction Hash Terakhir (Simulasi)
                  </div>
                  <div className="font-mono text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {sc.lastTxHash}
                  </div>
                </div>
              </div>

              {/* Aturan Otomatisasi */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
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

                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Adapter Interface: ISmartBuildEscrowAdapter v1.0 (Solidity Ready)
                </span>
              </div>

              {/* Riwayat Eksekusi Smart Contract */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="text-xs font-bold text-[#071D49] dark:text-white mb-2 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#1264F4]" />
                  <span>Riwayat Eksekusi Event Smart Contract (Log Simulasi)</span>
                </div>
                <div className="space-y-2">
                  {sc.executionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs space-y-1 border border-slate-800"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  DETAIL TERMIN PEMBAYARAN · Termin #{selectedPaymentDetail.termNumber} · DEMO
                </div>
                <h2 className="text-base font-bold text-[#071D49] dark:text-white mt-0.5">
                  {selectedPaymentDetail.milestoneName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaymentDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup detail pembayaran"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Nama Proyek:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedPaymentDetail.projectName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Persentase Tahapan:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {selectedPaymentDetail.percentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Nominal Pembayaran:</span>
                <span className="font-mono font-bold text-[#1264F4] dark:text-blue-400 text-sm tabular-nums">
                  {formatRupiah(selectedPaymentDetail.nominal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status Saat Ini:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedPaymentDetail.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bukti Referensi:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedPaymentDetail.proofRef || 'Belum diterbitkan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Simulasi Tx Hash:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                  {selectedPaymentDetail.txHash || '-'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPaymentDetail(null)}
                className="px-4 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 text-white font-semibold"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-[#071D49] dark:text-white">
              Konfirmasi Pencairan Termin Simulasi (DEMO)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Anda akan menjalankan simulasi pencairan Smart Contract untuk{' '}
              <strong>{confirmExecutePayment.milestoneName}</strong> pada proyek{' '}
              <strong>{confirmExecutePayment.projectName}</strong> sebesar{' '}
              <strong className="font-mono text-[#1264F4] dark:text-blue-400">
                {formatRupiah(confirmExecutePayment.nominal)}
              </strong>
              .
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              Tindakan ini akan mencatat bukti transaksi simulasi (DEMO), membuat hash transaksi
              simulasi baru, dan memperbarui saldo pembayaran pada Dashboard serta Riwayat
              Transaksi.
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmExecutePayment(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
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
 * MODUL I: RIWAYAT TRANSAKSI & ARSITEKTUR INTEGRASI BLOCKCHAIN [DEMO SIMULATION]
 * ========================================================================== */

interface BlockchainTransactionItem {
  id: string;
  contractNumber: string;
  referenceCode: string;
  title: string;
  nominal: number;
  statusLabel: string;
  recipient: string;
  approvalStatus: string;
  mfaAuthorization: string;
  networkName: string;
  blockTimestamp: string;
  walletAddress: string;
  smartContractAddress: string;
  simulatedTxHash: string;
  projectId: string;
  projectName: string;
  date: string;
}

const SEEDED_BLOCKCHAIN_TRANSACTIONS: BlockchainTransactionItem[] = [
  {
    id: 'TRX-SB-DEMO-20260801-H0A',
    contractNumber: 'KTR/SB/2026/VIII/001-DEMO',
    referenceCode: 'ESC-H0-20260801-001-DEMO',
    title: 'Pembangunan Gedung Aula — Setoran Dana Awal Escrow (H0) — Kontrak Penuh',
    nominal: 450000000,
    statusLabel: 'Berhasil [SIMULASI DEMO]',
    recipient: 'SmartBuild Escrow Vault [DEMO]',
    approvalStatus: 'Disetujui Pemilik Proyek',
    mfaAuthorization: 'MFA OTP Terverifikasi',
    networkName: 'SmartBuild Polygon Amoy Testnet [DEMO SIMULATION] (Chain ID: 80002)',
    blockTimestamp: '2026-08-01T02:20:00Z',
    walletAddress: '0xDEMO91A2B3C4D5E6F708192A3B4C5D6E7F8091A2',
    smartContractAddress: '0xDEMO71C94F2A8E3B9D1029384756ABCDEF110001',
    simulatedTxHash: '0xDEMO_SIMULATED_TX_8819a2f4c6e8b0d123456789abcdef0123456789abcdef',
    projectId: 'PRJ-DEMO-AULA',
    projectName: 'Pembangunan Gedung Aula',
    date: '2026-08-01',
  },
  {
    id: 'TRX-SB-DEMO-20260918-001',
    contractNumber: 'KTR/SB/2026/VIII/001-DEMO',
    referenceCode: 'REL-H188-20260918-001-DEMO',
    title: 'Pembangunan Gedung Aula — Tahap 1: Pondasi Selesai (25%)',
    nominal: 112500000,
    statusLabel: 'Berhasil [SIMULASI DEMO]',
    recipient: 'MUHAJIRIN KASIM — Bank Mandiri 1480025086508 (Penyedia Jasa)',
    approvalStatus: 'Disetujui Penuh (Ir. Dian Permatasari, MT & Citra Ayu Deswina Maharani)',
    mfaAuthorization: 'MFA Terverifikasi (MFA-VERIFIED-20260918-01)',
    networkName: 'SmartBuild Polygon Amoy Testnet [DEMO SIMULATION] (Chain ID: 80002)',
    blockTimestamp: '2026-09-18T07:20:00Z',
    walletAddress: '0xDEMO44F5E6D7C8B9A0123456789ABCDEF0123456',
    smartContractAddress: '0xDEMO71C94F2A8E3B9D1029384756ABCDEF110001',
    simulatedTxHash: '0xDEMO_SIMULATED_TX_4421b9d3e7f1a5c67890123456789abcdef0123456789a',
    projectId: 'PRJ-DEMO-AULA',
    projectName: 'Pembangunan Gedung Aula',
    date: '2026-09-18',
  },
  {
    id: 'TRX-SB-DEMO-20260820-002',
    contractNumber: 'KTR/SB/2026/VII/002-DEMO',
    referenceCode: 'REL-H188-20260820-002-DEMO',
    title: 'Renovasi Kantor Pusat — Tahap 1: Pondasi & Perkuatan (25%)',
    nominal: 60000000,
    statusLabel: 'Berhasil [SIMULASI DEMO]',
    recipient: 'MUHAJIRIN KASIM — Bank Mandiri 1480025086508 (Penyedia Jasa)',
    approvalStatus: 'Disetujui Penuh (Ir. Dian Permatasari, MT & Citra Ayu Deswina Maharani)',
    mfaAuthorization: 'MFA Terverifikasi (MFA-VERIFIED-20260820-02)',
    networkName: 'SmartBuild Polygon Amoy Testnet [DEMO SIMULATION] (Chain ID: 80002)',
    blockTimestamp: '2026-08-20T09:15:00Z',
    walletAddress: '0xDEMO44F5E6D7C8B9A0123456789ABCDEF0123456',
    smartContractAddress: '0xDEMO71C94F2A8E3B9D1029384756ABCDEF110002',
    simulatedTxHash: '0xDEMO_SIMULATED_TX_7732c8e4f9a2b1d0987654321fedcba0987654321fedcb',
    projectId: 'PRJ-DEMO-KANTOR',
    projectName: 'Renovasi Kantor Pusat',
    date: '2026-08-20',
  },
];

export const TransactionsView: React.FC<{ db: SmartBuildDatabase }> = ({ db }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  const allBlockchainTransactions: BlockchainTransactionItem[] = [
    ...SEEDED_BLOCKCHAIN_TRANSACTIONS,
    ...db.transactions.map((t, index) => {
      const contract = db.contracts.find((c) => c.projectId === t.projectId);
      const sc = db.smart_contracts.find((s) => s.projectId === t.projectId);
      const rawHash = t.txHash.startsWith('0xDEMO_SIMULATED_TX_')
        ? t.txHash
        : `0xDEMO_SIMULATED_TX_${t.txHash.replace(/^0x/i, '')}a1b2c3d4e5f60718293a`;
      return {
        id: t.id.startsWith('TRX-SB') ? t.id : `TRX-SB-DEMO-${t.date.replace(/-/g, '')}-00${index + 3}`,
        contractNumber: contract?.contractNumber || 'KTR/SB/2026/IX/003-DEMO',
        referenceCode: `REL-H188-${t.date.replace(/-/g, '')}-00${index + 1}-DEMO`,
        title: `${t.projectName} — ${t.milestoneName}`,
        nominal: t.nominal,
        statusLabel: 'Berhasil [SIMULASI DEMO]',
        recipient: t.receiver,
        approvalStatus: 'Disetujui Penuh (Pengawas & Pemilik)',
        mfaAuthorization: `MFA & PIN Terverifikasi (MFA-VERIFIED-${t.date.replace(/-/g, '')}-0${index + 1})`,
        networkName: 'SmartBuild Polygon Amoy Testnet [DEMO SIMULATION] (Chain ID: 80002)',
        blockTimestamp: `${t.date}T08:30:00Z`,
        walletAddress: '0xDEMO88A1B2C3D4E5F60718293A4B5C6D7E8F9012',
        smartContractAddress:
          sc?.contractAddress || '0xDEMO71C94F2A8E3B9D1029384756ABCDEF110003',
        simulatedTxHash: rawHash,
        projectId: t.projectId,
        projectName: t.projectName,
        date: t.date,
      };
    }),
  ];

  const filteredTransactions = allBlockchainTransactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.contractNumber.toLowerCase().includes(q) ||
      t.recipient.toLowerCase().includes(q) ||
      t.simulatedTxHash.toLowerCase().includes(q);
    const matchesProject =
      projectFilter === 'ALL' ||
      t.projectId === projectFilter ||
      t.projectName.toLowerCase().includes(projectFilter.toLowerCase());
    return matchesSearch && matchesProject;
  });

  const handleExportExcelCsv = () => {
    const headers = [
      'No. Transaksi',
      'Kontrak',
      'Referensi',
      'Judul Transaksi',
      'Penerima',
      'Nominal (Rp)',
      'Status Persetujuan',
      'Otorisasi MFA',
      'Smart Contract',
      'Simulated Tx Hash',
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.contractNumber,
      t.referenceCode,
      `"${t.title}"`,
      `"${t.recipient}"`,
      t.nominal,
      `"${t.approvalStatus}"`,
      `"${t.mfaAuthorization}"`,
      t.smartContractAddress,
      t.simulatedTxHash,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SmartBuild_Riwayat_Transaksi_Blockchain_DEMO.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header Card matching image_cced9e5e.png */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Riwayat Transaksi &amp; Arsitektur Integrasi Blockchain [DEMO SIMULATION]
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seluruh transaksi simulasi di bawah ini memiliki label DEMO dan tidak terhubung ke jaringan mainnet produksi sebelum persetujuan dan audit smart contract.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Cari riwayat transaksi blockchain"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Transaksi, Kontrak, Tx Hash..."
              className="w-full sm:w-56 pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs"
            />
          </div>
          <select
            aria-label="Filter proyek transaksi"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
          >
            <option value="ALL">Semua Proyek</option>
            <option value="Pembangunan Gedung Aula">Pembangunan Gedung Aula</option>
            <option value="Renovasi Kantor Pusat">Renovasi Kantor Pusat</option>
            {db.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcelCsv}
            className="px-3 py-2 rounded-xl bg-[#071D49] hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Transaction Cards matching image_cced9e5e.png */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Tidak ada transaksi yang sesuai filter pencarian.
          </div>
        ) : (
          filteredTransactions.map((trx) => (
            <div
              key={trx.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Top Row: Transaction Metadata & Right Nominal + Status */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-mono text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 break-words">
                    No. Transaksi: {trx.id} · Kontrak: {trx.contractNumber} · Ref:{' '}
                    {trx.referenceCode}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {trx.title}
                  </h2>
                </div>

                <div className="md:text-right shrink-0">
                  <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatRupiah(trx.nominal)}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {trx.statusLabel}
                  </div>
                </div>
              </div>

              {/* Middle 3-column Metadata Row: Penerima, Status Persetujuan, Otorisasi MFA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Penerima: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {trx.recipient}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Status Persetujuan:{' '}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {trx.approvalStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Otorisasi MFA: </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {trx.mfaAuthorization}
                  </span>
                </div>
              </div>

              {/* Dark Navy Blockchain Telemetry Box matching image_cced9e5e.png */}
              <div className="bg-[#0B1528] text-slate-300 rounded-xl p-4 font-mono text-[11px] sm:text-xs space-y-2.5 overflow-x-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Network: </span>
                    <span className="font-bold text-white">{trx.networkName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Waktu Blok: </span>
                    <span className="font-bold text-white">{trx.blockTimestamp}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="break-all">
                    <span className="text-slate-400">Wallet Address: </span>
                    <span className="font-bold text-slate-100">{trx.walletAddress}</span>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-400">Smart Contract: </span>
                    <span className="font-bold text-slate-100">
                      {trx.smartContractAddress}
                    </span>
                  </div>
                </div>

                <div className="break-all pt-0.5">
                  <span className="text-slate-400">Simulated Tx Hash: </span>
                  <span className="font-bold text-[#38BDF8]">{trx.simulatedTxHash}</span>
                </div>
              </div>
            </div>
          ))
        )}
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Pusat Laporan &amp; Evaluasi Proyek Konstruksi
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === tab.id
                  ? 'bg-white dark:bg-slate-900 text-[#071D49] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div>
            <label
              htmlFor="rep-filter-prj"
              className="block font-semibold text-slate-600 dark:text-slate-300 mb-1"
            >
              Filter Proyek:
            </label>
            <select
              id="rep-filter-prj"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
            <label
              htmlFor="rep-period-start"
              className="block font-semibold text-slate-600 dark:text-slate-300 mb-1"
            >
              Periode Mulai:
            </label>
            <input
              id="rep-period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="rep-period-end"
              className="block font-semibold text-slate-600 dark:text-slate-300 mb-1"
            >
              Periode Akhir:
            </label>
            <input
              id="rep-period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Report Table Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 overflow-x-auto">
        <h2 className="text-base font-bold text-[#071D49] dark:text-white mb-4">
          {reportTabs.find((t) => t.id === reportType)?.label} (DEMO)
        </h2>

        {reportType === 'proyek' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">Kode &amp; Nama Proyek</th>
                <th className="py-2.5 px-3">Pengguna Jasa</th>
                <th className="py-2.5 px-3">Kontraktor</th>
                <th className="py-2.5 px-3 text-right">Nilai Kontrak</th>
                <th className="py-2.5 px-3 text-right">Progres</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {db.projects
                .filter((p) => selectedProjectId === 'ALL' || p.id === selectedProjectId)
                .map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-3 font-semibold text-slate-900 dark:text-white">
                      {p.code} — {p.name}
                    </td>
                    <td className="py-3 px-3">{p.clientName}</td>
                    <td className="py-3 px-3">{p.contractorName}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {formatRupiah(p.contractValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">Proyek</th>
                <th className="py-2.5 px-3">Tahapan</th>
                <th className="py-2.5 px-3 text-right">Bobot</th>
                <th className="py-2.5 px-3 text-right">Realisasi</th>
                <th className="py-2.5 pl-3">Status Tahapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">Nomor Kontrak</th>
                <th className="py-2.5 px-3">Nama Proyek</th>
                <th className="py-2.5 px-3 text-right">Nilai Total</th>
                <th className="py-2.5 px-3">Persetujuan Pihak</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">Proyek</th>
                <th className="py-2.5 px-3">Termin Tahapan</th>
                <th className="py-2.5 px-3 text-right">Persentase</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 pl-3">Status Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {db.payment_schedules
                .filter((s) => selectedProjectId === 'ALL' || s.projectId === selectedProjectId)
                .map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-3 font-semibold">{s.projectName}</td>
                    <td className="py-3 px-3">{s.milestoneName}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {s.percentage}%
                    </td>
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">ID Transaksi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Proyek &amp; Termin</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">ID Verifikasi</th>
                <th className="py-2.5 px-3">Proyek &amp; Tahapan</th>
                <th className="py-2.5 px-3">Verifikator</th>
                <th className="py-2.5 px-3 text-right">Disetujui</th>
                <th className="py-2.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
 * MODUL PENGGUNA, PENGATURAN (PROFIL, SISTEM, APPS SCRIPT & VERCEL) & BANTUAN
 * ========================================================================== */

interface UsersManagementViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  isOwnerUnlocked: boolean;
  onSetOwnerUnlocked: (unlocked: boolean) => void;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User, loginAfterSave?: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onLoginAsUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  db,
  currentUser,
  isOwnerUnlocked,
  onSetOwnerUnlocked,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onLoginAsUser,
  onToggleUserStatus,
}) => {
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerPasswordError, setOwnerPasswordError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('smartbuild2026');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [orgName, setOrgName] = useState('PT Karya Konstruksi');
  const [position, setPosition] = useState('Administrator / Project Lead');
  const [phone, setPhone] = useState('0812-9000-8000');
  const [showAdd, setShowAdd] = useState(false);

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditPassword, setShowEditPassword] = useState<boolean>(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleUnlockOwnerUsers = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerSettingsPassword(ownerPasswordInput)) {
      setOwnerPasswordError(null);
      setOwnerPasswordInput('');
      onSetOwnerUnlocked(true);
    } else {
      setOwnerPasswordError(
        'Password salah! Halaman Pengguna hanya dapat diakses oleh Pemilik Website Aplikasi.'
      );
    }
  };

  if (!isOwnerUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 text-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#071D49] dark:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                Akses Terproteksi
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#071D49] dark:text-white mt-0.5">
                Verifikasi Pemilik Website Aplikasi
              </h1>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Menu <strong>Pengguna &amp; Manajemen Admin</strong> dikunci menggunakan password khusus
            pemilik website aplikasi untuk menjaga keamanan kredensial ID Login dan Password akun.
          </p>

          {ownerPasswordError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium">
              {ownerPasswordError}
            </div>
          )}

          <form onSubmit={handleUnlockOwnerUsers} className="space-y-4">
            <div>
              <label
                htmlFor="owner-users-password"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Password Pemilik Website Aplikasi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  id="owner-users-password"
                  type={showOwnerPassword ? 'text' : 'password'}
                  value={ownerPasswordInput}
                  onChange={(e) => {
                    setOwnerPasswordInput(e.target.value);
                    if (ownerPasswordError) setOwnerPasswordError(null);
                  }}
                  placeholder="Masukkan password pemilik..."
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showOwnerPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#1264F4] hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Pengaturan Pemilik</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const toggleRevealPassword = (userId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const generatedLoginId =
      loginId.trim() ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.|\.$/g, '');
    onAddUser({
      name: name.trim(),
      loginId: generatedLoginId,
      password: password.trim() || 'smartbuild2026',
      email: email.trim(),
      role,
      organizationId: generateUniqueId('org'),
      organizationName: orgName.trim() || 'SmartBuild Partner',
      position: position.trim() || 'Anggota Tim',
      phone: phone.trim() || '0812-0000-0000',
      status: 'Aktif',
    });
    setFeedbackMsg(
      `Akun "${name.trim()}" (ID: ${generatedLoginId}) berhasil ditambahkan oleh Super Admin.`
    );
    setName('');
    setLoginId('');
    setPassword('smartbuild2026');
    setEmail('');
    setShowAdd(false);
  };

  const filteredUsers = db.users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.loginId && u.loginId.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      u.organizationName.toLowerCase().includes(q) ||
      getRoleLabel(u.role).toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              <Unlock className="w-3.5 h-3.5" />
              <span>Akses Pemilik Website Aplikasi Terbuka</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/10 text-[#1264F4] dark:text-blue-400 text-[11px] font-bold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Otoritas Super Admin: Kelola ID Login &amp; Password Semua Akun</span>
            </div>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Manajemen Admin, Pengguna, ID Login &amp; Password (RBAC)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Super Admin dapat melihat, mengatur, mengubah ID Login &amp; Password akun lain,
            mengedit rekening bank, menghapus akun, atau masuk langsung sebagai pengguna tertentu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSetOwnerUnlocked(false)}
            className="px-3.5 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Pengaturan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Admin / Pengguna</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengguna, ID akun, email, perusahaan, atau peran..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="usr-role-filter" className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            Filter Peran:
          </label>
          <select
            id="usr-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
          >
            <option value="ALL">Semua Peran ({db.users.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="client">Pengguna Jasa (Owner)</option>
            <option value="contractor">Penyedia Jasa (Kontraktor)</option>
            <option value="verifikator">Verifikator / Pengawas</option>
          </select>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs"
        >
          <div className="sm:col-span-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-[#071D49] dark:text-white">
              Tambah Akun Admin / Pengguna Baru (Beserta ID Login &amp; Password)
            </span>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label
              htmlFor="usr-new-name"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nama Lengkap
            </label>
            <input
              id="usr-new-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ir. Ahmad Fauzi"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              required
            />
          </div>
          <div>
            <label
              htmlFor="usr-new-loginid"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              ID Akun / Username Login
            </label>
            <input
              id="usr-new-loginid"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Contoh: ahmad.fauzi"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
            />
          </div>
          <div>
            <label
              htmlFor="usr-new-password"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Password Akun
            </label>
            <input
              id="usr-new-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password login pengguna"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
              required
            />
          </div>
          <div>
            <label
              htmlFor="usr-new-email"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Alamat Email
            </label>
            <input
              id="usr-new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmad@smartbuild.id"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              required
            />
          </div>
          <div>
            <label
              htmlFor="usr-new-role"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Peran (Role RBAC)
            </label>
            <select
              id="usr-new-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              <option value="super_admin">Super Admin</option>
              <option value="client">Pengguna Jasa (Owner)</option>
              <option value="contractor">Penyedia Jasa (Kontraktor)</option>
              <option value="verifikator">Verifikator / Pengawas</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="usr-new-org"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Organisasi / Perusahaan
            </label>
            <input
              id="usr-new-org"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="usr-new-pos"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Jabatan &amp; No. Telepon
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="usr-new-pos"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Jabatan"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="No. Telepon"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-[#071D49] dark:bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              Simpan Akun Baru
            </button>
          </div>
        </form>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <th className="py-3 px-4">Nama &amp; Kontak</th>
              <th className="py-3 px-4">ID Akun &amp; Password Login</th>
              <th className="py-3 px-4">Peran (RBAC)</th>
              <th className="py-3 px-4">Organisasi &amp; Rekening</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi (Masuk / Kelola ID &amp; Password / Hapus)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u) => {
              const isCurrent = u.id === currentUser.id;
              const isPassRevealed = !!revealedPasswords[u.id];
              return (
                <tr
                  key={u.id}
                  className={
                    isCurrent
                      ? 'bg-blue-50/50 dark:bg-blue-950/20'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#071D49] dark:text-white">{u.name}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded bg-[#1264F4] text-white text-[10px] font-bold">
                          Aktif Digunakan
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {u.email} · {u.phone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 max-w-[230px]">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">ID Login:</span>
                        <span className="font-mono font-bold text-[#071D49] dark:text-blue-300">
                          {u.loginId || u.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                            {isPassRevealed ? u.password || 'smartbuild2026' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(u.id)}
                            className="text-slate-400 hover:text-[#1264F4] dark:hover:text-blue-400"
                            title={isPassRevealed ? 'Sembunyikan Password' : 'Lihat Password'}
                          >
                            {isPassRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1264F4] dark:text-blue-400">
                    {getRoleLabel(u.role)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {u.organizationName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {u.position}
                    </div>
                    {u.bankAccountNumber && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
                        <Landmark className="w-3 h-3" />
                        <span>
                          {u.bankName || 'Bank Mandiri'} · {u.bankAccountNumber} a.n.{' '}
                          {u.bankAccountHolder || u.name.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleUserStatus(u.id)}
                      className={`font-bold underline-offset-2 hover:underline ${
                        u.status === 'Aktif' ? 'text-[#10B981]' : 'text-amber-500'
                      }`}
                      title="Klik untuk mengubah status Aktif/Nonaktif"
                    >
                      {u.status}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onLoginAsUser(u.id);
                          setFeedbackMsg(
                            `Berhasil masuk sebagai "${u.name}" (${getRoleLabel(u.role)}).`
                          );
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1264F4] hover:bg-blue-700 text-white'
                        }`}
                        title="Masuk dan gunakan aplikasi sebagai pengguna ini"
                      >
                        {isCurrent ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Sedang Masuk</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Masuk Sebagai</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser({
                            ...u,
                            loginId: u.loginId || u.id,
                            password: u.password || 'smartbuild2026',
                          });
                          setShowEditPassword(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1"
                        title="Kelola ID Login, Password, dan data pengguna"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#1264F4]" />
                        <span>Kelola ID &amp; Password</span>
                      </button>

                      <button
                        type="button"
                        disabled={db.users.length <= 1}
                        onClick={() => setConfirmDeleteUser(u)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 disabled:opacity-40"
                        title="Hapus akun pengguna / admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View (Responsive for HP) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((u) => {
          const isCurrent = u.id === currentUser.id;
          const isPassRevealed = !!revealedPasswords[u.id];
          return (
            <div
              key={u.id}
              className={`p-4 rounded-xl border text-xs space-y-3 ${
                isCurrent
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-[#071D49] dark:text-white">
                      {u.name}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-[#1264F4] text-white text-[10px] font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-[#1264F4] dark:text-blue-400 font-semibold mt-0.5">
                    {getRoleLabel(u.role)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {u.organizationName} · {u.position}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleUserStatus(u.id)}
                  className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    u.status === 'Aktif'
                      ? 'bg-emerald-500/15 text-[#10B981]'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {u.status}
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ID Login Akun:</span>
                  <span className="font-mono font-bold text-[#071D49] dark:text-blue-300">
                    {u.loginId || u.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Password Login:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {isPassRevealed ? u.password || 'smartbuild2026' : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword(u.id)}
                      className="text-slate-400 hover:text-[#1264F4]"
                    >
                      {isPassRevealed ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Email:</span>
                  <span className="text-slate-700 dark:text-slate-300">{u.email}</span>
                </div>
              </div>

              {u.bankAccountNumber && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {u.bankName || 'Bank Mandiri'} · {u.bankAccountNumber} a.n.{' '}
                    {u.bankAccountHolder || u.name.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onLoginAsUser(u.id);
                    setFeedbackMsg(`Berhasil masuk sebagai "${u.name}".`);
                  }}
                  className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 ${
                    isCurrent ? 'bg-emerald-600 text-white' : 'bg-[#1264F4] text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isCurrent ? 'Aktif' : 'Masuk'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser({
                      ...u,
                      loginId: u.loginId || u.id,
                      password: u.password || 'smartbuild2026',
                    });
                    setShowEditPassword(true);
                  }}
                  className="py-2 px-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#1264F4]" />
                  <span>ID &amp; Pass</span>
                </button>
                <button
                  type="button"
                  disabled={db.users.length <= 1}
                  onClick={() => setConfirmDeleteUser(u)}
                  className="py-2 px-2 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Edit Admin / Pengguna, ID Login, Password & Masuk Sebagai Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                  Kelola ID Login, Password &amp; Profil Akun
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Super Admin dapat mengubah ID Login, Password, Peran RBAC, dan Rekening akun ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Highlighted Super Admin ID & Password Credential Section */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-[#071D49] dark:text-blue-300">
                <KeyRound className="w-4 h-4 text-[#1264F4]" />
                <span>Pengaturan Kredensial Login (ID Akun &amp; Password)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-user-loginid"
                    className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                  >
                    ID Login / Username Akun
                  </label>
                  <input
                    id="edit-user-loginid"
                    type="text"
                    value={editingUser.loginId || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, loginId: e.target.value })
                    }
                    placeholder="Contoh: citra.maharani"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-user-password"
                    className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                  >
                    Password Login Akun
                  </label>
                  <div className="relative">
                    <input
                      id="edit-user-password"
                      type={showEditPassword ? 'text' : 'password'}
                      value={editingUser.password || ''}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, password: e.target.value })
                      }
                      placeholder="Masukkan password baru..."
                      className="w-full pl-3 pr-9 py-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((v) => !v)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Tampilkan / Sembunyikan Password"
                    >
                      {showEditPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Pengguna / Admin
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran (Role RBAC)
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-semibold"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="client">Pengguna Jasa (Owner)</option>
                  <option value="contractor">Penyedia Jasa (Kontraktor)</option>
                  <option value="verifikator">Verifikator / Pengawas</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Akun
                </label>
                <select
                  value={editingUser.status}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      status: e.target.value as 'Aktif' | 'Nonaktif',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-semibold"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organisasi / Perusahaan
                </label>
                <input
                  type="text"
                  value={editingUser.organizationName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, organizationName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={editingUser.position}
                  onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Bank Pencairan Otomatis
                </label>
                <input
                  type="text"
                  value={editingUser.bankName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, bankName: e.target.value })}
                  placeholder="Contoh: Bank Mandiri"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Rekening &amp; Atas Nama
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingUser.bankAccountNumber || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, bankAccountNumber: e.target.value })
                    }
                    placeholder="1480025086508"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono"
                  />
                  <input
                    type="text"
                    value={editingUser.bankAccountHolder || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, bankAccountHolder: e.target.value })
                    }
                    placeholder="MUHAJIRIN KASIM"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingUser.name.trim()) return;
                  onUpdateUser(editingUser, false);
                  setFeedbackMsg(
                    `ID Login ("${editingUser.loginId}"), Password, dan profil "${editingUser.name}" berhasil diperbarui.`
                  );
                  setEditingUser(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold"
              >
                Simpan ID &amp; Password
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingUser.name.trim()) return;
                  onUpdateUser(editingUser, true);
                  setFeedbackMsg(
                    `Data disimpan & Anda kini masuk sebagai "${editingUser.name}" (${getRoleLabel(
                      editingUser.role
                    )}).`
                  );
                  setEditingUser(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Simpan &amp; Masuk Sebagai Pengguna Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Admin / Pengguna */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Akun Admin / Pengguna?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun{' '}
                  <strong>{confirmDeleteUser.name}</strong> ({getRoleLabel(confirmDeleteUser.role)})
                  dari daftar pengguna SmartBuild?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(confirmDeleteUser.id);
                  setFeedbackMsg(`Akun "${confirmDeleteUser.name}" telah dihapus.`);
                  setConfirmDeleteUser(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SettingsViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  systemSettings: SystemSettings;
  appsScriptConfig: AppsScriptConfig;
  isOwnerUnlocked: boolean;
  onSetOwnerUnlocked: (unlocked: boolean) => void;
  onUpdateAppsScriptConfig: (next: AppsScriptConfig) => void;
  onReplaceDatabaseFromCloud: (cloudData: Partial<SmartBuildDatabase>) => void;
  onUpdateProfile: (updated: User) => void;
  onUpdateSystemSettings: (updated: SystemSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  db,
  currentUser,
  systemSettings,
  appsScriptConfig,
  isOwnerUnlocked,
  onSetOwnerUnlocked,
  onUpdateAppsScriptConfig,
  onReplaceDatabaseFromCloud,
  onUpdateProfile,
  onUpdateSystemSettings,
}) => {
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerPasswordError, setOwnerPasswordError] = useState<string | null>(null);

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [position, setPosition] = useState(currentUser.position);
  const [bimEndpoint, setBimEndpoint] = useState(systemSettings.bimAdapterEndpoint);
  const [rpcEndpoint, setRpcEndpoint] = useState(systemSettings.blockchainRpcAdapter);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Apps Script Integration state
  const [gasUrl, setGasUrl] = useState(appsScriptConfig.webAppUrl);
  const [autoSync, setAutoSync] = useState(appsScriptConfig.autoSync);
  const [activeCodeFile, setActiveCodeFile] = useState<'code.gs' | 'setup.gs'>('code.gs');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isTestingGas, setIsTestingGas] = useState(false);

  const handleUnlockOwnerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerSettingsPassword(ownerPasswordInput)) {
      setOwnerPasswordError(null);
      setOwnerPasswordInput('');
      onSetOwnerUnlocked(true);
    } else {
      setOwnerPasswordError(
        'Password salah! Halaman Pengaturan hanya dapat diakses oleh Pemilik Website Aplikasi.'
      );
    }
  };

  if (!isOwnerUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 text-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#071D49] dark:bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                Akses Terproteksi
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#071D49] dark:text-white mt-0.5">
                Verifikasi Pemilik Website Aplikasi
              </h1>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Menu <strong>Pengaturan Sistem Inti</strong> dikunci menggunakan password khusus pemilik
            website aplikasi untuk menjaga keamanan konfigurasi internal.
          </p>

          {ownerPasswordError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-medium">
              {ownerPasswordError}
            </div>
          )}

          <form onSubmit={handleUnlockOwnerSettings} className="space-y-4">
            <div>
              <label
                htmlFor="owner-settings-password"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Password Pemilik Website Aplikasi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  id="owner-settings-password"
                  type={showOwnerPassword ? 'text' : 'password'}
                  value={ownerPasswordInput}
                  onChange={(e) => {
                    setOwnerPasswordInput(e.target.value);
                    if (ownerPasswordError) setOwnerPasswordError(null);
                  }}
                  placeholder="Masukkan password pemilik..."
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showOwnerPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#1264F4] hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Pengaturan Pemilik</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleCopyCode = (fileName: 'code.gs' | 'setup.gs') => {
    const content = fileName === 'code.gs' ? CODE_GS_SOURCE : SETUP_GS_SOURCE;
    navigator.clipboard?.writeText(content);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDownloadCode = (fileName: 'code.gs' | 'setup.gs') => {
    const content = fileName === 'code.gs' ? CODE_GS_SOURCE : SETUP_GS_SOURCE;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    setIsTestingGas(true);
    const res = await testAppsScriptConnection(gasUrl);
    setIsTestingGas(false);
    onUpdateAppsScriptConfig({
      ...appsScriptConfig,
      webAppUrl: gasUrl.trim(),
      autoSync,
      connectionStatus: res.ok ? 'connected' : 'error',
      lastMessage: res.message,
    });
  };

  const handlePushToSheets = async () => {
    setIsTestingGas(true);
    const res = await syncDatabaseToAppsScript(gasUrl, db);
    setIsTestingGas(false);
    onUpdateAppsScriptConfig({
      ...appsScriptConfig,
      webAppUrl: gasUrl.trim(),
      autoSync,
      lastSyncedAt: res.timestamp || appsScriptConfig.lastSyncedAt,
      connectionStatus: res.ok ? 'connected' : 'error',
      lastMessage: res.message,
    });
  };

  const handlePullFromSheets = async () => {
    setIsTestingGas(true);
    const res = await pullDatabaseFromAppsScript(gasUrl);
    setIsTestingGas(false);
    if (res.ok && res.data) {
      onReplaceDatabaseFromCloud(res.data);
    }
    onUpdateAppsScriptConfig({
      ...appsScriptConfig,
      webAppUrl: gasUrl.trim(),
      autoSync,
      lastSyncedAt: res.ok ? new Date().toISOString() : appsScriptConfig.lastSyncedAt,
      connectionStatus: res.ok ? 'connected' : 'error',
      lastMessage: res.message,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-1">
            <Unlock className="w-3.5 h-3.5" />
            <span>Akses Pemilik Website Aplikasi Terbuka</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Pengaturan Sistem, Database Google Apps Script &amp; Deployment Vercel
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Konfigurasi database Google Sheets berbasis Apps Script (`code.gs` &amp; `setup.gs`),
            integrasi Vercel (`vercel.app`), serta profil pengguna.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSetOwnerUnlocked(false)}
          className="px-3.5 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Kunci Pengaturan</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
          {savedMsg}
        </div>
      )}

      {/* GOOGLE APPS SCRIPT DATABASE CONFIGURATION & CODE GENERATOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1264F4]/10 text-[#1264F4] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                Server Database Google Apps Script (`code.gs` &amp; `setup.gs`)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan aplikasi SmartBuild dengan Google Spreadsheet sebagai database cloud
                menggunakan 2 file script di bawah.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono">
            Status:{' '}
            <strong
              className={
                appsScriptConfig.connectionStatus === 'connected'
                  ? 'text-[#10B981]'
                  : appsScriptConfig.connectionStatus === 'error'
                  ? 'text-red-500'
                  : 'text-[#1264F4] dark:text-blue-400'
              }
            >
              {appsScriptConfig.connectionStatus.toUpperCase()}
            </strong>
          </div>
        </div>

        {/* VERCEL ENVIRONMENT VARIABLE QUICK SETUP BOX */}
        <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="font-bold text-[#071D49] dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#1264F4] dark:text-blue-400" />
              <span>Integrasi Environment Variable di Vercel Saat Publish:</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[11px] w-fit ${
                appsScriptConfig.isFromEnv
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-blue-100 dark:bg-blue-900/70 text-[#1264F4] dark:text-blue-300'
              }`}
            >
              {appsScriptConfig.isFromEnv
                ? `Terdeteksi dari Env: ${appsScriptConfig.envVarName || 'VITE_APPS_SCRIPT_URL'}`
                : 'Siap Menerima Env Vercel'}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Ketika Anda mem-publish aplikasi ini di <strong>Vercel</strong>, buka{' '}
            <strong>Project Settings &rarr; Environment Variables</strong> di dashboard Vercel, lalu
            tambahkan variabel berikut agar aplikasi otomatis terhubung ke database Google Sheets
            Apps Script tanpa perlu input manual:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Key / Nama Environment Variable (Utama)
                </div>
                <code className="font-mono font-bold text-[#1264F4] dark:text-blue-400 text-xs">
                  VITE_APPS_SCRIPT_URL
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('VITE_APPS_SCRIPT_URL');
                  setSavedMsg('Nama variabel VITE_APPS_SCRIPT_URL berhasil disalin!');
                }}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Salin Key</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Value / Nilai Environment Variable
              </div>
              <code className="font-mono text-slate-700 dark:text-slate-200 text-[11px] break-all">
                {gasUrl || 'https://script.google.com/macros/s/AKfycbz.../exec'}
              </code>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Catatan: Sistem juga otomatis mengenali nama variabel{' '}
            <code className="font-mono font-semibold">APPS_SCRIPT_URL</code> atau{' '}
            <code className="font-mono font-semibold">GAS_URL</code> jika Anda memasukkannya tanpa
            awalan <code className="font-mono">VITE_</code> di Vercel.
          </div>
        </div>

        {/* Web App URL Form & Sync Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-xs">
          <div className="lg:col-span-7">
            <label
              htmlFor="gas-webapp-url"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Google Apps Script Web App URL (`https://script.google.com/macros/s/.../exec`)
            </label>
            <input
              id="gas-webapp-url"
              type="url"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbz.../exec"
              className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono text-xs"
            />
          </div>

          <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isTestingGas}
              onClick={() => {
                onUpdateAppsScriptConfig({
                  ...appsScriptConfig,
                  webAppUrl: gasUrl.trim(),
                  autoSync,
                  lastMessage: 'Konfigurasi URL Google Apps Script disimpan.',
                });
                setSavedMsg('Konfigurasi Google Apps Script berhasil disimpan.');
              }}
              className="px-3.5 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold"
            >
              Simpan URL
            </button>
            <button
              type="button"
              disabled={isTestingGas}
              onClick={handleTestConnection}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
              <span>Uji Koneksi</span>
            </button>
            <button
              type="button"
              disabled={isTestingGas}
              onClick={handlePushToSheets}
              className="px-3.5 py-2 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Push 18 Tabel</span>
            </button>
            <button
              type="button"
              disabled={isTestingGas}
              onClick={handlePullFromSheets}
              className="px-3.5 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>Pull Data</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
          <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => {
                setAutoSync(e.target.checked);
                onUpdateAppsScriptConfig({
                  ...appsScriptConfig,
                  webAppUrl: gasUrl.trim(),
                  autoSync: e.target.checked,
                });
              }}
              className="rounded border-slate-300"
            />
            <span>Sinkronisasi Otomatis (Auto-Sync) ke Google Apps Script setiap perubahan data</span>
          </label>
          <span className="text-slate-500 dark:text-slate-400">{appsScriptConfig.lastMessage}</span>
        </div>

        {/* Code Viewer for code.gs and setup.gs */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setActiveCodeFile('code.gs')}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                  activeCodeFile === 'code.gs'
                    ? 'bg-[#1264F4] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                1. code.gs (REST API Backend)
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeFile('setup.gs')}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                  activeCodeFile === 'setup.gs'
                    ? 'bg-[#1264F4] text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                2. setup.gs (18 Tabel Schema Setup)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(activeCodeFile)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                {copiedFile === activeCodeFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin {activeCodeFile}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCode(activeCodeFile)}
                className="px-3 py-1.5 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh {activeCodeFile}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 border border-slate-800">
            <code>{activeCodeFile === 'code.gs' ? CODE_GS_SOURCE : SETUP_GS_SOURCE}</code>
          </pre>
        </div>
      </div>

      {/* VERCEL DEPLOYMENT READINESS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#071D49] dark:text-white">
          <Globe className="w-5 h-5 text-[#1264F4]" />
          <h2 className="text-base font-bold">
            Integrasi Deployment `vercel.app` (`vercel.json` &amp; `.npmrc` Terkonfigurasi)
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Konflik <code>esbuild</code> peer dependency pada build Vercel telah diperbaiki melalui{' '}
          <code>package.json</code>, <code>.npmrc</code> (<code>legacy-peer-deps=true</code>), dan{' '}
          <code>vercel.json</code> (<code>&quot;installCommand&quot;: &quot;npm install --legacy-peer-deps&quot;</code>).
          Masukkan URL Web App Google Apps Script Anda pada menu Environment Variables di Vercel
          dengan key <code>VITE_APPS_SCRIPT_URL</code> (atau <code>APPS_SCRIPT_URL</code>) saat
          publish.
        </p>
      </div>

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
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 text-xs"
        >
          <h2 className="text-base font-bold text-[#071D49] dark:text-white">
            Pengaturan Profil Akun
          </h2>
          <div>
            <label
              htmlFor="prof-name"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nama Lengkap
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="prof-pos"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Jabatan
            </label>
            <input
              id="prof-pos"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
            />
          </div>
          <div>
            <label
              htmlFor="prof-phone"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nomor Telepon
            </label>
            <input
              id="prof-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
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
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 text-xs"
        >
          <h2 className="text-base font-bold text-[#071D49] dark:text-white">
            Pengaturan Sistem &amp; Adapter Integrasi
          </h2>
          <div>
            <label
              htmlFor="sys-bim"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Endpoint Adapter API BIM (Tahap 2 Ready)
            </label>
            <input
              id="sys-bim"
              type="text"
              value={bimEndpoint}
              onChange={(e) => setBimEndpoint(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
            />
          </div>
          <div>
            <label
              htmlFor="sys-rpc"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Endpoint RPC Smart Contract Adapter
            </label>
            <input
              id="sys-rpc"
              type="text"
              value={rpcEndpoint}
              onChange={(e) => setRpcEndpoint(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
            />
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            Catatan Keamanan: Aplikasi tidak menyimpan private key atau secret wallet di sisi
            frontend. Otorisasi transaksi produksi wajib melalui backend gateway terenkripsi.
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#071D49] dark:bg-slate-800 text-white font-semibold rounded-lg"
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
    '1. Pengguna Jasa (Citra Ayu Deswina Maharani) dan Penyedia Jasa (Muhajirin Kasim) masuk menggunakan ID Akun & Password masing-masing.',
    '2. Pengguna Jasa mendaftarkan proyek Pembangunan Rumah di Gang Mahanggi Tenggarong beserta nilai kontrak dan dokumen teknis.',
    '3. Kedua belah pihak menyepakati Kontrak Digital yang membagi pekerjaan menjadi 4 tahapan utama (Pondasi 25%, Struktur 30%, Dinding & Atap 25%, Finishing 20%).',
    '4. Sistem menghubungkan jadwal tahapan pekerjaan dengan rekening pencairan otomatis Penyedia Jasa (Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM).',
    '5. Kontraktor melaksanakan pekerjaan konstruksi di lapangan sesuai spesifikasi.',
    '6. Kontraktor mengunggah Bukti Digital (Digital Evidence berupa file foto lapangan & dokumen PDF/berita acara) pada menu Progress Proyek.',
    '7. Verifikator / Pengawas memeriksa file Bukti Digital yang diunggah kontraktor dan memvalidasi kesesuaian bangunan pada BIM Viewer 3D.',
    '8. Verifikator memberikan persetujuan (100%), permintaan revisi, atau penolakan terhadap progres tahapan yang diajukan.',
    '9. Begitu tahapan pekerjaan disetujui 100% oleh Verifikator, Smart Contract otomatis mencairkan dana termin ke rekening Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM.',
    '10. Bukti pencairan dan riwayat transaksi tercatat otomatis dan dapat diekspor ke PDF maupun Excel (CSV).',
    '11. Super Admin dapat mengelola ID Login, Password, dan hak akses seluruh pengguna pada menu Pengguna.',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
        <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
          Pusat Bantuan &amp; Panduan Alur Kerja SmartBuild
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Dokumentasi alur kerja standar pengelolaan kontrak konstruksi, pengiriman bukti digital
          kontraktor, verifikasi BIM, dan pencairan pembayaran otomatis berbasis Smart Contract.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
        <h2 className="text-base font-bold text-[#071D49] dark:text-white">
          Alur Kerja Utama Aplikasi (End-to-End Workflow)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflowSteps.map((step) => (
            <div
              key={step}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium leading-relaxed"
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

