// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// 렌더러 프로세스(React 앱)에서 'myAPI' 객체로 접근 가능
contextBridge.exposeInMainWorld('myAPI', {
  // 예시: 메인 프로세스로 메시지 보내기
  sendMessage: (message: string) => ipcRenderer.send('some-channel', message),

  getSerialPorts:()=> ipcRenderer.invoke('getSerialPorts'),

  connectPorts:(portName:string)=> ipcRenderer.invoke('connectPorts',portName),

  closePort:()=> ipcRenderer.invoke('closePort'),

});