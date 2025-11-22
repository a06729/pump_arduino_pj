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


export interface myApi {
  sendMessage: (message: motor_type) => void;
  getSerialPorts:()=>portList[];
  getMotorData:()=>MotorData[];
  connectPorts:(poartName:string)=>boolean;
  all_stop_motor:()=>void;
  closePort:()=>void;
}