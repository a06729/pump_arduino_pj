import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, Activity, Droplets, History } from 'lucide-react'; // 아이콘 추가
import { AppSidebar } from '@/components/app-sidebar';
import type { myApi, MotorData } from '../type/apiType';

declare global { interface Window { myAPI: myApi; } }

// ... (인터페이스 및 getMotorData 함수는 기존과 동일)
interface GroupedData {
  motor1: number;
  motor2: number;
}

interface ChartData extends GroupedData {
  name: string;
  key: string;
}

async function getMotorData() {
  const motorData = await window.myAPI.getMotorData();
  return motorData;
}

const MotorUsageDashboard = () => {
  const [data, setData] = useState<MotorData[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    getMotorData().then((res) => {
      setData(res || []);
    });
  }, []);

// --- [수정됨] 주별 데이터 (최근 7일 기준) ---
  const weeklyData = useMemo(() => {
    const today = new Date();
    
    // [핵심 변경] 시작일을 "이번주 일요일"이 아니라 "오늘로부터 6일 전"으로 설정
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 6); 

    // 날짜 포맷 헬퍼 (YYYY-MM-DD)
    const formatKey = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const weekTemplate: Record<string, ChartData> = {};
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 7일치 템플릿 생성
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      
      const dateKey = formatKey(d);
      // 라벨 예시: "11/22(토)"
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}(${dayNames[d.getDay()]})`;

      weekTemplate[dateKey] = { name: label, key: dateKey, motor1: 0, motor2: 0 };
    }

    // 데이터 매핑
    data.forEach(item => {
      const itemDate = new Date(item.time);
      
      if (!isNaN(itemDate.getTime())) {
        const dateKey = formatKey(itemDate);

        // 템플릿에 해당 날짜가 있다면 데이터 추가
        if (weekTemplate[dateKey]) {
          if (item.motorName === 'motor1') weekTemplate[dateKey].motor1 += item.ml;
          else if (item.motorName === 'motor2') weekTemplate[dateKey].motor2 += item.ml;
        }
      }
    });

    return Object.values(weekTemplate);
  }, [data]);

  // --- [로직 2] 월별 데이터 (올해) ---
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthTemplate: Record<string, ChartData> = {};
    
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${currentYear}-${String(i).padStart(2, '0')}`;
      monthTemplate[monthKey] = { name: `${i}월`, key: monthKey, motor1: 0, motor2: 0 };
    }

    data.forEach(item => {
      const monthKey = item.time.substring(0, 7);
      if (monthTemplate[monthKey]) {
        if (item.motorName === 'motor1') monthTemplate[monthKey].motor1 += item.ml;
        else if (item.motorName === 'motor2') monthTemplate[monthKey].motor2 += item.ml;
      }
    });
    return Object.values(monthTemplate);
  }, [data]);

  // --- [로직 3] 연도별 데이터 ---
  const yearlyData = useMemo(() => {
    const grouped: Record<string, ChartData> = {};
    data.forEach(item => {
      const yearKey = item.time.substring(0, 4);
      if (!grouped[yearKey]) grouped[yearKey] = { name: `${yearKey}년`, key: yearKey, motor1: 0, motor2: 0 };
      
      if (item.motorName === 'motor1') grouped[yearKey].motor1 += item.ml;
      else if (item.motorName === 'motor2') grouped[yearKey].motor2 += item.ml;
    });
    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
  }, [data]);

  // --- [추가 로직] 오늘 날짜 문자열 구하기 (YYYY-MM-DD) ---
  const todayDateString = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const colors = { motor1: '#3b82f6', motor2: '#10b981' };

  // 차트 렌더링 함수 (생략 없이 그대로 사용)
  const renderChart = (chartData: any[]) => {
    const commonProps = { data: chartData, margin: { top: 5, right: 30, left: 20, bottom: 5 } };
    // ... (차트 렌더링 로직은 이전과 동일하므로 코드를 줄이기 위해 props만 전달)
    // 실제 사용시에는 이전에 작성해드린 renderChart 내부 로직을 그대로 쓰시면 됩니다.
     if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="motor1" fill={colors.motor1} name="모터 1" />
          <Bar dataKey="motor2" fill={colors.motor2} name="모터 2" />
        </BarChart>
      );
    } else if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="motor1" stroke={colors.motor1} name="모터 1" strokeWidth={2} />
          <Line type="monotone" dataKey="motor2" stroke={colors.motor2} name="모터 2" strokeWidth={2} />
        </LineChart>
      );
    } else {
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="motor1" stackId="1" stroke={colors.motor1} fill={colors.motor1} name="모터 1" fillOpacity={0.6} />
          <Area type="monotone" dataKey="motor2" stackId="1" stroke={colors.motor2} fill={colors.motor2} name="모터 2" fillOpacity={0.6} />
        </AreaChart>
      );
    }
  };

  const chartTypes = [
    { value: 'bar' as const, label: '막대 그래프', icon: BarChart3, description: '비교에 적합' },
    { value: 'line' as const, label: '선 그래프', icon: LineChartIcon, description: '추세 파악에 적합' },
    { value: 'area' as const, label: '영역 그래프', icon: Activity, description: '누적 비교에 적합' }
  ];

  return (
    <div className='flex'>
      <div><AppSidebar /></div>
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">모터 사용량 분석</h1>
          <p className="text-gray-600">주별, 월별, 연도별 및 오늘 사용량을 확인하세요</p>
        </div>

        {/* 차트 타입 선택 (이전 코드 유지) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">그래프 형태 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {chartTypes.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => setChartType(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${chartType === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs opacity-75">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 탭 섹션 (이전 코드 유지) */}
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">주별 (이번주)</TabsTrigger>
            <TabsTrigger value="monthly">월별 (올해)</TabsTrigger>
            <TabsTrigger value="yearly">연도별</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-6">
            <Card>
              <CardHeader><CardTitle>이번 주 사용량 (ml)</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={400}>{renderChart(weeklyData)}</ResponsiveContainer></CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly" className="mt-6">
            <Card>
              <CardHeader><CardTitle>월별 사용량 (ml)</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={400}>{renderChart(monthlyData)}</ResponsiveContainer></CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yearly" className="mt-6">
            <Card>
              <CardHeader><CardTitle>연도별 사용량 (ml)</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={400}>{renderChart(yearlyData)}</ResponsiveContainer></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 요약 통계 (수정됨: 오늘 사용량 + 총 사용량) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['motor1', 'motor2'] as const).map((motor, index) => {
            // 1. 전체 총 사용량 계산
            const total = data
              .filter(item => item.motorName === motor)
              .reduce((sum, item) => sum + item.ml, 0);

            // 2. 오늘 사용량 계산
            const todayUsage = data
              .filter(item => item.motorName === motor && item.time.startsWith(todayDateString))
              .reduce((sum, item) => sum + item.ml, 0);

            return (
              <Card key={motor} className="overflow-hidden">
                <CardHeader className="pb-3  border-b">
                  <CardTitle className="text-base font-bold text-gray-700 flex items-center gap-2">
                    {/* 모터 아이콘과 이름 */}
                    <div className={`w-3 h-3 rounded-full ${motor === 'motor1' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    모터 {index + 1} 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 divide-x">
                    
                    {/* 오늘 사용량 표시 영역 */}
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Droplets className="w-4 h-4" />
                        <span className="text-sm font-medium">오늘 사용량</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {todayUsage.toLocaleString()} <span className="text-base font-normal text-gray-500">ml</span>
                      </div>
                    </div>

                    {/* 총 누적 사용량 표시 영역 */}
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <History className="w-4 h-4" />
                        <span className="text-sm font-medium">총 누적 사용량</span>
                      </div>
                      <div className={`text-2xl font-bold`} style={{ color: colors[motor] }}>
                        {total.toLocaleString()} <span className="text-base font-normal text-gray-500">ml</span>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default MotorUsageDashboard;