import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff, Send, Trash2, Download, AlertCircle } from 'lucide-react';


interface SerialMessage {
  timestamp: Date;
  type: 'sent' | 'received';
  data: string;
}


interface myApi {
  sendMessage: (message: string) => void;
  getSerialPorts:()=>void;
  connectPorts:(poartName:string)=>boolean;
  closePort:()=>void;
}

declare global { interface Window { myAPI: myApi; } }



async function getSerialPorts(){
      const ports = await window.myAPI.getSerialPorts();
      console.log('사용 가능한 포트:', ports);
      return ports;
}

const SerialCommunicationUI: React.FC = () => {
  const [portList,setPortList]=useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [baudRate, setBaudRate] = useState('9600');
  const [selectedPort, setSelectedPort] = useState('COM3');
  const [messages, setMessages] = useState<SerialMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [receivedData, setReceivedData] = useState('');

  useEffect(() => {

        if (window.myAPI && window.myAPI.getSerialPorts) {
          getSerialPorts().then((ports)=>{
            console.log('사용 가능한 포트:', ports);
            setPortList(ports);
          });
        } else {
          // console.error('myAPI.sendMessage is not available on window object.');
        }
  }, []);

  const connect = async () => {

    if (window.myAPI && window.myAPI.connectPorts) {
      const success = await window.myAPI.connectPorts(selectedPort);
      if (success) {
        setIsConnected(true);
      } else {
        setError('포트 연결 실패');
      }
    }

    // 더미 연결 - 항상 성공
    setIsConnected(true);
    setError('');
    console.log(`${selectedPort} 포트에 연결되었습니다 (Baud Rate: ${baudRate})`);
  };

  const disconnect = async () => {
    if (window.myAPI && window.myAPI.closePort) {
        await window.myAPI.closePort();
        // 더미 연결 해제
        setIsConnected(false);
        setError('');
        console.log(`${selectedPort} 포트 연결이 해제되었습니다`);
    }

  };

  const sendData = async () => {
    if (window.myAPI && window.myAPI.getSerialPorts) {
      window.myAPI.sendMessage(inputText);
    }
    setInputText('');
    setError('');
  };

  const clearMessages = () => {
    setMessages([]);
    setReceivedData('');
  };

  const downloadLog = () => {
    const log = messages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.type === 'sent' ? '송신' : '수신'}: ${msg.data}`
    ).join('\n');

    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-log-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour12: false });
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
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendData()}
                placeholder="전송할 데이터 입력..."
                disabled={!isConnected}
              />
              <Button onClick={sendData} disabled={!isConnected || !inputText}>
                <Send className="mr-2 h-4 w-4" />
                전송
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>데이터 모니터</CardTitle>
                <CardDescription>송수신 데이터 로그</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadLog} disabled={messages.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
                <Button variant="outline" size="sm" onClick={clearMessages} disabled={messages.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  초기화
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="formatted" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="formatted">포맷 뷰</TabsTrigger>
                <TabsTrigger value="raw">원본 데이터</TabsTrigger>
              </TabsList>
              <TabsContent value="formatted">
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-slate-950 font-mono text-sm">
                  {messages.length === 0 ? (
                    <div className="text-slate-500 text-center py-20">데이터가 없습니다</div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`mb-2 ${msg.type === 'sent' ? 'text-green-400' : 'text-blue-400'}`}>
                        <span className="text-slate-500">[{formatTime(msg.timestamp)}]</span>
                        <span className="mx-2">{msg.type === 'sent' ? '→' : '←'}</span>
                        <span>{msg.data}</span>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="raw">
                <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-slate-950 text-green-400 font-mono text-sm whitespace-pre-wrap break-all">
                  {receivedData || <div className="text-slate-500 text-center py-20">수신된 데이터가 없습니다</div>}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SerialCommunicationUI;