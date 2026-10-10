import { useState, useTransition } from "react";

import {
  hasOptions,
  KIND_LABELS,
  KINDS,
  uniqueOptions,
  type Kind,
  type Question,
  type QuestionInput,
} from "../questions.ts";
import type { QuestionStat } from "../stats.ts";
import type { Change } from "../store.ts";
import type { Api } from "./api.ts";
import { Button, cn } from "./button.tsx";

type Draft = Omit<QuestionInput, "description" | "scaleMax"> & { description: string; scaleMax: number };

const toDraft = (q?: Question): Draft => ({
  kind: q?.kind ?? "single",
  prompt: q?.prompt ?? "",
  description: q?.description ?? "",
  options: q?.options.length ? q.options : ["", ""],
  scaleMax: q?.scaleMax ?? 5,
  multiline: q?.multiline ?? true,
  required: q?.required ?? false,
});

const toInput = (d: Draft): QuestionInput => ({
  ...d,
  description: d.description,
  options: hasOptions(d.kind) ? uniqueOptions(d.options) : [],
  scaleMax: d.kind === "rating" ? d.scaleMax : null,
});

function droppedAnswers(stat: QuestionStat | undefined, options: string[]) {
  if (stat?.kind !== "single" && stat?.kind !== "multi") return 0;
  return stat.options.filter((o) => !options.includes(o.label)).reduce((sum, o) => sum + o.count, 0);
}

const choice = (active: boolean) =>
  cn(
    "press rounded-lg border px-3 py-2",
    active
      ? "border-foreground bg-accent text-foreground text-em"
      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground disabled:opacity-40 disabled:hover:border-border",
  );

export function QuestionEditor({
  question,
  stat,
  change,
  onClose,
}: {
  question?: Question;
  stat?: QuestionStat | undefined;
  change: Api["change"];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(question));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"delete" | "drop" | null>(null);
  const [pending, start] = useTransition();

  const usesOptions = hasOptions(draft.kind);
  const kindLocked = (stat?.total ?? 0) > 0;
  const valid = draft.prompt.trim().length > 0 && (!usesOptions || uniqueOptions(draft.options).length >= 2);
  const dropped = question ? droppedAnswers(stat, toInput(draft).options) : 0;

  function run(c: Change) {
    setError(null);
    start(async () => {
      const res = await change(c);
      if ("error" in res) {
        setError(res.error);
        setConfirming(null);
      } else onClose();
    });
  }

  function save() {
    if (dropped > 0 && confirming !== "drop") return setConfirming("drop");
    run(
      question
        ? { type: "edit", id: question.id, question: toInput(draft) }
        : { type: "add", question: toInput(draft) },
    );
  }

  function edit(next: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...next }));
    setConfirming(null);
  }

  return (
    <div className="enter flex flex-col gap-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k: Kind) => (
          <button
            key={k}
            type="button"
            disabled={kindLocked && k !== question?.kind}
            onClick={() => edit({ kind: k })}
            className={choice(draft.kind === k)}
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
          aria-label="Question"
          className="field"
          autoFocus
        />
        <input
          value={draft.description}
          onChange={(e) => edit({ description: e.target.value })}
          placeholder="Description (optional)"
          aria-label="Description"
          className="field"
        />
      </div>

      {usesOptions && (
        <div className="flex flex-col gap-2">
          {draft.options.map((opt, i) => (
            <div key={i} className="enter flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => edit({ options: draft.options.with(i, e.target.value) })}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className="field"
              />
              <button
                type="button"
                aria-label="Remove option"
                onClick={() => edit({ options: draft.options.filter((_, idx) => idx !== i) })}
                disabled={draft.options.length <= 2}
                className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground disabled:opacity-30"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => edit({ options: [...draft.options, ""] })}
            className="quiet self-start"
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
                className={cn(choice(draft.scaleMax === n), "min-w-11")}
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
                className={choice(draft.multiline === o.multiline)}
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
            "flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors duration-200",
            draft.required ? "border-foreground bg-foreground" : "border-border",
          )}
        >
          <span
            className={cn(
              "h-3.5 w-3.5 rounded-full transition-transform duration-200 ease-out",
              draft.required ? "translate-x-4 bg-primary-foreground" : "translate-x-0 bg-muted-foreground",
            )}
          />
        </span>
        <span className={draft.required ? "text-foreground" : "text-muted-foreground"}>Required</span>
      </button>

      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      {confirming === "drop" && (
        <p role="alert" className="enter text-muted-foreground text-pretty">
          {dropped} {dropped === 1 ? "answer picked an option" : "answers picked options"} you removed or
          renamed. They&apos;ll stop showing in results.
        </p>
      )}

      {confirming === "delete" ? (
        <div
          key="confirm"
          className="enter flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
        >
          <span className="text-foreground">
            Delete this question
            {stat?.total ? ` and its ${stat.total} ${stat.total === 1 ? "answer" : "answers"}` : ""}?
          </span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setConfirming(null)} className="quiet">
              Keep it
            </button>
            <Button
              tone="danger"
              disabled={pending}
              onClick={() => question && run({ type: "delete", id: question.id })}
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
            <button type="button" onClick={onClose} className="quiet">
              Cancel
            </button>
            <Button onClick={save} disabled={!valid || pending}>
              {pending ? "Saving" : confirming === "drop" ? "Save anyway" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
