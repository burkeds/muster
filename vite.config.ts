import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { tiledProxy } from './vite.tiled-proxy';

export default defineConfig({
  plugins: [react(), tiledProxy()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Consume the modular plugins from their source (workspace/submodule dirs).
      {
        find: '@tiled/client-core',
        replacement: fileURLToPath(new URL('./tiled-client-core/src/index.ts', import.meta.url)),
      },
      {
        find: '@tiled/client-h5web',
        replacement: fileURLToPath(new URL('./tiled-client-h5web/src/index.ts', import.meta.url)),
      },
      // plotly.js's CJS source breaks under Vite's dev optimizer (the image trace
      // requires 'buffer/', pre-bundling throws on `global` / `.prototype`). Use the
      // prebuilt browser UMD bundle instead, which loads cleanly in dev and prod.
      { find: /^plotly\.js$/, replacement: 'plotly.js-dist-min' },
      // The bundled plotly image trace also needs the browser `buffer` polyfill.
      { find: /^buffer\/?$/, replacement: 'buffer/' },
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        // plotly.js references Node's `global`; map it to the browser global.
        global: 'globalThis',
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    // Allow the dev server to be reached from any hostname/interface — useful on
    // shared or LAN deployments. Vite otherwise blocks unknown Host headers.
    allowedHosts: true,
    proxy: {
      // Optional: proxy Tiled requests to avoid CORS during local dev.
      // Set VITE_TILED_API_URL=/api/v1 to use relative URLs.
      // NOTE: keep changeOrigin off — Tiled builds absolute redirect/self URLs
      // from the request Host. With changeOrigin on, Host becomes
      // localhost:8000 and Tiled's 307 (and any absolute Location) becomes
      // cross-origin, which the browser CORS-blocks.
      '/api/v1': {
        target: 'http://localhost:8000',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          plotly: ['plotly.js', 'react-plotly.js'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/testing/setup.ts'],
    css: false,
  },
});
