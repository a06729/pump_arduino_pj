import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import MemoryClient from 'mem0ai';

let memoryClient:MemoryClient;

/**
 * 메시지 인터페이스
 * @property {string} role - 메시지 역할 (사용자 또는 AI)
 * @property {string} content - 메시지 내용
 * @property {Date} timestamp - 메시지 생성 시간
 * @property {boolean} isStreaming - 스트리밍 중인지 여부 (선택)
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean; // 스트리밍 중인지 표시
}

const AIChatbot: React.FC = () => {
  //google 제미나이 API key State
  const [apiKey,setApiKey]=useState<string>('');

  /** 대화 메시지 목록 */
  const [messages, setMessages] = useState<Message[]>([]);

  /** 사용자 입력 텍스트 */
  const [input, setInput] = useState('');

  /** AI 응답 로딩 상태 */
  const [isLoading, setIsLoading] = useState(false);

  /** 메시지 목록 스크롤 참조 */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** 스트림 중단을 위한 AbortController 참조 */
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 메시지 목록의 맨 아래로 스크롤
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * 메시지가 추가될 때마다 자동 스크롤
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 컴포넌트 언마운트 시 진행 중인 스트림 중단
   * 메모리 누수 방지
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    //API 키 정보 불러오는 함수
    const loadSettings = async () => {
      try {
        if (window.myAPI && window.myAPI.getSettings!=undefined){
          //PC에 저장된 API Key 파일 정보를 읽어서 Json 문자열로 가져오는 함수
          const settings = await window.myAPI.getSettings();
          if (settings) {
            console.log(`loadSettings:${JSON.stringify(settings)}`);
            if(settings.googleApiKey!=undefined){
              setApiKey(settings.googleApiKey);
            }
            if(settings.memApiKey!=undefined){
              //mem0의 API 서비스를 사용하기 위한 Client 변수
              memoryClient=new MemoryClient({ apiKey: settings.memApiKey });
            }

          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // ============================================
  // 메시지 전송 함수 (스트리밍 방식)
  // ============================================

  /**
   * 사용자 메시지를 전송하고 AI 응답을 스트리밍으로 받아옴
   * 
   * 처리 순서:
   * 1. 사용자 메시지를 messages 배열에 추가
   * 2. 로딩 상태 시작 (assistant 메시지는 아직 추가하지 않음)
   * 3. Google AI API에 스트리밍 요청
   * 4. 첫 청크가 도착하면 로딩 종료 및 assistant 메시지 생성
   * 5. 청크 단위로 받은 텍스트를 throttling하여 타이핑 효과로 업데이트
   * 6. 스트리밍 완료 후 isStreaming 플래그 제거
   */
const sendMessageStream = async () => {
    // 1. 입력값 검증
    if (!input.trim() || isLoading) return;

    // 2. 사용자 메시지 UI에 추가
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input; 
    setInput(''); 
    setIsLoading(true); 

    try {
      abortControllerRef.current = new AbortController();
      const ai = new GoogleGenAI({ apiKey });
      let retrievedContext = "";
      
      console.log("1. mem0 검색 시작..."); // 디버깅용 로그

      try {
        // [중요] 여기서 await가 풀릴 때까지 다음 줄로 넘어가지 않습니다.
        const searchResults = await memoryClient.search(currentInput, { 
          user_id: "j2m", 
        });

        console.log("2. mem0 검색 완료:", searchResults); // 결과 확인

        if (searchResults && searchResults.length > 0) {
          const memories = searchResults.map((item: any) => `- ${item.memory}`).join('\n');
          retrievedContext = `\n[기억된 관련 정보(Context)]\n${memories}\n(위 정보는 사용자와의 과거 대화에서 기억한 내용입니다. 답변에 참고하세요.)\n`;
        }
      } catch (memError) {
        console.warn("3. 메모리 검색 실패 (무시하고 진행):", memError);
      }

      // 프롬프트 구성 (반드시 검색 후 실행)
      const conversationHistory = messages
        .map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
        .join('\n');

      const prompt = `당신은 AI 어시스턴트입니다. 사용자의 질문에 친절하고 정확하게 답변해주세요.
                      ${retrievedContext}
                      이전 대화:${conversationHistory}
                      사용자: ${currentInput}
                      AI:`;

      console.log("4. AI 요청 시작"); // 시점 확인용

      //스트리밍 AI 응답 요청
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

     
      // 변수 초기화
      let fullText = ''; 
      let displayedText = ''; 
      let assistantMessageAdded = false; 
      let assistantMessageIndex = -1; 
      const typingSpeed = 30; 

      //스트림 데이터 수신
      const streamPromise = (async () => {
        for await (const chunk of stream) {
          if (abortControllerRef.current?.signal.aborted) break;

          const chunkText = chunk.text || '';
          fullText += chunkText;

          if (!assistantMessageAdded) {
            setIsLoading(false); // 첫 데이터가 와야 로딩이 끝남
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages.push({
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
              });
              return newMessages;
            });
            assistantMessageIndex = messages.length + 1; 
            assistantMessageAdded = true;
          }
        }
      })();

      
      // 타이핑 효과
      const typingInterval = setInterval(() => {
        if (abortControllerRef.current?.signal.aborted) {
          clearInterval(typingInterval);
          return;
        }

        if (displayedText.length < fullText.length) {
          displayedText = fullText.slice(0, displayedText.length + 1);

          if (assistantMessageAdded) {
            setMessages(prev => {
              const newMessages = [...prev];
              const targetIndex = newMessages.length - 1;
              
              if (targetIndex >= 0 && newMessages[targetIndex].role === 'assistant') {
                 newMessages[targetIndex] = {
                  ...newMessages[targetIndex],
                  content: displayedText,
                  isStreaming: true,
                };
              }
              return newMessages;
            });
          }
        }
      }, typingSpeed);

      await streamPromise;

      // mem0에 대화 내용 저장     
      if (fullText) {
        const messagesToSave = [
          { role: "user", content: currentInput },
          { role: "assistant", content: fullText }
        ];

        memoryClient.add(messagesToSave, { user_id: "j2m" })
          .then(() => console.log("Memory saved"))
          .catch((err) => console.error("Memory save failed:", err));
      }

      // 잔여 타이핑 처리 및 종료
      const finishTyping = setInterval(() => {
        if (displayedText.length < fullText.length) {
          displayedText = fullText.slice(0, displayedText.length + 1);

          if (assistantMessageAdded) {
            setMessages(prev => {
              const newMessages = [...prev];
              const targetIndex = newMessages.length - 1;
              if (targetIndex >= 0) {
                 newMessages[targetIndex] = {
                  ...newMessages[targetIndex],
                  content: displayedText,
                };
              }
              return newMessages;
            });
          }
        } else {
          clearInterval(typingInterval);
          clearInterval(finishTyping);

          if (assistantMessageAdded) {
            setMessages(prev => {
              const newMessages = [...prev];
              const targetIndex = newMessages.length - 1;
              if (targetIndex >= 0) {
                newMessages[targetIndex] = {
                  ...newMessages[targetIndex],
                  content: fullText || '응답을 생성할 수 없습니다.',
                  isStreaming: false,
                };
              }
              return newMessages;
            });
          }
        }
      }, typingSpeed);

    } catch (error) {
      console.error('AI 응답 오류:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 응답 중 오류가 발생했습니다.',
        timestamp: new Date(),
        isStreaming: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      if (!messages.some(m => m.isStreaming)) {
          setIsLoading(false);
      }
      abortControllerRef.current = null;
    }
  };



  // ============================================
  // 비스트리밍 - 미사용
  // ============================================
  const sendMessage = async () => {
    // 입력값 검증
    if (!input.trim() || isLoading) return;

    // 사용자 메시지 생성 및 추가
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Google AI 클라이언트 초기화
      const ai = new GoogleGenAI({ apiKey });

      // 프롬프트 구성
      const conversationHistory = messages
        .map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
        .join('\n');

      const prompt = `당신은 AI 어시스턴트입니다. 사용자의 질문에 친절하고 정확하게 답변해주세요.\n\n이전 대화:\n${conversationHistory}\n\n사용자: ${input}\n\nAI:`;

      // 비스트리밍 방식으로 요청 (한 번에 전체 응답 받음)
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      // 응답 텍스트 추출
      const text = response.text || '응답을 생성할 수 없습니다.';

      // Assistant 메시지 추가
      const assistantMessage: Message = {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI 응답 오류:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 응답 중 오류가 발생했습니다. API 키를 확인해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 이벤트 핸들러
  // ============================================

  /**
   * Enter 키로 메시지 전송
   * Shift+Enter는 줄바꿈
   * @param {React.KeyboardEvent} e - 키보드 이벤트
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageStream();
    }
  };

  // ============================================
  // 렌더링
  // ============================================

  return (
    <Card className="h-[800px] flex flex-col overflow-hidden">
      {/* ============================================ */}
      {/* 헤더 영역 */}
      {/* ============================================ */}
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI 어시스턴트
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* ============================================ */}
        {/* 메시지 목록 영역 */}
        {/* ============================================ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 메시지가 없을 때 표시되는 안내 문구 */}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              무엇이든 질문해보세요!
            </div>
          )}

          {/* 메시지 목록 렌더링 */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {/* AI 메시지의 경우 왼쪽에 아이콘 표시 */}
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}

              {/* 메시지 내용 */}
              <div
                className={`max-w-[calc(100%-3rem)] rounded-lg px-4 py-2 break-words ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                  }`}
              >
                {/* 메시지 텍스트 */}
                <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {message.content || '(내용 없음)'}
                  {/* 스트리밍 중일 때 깜빡이는 커서 표시 */}
                  {message.isStreaming && (
                    <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </p>
                {/* 메시지 시간 */}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* 사용자 메시지의 경우 오른쪽에 아이콘 표시 */}
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* 로딩 중 표시 (스트리밍 시작 전) */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  {/* 점 3개가 순차적으로 튀는 애니메이션 */}
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          {/* 스크롤 자동 이동을 위한 더미 요소 */}
          <div ref={messagesEndRef} />
        </div>

        {/* ============================================ */}
        {/* 메시지 입력 영역 */}
        {/* ============================================ */}
        <div className="border-t p-4 shrink-0">
          <div className="flex gap-2">
            {/* 텍스트 입력 필드 */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1"
            />
            {/* 전송 버튼 */}
            <Button
              onClick={sendMessageStream}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatbot;