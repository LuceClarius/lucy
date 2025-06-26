import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const executions = pgTable("executions", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull(),
  status: text("status").notNull(), // 'success', 'error', 'running'
  output: text("output"),
  error: text("error"),
  duration: integer("duration"), // in milliseconds
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  scriptId: integer("script_id").notNull(),
  frequency: text("frequency").notNull(), // 'hourly', '6hourly', 'daily', 'weekly', 'monthly'
  startTime: timestamp("start_time").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScriptSchema = createInsertSchema(scripts).pick({
  name: true,
  content: true,
});

export const insertExecutionSchema = createInsertSchema(executions).pick({
  scriptId: true,
  status: true,
  output: true,
  error: true,
  duration: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  scriptId: true,
  frequency: true,
  startTime: true,
  enabled: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Script = typeof scripts.$inferSelect;
export type InsertScript = z.infer<typeof insertScriptSchema>;

export type Execution = typeof executions.$inferSelect;
export type InsertExecution = z.infer<typeof insertExecutionSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
