export type Kind = "single" | "multi" | "rating" | "text";

export type Value = string | string[] | number;

export type Question = {
  id: number;
  kind: Kind;
  prompt: string;
  description: string | null;
  options: string[];
  scaleMax: number | null;
  multiline: boolean;
  required: boolean;
};

export type QuestionInput = Omit<Question, "id">;

export const KINDS: Kind[] = ["single", "multi", "rating", "text"];

export const KIND_LABELS: Record<Kind, string> = {
  single: "Multiple choice",
  multi: "Checkboxes",
  rating: "Rating",
  text: "Text",
};

export const TEXT_LIMIT = 5000;

export const TITLE_LIMIT = 200;

export const hasOptions = (kind: Kind) => kind === "single" || kind === "multi";

export const uniqueOptions = (options: string[]) => [
  ...new Set(options.map((o) => o.trim()).filter(Boolean)),
];

export function parseAnswer(
  question: Pick<Question, "kind" | "options" | "scaleMax">,
  raw: unknown,
): Value | null {
  switch (question.kind) {
    case "single":
      return typeof raw === "string" && question.options.includes(raw) ? raw : null;
    case "multi": {
      if (!Array.isArray(raw)) return null;
      const picked = question.options.filter((o) => raw.includes(o));
      return picked.length > 0 ? picked : null;
    }
    case "rating":
      return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= (question.scaleMax ?? 5)
        ? raw
        : null;
    case "text":
      return typeof raw === "string" ? raw.trim().slice(0, TEXT_LIMIT) || null : null;
  }
}

const text = (raw: unknown) => (typeof raw === "string" ? raw.trim() : "");

export function parseQuestion(raw: unknown): QuestionInput | string {
  const input = (raw ?? {}) as Partial<Record<keyof QuestionInput, unknown>>;
  const kind = KINDS.find((k) => k === input.kind);
  if (!kind) return "Pick a question type.";
  const prompt = text(input.prompt);
  if (!prompt) return "Write the question first.";
  const options =
    hasOptions(kind) && Array.isArray(input.options) ? uniqueOptions(input.options.map(text)) : [];
  if (hasOptions(kind) && options.length < 2) return "Add at least two different options.";
  return {
    kind,
    prompt,
    description: text(input.description) || null,
    options,
    scaleMax: kind === "rating" ? (input.scaleMax === 10 ? 10 : 5) : null,
    multiline: kind === "text" ? input.multiline !== false : true,
    required: input.required === true,
  };
}
