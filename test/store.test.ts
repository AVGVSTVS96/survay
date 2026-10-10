import { expect, test } from "bun:test";

import { open } from "../src/store.ts";

test("starts with the demo survey once", () => {
  const store = open(":memory:");
  expect(store.seed()).toBe(true);
  expect(store.seed()).toBe(false);
  expect(store.survey()).toMatchObject({ title: "A few quick questions", responses: 0 });
  expect(store.survey().questions.map((q) => q.kind)).toEqual(["single", "single", "text", "multi"]);
});

test("adds, edits, reorders and deletes questions", () => {
  const store = open(":memory:");
  expect(
    store.change({ type: "add", question: { kind: "single", prompt: "One", options: ["a", "b"] } }),
  ).toBeNull();
  expect(store.change({ type: "add", question: { kind: "text", prompt: "Two" } })).toBeNull();
  const [one, two] = store.survey().questions;
  expect(store.change({ type: "order", ids: [two!.id, one!.id] })).toBeNull();
  expect(store.survey().questions.map((q) => q.prompt)).toEqual(["Two", "One"]);
  expect(
    store.change({
      type: "edit",
      id: one!.id,
      question: { kind: "multi", prompt: "Uno", options: ["a", "c"] },
    }),
  ).toBeNull();
  expect(store.survey().questions[1]).toMatchObject({ kind: "multi", prompt: "Uno", options: ["a", "c"] });
  expect(store.change({ type: "add", question: { kind: "single", prompt: "x", options: ["a"] } })).toBe(
    "Add at least two different options.",
  );
  expect(store.change({ type: "delete", id: two!.id })).toBeNull();
  expect(store.survey().questions).toHaveLength(1);
});

test("locks a question's type once it has answers", () => {
  const store = open(":memory:");
  store.change({ type: "add", question: { kind: "single", prompt: "One", options: ["a", "b"] } });
  const [q] = store.survey().questions;
  store.respond([{ questionId: q!.id, value: "a" }]);
  expect(store.change({ type: "edit", id: q!.id, question: { kind: "text", prompt: "One" } })).toBe(
    "This question already has answers, so its type can't change.",
  );
  expect(store.survey().responses).toBe(1);
  expect(store.answers()).toEqual([{ questionId: q!.id, value: "a" }]);
  expect(store.responses()[0]?.answers.get(q!.id)).toBe("a");
});

test("deleting a question deletes its answers", () => {
  const store = open(":memory:");
  store.change({ type: "add", question: { kind: "text", prompt: "Why?" } });
  const [q] = store.survey().questions;
  store.respond([{ questionId: q!.id, value: "because" }]);
  store.change({ type: "delete", id: q!.id });
  expect(store.answers()).toEqual([]);
});
