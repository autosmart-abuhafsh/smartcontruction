import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resolvedAppsScriptUrl =
    env.VITE_APPS_SCRIPT_URL ||
    env.APPS_SCRIPT_URL ||
    env.VITE_GAS_URL ||
    env.GAS_URL ||
    env.VITE_GOOGLE_APPS_SCRIPT_URL ||
    env.GOOGLE_APPS_SCRIPT_URL ||
    env.VITE_APPS_SCRIPT_WEBAPP_URL ||
    env.APPS_SCRIPT_WEBAPP_URL ||
    process.env.VITE_APPS_SCRIPT_URL ||
    process.env.APPS_SCRIPT_URL ||
    process.env.VITE_GAS_URL ||
    process.env.GAS_URL ||
    '';

  const resolvedAutoSync =
    env.VITE_APPS_SCRIPT_AUTO_SYNC ||
    env.APPS_SCRIPT_AUTO_SYNC ||
    process.env.VITE_APPS_SCRIPT_AUTO_SYNC ||
    process.env.APPS_SCRIPT_AUTO_SYNC ||
    'true';

  return {
    envPrefix: ['VITE_', 'APPS_SCRIPT_', 'GAS_', 'GOOGLE_APPS_SCRIPT_'],
    define: {
      'import.meta.env.VITE_RESOLVED_APPS_SCRIPT_URL': JSON.stringify(resolvedAppsScriptUrl),
      'import.meta.env.VITE_RESOLVED_APPS_SCRIPT_AUTO_SYNC': JSON.stringify(resolvedAutoSync),
    },
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
