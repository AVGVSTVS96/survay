import {
  useCallback,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { KIND_LABELS, TITLE_LIMIT, type Question } from "../questions.ts";
import type { Api, Snapshot } from "./api.ts";
import { useLive } from "./browser.ts";
import { Button, cn } from "./button.tsx";
import { QuestionEditor } from "./editor.tsx";
import { ResultsView } from "./results.tsx";

type Tab = "questions" | "results";

export function Dashboard({ initial, api, sandbox }: { initial: Snapshot; api: Api; sandbox: boolean }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [tab, setTab] = useState<Tab>("questions");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordered, setOrdered] = useOptimistic(snapshot.survey.questions);
  const [reordering, start] = useTransition();
  const { survey, stats } = snapshot;

  const refresh = useCallback(() => {
    void api.refresh().then((next) => next && setSnapshot(next));
  }, [api]);
  useLive(sandbox ? noop : refresh);

  const change: Api["change"] = async (c) => {
    const res = await api.change(c);
    if (!("error" in res)) setSnapshot(res);
    return res;
  };

  function move(index: number, by: -1 | 1) {
    const next = [...ordered];
    [next[index], next[index + by]] = [next[index + by]!, next[index]!];
    setError(null);
    start(async () => {
      setOrdered(next);
      const res = await change({ type: "order", ids: next.map((q) => q.id) });
      if ("error" in res) setError(res.error);
    });
  }

  const rows = useFlip<HTMLDivElement>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 px-5 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg-display text-em text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            <span key={survey.responses} className="tabular-nums">
              {survey.responses} {survey.responses === 1 ? "response" : "responses"}
            </span>
            <span className="text-subtle"> · </span>
            <CopyLink />
          </p>
        </div>
        {!sandbox && (
          <form method="post" action="/api/logout">
            <button type="submit" className="quiet">
              Sign out
            </button>
          </form>
        )}
      </header>

      <div className="flex flex-col gap-8">
        <div role="tablist" className="flex gap-6 border-b border-border">
          {(["questions", "results"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
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
            <TitleField key={survey.title} title={survey.title} change={change} />

            {ordered.length === 0 && !creating && (
              <p className="text-muted-foreground">No questions yet. Add your first one below.</p>
            )}

            {error && (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            )}

            <div ref={rows} className="flex flex-col gap-4">
              {ordered.map((q, i) =>
                editingId === q.id ? (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    stat={stats.find((s) => s.question.id === q.id)}
                    change={change}
                    onClose={() => setEditingId((id) => (id === q.id ? null : id))}
                  />
                ) : (
                  <Row
                    key={q.id}
                    question={q}
                    first={i === 0}
                    last={i === ordered.length - 1}
                    busy={reordering}
                    onMove={(by) => move(i, by)}
                    onEdit={() => setEditingId(q.id)}
                  />
                ),
              )}
            </div>

            {creating ? (
              <QuestionEditor change={change} onClose={() => setCreating(false)} />
            ) : (
              <Button onClick={() => setCreating(true)} className="self-start">
                Add question
              </Button>
            )}
          </div>
        ) : survey.responses === 0 ? (
          <p className="text-muted-foreground">No responses yet.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {!sandbox && (
              <a href="/admin/export.csv" download className="quiet self-end">
                Export CSV
              </a>
            )}
            <ResultsView stats={stats} privateText={sandbox} />
          </div>
        )}
      </div>
    </main>
  );
}

const noop = () => {};

function Row({
  question,
  first,
  last,
  busy,
  onMove,
  onEdit,
}: {
  question: Question;
  first: boolean;
  last: boolean;
  busy: boolean;
  onMove: (by: -1 | 1) => void;
  onEdit: () => void;
}) {
  return (
    <div
      data-flip={question.id}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <div className="flex flex-col">
        <button
          type="button"
          aria-label="Move up"
          onClick={() => onMove(-1)}
          disabled={first || busy}
          className="press text-subtle hover:text-foreground disabled:opacity-20"
        >
          &uarr;
        </button>
        <button
          type="button"
          aria-label="Move down"
          onClick={() => onMove(1)}
          disabled={last || busy}
          className="press text-subtle hover:text-foreground disabled:opacity-20"
        >
          &darr;
        </button>
      </div>
      <button type="button" onClick={onEdit} className="group flex flex-1 flex-col gap-0.5 text-left">
        <span className="text-foreground text-pretty">{question.prompt}</span>
        <span className="text-muted-foreground">
          {KIND_LABELS[question.kind]}
          {question.required && <span className="text-subtle"> · Required</span>}
        </span>
      </button>
    </div>
  );
}

function useFlip<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const tops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>("[data-flip]") ?? [])];
    const next = new Map(items.map((el) => [el.dataset["flip"]!, el.getBoundingClientRect().top]));
    for (const el of items) {
      const before = tops.current.get(el.dataset["flip"]!);
      const after = next.get(el.dataset["flip"]!)!;
      if (before === undefined || before === after) continue;
      el.animate([{ transform: `translateY(${before - after}px)` }, { transform: "none" }], {
        duration: 260,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
    }
    tops.current = next;
  });

  return ref;
}

function TitleField({ title, change }: { title: string; change: Api["change"] }) {
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const dirty = value.trim() !== title;

  function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await change({ type: "title", title: value });
      if ("error" in res) setError(res.error);
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <label htmlFor="survey-title" className="text-muted-foreground">
        Title
      </label>
      <div className="flex items-center gap-2">
        <input
          id="survey-title"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={TITLE_LIMIT}
          placeholder="Shown above the first question (optional)"
          className="field"
        />
        {dirty && (
          <Button type="submit" disabled={saving} className="enter">
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
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(location.origin).then(() => setCopied(true))}
      onBlur={() => setCopied(false)}
      onMouseLeave={() => setCopied(false)}
      className="quiet"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
