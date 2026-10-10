import { useState } from "react";

import { KIND_LABELS } from "../questions.ts";
import type { QuestionStat } from "../stats.ts";
import { cn } from "./button.tsx";

export const MINE = "survay:mine";

export type Mine = Record<number, unknown>;

const NONE: Mine = {};

const PAGE = 5;

const picked = (mine: unknown, label: string) =>
  Array.isArray(mine) ? mine.includes(label) : String(mine) === label;

function Bar({
  label,
  count,
  total,
  yours,
}: {
  label: string;
  count: number;
  total: number;
  yours: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("flex items-baseline gap-2 text-foreground", yours && "text-em")}>
          {label}
          {yours && (
            <span className="enter text-subtle" style={{ fontWeight: 400 }}>
              you
            </span>
          )}
        </span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {count}
          <span className="text-subtle"> · {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div
          className="grow-x h-full rounded-full bg-foreground transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ResultsView({
  stats,
  mine = NONE,
  privateText = false,
}: {
  stats: QuestionStat[];
  mine?: Mine;
  privateText?: boolean;
}) {
  if (stats.length === 0) return <p className="text-muted-foreground">No questions yet.</p>;

  return (
    <div className="flex flex-col gap-8">
      {stats.map((s) => (
        <section key={s.question.id} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-em text-pretty">{s.question.prompt}</h2>
            <p className="text-muted-foreground">
              {KIND_LABELS[s.kind]}
              <span className="text-subtle">
                {" · "}
                {s.total} {s.total === 1 ? "answer" : "answers"}
              </span>
            </p>
          </div>

          {(s.kind === "single" || s.kind === "multi") && (
            <div className="flex flex-col gap-3">
              {s.options.map((o) => (
                <Bar
                  key={o.label}
                  label={o.label}
                  count={o.count}
                  total={s.total}
                  yours={s.question.id in mine && picked(mine[s.question.id], o.label)}
                />
              ))}
            </div>
          )}

          {s.kind === "rating" && (
            <div className="flex flex-col gap-4">
              <p className="text-foreground">
                <span className="text-lg-display text-em tabular-nums">{s.average || "–"}</span>
                <span className="text-muted-foreground"> average of {s.max}</span>
              </p>
              <div className="flex flex-col gap-3">
                {s.buckets.map((b) => (
                  <Bar
                    key={b.label}
                    label={b.label}
                    count={b.count}
                    total={s.total}
                    yours={s.question.id in mine && picked(mine[s.question.id], b.label)}
                  />
                ))}
              </div>
            </div>
          )}

          {s.kind === "text" &&
            (privateText ? (
              <p className="text-subtle">Text answers stay private in the demo.</p>
            ) : (
              <TextAnswers samples={s.samples} />
            ))}
        </section>
      ))}
    </div>
  );
}

function TextAnswers({ samples }: { samples: string[] }) {
  const [shown, setShown] = useState(PAGE);

  if (samples.length === 0) return <p className="text-muted-foreground">No answers yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {samples.slice(0, shown).map((text, i) => (
        <p
          key={i}
          className="rounded-lg border border-border bg-card px-4 py-3 text-foreground text-pretty whitespace-pre-line break-words"
        >
          {text}
        </p>
      ))}
      {shown < samples.length && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="quiet self-start">
          Show more
          <span className="text-subtle"> · {samples.length - shown} left</span>
        </button>
      )}
    </div>
  );
}
