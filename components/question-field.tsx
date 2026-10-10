"use client"

import type { Question } from "@/lib/db/schema"
import { TEXT_LIMIT } from "@/lib/questions"
import { cn } from "@/lib/utils"
import type { KeyboardEvent, MouseEvent } from "react"

type Props = {
  question: Question
  value: unknown
  labelledBy: string
  onChange: (value: unknown) => void
  onPick?: () => void
}

const STEPS: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }

function arrowKeys(select: boolean) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    const step = STEPS[e.key]
    if (!step) return
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio],[role=checkbox]")]
    const next = items[(items.indexOf(document.activeElement as HTMLButtonElement) + step + items.length) % items.length]
    e.preventDefault()
    next.focus()
    if (select) next.click()
  }
}

const isPointer = (e: MouseEvent) => e.detail > 0

export function QuestionField({ question, value, labelledBy, onChange, onPick }: Props) {
  switch (question.kind) {
    case "single":
      return (
        <div role="radiogroup" aria-labelledby={labelledBy} onKeyDown={arrowKeys(true)} className="flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <Choice
              key={opt}
              label={opt}
              role="radio"
              checked={value === opt}
              tabbable={value === opt || (!question.options.includes(value as string) && i === 0)}
              onClick={(e) => {
                onChange(opt)
                if (isPointer(e)) onPick?.()
              }}
            />
          ))}
        </div>
      )

    case "multi": {
      const picked = Array.isArray(value) ? value : []
      return (
        <div role="group" aria-labelledby={labelledBy} onKeyDown={arrowKeys(false)} className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const checked = picked.includes(opt)
            return (
              <Choice
                key={opt}
                label={opt}
                role="checkbox"
                checked={checked}
                tabbable
                onClick={() => onChange(checked ? picked.filter((o) => o !== opt) : [...picked, opt])}
              />
            )
          })}
        </div>
      )
    }

    case "rating": {
      const max = question.scaleMax ?? 5
      return (
        <div role="radiogroup" aria-labelledby={labelledBy} onKeyDown={arrowKeys(true)} className="flex flex-wrap gap-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const active = value === n
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${n} of ${max}`}
                tabIndex={active || (typeof value !== "number" && n === 1) ? 0 : -1}
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

    case "text": {
      const props = {
        "aria-labelledby": labelledBy,
        value: typeof value === "string" ? value : "",
        maxLength: TEXT_LIMIT,
        placeholder: "Type your answer",
        className:
          "w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50",
      }
      return question.multiline ? (
        <textarea
          {...props}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className={cn(props.className, "resize-none")}
        />
      ) : (
        <input {...props} onChange={(e) => onChange(e.target.value)} />
      )
    }
  }
}

function Choice({
  label,
  role,
  checked,
  tabbable,
  onClick,
}: {
  label: string
  role: "radio" | "checkbox"
  checked: boolean
  tabbable: boolean
  onClick: (e: MouseEvent) => void
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      tabIndex={tabbable ? 0 : -1}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        checked
          ? "border-foreground bg-accent text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border transition-colors",
          role === "radio" ? "rounded-full" : "rounded",
          checked ? "border-foreground bg-foreground" : "border-border",
        )}
      >
        {checked && (
          <span
            className={cn(
              "bg-primary-foreground",
              role === "radio" ? "h-2 w-2 rounded-full" : "h-2.5 w-2.5 rounded-[2px]",
            )}
          />
        )}
      </span>
      <span className={cn(checked && "text-em")}>{label}</span>
    </button>
  )
}
