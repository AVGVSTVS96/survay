#!/usr/bin/env bun
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";

import { password } from "./auth.ts";
import { toCsv } from "./csv.ts";
import { report } from "./report.ts";
import { computeStats } from "./stats.ts";
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
