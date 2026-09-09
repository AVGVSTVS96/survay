"use server"

import { db } from "@/lib/db"
import { answers, questions, responses, type AnswerValue } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function getPublicQuestions() {
  return db.select().from(questions).orderBy(asc(questions.position), asc(questions.id))
}

type SubmitPayload = Record<number, AnswerValue>

export async function submitSurvey(payload: SubmitPayload) {
  const all = await db.select().from(questions)
  const byId = new Map(all.map((q) => [q.id, q]))

  // Server-side validation: required questions must have a non-empty answer.
  for (const q of all) {
    if (!q.required) continue
    const v = payload[q.id]
    const empty =
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0)
    if (empty) {
      return { ok: false as const, error: "Please answer all required questions." }
    }
  }

  const rows = Object.entries(payload)
    .map(([qid, value]) => ({ questionId: Number(qid), value }))
    .filter((r) => byId.has(r.questionId))
    .filter((r) => {
      const v = r.value
      if (v === undefined || v === null) return false
      if (typeof v === "string" && v.trim() === "") return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    })

  const [response] = await db.insert(responses).values({}).returning()
  if (rows.length > 0) {
    await db.insert(answers).values(
      rows.map((r) => ({
        responseId: response.id,
        questionId: r.questionId,
        value: r.value,
      })),
    )
  }

  return { ok: true as const }
}
