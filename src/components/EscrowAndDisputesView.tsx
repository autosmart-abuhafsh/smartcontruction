import React, { useRef, useState } from 'react';
import {
  Cpu,
  Scale,
  CheckCircle2,
  Upload,
  X,
  MessageSquarePlus,
  ShieldAlert,
} from 'lucide-react';
import { SmartBuildDatabase, User } from '../types/smartbuild';
import { formatRupiah, generateUniqueId } from '../utils/calculations';

/* ============================================================================
 * MODUL ESCROW MANAGEMENT & WORKFLOW SMART CONTRACT H0-H200 [DEMO SIMULATION]
 * ========================================================================== */

type EscrowStateMachineCode =
  | 'H0_DEPOSIT'
  | 'H0_H180_EXECUTION_EVIDENCE'
  | 'H180_H185_VALIDATION'
  | 'BRANCH_B_H185_HELD'
  | 'BRANCH_A1_H188_MUTUAL_RELEASE'
  | 'BRANCH_A2_H190_OBJECTION_PROVEN'
  | 'BRANCH_A3_H195_REPAIR_VALIDATED';

interface EscrowStageItem {
  id: string;
  projectKey: string;
  label: string;
  weightPct: number;
  nominal: number;
  stateCode: EscrowStateMachineCode;
  positionDay: string;
}

interface EscrowProjectPreset {
  key: string;
  name: string;
  totalDeposit: number;
  lockedBalance: number;
  releasedAmount: number;
  contractAddress: string;
  contractStateLabel: string;
}

const ESCROW_PROJECT_PRESETS: EscrowProjectPreset[] = [
  {
    key: 'aula',
    name: 'Pembangunan Gedung Aula',
    totalDeposit: 450000000,
    lockedBalance: 337500000,
    releasedAmount: 112500000,
    contractAddress: '0xDEMO71C94F2A8E3B9D10293847...',
    contractStateLabel: 'SEBAGIAN_DICAIRKAN',
  },
  {
    key: 'mahanggi',
    name: 'Pembangunan Rumah di Gang Mahanggi Tenggarong',
    totalDeposit: 100000000,
    lockedBalance: 45000000,
    releasedAmount: 55000000,
    contractAddress: '0xDEMO88B2E41F90C12A75349182...',
    contractStateLabel: 'SEBAGIAN_DICAIRKAN',
  },
  {
    key: 'kantor',
    name: 'Renovasi Kantor Pusat',
    totalDeposit: 320000000,
    lockedBalance: 224000000,
    releasedAmount: 96000000,
    contractAddress: '0xDEMO54A19C83D7E20491827364...',
    contractStateLabel: 'SEBAGIAN_DICAIRKAN',
  },
];

const INITIAL_ESCROW_STAGES: EscrowStageItem[] = [
  {
    id: 'esc-aula-2',
    projectKey: 'aula',
    label: 'Tahap 2: Struktur Bangunan (30%)',
    weightPct: 30,
    nominal: 135000000,
    stateCode: 'H180_H185_VALIDATION',
    positionDay: 'H185',
  },
  {
    id: 'esc-aula-1',
    projectKey: 'aula',
    label: 'Tahap 1: Pekerjaan Pondasi K-350 (25%)',
    weightPct: 25,
    nominal: 112500000,
    stateCode: 'BRANCH_A1_H188_MUTUAL_RELEASE',
    positionDay: 'H188',
  },
  {
    id: 'esc-aula-3',
    projectKey: 'aula',
    label: 'Tahap 3: Dinding & Rangka Atap (25%)',
    weightPct: 25,
    nominal: 112500000,
    stateCode: 'H0_H180_EXECUTION_EVIDENCE',
    positionDay: 'H180',
  },
  {
    id: 'esc-mahanggi-3',
    projectKey: 'mahanggi',
    label: 'Tahap 3: Dinding dan Atap (25%)',
    weightPct: 25,
    nominal: 25000000,
    stateCode: 'H180_H185_VALIDATION',
    positionDay: 'H185',
  },
  {
    id: 'esc-mahanggi-2',
    projectKey: 'mahanggi',
    label: 'Tahap 2: Struktur (30%)',
    weightPct: 30,
    nominal: 30000000,
    stateCode: 'BRANCH_A1_H188_MUTUAL_RELEASE',
    positionDay: 'H188',
  },
  {
    id: 'esc-mahanggi-1',
    projectKey: 'mahanggi',
    label: 'Tahap 1: Pondasi (25%)',
    weightPct: 25,
    nominal: 25000000,
    stateCode: 'BRANCH_A1_H188_MUTUAL_RELEASE',
    positionDay: 'H188',
  },
  {
    id: 'esc-kantor-2',
    projectKey: 'kantor',
    label: 'Tahap 2: Struktur Balok (30%)',
    weightPct: 30,
    nominal: 96000000,
    stateCode: 'BRANCH_A2_H190_OBJECTION_PROVEN',
    positionDay: 'H190',
  },
];

interface EscrowWorkflowViewProps {
  db: SmartBuildDatabase;
}

export const EscrowWorkflowView: React.FC<EscrowWorkflowViewProps> = ({ db }) => {
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('aula');
  const [stages, setStages] = useState<EscrowStageItem[]>(INITIAL_ESCROW_STAGES);
  const [selectedStageId, setSelectedStageId] = useState<string>('esc-aula-2');
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  const projectStages = stages.filter((s) => s.projectKey === selectedProjectKey);
  const activeStage =
    projectStages.find((s) => s.id === selectedStageId) || projectStages[0];

  // Calculate dynamic values for Rumah Gang Mahanggi if selected
  const mahanggiPaid = db.payment_schedules
    .filter((s) => s.projectId === 'prj-001' && s.status === 'Berhasil')
    .reduce((sum, s) => sum + s.nominal, 0);
  const mahanggiTotal = db.projects[0]?.contractValue || 100000000;

  const basePreset =
    ESCROW_PROJECT_PRESETS.find((p) => p.key === selectedProjectKey) ||
    ESCROW_PROJECT_PRESETS[0];

  const activePreset: EscrowProjectPreset =
    selectedProjectKey === 'mahanggi'
      ? {
          ...basePreset,
          totalDeposit: mahanggiTotal,
          releasedAmount: mahanggiPaid,
          lockedBalance: Math.max(0, mahanggiTotal - mahanggiPaid),
        }
      : basePreset;

  const handleProjectChange = (nextKey: string) => {
    setSelectedProjectKey(nextKey);
    const firstStage = stages.find((s) => s.projectKey === nextKey);
    if (firstStage) {
      setSelectedStageId(firstStage.id);
    }
  };

  const triggerStateSimulation = (
    nextState: EscrowStateMachineCode,
    nextDay: string,
    description: string
  ) => {
    if (!activeStage) return;
    setStages((prev) =>
      prev.map((s) =>
        s.id === activeStage.id
          ? { ...s, stateCode: nextState, positionDay: nextDay }
          : s
      )
    );
    setSimulationNotice(
      `[State Machine Updated] ${activeStage.label} -> Posisi ${nextDay} (${nextState}): ${description}`
    );
  };

  const currentCode = activeStage?.stateCode || 'H180_H185_VALIDATION';
  const currentDay = activeStage?.positionDay || 'H185';

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
              Escrow Management &amp; Workflow Smart Contract H0–H200 [DEMO SIMULATION]
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulasi penyimpanan dana Escrow dan State Machine alur keputusan H0–H200 sesuai
              diagram konsep klien.
            </p>
          </div>
        </div>

        <select
          aria-label="Pilih Proyek Escrow Smart Contract"
          value={selectedProjectKey}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-w-[230px]"
        >
          <option value="aula">Pembangunan Gedung Aula</option>
          <option value="mahanggi">Pembangunan Rumah di Gang Mahanggi Tenggarong</option>
          <option value="kantor">Renovasi Kantor Pusat</option>
        </select>
      </div>

      {simulationNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between gap-2"
        >
          <span className="font-mono font-semibold">{simulationNotice}</span>
          <button
            type="button"
            onClick={() => setSimulationNotice(null)}
            className="text-sky-700 dark:text-sky-300 font-bold"
            aria-label="Tutup pesan simulasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Summary Cards matching image_2d88749b.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Setoran Escrow (H0)
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#0F172A] dark:text-white">
            Rp {activePreset.totalDeposit.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] font-mono text-slate-400">[SIMULASI DEMO]</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Saldo Dana Ditahan (Terkunci)
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#D97706]">
            Rp {activePreset.lockedBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400">Dijaga oleh Rule Engine</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Dana Dicairkan</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#059669]">
            Rp {activePreset.releasedAmount.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400">Lulus Verifikasi &amp; MFA</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Alamat Smart Contract [DEMO]
          </div>
          <div className="text-xs font-mono font-bold text-[#0369A1] dark:text-sky-400 truncate pt-1">
            {activePreset.contractAddress}
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {activePreset.contractStateLabel}
          </div>
        </div>
      </div>

      {/* DIAGRAM STATE MACHINE ALUR SMART CONTRACT (H0 s/d H200) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="space-y-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
              Diagram State Machine Alur Smart Contract (H0 s/d H200)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih tahapan pembayaran untuk melihat posisi state machine dan menguji cabang
              keputusan Cabang A (Syarat Terpenuhi) maupun Cabang B (Syarat Tidak Terpenuhi).
            </p>
          </div>

          <select
            aria-label="Pilih tahapan pembayaran state machine"
            value={activeStage?.id || ''}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="w-full md:w-[520px] px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {projectStages.map((stg) => (
              <option key={stg.id} value={stg.id}>
                {stg.label} — Posisi: {stg.positionDay} ({stg.stateCode})
              </option>
            ))}
          </select>
        </div>

        {/* ROW 1: 4 State Cards (H0, H0-H180, H180-H185, CABANG B) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: H0 */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'H0_DEPOSIT',
                'H0',
                'Pengguna jasa menyetorkan dana penuh ke Smart Contract Escrow.'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'H0_DEPOSIT'
                ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/40'
                : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/40 hover:bg-slate-100/70'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              1. H0 — Setoran Dana
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pengguna jasa menyetorkan dana ke Smart Contract Escrow.
            </p>
          </button>

          {/* Card 2: H0-H180 */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'H0_H180_EXECUTION_EVIDENCE',
                'H180',
                'Periode pelaksanaan pekerjaan & maksimal H180 penilaian bukti digital.'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'H0_H180_EXECUTION_EVIDENCE'
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-blue-400/40'
                : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/40 hover:bg-slate-100/70'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              2. H0–H180 — Pelaksanaan &amp; Bukti
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Periode pelaksanaan pekerjaan &amp; maksimal H180 penilaian bukti digital.
            </p>
          </button>

          {/* Card 3: H180-H185 */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'H180_H185_VALIDATION',
                'H185',
                'Validasi persyaratan kontrak oleh Pengawas, Verifikator, dan Rule Engine.'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'H180_H185_VALIDATION'
                ? 'border-[#38BDF8] bg-[#F0F9FF] dark:bg-sky-950/50 ring-2 ring-sky-400/40'
                : 'border-[#BAE6FD] dark:border-sky-800 bg-[#F0F9FF]/60 dark:bg-sky-950/20 hover:bg-[#F0F9FF]'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              3. H180–H185 — Proses Validasi
            </div>
            <p className="text-xs text-[#0369A1] dark:text-sky-300 leading-relaxed">
              Validasi persyaratan kontrak oleh Pengawas, Verifikator, dan Rule Engine.
            </p>
          </button>

          {/* Card 4: CABANG B (H185) */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'BRANCH_B_H185_HELD',
                'H185 (Cabang B)',
                'Syarat tidak terpenuhi: Dana tetap tertahan di Smart Contract Escrow.'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'BRANCH_B_H185_HELD'
                ? 'border-[#F59E0B] bg-[#FEF3C7] dark:bg-amber-950/60 ring-2 ring-amber-400/50'
                : 'border-[#FCD34D] dark:border-amber-800 bg-[#FFFBEB] dark:bg-amber-950/25 hover:bg-[#FEF3C7]/70'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              CABANG B (H185) — Syarat Tidak Terpenuhi
            </div>
            <p className="text-xs text-[#B45309] dark:text-amber-300 leading-relaxed">
              Dana tetap tertahan. Pencairan tidak dilakukan sampai persyaratan terpenuhi.
            </p>
          </button>
        </div>

        {/* ROW 2: 3 Branch Cards (CABANG A.1, CABANG A.2, CABANG A.3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* CABANG A.1 (H188) */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'BRANCH_A1_H188_MUTUAL_RELEASE',
                'H188',
                'Cabang A.1: Syarat terpenuhi & kedua pihak menyetujui pencairan dana H188.'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'BRANCH_A1_H188_MUTUAL_RELEASE'
                ? 'border-[#10B981] bg-[#D1FAE5] dark:bg-emerald-950/60 ring-2 ring-emerald-400/50'
                : 'border-[#6EE7B7] dark:border-emerald-800 bg-[#ECFDF5] dark:bg-emerald-950/25 hover:bg-[#D1FAE5]/60'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              CABANG A.1 (H188) — Kedua Pihak Setuju
            </div>
            <p className="text-xs text-[#047857] dark:text-emerald-300 leading-relaxed">
              Syarat terpenuhi &amp; kedua pihak menyetujui: H188 proses pencairan dana sesuai
              ketentuan.
            </p>
          </button>

          {/* CABANG A.2 (H190 -> H195 -> H200) */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'BRANCH_A2_H190_OBJECTION_PROVEN',
                'H190',
                'Cabang A.2: Keberatan terbukti (H190) -> Wajib perbaikan & validasi bukti (H195) -> Pencairan (H200).'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'BRANCH_A2_H190_OBJECTION_PROVEN'
                ? 'border-[#A855F7] bg-[#F3E8FF] dark:bg-purple-950/60 ring-2 ring-purple-400/50'
                : 'border-[#E9D5FF] dark:border-purple-800 bg-[#FAF5FF] dark:bg-purple-950/25 hover:bg-[#F3E8FF]/60'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              CABANG A.2 (H190 → H195 → H200) — Keberatan Terbukti
            </div>
            <p className="text-xs text-[#7E22CE] dark:text-purple-300 leading-relaxed">
              Pembuktian ketidaksesuaian terbukti (H190) → Perbaikan &amp; validasi bukti (H195) →
              Pencairan (H200).
            </p>
          </button>

          {/* CABANG A.3 (H195) */}
          <button
            type="button"
            onClick={() =>
              triggerStateSimulation(
                'BRANCH_A3_H195_REPAIR_VALIDATED',
                'H195',
                'Cabang A.3 / H195: Perbaikan divalidasi atau keberatan tidak terbukti -> Proses pencairan dana.'
              )
            }
            className={`text-left p-4 rounded-xl border transition-all space-y-1.5 ${
              currentCode === 'BRANCH_A3_H195_REPAIR_VALIDATED'
                ? 'border-[#14B8A6] bg-[#CCFBF1] dark:bg-teal-950/60 ring-2 ring-teal-400/50'
                : 'border-[#99F6E4] dark:border-teal-800 bg-[#F0FDFA] dark:bg-teal-950/25 hover:bg-[#CCFBF1]/60'
            }`}
          >
            <div className="font-mono font-bold text-xs text-[#0F172A] dark:text-white">
              CABANG A.3 (H195) — Keberatan Tidak Terbukti
            </div>
            <p className="text-xs text-[#0F766E] dark:text-teal-300 leading-relaxed">
              Jika ketidaksesuaian tidak terbukti: H195 proses pencairan dana sesuai ketentuan.
            </p>
          </button>
        </div>

        {/* DARK SIMULATION CONTROL BAR matching image_3396cf65.png */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0F172A] text-white space-y-3.5 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="text-slate-300">
              Tahap Aktif:{' '}
              <strong className="text-white font-bold">
                {activeStage?.label || 'Tahap 2: Struktur Bangunan (30%)'}
              </strong>
            </div>
            <div className="font-mono font-bold text-[#38BDF8]">
              State Saat Ini: {currentCode} ({currentDay})
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                triggerStateSimulation(
                  'H0_H180_EXECUTION_EVIDENCE',
                  'H180',
                  'Simulasi H180: Penilaian Bukti Digital oleh Pengawas & Rule Engine.'
                )
              }
              className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 border border-slate-700 text-white font-mono font-bold text-xs transition-colors"
            >
              Simulasi H180: Penilaian Bukti
            </button>

            <button
              type="button"
              onClick={() =>
                triggerStateSimulation(
                  'H180_H185_VALIDATION',
                  'H185',
                  'Simulasi H185: Validasi Syarat Kontrak (Evaluasi Cabang A / Cabang B).'
                )
              }
              className="px-3.5 py-2 rounded-lg bg-[#0369A1] hover:bg-sky-600 text-white font-mono font-bold text-xs transition-colors"
            >
              Simulasi H185: Validasi Syarat (Cabang A/B)
            </button>

            <button
              type="button"
              onClick={() =>
                triggerStateSimulation(
                  'BRANCH_B_H185_HELD',
                  'H185 (Sengketa/Hold)',
                  'Simulasi Keberatan Salah Satu Pihak: Pencairan ditahan otomatis oleh Smart Contract.'
                )
              }
              className="px-3.5 py-2 rounded-lg bg-[#D97706] hover:bg-amber-600 text-white font-mono font-bold text-xs transition-colors"
            >
              Simulasi Keberatan Salah Satu Pihak
            </button>

            <button
              type="button"
              onClick={() =>
                triggerStateSimulation(
                  'BRANCH_A2_H190_OBJECTION_PROVEN',
                  'H190',
                  'Simulasi H190: Ketidaksesuaian terbukti, kontraktor wajib melakukan perbaikan lapangan.'
                )
              }
              className="px-3.5 py-2 rounded-lg bg-[#7E22CE] hover:bg-purple-600 text-white font-mono font-bold text-xs transition-colors"
            >
              Simulasi H190: Terbukti Tidak Sesuai
            </button>

            <button
              type="button"
              onClick={() =>
                triggerStateSimulation(
                  'BRANCH_A3_H195_REPAIR_VALIDATED',
                  'H195',
                  'Simulasi H195: Perbaikan lapangan selesai & bukti divalidasi -> Dana siap dicairkan (H200).'
                )
              }
              className="px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-teal-600 text-white font-mono font-bold text-xs transition-colors"
            >
              Simulasi H195: Perbaikan &amp; Validasi Bukti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MODUL SENGKETA: MANAJEMEN KEBERATAN & PENYELESAIAN SENGKETA KONSTRUKSI (PRD 15)
 * ========================================================================== */

interface DisputeResponseItem {
  id: string;
  actorName: string;
  actorOrgAndRole: string;
  timestamp: string;
  message: string;
}

interface ConstructionDisputeRecord {
  id: string;
  projectName: string;
  stageName: string;
  title: string;
  statusLabel: 'Selesai (Menahan Pencairan)' | 'Aktif (Menahan Pencairan)' | 'Selesai (Dana Dicairkan)';
  isResolved: boolean;
  submittedBy: string;
  submittedRole: string;
  submittedAt: string;
  evidenceFileName: string;
  responses: DisputeResponseItem[];
  finalDecision?: {
    verdictTitle: string;
    basisText: string;
    authorityText: string;
  };
}

const INITIAL_DISPUTE_RECORDS: ConstructionDisputeRecord[] = [
  {
    id: 'dsp-1',
    projectName: 'Renovasi Kantor Pusat',
    stageName: 'Tahap 2: Struktur Balok (30%)',
    title:
      'Keberatan atas kerapian sambungan grouting perkuatan balok lantai 3 pada area koridor timur (Simulasi Riwayat Sengketa H185–H195 DEMO).',
    statusLabel: 'Selesai (Menahan Pencairan)',
    isResolved: true,
    submittedBy: 'Citra Ayu Deswina Maharani',
    submittedRole: 'PROJECT_OWNER',
    submittedAt: '2026-09-24 10:15 WIB',
    evidenceFileName: 'temuan_grouting_balok_lt3.jpg',
    responses: [
      {
        id: 'resp-1',
        actorName: 'Muhajirin Kasim (Muhajirin Kasim Konstruksi)',
        actorOrgAndRole: 'CONTRACTOR',
        timestamp: '2026-09-25 14:00 WIB',
        message:
          'Telah dilakukan injeksi epoksi ulang dan perataan permukaan grouting sesuai arahan Konsultan Pengawas pada H195.',
      },
      {
        id: 'resp-2',
        actorName: 'Ir. Dian Permatasari, MT (Konsultan Pengawas)',
        actorOrgAndRole: 'PROJECT_SUPERVISOR',
        timestamp: '2026-09-27 11:30 WIB',
        message:
          'Pemeriksaan ulang lapangan menunjukkan hasil perbaikan grouting telah padat dan memenuhi spesifikasi struktural.',
      },
    ],
    finalDecision: {
      verdictTitle: 'Keputusan Akhir: Terbukti (Wajib Perbaikan H190–H195)',
      basisText:
        'Dasar Keputusan: Perbaikan H195 telah dilaksanakan oleh kontraktor dan divalidasi oleh Pengawas Independen sehingga pencairan dilanjutkan.',
      authorityText:
        'Ditetapkan oleh Pihak Berwenang: Ir. Dian Permatasari, MT & Citra Ayu Deswina Maharani (2026-09-28 09:45 WIB)',
    },
  },
];

const PROJECT_STAGE_OPTIONS: Record<string, string[]> = {
  'Pembangunan Gedung Aula': [
    'Tahap 2: Struktur Bangunan (30%) (Menunggu persetujuan)',
    'Tahap 3: Dinding Bata Ringan & Akustik (25%) (Dalam Proses)',
    'Tahap 4: Rangka Atap Space Truss (20%) (Belum Dimulai)',
  ],
  'Pembangunan Rumah di Gang Mahanggi Tenggarong': [
    'Tahap 3: Dinding dan Atap (25%) (Menunggu verifikasi)',
    'Tahap 2: Struktur Bangunan (30%) (Selesai)',
    'Tahap 4: Finishing (20%) (Belum Dimulai)',
  ],
  'Renovasi Kantor Pusat': [
    'Tahap 2: Struktur Balok (30%) (Menunggu persetujuan)',
    'Tahap 3: Dinding Partisi & Fasad (25%) (Dalam Proses)',
  ],
};

interface DisputeManagementViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
}

export const DisputeManagementView: React.FC<DisputeManagementViewProps> = ({
  currentUser,
}) => {
  const [disputes, setDisputes] = useState<ConstructionDisputeRecord[]>(INITIAL_DISPUTE_RECORDS);
  const [selectedProject, setSelectedProject] = useState<string>('Pembangunan Gedung Aula');
  const [selectedStage, setSelectedStage] = useState<string>(
    PROJECT_STAGE_OPTIONS['Pembangunan Gedung Aula'][0]
  );
  const [reasonInput, setReasonInput] = useState<string>('');
  const [evidenceInput, setEvidenceInput] = useState<string>(
    'laporan_ketidaksesuaian_spesifikasi.pdf'
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const evidenceFileRef = useRef<HTMLInputElement | null>(null);

  const handleProjectSelectChange = (nextProj: string) => {
    setSelectedProject(nextProj);
    const opts = PROJECT_STAGE_OPTIONS[nextProj] || [];
    setSelectedStage(opts[0] || 'Tahap 2: Struktur Bangunan (30%)');
  };

  const handleEvidenceFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceInput(file.name);
    e.target.value = '';
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setFormError('Mohon isi alasan keberatan atau ketidaksesuaian spesifikasi kontrak.');
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' WIB';
    const nextNum = disputes.length + 1;
    const cleanStage = selectedStage.replace(/\s*\(Menunggu.*\)|\s*\(Dalam.*\)/i, '');

    const newDispute: ConstructionDisputeRecord = {
      id: `dsp-${nextNum}`,
      projectName: selectedProject,
      stageName: cleanStage,
      title: reasonInput.trim(),
      statusLabel: 'Aktif (Menahan Pencairan)',
      isResolved: false,
      submittedBy: currentUser.name,
      submittedRole:
        currentUser.role === 'client'
          ? 'PROJECT_OWNER'
          : currentUser.role === 'contractor'
          ? 'CONTRACTOR'
          : 'PROJECT_SUPERVISOR',
      submittedAt: nowStr,
      evidenceFileName: evidenceInput.trim() || 'laporan_ketidaksesuaian_spesifikasi.pdf',
      responses: [
        {
          id: generateUniqueId('resp'),
          actorName: 'Smart Contract Rule Engine',
          actorOrgAndRole: 'AUTOMATED_ESCROW_GUARD',
          timestamp: nowStr,
          message:
            'Pencairan dana tahapan ini otomatis dikunci (HOLD H185) hingga pemeriksaan teknis dan keputusan sengketa ditetapkan.',
        },
      ],
    };

    setDisputes((prev) => [newDispute, ...prev]);
    setReasonInput('');
    setFormError(null);
    setFeedback(
      `Keberatan baru (${newDispute.id}) untuk "${selectedProject} — ${cleanStage}" berhasil diajukan. Smart Contract otomatis menahan pencairan dana tahapan terkait.`
    );
  };

  const handleAddDisputeResponse = (disputeId: string) => {
    const draft = (responseDrafts[disputeId] || '').trim();
    if (!draft) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' WIB';

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              responses: [
                ...d.responses,
                {
                  id: generateUniqueId('resp'),
                  actorName: `${currentUser.name} (${currentUser.organizationName})`,
                  actorOrgAndRole:
                    currentUser.role === 'contractor'
                      ? 'CONTRACTOR'
                      : currentUser.role === 'verifikator'
                      ? 'PROJECT_SUPERVISOR'
                      : 'PROJECT_OWNER',
                  timestamp: nowStr,
                  message: draft,
                },
              ],
            }
          : d
      )
    );
    setResponseDrafts((prev) => ({ ...prev, [disputeId]: '' }));
  };

  const handleResolveDispute = (disputeId: string, proven: boolean) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' WIB';
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              isResolved: true,
              statusLabel: 'Selesai (Menahan Pencairan)',
              finalDecision: proven
                ? {
                    verdictTitle: 'Keputusan Akhir: Terbukti (Wajib Perbaikan H190–H195)',
                    basisText:
                      'Dasar Keputusan: Perbaikan H195 telah dilaksanakan oleh kontraktor dan divalidasi oleh Pengawas Independen sehingga pencairan dilanjutkan.',
                    authorityText: `Ditetapkan oleh Pihak Berwenang: ${currentUser.name} (${nowStr})`,
                  }
                : {
                    verdictTitle:
                      'Keputusan Akhir: Keberatan Tidak Terbukti — Pencairan Dilanjutkan (H195)',
                    basisText:
                      'Dasar Keputusan: Hasil pemeriksaan menunjukkan pekerjaan telah sesuai spesifikasi kontrak awal.',
                    authorityText: `Ditetapkan oleh Pihak Berwenang: ${currentUser.name} (${nowStr})`,
                  },
            }
          : d
      )
    );
    setFeedback(`Keputusan akhir untuk sengketa ${disputeId} berhasil ditetapkan.`);
  };

  const stageOptions =
    PROJECT_STAGE_OPTIONS[selectedProject] ||
    PROJECT_STAGE_OPTIONS['Pembangunan Gedung Aula'];

  return (
    <div className="space-y-5">
      {/* Header Banner matching image_4f736c6f.png */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
            Manajemen Keberatan &amp; Penyelesaian Sengketa Konstruksi (Bagian 15 PRD)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Apabila terdapat sengketa aktif pada tahapan pembayaran, Smart Contract otomatis
            menahan proses pencairan dana sampai ada keputusan pihak berwenang.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2"
        >
          <span className="font-medium">{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold"
            aria-label="Tutup pesan sengketa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column Dispute List & New Objection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Daftar & Riwayat Sengketa */}
        <div className="lg:col-span-7 space-y-4">
          {disputes.map((dsp) => (
            <div
              key={dsp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs"
            >
              {/* Header Info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    ID: {dsp.id} · Proyek: {dsp.projectName} · {dsp.stageName}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white leading-snug">
                    {dsp.title}
                  </h2>
                </div>
                <span
                  className={`font-bold text-xs shrink-0 ${
                    dsp.isResolved
                      ? 'text-[#059669] dark:text-emerald-400'
                      : 'text-[#D97706] dark:text-amber-400'
                  }`}
                >
                  {dsp.statusLabel}
                </span>
              </div>

              {/* Submitter & Evidence Line */}
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Diajukan oleh:{' '}
                <strong className="text-slate-900 dark:text-white">{dsp.submittedBy}</strong> (
                {dsp.submittedRole}) pada{' '}
                <span className="font-mono">{dsp.submittedAt}</span> · Bukti:{' '}
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {dsp.evidenceFileName}
                </span>
              </div>

              {/* Tanggapan & Pemeriksaan */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                  Tanggapan &amp; Pemeriksaan:
                </div>

                {dsp.responses.map((resp) => (
                  <div
                    key={resp.id}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700 space-y-1"
                  >
                    <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                      {resp.actorName} ({resp.actorOrgAndRole}) ·{' '}
                      <span className="font-mono font-normal text-slate-500 dark:text-slate-400">
                        {resp.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {resp.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Final Decision Box OR Active Resolution Controls */}
              {dsp.finalDecision ? (
                <div className="p-4 rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/35 border border-[#A7F3D0] dark:border-emerald-800/80 space-y-1.5">
                  <div className="text-xs font-bold text-[#064E3B] dark:text-emerald-200">
                    {dsp.finalDecision.verdictTitle}
                  </div>
                  <p className="text-xs text-[#047857] dark:text-emerald-300 leading-relaxed">
                    {dsp.finalDecision.basisText}
                  </p>
                  <div className="font-mono text-[11px] text-[#065F46] dark:text-emerald-400 pt-0.5">
                    {dsp.finalDecision.authorityText}
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={responseDrafts[dsp.id] || ''}
                      onChange={(e) =>
                        setResponseDrafts((prev) => ({ ...prev, [dsp.id]: e.target.value }))
                      }
                      placeholder="Tambahkan tanggapan kontraktor atau hasil pemeriksaan pengawas..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDisputeResponse(dsp.id)}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>Kirim Tanggapan</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveDispute(dsp.id, true)}
                      className="px-3.5 py-2 rounded-lg bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tetapkan Terbukti &amp; Selesai Perbaikan (H190–H195)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveDispute(dsp.id, false)}
                      className="px-3.5 py-2 rounded-lg bg-[#0284C7] hover:bg-sky-700 text-white text-xs font-bold"
                    >
                      Tetapkan Tidak Terbukti &amp; Buka Kunci Dana (H195)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN (5 cols): Ajukan Keberatan / Sengketa Baru (H185) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
              Ajukan Keberatan / Sengketa Baru (H185)
            </h2>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
            <div>
              <label
                htmlFor="dsp-project"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Proyek
              </label>
              <select
                id="dsp-project"
                value={selectedProject}
                onChange={(e) => handleProjectSelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="Pembangunan Gedung Aula">Pembangunan Gedung Aula</option>
                <option value="Pembangunan Rumah di Gang Mahanggi Tenggarong">
                  Pembangunan Rumah di Gang Mahanggi Tenggarong
                </option>
                <option value="Renovasi Kantor Pusat">Renovasi Kantor Pusat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dsp-stage"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Tahap Pembayaran yang Dikeberatkan
              </label>
              <select
                id="dsp-stage"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                {stageOptions.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dsp-reason"
                className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Alasan Keberatan / Ketidaksesuaian Kontrak
              </label>
              <textarea
                id="dsp-reason"
                rows={4}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Jelaskan ketidaksesuaian spesifikasi pekerjaan terhadap kontrak awal..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <input
                ref={evidenceFileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleEvidenceFilePick}
                className="hidden"
              />
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="dsp-evidence"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Lampiran Bukti Keberatan
                </label>
                <button
                  type="button"
                  onClick={() => evidenceFileRef.current?.click()}
                  className="text-[11px] font-bold text-[#1264F4] dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Pilih File</span>
                </button>
              </div>
              <input
                id="dsp-evidence"
                type="text"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Ajukan Keberatan &amp; Kunci Pencairan Dana
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
