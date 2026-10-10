import { describe, expect, it } from "vitest"
import type { Question } from "./db/schema"
import { computeStats } from "./stats"

function question(id: number, fields: Partial<Question>): Question {
  return {
    id,
    kind: "single",
    prompt: `Q${id}`,
    description: null,
    options: [],
    scaleMax: null,
    multiline: true,
    required: false,
    position: id,
    createdAt: new Date(0),
    ...fields,
  }
}

describe("computeStats", () => {
  it("counts choices and ignores answers that no longer fit", () => {
    const q = question(1, { kind: "single", options: ["yep", "nah"] })
    const [stat] = computeStats([q], [
      { questionId: 1, value: "yep" },
      { questionId: 1, value: "yep" },
      { questionId: 1, value: "renamed" },
    ])
    expect(stat).toMatchObject({ total: 2, options: [{ label: "yep", count: 2 }, { label: "nah", count: 0 }] })
  })

  it("counts every pick of a checkbox answer", () => {
    const q = question(1, { kind: "multi", options: ["a", "b"] })
    const [stat] = computeStats([q], [
      { questionId: 1, value: ["a", "b"] },
      { questionId: 1, value: ["a"] },
    ])
    expect(stat).toMatchObject({ total: 2, options: [{ label: "a", count: 2 }, { label: "b", count: 1 }] })
  })

  it("averages ratings inside the scale only", () => {
    const q = question(1, { kind: "rating", scaleMax: 5 })
    const [stat] = computeStats([q], [
      { questionId: 1, value: 4 },
      { questionId: 1, value: 5 },
      { questionId: 1, value: 99 },
    ])
    expect(stat).toMatchObject({ total: 2, average: 4.5, max: 5 })
    if (stat.kind === "rating") expect(stat.buckets.map((b) => b.count)).toEqual([0, 0, 0, 1, 1])
  })

  it("keeps text answers in the order given", () => {
    const q = question(1, { kind: "text" })
    const [stat] = computeStats([q], [
      { questionId: 1, value: "newest" },
      { questionId: 1, value: "older" },
    ])
    expect(stat).toMatchObject({ total: 2, samples: ["newest", "older"] })
  })

  it("returns an empty stat for questions nobody answered", () => {
    const [stat] = computeStats([question(1, { kind: "text" })], [])
    expect(stat).toMatchObject({ total: 0, samples: [] })
  })
})
