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


const Setting: React.FC<SettingProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 settings.json에서 API Key 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.myAPI && window.myAPI.getSettings!=undefined){
          const settings = await window.myAPI.getSettings();
          if (settings && settings.googleApiKey) {
            console.log(`loadSettings:${JSON.stringify(settings)}`);
            setApiKey(settings.googleApiKey);
            onApiKeyChange?.(settings.googleApiKey); // 앱 전역 상태 업데이트
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [onApiKeyChange]);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return;
    console.log(`trimmedKey:${trimmedKey}`);

    if (window.myAPI && window.myAPI.saveSettings!=undefined){
      const result = await window.myAPI.saveSettings({ googleApiKey: trimmedKey });
      console.log(`result:${result}`);
      // Electron을 통해 파일 저장
      if (result.success) {
        onApiKeyChange?.(trimmedKey);
        console.log('Saved Google API Key to settings.json');
        // 여기에 "저장 완료" Toast 등을 띄울 수 있습니다.
      } else {
        console.error('Failed to save settings');
      }
    }


  };

  const clearKey = async () => {
    setApiKey('');
    
    // settings.json에서 키 제거 (빈 값으로 업데이트)
    
    const result = await window.myAPI.saveSettings({ googleApiKey: '' });
    
    if (result.success) {
      onApiKeyChange?.('');
      console.log('Google API Key removed from settings.json');
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
              <CardTitle>Google API Key</CardTitle>
              <CardDescription>Google GenAI API Key를 로컬 파일에 저장하여 사용합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input 
                    id="apiKey" 
                    type="password" // 보안상 가리기
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    placeholder="sk-..." 
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={!apiKey.trim()}>저장</Button>
                  <Button variant="secondary" onClick={clearKey}>지우기</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Setting;