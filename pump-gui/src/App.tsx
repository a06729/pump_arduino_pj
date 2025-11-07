import { useState } from 'react'
import './App.css'
import SerialCommunicationUI from './ui';

// 전역 Window 인터페이스에 'myAPI' 타입을 추가합니다.
export interface myApi {
  sendMessage: (message: string) => void;
}

declare global { interface Window { myAPI: myApi; } }

function App() {
  const [count, setCount] = useState(0)
  const buttonHandler=()=>{
    setCount(count+1);
    const message = "안녕하세요! React에서 메인으로 메시지를 보냅니다.";
    
    // Preload에서 노출한 'myAPI' 객체의 'sendMessage' 함수를 호출합니다.
    if (window.myAPI && window.myAPI.sendMessage) {
      window.myAPI.sendMessage(message);
      console.log('메시지 전송:', message);
    } else {
      console.error('myAPI.sendMessage is not available on window object.');
    }

  }

  return (
    <>
      <SerialCommunicationUI />
    </>
  )
}

export default App
