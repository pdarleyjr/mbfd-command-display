import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// MBFD Command Display — Vite 6 + React 19 SPA, deployed to Cloudflare Pages.
// `/api/*` is served by Cloudflare Functions in production; in dev we proxy to a
// local CF Functions dev server (wrangler pages dev) when present, else fall back
// to direct hub calls via VITE_HUB_BASE.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    modulePreload: {
      resolveDependencies(_url, deps) {
        return deps.filter((dep) => !dep.includes('/three-') && !dep.includes('three-'));
      },
    },
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
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
