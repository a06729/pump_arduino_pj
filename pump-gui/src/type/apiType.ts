import {ipcRenderer} from 'electron';


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

// 1. 저장할 설정 데이터의 구조를 정의 (확장성을 위해 분리)
export interface UserSettings {
  googleApiKey?: string;
  memApiKey?:string;
  // 추후 필요한 설정들을 여기에 추가 (예: themeMode?: string; 등)
}

// 2. 응답 결과 타입 정의 (선택 사항)
export interface SaveResponse {
  success: boolean;
  error?: any;
}

//electron에 ipc 핸들러에 보내기 위한 함수 타입 지정
export interface myApi {
  sendMessage: (message: motor_type) => void; // 모터 작동을 시키기 위해서 명령을 내리는 함수
  getSerialPorts:()=>portList[]; // 모든 시리얼포트 가져오기 위한 함수
  getMotorData:()=>MotorData[]; //sqlite에 저장되어있는 모터 정보를 전부 가져오기 위한 함수
  connectPorts:(poartName:string,baudRate:string)=>boolean;//시리얼 포트를 연결하기 위한 함수
  all_stop_motor:()=>void; //모든 모터를 멈추기 위한 함수
  closePort:()=>void; // 시리얼 포트를 닫기 위한 함수


  // --- [추가] 설정 관련 함수 ---
  
  /**
   * 저장된 설정을 불러옵니다.
   * 비동기로 데이터를 받아오므로 Promise<UserSettings>를 반환합니다.
   */
  getSettings: () => Promise<UserSettings>;

  /**
   * 설정을 파일에 저장합니다.
   * 저장 성공 여부를 알기 위해 Promise<SaveResponse>를 반환합니다.
   */
  saveSettings: (settings: UserSettings) => Promise<SaveResponse>;

  onDownloadProgress: (callback: (percent: number) => void) => () => void;



}