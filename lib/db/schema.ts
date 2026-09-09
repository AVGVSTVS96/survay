import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export type QuestionKind = "single" | "multi" | "text" | "rating"

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  description: text("description"),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  scaleMax: integer("scale_max"),
  required: boolean("required").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  responseId: integer("response_id").notNull(),
  questionId: integer("question_id").notNull(),
  value: jsonb("value").$type<AnswerValue>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type AnswerValue = string | string[] | number

export type Question = typeof questions.$inferSelect
export type Answer = typeof answers.$inferSelect
export type Response = typeof responses.$inferSelect
