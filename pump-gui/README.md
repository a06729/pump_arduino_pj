# Windows 11 better-sqlite3 빌드 버그

better_sqlite3 라이브러리 파일에서  better_sqlite3.cpp를 열어서

NODE_MODULE_INIT(/* exports, context */) {
//	v8::Isolate* isolate = context->GetIsolate();
	v8::Isolate* isolate = v8::Isolate::GetCurrent();

이 값으로 수정이 필요
https://github.com/WiseLibs/better-sqlite3/issues/1401

# visual studio toll 설치 명령어
choco install python visualstudio2022-workload-vctools -y