import React, { useRef, useState } from 'react';
import {
  Plus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Box,
  Upload,
  Link2,
  Eye,
  X,
  Info,
  Camera,
  FileText,
  Sparkles,
  Landmark,
  HelpCircle,
  ArrowRight,
  Download,
  Trash2,
} from 'lucide-react';
import {
  BimModel,
  BimObjectElement,
  ProgressAttachment,
  ProgressReport,
  SmartBuildDatabase,
  User,
  VerificationRecord,
  VerificationStatus,
} from '../types/smartbuild';
import {
  canPerformAction,
  formatDateID,
  formatRupiah,
  generateUniqueId,
} from '../utils/calculations';

// Built-in SVG Data URLs for realistic Digital Evidence photo previews
const SAMPLE_EVIDENCE_STAGE3_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#071D49"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#sky)"/>
  <rect x="0" y="310" width="640" height="90" fill="#0F172A"/>
  <!-- Brick Wall & Roof Truss Structure -->
  <rect x="130" y="150" width="380" height="160" fill="#B45309" stroke="#F59E0B" stroke-width="3"/>
  <!-- Brick pattern lines -->
  <line x1="130" y1="182" x2="510" y2="182" stroke="#78350F" stroke-width="2"/>
  <line x1="130" y1="214" x2="510" y2="214" stroke="#78350F" stroke-width="2"/>
  <line x1="130" y1="246" x2="510" y2="246" stroke="#78350F" stroke-width="2"/>
  <line x1="130" y1="278" x2="510" y2="278" stroke="#78350F" stroke-width="2"/>
  <!-- Concrete columns -->
  <rect x="125" y="145" width="22" height="165" fill="#94A3B8"/>
  <rect x="309" y="145" width="22" height="165" fill="#94A3B8"/>
  <rect x="493" y="145" width="22" height="165" fill="#94A3B8"/>
  <!-- Steel Roof Truss (Rangka Atap Baja Ringan) -->
  <polygon points="105,150 320,55 535,150" fill="rgba(56,189,248,0.22)" stroke="#38BDF8" stroke-width="4"/>
  <line x1="320" y1="55" x2="320" y2="150" stroke="#38BDF8" stroke-width="3"/>
  <line x1="212" y1="102" x2="212" y2="150" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="428" y1="102" x2="428" y2="150" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="212" y1="102" x2="320" y2="150" stroke="#38BDF8" stroke-width="2"/>
  <line x1="428" y1="102" x2="320" y2="150" stroke="#38BDF8" stroke-width="2"/>
  <!-- Timestamp & Geotag Watermark Banner -->
  <rect x="20" y="20" width="600" height="54" rx="8" fill="rgba(15,23,42,0.85)" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="36" y="43" fill="#38BDF8" font-family="monospace" font-size="13" font-weight="bold">DIGITAL EVIDENCE KONTRAKTOR · PEMBANGUNAN RUMAH GANG MAHANGGI TENGGARONG</text>
  <text x="36" y="62" fill="#E2E8F0" font-family="monospace" font-size="11">Tahap 3: Dinding Bata &amp; Rangka Atap Baja Ringan (Realisasi 100%) · Pelapor: Muhajirin Kasim</text>
  <rect x="20" y="330" width="600" height="48" rx="8" fill="rgba(16,185,129,0.2)" stroke="#10B981" stroke-width="1.5"/>
  <text x="36" y="358" fill="#A7F3D0" font-family="monospace" font-size="12" font-weight="bold">STATUS FISIK: TERPASANG 100% SESUAI DED &amp; BIM 3D · SIAP VERIFIKASI PENGAWAS</text>
</svg>
`)}`;

/* ============================================================================
 * MODUL D: MANAJEMEN PROGRES PEKERJAAN & DIGITAL EVIDENCE UPLOAD
 * ========================================================================== */

interface ProgressViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onSubmitProgressReport: (report: Omit<ProgressReport, 'id'>) => void;
  onProcessVerification?: (
    verificationId: string,
    newStatus: VerificationStatus,
    approvedPercentage: number,
    notes: string,
    bimChecked: boolean
  ) => void;
  onResetStage3Simulation?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  db,
  currentUser,
  onSubmitProgressReport,
  onProcessVerification,
  onResetStage3Simulation,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(db.projects[0]?.id || 'prj-001');
  const [showReportModal, setShowReportModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<ProgressAttachment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedProject =
    db.projects.find((p) => p.id === selectedProjectId) || db.projects[0];
  const projectMilestones = db.contract_milestones.filter(
    (m) => m.projectId === selectedProject?.id
  );
  const projectReports = db.progress_reports.filter(
    (r) => r.projectId === selectedProject?.id
  );

  // Stage 3 specific helpers for interactive simulation
  const stage3Milestone = projectMilestones.find((m) => m.order === 3) || projectMilestones[2];
  const stage3Verification = db.verifications.find(
    (v) => v.milestoneId === stage3Milestone?.id
  );
  const stage3Payment = db.payment_schedules.find(
    (s) => s.milestoneId === stage3Milestone?.id
  );

  // New Report & Digital Evidence Form
  const [milestoneId, setMilestoneId] = useState(
    stage3Milestone?.id || projectMilestones[0]?.id || 'ms-003'
  );
  const [submittedPercentage, setSubmittedPercentage] = useState<number>(100);
  const [reportDate, setReportDate] = useState('2026-11-26');
  const [workDescription, setWorkDescription] = useState('');
  const [contractorNotes, setContractorNotes] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<ProgressAttachment[]>([]);
  const [formError, setFormError] = useState('');

  const openReportFormForMilestone = (targetMsId?: string) => {
    const defaultMs =
      (targetMsId && projectMilestones.find((m) => m.id === targetMsId)) ||
      projectMilestones.find((m) => m.status !== 'Selesai') ||
      projectMilestones[0];
    setMilestoneId(defaultMs?.id || '');
    setSubmittedPercentage(100);
    setReportDate('2026-11-26');
    setWorkDescription(
      defaultMs?.order === 3
        ? 'Pemasangan dinding bata ringan, plesteran acian halus, serta instalasi rangka atap baja ringan dan penutup atap Rumah Gang Mahanggi telah selesai 100%.'
        : `Penyelesaian pekerjaan tahapan ${defaultMs?.name || ''} sesuai gambar kerja DED.`
    );
    setContractorNotes(
      'Bukti digital (foto fisik lapangan & dokumen berita acara opname) terlampir untuk diverifikasi pengawas agar pembayaran otomatis dicairkan.'
    );
    setUploadedAttachments([
      {
        id: generateUniqueId('att-sample'),
        reportId: '',
        fileName: `Foto_Bukti_${(defaultMs?.name || 'Lapangan').replace(/\s+/g, '_')}_100Persen.jpg`,
        fileType: 'Foto Dokumentasi',
        fileSize: '1.8 MB',
        uploadedAt: '2026-11-26',
        fileDataUrl: SAMPLE_EVIDENCE_STAGE3_SVG,
        mimeType: 'image/svg+xml',
        description: `Foto bukti penyelesaian fisik tahapan ${defaultMs?.name || ''} di lokasi Gang Mahanggi Tenggarong`,
        uploadedBy: 'Muhajirin Kasim (Kontraktor)',
      },
    ]);
    setFormError('');
    setShowReportModal(true);
  };

  // Real File Upload Handler (from HP Camera / Gallery or PC)
  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        const sizeLabel =
          sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
        const isImage = file.type.startsWith('image/');

        const newAtt: ProgressAttachment = {
          id: generateUniqueId('att-upload'),
          reportId: '',
          fileName: file.name,
          fileType: isImage ? 'Foto Dokumentasi' : 'Dokumen Teknis',
          fileSize: sizeLabel,
          uploadedAt: new Date().toISOString().split('T')[0],
          fileDataUrl: dataUrl,
          mimeType: file.type || 'application/octet-stream',
          description: `File bukti digital diunggah langsung dari perangkat (${file.name})`,
          uploadedBy: `${currentUser.name} (Kontraktor / Pelapor)`,
        };

        setUploadedAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so selecting the same file again works
    e.target.value = '';
  };

  const handleRemoveUploadedAttachment = (attId: string) => {
    setUploadedAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDescription.trim() || !milestoneId) {
      setFormError('Pilih tahapan pekerjaan dan isi deskripsi pekerjaan yang dilaksanakan.');
      return;
    }
    if (submittedPercentage <= 0 || submittedPercentage > 100) {
      setFormError('Persentase realisasi yang diajukan harus antara 1% hingga 100%.');
      return;
    }
    if (uploadedAttachments.length === 0) {
      setFormError('Mohon unggah minimal 1 file Bukti Digital (Foto Dokumentasi atau Dokumen PDF).');
      return;
    }
    const ms = projectMilestones.find((m) => m.id === milestoneId);
    onSubmitProgressReport({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      milestoneId,
      milestoneName: ms?.name || 'Tahapan Konstruksi',
      targetPercentage: 100,
      submittedPercentage: Number(submittedPercentage),
      reportDate,
      workDescription: workDescription.trim(),
      contractorNotes:
        contractorNotes.trim() || 'Bukti digital telah diunggah untuk pemeriksaan verifikator.',
      submittedBy: currentUser.name,
      verificationStatus: 'Menunggu pemeriksaan',
      attachments: uploadedAttachments,
      bimObjectIds: ms?.bimElementGroupId ? [ms.bimElementGroupId] : [],
      isDemo: true,
    });
    setShowReportModal(false);
    setFeedback(
      `Bukti Digital (${uploadedAttachments.length} file) & Laporan Progres tahapan "${ms?.name}" (${submittedPercentage}%) berhasil dikirim! Silakan klik "Setujui Verifikasi" untuk mencairkan dana otomatis.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Progres Tahapan Konstruksi &amp; Pengiriman Bukti Digital (Digital Evidence)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Pantau perkembangan pekerjaan setiap tahapan, unggah file bukti foto/dokumen dari
            kontraktor, dan jalankan simulasi verifikasi hingga pencairan dana otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Pilih proyek untuk progres"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {db.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name} ({p.overallProgress}%)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => openReportFormForMilestone(stage3Milestone?.id)}
            className="w-full sm:w-auto px-4 py-2 bg-[#1264F4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Bukti Digital Kontraktor</span>
          </button>
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
            className="font-bold text-emerald-700 dark:text-emerald-300 shrink-0"
            aria-label="Tutup pesan progres"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PENJELASAN & SIMULASI INTERAKTIF TAHAP 3: DINDING DAN ATAP */}
      {selectedProject?.id === 'prj-001' && stage3Milestone && (
        <div className="bg-gradient-to-br from-[#071D49] to-[#0E2963] text-white rounded-xl p-4 sm:p-6 border border-blue-400/30 shadow-md space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-white/15">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 text-[11px] font-bold mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Panduan Mudah &amp; Simulasi Interaktif Tahap 3</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Penjelasan Simulasi Tahap 3: Dinding dan Atap (Bobot 25% · Senilai Rp25.000.000)
              </h2>
              <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
                Kenapa sebelumnya tertulis <strong>Realisasi 20% dari Target 100% (Dalam Proses)</strong>?
                Berikut penjelasan sederhana dan cara menjalankan simulasinya:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {stage3Milestone.realizedProgress >= 100 && onResetStage3Simulation && (
                <button
                  type="button"
                  onClick={() => {
                    onResetStage3Simulation();
                    setFeedback(
                      'Simulasi Tahap 3 (Dinding dan Atap) telah di-reset kembali ke kondisi awal (Realisasi 20% - Dalam Proses) agar Anda bisa mencoba ulang.'
                    );
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi Simulasi Tahap 3 (Reset ke 20%)</span>
                </button>
              )}
            </div>
          </div>

          {/* 3-Step Visual Explanation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-500/30 text-cyan-200 font-bold text-[11px]">
                    LANGKAH 1 · KONTRAKTOR
                  </span>
                  <span className="font-mono text-xs text-blue-200">Muhajirin Kasim</span>
                </div>
                <div className="font-bold text-sm text-white">
                  1. Kondisi Awal (20%) &amp; Upload Bukti Selesai 100%
                </div>
                <p className="text-blue-100 leading-relaxed text-[11px]">
                  Saat pekerjaan baru dimulai (pemasangan bata awal), progres yang diakui baru{' '}
                  <strong>20%</strong>. Setelah dinding &amp; rangka atap selesai dipasang seluruhnya
                  (<strong>100%</strong>), Kontraktor wajib <strong>mengunggah file foto/PDF bukti fisik</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openReportFormForMilestone(stage3Milestone.id)}
                className="w-full py-2 px-3 rounded-lg bg-[#1264F4] hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>1. Upload File Bukti Tahap 3</span>
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold text-[11px]">
                    LANGKAH 2 · PENGAWAS
                  </span>
                  <span className="font-mono text-xs text-blue-200">Ir. Dian Permatasari</span>
                </div>
                <div className="font-bold text-sm text-white">
                  2. Verifikasi &amp; Setujui Pekerjaan Tahap 3 (100%)
                </div>
                <p className="text-blue-100 leading-relaxed text-[11px]">
                  Pengawas memeriksa foto bukti dari kontraktor. Selama belum disetujui pengawas,
                  progres resmi tetap tertahan. Jika pengawas klik <strong>Setujui 100%</strong>,
                  maka progres Tahap 3 sah menjadi <strong>100% (Selesai)</strong>.
                </p>
              </div>
              {stage3Milestone.realizedProgress >= 100 ? (
                <div className="w-full py-2 px-3 rounded-lg bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tahap 3 Sudah Disetujui 100%</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onProcessVerification && stage3Verification) {
                      onProcessVerification(
                        stage3Verification.id,
                        'Disetujui',
                        100,
                        'Bukti digital foto dinding bata & rangka atap Rumah Gang Mahanggi telah diperiksa dan dinyatakan selesai 100%.',
                        true
                      );
                      setFeedback(
                        ' SIMULASI BERHASIL: Tahap 3 (Dinding dan Atap) kini SELESAI 100%! Progres total rumah naik menjadi 80% dan dana Rp25.000.000 otomatis cair ke Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM.'
                      );
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Simulasikan Setujui 100% Sekarang</span>
                </button>
              )}
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold text-[11px]">
                    LANGKAH 3 · OTOMATIS CAIR
                  </span>
                  <span className="font-mono text-xs text-emerald-200">Smart Contract</span>
                </div>
                <div className="font-bold text-sm text-white">
                  3. Dana Rp25.000.000 Cair ke Rekening Mandiri
                </div>
                <p className="text-emerald-100 leading-relaxed text-[11px]">
                  Begitu Langkah 2 disetujui, sistem otomatis mentransfer{' '}
                  <strong>Rp25.000.000</strong> ke <strong>MUHAJIRIN KASIM (Bank Mandiri 1480025086508)</strong>,
                  dan total progres rumah naik dari <strong>60% menjadi 80%</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/10 text-[11px] flex items-center justify-between">
                <span className="text-slate-300">Status Dana Tahap 3:</span>
                <span
                  className={`font-bold ${
                    stage3Payment?.status === 'Berhasil'
                      ? 'text-emerald-300'
                      : 'text-amber-300'
                  }`}
                >
                  {stage3Payment?.status === 'Berhasil'
                    ? 'SUDAH CAIR (Rp25.000.000)'
                    : 'Menunggu Persetujuan Langkah 2'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Project Progress Summary & 4 Stage Cards */}
      {selectedProject && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Proyek Aktif:{' '}
                <strong className="text-slate-800 dark:text-slate-100">
                  {selectedProject.name}
                </strong>{' '}
                · Kontraktor: <strong>{selectedProject.contractorName}</strong>
              </div>
              <h2 className="text-base font-bold text-[#071D49] dark:text-white mt-0.5">
                Total Kemajuan Pembangunan Rumah Saat Ini (Terverifikasi)
              </h2>
            </div>
            <div className="text-2xl font-bold font-mono text-[#1264F4] dark:text-blue-400 tabular-nums">
              {selectedProject.overallProgress}% Selesai
            </div>
          </div>

          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#1264F4] to-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${selectedProject.overallProgress}%` }}
            />
          </div>

          {/* 4 Kartu Tahapan Pekerjaan yang Jelas & Mudah Dipahami */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {projectMilestones.map((ms) => {
              const isDone = ms.realizedProgress >= 100;
              const pendingRep = projectReports.find(
                (r) =>
                  r.milestoneId === ms.id &&
                  r.verificationStatus === 'Menunggu pemeriksaan'
              );
              const contributedWeight = Math.round(
                (ms.weightPercentage * ms.realizedProgress) / 100
              );

              return (
                <div
                  key={ms.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isDone
                      ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : ms.order === 3
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-400/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-[#071D49] dark:text-white">
                        Tahap {ms.order}: {ms.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isDone
                            ? 'bg-emerald-500/15 text-[#10B981]'
                            : ms.realizedProgress > 0
                            ? 'bg-blue-500/15 text-[#1264F4] dark:text-blue-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isDone
                          ? 'Selesai 100%'
                          : ms.realizedProgress > 0
                          ? 'Sedang Dikerjakan'
                          : 'Belum Dimulai'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ms.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2.5 border-t border-slate-200/80 dark:border-slate-700 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Nilai &amp; Bobot:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(ms.nominalValue)} ({ms.weightPercentage}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Pekerjaan Selesai:
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isDone ? 'text-[#10B981]' : 'text-[#1264F4] dark:text-blue-400'
                        }`}
                      >
                        {ms.realizedProgress}% dari Target {ms.targetProgress}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isDone ? 'bg-[#10B981]' : 'bg-[#1264F4]'
                        }`}
                        style={{ width: `${ms.realizedProgress}%` }}
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300">
                      {isDone ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ Menyumbang <strong>{ms.weightPercentage}%</strong> ke total proyek. Dana{' '}
                          <strong>{formatRupiah(ms.nominalValue)}</strong> sudah cair.
                        </span>
                      ) : pendingRep ? (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          ⏳ Saat ini diakui <strong>{ms.realizedProgress}%</strong> (menyumbang{' '}
                          {contributedWeight}% proyek). Kontraktor sudah ajukan{' '}
                          <strong>{pendingRep.submittedPercentage}%</strong> &amp; menunggu disetujui
                          pengawas.
                        </span>
                      ) : (
                        <span>
                          Menyumbang <strong>{contributedWeight}%</strong> dari bobot maksimal{' '}
                          <strong>{ms.weightPercentage}%</strong>.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>Target Selesai: {formatDateID(ms.dueDate)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReportFormForMilestone(ms.id)}
                      className="w-full mt-1 py-1.5 px-2.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[#1264F4] dark:text-blue-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Bukti Tahap {ms.order}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Galeri & Riwayat Bukti Digital (Digital Evidence) dari Kontraktor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#071D49] dark:text-white">
              Daftar Bukti Digital (Digital Evidence) &amp; Laporan Progres Kontraktor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setiap laporan progres dari Kontraktor ({selectedProject?.contractorName}) dilengkapi
              file bukti foto lapangan dan dokumen berita acara yang dapat dilihat/diunduh.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openReportFormForMilestone(stage3Milestone?.id)}
            className="px-3.5 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kirim Bukti Baru</span>
          </button>
        </div>

        <div className="space-y-3">
          {projectReports.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              Belum ada laporan progres dan bukti digital untuk proyek ini.
            </p>
          ) : (
            projectReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-bold text-[#071D49] dark:text-blue-300">
                      {rep.id}
                    </span>
                    <span>·</span>
                    <span>Tanggal: {formatDateID(rep.reportDate)}</span>
                    <span>·</span>
                    <span>
                      Dikirim oleh Kontraktor: <strong className="text-slate-800 dark:text-slate-100">{rep.submittedBy}</strong>
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#071D49] dark:text-white">
                    Tahapan: {rep.milestoneName} — Klaim Penyelesaian Fisik {rep.submittedPercentage}%
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rep.workDescription}
                  </p>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Catatan Kontraktor: {rep.contractorNotes}
                  </div>

                  {/* Digital Evidence File Cards */}
                  <div className="pt-1">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      File Bukti Digital Terlampir ({rep.attachments.length} File):
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {rep.attachments.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() =>
                            setPreviewAttachment({
                              ...att,
                              fileDataUrl: att.fileDataUrl || SAMPLE_EVIDENCE_STAGE3_SVG,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors shadow-2xs"
                        >
                          {att.fileType === 'Foto Dokumentasi' ? (
                            <Camera className="w-3.5 h-3.5 text-[#1264F4] shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          )}
                          <span className="font-mono truncate max-w-[200px]">{att.fileName}</span>
                          <span className="text-[10px] text-slate-400">({att.fileSize})</span>
                          <span className="text-[10px] font-bold text-[#1264F4] dark:text-blue-400 underline ml-1">
                            Lihat Bukti
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:text-right shrink-0 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Status Verifikasi Pengawas:
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        rep.verificationStatus === 'Disetujui'
                          ? 'text-[#10B981]'
                          : rep.verificationStatus === 'Ditolak'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {rep.verificationStatus}
                    </div>
                  </div>

                  {rep.verificationStatus !== 'Disetujui' && onProcessVerification && (
                    <button
                      type="button"
                      onClick={() => {
                        const matchingVer = db.verifications.find((v) => v.reportId === rep.id);
                        if (matchingVer) {
                          onProcessVerification(
                            matchingVer.id,
                            'Disetujui',
                            rep.submittedPercentage,
                            `Bukti digital (${rep.attachments.map((a) => a.fileName).join(', ')}) telah diperiksa dan disetujui.`,
                            true
                          );
                          setFeedback(
                            `Laporan & Bukti Digital "${rep.milestoneName}" disetujui 100%! Dana termin otomatis dicairkan ke Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM.`
                          );
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui &amp; Cairkan Dana</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Preview Bukti Digital (Foto / Dokumen) */}
      {previewAttachment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-[#1264F4] dark:text-blue-400 text-[10px] font-bold uppercase">
                  Digital Evidence Kontraktor
                </span>
                <h3 className="text-base font-bold text-[#071D49] dark:text-white mt-1 font-mono break-all">
                  {previewAttachment.fileName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Jenis: {previewAttachment.fileType} · Ukuran: {previewAttachment.fileSize} ·
                  Tanggal Upload: {formatDateID(previewAttachment.uploadedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewAttachment.fileDataUrl &&
            (previewAttachment.fileDataUrl.startsWith('data:image') ||
              previewAttachment.fileType === 'Foto Dokumentasi') ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center">
                <img
                  src={previewAttachment.fileDataUrl}
                  alt={previewAttachment.fileName}
                  className="max-h-[380px] w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <FileText className="w-10 h-10 text-[#1264F4] mx-auto" />
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  Dokumen Bukti Teknis Terlampir
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  File <strong>{previewAttachment.fileName}</strong> ({previewAttachment.fileSize})
                  telah tersimpan di dalam sistem bukti digital proyek.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Pengirim Bukti: <strong>{previewAttachment.uploadedBy || 'Muhajirin Kasim (Kontraktor)'}</strong>
              </div>
              <div className="flex items-center gap-2">
                {previewAttachment.fileDataUrl && (
                  <a
                    href={previewAttachment.fileDataUrl}
                    download={previewAttachment.fileName}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File Bukti</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="px-4 py-2 rounded-lg bg-[#071D49] dark:bg-blue-600 text-white font-semibold"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Laporan Progres & Upload File Bukti Digital (Digital Evidence) */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1264F4] dark:text-blue-400">
                  Formulir Digital Evidence Kontraktor
                </span>
                <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                  Upload File Bukti Pekerjaan &amp; Ajukan Progres
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup modal laporan progres"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="rep-ms"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Pilih Tahapan Pekerjaan ({selectedProject?.name})
                </label>
                <select
                  id="rep-ms"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {projectMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      Tahap {m.order}: {m.name} (Bobot {m.weightPercentage}% /{' '}
                      {formatRupiah(m.nominalValue)} - Saat ini {m.realizedProgress}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="rep-pct"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Persentase Selesai yang Diajukan (%)
                  </label>
                  <input
                    id="rep-pct"
                    type="number"
                    min={1}
                    max={100}
                    value={submittedPercentage}
                    onChange={(e) => setSubmittedPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rep-date"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Tanggal Pengiriman Bukti
                  </label>
                  <input
                    id="rep-date"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* REAL FILE UPLOAD DROPZONE FOR DIGITAL EVIDENCE */}
              <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#071D49] dark:text-white flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#1264F4]" />
                      <span>Upload File Bukti Digital (Foto Lapangan / PDF / Dokumen)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pilih file foto atau dokumen langsung dari HP atau Komputer Anda.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUploadChange}
                    className="hidden"
                    id="digital-evidence-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Pilih File dari HP / PC</span>
                  </button>
                </div>

                {/* List of attached files with thumbnail previews */}
                {uploadedAttachments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      File Siap Dikirim ({uploadedAttachments.length} File):
                    </div>
                    <div className="space-y-1.5">
                      {uploadedAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {att.fileDataUrl && att.fileDataUrl.startsWith('data:image') ? (
                              <img
                                src={att.fileDataUrl}
                                alt={att.fileName}
                                className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-blue-500/10 text-[#1264F4] flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-100 truncate">
                                {att.fileName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {att.fileType} · {att.fileSize}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedAttachment(att.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg shrink-0"
                            title="Hapus file ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="rep-desc"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Keterangan Pekerjaan yang Diselesaikan
                </label>
                <textarea
                  id="rep-desc"
                  rows={2}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Jelaskan pekerjaan yang telah diselesaikan di lapangan..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="rep-notes"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Catatan untuk Pengawas / Verifikator
                </label>
                <input
                  id="rep-notes"
                  type="text"
                  value={contractorNotes}
                  onChange={(e) => setContractorNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk verifikator lapangan"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1264F4] text-white font-semibold hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Kirim Bukti Digital &amp; Ajukan Verifikasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * MODUL E: BIM VIEWER DAN INTEGRASI BIM
 * ========================================================================== */

interface BimViewerProps {
  db: SmartBuildDatabase;
  onUpdateBimModel: (model: BimModel) => void;
}

export const BimViewerView: React.FC<BimViewerProps> = ({ db, onUpdateBimModel }) => {
  const [selectedModelId, setSelectedModelId] = useState(db.bim_models[0]?.id || 'bim-001');
  const currentModel =
    db.bim_models.find((m) => m.id === selectedModelId) || db.bim_models[0];

  const [selectedElementId, setSelectedElementId] = useState<string>(
    currentModel?.elements[0]?.id || 'bim-el-1'
  );
  const [highlightFilter, setHighlightFilter] = useState<string>('ALL');
  const [cameraAngle, setCameraAngle] = useState<'iso' | 'front' | 'top'>('iso');

  // Upload / Reference update form
  const [modelUrlInput, setModelUrlInput] = useState(currentModel?.modelUrl || '');
  const [modelNameInput, setModelNameInput] = useState(currentModel?.modelName || '');
  const [modelVersionInput, setModelVersionInput] = useState(currentModel?.version || '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const selectedElement: BimObjectElement | undefined =
    currentModel?.elements.find((e) => e.id === selectedElementId) ||
    currentModel?.elements[0];

  const handleSaveBimReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentModel) return;
    onUpdateBimModel({
      ...currentModel,
      modelName: modelNameInput.trim() || currentModel.modelName,
      modelUrl: modelUrlInput.trim() || currentModel.modelUrl,
      version: modelVersionInput.trim() || currentModel.version,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setSavedNotice('Referensi file dan URL model BIM berhasil disimpan.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Status Arsitektur BIM:{' '}
            <strong className="text-[#1264F4] dark:text-blue-400">
              {currentModel?.integrationStatus}
            </strong>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white mt-0.5">
            BIM Viewer 3D &amp; Integrasi Model Bangunan
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Visualisasi struktural 3D terhubung tahapan pekerjaan, metadata objek bangunan, dan
            penyimpanan referensi file IFC/Revit.
          </p>
        </div>

        <select
          aria-label="Pilih model BIM proyek"
          value={selectedModelId}
          onChange={(e) => {
            const nextId = e.target.value;
            setSelectedModelId(nextId);
            const found = db.bim_models.find((m) => m.id === nextId);
            if (found) {
              setSelectedElementId(found.elements[0]?.id || '');
              setModelUrlInput(found.modelUrl);
              setModelNameInput(found.modelName);
              setModelVersionInput(found.version);
            }
          }}
          className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {db.bim_models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.projectName} — {m.modelName} ({m.format})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive 3D Isometric Viewport */}
        <div className="lg:col-span-8 bg-[#071D49] text-white rounded-xl border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div>
              <div className="text-xs text-slate-300 font-mono">
                {currentModel?.modelName} · Versi {currentModel?.version} · {currentModel?.fileSize}
              </div>
              <div className="text-sm font-bold mt-0.5">
                Viewport 3D Struktural: {currentModel?.projectName}
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setCameraAngle('iso')}
                className={`px-2.5 py-1 rounded font-semibold ${
                  cameraAngle === 'iso' ? 'bg-[#1264F4] text-white' : 'text-slate-300'
                }`}
              >
                3D Isometrik
              </button>
              <button
                type="button"
                onClick={() => setCameraAngle('front')}
                className={`px-2.5 py-1 rounded font-semibold ${
                  cameraAngle === 'front' ? 'bg-[#1264F4] text-white' : 'text-slate-300'
                }`}
              >
                Tampak Elevasi
              </button>
              <button
                type="button"
                onClick={() => setCameraAngle('top')}
                className={`px-2.5 py-1 rounded font-semibold ${
                  cameraAngle === 'top' ? 'bg-[#1264F4] text-white' : 'text-slate-300'
                }`}
              >
                Denah Struktur
              </button>
            </div>
          </div>

          {/* Layer Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-300">Filter Lapisan Tahapan:</span>
            {['ALL', 'Pondasi', 'Struktur', 'Dinding dan Atap', 'Finishing'].map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setHighlightFilter(layer)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  highlightFilter === layer
                    ? 'bg-white text-[#071D49]'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                {layer === 'ALL' ? 'Semua Lapisan' : layer}
              </button>
            ))}
          </div>

          {/* Interactive SVG 3D Architectural Building Model */}
          <div
            data-testid="bim-3d-viewport"
            className="relative bg-slate-950/70 rounded-xl border border-white/10 p-4 flex items-center justify-center min-h-[300px] sm:min-h-[360px]"
          >
            <svg
              viewBox="0 0 600 340"
              className="w-full max-w-xl h-64 sm:h-80 select-none transition-transform duration-200"
              style={{
                transform:
                  cameraAngle === 'front'
                    ? 'scaleY(0.92)'
                    : cameraAngle === 'top'
                    ? 'scaleY(0.75) rotate(-6deg)'
                    : 'none',
              }}
              role="img"
              aria-label="Visualisasi 3D Model Bangunan BIM"
            >
              {/* Reference Grid */}
              <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
                <line x1="80" y1="270" x2="300" y2="320" />
                <line x1="300" y1="320" x2="520" y2="270" />
                <line x1="80" y1="270" x2="300" y2="220" />
                <line x1="300" y1="220" x2="520" y2="270" />
              </g>

              {/* TAHAP 1: PONDASI */}
              {(highlightFilter === 'ALL' || highlightFilter === 'Pondasi') && (
                <g
                  onClick={() => {
                    const el = currentModel?.elements.find((e) => e.category === 'Pondasi');
                    if (el) setSelectedElementId(el.id);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-95"
                >
                  <polygon
                    points="130,260 300,305 470,260 300,215"
                    fill="#10B981"
                    fillOpacity={selectedElement?.category === 'Pondasi' ? '0.55' : '0.35'}
                    stroke="#10B981"
                    strokeWidth="2.5"
                  />
                  <rect x="145" y="252" width="22" height="14" fill="#10B981" />
                  <rect x="289" y="290" width="22" height="14" fill="#10B981" />
                  <rect x="435" y="252" width="22" height="14" fill="#10B981" />
                  <rect x="289" y="215" width="22" height="14" fill="#10B981" />
                  <text
                    x="300"
                    y="295"
                    textAnchor="middle"
                    fill="#A7F3D0"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    [1] PONDASI TAPAK &amp; SLOOF (100% SELESAI)
                  </text>
                </g>
              )}

              {/* TAHAP 2: STRUKTUR */}
              {(highlightFilter === 'ALL' || highlightFilter === 'Struktur') && (
                <g
                  onClick={() => {
                    const el = currentModel?.elements.find((e) => e.category === 'Struktur');
                    if (el) setSelectedElementId(el.id);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-95"
                >
                  <line x1="155" y1="255" x2="155" y2="145" stroke="#10B981" strokeWidth="6" />
                  <line x1="300" y1="292" x2="300" y2="175" stroke="#10B981" strokeWidth="6" />
                  <line x1="445" y1="255" x2="445" y2="145" stroke="#10B981" strokeWidth="6" />
                  <line x1="300" y1="220" x2="300" y2="115" stroke="#10B981" strokeWidth="5" />
                  <polygon
                    points="155,195 300,232 445,195 300,158"
                    fill="#10B981"
                    fillOpacity={selectedElement?.category === 'Struktur' ? '0.5' : '0.28'}
                    stroke="#34D399"
                    strokeWidth="2"
                  />
                  <text
                    x="300"
                    y="202"
                    textAnchor="middle"
                    fill="#D1FAE5"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    [2] STRUKTUR KOLOM &amp; BALOK (100% SELESAI)
                  </text>
                </g>
              )}

              {/* TAHAP 3: DINDING DAN ATAP */}
              {(highlightFilter === 'ALL' || highlightFilter === 'Dinding dan Atap') && (
                <g
                  onClick={() => {
                    const el = currentModel?.elements.find(
                      (e) => e.category === 'Dinding dan Atap'
                    );
                    if (el) setSelectedElementId(el.id);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-95"
                >
                  <polygon
                    points="140,145 300,70 460,145 300,180"
                    fill="#1264F4"
                    fillOpacity={selectedElement?.category === 'Dinding dan Atap' ? '0.6' : '0.35'}
                    stroke="#60A5FA"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="220"
                    y1="108"
                    x2="300"
                    y2="180"
                    stroke="#93C5FD"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <line
                    x1="380"
                    y1="108"
                    x2="300"
                    y2="180"
                    stroke="#93C5FD"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text
                    x="300"
                    y="132"
                    textAnchor="middle"
                    fill="#DBEAFE"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    [3] DINDING &amp; ATAP BAJA
                  </text>
                </g>
              )}

              {/* TAHAP 4: FINISHING */}
              {(highlightFilter === 'ALL' || highlightFilter === 'Finishing') && (
                <g
                  onClick={() => {
                    const el = currentModel?.elements.find((e) => e.category === 'Finishing');
                    if (el) setSelectedElementId(el.id);
                  }}
                  className="cursor-pointer"
                >
                  <polygon
                    points="195,245 300,270 405,245 300,220"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <text
                    x="300"
                    y="250"
                    textAnchor="middle"
                    fill="#CBD5E1"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    [4] FINISHING &amp; MEP
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right Panel: Inspector Objek Bangunan & Referensi File BIM */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#071D49] dark:text-white">
              <Box className="w-4 h-4 text-[#1264F4]" />
              <h2 className="text-sm font-bold">Informasi Objek Bangunan (BIM Inspector)</h2>
            </div>

            <div className="space-y-1.5">
              {currentModel?.elements.map((el) => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => setSelectedElementId(el.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    selectedElement?.id === el.id
                      ? 'border-[#1264F4] bg-[#EAF2FF]/60 dark:bg-blue-950/50'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#071D49] dark:text-blue-300">
                      {el.code}
                    </span>
                    <span className="font-mono font-semibold text-[#1264F4] dark:text-blue-400 tabular-nums">
                      Progres: {el.completionRate}%
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {el.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tahap #{el.milestoneOrder} ({el.category}) · Status: {el.inspectionState}
                  </div>
                </button>
              ))}
            </div>

            {selectedElement && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-[#071D49] dark:text-white">
                  Detail Properti Objek Terpilih:
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Elevasi / Level:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedElement.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Spesifikasi Material:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[200px]">
                    {selectedElement.material}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Estimasi Volume BIM:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                    {selectedElement.volumeM3} m³
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Penyimpanan Referensi File & URL Model BIM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#071D49] dark:text-white">
              <Upload className="w-4 h-4 text-[#1264F4]" />
              <h2 className="text-sm font-bold">Penyimpanan Referensi &amp; URL Model BIM</h2>
            </div>

            {savedNotice && (
              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                {savedNotice}
              </div>
            )}

            <form onSubmit={handleSaveBimReference} className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="bim-file-name"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nama File Referensi BIM (.ifc / .rvt)
                </label>
                <input
                  id="bim-file-name"
                  type="text"
                  value={modelNameInput}
                  onChange={(e) => setModelNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="bim-url"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  URL Model BIM / Endpoint Repository
                </label>
                <input
                  id="bim-url"
                  type="text"
                  value={modelUrlInput}
                  onChange={(e) => setModelUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="bim-ver"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Versi Sinkronisasi Model
                </label>
                <input
                  id="bim-ver"
                  type="text"
                  value={modelVersionInput}
                  onChange={(e) => setModelVersionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Simpan Referensi File &amp; URL BIM</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MODUL F: VERIFIKASI PEKERJAAN & PEMERIKSAAN DIGITAL EVIDENCE
 * ========================================================================== */

interface VerificationViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onProcessVerification: (
    verificationId: string,
    newStatus: VerificationStatus,
    approvedPercentage: number,
    notes: string,
    bimChecked: boolean
  ) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  db,
  currentUser,
  onProcessVerification,
}) => {
  const [selectedVer, setSelectedVer] = useState<VerificationRecord | null>(null);
  const [approvedPctInput, setApprovedPctInput] = useState<number>(100);
  const [notesInput, setNotesInput] = useState<string>('');
  const [bimCheckedInput, setBimCheckedInput] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const canVerify = canPerformAction(currentUser.role, 'verify_progress');

  const openVerificationModal = (ver: VerificationRecord) => {
    setSelectedVer(ver);
    setApprovedPctInput(
      ver.approvedPercentage > 0 ? ver.approvedPercentage : ver.submittedPercentage
    );
    setNotesInput(ver.notes);
    setBimCheckedInput(ver.bimChecked || true);
  };

  const handleDecision = (decisionStatus: VerificationStatus) => {
    if (!selectedVer) return;
    const finalApprovedPct =
      decisionStatus === 'Disetujui'
        ? Number(approvedPctInput)
        : decisionStatus === 'Ditolak'
        ? 0
        : Number(approvedPctInput);

    onProcessVerification(
      selectedVer.id,
      decisionStatus,
      finalApprovedPct,
      notesInput.trim() || `Keputusan verifikasi: ${decisionStatus}`,
      bimCheckedInput
    );
    setFeedback(
      `Verifikasi "${selectedVer.milestoneName}" (${selectedVer.projectName}) diperbarui menjadi "${decisionStatus}".${
        decisionStatus === 'Disetujui' && finalApprovedPct >= 100
          ? ' Pembayaran otomatis telah dicairkan ke Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM.'
          : ''
      }`
    );
    setSelectedVer(null);
  };

  const filteredVerifications = db.verifications.filter(
    (v) => statusFilter === 'ALL' || v.status === statusFilter
  );

  const linkedReport = selectedVer
    ? db.progress_reports.find((r) => r.id === selectedVer.reportId)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Verifikasi Pekerjaan &amp; Pemeriksaan Bukti Digital (Digital Evidence)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Periksa file bukti foto/dokumen yang diunggah Kontraktor (Muhajirin Kasim), validasi
            BIM, dan setujui untuk mencairkan dana otomatis ke Bank Mandiri 1480025086508.
          </p>
        </div>

        <select
          aria-label="Filter status verifikasi"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="ALL">Semua Status Verifikasi ({db.verifications.length})</option>
          <option value="Menunggu pemeriksaan">Menunggu pemeriksaan</option>
          <option value="Dalam pemeriksaan">Dalam pemeriksaan</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Memerlukan revisi">Memerlukan revisi</option>
          <option value="Ditolak">Ditolak</option>
        </select>
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
            aria-label="Tutup pesan verifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 font-semibold">ID Verifikasi &amp; Proyek</th>
                <th className="py-3 px-4 font-semibold">Tahap Pekerjaan &amp; Bukti Digital</th>
                <th className="py-3 px-4 font-semibold text-right">Diajukan</th>
                <th className="py-3 px-4 font-semibold text-right">Disetujui</th>
                <th className="py-3 px-4 font-semibold">Verifikator &amp; BIM</th>
                <th className="py-3 px-4 font-semibold">Status Verifikasi</th>
                <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVerifications.map((ver) => (
                <tr key={ver.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {ver.id} · {formatDateID(ver.verificationDate)}
                    </div>
                    <div className="font-bold text-[#071D49] dark:text-white mt-0.5">
                      {ver.projectName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {ver.milestoneName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      Bukti: {ver.supportingEvidenceSummary}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {ver.submittedPercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
                    {ver.approvedPercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <div>{ver.verifierName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Validasi BIM: {ver.bimChecked ? 'Terperiksa' : 'Belum diperiksa'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-bold whitespace-nowrap ${
                        ver.status === 'Disetujui'
                          ? 'text-[#10B981]'
                          : ver.status === 'Ditolak'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {ver.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openVerificationModal(ver)}
                      className="px-3 py-1.5 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{canVerify ? 'Periksa Bukti & Putuskan' : 'Lihat Bukti'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Verifikasi, Preview Bukti Digital & Keputusan */}
      {selectedVer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  ID Verifikasi: {selectedVer.id} · Laporan Kontraktor: {selectedVer.reportId}
                </div>
                <h2 className="text-base font-bold text-[#071D49] dark:text-white mt-0.5">
                  Pemeriksaan Tahapan: {selectedVer.milestoneName} ({selectedVer.projectName})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup modal verifikasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Digital Evidence Preview inside Verification Modal */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#071D49] dark:text-white">
                  Bukti Digital (Digital Evidence) yang Dikirim Kontraktor:
                </span>
                <span className="font-mono font-bold text-[#1264F4] dark:text-blue-400">
                  Klaim Selesai: {selectedVer.submittedPercentage}%
                </span>
              </div>

              {linkedReport && linkedReport.attachments.length > 0 && (
                <div className="space-y-2">
                  {linkedReport.attachments.map((att) => {
                    const imgSrc =
                      att.fileDataUrl ||
                      (att.fileType === 'Foto Dokumentasi' ? SAMPLE_EVIDENCE_STAGE3_SVG : undefined);
                    return (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                            {att.fileName} ({att.fileSize})
                          </span>
                          <span className="text-[11px] text-slate-500">{att.fileType}</span>
                        </div>
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt={att.fileName}
                            className="w-full max-h-48 object-contain rounded-lg bg-slate-950 border border-slate-800"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="ver-approved-pct"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Persentase yang Disetujui Verifikator (%)
                </label>
                <input
                  id="ver-approved-pct"
                  type="number"
                  min={0}
                  max={100}
                  disabled={!canVerify}
                  value={approvedPctInput}
                  onChange={(e) => setApprovedPctInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="ver-bim-check"
                  type="checkbox"
                  disabled={!canVerify}
                  checked={bimCheckedInput}
                  onChange={(e) => setBimCheckedInput(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label
                  htmlFor="ver-bim-check"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Data objek pada BIM Viewer &amp; Bukti Digital lapangan telah sesuai 100%
                </label>
              </div>

              <div>
                <label
                  htmlFor="ver-notes"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Catatan Pemeriksaan / Catatan Revisi
                </label>
                <textarea
                  id="ver-notes"
                  rows={2}
                  disabled={!canVerify}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan hasil pemeriksaan bukti digital lapangan..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {canVerify ? (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDecision('Ditolak')}
                  className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Progres</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('Memerlukan revisi')}
                  className="px-3.5 py-2 rounded-lg bg-[#F59E0B] hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Minta Revisi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('Disetujui')}
                  className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui &amp; Cairkan Otomatis ke Mandiri</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedVer(null)}
                  className="px-4 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 text-white text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
