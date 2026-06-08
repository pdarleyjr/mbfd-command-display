import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// MBFD Command Display — Vite 6 + React 19 SPA, deployed to Cloudflare Pages.
// `/api/*` is served by Cloudflare Functions in production; in dev we proxy to a
// local CF Functions dev server (wrangler pages dev) when present, else fall back
// to direct hub calls via VITE_HUB_BASE.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MBFD Command Display',
        short_name: 'MBFD Command',
        description: 'Miami Beach Fire Department read-only command display',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        orientation: 'any',
        icons: [],
      },
      // The display polls live data; do not aggressively cache API responses in the SW.
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'zustand'],
        },
      },
    },
  },
  server: {
    port: 5180,
    proxy: {
      // During `vite dev` (without wrangler), proxy /api straight to the hub origin.
      // When running `wrangler pages dev`, the Functions layer handles /api instead.
      '/api': {
        target: process.env.VITE_DEV_HUB_PROXY ?? 'https://www.mbfdhub.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
