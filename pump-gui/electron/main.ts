// electron/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';

// Vite 개발 서버 URL 또는 프로덕션 빌드 경로
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'), // preload 스크립트 경로
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // 개발 중일 때 Vite 개발 서버 로드
    win.loadURL(VITE_DEV_SERVER_URL);
    // 개발자 도구 열기
    win.webContents.openDevTools();
  } else {
    // 프로덕션 빌드일 때 index.html 로드
    win.loadFile(path.join(__dirname, '../../index.html'));
    win.webContents.openDevTools();

  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});