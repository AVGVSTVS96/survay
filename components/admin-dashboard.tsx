"use client"

import { reorderQuestions } from "@/app/actions/admin"
import { KIND_LABELS, QuestionEditor } from "@/components/question-editor"
import { ResultsView } from "@/components/results-view"
import { Button } from "@/components/ui/button"
import type { Question } from "@/lib/db/schema"
import type { QuestionStat } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { useState, useTransition } from "react"

type Tab = "questions" | "results"

export function AdminDashboard({
  questions,
  stats,
  responseCount,
}: {
  questions: Question[]
  stats: QuestionStat[]
  responseCount: number
}) {
  const [tab, setTab] = useState<Tab>("questions")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [, start] = useTransition()

  function move(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= questions.length) return
    const ids = questions.map((q) => q.id)
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    start(() => {
      reorderQuestions(ids)
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
          {questions.length === 0 && !creating && (
            <p className="text-muted-foreground">
              No questions yet. Add your first one below.
            </p>
          )}

          {questions.map((q, i) =>
            editingId === q.id ? (
              <QuestionEditor key={q.id} question={q} onClose={() => setEditingId(null)} />
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
                    disabled={i === 0}
                    className="text-subtle transition-colors hover:text-foreground disabled:opacity-20"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => move(i, 1)}
                    disabled={i === questions.length - 1}
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
                    {KIND_LABELS[q.kind as keyof typeof KIND_LABELS]}
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
        <ResultsView stats={stats} />
      )}
    </div>
  )
}
