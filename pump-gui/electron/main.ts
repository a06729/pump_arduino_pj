// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createPort } from "./lib/serial_lib";
import { SerialPort, DelimiterParser } from "serialport";
import {motor_type,motor_fun_enum} from "./type/main_type"
import {getDatabase } from './db/db';

const delimiter = Buffer.from('\n', 'utf8');
let g_port: SerialPort | null = null;
let g_parser: DelimiterParser | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

//시리얼 통신에 체크섬을 계산하기 위한 함수
function calculate_checksum(buffer: number[]): number {
    let sum = 0;
    // buffer는 ID, Cmd, Addr, D0, D1, D2, D3를 포함해야 합니다.
    for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i];
    }
    return sum & 0xFF; // 8비트 오버플로우(하위 1바이트)만 반환
}

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
  g_parser.on('data', async (data) => {
    // 1. Array.from()을 사용해 Array<number>로 변환
    const byteArray: number[] = Array.from(data);
    // 2. Uint8Array 자체로 사용 (가장 효율적)
    const uint8Array: Uint8Array = data;

    console.log('\n--- 데이터 수신 ---');
    
    // HEX 출력은 그대로 유지
    console.log('HEX: ', data.toString('hex').toUpperCase().match(/.{2}/g)?.join(' '));
    for(let i=0; i<data.length; i++){
      // Uint8Array의 개별 바이트 접근 (예: 첫 번째 바이트)
      console.log(`${uint8Array[i].toString(16).toUpperCase().padStart(2, '0')}`);
      console.log(`${i} 번째 바이트: 0x${uint8Array[i].toString(16).toUpperCase().padStart(2, '0')}`);
    }    

    if (data.length >= 8) {
      
      // 2. 4번째 바이트(인덱스 4)부터 32비트(4바이트)를 Big Endian으로 읽기
      // (data[4], data[5], data[6], data[7] 조합)
      try {
        //data[4]부터 int크기 4까지 다 합쳐서 int 숫자로 변환하는 기능
        const combinedDecimalValue = data.readUInt32BE(4);
        const motor_index:number=data[3];
        if(motor_index==1){
            console.log('\n--- 4~7 바이트 조합 (10진수) ---');
            console.log('값 (Big Endian):', combinedDecimalValue); // 예: 260
            const { db } = getDatabase();
            const { motor } = await import('./db/schema/schema');
            
            const results = await db.insert(motor)
            .values(
              { ml:combinedDecimalValue,
                motorName:"motor1"
              }
            )
            .returning().execute();
            
            console.log(`result:${JSON.stringify(results)}`);
        }else if(motor_index==2){
            console.log('\n--- 4~7 바이트 조합 (10진수) ---');
            console.log('값 (Big Endian):', combinedDecimalValue); // 예: 260
            const { db } = getDatabase();
            const { motor } = await import('./db/schema/schema');
            
            const results = await db.insert(motor)
            .values(
              { ml:combinedDecimalValue,
                motorName:"motor2"
              }
            )
            .returning().execute();
            
            console.log(`result:${JSON.stringify(results)}`);
        }

      } catch (e) {
        console.error('Buffer 읽기 중 오류 발생:', e);
      }
    } else {
      console.log('\n[알림] 4바이트를 읽기에 데이터 길이가 충분하지 않습니다.');
    }

    // 수신된 배열을 체크섬 함수에 바로 사용할 수 있습니다.
    // calculate_checksum(byteArray, byteArray.length); 
    
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

// react에서 시리얼 포트 연결 이벤트 발생시 실행 되는 함수
ipcMain.handle('connectPorts', async (event, portName: string,baudRate:string) => {
  try {
    // 이미 포트가 열려있는 경우
    if (g_port && g_port.isOpen) {
      console.log('포트가 이미 열려 있습니다:', portName);
      return { success: true, message: '이미 연결됨' };
    }

    console.log('포트를 엽니다:', portName);
    console.log('baudRate:', baudRate);

    const port = createPort(portName,baudRate);

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

ipcMain.handle('getMotorData',async ()=>{
    const { db } = getDatabase();
    const { motor } = await import('./db/schema/schema');
    const motorData = db.select().from(motor);
    console.log(motorData.all());
    return motorData.all();
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

ipcMain.on('all-stop-motor', (event, message) => {
    let byteArray:number[]=[];

    if (!g_port || !g_port.isOpen) {
        console.error('[Write Error] 포트가 열려있지 않습니다.');
        return;
    }

    byteArray[0]=0x24; // $ 
    byteArray[1]=0x01; // SlaveId 
    byteArray[2]=0x57; // W
    byteArray[3]=0x03; // 주소 3 
    
    const dumyInt = 0;

    const d0 = (dumyInt >> 24) & 0xFF; // Data_0 (MSB) (예: 0x00)
    const d1 = (dumyInt >> 16) & 0xFF; // Data_1      (예: 0x00)
    const d2 = (dumyInt >> 8)  & 0xFF; // Data_2      (예: 0x01)
    const d3 = dumyInt & 0xFF;        // Data_3 (LSB) (예: 0x04)

    const dataToSum = byteArray.slice(1, 8); // index 1부터 8 직전(7)까지
    const checksum = calculate_checksum(dataToSum);

    // 6. 체크섬 및 종료 문자 추가
    byteArray[8]=checksum; // checkSum값 (예: 260 전송 시 0x5E)
    byteArray[9]=0x0A;   // \n

    const dataToSend = Buffer.from(byteArray);
    
    g_port.write(dataToSend, (err) => {
        if (err) {
            return console.error('[Write Error] 전송 실패:', err.message);
        }
        console.log('[Write Success] 데이터 전송 성공:', dataToSend);
    });
 
});

ipcMain.on('cmd-channel', (event, message:motor_type) => {
    let byteArray:number[]=[];
    console.log(`message:${JSON.stringify(message)}`)
    console.log(`[Main Process] 렌더러로부터 메시지 수신: "${message.motor_value}"`);
    
    if (!g_port || !g_port.isOpen) {
        console.error('[Write Error] 포트가 열려있지 않습니다.');
        return;
    }

    // 1. 렌더러에서 받은 문자열 값을 정수로 변환
    const moterValueInt = parseInt(message.motor_value);
    if (isNaN(moterValueInt)) {
        console.error('[Write Error] 유효하지 않은 숫자 값입니다:', message.motor_value);
        return;
    }



    // 2. 32비트 정수를 4개의 8비트 바이트로 분해 (Big-Endian 순서)
    // 예: 260 (0x00000104)
    const d0 = (moterValueInt >> 24) & 0xFF; // Data_0 (MSB) (예: 0x00)
    const d1 = (moterValueInt >> 16) & 0xFF; // Data_1      (예: 0x00)
    const d2 = (moterValueInt >> 8)  & 0xFF; // Data_2      (예: 0x01)
    const d3 = moterValueInt & 0xFF;        // Data_3 (LSB) (예: 0x04)

    // 3. 10바이트 패킷 구성
    byteArray[0]=0x24; // $ 
    byteArray[1]=0x01; // SlaveId 
    byteArray[2]=0x57; // W  

    if(message.id==motor_fun_enum.Motor_First_ID){
        byteArray[3]=0x01; // 주소 1
    } else if(message.id==motor_fun_enum.Motor_Second_ID){
        byteArray[3]=0x02; // 주소 2
    } else {
        console.warn(`[Write Warn] 알 수 없는 ID: ${message.id}`);
        return; // 처리할 ID가 아니면 종료
    }

    // 4. 4바이트 데이터 추가
    byteArray[4]=d0;
    byteArray[5]=d1;
    byteArray[6]=d2;
    byteArray[7]=d3;

    // 5. 체크섬 계산
    // C 코드: calculate_checksum(&buffer[1], 7) 
    // (ID부터 D3까지 총 7바이트)
    // JS/TS: byteArray.slice(1)는 index 1 (ID)부터 index 7 (D3)까지
    //        [ID, W, Addr, D0, D1, D2, D3] 배열을 새로 만듭니다.
    const dataToSum = byteArray.slice(1, 8); // index 1부터 8 직전(7)까지
    const checksum = calculate_checksum(dataToSum);

    // 6. 체크섬 및 종료 문자 추가
    byteArray[8]=checksum; // checkSum값 (예: 260 전송 시 0x5E)
    byteArray[9]=0x0A;   // \n

    // 7. 전송
    const dataToSend = Buffer.from(byteArray);
    
    g_port.write(dataToSend, (err) => {
        if (err) {
            return console.error('[Write Error] 전송 실패:', err.message);
        }
        // 예: 260 전송 시: <Buffer 24 01 57 01 00 00 01 04 5e 0a>
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