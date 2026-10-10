import { describe, expect, it } from "vitest"
import { toCsv } from "./csv"

describe("toCsv", () => {
  it("writes one row per response and one column per question", () => {
    const csv = toCsv(
      [
        { id: 1, prompt: "Pick, one" },
        { id: 2, prompt: "Why?" },
      ],
      [
        { id: 10, createdAt: new Date("2026-10-10T00:00:00Z") },
        { id: 11, createdAt: new Date("2026-10-11T00:00:00Z") },
      ],
      [
        { responseId: 10, questionId: 1, value: ["a", "b"] },
        { responseId: 10, questionId: 2, value: 'said "hi"\nthen left' },
        { responseId: 11, questionId: 2, value: "=HYPERLINK(1)" },
      ],
    )
    expect(csv.split("\r\n")).toEqual([
      'Submitted,"Pick, one",Why?',
      '2026-10-10T00:00:00.000Z,a; b,"said ""hi""\nthen left"',
      "2026-10-11T00:00:00.000Z,,'=HYPERLINK(1)",
      "",
    ])
  })
})
