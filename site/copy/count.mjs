import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const here = new URL("./", import.meta.url).pathname;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const files = [...walk(join(root, "src"))]
  .map((path) => relative(root, path))
  .filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".d.ts"));

const lines = files
  .map((path) => readFileSync(join(root, path), "utf8").split("\n").filter((line) => line.trim()).length)
  .reduce((a, b) => a + b, 0);

const questions = readFileSync(join(root, "src/questions.ts"), "utf8");
const kindLabels = [...questions.match(/KIND_LABELS[^{]*\{([^}]*)\}/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const facts = {
  name: "survay",
  site: "https://survay-site.vercel.app",
  demo: "https://survay-b3zbd.sprites.app",
  repo: "https://github.com/AVGVSTVS96/survay",
  license: "MIT",
  questionKinds: kindLabels.length,
  questionKindLabels: kindLabels,
  surveysPerCopy: 1,
  runtime: "Bun",
  database: "one SQLite file, data/survay.db",
  dependencies: Object.keys(pkg.dependencies),
  linesOfCode: lines,
  linesOfCodeRounded: Math.ceil(lines / 100) * 100,
  linesOfCodeNote: `Non-blank lines in ${files.length} .ts/.tsx files under src/, not counting tests. Counted by site/copy/count.mjs.`,
  countedAt: new Date().toISOString().slice(0, 10),
};

writeFileSync(join(here, "facts.json"), JSON.stringify(facts, null, 2) + "\n");
console.log(facts);
