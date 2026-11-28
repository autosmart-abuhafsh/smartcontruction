import React, { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  FileText,
  CheckCircle,
  Printer,
  Send,
  X,
  ArrowUpDown,
  MapPin,
  Calendar,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Contract,
  Project,
  ProjectStatus,
  SmartBuildDatabase,
  User,
} from '../types/smartbuild';
import {
  calculateMilestoneNominal,
  canDeleteProject,
  canPerformAction,
  formatDateID,
  formatRupiah,
  generateUniqueId,
  validateMilestonesTotalPercentage,
} from '../utils/calculations';

interface ProjectsViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onAddProject: (project: Omit<Project, 'id' | 'code'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProjectForContract?: (projectId: string) => void;
}

const PROJECT_STATUSES: ProjectStatus[] = [
  'Draft',
  'Menunggu persetujuan',
  'Aktif',
  'Dalam pengerjaan',
  'Menunggu verifikasi',
  'Selesai',
  'Dibatalkan',
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  db,
  currentUser,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'value_desc' | 'progress_desc'>('name');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedDetailProject, setSelectedDetailProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Project['category']>('Residensial');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Gang Mahanggi, Tenggarong');
  const [clientName, setClientName] = useState('Citra Ayu Deswina Maharani');
  const [contractorName, setContractorName] = useState('Muhajirin Kasim');
  const [verifikatorName, setVerifikatorName] = useState('Ir. Dian Permatasari, MT');
  const [contractValue, setContractValue] = useState<number>(100000000);
  const [startDate, setStartDate] = useState('2026-12-01');
  const [targetEndDate, setTargetEndDate] = useState('2027-05-30');
  const [status, setStatus] = useState<ProjectStatus>('Draft');
  const [docTitle, setDocTitle] = useState('DED & Gambar Kerja Utama.pdf');
  const [photoCaption, setPhotoCaption] = useState('Foto Kondisi Awal Lokasi Proyek');
  const [formError, setFormError] = useState('');

  const canCreateOrEdit = canPerformAction(currentUser.role, 'create_project');

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setCategory('Residensial');
    setDescription('');
    setLocation('Gang Mahanggi, Tenggarong');
    setClientName(currentUser.role === 'client' ? currentUser.name : 'Citra Ayu Deswina Maharani');
    setContractorName('Muhajirin Kasim');
    setVerifikatorName('Ir. Dian Permatasari, MT');
    setContractValue(100000000);
    setStartDate('2026-12-01');
    setTargetEndDate('2027-05-30');
    setStatus('Draft');
    setDocTitle('DED & Gambar Kerja Utama.pdf');
    setPhotoCaption('Dokumentasi Titik Nol Lokasi');
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setCategory(project.category);
    setDescription(project.description);
    setLocation(project.location);
    setClientName(project.clientName);
    setContractorName(project.contractorName);
    setVerifikatorName(project.verifikatorName);
    setContractValue(project.contractValue);
    setStartDate(project.startDate);
    setTargetEndDate(project.targetEndDate);
    setStatus(project.status);
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !description.trim()) {
      setFormError('Nama proyek, lokasi, dan deskripsi pekerjaan wajib diisi.');
      return;
    }
    if (contractValue <= 0) {
      setFormError('Nilai kontrak proyek harus lebih besar dari Rp0.');
      return;
    }

    if (editingProject) {
      onUpdateProject({
        ...editingProject,
        name: name.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        clientName: clientName.trim(),
        contractorName: contractorName.trim(),
        verifikatorName: verifikatorName.trim(),
        contractValue: Number(contractValue),
        startDate,
        targetEndDate,
        status,
      });
      setFeedbackMessage(`Proyek "${name.trim()}" berhasil diperbarui.`);
    } else {
      onAddProject({
        name: name.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        clientId: 'usr-client',
        clientName: clientName.trim(),
        contractorId: 'usr-contractor',
        contractorName: contractorName.trim(),
        verifikatorId: 'usr-verifier',
        verifikatorName: verifikatorName.trim(),
        contractValue: Number(contractValue),
        startDate,
        targetEndDate,
        status,
        overallProgress: 0,
        documents: docTitle.trim()
          ? [
              {
                id: generateUniqueId('doc'),
                title: docTitle.trim(),
                type: 'Dokumen Perencanaan',
                uploadedAt: startDate,
                size: '2.5 MB',
              },
            ]
          : [],
        photos: photoCaption.trim()
          ? [
              {
                id: generateUniqueId('ph'),
                caption: photoCaption.trim(),
                stage: 'Persiapan Proyek',
                uploadedAt: startDate,
              },
            ]
          : [],
        isDemo: true,
      });
      setFeedbackMessage(`Proyek baru "${name.trim()}" berhasil ditambahkan.`);
    }
    setShowFormModal(false);
  };

  const filteredProjects = db.projects
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.contractorName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'value_desc') return b.contractValue - a.contractValue;
      if (sortBy === 'progress_desc') return b.overallProgress - a.overallProgress;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Manajemen Proyek Konstruksi
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Kelola daftar proyek, dokumen DED, pihak terlibat, target penyelesaian, dan status
            siklus proyek.
          </p>
        </div>
        {canCreateOrEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#1264F4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Proyek</span>
          </button>
        )}
      </div>

      {feedbackMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between"
        >
          <span>{feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold"
            aria-label="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search, Filter Status & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            aria-label="Cari proyek"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama proyek, ID, lokasi, atau kontraktor..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
          />
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <label
            htmlFor="filter-status-proyek"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
          >
            Filter Status:
          </label>
          <select
            id="filter-status-proyek"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">Semua Status ({db.projects.length})</option>
            {PROJECT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            aria-label="Urutkan proyek"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'value_desc' | 'progress_desc')}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="name">Urutkan: Nama Proyek (A-Z)</option>
            <option value="value_desc">Urutkan: Nilai Kontrak Tertinggi</option>
            <option value="progress_desc">Urutkan: Progres Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Projects List: Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredProjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Tidak ada data proyek yang sesuai dengan kriteria pencarian atau filter.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {project.code} · {project.isDemo ? 'DEMO' : 'LIVE'} · {project.category}
                    </div>
                    <div className="font-bold text-[#071D49] dark:text-white text-sm mt-0.5 leading-snug">
                      {project.name}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1264F4] dark:text-blue-300 font-bold font-mono shrink-0">
                    {project.overallProgress}%
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{project.location}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Pemilik Proyek:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {project.clientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Kontraktor:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {project.contractorName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {formatRupiah(project.contractValue)}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Status: {project.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailProject(project)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                    {canCreateOrEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(project)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          aria-label={`Edit proyek ${project.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProject(project)}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400"
                          aria-label={`Hapus proyek ${project.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 font-semibold">ID &amp; Nama Proyek</th>
                <th className="py-3 px-4 font-semibold">Kategori &amp; Lokasi</th>
                <th className="py-3 px-4 font-semibold">Pengguna Jasa &amp; Kontraktor</th>
                <th className="py-3 px-4 font-semibold text-right">Nilai Kontrak</th>
                <th className="py-3 px-4 font-semibold text-right">Progres</th>
                <th className="py-3 px-4 font-semibold">Status Proyek</th>
                <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada data proyek yang sesuai dengan kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {project.code} · {project.isDemo ? 'DEMO' : 'LIVE'}
                      </div>
                      <div className="font-bold text-[#071D49] dark:text-white text-sm mt-0.5">
                        {project.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Mulai: {formatDateID(project.startDate)} · Target:{' '}
                        {formatDateID(project.targetEndDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-semibold">{project.category}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{project.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Owner:</span>{' '}
                        <span className="font-semibold">{project.clientName}</span>
                      </div>
                      <div className="mt-0.5">
                        <span className="text-slate-500 dark:text-slate-400">Kontraktor:</span>{' '}
                        <span className="font-semibold">{project.contractorName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                      {formatRupiah(project.contractValue)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
                        {project.overallProgress}%
                      </div>
                      <div className="w-20 ml-auto h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-[#1264F4]"
                          style={{ width: `${project.overallProgress}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailProject(project)}
                          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1"
                          aria-label={`Detail proyek ${project.name}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                        {canCreateOrEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(project)}
                              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                              aria-label={`Edit proyek ${project.name}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmProject(project)}
                              className="p-1.5 rounded-md border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400"
                              aria-label={`Hapus proyek ${project.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Proyek */}
      {showFormModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-form-title"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2
                id="project-form-title"
                className="text-base font-bold text-[#071D49] dark:text-white"
              >
                {editingProject
                  ? `Edit Proyek: ${editingProject.code}`
                  : 'Tambah Proyek Konstruksi Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup modal proyek"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="prj-name"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nama Proyek
                  </label>
                  <input
                    id="prj-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Pembangunan Gedung Laboratorium"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prj-cat"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Kategori Proyek
                  </label>
                  <select
                    id="prj-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Project['category'])}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="Fasilitas Publik">Fasilitas Publik</option>
                    <option value="Gedung Komersial">Gedung Komersial</option>
                    <option value="Infrastruktur">Infrastruktur</option>
                    <option value="Residensial">Residensial</option>
                    <option value="Industri">Industri</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="prj-location"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Lokasi Proyek
                </label>
                <input
                  id="prj-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Alamat lengkap lokasi proyek konstruksi"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="prj-desc"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Deskripsi Proyek
                </label>
                <textarea
                  id="prj-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Lingkup pekerjaan utama, spesifikasi bangunan, dan target teknis..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="prj-client"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nama Pengguna Jasa
                  </label>
                  <input
                    id="prj-client"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prj-contractor"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nama Kontraktor
                  </label>
                  <input
                    id="prj-contractor"
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prj-value"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nilai Kontrak (Rp)
                  </label>
                  <input
                    id="prj-value"
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="prj-start"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Tanggal Mulai
                  </label>
                  <input
                    id="prj-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prj-end"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Target Penyelesaian
                  </label>
                  <input
                    id="prj-end"
                    type="date"
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prj-status"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Status Proyek
                  </label>
                  <select
                    id="prj-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    {PROJECT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingProject && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label
                      htmlFor="prj-doc"
                      className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Dokumen Awal Proyek
                    </label>
                    <input
                      id="prj-doc"
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="prj-photo"
                      className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Keterangan Foto Dokumentasi Awal
                    </label>
                    <input
                      id="prj-photo"
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1264F4] text-white font-semibold hover:bg-blue-700"
                >
                  {editingProject ? 'Simpan Perubahan' : 'Simpan Proyek Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Proyek */}
      {selectedDetailProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  ID Proyek: {selectedDetailProject.code} · Kategori:{' '}
                  {selectedDetailProject.category} ·{' '}
                  {selectedDetailProject.isDemo ? 'DEMO' : 'LIVE'}
                </div>
                <h2 className="text-lg font-bold text-[#071D49] dark:text-white mt-0.5">
                  {selectedDetailProject.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailProject(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup detail proyek"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Pengguna Jasa (Owner)</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDetailProject.clientName}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Penyedia Jasa (Kontraktor)</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDetailProject.contractorName}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Nilai Kontrak &amp; Progres</div>
                <div className="font-mono font-bold text-[#1264F4] dark:text-blue-400 mt-0.5 tabular-nums">
                  {formatRupiah(selectedDetailProject.contractValue)} (
                  {selectedDetailProject.overallProgress}%)
                </div>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Deskripsi &amp; Lokasi Pekerjaan
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedDetailProject.description}
              </p>
              <div className="text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {selectedDetailProject.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />{' '}
                  {formatDateID(selectedDetailProject.startDate)} s/d{' '}
                  {formatDateID(selectedDetailProject.targetEndDate)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                <div className="font-bold text-[#071D49] dark:text-white mb-2">
                  Dokumen Proyek ({selectedDetailProject.documents.length})
                </div>
                {selectedDetailProject.documents.length === 0 ? (
                  <p className="text-slate-400">Belum ada dokumen diunggah.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDetailProject.documents.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate font-medium">{d.title}</span>
                        <span className="text-slate-400 font-mono text-[11px] shrink-0">
                          {d.size}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5">
                <div className="font-bold text-[#071D49] dark:text-white mb-2">
                  Foto Dokumentasi Lapangan ({selectedDetailProject.photos.length})
                </div>
                {selectedDetailProject.photos.length === 0 ? (
                  <p className="text-slate-400">Belum ada foto lapangan.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDetailProject.photos.map((ph) => (
                      <li key={ph.id} className="text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{ph.caption}</div>
                        <div className="text-[11px] text-slate-400">
                          Tahap: {ph.stage} · {formatDateID(ph.uploadedAt)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDetailProject(null)}
                className="px-4 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 text-white text-xs font-semibold"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Proyek dengan Aturan Pembatasan */}
      {deleteConfirmProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold">Konfirmasi Penghapusan Proyek</h2>
            </div>

            {(() => {
              const hasActiveContract = db.contracts.some(
                (c) =>
                  c.projectId === deleteConfirmProject.id &&
                  (c.status === 'Aktif' || c.status === 'Disetujui')
              );
              const check = canDeleteProject(deleteConfirmProject, hasActiveContract);
              return (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Anda memilih untuk menghapus proyek{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {deleteConfirmProject.name}
                    </span>{' '}
                    ({deleteConfirmProject.code}).
                  </p>
                  {!check.allowed ? (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                      <div className="font-bold mb-1">Pembatasan Keamanan Sistem:</div>
                      <div>{check.reason}</div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
                      Proyek ini berstatus <strong>{deleteConfirmProject.status}</strong> dan
                      memenuhi syarat untuk dihapus secara permanen.
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmProject(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Batal
                    </button>
                    {check.allowed && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProject(deleteConfirmProject.id);
                          setFeedbackMessage(
                            `Proyek "${deleteConfirmProject.name}" telah dihapus.`
                          );
                          setDeleteConfirmProject(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        Ya, Hapus Proyek
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * MODUL C: KONTRAK DIGITAL
 * ========================================================================== */

interface ContractsViewProps {
  db: SmartBuildDatabase;
  currentUser: User;
  onCreateOrUpdateContract: (
    contract: Contract,
    milestones: { name: string; description: string; weightPercentage: number; dueDate: string }[]
  ) => void;
  onApproveContract: (contractId: string, partyRole: 'client' | 'contractor') => void;
  onSendContractForApproval: (contractId: string) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  db,
  currentUser,
  onCreateOrUpdateContract,
  onApproveContract,
  onSendContractForApproval,
}) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Contract Form fields
  const [projectId, setProjectId] = useState(db.projects[0]?.id || 'prj-001');
  const [workDescription, setWorkDescription] = useState('');
  const [totalValue, setTotalValue] = useState(100000000);
  const [durationDays, setDurationDays] = useState(150);
  const [contractDate, setContractDate] = useState('2026-11-25');
  const [paymentTerms, setPaymentTerms] = useState(
    'Pembayaran dilakukan bertahap sesuai persentase penyelesaian tahapan pekerjaan yang telah diverifikasi oleh Verifikator.'
  );
  const [rightsAndObligations, setRightsAndObligations] = useState(
    'Pengguna Jasa wajib mencairkan pembayaran sesuai termin terverifikasi; Penyedia Jasa wajib menyelesaikan konstruksi tepat mutu dan waktu.'
  );
  const [cancellationClause, setCancellationClause] = useState(
    'Pembatalan sepihak dikenakan penalti 5% dari nilai sisa kontrak kecuali dalam kondisi Force Majeure.'
  );
  const [disputeResolution, setDisputeResolution] = useState(
    'Penyelesaian sengketa mengacu pada jejak audit digital SmartBuild dan musyawarah mufakat dalam 14 hari kerja.'
  );
  const [milestoneInputs, setMilestoneInputs] = useState([
    { name: 'Pondasi', description: 'Pekerjaan pondasi utama', weightPercentage: 25, dueDate: '2026-12-30' },
    { name: 'Struktur', description: 'Pekerjaan kolom dan balok struktur', weightPercentage: 30, dueDate: '2027-02-15' },
    { name: 'Dinding dan Atap', description: 'Pemasangan dinding dan rangka atap', weightPercentage: 25, dueDate: '2027-04-01' },
    { name: 'Finishing', description: 'Penyelesaian akhir dan serah terima', weightPercentage: 20, dueDate: '2027-05-20' },
  ]);
  const [formError, setFormError] = useState('');

  const openCreateContract = () => {
    const defaultPrj = db.projects.find((p) => p.status === 'Draft') || db.projects[0];
    setEditingContract(null);
    setProjectId(defaultPrj?.id || 'prj-001');
    setTotalValue(defaultPrj?.contractValue || 100000000);
    setWorkDescription(defaultPrj?.description || 'Pelaksanaan konstruksi menyeluruh sesuai DED.');
    setDurationDays(150);
    setContractDate('2026-11-25');
    setFormError('');
    setShowContractForm(true);
  };

  const openEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setProjectId(contract.projectId);
    setTotalValue(contract.totalValue);
    setWorkDescription(contract.workDescription);
    setDurationDays(contract.durationDays);
    setContractDate(contract.contractDate);
    setPaymentTerms(contract.paymentTerms);
    setRightsAndObligations(contract.rightsAndObligations);
    setCancellationClause(contract.cancellationClause);
    setDisputeResolution(contract.disputeResolution);
    const existingMs = db.contract_milestones.filter((m) => m.contractId === contract.id);
    if (existingMs.length > 0) {
      setMilestoneInputs(
        existingMs.map((m) => ({
          name: m.name,
          description: m.description,
          weightPercentage: m.weightPercentage,
          dueDate: m.dueDate,
        }))
      );
    }
    setFormError('');
    setShowContractForm(true);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMilestonesTotalPercentage(
      milestoneInputs.map((m) => m.weightPercentage)
    );
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }
    if (!workDescription.trim() || totalValue <= 0) {
      setFormError('Deskripsi pekerjaan dan nilai total kontrak wajib diisi dengan benar.');
      return;
    }
    const targetProject = db.projects.find((p) => p.id === projectId);
    const contractObj: Contract = editingContract
      ? {
          ...editingContract,
          projectId,
          projectName: targetProject?.name || editingContract.projectName,
          workDescription: workDescription.trim(),
          totalValue: Number(totalValue),
          durationDays: Number(durationDays),
          contractDate,
          paymentTerms,
          rightsAndObligations,
          cancellationClause,
          disputeResolution,
          revisionHistory: [
            ...editingContract.revisionHistory,
            {
              id: generateUniqueId('rev'),
              date: new Date().toISOString().split('T')[0],
              actor: currentUser.name,
              summary: 'Pembaruan klausul kontrak dan jadwal tahapan sebelum persetujuan final.',
            },
          ],
        }
      : {
          id: generateUniqueId('ctr'),
          contractNumber: `KTR/SB/2026/XI/${String(db.contracts.length + 1).padStart(3, '0')}`,
          projectId,
          projectName: targetProject?.name || 'Proyek Konstruksi',
          workDescription: workDescription.trim(),
          totalValue: Number(totalValue),
          durationDays: Number(durationDays),
          contractDate,
          paymentTerms,
          rightsAndObligations,
          cancellationClause,
          disputeResolution,
          status: 'Draft',
          clientApproved: false,
          contractorApproved: false,
          revisionHistory: [
            {
              id: generateUniqueId('rev'),
              date: contractDate,
              actor: currentUser.name,
              summary: 'Pembuatan draf kontrak digital baru beserta tahapan pembayaran.',
            },
          ],
          isDemo: true,
        };

    onCreateOrUpdateContract(contractObj, milestoneInputs);
    setShowContractForm(false);
    setStatusMessage(`Kontrak Digital "${contractObj.contractNumber}" berhasil disimpan.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#071D49] dark:text-white">
            Manajemen Kontrak Digital &amp; Kesepakatan Kerja
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Kelola kesepakatan kedua belah pihak, klausul hak dan kewajiban, tahapan pembayaran
            otomatis, serta tanda tangan persetujuan digital.
          </p>
        </div>
        {canPerformAction(currentUser.role, 'create_contract') && (
          <button
            type="button"
            onClick={openCreateContract}
            className="px-4 py-2.5 bg-[#1264F4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kontrak Digital</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="font-bold text-emerald-700 dark:text-emerald-300"
            aria-label="Tutup notifikasi kontrak"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contracts Cards */}
      <div className="space-y-4">
        {db.contracts.map((ctr) => {
          const milestones = db.contract_milestones.filter((m) => m.contractId === ctr.id);
          const isEditable = ctr.status === 'Draft' || ctr.status === 'Menunggu persetujuan';

          return (
            <div
              key={ctr.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    No. Kontrak: {ctr.contractNumber} · Tanggal: {formatDateID(ctr.contractDate)} ·
                    Durasi: {ctr.durationDays} Hari · {ctr.isDemo ? 'DEMO' : 'LIVE'}
                  </div>
                  <h2 className="text-base font-bold text-[#071D49] dark:text-white mt-0.5">
                    {ctr.projectName}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status Kontrak:{' '}
                    <strong className="text-[#1264F4] dark:text-blue-400">{ctr.status}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-sm font-mono font-bold text-[#071D49] dark:text-white tabular-nums">
                    {formatRupiah(ctr.totalValue)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {ctr.workDescription}
              </p>

              {/* Milestones Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {milestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      Tahap {ms.order}: {ms.name} ({ms.weightPercentage}%)
                    </div>
                    <div className="font-mono font-bold text-[#071D49] dark:text-blue-300 tabular-nums mt-1">
                      {formatRupiah(ms.nominalValue)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Status: {ms.status} ({ms.realizedProgress}%)
                    </div>
                  </div>
                ))}
              </div>

              {/* Approval Status & Action Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle
                      className={`w-4 h-4 ${
                        ctr.clientApproved ? 'text-[#10B981]' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span>
                      Pengguna Jasa:{' '}
                      <strong>
                        {ctr.clientApproved ? 'Telah Menyetujui' : 'Belum Menyetujui'}
                      </strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle
                      className={`w-4 h-4 ${
                        ctr.contractorApproved
                          ? 'text-[#10B981]'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span>
                      Penyedia Jasa:{' '}
                      <strong>
                        {ctr.contractorApproved ? 'Telah Menyetujui' : 'Belum Menyetujui'}
                      </strong>
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedContract(ctr)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Detail &amp; Cetak PDF</span>
                  </button>

                  {isEditable && canPerformAction(currentUser.role, 'create_contract') && (
                    <button
                      type="button"
                      onClick={() => openEditContract(ctr)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Kontrak</span>
                    </button>
                  )}

                  {ctr.status === 'Draft' && (
                    <button
                      type="button"
                      onClick={() => {
                        onSendContractForApproval(ctr.id);
                        setStatusMessage(
                          `Kontrak ${ctr.contractNumber} telah dikirim kepada pihak terkait untuk disetujui.`
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#071D49] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim untuk Persetujuan</span>
                    </button>
                  )}

                  {!ctr.clientApproved &&
                    canPerformAction(currentUser.role, 'approve_contract_client') && (
                      <button
                        type="button"
                        onClick={() => {
                          onApproveContract(ctr.id, 'client');
                          setStatusMessage(
                            `Persetujuan Pengguna Jasa berhasil dicatat untuk ${ctr.contractNumber}.`
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-700 text-white font-semibold"
                      >
                        Setujui (Pengguna Jasa)
                      </button>
                    )}

                  {!ctr.contractorApproved &&
                    canPerformAction(currentUser.role, 'approve_contract_contractor') && (
                      <button
                        type="button"
                        onClick={() => {
                          onApproveContract(ctr.id, 'contractor');
                          setStatusMessage(
                            `Persetujuan Penyedia Jasa berhasil dicatat untuk ${ctr.contractNumber}.`
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1264F4] hover:bg-blue-700 text-white font-semibold"
                      >
                        Setujui (Penyedia Jasa)
                      </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Kontrak Digital */}
      {showContractForm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-[#071D49] dark:text-white">
                {editingContract
                  ? `Edit Kontrak Digital: ${editingContract.contractNumber}`
                  : 'Buat Kontrak Digital Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setShowContractForm(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup form kontrak"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveContract} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="ctr-project"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Pilih Proyek
                  </label>
                  <select
                    id="ctr-project"
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      const prj = db.projects.find((p) => p.id === e.target.value);
                      if (prj) setTotalValue(prj.contractValue);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    {db.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="ctr-value"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nilai Total Kontrak (Rp)
                  </label>
                  <input
                    id="ctr-value"
                    type="number"
                    value={totalValue}
                    onChange={(e) => setTotalValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ctr-duration"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Durasi Pekerjaan (Hari)
                  </label>
                  <input
                    id="ctr-duration"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ctr-work"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Deskripsi Lingkup Pekerjaan
                </label>
                <textarea
                  id="ctr-work"
                  rows={2}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Milestones editor */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 bg-slate-50 dark:bg-slate-800/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#071D49] dark:text-white">
                    Tahapan Pekerjaan &amp; Termin Pembayaran (Total Harus 100%)
                  </span>
                  <span className="font-mono font-bold text-[#1264F4] dark:text-blue-400 tabular-nums">
                    Total Bobot:{' '}
                    {milestoneInputs.reduce((s, m) => s + Number(m.weightPercentage || 0), 0)}%
                  </span>
                </div>
                {milestoneInputs.map((ms, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        aria-label={`Nama tahap ${idx + 1}`}
                        value={ms.name}
                        onChange={(e) => {
                          const next = [...milestoneInputs];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setMilestoneInputs(next);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded"
                        placeholder="Nama tahapan"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        aria-label={`Deskripsi tahap ${idx + 1}`}
                        value={ms.description}
                        onChange={(e) => {
                          const next = [...milestoneInputs];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setMilestoneInputs(next);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded"
                        placeholder="Uraian tahapan"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        aria-label={`Persentase tahap ${idx + 1}`}
                        value={ms.weightPercentage}
                        onChange={(e) => {
                          const next = [...milestoneInputs];
                          next[idx] = {
                            ...next[idx],
                            weightPercentage: Number(e.target.value),
                          };
                          setMilestoneInputs(next);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded font-mono text-right"
                      />
                    </div>
                    <div className="sm:col-span-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                      {formatRupiah(calculateMilestoneNominal(totalValue, ms.weightPercentage))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="ctr-rights"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Hak dan Kewajiban Kedua Pihak
                  </label>
                  <textarea
                    id="ctr-rights"
                    rows={2}
                    value={rightsAndObligations}
                    onChange={(e) => setRightsAndObligations(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ctr-dispute"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Ketentuan Pembatalan &amp; Penyelesaian Perselisihan
                  </label>
                  <textarea
                    id="ctr-dispute"
                    rows={2}
                    value={disputeResolution}
                    onChange={(e) => setDisputeResolution(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowContractForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1264F4] text-white font-semibold hover:bg-blue-700"
                >
                  Simpan Kontrak Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Kontrak & Cetak PDF */}
      {selectedContract && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  DOKUMEN KONTRAK KONSTRUKSI DIGITAL · {selectedContract.contractNumber} ·{' '}
                  {selectedContract.isDemo ? 'DEMO' : 'LIVE'}
                </div>
                <h2 className="text-lg font-bold text-[#071D49] dark:text-white mt-0.5">
                  {selectedContract.projectName}
                </h2>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#1264F4] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Tutup detail kontrak"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Nilai Total Kontrak</div>
                <div className="font-mono font-bold text-base text-[#071D49] dark:text-white tabular-nums mt-0.5">
                  {formatRupiah(selectedContract.totalValue)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Durasi &amp; Tanggal Kontrak
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedContract.durationDays} Hari Kalender (
                  {formatDateID(selectedContract.contractDate)})
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Status Hukum Kontrak</div>
                <div className="font-bold text-[#1264F4] dark:text-blue-400 mt-0.5">
                  {selectedContract.status}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-bold text-[#071D49] dark:text-white">
                  1. Lingkup &amp; Deskripsi Pekerjaan
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  {selectedContract.workDescription}
                </p>
              </div>
              <div>
                <div className="font-bold text-[#071D49] dark:text-white">
                  2. Ketentuan Pembayaran Termin
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  {selectedContract.paymentTerms}
                </p>
              </div>
              <div>
                <div className="font-bold text-[#071D49] dark:text-white">
                  3. Hak dan Kewajiban Pihak
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  {selectedContract.rightsAndObligations}
                </p>
              </div>
              <div>
                <div className="font-bold text-[#071D49] dark:text-white">
                  4. Ketentuan Pembatalan &amp; Penyelesaian Perselisihan
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  {selectedContract.cancellationClause} {selectedContract.disputeResolution}
                </p>
              </div>
            </div>

            {/* Riwayat Perubahan Kontrak */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
              <div className="font-bold text-[#071D49] dark:text-white mb-2">
                Riwayat Perubahan &amp; Persetujuan Kontrak
              </div>
              <div className="space-y-2">
                {selectedContract.revisionHistory.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-2.5 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {rev.actor}:
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300">{rev.summary}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {formatDateID(rev.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 no-print">
              <button
                type="button"
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 rounded-lg bg-[#071D49] dark:bg-slate-800 text-white text-xs font-semibold"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * MODUL KEBIJAKAN KONTRAK: CONTRACT POLICY & DYNAMIC RULE ENGINE (VERSI 1)
 * ========================================================================== */

interface PolicyRulesState {
  updatedAt: string;
  requirePhoto: boolean;
  requireLabPdf: boolean;
  requireVideo: boolean;
  requireAdminVerify: boolean;
  requireSupervisorApproval: boolean;
  requireOwnerFinalApproval: boolean;
  requireMfaOtp: boolean;
  autoLockOnDispute: boolean;
}

const POLICY_STORAGE_KEY = 'smartbuild_contract_policy_rules_v1';

const DEFAULT_POLICY_RULES: PolicyRulesState = {
  updatedAt: '2026-08-01 09:00 WIB',
  requirePhoto: true,
  requireLabPdf: true,
  requireVideo: false,
  requireAdminVerify: true,
  requireSupervisorApproval: true,
  requireOwnerFinalApproval: true,
  requireMfaOtp: true,
  autoLockOnDispute: true,
};

export const ContractPolicyView: React.FC<{ db: SmartBuildDatabase }> = ({ db }) => {
  const projectOptions = [
    ...db.projects.map((p) => ({ id: p.id, name: p.name })),
    ...(db.projects.some((p) => p.name.toLowerCase().includes('gedung aula'))
      ? []
      : [{ id: 'prj-aula', name: 'Pembangunan Gedung Aula' }]),
  ];

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectOptions[0]?.id || 'prj-001'
  );
  const [rulesByProject, setRulesByProject] = useState<Record<string, PolicyRulesState>>(() => {
    try {
      const saved = localStorage.getItem(POLICY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as Record<string, PolicyRulesState>;
      }
    } catch {
      // ignore storage error
    }
    return {};
  });

  const currentRules: PolicyRulesState =
    rulesByProject[selectedProjectId] || DEFAULT_POLICY_RULES;

  const handleToggleRule = (field: keyof Omit<PolicyRulesState, 'updatedAt'>) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())} WIB`;

    const updatedForProject: PolicyRulesState = {
      ...currentRules,
      [field]: !currentRules[field],
      updatedAt: formattedTimestamp,
    };

    const nextMap = {
      ...rulesByProject,
      [selectedProjectId]: updatedForProject,
    };
    setRulesByProject(nextMap);
    try {
      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore storage error
    }
  };

  const ruleChecklistItems: {
    key: keyof Omit<PolicyRulesState, 'updatedAt'>;
    label: string;
  }[] = [
    {
      key: 'requirePhoto',
      label: 'Wajib Bukti Foto Dokumentasi Lapangan (JPG/PNG)',
    },
    {
      key: 'requireLabPdf',
      label: 'Wajib Dokumen Pendukung / Hasil Uji Lab (PDF)',
    },
    {
      key: 'requireVideo',
      label: 'Wajib Bukti Video Pelaksanaan (MP4)',
    },
    {
      key: 'requireAdminVerify',
      label: 'Wajib Verifikasi Kelengkapan Dokumen oleh Verifikator Administrasi',
    },
    {
      key: 'requireSupervisorApproval',
      label: 'Wajib Pemeriksaan & Persetujuan Teknis Project Supervisor',
    },
    {
      key: 'requireOwnerFinalApproval',
      label: 'Wajib Persetujuan Akhir Pemilik Proyek sebelum Pencairan',
    },
    {
      key: 'requireMfaOtp',
      label: 'Wajib Otorisasi Multi-Factor Authentication (MFA OTP) saat Pencairan',
    },
    {
      key: 'autoLockOnDispute',
      label: 'Otomatis Kunci Dana Escrow apabila Terdapat Sengketa Aktif',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card: Contract Policy & Dynamic Rule Engine (Versi 1) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="pt-0.5 text-slate-900 dark:text-white shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
              Contract Policy &amp; Dynamic Rule Engine (Versi 1)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Konfigurasi aturan kepatuhan otomatis, kewajiban bukti, otoritas pengawas, dan
              parameter waktu Smart Contract H0–H200 untuk setiap kontrak.
            </p>
          </div>
        </div>

        <div>
          <select
            aria-label="Pilih kontrak proyek untuk kebijakan"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-auto max-w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
          >
            {projectOptions.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Column Policy Cards: 6.1, 6.2, 6.3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 6.1 Kebijakan Pemilik Proyek / Pengguna Jasa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4 leading-snug">
            6.1 Kebijakan Pemilik Proyek / Pengguna Jasa
          </h2>
          <ul className="space-y-3 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-4 marker:text-slate-500">
            <li>Menyediakan dana Escrow pada H0 sesuai kesepakatan nilai kontrak.</li>
            <li>Menyediakan dokumen perizinan dan gambar acuan proyek.</li>
            <li>Memeriksa hasil pekerjaan yang telah diverifikasi pengawas.</li>
            <li>
              Memberikan keputusan persetujuan atau keberatan sesuai batas waktu H180–H185.
            </li>
            <li>
              Menyetujui pencairan bertahap sesuai ketentuan kontrak yang terpenuhi.
            </li>
          </ul>
        </div>

        {/* 6.2 Kebijakan Penyedia Jasa / Kontraktor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4 leading-snug">
            6.2 Kebijakan Penyedia Jasa / Kontraktor
          </h2>
          <ul className="space-y-3 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-4 marker:text-slate-500">
            <li>
              Mengerjakan konstruksi sesuai spesifikasi teknis, gambar BIM, dan standar SNI.
            </li>
            <li>Menyelesaikan setiap tahapan pekerjaan sesuai jadwal H0–H180.</li>
            <li>Mengirim laporan progres berkala secara akurat.</li>
            <li>
              Mengunggah bukti pekerjaan digital (foto berkoordinat, video, dan dokumen uji mutu
              PDF).
            </li>
            <li>
              Memperbaiki pekerjaan yang ditolak pengawas atau terbukti tidak sesuai pada H190–H195.
            </li>
          </ul>
        </div>

        {/* 6.3 Kebijakan Pengawas Pihak Ketiga (Supervisor) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4 leading-snug">
            6.3 Kebijakan Pengawas Pihak Ketiga (Supervisor)
          </h2>
          <ul className="space-y-3 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-4 marker:text-slate-500">
            <li>
              Memeriksa bukti pekerjaan secara objektif dan independen di lapangan maupun digital.
            </li>
            <li>
              Melakukan pemeriksaan teknis sesuai kewenangan dan kompetensi profesi.
            </li>
            <li>
              Memberikan catatan teknis, rekomendasi, dan laporan hasil pemeriksaan.
            </li>
            <li>
              Menjaga independensi pemeriksaan tanpa mengubah nominal kontrak atau mencairkan dana.
            </li>
          </ul>
        </div>
      </div>

      {/* Section 6.4 & 6.5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 6.4 Pengaturan Aturan Kontrak & Syarat Penguncian Dana */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug max-w-md">
              6.4 Pengaturan Aturan Kontrak &amp; Syarat Penguncian Dana
            </h2>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 sm:text-right leading-relaxed shrink-0">
              <div>Diperbarui: {currentRules.updatedAt.split(' ')[0]}</div>
              <div>{currentRules.updatedAt.split(' ').slice(1).join(' ')}</div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ruleChecklistItems.map((item) => {
              const checked = currentRules[item.key];
              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-3.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-1 rounded-lg transition-colors"
                >
                  <span className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleRule(item.key)}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 dark:border-slate-600 accent-[#0F172A] dark:accent-blue-600 cursor-pointer shrink-0"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* 6.5 Parameter Waktu Smart Contract H0-H200 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pb-3.5 border-b border-slate-100 dark:border-slate-800 leading-snug">
              6.5 Parameter Waktu Smart Contract (H0–H200)
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between font-bold text-[#071D49] dark:text-blue-300">
                  <span>Fase H0 · Aktivasi &amp; Penguncian Dana Escrow</span>
                  <span className="font-mono text-[11px]">Hari ke-0</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Pemilik proyek menyetorkan nilai kontrak ke rekening Escrow Smart Contract dan
                  mengunggah dokumen perizinan acuan.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between font-bold text-[#071D49] dark:text-blue-300">
                  <span>Fase H0–H180 · Pelaksanaan &amp; Bukti Digital</span>
                  <span className="font-mono text-[11px]">180 Hari</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Kontraktor menyelesaikan tahapan konstruksi sesuai gambar BIM &amp; SNI serta
                  mengunggah bukti foto, video, dan dokumen PDF.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between font-bold text-[#071D49] dark:text-blue-300">
                  <span>Fase H180–H185 · Keputusan &amp; Verifikasi</span>
                  <span className="font-mono text-[11px]">5 Hari Kerja</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Batas waktu pemeriksaan pengawas independen dan keputusan persetujuan atau
                  keberatan dari pemilik proyek.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between font-bold text-[#071D49] dark:text-blue-300">
                  <span>Fase H190–H195 · Masa Perbaikan &amp; Pencairan</span>
                  <span className="font-mono text-[11px]">H190–H200</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Penyelesaian revisi pekerjaan yang ditolak sebelum pencairan otomatis ke rekening
                  Penyedia Jasa (Bank Mandiri 1480025086508 a.n. MUHAJIRIN KASIM).
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
            <strong>Status Kepatuhan Rule Engine:</strong>{' '}
            {Object.values(currentRules).filter((v) => v === true).length} dari 8 syarat penguncian
            dana aktif diberlakukan pada kontrak terpilih.
          </div>
        </div>
      </div>
    </div>
  );
};

