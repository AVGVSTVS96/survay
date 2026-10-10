import type { Question } from "./questions.ts";

export type ResponseRow = { id: number; createdAt: string; answers: Map<number, unknown> };

function cell(value: unknown): string {
  const text = Array.isArray(value)
    ? value.join("; ")
    : typeof value === "string" || typeof value === "number"
      ? String(value)
      : "";
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(questions: Pick<Question, "id" | "prompt">[], responses: ResponseRow[]): string {
  const header = ["Submitted", ...questions.map((q) => q.prompt)];
  const rows = responses.map((r) => [r.createdAt, ...questions.map((q) => r.answers.get(q.id))]);
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
