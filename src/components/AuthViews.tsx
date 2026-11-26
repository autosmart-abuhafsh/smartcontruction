import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  HardHat,
  ClipboardCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { Organization, User, UserRole } from '../types/smartbuild';
import { getRoleLabel } from '../utils/calculations';
import { SmartBuildLogo } from './SmartBuildBrand';

interface AuthViewsProps {
  users: User[];
  organizations: Organization[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogin: (user: User) => void;
  onRegister: (newUser: Omit<User, 'id' | 'createdAt' | 'status'>, newOrgName?: string) => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  users,
  organizations,
  isDarkMode,
  onToggleDarkMode,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('citra.maharani');
  const [password, setPassword] = useState('citra2026');
  const [error, setError] = useState('');
  const [activeBimStage, setActiveBimStage] = useState<number>(0);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('client');
  const [regOrgName, setRegOrgName] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const bimStages = [
    { label: 'Semua Lapisan 3D', pct: '60% Realisasi', color: '#60A5FA' },
    { label: '1. Pondasi Tapak', pct: '25% · Selesai', color: '#10B981' },
    { label: '2. Struktur Beton', pct: '30% · Selesai', color: '#34D399' },
    { label: '3. Dinding & Atap', pct: '25% · Verifikasi', color: '#1264F4' },
  ];

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Mohon masukkan ID Akun / Email dan Kata Sandi.');
      return;
    }
    const q = email.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        (u.loginId && u.loginId.toLowerCase() === q) ||
        u.id.toLowerCase() === q
    );
    if (!found) {
      setError('ID Akun atau Email tidak ditemukan. Silakan pilih akun di bawah atau hubungi Super Admin.');
      return;
    }
    if (found.password && found.password !== password.trim()) {
      setError('Kata sandi tidak sesuai dengan yang diatur pada Manajemen Akun.');
      return;
    }
    onLogin(found);
  };

  const handleFormRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName.trim() || !regEmail.trim() || !regOrgName.trim()) {
      setError('Nama lengkap, email, dan nama perusahaan/instansi wajib diisi.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setError('Email tersebut sudah terdaftar dalam sistem.');
      return;
    }
    const matchedOrg = organizations.find(
      (o) => o.name.toLowerCase() === regOrgName.trim().toLowerCase()
    );
    onRegister(
      {
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        organizationId: matchedOrg ? matchedOrg.id : `org-${Date.now()}`,
        organizationName: regOrgName.trim(),
        position: regPosition.trim() || getRoleLabel(regRole),
        phone: regPhone.trim() || '0812-0000-0000',
      },
      regOrgName.trim()
    );
  };

  return (
    <div className="min-h-screen bg-[#071D49] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Animated Blueprint Grid Background */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        initial={{ opacity: 0.1 }}
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login_blueprint_grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="0.75"
                strokeOpacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login_blueprint_grid)" />
        </svg>
      </motion.div>

      {/* Top Floating Bar on Login Page */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2.5 text-white">
          <SmartBuildLogo className="w-8 h-8" />
          <span className="text-sm font-bold tracking-tight">SmartBuild Enterprise</span>
        </div>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors"
          aria-label={isDarkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Malam'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-200" />}
          <span>{isDarkMode ? 'Mode Terang' : 'Mode Malam'}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl z-10"
      >
        {/* Left Interactive Animated 3D BIM & Smart Contract Showcase Panel */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#071D49] to-[#0A2763] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <SmartBuildLogo className="w-10 h-10 shrink-0" />
              <div>
                <span className="text-xl font-bold tracking-tight block">SmartBuild</span>
                <span className="text-[11px] text-blue-300 font-mono">
                  BIM 3D · Digital Contract · Escrow
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-2">
              Sistem Manajemen Kontrak Konstruksi, BIM &amp; Smart Contract
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Kolaborasi transparan antara Pengguna Jasa, Kontraktor, dan Verifikator dengan
              pemantauan objek BIM 3D interaktif serta pencairan termin terukur.
            </p>

            {/* Interactive Animated 3D Isometric Building Preview */}
            <div className="bg-slate-950/60 border border-white/15 rounded-xl p-3.5 mb-4">
              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2">
                <span className="font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Simulasi Interaktif Model BIM 3D
                </span>
                <span className="font-mono text-[#34D399] font-bold">
                  {bimStages[activeBimStage].pct}
                </span>
              </div>

              <div className="flex items-center justify-center py-1">
                <motion.svg
                  viewBox="0 0 320 175"
                  className="w-full max-w-[270px] h-36 select-none"
                  role="img"
                  aria-label="Animasi 3D Bangunan Konstruksi SmartBuild"
                >
                  {/* Isometric Ground Grid */}
                  <polygon
                    points="160,115 265,142 160,168 55,142"
                    fill="rgba(18,100,244,0.08)"
                    stroke="rgba(96,165,250,0.25)"
                    strokeWidth="1"
                  />

                  {/* Layer 1: Pondasi */}
                  <motion.g
                    animate={{
                      y: activeBimStage === 1 ? -4 : [0, -2, 0],
                      opacity: activeBimStage === 0 || activeBimStage === 1 ? 1 : 0.35,
                    }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    onClick={() => setActiveBimStage(1)}
                    className="cursor-pointer"
                  >
                    <polygon
                      points="160,112 245,136 160,160 75,136"
                      fill="#10B981"
                      fillOpacity="0.45"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  </motion.g>

                  {/* Layer 2: Struktur Kolom & Plat */}
                  <motion.g
                    animate={{
                      y: activeBimStage === 2 ? -6 : [-2, 2, -2],
                      opacity: activeBimStage === 0 || activeBimStage === 2 ? 1 : 0.35,
                    }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    onClick={() => setActiveBimStage(2)}
                    className="cursor-pointer"
                  >
                    <line x1="95" y1="132" x2="95" y2="74" stroke="#34D399" strokeWidth="4" />
                    <line x1="160" y1="152" x2="160" y2="92" stroke="#34D399" strokeWidth="4" />
                    <line x1="225" y1="132" x2="225" y2="74" stroke="#34D399" strokeWidth="4" />
                    <line x1="160" y1="114" x2="160" y2="58" stroke="#34D399" strokeWidth="3.5" />
                    <polygon
                      points="95,94 160,114 225,94 160,74"
                      fill="#10B981"
                      fillOpacity="0.4"
                      stroke="#6EE7B7"
                      strokeWidth="1.5"
                    />
                  </motion.g>

                  {/* Layer 3: Dinding & Atap Baja */}
                  <motion.g
                    animate={{
                      y: activeBimStage === 3 ? -8 : [-4, 1, -4],
                      opacity: activeBimStage === 0 || activeBimStage === 3 ? 1 : 0.35,
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    onClick={() => setActiveBimStage(3)}
                    className="cursor-pointer"
                  >
                    <polygon
                      points="85,74 160,28 235,74 160,96"
                      fill="#1264F4"
                      fillOpacity="0.55"
                      stroke="#60A5FA"
                      strokeWidth="2"
                    />
                    <line
                      x1="122"
                      y1="51"
                      x2="160"
                      y2="96"
                      stroke="#93C5FD"
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                    />
                    <line
                      x1="198"
                      y1="51"
                      x2="160"
                      y2="96"
                      stroke="#93C5FD"
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                    />
                  </motion.g>
                </motion.svg>
              </div>

              {/* Interactive stage switcher buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {bimStages.map((st, idx) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setActiveBimStage(idx)}
                    className={`px-2 py-1 rounded text-[11px] font-medium text-left truncate transition-colors ${
                      activeBimStage === idx
                        ? 'bg-[#1264F4] text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-200 border-t border-white/15 pt-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Kontrak Digital &amp; Persetujuan Multi-Pihak Tercatat Audit Log</span>
              </div>
              <div className="flex items-start gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <span>Pengiriman Bukti Digital (Digital Evidence) &amp; Verifikasi Lapangan</span>
              </div>
              <div className="flex items-start gap-2">
                <HardHat className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span>Pencairan Otomatis Termin Smart Contract Setelah Pekerjaan Selesai</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Mode Lingkungan: Simulasi Fungsional MVP</span>
            <span className="font-mono text-blue-300">v1.0</span>
          </div>
        </div>

        {/* Right Auth Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6 w-fit">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-[#071D49] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-[#071D49] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrasi Pengguna Baru
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium"
            >
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Masuk ke Portal SmartBuild
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Masukkan ID Akun / Email dan Password yang dikelola oleh Super Admin, atau pilih kartu peran di bawah.
              </p>

              <form onSubmit={handleFormLogin} className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    ID Akun / Alamat Email
                  </label>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: citra.maharani atau muhajirin.kasim"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Password Akun
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#1264F4] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Simulasi Akses Cepat Sesuai Peran Pengguna (RBAC Demo):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {users.map((u) => (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      key={u.id}
                      type="button"
                      onClick={() => onLogin(u)}
                      className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:border-[#1264F4] hover:bg-[#EAF2FF]/60 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#071D49] dark:text-blue-300">
                          {getRoleLabel(u.role)}
                        </span>
                        <UserCheck className="w-3.5 h-3.5 text-[#1264F4]" />
                      </div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-100 mt-1 truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        ID: {u.loginId || u.id} · {u.email}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormRegister} className="space-y-3.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Registrasi Akun Pengguna Jasa / Penyedia Jasa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Daftarkan akun baru beserta peran dan organisasi untuk berkolaborasi dalam proyek.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Ir. Ahmad Fauzi"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Email Resmi
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ahmad@konstruksi.co.id"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="reg-role"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Jenis Peran Pengguna
                  </label>
                  <select
                    id="reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  >
                    <option value="client">Pengguna Jasa (Client / Owner)</option>
                    <option value="contractor">Penyedia Jasa (Contractor)</option>
                    <option value="verifikator">Verifikator / Pengawas Proyek</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="reg-org"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nama Perusahaan / Instansi
                  </label>
                  <input
                    id="reg-org"
                    type="text"
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    placeholder="PT Karya Bangun Mandiri"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="reg-pos"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Jabatan
                  </label>
                  <input
                    id="reg-pos"
                    type="text"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    placeholder="Project Director"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nomor Telepon
                  </label>
                  <input
                    id="reg-phone"
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#1264F4] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
              >
                Daftarkan Akun &amp; Masuk
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
