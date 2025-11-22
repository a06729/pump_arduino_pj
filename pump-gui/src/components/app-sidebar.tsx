import { ChevronFirst, ChevronLast, Wifi,GaugeCircle, Home } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AppSidebar() {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className={`h-screen transition-all duration-300 bg-white ${expanded ? "w-64" : "w-16"}`}>
      <nav className="h-full flex flex-col">
        {/* 헤더 영역: 로고와 토글 버튼 */}
        <div className="p-4 pb-2 flex justify-between items-center">
          
          {/* 로고 및 타이틀: 접혔을 때는 너비가 0이 되고 투명해짐 */}
          <div 
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
              expanded ? "w-32 opacity-100" : "w-0 opacity-0"
            }`}
          >
            {/* 아이콘이 찌그러지지 않도록 min-w-fit 설정 */}
            <Wifi className="text-blue-600 min-w-fit" />
            {/* 텍스트 줄바꿈 방지 */}
            <span className="font-semibold text-gray-800 whitespace-nowrap">MyApp</span>
          </div>

          {/* 기존 코드에 있던 {!expanded && <Wifi ... />} 부분은 삭제했습니다 (요청하신 대로 안 보이게 하기 위해) */}

          {/* 토글 버튼 */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className='p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 absolute right-4' 
            // absolute right-4 등을 사용하여 위치를 고정하거나, 
            // 단순히 flex 레이아웃에 맡길 수도 있습니다. 여기서는 flex 흐름을 유지하되
            // 접혔을 때 중앙에 오도록 하기 위해 상위 div의 justify-between이 자연스럽게 동작하게 둡니다.
            // 다만, 접혔을 때 버튼만 남기 때문에 패딩 조정을 위해 아래와 같이 스타일을 약간 수정하는 것이 좋습니다.
            style={{ position: expanded ? 'static' : 'relative', left: expanded ? 'auto' : '-6px' }}
            aria-label={expanded ? "사이드바 축소" : "사이드바 확장"}
          >
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        {/* 메뉴 리스트 영역 */}
        {/* mt-4: 상단과의 간격 추가 */}
        <ul className={`flex-1 px-3 mt-4 overflow-hidden transition-all duration-300 ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="space-y-2"> {/* 아이템 간의 간격(margin)을 일정하게 줌 */}
            {/* 홈 메뉴 */}
            <Link 
              to="/" 
              className="flex items-center gap-4 p-3 text-gray-600 transition-colors rounded-xl hover:bg-blue-50 hover:text-blue-600 group"
            >
              {/* 아이콘 크기 고정 및 색상 전환 */}
              <Home className="w-5 h-5 transition-colors group-hover:text-blue-600" />
              <span className="font-medium text-sm whitespace-nowrap">홈</span>
            </Link>

            {/* 대시보드 메뉴 */}
            <Link 
              to="/dashbord" 
              className="flex items-center gap-4 p-3 text-gray-600 transition-colors rounded-xl hover:bg-blue-50 hover:text-blue-600 group"
            >
              <GaugeCircle className="w-5 h-5 transition-colors group-hover:text-blue-600" />
              <span className="font-medium text-sm whitespace-nowrap">대시보드</span>
            </Link>
          </div>
        </ul>
      </nav>
    </aside>
  );
}