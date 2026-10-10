"use client"

import { reorderQuestions, setTitle } from "@/app/actions/admin"
import { QuestionEditor } from "@/components/question-editor"
import { ResultsView } from "@/components/results-view"
import { Button } from "@/components/ui/button"
import type { Question } from "@/lib/db/schema"
import { KIND_LABELS } from "@/lib/questions"
import type { QuestionStat } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { useOptimistic, useState, useTransition } from "react"

type Tab = "questions" | "results"

export function AdminDashboard({
  title,
  questions,
  stats,
  responseCount,
}: {
  title: string
  questions: Question[]
  stats: QuestionStat[]
  responseCount: number
}) {
  const [tab, setTab] = useState<Tab>("questions")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ordered, setOrdered] = useOptimistic(questions)
  const [reordering, start] = useTransition()

  function move(index: number, dir: -1 | 1) {
    const next = [...ordered]
    ;[next[index], next[index + dir]] = [next[index + dir], next[index]]
    setError(null)
    start(async () => {
      setOrdered(next)
      const res = await reorderQuestions(next.map((q) => q.id))
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-6 border-b border-border">
        {(["questions", "results"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b py-2 capitalize transition-colors",
              tab === t
                ? "border-foreground text-foreground text-em"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "questions" ? (
        <div className="flex flex-col gap-4">
          <TitleField key={title} title={title} />

          {ordered.length === 0 && !creating && (
            <p className="text-muted-foreground">
              No questions yet. Add your first one below.
            </p>
          )}

          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}

          {ordered.map((q, i) =>
            editingId === q.id ? (
              <QuestionEditor
                key={q.id}
                question={q}
                stat={stats.find((s) => s.question.id === q.id)}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <div
                key={q.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || reordering}
                    className="text-subtle transition-colors hover:text-foreground disabled:opacity-20"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => move(i, 1)}
                    disabled={i === ordered.length - 1 || reordering}
                    className="text-subtle transition-colors hover:text-foreground disabled:opacity-20"
                  >
                    &darr;
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(q.id)}
                  className="flex flex-1 flex-col gap-0.5 text-left"
                >
                  <span className="text-foreground text-pretty">{q.prompt}</span>
                  <span className="text-muted-foreground">
                    {KIND_LABELS[q.kind]}
                    {q.required && <span className="text-subtle"> · Required</span>}
                  </span>
                </button>
              </div>
            ),
          )}

          {creating ? (
            <QuestionEditor onClose={() => setCreating(false)} />
          ) : (
            <Button
              type="button"
              onClick={() => setCreating(true)}
              className="min-h-11 self-start rounded-lg px-5"
            >
              Add question
            </Button>
          )}
        </div>
      ) : responseCount === 0 ? (
        <p className="text-muted-foreground">No responses yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <a
            href="/admin/export"
            download
            className="self-end text-muted-foreground transition-colors hover:text-foreground"
          >
            Export CSV
          </a>
          <ResultsView stats={stats} />
        </div>
      )}
    </div>
  )
}

function TitleField({ title }: { title: string }) {
  const [value, setValue] = useState(title)
  const [error, setError] = useState<string | null>(null)
  const [saving, start] = useTransition()
  const dirty = value.trim() !== title

  function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await setTitle(value)
      if (res.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={200}
          placeholder="Survey title (optional)"
          aria-label="Survey title"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50"
        />
        {dirty && (
          <Button type="submit" disabled={saving} className="min-h-11 rounded-lg px-5">
            {saving ? "Saving" : "Save"}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
