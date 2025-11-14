import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Send, AlertCircle } from 'lucide-react';


type moter_type={
  id:number,
  moter_value:string
}

type portList={
  path:string, //시리얼 포트 위치이름 ex)COM3
  manufacturer:string //시리얼 포트 설명이름
}

interface myApi {
  sendMessage: (message: moter_type) => void;
  getSerialPorts:()=>portList[];
  connectPorts:(poartName:string)=>boolean;
  closePort:()=>void;
}



declare global { interface Window { myAPI: myApi; } }

//현재 시리얼 포트로 연결 할 수 있는 시리얼 포트 정보 가져오는 함수
async function getSerialPorts(){
      const ports = await window.myAPI.getSerialPorts();
      console.log('사용 가능한 포트:', ports);
      return ports;
}

const SerialCommunicationUI: React.FC = () => {
  //시리얼 포트 정보 satae 함수
  const [portList,setPortList]=useState<portList[]>([]);
  //시리얼 연결 ON OFF 체크하기 위한 satae
  const [isConnected, setIsConnected] = useState(false);
  
  //보트레이던트 설정
  const [baudRate, setBaudRate] = useState('9600');
  
  //시리얼 포트 설정
  const [selectedPort, setSelectedPort] = useState('COM3');
  
  //첫번째 모터값 State
  const [inputMoter_F, setInputMoter_F] = useState('');
  //두번째 모터값 State
  const [inputMotor_S, setInputMoter_S] = useState('');

  const [error, setError] = useState('');


  useEffect(() => {
        if (window.myAPI && window.myAPI.getSerialPorts!=undefined) {
          getSerialPorts().then((ports)=>{
            console.log('사용 가능한 포트:', ports);
            setPortList(ports);
            setSelectedPort(ports[0].path);
            console.log(`ports:${ports[0].path}`);
          });
        } else {
          // console.error('myAPI.sendMessage is not available on window object.');
        }
  }, []);

  //시리얼 연결 함수
  const connect = async () => {

    if (window.myAPI && window.myAPI.connectPorts) {
      const success = await window.myAPI.connectPorts(selectedPort);
      if (success) {
        setIsConnected(true);
      } else {
        setError('포트 연결 실패');
      }
    }

    console.log(`${selectedPort} 포트에 연결되었습니다 (Baud Rate: ${baudRate})`);
  };
  //시리얼 포트 연결 해제 함수
  const disconnect = async () => {
    if (window.myAPI && window.myAPI.closePort) {
        await window.myAPI.closePort();
        // 더미 연결 해제
        setIsConnected(false);
        setError('');
        console.log(`${selectedPort} 포트 연결이 해제되었습니다`);
    }

  };

  //첫번째 모터에 값을 전송하기 위한 함수
  const send_Moter_F_Data = async () => {
    if (window.myAPI && window.myAPI.getSerialPorts!=undefined) {
      const data:moter_type={
        id: 1,
        moter_value:inputMoter_F
      };
      window.myAPI.sendMessage(data);
    }
    setInputMoter_F('');
    setError('');
  };
  
  // 두번째 모터에 값을 전송하기 위한 함수
  const send_Moter_S_Data = async () => {
    if (window.myAPI && window.myAPI.getSerialPorts!=undefined) {
      const data:moter_type={
        id: 2,
        moter_value:inputMotor_S
      };
      window.myAPI.sendMessage(data);
    }
    setInputMoter_S('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">시리얼 통신 인터페이스</h1>
          <p className="text-slate-600">Web Serial API를 사용한 시리얼 포트 통신</p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>연결 설정</CardTitle>
            <CardDescription>시리얼 포트에 연결하기 위한 설정</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="portSelect">포트 선택</Label>
                <Select value={selectedPort} onValueChange={setSelectedPort} disabled={isConnected}>
                  <SelectTrigger id="portSelect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {portList.map((port) => (
                      <SelectItem key={port.path} value={port.path}>
                        {port.path} {port.manufacturer && `(${port.manufacturer})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="baudRate">Baud Rate</Label>
                <Select value={baudRate} onValueChange={setBaudRate} disabled={isConnected}>
                  <SelectTrigger id="baudRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9600">9600</SelectItem>
                    <SelectItem value="19200">19200</SelectItem>
                    <SelectItem value="38400">38400</SelectItem>
                    <SelectItem value="57600">57600</SelectItem>
                    <SelectItem value="115200">115200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={isConnected ? disconnect : connect}
                className={isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {isConnected ? (
                  <>
                    <WifiOff className="mr-2 h-4 w-4" />
                    연결 해제
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    연결
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>데이터 송신</CardTitle>
            <CardDescription>시리얼 포트로 데이터 전송</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex  justify-center">
              <div className='flex gap-5 justify-center items-center mr-14'>
                  <Input
                    value={inputMoter_F}
                    onChange={(e) => setInputMoter_F(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && send_Moter_F_Data()}
                    placeholder="1모터 유량 값"
                    disabled={!isConnected}
                  />
                  <Button onClick={send_Moter_F_Data} disabled={!isConnected || !inputMoter_F}>
                      <Send className="mr-2 h-4 w-4" />
                      <span>1번 모터 전송</span>
                  </Button>
              </div>
              <div className='flex gap-5 justify-center items-center  mr-14 '>
                  <Input
                    value={inputMotor_S}
                    onChange={(e) => setInputMoter_S(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && send_Moter_S_Data()}
                    placeholder="2모터 유량 값"
                    disabled={!isConnected}
                  />
                  <Button onClick={send_Moter_S_Data} disabled={!isConnected || !inputMotor_S}>
                      <Send className="mr-2 h-4 w-4" />
                      <span>2번 모터 전송</span>
                  </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default SerialCommunicationUI;