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
 * MODUL E: BIM VIEWER 3D SPESIFIK, EDIT PARAMETER IFC & UPLOAD VERSI MODEL
 * ========================================================================== */

interface DetailedBimComponent {
  id: string;
  stageNumber: 1 | 2 | 3 | 4 | 5;
  stageLabel: string;
  name: string;
  objectType: string;
  ifcCategory: string;
  materialSpec: string;
  dimensions: string;
  volumeEstimate: string;
  completionPct: number;
  statusLabel: string;
  technicalNotes: string;
}

interface BimVersionHistoryItem {
  id: string;
  projectKey: string;
  versionLabel: string;
  fileName: string;
  format: 'GLB' | 'glTF' | 'IFC';
  fileSize: string;
  uploadedAt: string;
  revisionNotes: string;
}

const INITIAL_DETAILED_BIM_COMPONENTS: Record<string, DetailedBimComponent[]> = {
  aula: [
    {
      id: 'bim-comp-1',
      stageNumber: 1,
      stageLabel: 'Tahap Pondasi',
      name: 'Pondasi Tapak & Tie Beam Sloof K-350',
      objectType: 'IfcFooting / Reinforced Concrete Foundation',
      ifcCategory: 'IFCFOOTING',
      materialSpec: 'Beton Bertulang K-350 + Baja Tulangan Ulir BJTS 420B',
      dimensions: '24.0 m × 16.0 m × 1.2 m (16 Titik Footplat 180×180 cm)',
      volumeEstimate: '118.5 m³',
      completionPct: 100,
      statusLabel: '100% Selesai',
      technicalNotes: 'Kuat tekan rata-rata 368 kg/cm², lulus pemeriksaan Project Supervisor.',
    },
    {
      id: 'bim-comp-2',
      stageNumber: 2,
      stageLabel: 'Tahap Struktur',
      name: 'Kolom Utama Pedestal & Portal Baja WF 400x200',
      objectType: 'IfcColumn & IfcBeam / Structural Steel Portal Frame',
      ifcCategory: 'IFCCOLUMN / IFCBEAM',
      materialSpec: 'Baja Profil WF 400×200×8×13 BJ-41 + Baut Mutu Tinggi A325',
      dimensions: 'Bentang 16.0 m × Panjang 24.0 m × Tinggi Kolom 7.5 m',
      volumeEstimate: '42.8 Ton (64.0 m³ ekuivalen)',
      completionPct: 100,
      statusLabel: '100% Selesai',
      technicalNotes: 'Uji torsi baut A325 & NDT Ultrasonic las struktur lulus 100% sesuai DED.',
    },
    {
      id: 'bim-comp-3',
      stageNumber: 3,
      stageLabel: 'Tahap Dinding',
      name: 'Dinding Bata Ringan AAC & Panel Akustik Rockwool',
      objectType: 'IfcWallStandardCase / Insulated Masonry & Acoustic Wall',
      ifcCategory: 'IFCWALL',
      materialSpec: 'Bata Ringan AAC 10 cm + Plester Acian + Rockwool 50 mm (Density 80 kg/m³)',
      dimensions: 'Keliling 80.0 m × Tinggi 6.8 m (Tebal Total 15 cm)',
      volumeEstimate: '81.6 m³ (544.0 m²)',
      completionPct: 20,
      statusLabel: '20% Dalam Pengerjaan',
      technicalNotes: 'Pemasangan dinding bata ringan sisi timur & barat sedang berlangsung.',
    },
    {
      id: 'bim-comp-4',
      stageNumber: 4,
      stageLabel: 'Tahap Atap',
      name: 'Rangka Atap Space Truss & Penutup Zincalume Berinsulasi',
      objectType: 'IfcRoof / Steel Truss & Insulated Metal Roof Deck',
      ifcCategory: 'IFCROOF',
      materialSpec: 'Baja Ringan C-Truss Galvalum G550 + Atap Zincalume 0.45 mm + Aluminium Foil',
      dimensions: '26.0 m × 18.0 m (Kemiringan 15° · Overstek 1.0 m)',
      volumeEstimate: '468.0 m²',
      completionPct: 20,
      statusLabel: '20% Dalam Pengerjaan',
      technicalNotes: 'Pabrikasi kuda-kuda utama selesai, persiapan ereksi gording atap.',
    },
    {
      id: 'bim-comp-5',
      stageNumber: 5,
      stageLabel: 'Tahap Finishing',
      name: 'Fasad Kaca Curtain Wall, Kanopi Entrance & Lantai Epoksi',
      objectType: 'IfcCurtainWall & IfcSlab / Architectural Envelope & Flooring',
      ifcCategory: 'IFCCURTAINWALL',
      materialSpec: 'Kaca Tempered Low-E 12 mm + Rangka Aluminium Anodized + Cat Epoksi 1000 Micron',
      dimensions: 'Kanopi 8.0 m × 3.0 m + Area Lantai 384.0 m²',
      volumeEstimate: '384.0 m²',
      completionPct: 0,
      statusLabel: '0% Menunggu Jadwal',
      technicalNotes: 'Menunggu penyelesaian penutup atap dan plesteran dinding utama.',
    },
  ],
  mahanggi: [
    {
      id: 'bim-mahanggi-1',
      stageNumber: 1,
      stageLabel: 'Tahap Pondasi',
      name: 'Pondasi Tapak Beton & Sloof Pengikat K-275 Rumah Gang Mahanggi',
      objectType: 'IfcFooting / Reinforced Concrete Residential Foundation',
      ifcCategory: 'IFCFOOTING',
      materialSpec: 'Beton Bertulang K-275 + Pasangan Batu Kali & Tulangan Ulir D13',
      dimensions: '14.0 m × 10.0 m × 1.0 m (12 Titik Footplat 100×100 cm)',
      volumeEstimate: '24.5 m³',
      completionPct: 100,
      statusLabel: '100% Selesai',
      technicalNotes: 'Pondasi & sloof Rumah Gang Mahanggi Tenggarong selesai 100% dan dana Tahap 1 telah cair.',
    },
    {
      id: 'bim-mahanggi-2',
      stageNumber: 2,
      stageLabel: 'Tahap Struktur',
      name: 'Kolom Utama, Balok Ring & Pelat Dak Beton Bertulang',
      objectType: 'IfcColumn & IfcBeam / Residential Concrete Frame',
      ifcCategory: 'IFCCOLUMN / IFCBEAM',
      materialSpec: 'Beton Bertulang K-275 + Baja Tulangan Pokok D13 & Begel Ø8',
      dimensions: 'Kolom 15×30 cm · Balok 15×25 cm · Tinggi 4.0 m',
      volumeEstimate: '18.2 m³',
      completionPct: 100,
      statusLabel: '100% Selesai',
      technicalNotes: 'Struktur kolom dan balok pengikat lulus pemeriksaan pengawas Ir. Dian Permatasari.',
    },
    {
      id: 'bim-mahanggi-3',
      stageNumber: 3,
      stageLabel: 'Tahap Dinding',
      name: 'Pasangan Dinding Bata Ringan, Plesteran & Acian Halus',
      objectType: 'IfcWallStandardCase / Residential Masonry Wall',
      ifcCategory: 'IFCWALL',
      materialSpec: 'Bata Ringan AAC 10 cm + Mortar Perekat Instan + Plester Acian Semen',
      dimensions: 'Luas Dinding 210.0 m² × Tebal 12.5 cm',
      volumeEstimate: '32.0 m³',
      completionPct: 20,
      statusLabel: '20% Dalam Pengerjaan',
      technicalNotes: 'Progres fisik dinding bata sedang berjalan (tersedia simulasi klaim 100%).',
    },
    {
      id: 'bim-mahanggi-4',
      stageNumber: 4,
      stageLabel: 'Tahap Atap',
      name: 'Rangka Atap Baja Ringan C75.75 & Penutup Genteng Metal Pasir',
      objectType: 'IfcRoof / Cold-Formed Steel Roof Truss',
      ifcCategory: 'IFCROOF',
      materialSpec: 'Baja Ringan Kanal C75.75 + Reng R30.45 + Genteng Metal Berpasir',
      dimensions: '15.6 m × 11.4 m (Kemiringan 30°)',
      volumeEstimate: '177.8 m²',
      completionPct: 20,
      statusLabel: '20% Dalam Pengerjaan',
      technicalNotes: 'Terintegrasi dengan Tahap 3 (Dinding dan Atap) kontrak Pembangunan Rumah Gang Mahanggi.',
    },
    {
      id: 'bim-mahanggi-5',
      stageNumber: 5,
      stageLabel: 'Tahap Finishing',
      name: 'Kanopi Teras, Kusen Aluminium, Plafon Gypsum & Lantai Granit 60x60',
      objectType: 'IfcCurtainWall & IfcCovering / Residential Finishing & MEP',
      ifcCategory: 'IFCCURTAINWALL',
      materialSpec: 'Granit Tile 60×60 Homogeneous + Cat Eksterior WeatherShield + Instalasi Listrik',
      dimensions: 'Luas Bangunan 120.0 m² + Kanopi Teras 4.5 m × 2.2 m',
      volumeEstimate: '120.0 m²',
      completionPct: 0,
      statusLabel: '0% Menunggu Jadwal',
      technicalNotes: 'Tahap 4 kontrak (Bobot 20% senilai Rp20.000.000) menunggu Tahap 3 selesai.',
    },
  ],
};

const INITIAL_BIM_VERSIONS: BimVersionHistoryItem[] = [
  {
    id: 'ver-bim-21',
    projectKey: 'aula',
    versionLabel: 'v2.1 (As-Built Struktur & Dinding)',
    fileName: 'Gedung_Aula_SmartBuild_v2.1.glb',
    format: 'GLB',
    fileSize: '18.4 MB',
    uploadedAt: '2026-11-15 11:20 WIB',
    revisionNotes: 'Pembaruan geometri as-built kolom WF 400x200 dan progres dinding bata ringan 20%.',
  },
  {
    id: 'ver-bim-10',
    projectKey: 'aula',
    versionLabel: 'v1.0 (Baseline Kontrak Awal)',
    fileName: 'Gedung_Aula_SmartBuild_v1.0.glb',
    format: 'GLB',
    fileSize: '16.2 MB',
    uploadedAt: '2026-08-01 08:30 WIB',
    revisionNotes: 'Model 3D baseline kontrak awal sesuai dokumen DED.',
  },
  {
    id: 'ver-bim-mahanggi-21',
    projectKey: 'mahanggi',
    versionLabel: 'v2.1 (As-Built Struktur & Dinding)',
    fileName: 'Rumah_Gang_Mahanggi_v2.1.glb',
    format: 'GLB',
    fileSize: '14.8 MB',
    uploadedAt: '2026-11-24 14:10 WIB',
    revisionNotes: 'Sinkronisasi model 3D Rumah Gang Mahanggi Tenggarong (Pondasi & Struktur 100%, Dinding & Atap 20%).',
  },
  {
    id: 'ver-bim-mahanggi-10',
    projectKey: 'mahanggi',
    versionLabel: 'v1.0 (Baseline Kontrak Awal)',
    fileName: 'Rumah_Gang_Mahanggi_v1.0.ifc',
    format: 'IFC',
    fileSize: '12.4 MB',
    uploadedAt: '2026-09-01 09:00 WIB',
    revisionNotes: 'Baseline awal desain arsitektur & struktur Rumah Gang Mahanggi.',
  },
];

interface BimViewerProps {
  db: SmartBuildDatabase;
  onUpdateBimModel: (model: BimModel) => void;
}

export const BimViewerView: React.FC<BimViewerProps> = ({ db, onUpdateBimModel }) => {
  const [selectedProjectOption, setSelectedProjectOption] = useState<string>('aula');
  const [componentsByProject, setComponentsByProject] = useState<Record<string, DetailedBimComponent[]>>(
    INITIAL_DETAILED_BIM_COMPONENTS
  );
  const [versionHistory, setVersionHistory] = useState<BimVersionHistoryItem[]>(INITIAL_BIM_VERSIONS);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('ver-bim-21');
  const [stageFilter, setStageFilter] = useState<'ALL' | 1 | 2 | 3 | 4 | 5>('ALL');

  // 3D Viewport Camera & Exploded View Controls
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [explodedLevel, setExplodedLevel] = useState<number>(0);
  const [showViewportControls, setShowViewportControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);

  const activeComponents =
    componentsByProject[selectedProjectOption] || componentsByProject.aula;
  const [selectedCompId, setSelectedCompId] = useState<string>(
    activeComponents[0]?.id || 'bim-comp-1'
  );

  const selectedComp =
    activeComponents.find((c) => c.id === selectedCompId) || activeComponents[0];

  const projectVersions = versionHistory.filter(
    (v) => v.projectKey === selectedProjectOption
  );
  const activeVersion =
    projectVersions.find((v) => v.id === selectedVersionId) ||
    projectVersions[0] ||
    versionHistory[0];

  // Edit Selected BIM Element state
  const [isEditingElement, setIsEditingElement] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<DetailedBimComponent>(selectedComp);

  // Upload New BIM Model Version state
  const bimFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadVersionLabel, setUploadVersionLabel] = useState<string>('');
  const [uploadRevisionNotes, setUploadRevisionNotes] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('19.2 MB');
  const [bimFeedback, setBimFeedback] = useState<string | null>(null);

  const handleProjectChange = (nextKey: string) => {
    setSelectedProjectOption(nextKey);
    const nextComps = componentsByProject[nextKey] || componentsByProject.aula;
    const nextVers = versionHistory.filter((v) => v.projectKey === nextKey);
    if (nextComps[0]) {
      setSelectedCompId(nextComps[0].id);
      setEditForm(nextComps[0]);
    }
    if (nextVers[0]) {
      setSelectedVersionId(nextVers[0].id);
    }
    setIsEditingElement(false);
  };

  const handleSelectComponent = (comp: DetailedBimComponent) => {
    setSelectedCompId(comp.id);
    setEditForm(comp);
    setIsEditingElement(false);
  };

  const handleStartEditElement = () => {
    if (!selectedComp) return;
    setEditForm({ ...selectedComp });
    setIsEditingElement(true);
  };

  const handleSaveEditedElement = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = Math.min(100, Math.max(0, Number(editForm.completionPct) || 0));
    const autoStatusLabel =
      pct >= 100
        ? '100% Selesai'
        : pct > 0
        ? `${pct}% Dalam Pengerjaan`
        : '0% Menunggu Jadwal';

    const updatedComp: DetailedBimComponent = {
      ...editForm,
      completionPct: pct,
      statusLabel: autoStatusLabel,
    };

    setComponentsByProject((prev) => ({
      ...prev,
      [selectedProjectOption]: (prev[selectedProjectOption] || []).map((c) =>
        c.id === updatedComp.id ? updatedComp : c
      ),
    }));

    // Also sync with db.bim_models so changes persist
    const targetDbModel = db.bim_models[0];
    if (targetDbModel) {
      onUpdateBimModel({
        ...targetDbModel,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    setIsEditingElement(false);
    setBimFeedback(
      `Spesifikasi elemen BIM "${updatedComp.name}" (${updatedComp.ifcCategory}) berhasil diperbarui (${updatedComp.statusLabel}).`
    );
  };

  const handleBimFilePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const sizeMb = Math.max(0.1, file.size / (1024 * 1024));
    setUploadedFileSize(`${sizeMb.toFixed(1)} MB`);
    if (!uploadVersionLabel.trim()) {
      setUploadVersionLabel(`v2.${projectVersions.length + 1} (Update Model ${file.name})`);
    }
    if (!uploadRevisionNotes.trim()) {
      setUploadRevisionNotes(`Unggah file model 3D langsung dari perangkat (${file.name}).`);
    }
    e.target.value = '';
  };

  const handleUploadBimVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFile =
      uploadFileName.trim() ||
      (selectedProjectOption === 'mahanggi'
        ? `Rumah_Gang_Mahanggi_v2.${projectVersions.length + 1}.glb`
        : `Gedung_Aula_v2.${projectVersions.length + 1}.glb`);
    const cleanLabel =
      uploadVersionLabel.trim() ||
      `v2.${projectVersions.length + 1} (Update Rangka Atap & Dinding)`;
    const ext = cleanFile.toLowerCase().endsWith('.ifc')
      ? 'IFC'
      : cleanFile.toLowerCase().endsWith('.gltf')
      ? 'glTF'
      : 'GLB';

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' WIB';
    const newVer: BimVersionHistoryItem = {
      id: generateUniqueId('ver-bim'),
      projectKey: selectedProjectOption,
      versionLabel: cleanLabel,
      fileName: cleanFile,
      format: ext,
      fileSize: uploadedFileSize || '18.9 MB',
      uploadedAt: nowStr,
      revisionNotes:
        uploadRevisionNotes.trim() ||
        'Pembaruan geometri model 3D BIM dan sinkronisasi parameter IFC.',
    };

    setVersionHistory((prev) => [newVer, ...prev]);
    setSelectedVersionId(newVer.id);
    setUploadFileName('');
    setUploadVersionLabel('');
    setUploadRevisionNotes('');

    const targetDbModel = db.bim_models[0];
    if (targetDbModel) {
      onUpdateBimModel({
        ...targetDbModel,
        modelName: newVer.fileName,
        version: newVer.versionLabel,
        fileSize: newVer.fileSize,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    setBimFeedback(
      `Model BIM baru "${newVer.fileName}" (${newVer.versionLabel}) berhasil diunggah, divalidasi, dan diaktifkan pada viewport 3D.`
    );
  };

  const handleToggleFullscreen = () => {
    if (!viewportContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewportContainerRef.current.requestFullscreen?.().catch(() => {
        setIsFullscreen((f) => !f);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Vertical layer offsets when Exploded View slider is dragged (0 to 100)
  const expFactor = explodedLevel / 100;
  const offsetFoundation = Math.round(expFactor * 26);
  const offsetStructure = Math.round(expFactor * 5);
  const offsetWalls = Math.round(-expFactor * 16);
  const offsetFinishing = Math.round(-expFactor * 28);
  const offsetRoof = Math.round(-expFactor * 58);

  const mahanggiProgress = db.projects[0]?.overallProgress ?? 60;

  return (
    <div className="space-y-5">
      {bimFeedback && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2"
        >
          <span className="font-medium">{bimFeedback}</span>
          <button
            type="button"
            onClick={() => setBimFeedback(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold"
            aria-label="Tutup notifikasi BIM"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP FILTER CARD: Proyek Konstruksi, Versi Model BIM, Filter Layer Tahapan Konstruksi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label
              htmlFor="bim-project-select"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Proyek Konstruksi
            </label>
            <select
              id="bim-project-select"
              value={selectedProjectOption}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="aula">Pembangunan Gedung Aula (60%)</option>
              <option value="mahanggi">
                Pembangunan Rumah di Gang Mahanggi Tenggarong ({mahanggiProgress}%)
              </option>
            </select>
          </div>

          <div className="md:col-span-8">
            <label
              htmlFor="bim-version-select"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Versi Model BIM (GLB / glTF)
            </label>
            <select
              id="bim-version-select"
              value={activeVersion?.id || ''}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {projectVersions.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.versionLabel} — {ver.fileName} ({ver.format})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Filter Layer Tahapan Konstruksi
          </div>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            {[
              { id: 'ALL' as const, label: 'Semua Tahap' },
              { id: 1 as const, label: '1. Pondasi' },
              { id: 2 as const, label: '2. Struktur' },
              { id: 3 as const, label: '3. Dinding' },
              { id: 4 as const, label: '4. Atap' },
              { id: 5 as const, label: '5. Finishing' },
            ].map((tab) => {
              const active = stageFilter === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => {
                    setStageFilter(tab.id);
                    if (tab.id !== 'ALL') {
                      const match = activeComponents.find((c) => c.stageNumber === tab.id);
                      if (match) handleSelectComponent(match);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3D INTERACTIVE VIEWPORT */}
      <div
        ref={viewportContainerRef}
        data-testid="bim-3d-viewport"
        className={`relative rounded-xl overflow-hidden border border-slate-800 bg-[#091426] text-white select-none flex flex-col justify-between ${
          isFullscreen ? 'min-h-screen' : 'min-h-[420px] sm:min-h-[500px]'
        }`}
      >
        {/* Top-Left File Overlay Badge */}
        <div className="p-4 sm:p-5 z-10 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
          <div className="px-3.5 py-2.5 rounded-lg bg-[#0F1E36]/90 border border-slate-700/80 backdrop-blur-xs shadow-lg pointer-events-auto">
            <div className="font-mono font-bold text-xs sm:text-sm text-white">
              {activeVersion?.fileName || 'Gedung_Aula_SmartBuild_v2.1.glb'}
            </div>
            <div className="font-mono text-[11px] text-slate-300 mt-0.5">
              Format: {activeVersion?.format || 'GLB'} · Klik elemen 3D untuk inspeksi parameter IFC
            </div>
          </div>

          {explodedLevel > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-bold">
              Exploded View Aktif: {explodedLevel}%
            </div>
          )}
        </div>

        {/* Center 3D Architectural Building Scene */}
        <div className="relative flex-1 flex items-center justify-center px-2 py-4 overflow-hidden">
          <svg
            viewBox="0 0 800 460"
            className="w-full max-w-4xl h-[300px] sm:h-[380px] transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoomScale}) rotate(${rotationDeg * 0.15}deg)`,
            }}
            role="img"
            aria-label="Viewport 3D Model Bangunan BIM Interaktif"
          >
            <defs>
              <linearGradient id="skyHorizon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#071120" />
                <stop offset="52%" stopColor="#0D1B30" />
                <stop offset="53%" stopColor="#1B2B44" />
                <stop offset="100%" stopColor="#132036" />
              </linearGradient>
              <radialGradient id="floorSpotlight" cx="50%" cy="55%" r="42%">
                <stop offset="0%" stopColor="#071120" stopOpacity="0.95" />
                <stop offset="75%" stopColor="#0A172B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1B2B44" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Horizon Background */}
            <rect x="0" y="0" width="800" height="460" fill="url(#skyHorizon)" />

            {/* Circular Floor Radar Platform */}
            <ellipse cx="400" cy="315" rx="285" ry="125" fill="url(#floorSpotlight)" />

            {/* Perspective Blueprint Grid Lines */}
            <g stroke="#1E3A5F" strokeWidth="1" opacity="0.65">
              <line x1="70" y1="265" x2="540" y2="430" />
              <line x1="120" y1="245" x2="600" y2="410" />
              <line x1="175" y1="225" x2="660" y2="390" />
              <line x1="230" y1="205" x2="715" y2="370" />
              <line x1="285" y1="185" x2="760" y2="345" />
              <line x1="340" y1="168" x2="790" y2="320" />

              <line x1="730" y1="265" x2="260" y2="430" />
              <line x1="680" y1="245" x2="200" y2="410" />
              <line x1="625" y1="225" x2="140" y2="390" />
              <line x1="570" y1="205" x2="85" y2="370" />
              <line x1="515" y1="185" x2="40" y2="345" />
              <line x1="460" y1="168" x2="10" y2="320" />
            </g>

            {/* Main 3D Building Assembly (rotates/pans slightly with rotationDeg) */}
            <g
              transform={`translate(${Math.sin((rotationDeg * Math.PI) / 180) * 18}, 0)`}
            >
              {/* ============================================================
               * LAYER 1: PONDASI TAPAK & TIE BEAM SLOOF (MINT GREEN)
               * ========================================================== */}
              {(stageFilter === 'ALL' || stageFilter === 1) && (
                <g
                  transform={`translate(0, ${offsetFoundation})`}
                  onClick={() => {
                    const comp = activeComponents.find((c) => c.stageNumber === 1);
                    if (comp) handleSelectComponent(comp);
                  }}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                >
                  {/* Base Foundation Slab */}
                  <polygon
                    points="235,280 445,358 565,292 355,222"
                    fill="#86EFAC"
                    stroke="#34D399"
                    strokeWidth={selectedComp?.stageNumber === 1 ? '3' : '1.5'}
                  />
                  {/* Front Left Thickness */}
                  <polygon
                    points="235,280 445,358 445,374 235,294"
                    fill="#6EE7B7"
                    stroke="#10B981"
                    strokeWidth="1.2"
                  />
                  {/* Front Right Thickness */}
                  <polygon
                    points="445,358 565,292 565,308 445,374"
                    fill="#34D399"
                    stroke="#059669"
                    strokeWidth="1.2"
                  />
                  {/* Footing Pedestal Pads */}
                  <polygon points="246,278 268,286 278,280 256,272" fill="#A7F3D0" />
                  <polygon points="338,312 360,320 370,314 348,306" fill="#A7F3D0" />
                  <polygon points="430,346 452,354 462,348 440,340" fill="#A7F3D0" />
                </g>
              )}

              {/* ============================================================
               * LAYER 3: DINDING BATA RINGAN AAC & PANEL AKUSTIK (YELLOW)
               * ========================================================== */}
              {(stageFilter === 'ALL' || stageFilter === 3) && (
                <g
                  transform={`translate(0, ${offsetWalls})`}
                  onClick={() => {
                    const comp = activeComponents.find((c) => c.stageNumber === 3);
                    if (comp) handleSelectComponent(comp);
                  }}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                >
                  {/* Back Left Wall */}
                  <polygon
                    points="255,274 355,222 355,135 255,182"
                    fill="#EAB308"
                    fillOpacity="0.88"
                    stroke="#CA8A04"
                    strokeWidth="1.5"
                  />
                  {/* Back Right Wall */}
                  <polygon
                    points="355,222 548,286 548,195 355,135"
                    fill="#FACC15"
                    fillOpacity="0.9"
                    stroke="#CA8A04"
                    strokeWidth="1.5"
                  />
                  {/* Front Right Yellow Wall (Main visible yellow wall in screenshot) */}
                  <polygon
                    points="445,348 548,288 548,196 445,250"
                    fill="#FDE047"
                    stroke={selectedComp?.stageNumber === 3 ? '#FFFFFF' : '#EAB308'}
                    strokeWidth={selectedComp?.stageNumber === 3 ? '3' : '1.5'}
                  />
                </g>
              )}

              {/* ============================================================
               * LAYER 2: STRUKTUR KOLOM PEDESTAL & PORTAL BAJA WF (BLUE)
               * ========================================================== */}
              {(stageFilter === 'ALL' || stageFilter === 2) && (
                <g
                  transform={`translate(0, ${offsetStructure})`}
                  onClick={() => {
                    const comp = activeComponents.find((c) => c.stageNumber === 2);
                    if (comp) handleSelectComponent(comp);
                  }}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                >
                  {/* Back Columns */}
                  <polygon points="350,224 360,224 360,130 350,130" fill="#0369A1" />
                  <polygon points="442,255 452,255 452,158 442,158" fill="#0369A1" />
                  <polygon points="542,290 554,290 554,190 542,190" fill="#0284C7" />

                  {/* Front Row 3D Blue Columns (Left, Middle, Right) */}
                  {/* Column 1 (Front-Left) */}
                  <polygon points="248,282 260,287 260,178 248,174" fill="#38BDF8" />
                  <polygon points="260,287 268,282 268,174 260,178" fill="#0284C7" />

                  {/* Column 2 (Front-Center) */}
                  <polygon points="342,317 354,322 354,210 342,205" fill="#38BDF8" />
                  <polygon points="354,322 362,317 362,205 354,210" fill="#0284C7" />

                  {/* Column 3 (Front-Right Corner) */}
                  <polygon points="436,352 450,357 450,242 436,237" fill="#38BDF8" />
                  <polygon points="450,357 460,351 460,237 450,242" fill="#0369A1" />

                  {/* Upper & Mid Perimeter Portal Beams */}
                  {/* Front Top Beam */}
                  <polygon
                    points="248,176 450,244 450,254 248,186"
                    fill="#0EA5E9"
                    stroke="#0284C7"
                    strokeWidth="1"
                  />
                  {/* Front Middle Tie Beam */}
                  <polygon
                    points="254,225 446,292 446,300 254,233"
                    fill="#0284C7"
                  />
                  {/* Right Top Beam */}
                  <polygon
                    points="450,244 554,190 554,200 450,254"
                    fill="#0369A1"
                  />
                  {/* Left Top Beam */}
                  <polygon
                    points="248,176 355,128 355,137 248,185"
                    fill="#0284C7"
                  />
                  {/* Back Right Top Beam */}
                  <polygon
                    points="355,128 554,190 554,199 355,137"
                    fill="#075985"
                  />
                  {/* Internal Cross Portal Beams */}
                  <polygon
                    points="348,208 448,158 454,162 354,212"
                    fill="#0284C7"
                  />
                </g>
              )}

              {/* ============================================================
               * LAYER 5: FINISHING — KANOPI ENTRANCE & CURTAIN WALL (WHITE)
               * ========================================================== */}
              {(stageFilter === 'ALL' || stageFilter === 5) && (
                <g
                  transform={`translate(0, ${offsetFinishing})`}
                  onClick={() => {
                    const comp = activeComponents.find((c) => c.stageNumber === 5);
                    if (comp) handleSelectComponent(comp);
                  }}
                  className="cursor-pointer transition-all duration-300 hover:brightness-105"
                >
                  {/* Cantilevered Front Entrance Canopy */}
                  <polygon
                    points="250,242 365,284 330,305 215,262"
                    fill="#F1F5F9"
                    stroke={selectedComp?.stageNumber === 5 ? '#38BDF8' : '#CBD5E1'}
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="215,262 330,305 330,312 215,269"
                    fill="#CBD5E1"
                  />
                  <polygon
                    points="330,305 365,284 365,291 330,312"
                    fill="#94A3B8"
                  />
                </g>
              )}

              {/* ============================================================
               * LAYER 4: RANGKA ATAP SPACE TRUSS & ZINCALUME (LIGHT BLUE)
               * ========================================================== */}
              {(stageFilter === 'ALL' || stageFilter === 4) && (
                <g
                  transform={`translate(0, ${offsetRoof})`}
                  onClick={() => {
                    const comp = activeComponents.find((c) => c.stageNumber === 4);
                    if (comp) handleSelectComponent(comp);
                  }}
                  className="cursor-pointer transition-all duration-300 hover:brightness-110"
                >
                  {/* Main Sloped Insulated Roof Deck */}
                  <polygon
                    points="290,126 500,192 585,146 375,86"
                    fill="#BAE6FD"
                    stroke={selectedComp?.stageNumber === 4 ? '#FFFFFF' : '#7DD3FC'}
                    strokeWidth={selectedComp?.stageNumber === 4 ? '3' : '1.5'}
                  />
                  {/* Roof Deck Side Trim */}
                  <polygon
                    points="290,126 500,192 500,200 290,134"
                    fill="#7DD3FC"
                  />
                  <polygon
                    points="500,192 585,146 585,154 500,200"
                    fill="#38BDF8"
                  />
                  {/* Exposed Front Purlin / Space Truss Bars */}
                  <polygon
                    points="232,148 475,222 480,216 237,142"
                    fill="#7DD3FC"
                  />
                  <polygon
                    points="232,148 475,222 475,228 232,154"
                    fill="#38BDF8"
                  />
                  <polygon
                    points="272,130 515,204 520,198 277,124"
                    fill="#93C5FD"
                  />
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Bottom Collapsible Control Bar & Exploded View Slider */}
        <div className="p-3 sm:p-4 z-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShowViewportControls((s) => !s)}
            className="px-3.5 py-1.5 rounded-lg bg-[#0F1E36]/95 hover:bg-[#162947] border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-md"
          >
            <span>{showViewportControls ? '⌄ Sembunyikan Kontrol' : '⌃ Tampilkan Kontrol'}</span>
          </button>

          {showViewportControls && (
            <div className="w-full max-w-5xl px-4 py-3 rounded-xl bg-[#0F1E36]/95 border border-slate-700/90 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xl">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotationDeg((r) => r - 30)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-xs font-semibold text-white transition-colors"
                >
                  Putar Kiri 30°
                </button>
                <button
                  type="button"
                  onClick={() => setRotationDeg((r) => r + 30)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-xs font-semibold text-white transition-colors"
                >
                  Putar Kanan 30°
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-xs font-semibold text-white transition-colors"
                >
                  ⊕ Zoom In
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-xs font-semibold text-white transition-colors"
                >
                  ⊖ Zoom Out
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRotationDeg(0);
                    setZoomScale(1);
                    setExplodedLevel(0);
                    setStageFilter('ALL');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="px-3 py-1.5 rounded-lg bg-[#0284C7] hover:bg-sky-500 text-xs font-semibold text-white transition-colors"
                >
                  ⤢ Fullscreen
                </button>
              </div>

              {/* Exploded View Slider */}
              <div className="flex items-center gap-2.5 text-xs shrink-0">
                <span className="text-sky-400 font-semibold flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" />
                  <span>Exploded View:</span>
                </span>
                <input
                  type="range"
                  aria-label="Slider Exploded View Model BIM"
                  min={0}
                  max={100}
                  value={explodedLevel}
                  onChange={(e) => setExplodedLevel(Number(e.target.value))}
                  className="w-28 sm:w-36 accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM 3-COLUMN SECTION: Inspector + Component List + Upload & Version History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* COLUMN 1: Informasi Teknis Elemen BIM Terpilih (with Edit capability) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          {selectedComp && !isEditingElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                  Informasi Teknis Elemen BIM Terpilih
                </h2>
                <Box className="w-4 h-4 text-[#0284C7] shrink-0" />
              </div>

              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Nama Objek</div>
                <div className="text-sm font-bold text-[#0F172A] dark:text-white mt-0.5">
                  {selectedComp.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Jenis Objek</div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                    {selectedComp.objectType}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Kategori IFC</div>
                  <div className="text-xs font-mono font-bold text-[#0284C7] dark:text-sky-400 mt-0.5">
                    {selectedComp.ifcCategory}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Material &amp; Mutu
                </div>
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                  {selectedComp.materialSpec}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ukuran / Dimensi
                  </div>
                  <div className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                    {selectedComp.dimensions}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Volume Estimasi
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedComp.volumeEstimate}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {selectedComp.stageLabel} ({selectedComp.statusLabel})
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedComp.completionPct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedComp.completionPct >= 100
                        ? 'bg-[#10B981]'
                        : selectedComp.completionPct > 0
                        ? 'bg-[#0284C7]'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ width: `${selectedComp.completionPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  Catatan Teknis: {selectedComp.technicalNotes}
                </p>
              </div>
            </div>
          ) : (
            /* INLINE EDITOR FORM FOR SELECTED BIM ELEMENT */
            <form onSubmit={handleSaveEditedElement} className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-[#071D49] dark:text-white">
                  Edit Parameter IFC &amp; Spesifikasi Elemen BIM
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingElement(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Objek BIM
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Objek
                  </label>
                  <input
                    type="text"
                    value={editForm.objectType}
                    onChange={(e) => setEditForm({ ...editForm, objectType: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori IFC
                  </label>
                  <input
                    type="text"
                    value={editForm.ifcCategory}
                    onChange={(e) => setEditForm({ ...editForm, ifcCategory: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Material &amp; Mutu
                </label>
                <input
                  type="text"
                  value={editForm.materialSpec}
                  onChange={(e) => setEditForm({ ...editForm, materialSpec: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ukuran / Dimensi
                  </label>
                  <input
                    type="text"
                    value={editForm.dimensions}
                    onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Volume Estimasi
                  </label>
                  <input
                    type="text"
                    value={editForm.volumeEstimate}
                    onChange={(e) => setEditForm({ ...editForm, volumeEstimate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Realisasi Progres Elemen (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.completionPct}
                  onChange={(e) =>
                    setEditForm({ ...editForm, completionPct: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Teknis Lapangan
                </label>
                <textarea
                  rows={2}
                  value={editForm.technicalNotes}
                  onChange={(e) => setEditForm({ ...editForm, technicalNotes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingElement(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white font-semibold"
                >
                  Simpan Perubahan BIM
                </button>
              </div>
            </form>
          )}

          {!isEditingElement && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleStartEditElement}
                className="w-full py-2 px-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 text-[#1264F4] dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>✎ Edit Spesifikasi &amp; Progres Elemen BIM</span>
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 2: Daftar Komponen Bangunan & Integrasi Tahapan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white leading-snug">
                Daftar Komponen Bangunan &amp; Integrasi Tahapan
              </h2>
            </div>

            <div className="space-y-2.5">
              {activeComponents.map((comp) => {
                const isSelected = selectedComp?.id === comp.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelectComponent(comp)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#38BDF8] bg-[#F0F9FF] dark:bg-sky-950/40 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-bold text-[#0F172A] dark:text-white leading-snug">
                        {comp.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {comp.ifcCategory} · {comp.stageLabel} ({comp.statusLabel})
                      </div>
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white shrink-0">
                      {comp.completionPct}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kepatuhan Teknis BIM (Bagian 11.3 PRD) */}
          <div className="p-3.5 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-800/70 text-[11px] text-[#92400E] dark:text-amber-200 leading-relaxed">
            <strong className="font-bold">Kepatuhan Teknis BIM (Bagian 11.3 PRD):</strong>{' '}
            Visualisasi model 3D BIM digunakan sebagai acuan desain dan pemetaan tahapan.
            Pemeriksaan kesesuaian kondisi aktual lapangan tetap wajib divalidasi oleh{' '}
            <strong className="font-bold">Project Supervisor</strong> yang berwenang.
          </div>
        </div>

        {/* COLUMN 3: Unggah Versi Model BIM (.GLB / .glTF / .IFC) & Riwayat Versi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white leading-snug">
                Unggah Versi Model BIM (.GLB / .glTF / .IFC)
              </h2>
            </div>

            <form onSubmit={handleUploadBimVersion} className="space-y-3 text-xs">
              {/* Real Device File Picker */}
              <div>
                <input
                  ref={bimFileInputRef}
                  type="file"
                  accept=".glb,.gltf,.ifc,.rvt,.obj"
                  onChange={handleBimFilePickerChange}
                  className="hidden"
                  id="bim-model-file-picker"
                />
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="bim-upload-filename"
                    className="font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Nama File Model (.glb / .gltf / .ifc)
                  </label>
                  <button
                    type="button"
                    onClick={() => bimFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-[#1264F4] dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Pilih File HP/PC</span>
                  </button>
                </div>
                <input
                  id="bim-upload-filename"
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="Contoh: Gedung_Aula_v2.2.glb"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="bim-upload-label"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Label Versi Model
                </label>
                <input
                  id="bim-upload-label"
                  type="text"
                  value={uploadVersionLabel}
                  onChange={(e) => setUploadVersionLabel(e.target.value)}
                  placeholder="Contoh: v2.2 (Update Rangka Atap)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="bim-upload-notes"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Catatan Revisi Model
                </label>
                <input
                  id="bim-upload-notes"
                  type="text"
                  value={uploadRevisionNotes}
                  onChange={(e) => setUploadRevisionNotes(e.target.value)}
                  placeholder="Deskripsi perubahan geometri BIM..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah &amp; Validasi Model BIM</span>
              </button>
            </form>

            {/* Riwayat Versi Model */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Riwayat Versi Model
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {projectVersions.map((ver) => {
                  const isCurrent = activeVersion?.id === ver.id;
                  return (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-[#0284C7] bg-sky-50/60 dark:bg-sky-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                        {ver.versionLabel}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {ver.fileName} · {ver.fileSize} · {ver.uploadedAt}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MODUL F: VERIFIKASI PEKERJAAN TERPADU (TEKNIS SUPERVISOR & ADMINISTRASI PRD 3.5)
 * ========================================================================== */

interface AdminVerificationDocumentItem {
  id: string;
  fileName: string;
  stageLabel: string;
  projectName: string;
  uploaderName: string;
  uploaderOrg: string;
  uploadedAt: string;
  technicalStatus: 'Diterima' | 'Menunggu pemeriksaan' | 'Perlu Revisi Teknis';
  adminStatus: 'Dokumen Lengkap & Valid' | 'Menunggu Verifikasi' | 'Perlu Revisi Dokumen';
  linkedVerificationId?: string;
}

const INITIAL_ADMIN_VERIFICATION_DOCS: AdminVerificationDocumentItem[] = [
  {
    id: 'adm-doc-1',
    fileName: 'pondasi_aula_k350_final.jpg',
    stageLabel: '2. Pondasi',
    projectName: 'Pembangunan Gedung Aula',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-09-15 16:40 WIB',
    technicalStatus: 'Diterima',
    adminStatus: 'Dokumen Lengkap & Valid',
  },
  {
    id: 'adm-doc-2',
    fileName: 'laporan_uji_tekan_pondasi_aula.pdf',
    stageLabel: '2. Pondasi',
    projectName: 'Pembangunan Gedung Aula',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-09-16 09:20 WIB',
    technicalStatus: 'Diterima',
    adminStatus: 'Dokumen Lengkap & Valid',
  },
  {
    id: 'adm-doc-3',
    fileName: 'struktur_baja_wf_aula.jpg',
    stageLabel: '3. Struktur',
    projectName: 'Pembangunan Gedung Aula',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-10-29 17:10 WIB',
    technicalStatus: 'Diterima',
    adminStatus: 'Dokumen Lengkap & Valid',
  },
  {
    id: 'adm-doc-4',
    fileName: 'ba_struktur_dan_ndt_aula.pdf',
    stageLabel: '3. Struktur',
    projectName: 'Pembangunan Gedung Aula',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-10-30 10:05 WIB',
    technicalStatus: 'Diterima',
    adminStatus: 'Dokumen Lengkap & Valid',
  },
  {
    id: 'adm-doc-5',
    fileName: 'fasad_kaca_kantor_pusat.png',
    stageLabel: '4. Dinding Partisi & Fasad',
    projectName: 'Renovasi Kantor Pusat',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-11-22 15:30 WIB',
    technicalStatus: 'Menunggu pemeriksaan',
    adminStatus: 'Menunggu Verifikasi',
  },
  {
    id: 'adm-doc-6',
    fileName: 'uji_sealant_fasad_kantor.pdf',
    stageLabel: '5. Plafon & Atap Kanopi',
    projectName: 'Renovasi Kantor Pusat',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-11-23 11:00 WIB',
    technicalStatus: 'Menunggu pemeriksaan',
    adminStatus: 'Menunggu Verifikasi',
  },
  {
    id: 'adm-doc-7',
    fileName: 'bast_pho_rumah_tinggal.pdf',
    stageLabel: '8. Pemeriksaan Akhir',
    projectName: 'Pembangunan Rumah di Gang Mahanggi Tenggarong',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-10-12 14:00 WIB',
    technicalStatus: 'Diterima',
    adminStatus: 'Dokumen Lengkap & Valid',
  },
  {
    id: 'adm-doc-8',
    fileName: 'dinding_bata_dan_rangka_atap_mahanggi.jpg',
    stageLabel: '3. Dinding dan Atap',
    projectName: 'Pembangunan Rumah di Gang Mahanggi Tenggarong',
    uploaderName: 'Muhajirin Kasim',
    uploaderOrg: 'Muhajirin Kasim Konstruksi',
    uploadedAt: '2026-11-25 14:30 WIB',
    technicalStatus: 'Menunggu pemeriksaan',
    adminStatus: 'Menunggu Verifikasi',
    linkedVerificationId: 'ver-003',
  },
];

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
  const [adminDocs, setAdminDocs] = useState<AdminVerificationDocumentItem[]>(
    INITIAL_ADMIN_VERIFICATION_DOCS
  );
  const [selectedVer, setSelectedVer] = useState<VerificationRecord | null>(null);
  const [approvedPctInput, setApprovedPctInput] = useState<number>(100);
  const [notesInput, setNotesInput] = useState<string>('');
  const [bimCheckedInput, setBimCheckedInput] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AdminVerificationDocumentItem | null>(null);

  const canVerify = canPerformAction(currentUser.role, 'verify_progress');

  const openVerificationModal = (ver: VerificationRecord) => {
    setSelectedVer(ver);
    setApprovedPctInput(
      ver.approvedPercentage > 0 ? ver.approvedPercentage : ver.submittedPercentage
    );
    setNotesInput(ver.notes);
    setBimCheckedInput(ver.bimChecked || true);
  };

  const handleAdminValidate = (
    docItem: AdminVerificationDocumentItem,
    nextAdminStatus: 'Dokumen Lengkap & Valid' | 'Perlu Revisi Dokumen'
  ) => {
    setAdminDocs((prev) =>
      prev.map((d) =>
        d.id === docItem.id
          ? {
              ...d,
              adminStatus: nextAdminStatus,
              technicalStatus:
                nextAdminStatus === 'Dokumen Lengkap & Valid' ? 'Diterima' : d.technicalStatus,
            }
          : d
      )
    );
    setFeedback(
      nextAdminStatus === 'Dokumen Lengkap & Valid'
        ? `Berkas "${docItem.fileName}" (${docItem.stageLabel}) telah divalidasi: Dokumen Lengkap & Valid.`
        : `Permintaan revisi dokumen telah dikirimkan untuk berkas "${docItem.fileName}" (${docItem.stageLabel}).`
    );
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

    if (decisionStatus === 'Disetujui') {
      setAdminDocs((prev) =>
        prev.map((d) =>
          d.linkedVerificationId === selectedVer.id
            ? {
                ...d,
                technicalStatus: 'Diterima',
                adminStatus: 'Dokumen Lengkap & Valid',
              }
            : d
        )
      );
    }

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

  const validDocsCount = adminDocs.filter(
    (d) => d.adminStatus === 'Dokumen Lengkap & Valid'
  ).length;
  const pendingDocsCount = adminDocs.filter(
    (d) => d.adminStatus !== 'Dokumen Lengkap & Valid'
  ).length;
  const approvedStagesCount = db.verifications.filter((v) => v.status === 'Disetujui').length;

  return (
    <div className="space-y-6">
      {/* KPI Monitoring Ringkas Terpadu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Berkas Bukti Digital
          </div>
          <div className="text-xl font-bold font-mono text-[#071D49] dark:text-white mt-1">
            {adminDocs.length} Berkas
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Terhubung pemeriksaan teknis &amp; administrasi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Dokumen Lengkap &amp; Valid
          </div>
          <div className="text-xl font-bold font-mono text-[#10B981] mt-1">
            {validDocsCount} / {adminDocs.length} Valid
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
            Lulus Verifikasi Administratif (PRD 3.5)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Menunggu Verifikasi / Revisi
          </div>
          <div className="text-xl font-bold font-mono text-[#D97706] mt-1">
            {pendingDocsCount} Berkas
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            Siap divalidasi oleh Verifikator
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tahapan Lulus Pemeriksaan Teknis
          </div>
          <div className="text-xl font-bold font-mono text-[#1264F4] dark:text-blue-400 mt-1">
            {approvedStagesCount} / {db.verifications.length} Tahap
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Otomatis trigger Smart Contract Escrow
          </div>
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
            className="font-bold text-emerald-700 dark:text-emerald-300"
            aria-label="Tutup pesan verifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BAGIAN 1: VERIFIKASI ADMINISTRASI & KELENGKAPAN DOKUMEN (BAGIAN 3.5 PRD) */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
              Verifikasi Administrasi &amp; Kelengkapan Dokumen (Bagian 3.5 PRD)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pemisahan tegas antara verifikasi kelengkapan dokumen administratif oleh Verifikator
              Administrasi dan pemeriksaan teknis konstruksi oleh Project Supervisor.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {/* Mobile Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {adminDocs.map((doc) => (
              <div key={doc.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="font-bold text-slate-900 dark:text-white hover:text-[#1264F4] text-left break-all"
                    >
                      {doc.fileName}
                    </button>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {doc.stageLabel} · {doc.projectName}
                    </div>
                  </div>
                  <span
                    className={`font-bold text-[11px] shrink-0 ${
                      doc.adminStatus === 'Dokumen Lengkap & Valid'
                        ? 'text-[#059669]'
                        : doc.adminStatus === 'Perlu Revisi Dokumen'
                        ? 'text-red-600'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {doc.adminStatus}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    Pengunggah: <strong>{doc.uploaderName}</strong> ({doc.uploaderOrg})
                  </div>
                  <div className="font-mono text-slate-400">{doc.uploadedAt}</div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500">
                    Pemeriksaan Teknis:{' '}
                    <strong className="text-slate-800 dark:text-slate-100">
                      {doc.technicalStatus}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdminValidate(doc, 'Dokumen Lengkap & Valid')}
                    className="py-2 px-3 rounded-lg bg-[#86C5AC] hover:bg-[#059669] text-white font-bold text-xs transition-colors"
                  >
                    Validasi Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminValidate(doc, 'Perlu Revisi Dokumen')}
                    className="py-2 px-3 rounded-lg bg-[#E5989B] hover:bg-red-600 text-white font-bold text-xs transition-colors"
                  >
                    Minta Revisi Dokumen
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) matching image_555ee64a.png */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
                  <th className="py-3.5 px-5 font-semibold">Berkas &amp; Tahap</th>
                  <th className="py-3.5 px-5 font-semibold">Pengunggah &amp; Waktu</th>
                  <th className="py-3.5 px-5 font-semibold">Pemeriksaan Teknis (Supervisor)</th>
                  <th className="py-3.5 px-5 font-semibold">Verifikasi Administratif</th>
                  <th className="py-3.5 px-5 font-semibold">Tindakan Verifikator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {adminDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="font-bold text-sm text-[#0F172A] dark:text-white hover:text-[#1264F4] text-left block"
                      >
                        {doc.fileName}
                      </button>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {doc.stageLabel}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-700 dark:text-slate-200 font-medium">
                        {doc.uploaderName} ({doc.uploaderOrg})
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {doc.uploadedAt}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {doc.technicalStatus}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`font-bold ${
                          doc.adminStatus === 'Dokumen Lengkap & Valid'
                            ? 'text-[#059669] dark:text-emerald-400'
                            : doc.adminStatus === 'Perlu Revisi Dokumen'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-[#D97706] dark:text-amber-400'
                        }`}
                      >
                        {doc.adminStatus}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdminValidate(doc, 'Dokumen Lengkap & Valid')}
                          className="px-3.5 py-2 rounded-lg bg-[#84C3AA] hover:bg-[#059669] text-white font-bold text-xs transition-colors leading-tight text-center"
                        >
                          Validasi Lengkap
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminValidate(doc, 'Perlu Revisi Dokumen')}
                          className="px-3.5 py-2 rounded-lg bg-[#E49598] hover:bg-red-600 text-white font-bold text-xs transition-colors leading-tight text-center"
                        >
                          Minta Revisi Dokumen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BAGIAN 2: PEMERIKSAAN TEKNIS TAHAPAN KONSTRUKSI & PENCAIRAN OTOMATIS (PROJECT SUPERVISOR) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#071D49] dark:text-white">
              Monitoring Pemeriksaan Teknis Tahapan &amp; Pencairan Smart Contract (Project Supervisor)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Panel terpadu untuk memeriksa progres fisik tahapan konstruksi, validasi objek BIM 3D,
              dan menyetujui pencairan otomatis ke rekening kontraktor.
            </p>
          </div>

          <select
            aria-label="Filter status verifikasi"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">Semua Status Pemeriksaan ({db.verifications.length})</option>
            <option value="Menunggu pemeriksaan">Menunggu pemeriksaan</option>
            <option value="Dalam pemeriksaan">Dalam pemeriksaan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Memerlukan revisi">Memerlukan revisi</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        {/* Mobile Verification Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredVerifications.map((ver) => (
            <div key={ver.id} className="p-4 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {ver.id} · {formatDateID(ver.verificationDate)}
                  </div>
                  <div className="font-bold text-[#071D49] dark:text-white text-sm mt-0.5 leading-snug">
                    {ver.projectName}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] shrink-0 ${
                    ver.status === 'Disetujui'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]'
                      : ver.status === 'Ditolak'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]'
                  }`}
                >
                  {ver.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  Tahap: {ver.milestoneName}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Bukti: {ver.supportingEvidenceSummary}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <div>
                  Diajukan: <strong className="font-mono">{ver.submittedPercentage}%</strong> ·
                  Disetujui:{' '}
                  <strong className="font-mono text-[#1264F4] dark:text-blue-400">
                    {ver.approvedPercentage}%
                  </strong>
                </div>
                <div className="text-right">
                  BIM: <strong>{ver.bimChecked ? 'Terperiksa' : 'Belum'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pengawas: {ver.verifierName}
                </span>
                <button
                  type="button"
                  onClick={() => openVerificationModal(ver)}
                  className="px-3 py-1.5 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{canVerify ? 'Periksa & Putuskan' : 'Lihat Bukti'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Verification Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 font-semibold">ID Verifikasi &amp; Proyek</th>
                <th className="py-3 px-4 font-semibold">Tahap Pekerjaan &amp; Bukti Digital</th>
                <th className="py-3 px-4 font-semibold text-right">Diajukan</th>
                <th className="py-3 px-4 font-semibold text-right">Disetujui</th>
                <th className="py-3 px-4 font-semibold">Supervisor &amp; BIM</th>
                <th className="py-3 px-4 font-semibold">Status Teknis</th>
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

      {/* Modal Preview Berkas Administratif */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#1264F4]">
                  Detail Berkas Verifikasi Administrasi (PRD 3.5)
                </span>
                <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 break-all">
                  {previewDoc.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Proyek:</span>
                <strong className="text-slate-900 dark:text-white">{previewDoc.projectName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tahap Konstruksi:</span>
                <strong className="text-slate-900 dark:text-white">{previewDoc.stageLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span>Pengunggah:</span>
                <strong>
                  {previewDoc.uploaderName} ({previewDoc.uploaderOrg})
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Pemeriksaan Teknis (Supervisor):</span>
                <strong>{previewDoc.technicalStatus}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status Administratif:</span>
                <strong
                  className={
                    previewDoc.adminStatus === 'Dokumen Lengkap & Valid'
                      ? 'text-[#059669]'
                      : 'text-[#D97706]'
                  }
                >
                  {previewDoc.adminStatus}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleAdminValidate(previewDoc, 'Dokumen Lengkap & Valid');
                  setPreviewDoc(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#059669] text-white font-bold"
              >
                Validasi Lengkap
              </button>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Verifikasi Teknis, Preview Bukti Digital & Keputusan */}
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

