#!/usr/bin/env bun
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";

import { password } from "./auth.ts";
import { toCsv } from "./csv.ts";
import { KIND_LABELS } from "./questions.ts";
import { computeStats, type QuestionStat } from "./stats.ts";
import { open } from "./store.ts";

const usage = `survay: one survey, one question at a time

  survay               start the survey (same as survay serve)
  survay serve         --port n, or PORT; 3000 by default
  survay results       how everyone answered, in the terminal
  survay export        every response as CSV, to stdout
  survay password      the dashboard password

  --json               machine-readable results

  answers live in data/survay.db (SURVAY_DATA moves the folder)`;

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const data = process.env["SURVAY_DATA"] ?? `${root}/data`;
mkdirSync(data, { recursive: true });

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: "string" },
    json: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

const store = open(`${data}/survay.db`);
const flag = (name: string) => ["1", "true", "yes"].includes(process.env[name] ?? "");

switch (values.help === true ? "help" : (positionals[0] ?? "serve")) {
  case "serve": {
    process.env.NODE_ENV ??= "production";
    const seeded = store.seed();
    const secret = await password(`${data}/password`);
    const { serve } = await import("./server.tsx");
    const server = await serve({
      store,
      password: secret.value,
      port: Number(values.port ?? process.env["PORT"] ?? 3000),
      publicResults: flag("PUBLIC_RESULTS"),
      demo: flag("DEMO"),
    });
    const url = server.url.href.replace(/\/$/, "");
    console.log(
      [
        "survay is running",
        "",
        `  survey     ${url}`,
        `  dashboard  ${url}/admin`,
        `  password   ${secret.created ? `${secret.value}  (saved in data/password)` : "bun survay password prints it"}`,
        `  answers    ${store.path.replace(`${root}/`, "")}${seeded ? "  (starts with the demo survey)" : ""}`,
      ].join("\n"),
    );
    break;
  }
  case "results": {
    const { title, questions, responses } = store.survey();
    const stats = computeStats(questions, store.answers());
    if (values.json === true) console.log(JSON.stringify({ title, responses, stats }, null, 1));
    else console.log(report(title, responses, stats));
    break;
  }
  case "export":
    process.stdout.write(toCsv(store.survey().questions, store.responses()));
    break;
  case "password":
    console.log((await password(`${data}/password`)).value);
    break;
  default:
    console.log(usage);
}

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

function report(title: string, responses: number, stats: QuestionStat[]) {
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
