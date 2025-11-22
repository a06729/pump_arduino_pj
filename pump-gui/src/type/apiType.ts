type motor_type={
  //모터 첫번쨰 두번쨰 인지 확인하는 값
  id:number,
  //모터 ml 값 정보
  motor_value:string
}

type portList={
  path:string, //시리얼 포트 위치이름 ex)COM3
  manufacturer:string //시리얼 포트 설명이름
}

export interface MotorData {
  id: number;
  motorName: string;
  time: string;
  ml: number;
}

//electron에 ipc 핸들러에 보내기 위한 함수 타입 지정
export interface myApi {
  sendMessage: (message: motor_type) => void; // 모터 작동을 시키기 위해서 명령을 내리는 함수
  getSerialPorts:()=>portList[]; // 모든 시리얼포트 가져오기 위한 함수
  getMotorData:()=>MotorData[]; //sqlite에 저장되어있는 모터 정보를 전부 가져오기 위한 함수
  connectPorts:(poartName:string,baudRate:string)=>boolean;//시리얼 포트를 연결하기 위한 함수
  all_stop_motor:()=>void; //모든 모터를 멈추기 위한 함수
  closePort:()=>void; // 시리얼 포트를 닫기 위한 함수
}