"use client"

import {
  createQuestion,
  deleteQuestion,
  updateQuestion,
  type ActionResult,
  type QuestionInput,
} from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import type { Question, QuestionKind } from "@/lib/db/schema"
import { hasOptions, KIND_LABELS, KINDS } from "@/lib/questions"
import type { QuestionStat } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { useState, useTransition } from "react"

type Draft = {
  kind: QuestionKind
  prompt: string
  description: string
  options: string[]
  scaleMax: number
  multiline: boolean
  required: boolean
}

function toDraft(q?: Question): Draft {
  return {
    kind: q?.kind ?? "single",
    prompt: q?.prompt ?? "",
    description: q?.description ?? "",
    options: q?.options?.length ? q.options : ["", ""],
    scaleMax: q?.scaleMax ?? 5,
    multiline: q?.multiline ?? true,
    required: q?.required ?? false,
  }
}

function toInput(d: Draft): QuestionInput {
  return {
    kind: d.kind,
    prompt: d.prompt,
    description: d.description,
    options: hasOptions(d.kind) ? uniqueOptions(d.options) : [],
    scaleMax: d.kind === "rating" ? d.scaleMax : null,
    multiline: d.multiline,
    required: d.required,
  }
}

function uniqueOptions(options: string[]) {
  return [...new Set(options.map((o) => o.trim()).filter(Boolean))]
}

function droppedAnswers(stat: QuestionStat | undefined, options: string[]) {
  if (stat?.kind !== "single" && stat?.kind !== "multi") return 0
  return stat.options
    .filter((o) => !options.includes(o.label))
    .reduce((sum, o) => sum + o.count, 0)
}

const fieldClass =
  "w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50"

export function QuestionEditor({
  question,
  stat,
  onClose,
}: {
  question?: Question
  stat?: QuestionStat
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(question))
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<"delete" | "drop" | null>(null)
  const [pending, start] = useTransition()

  const usesOptions = hasOptions(draft.kind)
  const kindLocked = (stat?.total ?? 0) > 0
  const valid =
    draft.prompt.trim().length > 0 && (!usesOptions || uniqueOptions(draft.options).length >= 2)
  const dropped = question ? droppedAnswers(stat, toInput(draft).options ?? []) : 0

  function run(action: () => Promise<ActionResult>) {
    setError(null)
    start(async () => {
      const res = await action()
      if (res.error) {
        setError(res.error)
        setConfirming(null)
      } else onClose()
    })
  }

  function save() {
    if (dropped > 0 && confirming !== "drop") return setConfirming("drop")
    run(() => (question ? updateQuestion(question.id, toInput(draft)) : createQuestion(toInput(draft))))
  }

  function edit(change: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...change }))
    setConfirming(null)
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            disabled={kindLocked && k !== question?.kind}
            onClick={() => edit({ kind: k })}
            className={cn(
              "rounded-lg border px-3 py-2 transition-colors",
              draft.kind === k
                ? "border-foreground bg-accent text-foreground text-em"
                : "border-border text-muted-foreground hover:border-foreground/40 disabled:opacity-40 disabled:hover:border-border",
            )}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
        {kindLocked && (
          <p className="w-full text-subtle">The type is locked because this question has answers.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={draft.prompt}
          onChange={(e) => edit({ prompt: e.target.value })}
          placeholder="Question"
          className={fieldClass}
          autoFocus
        />
        <input
          value={draft.description}
          onChange={(e) => edit({ description: e.target.value })}
          placeholder="Description (optional)"
          className={fieldClass}
        />
      </div>

      {usesOptions && (
        <div className="flex flex-col gap-2">
          {draft.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => edit({ options: draft.options.with(i, e.target.value) })}
                placeholder={`Option ${i + 1}`}
                className={fieldClass}
              />
              <button
                type="button"
                aria-label="Remove option"
                onClick={() => edit({ options: draft.options.filter((_, idx) => idx !== i) })}
                disabled={draft.options.length <= 2}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground/40 disabled:opacity-30"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => edit({ options: [...draft.options, ""] })}
            className="self-start text-muted-foreground transition-colors hover:text-foreground"
          >
            Add option
          </button>
        </div>
      )}

      {draft.kind === "rating" && (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">Scale up to</span>
          <div className="flex gap-2">
            {[5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => edit({ scaleMax: n })}
                className={cn(
                  "min-w-11 rounded-lg border px-3 py-2 transition-colors",
                  draft.scaleMax === n
                    ? "border-foreground bg-accent text-foreground text-em"
                    : "border-border text-muted-foreground hover:border-foreground/40",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {draft.kind === "text" && (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">Answer box</span>
          <div className="flex gap-2">
            {[
              { multiline: false, label: "One line" },
              { multiline: true, label: "Paragraph" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => edit({ multiline: o.multiline })}
                className={cn(
                  "rounded-lg border px-3 py-2 transition-colors",
                  draft.multiline === o.multiline
                    ? "border-foreground bg-accent text-foreground text-em"
                    : "border-border text-muted-foreground hover:border-foreground/40",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={draft.required}
        onClick={() => edit({ required: !draft.required })}
        className="flex items-center gap-3 self-start"
      >
        <span
          className={cn(
            "flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors",
            draft.required ? "border-foreground bg-foreground" : "border-border",
          )}
        >
          <span
            className={cn(
              "h-3.5 w-3.5 rounded-full transition-transform",
              draft.required
                ? "translate-x-4 bg-primary-foreground"
                : "translate-x-0 bg-muted-foreground",
            )}
          />
        </span>
        <span className={cn(draft.required ? "text-foreground" : "text-muted-foreground")}>
          Required
        </span>
      </button>

      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      {confirming === "drop" && (
        <p role="alert" className="text-muted-foreground text-pretty">
          {dropped} {dropped === 1 ? "answer picked an option" : "answers picked options"} you removed or
          renamed. They&apos;ll stop showing in results.
        </p>
      )}

      {confirming === "delete" ? (
        <div key="confirm" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-foreground">
            Delete this question{stat?.total ? ` and its ${stat.total} ${stat.total === 1 ? "answer" : "answers"}` : ""}?
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Keep it
            </button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => deleteQuestion(question!.id))}
              className="min-h-11 rounded-lg px-5"
            >
              {pending ? "Deleting" : "Delete"}
            </Button>
          </div>
        </div>
      ) : (
        <div key="actions" className="flex items-center justify-between gap-3 border-t border-border pt-4">
          {question ? (
            <button
              type="button"
              onClick={() => setConfirming("delete")}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <Button
              type="button"
              onClick={save}
              disabled={!valid || pending}
              className="min-h-11 rounded-lg px-5"
            >
              {pending ? "Saving" : confirming === "drop" ? "Save anyway" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

