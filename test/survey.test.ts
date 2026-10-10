import { describe, expect, test } from "bun:test";

import { toCsv } from "../src/csv.ts";
import { parseAnswer, parseQuestion, TEXT_LIMIT, type Question } from "../src/questions.ts";
import { computeStats } from "../src/stats.ts";

type Shape = Pick<Question, "kind" | "options" | "scaleMax">;

const single: Shape = { kind: "single", options: ["yep", "nah"], scaleMax: null };
const multi: Shape = { kind: "multi", options: ["a", "b", "c"], scaleMax: null };
const rating: Shape = { kind: "rating", options: [], scaleMax: 5 };
const text: Shape = { kind: "text", options: [], scaleMax: null };

const question = (id: number, fields: Partial<Question>): Question => ({
  id,
  kind: "single",
  prompt: `Q${id}`,
  description: null,
  options: [],
  scaleMax: null,
  multiline: true,
  required: false,
  ...fields,
});

describe("parseAnswer", () => {
  test("accepts a single choice only from the options", () => {
    expect(parseAnswer(single, "nah")).toBe("nah");
    expect(parseAnswer(single, "maybe")).toBeNull();
    expect(parseAnswer(single, ["yep"])).toBeNull();
  });

  test("keeps a deduped subset of options, in option order", () => {
    expect(parseAnswer(multi, ["c", "a", "a", "zzz"])).toEqual(["a", "c"]);
    expect(parseAnswer(multi, ["zzz"])).toBeNull();
    expect(parseAnswer(multi, [])).toBeNull();
    expect(parseAnswer(multi, "a")).toBeNull();
  });

  test("accepts whole ratings inside the scale", () => {
    expect(parseAnswer(rating, 1)).toBe(1);
    expect(parseAnswer(rating, 5)).toBe(5);
    expect(parseAnswer(rating, 0)).toBeNull();
    expect(parseAnswer(rating, 6)).toBeNull();
    expect(parseAnswer(rating, 2.5)).toBeNull();
    expect(parseAnswer(rating, "3")).toBeNull();
    expect(parseAnswer(rating, { valueOf: () => 3 })).toBeNull();
  });

  test("trims and caps text", () => {
    expect(parseAnswer(text, "  hi  ")).toBe("hi");
    expect(parseAnswer(text, "   ")).toBeNull();
    expect(parseAnswer(text, 42)).toBeNull();
    expect(parseAnswer(text, "x".repeat(TEXT_LIMIT + 10))).toHaveLength(TEXT_LIMIT);
  });
});

describe("parseQuestion", () => {
  test("needs a kind, a prompt and two different options", () => {
    expect(parseQuestion({ kind: "poll", prompt: "x" })).toBe("Pick a question type.");
    expect(parseQuestion({ kind: "single", prompt: "  " })).toBe("Write the question first.");
    expect(parseQuestion({ kind: "single", prompt: "x", options: ["a", " a "] })).toBe(
      "Add at least two different options.",
    );
  });

  test("keeps only the settings a kind uses", () => {
    expect(parseQuestion({ kind: "rating", prompt: " How? ", options: ["a", "b"], scaleMax: 7 })).toEqual({
      kind: "rating",
      prompt: "How?",
      description: null,
      options: [],
      scaleMax: 5,
      multiline: true,
      required: false,
    });
  });
});

describe("computeStats", () => {
  test("counts choices and ignores answers that no longer fit", () => {
    const [stat] = computeStats(
      [question(1, { kind: "single", options: ["yep", "nah"] })],
      [
        { questionId: 1, value: "yep" },
        { questionId: 1, value: "yep" },
        { questionId: 1, value: "renamed" },
      ],
    );
    expect(stat).toMatchObject({
      total: 2,
      options: [
        { label: "yep", count: 2 },
        { label: "nah", count: 0 },
      ],
    });
  });

  test("counts every pick of a checkbox answer", () => {
    const [stat] = computeStats(
      [question(1, { kind: "multi", options: ["a", "b"] })],
      [
        { questionId: 1, value: ["a", "b"] },
        { questionId: 1, value: ["a"] },
      ],
    );
    expect(stat).toMatchObject({
      total: 2,
      options: [
        { label: "a", count: 2 },
        { label: "b", count: 1 },
      ],
    });
  });

  test("averages ratings inside the scale only", () => {
    const [stat] = computeStats(
      [question(1, { kind: "rating", scaleMax: 5 })],
      [
        { questionId: 1, value: 4 },
        { questionId: 1, value: 5 },
        { questionId: 1, value: 99 },
      ],
    );
    expect(stat).toMatchObject({ total: 2, average: 4.5, max: 5 });
    if (stat?.kind === "rating") expect(stat.buckets.map((b) => b.count)).toEqual([0, 0, 0, 1, 1]);
  });

  test("keeps text answers in the order given", () => {
    const [stat] = computeStats(
      [question(1, { kind: "text" })],
      [
        { questionId: 1, value: "newest" },
        { questionId: 1, value: "older" },
      ],
    );
    expect(stat).toMatchObject({ total: 2, samples: ["newest", "older"] });
  });
});

describe("toCsv", () => {
  test("writes one row per response and one column per question", () => {
    const csv = toCsv(
      [
        { id: 1, prompt: "Pick, one" },
        { id: 2, prompt: "Why?" },
      ],
      [
        {
          id: 10,
          createdAt: "2026-10-10T00:00:00.000Z",
          answers: new Map<number, unknown>([
            [1, ["a", "b"]],
            [2, 'said "hi"\nthen left'],
          ]),
        },
        { id: 11, createdAt: "2026-10-11T00:00:00.000Z", answers: new Map([[2, "=HYPERLINK(1)"]]) },
      ],
    );
    expect(csv.split("\r\n")).toEqual([
      'Submitted,"Pick, one",Why?',
      '2026-10-10T00:00:00.000Z,a; b,"said ""hi""\nthen left"',
      "2026-10-11T00:00:00.000Z,,'=HYPERLINK(1)",
      "",
    ]);
  });
});
