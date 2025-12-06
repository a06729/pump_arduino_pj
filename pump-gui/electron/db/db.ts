import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema/schema";
import { getDatabasePath } from "./config";
import fs from "fs";
import path from "path";

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

//데이터 베이스 초기화
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
    
    // 데이터 베이스 설정
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
    sqlite.pragma("foreign_keys = ON");

    // 테이블 생성
    const createMotorTable = `
      CREATE TABLE IF NOT EXISTS motor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        motor_name TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ml INTEGER NOT NULL
      );`;

    const dumyData=`
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-22 02:33:52', 100);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-22 02:34:05', 100);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-22 02:36:37', 100);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-11-22 02:36:44', 100);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-11-22 02:36:54', 400);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-22 04:22:12', 120);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-11-22 04:22:15', 145);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-22 13:10:00', 50);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-11-22 15:30:00', 200);

      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-17 09:00:00', 150); 
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-11-18 10:30:00', 220); 
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-19 14:15:00', 300); 
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-11-20 11:00:00', 180);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-11-21 16:45:00', 250);

      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-01-15 09:00:00', 1200);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-02-20 10:00:00', 800);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-03-10 12:00:00', 950);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-04-05 14:00:00', 1100);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-05-01 08:00:00', 1500);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-06-15 16:00:00', 1300);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-07-20 11:00:00', 2000);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-08-15 13:00:00', 2100);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2025-09-10 09:30:00', 1400);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2025-10-05 15:45:00', 1250);

      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2024-05-20 12:00:00', 500);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor2', '2024-08-15 14:00:00', 700);
      INSERT INTO motor (motor_name, time, ml) VALUES ('motor1', '2024-12-25 09:00:00', 300);
    `
    //테이블 생성 sql 실행
    sqlite.exec(createMotorTable);
    
    //더미 데이터 추가 sql 실행
    sqlite.exec(dumyData);


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
//데이터 베이스 접속 생성자 생성하는 함수
export function getDatabase() {
  if (!db || !sqlite) {
    return initDatabase();
  }
  return { db, sqlite };
}

export { db, sqlite };