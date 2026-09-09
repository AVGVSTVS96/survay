"use client"

import { createQuestion, deleteQuestion, updateQuestion, type QuestionInput } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import type { Question, QuestionKind } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { useState, useTransition } from "react"

const KIND_LABELS: Record<QuestionKind, string> = {
  single: "Multiple choice",
  multi: "Checkboxes",
  text: "Text",
  rating: "Rating",
}

const KINDS: QuestionKind[] = ["single", "multi", "rating", "text"]

type Draft = {
  kind: QuestionKind
  prompt: string
  description: string
  options: string[]
  scaleMax: number
  required: boolean
}

function toDraft(q?: Question): Draft {
  return {
    kind: (q?.kind as QuestionKind) ?? "single",
    prompt: q?.prompt ?? "",
    description: q?.description ?? "",
    options: q?.options?.length ? q.options : ["", ""],
    scaleMax: q?.scaleMax ?? 5,
    required: q?.required ?? false,
  }
}

function toInput(d: Draft): QuestionInput {
  return {
    kind: d.kind,
    prompt: d.prompt,
    description: d.description,
    options: d.kind === "single" || d.kind === "multi"
      ? d.options.map((o) => o.trim()).filter(Boolean)
      : [],
    scaleMax: d.kind === "rating" ? d.scaleMax : null,
    required: d.required,
  }
}

const fieldClass =
  "w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50"

export function QuestionEditor({
  question,
  onClose,
}: {
  question?: Question
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(question))
  const [pending, start] = useTransition()

  const usesOptions = draft.kind === "single" || draft.kind === "multi"
  const valid =
    draft.prompt.trim().length > 0 &&
    (!usesOptions || draft.options.filter((o) => o.trim()).length >= 2)

  function save() {
    start(async () => {
      if (question) await updateQuestion(question.id, toInput(draft))
      else await createQuestion(toInput(draft))
      onClose()
    })
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setDraft((d) => ({ ...d, kind: k }))}
            className={cn(
              "rounded-lg border px-3 py-2 transition-colors",
              draft.kind === k
                ? "border-foreground bg-accent text-foreground text-em"
                : "border-border text-muted-foreground hover:border-foreground/40",
            )}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={draft.prompt}
          onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
          placeholder="Question"
          className={fieldClass}
          autoFocus
        />
        <input
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
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
                onChange={(e) =>
                  setDraft((d) => {
                    const options = [...d.options]
                    options[i] = e.target.value
                    return { ...d, options }
                  })
                }
                placeholder={`Option ${i + 1}`}
                className={fieldClass}
              />
              <button
                type="button"
                aria-label="Remove option"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    options: d.options.filter((_, idx) => idx !== i),
                  }))
                }
                disabled={draft.options.length <= 2}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground/40 disabled:opacity-30"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, options: [...d.options, ""] }))}
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
                onClick={() => setDraft((d) => ({ ...d, scaleMax: n }))}
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

      <button
        type="button"
        onClick={() => setDraft((d) => ({ ...d, required: !d.required }))}
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

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        {question ? (
          <button
            type="button"
            onClick={() =>
              start(async () => {
                await deleteQuestion(question.id)
                onClose()
              })
            }
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            Delete
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <Button
          type="button"
          onClick={save}
          disabled={!valid || pending}
          className="min-h-11 rounded-lg px-5"
        >
          {pending ? "Saving" : "Save"}
        </Button>
      </div>
    </div>
  )
}

export { KIND_LABELS }
