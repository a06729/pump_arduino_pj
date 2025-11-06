// electron/main.ts
import { app, BrowserWindow ,ipcMain} from 'electron';
import path from 'path';
import {port,parser} from "./lib/serial_lib";
import { SerialPort ,DelimiterParser } from "serialport";


  // 포트 열기
port.open((err) => {
      if (err) {
          console.error('포트 열기 실패:', err.message);
          
          // 사용 가능한 포트 목록 출력
          SerialPort.list().then(ports => {
              console.log('\n사용 가능한 포트:');
              ports.forEach((p, i) => {
                  console.log(`${i+1}. ${p.path}${p.manufacturer ? ` (${p.manufacturer})` : ''}`);
              });
          });
          return;
      }
      
      console.log('포트 연결 성공! 데이터를 기다리는 중...');
});

// 에러 처리
port.on('error', (err) => {
    console.error('포트 에러:', err.message);
});

port.on('close', () => {
    console.log('포트가 닫혔습니다.');
});

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

ipcMain.on('some-channel', (event, message) => {
    console.log(`[Main Process] 렌더러로부터 메시지 수신: "${message}"`);
    
      const byteArray = [
          0x24, 0x01, 0x57, 0x05, 0xAA, 0x07, 0x0A, // 첫 번째 시퀀스
      ];
      const dataToSend = Buffer.from(byteArray);
      // console.log(`[송신] "${dataToSend}"`);
      port.write(dataToSend, (err) => {
      if (err) {
          return console.error('[Write Error] 전송 실패:', err.message);
      }
      console.log('[Write Success] 데이터 전송 성공:', dataToSend);
      });

    // (선택 사항) 메시지를 보낸 창으로 다시 응답을 보낼 수도 있습니다.
    // event.reply('reply-channel', '메시지 잘 받았습니다!');
});


parser.on('data', (data) => {
    console.log('\n--- 데이터 수신 ---');
    console.log('길이:', data.length, '바이트');
    
    // HEX 출력
    console.log('HEX: ', data.toString('hex').toUpperCase().match(/.{2}/g).join(' '));
    
    console.log('-------------------\n');
});


app.whenReady().then(()=>{
  createWindow();
});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  port.close();

});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});