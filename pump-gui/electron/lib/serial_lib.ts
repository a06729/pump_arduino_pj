import { SerialPort ,DelimiterParser } from "serialport";

// 포트 설정 (여기를 수정하세요)
const portName = 'COM3'; // Windows: COM3, Linux: /dev/ttyUSB0
const baudRate = 9600;

console.log('=== 간단한 시리얼 수신 테스트 ===');
console.log(`포트: ${portName}, 보드레이트: ${baudRate}\n`);

// 시리얼 포트 생성 (최소 설정)

function createPort(portName:string) {
    return new SerialPort({
        path: portName,
        baudRate: baudRate,
        autoOpen: false,
        dataBits: 8, // Setting data size to 8 bits
        parity: 'none',
        //이 옵션을 넣어야 바로 통신이 가능 DTR 신호를 제어하지 않음
        hupcl: false, 
    });
}


const delimiter = Buffer.from('\n', 'utf8');
// const parser = port.pipe(new DelimiterParser({ delimiter: delimiter }));

export {createPort};