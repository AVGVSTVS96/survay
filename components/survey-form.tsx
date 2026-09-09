"use client"

import { submitSurvey } from "@/app/actions/survey"
import { QuestionField } from "@/components/question-field"
import { Button } from "@/components/ui/button"
import type { AnswerValue, Question } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"

function isEmpty(v: AnswerValue | undefined) {
  return (
    v === undefined ||
    v === null ||
    (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0)
  )
}

export function SurveyForm({ questions }: { questions: Question[] }) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<number, AnswerValue>>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const total = questions.length
  const current = questions[step]
  const progress = useMemo(
    () => (total === 0 ? 0 : Math.round(((step + (status === "done" ? 1 : 0)) / total) * 100)),
    [step, total, status],
  )

  if (total === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-lg-display text-em text-balance">Nothing here yet</p>
        <p className="text-muted-foreground text-pretty">
          This survey has no questions. Please check back soon.
        </p>
      </div>
    )
  }

  if (status === "done") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-lg-display text-em text-balance">Thank you</p>
        <p className="text-muted-foreground text-pretty">
          Your response has been recorded. You can close this page.
        </p>
      </div>
    )
  }

  const canAdvance = !current.required || !isEmpty(values[current.id])
  const isLast = step === total - 1

  function setValue(v: AnswerValue) {
    setValues((prev) => ({ ...prev, [current.id]: v }))
  }

  async function next() {
    setError(null)
    if (!isLast) {
      setStep((s) => s + 1)
      return
    }
    setStatus("submitting")
    const res = await submitSurvey(values)
    if (res.ok) {
      setStatus("done")
    } else {
      setStatus("error")
      setError(res.error)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>
            {step + 1} / {total}
          </span>
          {current.required && <span className="text-subtle">Required</span>}
        </div>
        <div className="h-px w-full bg-border" aria-hidden>
          <div
            className="h-px bg-foreground transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg-display text-em text-foreground text-balance">{current.prompt}</h1>
          {current.description && (
            <p className="text-muted-foreground text-pretty">{current.description}</p>
          )}
        </div>

        <QuestionField question={current} value={values[current.id]} onChange={setValue} />
      </div>

      {error && <p className="text-muted-foreground">{error}</p>}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className={cn(
            "text-muted-foreground transition-colors hover:text-foreground disabled:opacity-0",
          )}
        >
          Back
        </button>
        <Button
          type="button"
          onClick={next}
          disabled={!canAdvance || status === "submitting"}
          className="min-h-11 rounded-lg px-6"
        >
          {status === "submitting" ? "Sending" : isLast ? "Submit" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
