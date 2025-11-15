// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';


type moter_type={
  id:number,
  moter_value:string
}


// 렌더러 프로세스(React 앱)에서 'myAPI' 객체로 접근 가능
contextBridge.exposeInMainWorld('myAPI', {
  
  // 예시: 메인 프로세스로 메시지 보내기
  sendMessage: (message: moter_type) => ipcRenderer.send('cmd-channel', message),
  
  // 시리얼 포트 리스트 가져오는 함수
  getSerialPorts:()=> ipcRenderer.invoke('getSerialPorts'),

  //시리얼 포트 연결 함수
  connectPorts:(portName:string)=> ipcRenderer.invoke('connectPorts',portName),

  //시리얼 포트 연결 해제 함수
  closePort:()=> ipcRenderer.invoke('closePort'),

  all_stop_motor:()=> ipcRenderer.send("all-stop-motor"),
});