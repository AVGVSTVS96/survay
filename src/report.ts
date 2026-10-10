import { KIND_LABELS } from "./questions.ts";
import type { QuestionStat } from "./stats.ts";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function bars(rows: { label: string; count: number }[], total: number, width: number) {
  return rows.map(({ label, count }) => {
    const share = total === 0 ? 0 : count / total;
    const filled = Math.round(share * 20);
    return `  ${label.padEnd(width)}  ${"█".repeat(filled)}${"░".repeat(20 - filled)}  ${String(count).padStart(3)}  ${String(Math.round(share * 100)).padStart(3)}%`;
  });
}

export function report(title: string, responses: number, stats: QuestionStat[]) {
  const sections = stats.map((s) => {
    const head = `${s.question.prompt}\n  ${KIND_LABELS[s.kind]} · ${plural(s.total, "answer")}`;
    switch (s.kind) {
      case "single":
      case "multi":
        return [head, ...bars(s.options, s.total, Math.max(...s.options.map((o) => o.label.length)))].join(
          "\n",
        );
      case "rating":
        return [head, `  ${s.average || "–"} average of ${s.max}`, ...bars(s.buckets, s.total, 2)].join("\n");
      case "text":
        return [head, ...s.samples.slice(0, 5).map((t) => `  “${t.replaceAll(/\s+/g, " ")}”`)].join("\n");
    }
  });

  return [`${title || "survay"} · ${plural(responses, "response")}`, ...sections].join("\n\n");
}
