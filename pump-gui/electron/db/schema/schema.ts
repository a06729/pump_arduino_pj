import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm'; // sql 함수를 import 합니다.

export const motor = sqliteTable('motor', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  time: text('time') 
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  ml: integer('ml').notNull(),
});