import './App.css'
import IndexPage from './ui';
import MotorUsageDashboard from './ui/dashbord'; 
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// 전역 Window 인터페이스에 'myAPI' 타입을 추가합니다.
// export interface myApi {
//   sendMessage: (message: string) => void;
// }


function App() {

  return (
    <>
    <Router>
    <Routes>
      <Route path="/" element={<IndexPage />}></Route>
      <Route path="/dashbord" element={<MotorUsageDashboard/>}></Route>
    </Routes>
    </Router>

    </>
  )
}

export default App
