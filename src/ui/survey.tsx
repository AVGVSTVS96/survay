import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { parseAnswer, TEXT_LIMIT, type Question } from "../questions.ts";
import type { QuestionStat } from "../stats.ts";
import type { Survey } from "../store.ts";
import { navigate, session, toParent, useSearch } from "./browser.ts";
import { Button, cn } from "./button.tsx";
import { MINE, ResultsView, type Mine } from "./results.tsx";

type Values = Record<number, unknown>;

const PROGRESS = "survay:answers";

const HINTS = {
  single: "Pick an answer to continue.",
  rating: "Pick a number to continue.",
  multi: "Pick at least one to continue.",
  text: "Write an answer to continue.",
};

type Status = "idle" | "sending" | "failed" | "done";

function submitOnEnter(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  const target = e.target as HTMLElement;
  if (
    target instanceof HTMLTextAreaElement
      ? !(e.metaKey || e.ctrlKey)
      : target.matches("input, button:not([role])")
  )
    return;
  e.preventDefault();
  e.currentTarget.requestSubmit();
}

export function SurveyForm({ survey, search, embed }: { survey: Survey; search: string; embed: boolean }) {
  const { questions } = survey;
  const params = new URLSearchParams(useSearch(search));
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pickTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [values, setValues] = useState<Values>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<QuestionStat[] | null>(null);
  const [mine, setMine] = useState<Mine>({});

  const total = questions.length;
  const answered = (q: Question) => parseAnswer(q, values[q.id]) !== null;
  const blocked = questions.findIndex((q) => q.required && !answered(q));
  const requested = Number(params.get("q")) - 1;
  const step = Math.min(
    Math.max(Number.isInteger(requested) ? requested : 0, 0),
    blocked === -1 ? total - 1 : blocked,
  );
  const current = questions[step];
  const isLast = step === total - 1;

  useEffect(() => {
    const saved = session.get(PROGRESS) as Values | null;
    // oxlint-disable-next-line react/set-state-in-effect -- sessionStorage only exists after hydration
    if (saved) setValues(saved);
  }, []);

  const shownStep = useRef(step);
  useEffect(() => {
    toParent({ type: "survay:progress", step, total, done: status === "done" });
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
  }, [step, total, status]);

  if (!current) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-lg-display text-em text-balance">Nothing here yet</p>
        <p className="text-muted-foreground text-pretty">
          This survey has no questions. Please check back soon.
        </p>
      </div>
    );
  }

  const shown = params.get("results") === "0" ? null : results;

  if (status === "done") {
    return (
      <div className="enter flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-lg-display text-em text-balance">Thank you</p>
          <p className="text-muted-foreground text-pretty">
            {shown
              ? "Here's how everyone answered so far."
              : embed
                ? "Your answers are in."
                : "Your response has been recorded. You can close this page."}
          </p>
        </div>
        {shown && <ResultsView stats={shown} mine={mine} />}
      </div>
    );
  }

  function goTo(index: number) {
    clearTimeout(pickTimer.current);
    setMessage(null);
    const next = new URLSearchParams(params);
    next.set("q", String(index + 1));
    navigate(`?${next}`, { replace: embed });
  }

  function answer(value: unknown) {
    const next = { ...values, [current!.id]: value };
    setValues(next);
    setMessage(null);
    session.set(PROGRESS, next);
  }

  function pick() {
    if (isLast) return;
    clearTimeout(pickTimer.current);
    pickTimer.current = setTimeout(() => goTo(step + 1), 220);
  }

  async function advance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (current!.required && !answered(current!)) return setMessage(HINTS[current!.kind]);
    if (!isLast) return goTo(step + 1);

    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shown: questions.map((q) => q.id),
          answers: values,
          website: new FormData(e.currentTarget).get("website"),
        }),
      });
      const body = (await res.json()) as { error?: string; results?: QuestionStat[] | null };
      if (!res.ok) {
        setStatus("idle");
        setMessage(body.error ?? "Something went wrong. Try again.");
        if (res.status === 409) location.reload();
        return;
      }
      session.set(PROGRESS, null);
      session.set(MINE, values);
      setMine(values);
      setResults(body.results ?? null);
      setStatus("done");
      const next = new URLSearchParams(params);
      next.delete("q");
      navigate(next.size ? `?${next}` : "", { replace: true });
    } catch {
      setStatus("failed");
      setMessage("Couldn't send your answers. Check your connection and try again.");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {survey.title && <p className="text-muted-foreground">{survey.title}</p>}
      <form onSubmit={(e) => void advance(e)} onKeyDown={submitOnEnter} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="tabular-nums">
              {step + 1} / {total}
            </span>
            {current.required && <span className="text-subtle">Required</span>}
          </div>
          <div className="h-px w-full bg-border" aria-hidden>
            <div
              className="h-px bg-foreground transition-[width] duration-500 ease-out"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div key={current.id} className="enter flex flex-col gap-6">
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
          <p role="alert" className="enter text-muted-foreground text-pretty">
            {message}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className="quiet press disabled:opacity-0"
          >
            Back
          </button>
          <Button type="submit" disabled={status === "sending"} className="px-6">
            {status === "sending"
              ? "Sending"
              : !isLast
                ? "Continue"
                : status === "failed"
                  ? "Try again"
                  : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  question: Question;
  value: unknown;
  labelledBy: string;
  onChange: (value: unknown) => void;
  onPick?: () => void;
};

const STEPS: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

function arrowKeys(select: boolean) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    const by = STEPS[e.key];
    if (!by) return;
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio],[role=checkbox]")];
    const next =
      items[(items.indexOf(document.activeElement as HTMLButtonElement) + by + items.length) % items.length];
    if (!next) return;
    e.preventDefault();
    next.focus();
    if (select) next.click();
  };
}

const isPointer = (e: MouseEvent) => e.detail > 0;

export function QuestionField({ question, value, labelledBy, onChange, onPick }: FieldProps) {
  switch (question.kind) {
    case "single":
      return (
        <div
          role="radiogroup"
          aria-labelledby={labelledBy}
          onKeyDown={arrowKeys(true)}
          className="flex flex-col gap-2"
        >
          {question.options.map((opt, i) => (
            <Choice
              key={opt}
              label={opt}
              role="radio"
              checked={value === opt}
              tabbable={value === opt || (!question.options.includes(value as string) && i === 0)}
              onClick={(e) => {
                onChange(opt);
                if (isPointer(e)) onPick?.();
              }}
            />
          ))}
        </div>
      );

    case "multi": {
      const picked = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div
          role="group"
          aria-labelledby={labelledBy}
          onKeyDown={arrowKeys(false)}
          className="flex flex-col gap-2"
        >
          {question.options.map((opt) => {
            const checked = picked.includes(opt);
            return (
              <Choice
                key={opt}
                label={opt}
                role="checkbox"
                checked={checked}
                tabbable
                onClick={() => onChange(checked ? picked.filter((o) => o !== opt) : [...picked, opt])}
              />
            );
          })}
        </div>
      );
    }

    case "rating": {
      const max = question.scaleMax ?? 5;
      return (
        <div
          role="radiogroup"
          aria-labelledby={labelledBy}
          onKeyDown={arrowKeys(true)}
          className="flex flex-wrap gap-2"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const active = value === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${n} of ${max}`}
                tabIndex={active || (typeof value !== "number" && n === 1) ? 0 : -1}
                onClick={(e) => {
                  onChange(n);
                  if (isPointer(e)) onPick?.();
                }}
                className={cn(
                  "press flex h-12 min-w-12 flex-1 items-center justify-center rounded-lg border tabular-nums active:scale-[0.96]",
                  active
                    ? "border-foreground bg-foreground text-primary-foreground text-em"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      );
    }

    case "text": {
      const props = {
        "aria-labelledby": labelledBy,
        value: typeof value === "string" ? value : "",
        maxLength: TEXT_LIMIT,
        placeholder: "Type your answer",
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      };
      return question.multiline ? (
        <textarea {...props} rows={4} className="field resize-none" />
      ) : (
        <input {...props} className="field" />
      );
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
  label: string;
  role: "radio" | "checkbox";
  checked: boolean;
  tabbable: boolean;
  onClick: (e: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      tabIndex={tabbable ? 0 : -1}
      onClick={onClick}
      className={cn(
        "press group flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left active:scale-[0.99]",
        checked
          ? "border-foreground bg-accent text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-150",
          role === "radio" ? "rounded-full" : "rounded",
          checked ? "border-foreground bg-foreground" : "border-subtle group-hover:border-foreground/60",
        )}
      >
        <span
          className={cn(
            "bg-primary-foreground transition-[transform,opacity] duration-200 ease-out",
            role === "radio" ? "h-2 w-2 rounded-full" : "h-2.5 w-2.5 rounded-[2px]",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        />
      </span>
      <span className={cn(checked && "text-em")}>{label}</span>
    </button>
  );
}
