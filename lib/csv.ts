import type { Answer, Question, Response } from "@/lib/db/schema"

function cell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("; ") : value == null ? "" : String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export function toCsv(
  questions: Pick<Question, "id" | "prompt">[],
  responses: Pick<Response, "id" | "createdAt">[],
  answers: Pick<Answer, "responseId" | "questionId" | "value">[],
): string {
  const byResponse = new Map<number, Map<number, unknown>>()
  for (const a of answers) {
    const row = byResponse.get(a.responseId) ?? new Map()
    row.set(a.questionId, a.value)
    byResponse.set(a.responseId, row)
  }

  const header = ["Submitted", ...questions.map((q) => q.prompt)]
  const rows = responses.map((r) => {
    const row = byResponse.get(r.id)
    return [r.createdAt.toISOString(), ...questions.map((q) => row?.get(q.id))]
  })

  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n"
}
