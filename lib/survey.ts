import { db } from "@/lib/db"
import { answers, questions, responses, survey } from "@/lib/db/schema"
import { computeStats } from "@/lib/stats"
import { asc, count, desc } from "drizzle-orm"

export const publicResults = process.env.PUBLIC_RESULTS === "1"

export function getQuestions() {
  return db.select().from(questions).orderBy(asc(questions.position), asc(questions.id))
}

export async function getTitle() {
  const [row] = await db.select({ title: survey.title }).from(survey)
  return row?.title ?? ""
}

export async function getResponseCount() {
  const [{ n }] = await db.select({ n: count() }).from(responses)
  return n
}

export async function getStats() {
  const [qs, rows] = await Promise.all([
    getQuestions(),
    db
      .select({ questionId: answers.questionId, value: answers.value })
      .from(answers)
      .orderBy(desc(answers.createdAt), desc(answers.id)),
  ])
  return computeStats(qs, rows)
}

export async function getPublicStats() {
  return (await getStats()).filter((s) => s.kind !== "text")
}
