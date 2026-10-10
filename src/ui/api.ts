import { parseQuestion, TITLE_LIMIT, type Question } from "../questions.ts";
import { computeStats, type AnswerRow, type QuestionStat } from "../stats.ts";
import type { Change, Survey } from "../store.ts";

export type Snapshot = { survey: Survey; stats: QuestionStat[] };

export type Api = {
  change: (change: Change) => Promise<Snapshot | { error: string }>;
  refresh: () => Promise<Snapshot | null>;
};

export const server: Api = {
  async change(change) {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change),
      });
      if (res.status === 401) location.reload();
      return (await res.json()) as Snapshot | { error: string };
    } catch {
      return { error: "Couldn't reach the server. Check your connection and try again." };
    }
  },
  async refresh() {
    const res = await fetch("/api/admin").catch(() => null);
    return res?.ok ? ((await res.json()) as Snapshot) : null;
  },
};

export function sandbox(start: Snapshot, answers: AnswerRow[]): Api {
  let { title, questions, responses } = start.survey;
  let next = Math.max(0, ...questions.map((q) => q.id)) + 1;

  const snapshot = (): Snapshot => ({
    survey: { title, questions, responses },
    stats: computeStats(questions, answers),
  });

  const apply = (change: Change): string | null => {
    switch (change.type) {
      case "title":
        title = change.title.trim().slice(0, TITLE_LIMIT);
        return null;
      case "add": {
        const q = parseQuestion(change.question);
        if (typeof q === "string") return q;
        questions = [...questions, { ...q, id: next++ }];
        return null;
      }
      case "edit": {
        const q = parseQuestion(change.question);
        if (typeof q === "string") return q;
        const existing = questions.find((x) => x.id === change.id);
        if (!existing) return "This question was already deleted.";
        if (existing.kind !== q.kind && answers.some((a) => a.questionId === change.id))
          return "This question already has answers, so its type can't change.";
        questions = questions.map((x): Question => (x.id === change.id ? { ...q, id: x.id } : x));
        return null;
      }
      case "delete":
        questions = questions.filter((x) => x.id !== change.id);
        return null;
      case "order":
        questions = change.ids.flatMap((id) => questions.filter((x) => x.id === id));
        return null;
    }
  };

  return {
    change: async (change) => {
      const error = apply(change);
      return error ? { error } : snapshot();
    },
    refresh: async () => snapshot(),
  };
}
