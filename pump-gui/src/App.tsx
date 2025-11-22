import './App.css'
import { AppSidebar } from './components/app-sidebar';
import IndexPage from './ui';
import MotorUsageDashboard from './ui/dashbord'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 전역 Window 인터페이스에 'myAPI' 타입을 추가합니다.
// export interface myApi {
//   sendMessage: (message: string) => void;
// }


function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<IndexPage />}></Route>
      <Route path="/dashbord" element={<MotorUsageDashboard/>}></Route>
    </Routes>
    </BrowserRouter>

    </>
  )
}

export default App
