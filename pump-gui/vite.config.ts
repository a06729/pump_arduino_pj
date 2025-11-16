import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        // 메인 프로세스
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist/electron/main',
            rollupOptions: {
              external: [
                'electron',
                'serialport',
                'better-sqlite3',
                'drizzle-orm',
              ],
              output: {
                format: 'cjs',
              },
            },
          },
          resolve: {
            alias: {
              '@': path.resolve(__dirname, './src'),
              '@electron': path.resolve(__dirname, './electron'),
            },
          },
        },
      },
      {
        // Preload 스크립트
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@electron": path.resolve(__dirname, "./electron"),
    },
  },
  base: './',
});