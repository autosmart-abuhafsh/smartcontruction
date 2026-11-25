import React, { useState } from 'react';
import { Building2, ShieldCheck, UserCheck, HardHat, ClipboardCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { Organization, User, UserRole } from '../types/smartbuild';
import { getRoleLabel } from '../utils/calculations';

interface AuthViewsProps {
  users: User[];
  organizations: Organization[];
  onLogin: (user: User) => void;
  onRegister: (newUser: Omit<User, 'id' | 'createdAt' | 'status'>, newOrgName?: string) => void;
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  users,
  organizations,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('budi.santoso@owner.id');
  const [password, setPassword] = useState('smartbuild2026');
  const [error, setError] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('client');
  const [regOrgName, setRegOrgName] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Mohon masukkan alamat email dan kata sandi.');
      return;
    }
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setError('Akun tidak ditemukan. Silakan pilih akun demo di bawah atau daftar akun baru.');
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
    <div className="min-h-screen bg-[#071D49] text-slate-900 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl">
        {/* Left Brand Panel */}
        <div className="lg:col-span-5 bg-[#071D49] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#1264F4] flex items-center justify-center text-white font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">SmartBuild</span>
            </div>
            <h1 className="text-2xl font-bold leading-snug mb-3">
              Sistem Manajemen Kontrak Konstruksi, BIM &amp; Smart Contract
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Platform kolaborasi terpadu antara Pengguna Jasa, Kontraktor, dan Verifikator
              dengan transparansi progres berbasis Building Information Modeling (BIM) serta
              simulasi termin pembayaran terstruktur.
            </p>
            <div className="space-y-3 text-xs text-slate-200 border-t border-white/15 pt-5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Kontrak Digital &amp; Persetujuan Multi-Pihak Tercatat Audit Log</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ClipboardCheck className="w-4 h-4 text-[#1264F4] shrink-0 mt-0.5" />
                <span>Verifikasi Tahapan Pekerjaan Terhubung Elemen Model BIM 3D</span>
              </div>
              <div className="flex items-start gap-2.5">
                <HardHat className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span>Simulasi Otomatisasi Termin Pembayaran Smart Contract (DEMO)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 text-xs text-slate-300">
            <span>Mode Lingkungan: Simulasi Fungsional MVP (Data DEMO)</span>
          </div>
        </div>

        {/* Right Auth Form Panel */}
        <div className="lg:col-span-7 p-8 bg-white">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg mb-6 w-fit">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-[#071D49] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-white text-[#071D49] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrasi Pengguna Baru
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
            >
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Masuk ke Portal SmartBuild
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Gunakan kredensial akun Anda atau pilih akses cepat berbasis peran (RBAC) di bawah.
              </p>

              <form onSubmit={handleFormLogin} className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.co.id"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Kata Sandi
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1264F4]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#1264F4] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Masuk ke Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="border-t border-slate-200 pt-5">
                <p className="text-xs font-semibold text-slate-700 mb-3">
                  Simulasi Akses Cepat Sesuai Peran Pengguna (RBAC Demo):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onLogin(u)}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:border-[#1264F4] hover:bg-[#EAF2FF]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#071D49]">
                          {getRoleLabel(u.role)}
                        </span>
                        <UserCheck className="w-3.5 h-3.5 text-[#1264F4]" />
                      </div>
                      <div className="text-xs font-medium text-slate-800 mt-1 truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormRegister} className="space-y-3.5">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Registrasi Akun Pengguna Jasa / Penyedia Jasa
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Daftarkan akun baru beserta peran dan organisasi untuk berkolaborasi dalam proyek.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Ir. Ahmad Fauzi"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Email Resmi
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ahmad@konstruksi.co.id"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="reg-role"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Jenis Peran Pengguna
                  </label>
                  <select
                    id="reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
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
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nama Perusahaan / Instansi
                  </label>
                  <input
                    id="reg-org"
                    type="text"
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    placeholder="PT Karya Bangun Mandiri"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="reg-pos"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Jabatan
                  </label>
                  <input
                    id="reg-pos"
                    type="text"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    placeholder="Project Director"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nomor Telepon
                  </label>
                  <input
                    id="reg-phone"
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#071D49] hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
              >
                Daftarkan Akun &amp; Masuk
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
