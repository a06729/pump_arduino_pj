import { app } from "electron";
import path from "path";
import fs from "fs";

export function getDatabasePath(): string {
  // app이 ready 상태인지 확인
  const isDev = process.env.NODE_ENV === "development" || 
                process.env.VITE_DEV_SERVER_URL !== undefined;

  let dbPath: string;

  if (isDev) {
    // 개발 환경: 프로젝트 루트/data
    dbPath = path.join(process.cwd(), "data", "database.db");
  } else {
    // 프로덕션: userData 폴더 또는 리소스 폴더
    try {
      const userDataPath = app.getPath("userData");
      dbPath = path.join(userDataPath, "database.db");
    } catch (error) {
      // app이 준비되지 않은 경우
      dbPath = path.join(process.cwd(), "data", "database.db");
    }
  }

  // 디렉토리 생성
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Created database directory:", dir);
  }

  console.log(`📊 Database path: ${dbPath}`);
  
  return dbPath;
}

