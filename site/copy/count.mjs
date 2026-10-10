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

const files = ["app", "components", "lib"]
  .flatMap((dir) => [...walk(join(root, dir))])
  .map((path) => relative(root, path))
  .filter((path) => /\.tsx?$/.test(path) && !path.startsWith("components/ui/"));

const lines = files
  .map(
    (path) =>
      readFileSync(join(root, path), "utf8")
        .split("\n")
        .filter((line) => line.trim()).length,
  )
  .reduce((a, b) => a + b, 0);

const schema = readFileSync(join(root, "lib/db/schema.ts"), "utf8");
const kinds = schema.match(/type QuestionKind = (.+)/)[1].match(/"\w+"/g).length;
const labelsSource = files
  .map((path) => readFileSync(join(root, path), "utf8"))
  .find((src) => src.includes("KIND_LABELS: Record"));
const kindLabels = [...labelsSource.match(/KIND_LABELS[^{]*\{([^}]*)\}/)[1].matchAll(/"([^"]+)"/g)].map(
  (m) => m[1],
);

const facts = {
  name: "survay",
  demo: "https://survey-platform-taupe.vercel.app",
  repo: "https://github.com/AVGVSTVS96/survay",
  license: "MIT",
  questionKinds: kinds,
  questionKindLabels: kindLabels,
  surveysPerDeploy: 1,
  selfHost: ["Vercel", "Neon", "ADMIN_PASSWORD"],
  linesOfCode: lines,
  linesOfCodeRounded: Math.ceil(lines / 100) * 100,
  linesOfCodeNote: `Non-blank lines in ${files.length} .ts/.tsx files under app/, components/ and lib/, not counting components/ui (generated shadcn parts). Counted by site/copy/count.mjs.`,
  countedAt: new Date().toISOString().slice(0, 10),
};

writeFileSync(join(here, "facts.json"), JSON.stringify(facts, null, 2) + "\n");
console.log(facts);
