"use server"

import { db } from "@/lib/db"
import { answers, responses } from "@/lib/db/schema"
import { parseAnswer } from "@/lib/questions"
import type { QuestionStat } from "@/lib/stats"
import { getPublicStats, getQuestions, publicResults } from "@/lib/survey"

export type Submission = {
  shown: number[]
  answers: Record<number, unknown>
  website?: string
}

export type SubmitResult =
  | { ok: true; results: QuestionStat[] | null }
  | { ok: false; error: string }

export async function submitSurvey(submission: Submission): Promise<SubmitResult> {
  const ids = new Set(Array.isArray(submission?.shown) ? submission.shown : [])
  const given: Record<number, unknown> = submission?.answers ?? {}
  const shown = (await getQuestions()).filter((q) => ids.has(q.id))
  const parsed = shown.map((q) => ({ q, value: parseAnswer(q, given[q.id]) }))

  if (parsed.some(({ q, value }) => q.required && value === null)) {
    return { ok: false, error: "This survey just changed. Please check your answers." }
  }

  if (!submission?.website && parsed.length > 0) {
    await db.transaction(async (tx) => {
      const [response] = await tx.insert(responses).values({}).returning({ id: responses.id })
      const rows = parsed.flatMap(({ q, value }) =>
        value === null ? [] : [{ responseId: response.id, questionId: q.id, value }],
      )
      if (rows.length > 0) await tx.insert(answers).values(rows)
    })
  }

  return { ok: true, results: publicResults ? await getPublicStats() : null }
}
