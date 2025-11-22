import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema/schema";
import { getDatabasePath } from "./config";
import fs from "fs";
import path from "path";

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

export function initDatabase() {
  try {
    const dbPath = getDatabasePath();
    
    // 디렉토리 확인 및 생성
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log("📁 Created database directory:", dbDir);
    }
    
    console.log("📊 Initializing database at:", dbPath);
    
    sqlite = new Database(dbPath);
    
    // 설정
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
    sqlite.pragma("foreign_keys = ON");

    // 테이블 생성
    const createMotorTable = `
      CREATE TABLE IF NOT EXISTS motor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        motorName TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ml INTEGER NOT NULL
      );
    `;

    sqlite.exec(createMotorTable);

    // Drizzle 인스턴스 생성
    db = drizzle(sqlite, { schema });

    // 테이블 확인
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    
    console.log("📋 Tables:", tables.map((t: any) => t.name).join(", "));
    console.log("✅ Database initialized successfully");

    return { db, sqlite };
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

export function getDatabase() {
  if (!db || !sqlite) {
    return initDatabase();
  }
  return { db, sqlite };
}

export { db, sqlite };