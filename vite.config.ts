import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import {defineConfig} from 'vite';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      !isDev && VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: false }, // disable service worker in dev to avoid reload/cache issues during local browser testing
        manifest: {
          name: 'Toko KSA Mart',
          short_name: 'Toko KSA Mart',
          description: 'Aplikasi Kasir Pintar Syariah Terintegrasi',
          theme_color: '#064e3b',
          background_color: '#f8fafc',
          display: 'fullscreen',
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000
        }
      })
    ].filter(Boolean),
    resolve: {      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
