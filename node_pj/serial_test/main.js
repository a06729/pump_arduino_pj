const { SerialPort ,DelimiterParser } = require('serialport');

// 포트 설정 (여기를 수정하세요)
const portName = 'COM3'; // Windows: COM3, Linux: /dev/ttyUSB0
const baudRate = 9600;

console.log('=== 간단한 시리얼 수신 테스트 ===');
console.log(`포트: ${portName}, 보드레이트: ${baudRate}\n`);

// 시리얼 포트 생성 (최소 설정)
const port = new SerialPort({
    path: portName,
    baudRate: baudRate,
    autoOpen: false
});

const delimiter = Buffer.from('\r', 'utf8');
const parser = port.pipe(new DelimiterParser({ delimiter: delimiter }));

// 수신된 모든 바이트를 출력
parser.on('data', (data) => {
    console.log('\n--- 데이터 수신 ---');
    console.log('길이:', data.length, '바이트');
    
    // HEX 출력
    //console.log('HEX: ', data.toString('hex').toUpperCase().match(/.{2}/g).join(' '));
    
    // 바이너리 출력  
    //console.log('BIN: ', Array.from(data).map(b => b.toString(2).padStart(8, '0')).join(' '));
    
    // ASCII 출력 (제어 문자 표시)
    let asciiStr = '';
    for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        if (byte === 13) asciiStr += '\\r';
        else if (byte === 10) asciiStr += '\\n';
        else if (byte === 9) asciiStr += '\\t';
        else if (byte < 32 || byte > 126) asciiStr += `\\x${byte.toString(16).padStart(2, '0')}`;
        else asciiStr += String.fromCharCode(byte);
    }
    console.log('ASCII:', `"${asciiStr}"`);
    
    // UTF-8 시도
    try {
        console.log('UTF-8:', `"${data.toString('utf8')}"`);
    } catch (e) {
        console.log('UTF-8: 변환 실패');
    }
    
    console.log('-------------------\n');
});

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
    console.log('Arduino에서 데이터를 보내보세요.');
    console.log('Ctrl+C로 종료\n');
    startManualInput();
    // 1초마다 테스트 메시지 전송
    // let counter = 0;
    // const testInterval = setInterval(() => {
    //     counter++;
    //     const testMsg = `test${counter}`;
    //     console.log(`[송신] "${testMsg}"`);
    //     port.write(testMsg + '\r', (err) => {
    //         if (err) console.log('송신 에러:', err.message);
    //     });
        
    //     // 10번 전송 후 중지
    //     if (counter >= 10) {
    //         clearInterval(testInterval);
    //         console.log('\n테스트 메시지 전송 완료. 수동 입력 모드...\n');
    //         startManualInput();
    //     }
    // }, 1000);
});

// 수동 입력 시작
function startManualInput() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.setPrompt('전송할 메시지 (quit=종료): ');
    rl.prompt();
    
    rl.on('line', (input) => {
        if (input.toLowerCase() === 'quit') {
            port.close();
            rl.close();
            process.exit();
        }
        
        console.log(`[송신] "${input}"`);
        port.write(input + '\r');
        rl.prompt();
    });
}

// 에러 처리
port.on('error', (err) => {
    console.error('포트 에러:', err.message);
});

port.on('close', () => {
    console.log('포트가 닫혔습니다.');
});

// 프로그램 종료 처리
process.on('SIGINT', () => {
    console.log('\n프로그램을 종료합니다...');
    port.close();
    process.exit();
});