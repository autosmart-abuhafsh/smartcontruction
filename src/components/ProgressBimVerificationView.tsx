import React, { useState } from 'react';
import {
  Plus,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileCheck2,
  Box,
  Upload,
  Link2,
  Eye,
  X,
  Info,
  Camera,
} from 'lucide-react';
import {
  BimModel,
  BimObjectElement,
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
} from '../utils/calculations';

/* ============================================================================
 * MODUL D: MANAJEMEN PROGRES PEKERJAAN
 * ========================================================================== */

interface ProgressViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onSubmitProgressReport: (report: Omit<ProgressReport, 'id'>) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  db,
  currentUser,
  onSubmitProgressReport,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(db.projects[0]?.id || 'prj-001');
  const [showReportModal, setShowReportModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedProject =
    db.projects.find((p) => p.id === selectedProjectId) || db.projects[0];
  const projectMilestones = db.contract_milestones.filter(
    (m) => m.projectId === selectedProject?.id
  );
  const projectReports = db.progress_reports.filter(
    (r) => r.projectId === selectedProject?.id
  );

  // New Report Form
  const [milestoneId, setMilestoneId] = useState(projectMilestones[2]?.id || projectMilestones[0]?.id || 'ms-003');
  const [submittedPercentage, setSubmittedPercentage] = useState<number>(100);
  const [reportDate, setReportDate] = useState('2026-11-25');
  const [workDescription, setWorkDescription] = useState('');
  const [contractorNotes, setContractorNotes] = useState('');
  const [photoName, setPhotoName] = useState('Foto_Lapangan_Tahapan_Terbaru.jpg');
  const [docName, setDocName] = useState('Berita_Acara_Opname_Lapangan.pdf');
  const [formError, setFormError] = useState('');

  const openReportForm = () => {
    const defaultMs =
      projectMilestones.find((m) => m.status !== 'Selesai') || projectMilestones[0];
    setMilestoneId(defaultMs?.id || '');
    setSubmittedPercentage(100);
    setReportDate('2026-11-25');
    setWorkDescription('');
    setContractorNotes('');
    setFormError('');
    setShowReportModal(true);
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
      contractorNotes: contractorNotes.trim() || 'Diajukan untuk pemeriksaan verifikator.',
      submittedBy: currentUser.name,
      verificationStatus: 'Menunggu pemeriksaan',
      attachments: [
        {
          id: `att-${Date.now()}-1`,
          reportId: '',
          fileName: photoName.trim() || 'Dokumentasi_Visual.jpg',
          fileType: 'Foto Dokumentasi',
          fileSize: '2.6 MB',
          uploadedAt: reportDate,
        },
        {
          id: `att-${Date.now()}-2`,
          reportId: '',
          fileName: docName.trim() || 'Dokumen_Pendukung.pdf',
          fileType: 'Dokumen Teknis',
          fileSize: '1.2 MB',
          uploadedAt: reportDate,
        },
      ],
      bimObjectIds: ms?.bimElementGroupId ? [ms.bimElementGroupId] : [],
      isDemo: true,
    });
    setShowReportModal(false);
    setFeedback(
      `Laporan progres tahapan "${ms?.name}" (${submittedPercentage}%) berhasil dikirim dan menunggu verifikasi.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#071D49]">
            Manajemen Progres Pekerjaan Konstruksi
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Pantau target versus realisasi setiap tahapan, timeline pelaksanaan, dan ajukan laporan
            progres untuk diverifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Pilih proyek untuk progres"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
          >
            {db.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name} ({p.overallProgress}%)
              </option>
            ))}
          </select>

          {canPerformAction(currentUser.role, 'submit_progress') && (
            <button
              type="button"
              onClick={openReportForm}
              className="px-4 py-2 bg-[#1264F4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Input Laporan Progres</span>
            </button>
          )}
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
            aria-label="Tutup pesan progres"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overall Project Progress Summary Card */}
      {selectedProject && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500">
                Proyek: <strong className="text-slate-800">{selectedProject.name}</strong> ·
                Kontraktor: {selectedProject.contractorName} · Status: {selectedProject.status}
              </div>
              <h2 className="text-base font-bold text-[#071D49] mt-0.5">
                Persentase Penyelesaian Keseluruhan (Terverifikasi)
              </h2>
            </div>
            <div className="text-2xl font-bold font-mono text-[#1264F4] tabular-nums">
              {selectedProject.overallProgress}% / 100%
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1264F4] transition-all"
              style={{ width: `${selectedProject.overallProgress}%` }}
            />
          </div>

          {/* Timeline & Target vs Realisasi Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {projectMilestones.map((ms) => (
              <div
                key={ms.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#071D49]">
                      Tahap {ms.order}: {ms.name}
                    </span>
                    <span className="font-mono font-semibold text-slate-600 tabular-nums">
                      Bobot {ms.weightPercentage}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{ms.description}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="flex justify-between tabular-nums">
                    <span className="text-slate-500">Target vs Realisasi:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {ms.targetProgress}% vs {ms.realizedProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        ms.realizedProgress >= 100 ? 'bg-[#10B981]' : 'bg-[#1264F4]'
                      }`}
                      style={{ width: `${ms.realizedProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Batas: {formatDateID(ms.dueDate)}</span>
                    <span className="font-semibold text-slate-700">{ms.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Laporan Progres */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#071D49]">Riwayat Laporan Progres Lapangan</h2>
            <p className="text-xs text-slate-500">
              Catatan: Laporan progres yang diajukan kontraktor tidak langsung dianggap valid
              sebelum disetujui oleh Verifikator.
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {projectReports.length} laporan tercatat
          </span>
        </div>

        <div className="space-y-3">
          {projectReports.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Belum ada laporan progres untuk proyek ini.
            </p>
          ) : (
            projectReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">
                    <span className="font-mono">{rep.id}</span> · Tanggal:{' '}
                    {formatDateID(rep.reportDate)} · Pelapor: {rep.submittedBy} ·{' '}
                    {rep.isDemo ? 'DEMO' : 'LIVE'}
                  </div>
                  <div className="text-sm font-bold text-[#071D49]">
                    Tahapan: {rep.milestoneName} — Pengajuan Realisasi {rep.submittedPercentage}%
                    (Target {rep.targetPercentage}%)
                  </div>
                  <p className="text-xs text-slate-600">{rep.workDescription}</p>
                  <div className="text-[11px] text-slate-500">
                    Catatan Kontraktor: {rep.contractorNotes}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                    {rep.attachments.map((att) => (
                      <span key={att.id} className="flex items-center gap-1 font-mono">
                        <Camera className="w-3 h-3 text-[#1264F4]" />
                        {att.fileName} ({att.fileSize})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs text-slate-500">Status Verifikasi:</div>
                  <div
                    className={`text-xs font-bold ${
                      rep.verificationStatus === 'Disetujui'
                        ? 'text-[#10B981]'
                        : rep.verificationStatus === 'Ditolak'
                        ? 'text-red-600'
                        : 'text-[#F59E0B]'
                    }`}
                  >
                    {rep.verificationStatus}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Input Laporan Progres */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-[#071D49]">
                Input Laporan Progres Pekerjaan
              </h2>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Tutup modal laporan progres"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
              <div>
                <label htmlFor="rep-ms" className="block font-semibold text-slate-700 mb-1">
                  Pilih Tahapan Pekerjaan ({selectedProject?.name})
                </label>
                <select
                  id="rep-ms"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {projectMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      Tahap {m.order}: {m.name} (Bobot {m.weightPercentage}% - Saat ini{' '}
                      {m.realizedProgress}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="rep-pct" className="block font-semibold text-slate-700 mb-1">
                    Realisasi Progres Tahapan (%)
                  </label>
                  <input
                    id="rep-pct"
                    type="number"
                    min={1}
                    max={100}
                    value={submittedPercentage}
                    onChange={(e) => setSubmittedPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="rep-date" className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pelaporan
                  </label>
                  <input
                    id="rep-date"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rep-desc" className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Pekerjaan yang Diselesaikan
                </label>
                <textarea
                  id="rep-desc"
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Jelaskan detail pelaksanaan fisik, hasil pengujian mutu, dan kesesuaian gambar kerja..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="rep-notes" className="block font-semibold text-slate-700 mb-1">
                  Catatan Kontraktor
                </label>
                <input
                  id="rep-notes"
                  type="text"
                  value={contractorNotes}
                  onChange={(e) => setContractorNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk verifikator lapangan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label htmlFor="rep-photo" className="block font-semibold text-slate-700 mb-1">
                    Nama File Foto Dokumentasi
                  </label>
                  <input
                    id="rep-photo"
                    type="text"
                    value={photoName}
                    onChange={(e) => setPhotoName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="rep-doc" className="block font-semibold text-slate-700 mb-1">
                    Nama Dokumen Pendukung
                  </label>
                  <input
                    id="rep-doc"
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1264F4] text-white font-semibold hover:bg-blue-700"
                >
                  Kirim Laporan &amp; Ajukan Verifikasi
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">
            Status Arsitektur BIM:{' '}
            <strong className="text-[#1264F4]">{currentModel?.integrationStatus}</strong>
          </div>
          <h1 className="text-xl font-bold text-[#071D49] mt-0.5">
            BIM Viewer 3D &amp; Integrasi Model Bangunan
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Visualisasi struktural 3D terhubung tahapan pekerjaan, metadata objek bangunan, dan
            penyimpanan referensi file IFC/Revit siap ekspansi API BIM.
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
          className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
        >
          {db.bim_models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.projectName} — {m.modelName} ({m.format})
            </option>
          ))}
        </select>
      </div>

      {/* Honest MVP Notice */}
      <div className="bg-[#EAF2FF] border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-[#071D49]">
        <Info className="w-4 h-4 text-[#1264F4] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Catatan Transparansi Integrasi BIM (MVP):</span> Komponen
          viewer 3D di bawah menampilkan proyeksi struktural interaktif yang dihubungkan dengan
          tahapan kontrak dan laporan progres. Parser penuh IFC/Revit Cloud API disiapkan melalui
          adapter referensi file &amp; URL model agar siap dihubungkan ke engine BIM Server pada
          Tahap 2.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive 3D Isometric Viewport */}
        <div className="lg:col-span-8 bg-[#071D49] text-white rounded-xl border border-slate-800 p-5 space-y-4">
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
            className="relative bg-slate-950/70 rounded-xl border border-white/10 p-4 flex items-center justify-center min-h-[380px]"
          >
            <svg
              viewBox="0 0 600 340"
              className="w-full max-w-xl h-80 select-none transition-transform duration-200"
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

              {/* TAHAP 1: PONDASI (Foundation Footings & Sloof) */}
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
                  {/* Footing pads */}
                  <rect x="145" y="252" width="22" height="14" fill="#10B981" />
                  <rect x="289" y="290" width="22" height="14" fill="#10B981" />
                  <rect x="435" y="252" width="22" height="14" fill="#10B981" />
                  <rect x="289" y="215" width="22" height="14" fill="#10B981" />
                  <text x="300" y="295" textAnchor="middle" fill="#A7F3D0" fontSize="11" fontFamily="monospace">
                    [1] PONDASI TAPAK &amp; SLOOF (100% SELESAI)
                  </text>
                </g>
              )}

              {/* TAHAP 2: STRUKTUR (Columns & Beams Lantai 1-2) */}
              {(highlightFilter === 'ALL' || highlightFilter === 'Struktur') && (
                <g
                  onClick={() => {
                    const el = currentModel?.elements.find((e) => e.category === 'Struktur');
                    if (el) setSelectedElementId(el.id);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-95"
                >
                  {/* Vertical Columns */}
                  <line x1="155" y1="255" x2="155" y2="145" stroke="#10B981" strokeWidth="6" />
                  <line x1="300" y1="292" x2="300" y2="175" stroke="#10B981" strokeWidth="6" />
                  <line x1="445" y1="255" x2="445" y2="145" stroke="#10B981" strokeWidth="6" />
                  <line x1="300" y1="220" x2="300" y2="115" stroke="#10B981" strokeWidth="5" />
                  {/* Second floor structural slab */}
                  <polygon
                    points="155,195 300,232 445,195 300,158"
                    fill="#10B981"
                    fillOpacity={selectedElement?.category === 'Struktur' ? '0.5' : '0.28'}
                    stroke="#34D399"
                    strokeWidth="2"
                  />
                  <text x="300" y="202" textAnchor="middle" fill="#D1FAE5" fontSize="11" fontFamily="monospace">
                    [2] STRUKTUR KOLOM &amp; BALOK (100% SELESAI)
                  </text>
                </g>
              )}

              {/* TAHAP 3: DINDING DAN ATAP (Envelope Walls & Steel Roof Truss) */}
              {(highlightFilter === 'ALL' || highlightFilter === 'Dinding dan Atap') && (
                <g
                  onClick={() => {
                    const el = currentModel?.elements.find((e) => e.category === 'Dinding dan Atap');
                    if (el) setSelectedElementId(el.id);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-95"
                >
                  {/* Roof Steel Trusses */}
                  <polygon
                    points="140,145 300,70 460,145 300,180"
                    fill="#1264F4"
                    fillOpacity={selectedElement?.category === 'Dinding dan Atap' ? '0.6' : '0.35'}
                    stroke="#60A5FA"
                    strokeWidth="2.5"
                  />
                  <line x1="220" y1="108" x2="300" y2="180" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 2" />
                  <line x1="380" y1="108" x2="300" y2="180" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="300" y="132" textAnchor="middle" fill="#DBEAFE" fontSize="11" fontFamily="monospace">
                    [3] DINDING &amp; ATAP BAJA (DALAM PROSES / VERIFIKASI)
                  </text>
                </g>
              )}

              {/* TAHAP 4: FINISHING (Interior Acoustic & Flooring) */}
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
                  <text x="300" y="250" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontFamily="monospace">
                    [4] FINISHING &amp; MEP (BELUM DIMULAI - 0%)
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-slate-300">
            <span>Klik komponen 3D di atas atau daftar elemen di kanan untuk memeriksa metadata BIM.</span>
            <span className="font-mono">Sudut Kamera: {cameraAngle.toUpperCase()}</span>
          </div>
        </div>

        {/* Right Panel: Inspector Objek Bangunan & Referensi File BIM */}
        <div className="lg:col-span-4 space-y-5">
          {/* Elemen Bangunan Terpilih */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#071D49]">
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
                      ? 'border-[#1264F4] bg-[#EAF2FF]/60'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#071D49]">{el.code}</span>
                    <span className="font-mono font-semibold text-[#1264F4] tabular-nums">
                      Progres: {el.completionRate}%
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">{el.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Tahap #{el.milestoneOrder} ({el.category}) · Status: {el.inspectionState}
                  </div>
                </button>
              ))}
            </div>

            {selectedElement && (
              <div className="pt-3 border-t border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-[#071D49]">Detail Properti Objek Terpilih:</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Elevasi / Level:</span>
                  <span className="font-medium text-slate-800">{selectedElement.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spesifikasi Material:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">
                    {selectedElement.material}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimasi Volume BIM:</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">
                    {selectedElement.volumeM3} m³
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Penyimpanan Referensi File & URL Model BIM */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#071D49]">
              <Upload className="w-4 h-4 text-[#1264F4]" />
              <h2 className="text-sm font-bold">Penyimpanan Referensi &amp; URL Model BIM</h2>
            </div>

            {savedNotice && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {savedNotice}
              </div>
            )}

            <form onSubmit={handleSaveBimReference} className="space-y-3 text-xs">
              <div>
                <label htmlFor="bim-file-name" className="block font-semibold text-slate-700 mb-1">
                  Nama File Referensi BIM (.ifc / .rvt)
                </label>
                <input
                  id="bim-file-name"
                  type="text"
                  value={modelNameInput}
                  onChange={(e) => setModelNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label htmlFor="bim-url" className="block font-semibold text-slate-700 mb-1">
                  URL Model BIM / Endpoint Repository
                </label>
                <input
                  id="bim-url"
                  type="text"
                  value={modelUrlInput}
                  onChange={(e) => setModelUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label htmlFor="bim-ver" className="block font-semibold text-slate-700 mb-1">
                  Versi Sinkronisasi Model
                </label>
                <input
                  id="bim-ver"
                  type="text"
                  value={modelVersionInput}
                  onChange={(e) => setModelVersionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#071D49] hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
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
 * MODUL F: VERIFIKASI PEKERJAAN
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
    setApprovedPctInput(ver.approvedPercentage > 0 ? ver.approvedPercentage : ver.submittedPercentage);
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
      `Verifikasi "${selectedVer.milestoneName}" (${selectedVer.projectName}) diperbarui menjadi "${decisionStatus}". Status progres & termin pembayaran telah disinkronkan.`
    );
    setSelectedVer(null);
  };

  const filteredVerifications = db.verifications.filter(
    (v) => statusFilter === 'ALL' || v.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#071D49]">
            Verifikasi &amp; Validasi Tahapan Pekerjaan
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Periksa laporan progres kontraktor, bukti foto/dokumen, kesesuaian data BIM, dan
            berikan persetujuan untuk membuka kunci termin pembayaran.
          </p>
        </div>

        <select
          aria-label="Filter status verifikasi"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
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
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold text-emerald-700"
            aria-label="Tutup pesan verifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">ID Verifikasi &amp; Proyek</th>
                <th className="py-3 px-4 font-semibold">Tahap Pekerjaan</th>
                <th className="py-3 px-4 font-semibold text-right">Diajukan</th>
                <th className="py-3 px-4 font-semibold text-right">Disetujui</th>
                <th className="py-3 px-4 font-semibold">Verifikator &amp; BIM</th>
                <th className="py-3 px-4 font-semibold">Status Verifikasi</th>
                <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVerifications.map((ver) => (
                <tr key={ver.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-[11px] text-slate-500">
                      {ver.id} · {formatDateID(ver.verificationDate)} ·{' '}
                      {ver.isDemo ? 'DEMO' : 'LIVE'}
                    </div>
                    <div className="font-bold text-[#071D49] mt-0.5">{ver.projectName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{ver.milestoneName}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">
                      {ver.supportingEvidenceSummary}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 tabular-nums">
                    {ver.submittedPercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1264F4] tabular-nums">
                    {ver.approvedPercentage}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>{ver.verifierName}</div>
                    <div className="text-[11px] text-slate-500">
                      Validasi BIM: {ver.bimChecked ? 'Terperiksa' : 'Belum diperiksa'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-bold ${
                        ver.status === 'Disetujui'
                          ? 'text-[#10B981]'
                          : ver.status === 'Ditolak'
                          ? 'text-red-600'
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
                      className="px-3 py-1.5 rounded-lg bg-[#071D49] hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{canVerify ? 'Periksa & Putuskan' : 'Lihat Detail'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Verifikasi & Keputusan */}
      {selectedVer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  ID Verifikasi: {selectedVer.id} · Laporan: {selectedVer.reportId}
                </div>
                <h2 className="text-base font-bold text-[#071D49] mt-0.5">
                  Pemeriksaan Tahapan: {selectedVer.milestoneName} ({selectedVer.projectName})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVer(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Tutup modal verifikasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-slate-500">Persentase Diajukan Kontraktor</div>
                <div className="text-base font-mono font-bold text-[#071D49] tabular-nums mt-0.5">
                  {selectedVer.submittedPercentage}%
                </div>
              </div>
              <div>
                <div className="text-slate-500">Ringkasan Bukti Pendukung</div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {selectedVer.supportingEvidenceSummary}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="ver-approved-pct"
                  className="block font-semibold text-slate-700 mb-1"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
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
                <label htmlFor="ver-bim-check" className="font-semibold text-slate-700">
                  Data objek pada BIM Viewer telah diperiksa dan sesuai dengan kondisi fisik lapangan
                </label>
              </div>

              <div>
                <label htmlFor="ver-notes" className="block font-semibold text-slate-700 mb-1">
                  Catatan Pemeriksaan / Catatan Revisi
                </label>
                <textarea
                  id="ver-notes"
                  rows={3}
                  disabled={!canVerify}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan hasil inspeksi teknis, kualitas pekerjaan, atau detail revisi jika ditolak..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {canVerify ? (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-200">
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
                  <span>Setujui Verifikasi &amp; Buka Termin</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedVer(null)}
                  className="px-4 py-2 rounded-lg bg-[#071D49] text-white text-xs font-semibold"
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
