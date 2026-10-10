import type { Answer, Question } from "@/lib/db/schema"
import { parseAnswer } from "@/lib/questions"

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

export type AnswerRow = Pick<Answer, "questionId" | "value">

function tally(labels: string[], picks: string[]): OptionStat[] {
  return labels.map((label) => ({ label, count: picks.filter((p) => p === label).length }))
}

export function computeStats(questions: Question[], answers: AnswerRow[]): QuestionStat[] {
  const byQuestion = new Map<number, unknown[]>()
  for (const a of answers) {
    const list = byQuestion.get(a.questionId) ?? []
    list.push(a.value)
    byQuestion.set(a.questionId, list)
  }

  return questions.map((q): QuestionStat => {
    const values = (byQuestion.get(q.id) ?? [])
      .map((raw) => parseAnswer(q, raw))
      .filter((v) => v !== null)

    if (q.kind === "single" || q.kind === "multi") {
      return {
        kind: q.kind,
        question: q,
        total: values.length,
        options: tally(q.options, values.flat() as string[]),
      }
    }

    if (q.kind === "rating") {
      const max = q.scaleMax ?? 5
      const nums = values as number[]
      const sum = nums.reduce((acc, n) => acc + n, 0)
      return {
        kind: "rating",
        question: q,
        total: nums.length,
        average: nums.length ? Math.round((sum / nums.length) * 10) / 10 : 0,
        max,
        buckets: tally(
          Array.from({ length: max }, (_, i) => String(i + 1)),
          nums.map(String),
        ),
      }
    }

    return { kind: "text", question: q, total: values.length, samples: values as string[] }
  })
}
