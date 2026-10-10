import type { AnswerValue, Question, QuestionKind } from "@/lib/db/schema"

export const KINDS: QuestionKind[] = ["single", "multi", "rating", "text"]

export const KIND_LABELS: Record<QuestionKind, string> = {
  single: "Multiple choice",
  multi: "Checkboxes",
  text: "Text",
  rating: "Rating",
}

export const TEXT_LIMIT = 5000

export function hasOptions(kind: QuestionKind) {
  return kind === "single" || kind === "multi"
}

type Shape = Pick<Question, "kind" | "options" | "scaleMax">

export function parseAnswer(question: Shape, raw: unknown): AnswerValue | null {
  switch (question.kind) {
    case "single":
      return typeof raw === "string" && question.options.includes(raw) ? raw : null
    case "multi": {
      if (!Array.isArray(raw)) return null
      const picked = question.options.filter((o) => raw.includes(o))
      return picked.length > 0 ? picked : null
    }
    case "rating":
      return Number.isInteger(raw) && (raw as number) >= 1 && (raw as number) <= (question.scaleMax ?? 5)
        ? (raw as number)
        : null
    case "text": {
      if (typeof raw !== "string") return null
      return raw.trim().slice(0, TEXT_LIMIT) || null
    }
    default:
      return null
  }
}
