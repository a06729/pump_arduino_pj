import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppSidebar } from '@/components/app-sidebar';
import type { myApi } from '@/type/apiType';

interface SettingProps {
  onApiKeyChange?: (key: string) => void;
}

declare global { interface Window { myAPI: myApi; } }


const Setting: React.FC<SettingProps> = () => {
  const [apiKey, setApiKey] = useState('');
  const [memApiKey,setMemApiKey]=useState('');
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 settings.json에서 API Key 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.myAPI && window.myAPI.getSettings!=undefined){
          const settings = await window.myAPI.getSettings();
          if (settings) {
            if(settings.googleApiKey != undefined){
              setApiKey(settings.googleApiKey!);
            }
            if(settings.memApiKey != undefined){
              setMemApiKey(settings.memApiKey!);
            }
            console.log(`loadSettings:${JSON.stringify(settings)}`);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  //API Key 정보를 파일에 저장하기 위한 함수
  const handleSave = async () => {
    //공백 제거하고 변수에 저장
    const trimmedKey = apiKey.trim();
    const trimmedMemKey=memApiKey.trim();
    
    if (!trimmedKey && !trimmedMemKey) return;
    console.log(`trimmedKey:${trimmedKey}`);
    console.log(`trimmedMemKey:${trimmedMemKey}`);

    if (window.myAPI && window.myAPI.saveSettings!=undefined){
      //API Key를 파일에 저장하는 함수
      const result = await window.myAPI.saveSettings({ 
        googleApiKey: trimmedKey,
        memApiKey:trimmedMemKey
      });
      console.log(`result:${result}`);
      // Electron을 통해 파일 저장
      if (result.success) {
        console.log('Saved Google API Key to settings.json');
        // 여기에 "저장 완료" Toast 등을 띄울 수 있습니다.
      } else {
        console.error('Failed to save settings');
      }
    }
  };

  //저장된 API key 정보 전부 삭제 함수
  const clearKey = async () => {
    setApiKey('');
    setMemApiKey('');
    
    // settings.json에서 키 제거 (빈 값으로 업데이트)
    const result = await window.myAPI.saveSettings({ googleApiKey: '',memApiKey:'' });
    
    if (result.success) {
      console.log('API Keys removed from settings.json');
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className='flex h-screen w-full'>
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Key 설정</CardTitle>
              <CardDescription>API Key를 로컬 파일에 저장하여 사용합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="apiKey">Google API Key</Label>
                  <Input 
                    id="apiKey" 
                    type="password" // 보안상 가리기
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    placeholder="sk-..." 
                  />
                </div>
              </div>
            </CardContent>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="apiKey">Mem0 api Key</Label>
                  <Input 
                    type="password" // 보안상 가리기
                    value={memApiKey} 
                    onChange={(e) => setMemApiKey(e.target.value)} 
                    placeholder="sk-..." 
                  />
                </div>
              </div>

              <div className="flex justify-center mt-1.5">
                  <Button className='mr-10' onClick={handleSave} disabled={!memApiKey.trim()}>저장</Button>
                  <Button variant="secondary" onClick={clearKey}>전체 지우기</Button>
              </div>

            </CardContent>
          </Card>


        </div>
      </main>
    </div>
  );
};

export default Setting;