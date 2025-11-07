// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createPort } from "./lib/serial_lib";
import { SerialPort, DelimiterParser } from "serialport";

const delimiter = Buffer.from('\n', 'utf8');
let g_port: SerialPort | null = null;
let g_parser: DelimiterParser | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../index.html'));
    win.webContents.openDevTools();
  }
}

// parser 이벤트 리스너 설정 함수
function setupParserListeners() {
  if (!g_parser) return;

  g_parser.on('data', (data) => {
    console.log('\n--- 데이터 수신 ---');
    console.log('길이:', data.length, '바이트');
    
    // HEX 출력
    console.log('HEX: ', data.toString('hex').toUpperCase().match(/.{2}/g)?.join(' '));
    
    console.log('-------------------\n');
  });
}

// 포트 이벤트 리스너 설정 함수
function setupPortListeners() {
  if (!g_port) return;

  g_port.on('error', (err) => {
    console.error('포트 에러:', err.message);
  });

  g_port.on('close', () => {
    console.log('포트가 닫혔습니다.');
    g_port = null;
    g_parser = null;
  });
}

ipcMain.handle('connectPorts', async (event, portName: string) => {
  try {
    // 이미 포트가 열려있는 경우
    if (g_port && g_port.isOpen) {
      console.log('포트가 이미 열려 있습니다:', portName);
      return { success: true, message: '이미 연결됨' };
    }

    console.log('포트를 엽니다:', portName);
    const port = createPort(portName);

    // 포트 열기를 Promise로 처리
    await new Promise<void>((resolve, reject) => {
      port.open((err) => {
        if (err) {
          console.error('포트 열기 실패:', err.message);
          reject(err);
          return;
        }
        console.log('포트 연결 성공! 데이터를 기다리는 중...');
        resolve();
      });
    });

    // 전역 변수에 할당
    g_port = port;
    
    // Parser 설정
    g_parser = g_port.pipe(new DelimiterParser({ delimiter: delimiter }));
    
    // 이벤트 리스너 설정
    setupPortListeners();
    setupParserListeners();

    return { success: true, message: '연결 성공' };

  } catch (error) {
    console.error('connectPorts 에러:', error);
    return { success: false, message: (error as Error).message };
  }
});

ipcMain.handle('getSerialPorts', async () => {
  const port_list: { path: string; manufacturer?: string }[] = [];
  
  try {
    const port_response = await SerialPort.list();
    port_response.forEach((p) => {
      port_list.push({
        path: p.path,
        manufacturer: p.manufacturer,
      });
    });
    return port_list;
  } catch (error) {
    console.error('getSerialPorts 에러:', error);
    return [];
  }
});

ipcMain.on('some-channel', (event, message) => {
  console.log(`[Main Process] 렌더러로부터 메시지 수신: "${message}"`);
  
  if (!g_port || !g_port.isOpen) {
    console.error('[Write Error] 포트가 열려있지 않습니다.');
    return;
  }

  const byteArray = [
    0x24, 0x01, 0x57, 0x05, 0xAA, 0x07, 0x0A,
  ];
  const dataToSend = Buffer.from(byteArray);
  
  g_port.write(dataToSend, (err) => {
    if (err) {
      return console.error('[Write Error] 전송 실패:', err.message);
    }
    console.log('[Write Success] 데이터 전송 성공:', dataToSend);
  });
});

// 포트 닫기 핸들러 추가
ipcMain.handle('closePort', async () => {
  if (g_port && g_port.isOpen) {
    return new Promise<void>((resolve) => {
      g_port!.close((err) => {
        if (err) {
          console.error('포트 닫기 실패:', err.message);
        } else {
          console.log('포트를 정상적으로 닫았습니다.');
        }
        g_port = null;
        g_parser = null;
        resolve();
      });
    });
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (g_port && g_port.isOpen) {
    g_port.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});