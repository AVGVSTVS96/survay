"use client"

import { submitSurvey } from "@/app/actions/survey"
import { QuestionField } from "@/components/question-field"
import { ResultsView } from "@/components/results-view"
import { Button } from "@/components/ui/button"
import type { Question } from "@/lib/db/schema"
import { parseAnswer } from "@/lib/questions"
import type { QuestionStat } from "@/lib/stats"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react"

type Values = Record<number, unknown>

const STORAGE_KEY = "survay:answers"

const HINTS = {
  single: "Pick an answer to continue.",
  rating: "Pick a number to continue.",
  multi: "Pick at least one to continue.",
  text: "Write an answer to continue.",
}

function save(values: Values | null) {
  try {
    if (values) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function SurveyForm({ questions, embed }: { questions: Question[]; embed: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pickTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [values, setValues] = useState<Values>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "failed" | "done">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [results, setResults] = useState<QuestionStat[] | null>(null)

  const total = questions.length
  const answered = (q: Question) => parseAnswer(q, values[q.id]) !== null
  const blocked = questions.findIndex((q) => q.required && !answered(q))
  const requested = Number(searchParams.get("q")) - 1
  const step = Math.min(Math.max(Number.isInteger(requested) ? requested : 0, 0), blocked === -1 ? total - 1 : blocked)
  const current = questions[step]
  const isLast = step === total - 1

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage only exists after hydration
      if (saved) setValues(JSON.parse(saved))
    } catch {}
  }, [])

  const shownStep = useRef(step)
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

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
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-lg-display text-em text-balance">Thank you</p>
          <p className="text-muted-foreground text-pretty">
            {results ? "Here's how everyone answered so far." : "Your response has been recorded. You can close this page."}
          </p>
        </div>
        {results && <ResultsView stats={results} />}
      </div>
    )
  }

  function goTo(index: number) {
    clearTimeout(pickTimer.current)
    setMessage(null)
    const params = new URLSearchParams(searchParams)
    params.set("q", String(index + 1))
    window.history[embed ? "replaceState" : "pushState"](null, "", `?${params}`)
  }

  function answer(value: unknown) {
    const next = { ...values, [current.id]: value }
    setValues(next)
    setMessage(null)
    save(next)
  }

  function pick() {
    if (isLast) return
    clearTimeout(pickTimer.current)
    pickTimer.current = setTimeout(() => goTo(step + 1), 220)
  }

  async function advance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === "submitting") return
    if (current.required && !answered(current)) return setMessage(HINTS[current.kind])
    if (!isLast) return goTo(step + 1)

    setStatus("submitting")
    setMessage(null)
    try {
      const res = await submitSurvey({
        shown: questions.map((q) => q.id),
        answers: values,
        website: String(new FormData(e.currentTarget).get("website") ?? ""),
      })
      if (!res.ok) {
        setStatus("idle")
        setMessage(res.error)
        router.refresh()
        return
      }
      save(null)
      setResults(res.results)
      setStatus("done")
      const params = new URLSearchParams(searchParams)
      params.delete("q")
      window.history.replaceState(null, "", params.size ? `?${params}` : window.location.pathname)
    } catch {
      setStatus("failed")
      setMessage("Couldn't send your answers. Check your connection and try again.")
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return
    const target = e.target as HTMLElement
    if (target instanceof HTMLTextAreaElement ? !(e.metaKey || e.ctrlKey) : target.matches("input, button:not([role])")) return
    e.preventDefault()
    e.currentTarget.requestSubmit()
  }

  return (
    <form onSubmit={advance} onKeyDown={onKeyDown} className="flex flex-col gap-8">
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
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="text-lg-display text-em text-foreground text-balance outline-none"
          >
            {current.prompt}
          </h1>
          {current.description && (
            <p className="text-muted-foreground text-pretty">{current.description}</p>
          )}
        </div>

        <QuestionField
          key={current.id}
          question={current}
          value={values[current.id]}
          labelledBy={headingId}
          onChange={answer}
          onPick={pick}
        />
      </div>

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      {message && (
        <p role="alert" className="text-muted-foreground text-pretty">
          {message}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-0"
        >
          Back
        </button>
        <Button type="submit" disabled={status === "submitting"} className="min-h-11 rounded-lg px-6">
          {status === "submitting"
            ? "Sending"
            : !isLast
              ? "Continue"
              : status === "failed"
                ? "Try again"
                : "Submit"}
        </Button>
      </div>
    </form>
  )
}
