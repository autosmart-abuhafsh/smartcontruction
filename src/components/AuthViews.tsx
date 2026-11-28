import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  HardHat,
  ClipboardCheck,
  ArrowRight,
  LogIn,
  Sun,
  Moon,
  Layers,
  Lock,
} from 'lucide-react';
import { Organization, User } from '../types/smartbuild';
import { SmartBuildLogo } from './SmartBuildBrand';

interface AuthViewsProps {
  users: User[];
  organizations?: Organization[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogin: (user: User) => void;
  onRegister?: (newUser: Omit<User, 'id' | 'createdAt' | 'status'>, newOrgName?: string) => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  users,
  isDarkMode,
  onToggleDarkMode,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeBimStage, setActiveBimStage] = useState<number>(0);

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
      setError('ID Akun atau Email tidak ditemukan. Silakan hubungi Super Admin / Pemilik Sistem.');
      return;
    }
    if (found.password && found.password !== password.trim()) {
      setError('Kata sandi tidak sesuai. Silakan periksa kembali password akun Anda.');
      return;
    }
    onLogin(found);
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
        <div className="lg:col-span-7 p-6 sm:p-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 rounded-lg mb-5 w-fit">
            <LogIn className="w-3.5 h-3.5 text-[#1264F4] dark:text-blue-400" />
            <span className="text-xs font-semibold text-[#071D49] dark:text-blue-300">
              Otentikasi Akun Terdaftar
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium"
            >
              {error}
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
              Masuk ke Portal SmartBuild
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Masukkan ID Akun / Email dan Password resmi yang telah didaftarkan oleh Pemilik Proyek atau Super Admin.
            </p>

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  ID Akun / Alamat Email
                </label>
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan ID Akun atau Email resmi..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                />
              </div>
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password Akun
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full py-2.5 px-4 bg-[#1264F4] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
              >
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <span>
                Akses sistem hanya diberikan kepada pengguna terdaftar. Pembuatan atau perubahan akun dikelola secara terpusat oleh Pemilik Website / Super Admin.
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
