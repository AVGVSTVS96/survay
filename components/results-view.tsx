"use client"

import { KIND_LABELS } from "@/lib/questions"
import type { QuestionStat } from "@/lib/stats"
import { useState } from "react"

const PAGE = 5

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {count}
          <span className="text-subtle"> · {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ResultsView({ stats }: { stats: QuestionStat[] }) {
  if (stats.length === 0) {
    return <p className="text-muted-foreground">No questions yet.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      {stats.map((s) => (
        <section key={s.question.id} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-em text-pretty">{s.question.prompt}</h2>
            <p className="text-muted-foreground">
              {KIND_LABELS[s.kind]}
              <span className="text-subtle">
                {" · "}
                {s.total} {s.total === 1 ? "answer" : "answers"}
              </span>
            </p>
          </div>

          {(s.kind === "single" || s.kind === "multi") && (
            <div className="flex flex-col gap-3">
              {s.options.map((o) => (
                <Bar key={o.label} label={o.label} count={o.count} total={s.total} />
              ))}
            </div>
          )}

          {s.kind === "rating" && (
            <div className="flex flex-col gap-4">
              <p className="text-foreground">
                <span className="text-lg-display text-em">{s.average || "—"}</span>
                <span className="text-muted-foreground"> average of {s.max}</span>
              </p>
              <div className="flex flex-col gap-3">
                {s.buckets.map((b) => (
                  <Bar key={b.label} label={b.label} count={b.count} total={s.total} />
                ))}
              </div>
            </div>
          )}

          {s.kind === "text" && <TextAnswers samples={s.samples} />}
        </section>
      ))}
    </div>
  )
}

function TextAnswers({ samples }: { samples: string[] }) {
  const [shown, setShown] = useState(PAGE)

  if (samples.length === 0) return <p className="text-muted-foreground">No answers yet.</p>

  return (
    <div className="flex flex-col gap-2">
      {samples.slice(0, shown).map((text, i) => (
        <p
          key={i}
          className="rounded-lg border border-border bg-card px-4 py-3 text-foreground text-pretty whitespace-pre-line break-words"
        >
          {text}
        </p>
      ))}
      {shown < samples.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE * 2)}
          className="self-start text-muted-foreground transition-colors hover:text-foreground"
        >
          Show more
          <span className="text-subtle"> · {samples.length - shown} left</span>
        </button>
      )}
    </div>
  )
}
