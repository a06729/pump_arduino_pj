import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const motor = sqliteTable('motor', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  motorName: text('motor_name').notNull(), // 'motor1' 또는 'motor2'
  time: text('time') 
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  ml: integer('ml').notNull(),
});