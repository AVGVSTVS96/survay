"use client"

import type { AnswerValue, Question } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

type Props = {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
}

export function QuestionField({ question, value, onChange }: Props) {
  switch (question.kind) {
    case "single":
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const selected = value === opt
            return (
              <Choice
                key={opt}
                label={opt}
                selected={selected}
                shape="round"
                onClick={() => onChange(opt)}
              />
            )
          })}
        </div>
      )

    case "multi": {
      const arr = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const selected = arr.includes(opt)
            return (
              <Choice
                key={opt}
                label={opt}
                selected={selected}
                shape="square"
                onClick={() =>
                  onChange(
                    selected ? arr.filter((o) => o !== opt) : [...arr, opt],
                  )
                }
              />
            )
          })}
        </div>
      )
    }

    case "rating": {
      const max = question.scaleMax ?? 5
      const current = typeof value === "number" ? value : 0
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const active = current === n
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                aria-label={`${n} of ${max}`}
                onClick={() => onChange(n)}
                className={cn(
                  "flex h-12 min-w-12 flex-1 items-center justify-center rounded-lg border transition-colors",
                  active
                    ? "border-foreground bg-foreground text-primary-foreground text-em"
                    : "border-border text-muted-foreground hover:border-foreground/40",
                )}
              >
                {n}
              </button>
            )
          })}
        </div>
      )
    }

    case "text":
    default: {
      const long = (question.description ?? "").length > 0 || question.kind === "text"
      const str = typeof value === "string" ? value : ""
      return long ? (
        <textarea
          value={str}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Type your answer"
          className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50"
        />
      ) : (
        <input
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50"
        />
      )
    }
  }
}

function Choice({
  label,
  selected,
  shape,
  onClick,
}: {
  label: string
  selected: boolean
  shape: "round" | "square"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        selected
          ? "border-foreground bg-accent text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border transition-colors",
          shape === "round" ? "rounded-full" : "rounded",
          selected ? "border-foreground bg-foreground" : "border-border",
        )}
      >
        {selected && (
          <span
            className={cn(
              "bg-primary-foreground",
              shape === "round" ? "h-2 w-2 rounded-full" : "h-2.5 w-2.5 rounded-[2px]",
            )}
          />
        )}
      </span>
      <span className={cn(selected && "text-em")}>{label}</span>
    </button>
  )
}
