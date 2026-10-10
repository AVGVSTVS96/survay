import { describe, expect, it } from "vitest"
import type { Question } from "./db/schema"
import { parseAnswer, TEXT_LIMIT } from "./questions"

type Shape = Pick<Question, "kind" | "options" | "scaleMax">

const single: Shape = { kind: "single", options: ["yep", "nah"], scaleMax: null }
const multi: Shape = { kind: "multi", options: ["a", "b", "c"], scaleMax: null }
const rating: Shape = { kind: "rating", options: [], scaleMax: 5 }
const text: Shape = { kind: "text", options: [], scaleMax: null }

describe("parseAnswer", () => {
  it("accepts a single choice only from the options", () => {
    expect(parseAnswer(single, "nah")).toBe("nah")
    expect(parseAnswer(single, "maybe")).toBeNull()
    expect(parseAnswer(single, ["yep"])).toBeNull()
  })

  it("keeps a deduped subset of options, in option order", () => {
    const q = multi
    expect(parseAnswer(q, ["c", "a", "a", "zzz"])).toEqual(["a", "c"])
    expect(parseAnswer(q, ["zzz"])).toBeNull()
    expect(parseAnswer(q, [])).toBeNull()
    expect(parseAnswer(q, "a")).toBeNull()
  })

  it("accepts whole ratings inside the scale", () => {
    const q = rating
    expect(parseAnswer(q, 1)).toBe(1)
    expect(parseAnswer(q, 5)).toBe(5)
    expect(parseAnswer(q, 0)).toBeNull()
    expect(parseAnswer(q, 6)).toBeNull()
    expect(parseAnswer(q, 2.5)).toBeNull()
    expect(parseAnswer(q, "3")).toBeNull()
    expect(parseAnswer(q, { valueOf: () => 3 })).toBeNull()
  })

  it("trims and caps text", () => {
    const q = text
    expect(parseAnswer(q, "  hi  ")).toBe("hi")
    expect(parseAnswer(q, "   ")).toBeNull()
    expect(parseAnswer(q, 42)).toBeNull()
    expect(parseAnswer(q, "x".repeat(TEXT_LIMIT + 10))).toHaveLength(TEXT_LIMIT)
  })
})
