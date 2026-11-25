import React from 'react';
import { motion } from 'motion/react';

export const SmartBuildLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sb_brand_bg" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#071D49" />
        <stop offset="100%" stopColor="#0F2D6B" />
      </linearGradient>
      <linearGradient id="sb_brand_accent" x1="24" y1="20" x2="104" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1264F4" />
      </linearGradient>
      <linearGradient id="sb_brand_emerald" x1="24" y1="70" x2="104" y2="112" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#sb_brand_bg)" />
    <polygon
      points="64,14 108,39 108,89 64,114 20,89 20,39"
      stroke="#3B82F6"
      strokeWidth="3"
      fill="rgba(18,100,244,0.12)"
    />
    <polygon points="64,28 32,46 32,88 64,104 64,28" fill="url(#sb_brand_accent)" />
    <polygon points="64,28 96,46 96,88 64,104 64,28" fill="#1D4ED8" />
    <polygon points="64,20 96,38 64,54 32,38" fill="#60A5FA" />
    <line x1="44" y1="54" x2="56" y2="61" stroke="#E0F2FE" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="44" y1="68" x2="56" y2="75" stroke="#E0F2FE" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="84" y1="54" x2="72" y2="61" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="84" y1="68" x2="72" y2="75" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" />
    <polygon points="64,84 98,67 98,77 64,95 30,77 30,67" fill="url(#sb_brand_emerald)" />
  </svg>
);

export const SmartBuildLoadingOverlay: React.FC<{
  title?: string;
  subtitle?: string;
}> = ({
  title = 'Menyiapkan Ruang Kerja SmartBuild...',
  subtitle = 'Memuat Model BIM 3D, Kontrak Digital & Mesin Simulasi Smart Contract',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-[#071D49]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Animated Isometric 3D Building Assembly */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <motion.svg
            viewBox="0 0 200 200"
            className="w-32 h-32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer rotating hexagon frame */}
            <motion.polygon
              points="100,15 174,57 174,143 100,185 26,143 26,57"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeDasharray="12 6"
              fill="rgba(18,100,244,0.08)"
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '100px 100px' }}
            />
            {/* Foundation Layer */}
            <motion.polygon
              points="100,126 156,152 100,176 44,152"
              fill="#10B981"
              fillOpacity="0.85"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: [6, 0, 6], opacity: 1 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Middle Structural Layer */}
            <motion.polygon
              points="100,64 52,92 52,144 100,168 100,64"
              fill="#1264F4"
              initial={{ y: -8, opacity: 0.7 }}
              animate={{ y: [-4, 2, -4], opacity: 1 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
            <motion.polygon
              points="100,64 148,92 148,144 100,168 100,64"
              fill="#1D4ED8"
              initial={{ y: -8, opacity: 0.7 }}
              animate={{ y: [-4, 2, -4], opacity: 1 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
            {/* Roof BIM Layer */}
            <motion.polygon
              points="100,44 152,72 100,98 48,72"
              fill="#60A5FA"
              animate={{ y: [-8, 0, -8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </motion.svg>
        </div>

        <div className="space-y-1.5">
          <div className="text-lg font-bold tracking-tight text-white">{title}</div>
          <p className="text-xs text-slate-300">{subtitle}</p>
        </div>

        {/* Animated progress track */}
        <div className="w-64 h-1.5 bg-white/15 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#1264F4] via-[#60A5FA] to-[#10B981] rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
