import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const playbooks = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  playbookId: integer("playbook_id").notNull(),
  assignedTo: integer("assigned_to").notNull(),
  status: text("status").notNull(), // planned, running, done, failed, archived
  startTime: timestamp("start_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlaybookSchema = createInsertSchema(playbooks).pick({
  name: true,
  description: true,
  content: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  playbookId: true,
  assignedTo: true,
  status: true,
  startTime: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Playbook = typeof playbooks.$inferSelect;
export type Job = typeof jobs.$inferSelect;