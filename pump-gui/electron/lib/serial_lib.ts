import { SerialPort ,DelimiterParser } from "serialport";

// 포트 설정 (여기를 수정하세요)
// const baudRate = 9600;

// 시리얼 포트 생성 (최소 설정)
function createPort(portName:string,baudRate:string) {
    return new SerialPort({
        path: portName,
        baudRate: Number(baudRate),
        autoOpen: false,
        dataBits: 8, // Setting data size to 8 bits
        parity: 'none',
        //이 옵션을 넣어야 바로 통신이 가능 DTR 신호를 제어하지 않음
        hupcl: false, 
    });
}

export {createPort};