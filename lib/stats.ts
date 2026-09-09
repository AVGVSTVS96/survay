import type { Answer, Question } from "@/lib/db/schema"

export type OptionStat = { label: string; count: number }

export type QuestionStat =
  | {
      kind: "single" | "multi"
      question: Question
      total: number
      options: OptionStat[]
    }
  | {
      kind: "rating"
      question: Question
      total: number
      average: number
      max: number
      buckets: OptionStat[]
    }
  | {
      kind: "text"
      question: Question
      total: number
      samples: string[]
    }

export function computeStats(questions: Question[], answers: Answer[]): QuestionStat[] {
  const byQuestion = new Map<number, Answer[]>()
  for (const a of answers) {
    const list = byQuestion.get(a.questionId) ?? []
    list.push(a)
    byQuestion.set(a.questionId, list)
  }

  return questions.map((q) => {
    const list = byQuestion.get(q.id) ?? []

    if (q.kind === "single" || q.kind === "multi") {
      const counts = new Map<string, number>()
      for (const opt of q.options) counts.set(opt, 0)
      for (const a of list) {
        const v = a.value
        if (Array.isArray(v)) {
          for (const item of v) counts.set(item, (counts.get(item) ?? 0) + 1)
        } else if (typeof v === "string") {
          counts.set(v, (counts.get(v) ?? 0) + 1)
        }
      }
      return {
        kind: q.kind,
        question: q,
        total: list.length,
        options: q.options.map((label) => ({ label, count: counts.get(label) ?? 0 })),
      }
    }

    if (q.kind === "rating") {
      const max = q.scaleMax ?? 5
      const nums = list
        .map((a) => (typeof a.value === "number" ? a.value : Number(a.value)))
        .filter((n) => !Number.isNaN(n))
      const sum = nums.reduce((acc, n) => acc + n, 0)
      const buckets: OptionStat[] = Array.from({ length: max }, (_, i) => ({
        label: String(i + 1),
        count: nums.filter((n) => n === i + 1).length,
      }))
      return {
        kind: "rating",
        question: q,
        total: nums.length,
        average: nums.length ? Math.round((sum / nums.length) * 10) / 10 : 0,
        max,
        buckets,
      }
    }

    const samples = list
      .map((a) => (typeof a.value === "string" ? a.value : String(a.value)))
      .filter((s) => s.trim().length > 0)
    return { kind: "text", question: q, total: samples.length, samples }
  })
}
