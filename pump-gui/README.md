# 개발 환경 설정 및 트러블슈팅 가이드

이 문서는 프로젝트 구동을 위한 필수 설치 도구, 환경 변수 설정, 그리고 Windows 11 환경에서의 `better-sqlite3` 빌드 이슈 해결 방법을 다룹니다.

## 📦 1. 필수 빌드 도구 설치 (Prerequisites)

Windows 환경에서 네이티브 모듈 빌드를 위해 **Python**과 **Visual Studio C++ Build Tools**가 필요합니다.
PowerShell을 **관리자 권한**으로 실행한 후 아래 명령어를 입력하세요.

```powershell
choco install python visualstudio2022-workload-vctools -y

# GitHub Classic Token (Repo 권한 필요)
# .env 작성필요
GH_TOKEN=<여기에_토큰을_입력하세요>


## 🐛 2. 트러블슈팅 (Windows 11)

### `better-sqlite3` 빌드 오류 수정

Windows 11 환경에서 `better-sqlite3` 빌드 시 오류가 발생한다면, 라이브러리 소스 코드를 직접 패치해야 합니다.

* **관련 GitHub 이슈**: [GitHub Issue #1401](https://github.com/WiseLibs/better-sqlite3/issues/1401) 

* **대상 파일**: `node_modules/better-sqlite3/src/better_sqlite3.cpp`

// 수정 전 (Original)
NODE_MODULE_INIT(/* exports, context */) {
    v8::Isolate* isolate = context->GetIsolate(); 
    // ...
}

// 수정 후 (Fixed)
NODE_MODULE_INIT(/* exports, context */) {
    // v8::Isolate* isolate = context->GetIsolate();
    v8::Isolate* isolate = v8::Isolate::GetCurrent(); // 이 코드로 변경
    // ...
}

