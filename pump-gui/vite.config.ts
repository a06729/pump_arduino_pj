// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // 메인 프로세스 진입점
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist/electron/main', // 출력 경로 수정
          },
        },
      },
      {
        // Preload 스크립트 진입점
        entry: 'electron/preload.ts',
        onstart(options) {
          // preload 스크립트 빌드 완료 시 렌더러 리로드
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/electron/preload', // 출력 경로 수정
          },
        },
      },
    ]),
    renderer(),
  ],
  // 프로덕션 빌드 시 Electron이 파일을 찾을 수 있도록 base 경로 수정
  base: './',
});