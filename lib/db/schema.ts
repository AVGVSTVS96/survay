import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export type QuestionKind = "single" | "multi" | "text" | "rating"

export type AnswerValue = string | string[] | number

export const survey = pgTable(
  "survey",
  {
    id: integer("id").primaryKey().default(1),
    title: text("title").notNull().default(""),
  },
  (t) => [check("survey_single_row", sql`${t.id} = 1`)],
)

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  kind: text("kind").$type<QuestionKind>().notNull(),
  prompt: text("prompt").notNull(),
  description: text("description"),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  scaleMax: integer("scale_max"),
  multiline: boolean("multiline").notNull().default(true),
  required: boolean("required").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const answers = pgTable(
  "answers",
  {
    id: serial("id").primaryKey(),
    responseId: integer("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    value: jsonb("value").$type<AnswerValue>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("answers_response_id_idx").on(t.responseId), index("answers_question_id_idx").on(t.questionId)],
)

export type Question = typeof questions.$inferSelect
export type Answer = typeof answers.$inferSelect
export type Response = typeof responses.$inferSelect
