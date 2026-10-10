import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

import type { AnswerRow } from "../stats.ts";
import type { Survey } from "../store.ts";
import { sandbox, server, type Snapshot } from "./api.ts";
import { session, toParent, useEmbed, useLive } from "./browser.ts";
import { Button } from "./button.tsx";
import { Dashboard } from "./dashboard.tsx";
import { MINE, ResultsView, type Mine } from "./results.tsx";
import { SurveyForm } from "./survey.tsx";

export type Props = { embed: boolean } & (
  | { view: "survey"; survey: Survey; search: string }
  | { view: "results"; snapshot: Snapshot }
  | { view: "dashboard"; snapshot: Snapshot; answers: AnswerRow[] | null }
  | { view: "login" }
);

export function App(props: Props) {
  useEmbed(props.embed);

  switch (props.view) {
    case "survey":
      return (
        <Shell embed={props.embed}>
          <SurveyForm survey={props.survey} search={props.search} embed={props.embed} />
        </Shell>
      );
    case "results":
      return <Results initial={props.snapshot} embed={props.embed} />;
    case "dashboard":
      return (
        <Dashboard
          initial={props.snapshot}
          api={props.answers ? sandbox(props.snapshot, props.answers) : server}
          sandbox={props.answers !== null}
        />
      );
    case "login":
      return (
        <Shell embed={props.embed}>
          <Login />
        </Shell>
      );
  }
}

function Shell({ embed, wide = false, children }: { embed: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <main
      className={
        embed
          ? "flex w-full flex-col gap-10"
          : `mx-auto flex min-h-dvh w-full flex-col gap-10 px-5 py-12 ${wide ? "max-w-2xl" : "max-w-md justify-center"}`
      }
    >
      {children}
    </main>
  );
}

function Results({ initial, embed }: { initial: Snapshot; embed: boolean }) {
  const [{ survey, stats }, setSnapshot] = useState(initial);
  const [mine, setMine] = useState<Mine>({});

  const refresh = useCallback(() => {
    void fetch("/api/results")
      .then((res) => (res.ok ? (res.json() as Promise<Snapshot>) : null))
      .then((next) => next && setSnapshot(next))
      .catch(() => {});
  }, []);
  useLive(refresh);

  useEffect(() => toParent({ type: "survay:results", survey, stats }), [survey, stats]);

  useEffect(() => {
    const read = () => setMine((session.get(MINE) as Mine | null) ?? {});
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MINE) return;
      read();
      refresh();
    };
    read();
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  }, [refresh]);

  return (
    <Shell embed={embed} wide>
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg-display text-em text-foreground text-balance">
            {survey.title || "Results"}
          </h1>
          <p className="text-muted-foreground tabular-nums">
            {survey.responses} {survey.responses === 1 ? "response" : "responses"}
          </p>
        </div>
        {!embed && (
          <a href="/" className="quiet">
            Take the survey
          </a>
        )}
      </header>
      {survey.responses === 0 ? (
        <p className="text-muted-foreground">No responses yet.</p>
      ) : (
        <ResultsView stats={stats} mine={mine} />
      )}
    </Shell>
  );
}

function Login() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) return location.reload();
    setPending(false);
    setError(res ? "Incorrect password." : "Couldn't reach the server. Try again.");
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg-display text-em text-foreground text-balance">Dashboard</h1>
        <p className="text-muted-foreground text-pretty">
          Enter your password to edit the survey and read the answers.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <input
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          className="field"
        />
        {error && (
          <p role="alert" className="enter text-muted-foreground">
            {error}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Checking" : "Enter"}
      </Button>

      <p className="text-subtle text-pretty">
        Lost it? <code className="text-muted-foreground">bun survay password</code> prints it wherever survay
        runs.
      </p>
    </form>
  );
}
