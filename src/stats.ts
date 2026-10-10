import { parseAnswer, type Question } from "./questions.ts";

export type Tally = { label: string; count: number };

export type QuestionStat =
  | { kind: "single" | "multi"; question: Question; total: number; options: Tally[] }
  | { kind: "rating"; question: Question; total: number; average: number; max: number; buckets: Tally[] }
  | { kind: "text"; question: Question; total: number; samples: string[] };

export type AnswerRow = { questionId: number; value: unknown };

const tally = (labels: string[], picks: string[]): Tally[] =>
  labels.map((label) => ({ label, count: picks.filter((p) => p === label).length }));

export function computeStats(questions: Question[], answers: AnswerRow[]): QuestionStat[] {
  const byQuestion = Map.groupBy(answers, (a) => a.questionId);

  return questions.map((q): QuestionStat => {
    const values = (byQuestion.get(q.id) ?? []).map((a) => parseAnswer(q, a.value)).filter((v) => v !== null);

    switch (q.kind) {
      case "single":
      case "multi":
        return {
          kind: q.kind,
          question: q,
          total: values.length,
          options: tally(q.options, values.flat() as string[]),
        };
      case "rating": {
        const max = q.scaleMax ?? 5;
        const nums = values as number[];
        const sum = nums.reduce((acc, n) => acc + n, 0);
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
        };
      }
      case "text":
        return { kind: "text", question: q, total: values.length, samples: values as string[] };
    }
  });
}

export const withoutText = (stats: QuestionStat[]): QuestionStat[] =>
  stats.map((s) => (s.kind === "text" ? { ...s, samples: [] } : s));
