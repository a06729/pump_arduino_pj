// electron/preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';


export type moter_type={
  id:number,
  motor_value:string
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



// 렌더러 프로세스(React 앱)에서 'myAPI' 객체로 접근 가능
contextBridge.exposeInMainWorld('myAPI', {
  
  // 예시: 메인 프로세스로 메시지 보내기
  sendMessage: (message: moter_type) => ipcRenderer.send('cmd-channel', message),
  
  // 시리얼 포트 리스트 가져오는 함수
  getSerialPorts:()=> ipcRenderer.invoke('getSerialPorts'),

  //시리얼 포트 연결 함수
  connectPorts:(portName:string,baudRate:string)=> ipcRenderer.invoke('connectPorts',portName,baudRate),

  //시리얼 포트 연결 해제 함수
  closePort:()=> ipcRenderer.invoke('closePort'),

  all_stop_motor:()=> ipcRenderer.send("all-stop-motor"),

  getMotorData:()=>ipcRenderer.invoke('getMotorData'),

  // 설정 불러오기: main.ts의 'get-settings' 채널 호출
  getSettings: () => ipcRenderer.invoke('get-settings'),

  // 설정 저장하기: main.ts의 'save-settings' 채널 호출 (인자 전달)
  saveSettings: (settings: UserSettings) => ipcRenderer.invoke('save-settings', settings),



  // 다운로드 진행률 리스너 (콜백을 인자로 받음)
  onDownloadProgress: (callback: (percent: number) => void) => {
    // 1. 실제 IPC 리스너 함수 정의
    const listener = (_event: IpcRendererEvent, percent: number) => {
      callback(percent);
    };

    // 2. 채널에 리스너 등록
    ipcRenderer.on('download-progress', listener);

    // 3. [중요] 리스너를 제거(해제)하는 함수를 반환!
    // React의 useEffect cleanup 함수에서 이것을 호출하게 됩니다.
    return () => {
      ipcRenderer.removeListener('download-progress', listener);
    };
  },

});