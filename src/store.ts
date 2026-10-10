import { Database } from "bun:sqlite";

import { demo } from "./demo.ts";
import type { ResponseRow } from "./csv.ts";
import { parseQuestion, TITLE_LIMIT, type Question, type QuestionInput, type Value } from "./questions.ts";
import type { AnswerRow } from "./stats.ts";

export type Survey = { title: string; questions: Question[]; responses: number };

export type Change =
  | { type: "title"; title: string }
  | { type: "add"; question: unknown }
  | { type: "edit"; id: number; question: unknown }
  | { type: "delete"; id: number }
  | { type: "order"; ids: number[] };

export function parseChange(raw: unknown): Change | null {
  const c = (raw ?? {}) as Record<string, unknown>;
  const id = Number.isInteger(c["id"]) ? (c["id"] as number) : null;
  switch (c["type"]) {
    case "title":
      return typeof c["title"] === "string" ? { type: "title", title: c["title"] } : null;
    case "add":
      return { type: "add", question: c["question"] };
    case "edit":
      return id === null ? null : { type: "edit", id, question: c["question"] };
    case "delete":
      return id === null ? null : { type: "delete", id };
    case "order":
      return Array.isArray(c["ids"]) && c["ids"].every(Number.isInteger)
        ? { type: "order", ids: c["ids"] }
        : null;
    default:
      return null;
  }
}

const migrations = [
  `create table survey (
     id integer primary key check (id = 1),
     title text not null default ''
   );
   create table questions (
     id integer primary key,
     kind text not null check (kind in ('single', 'multi', 'rating', 'text')),
     prompt text not null,
     description text,
     options text not null default '[]',
     scale_max integer,
     multiline integer not null default 1,
     required integer not null default 0,
     position integer not null default 0
   );
   create table responses (
     id integer primary key,
     created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ'))
   );
   create table answers (
     response_id integer not null references responses (id) on delete cascade,
     question_id integer not null references questions (id) on delete cascade,
     value text not null,
     primary key (response_id, question_id)
   ) without rowid;
   create index answers_by_question on answers (question_id);`,
];

type QuestionRow = Omit<Question, "options" | "multiline" | "required"> & {
  options: string;
  multiline: number;
  required: number;
};

const toQuestion = ({ options, multiline, required, ...row }: QuestionRow): Question => ({
  ...row,
  options: JSON.parse(options),
  multiline: multiline === 1,
  required: required === 1,
});

const columns = (q: QuestionInput) => ({
  kind: q.kind,
  prompt: q.prompt,
  description: q.description,
  options: JSON.stringify(q.options),
  scaleMax: q.scaleMax,
  multiline: q.multiline ? 1 : 0,
  required: q.required ? 1 : 0,
});

export function open(path: string) {
  const db = new Database(path, { create: true, strict: true });
  db.run("pragma journal_mode = wal");
  db.run("pragma foreign_keys = on");
  db.run("pragma busy_timeout = 5000");

  const { user_version: version } = db.query("pragma user_version").get() as { user_version: number };
  db.transaction(() => {
    for (const sql of migrations.slice(version)) db.run(sql);
    db.run(`pragma user_version = ${migrations.length}`);
  })();

  const questions = () =>
    (
      db
        .query(
          `select id, kind, prompt, description, options, scale_max as scaleMax, multiline, required
           from questions order by position, id`,
        )
        .all() as QuestionRow[]
    ).map(toQuestion);

  const answered = (id: number) =>
    db.query("select 1 from answers where question_id = ? limit 1").get(id) !== null;

  const insert = (q: QuestionInput) =>
    db
      .query(
        `insert into questions (kind, prompt, description, options, scale_max, multiline, required, position)
         values ($kind, $prompt, $description, $options, $scaleMax, $multiline, $required,
                 (select coalesce(max(position), -1) + 1 from questions))`,
      )
      .run(columns(q));

  const apply = db.transaction((change: Change): string | null => {
    switch (change.type) {
      case "title":
        db.query(
          "insert into survey (id, title) values (1, ?) on conflict (id) do update set title = excluded.title",
        ).run(change.title.trim().slice(0, TITLE_LIMIT));
        return null;
      case "add": {
        const q = parseQuestion(change.question);
        if (typeof q === "string") return q;
        insert(q);
        return null;
      }
      case "edit": {
        const q = parseQuestion(change.question);
        if (typeof q === "string") return q;
        const existing = db.query("select kind from questions where id = ?").get(change.id) as {
          kind: string;
        } | null;
        if (!existing) return "This question was already deleted.";
        if (existing.kind !== q.kind && answered(change.id))
          return "This question already has answers, so its type can't change.";
        db.query(
          `update questions set kind = $kind, prompt = $prompt, description = $description, options = $options,
             scale_max = $scaleMax, multiline = $multiline, required = $required where id = $id`,
        ).run({ ...columns(q), id: change.id });
        return null;
      }
      case "delete":
        db.query("delete from questions where id = ?").run(change.id);
        return null;
      case "order": {
        const move = db.query("update questions set position = $position where id = $id");
        for (const [position, id] of change.ids.entries()) move.run({ position, id });
        return null;
      }
    }
  });

  return {
    path,

    survey(): Survey {
      const title = db.query("select title from survey").get() as { title: string } | null;
      const { n } = db.query("select count(*) as n from responses").get() as { n: number };
      return { title: title?.title ?? "", questions: questions(), responses: n };
    },

    answers(): AnswerRow[] {
      return (
        db.query("select question_id as questionId, value from answers order by response_id desc").all() as {
          questionId: number;
          value: string;
        }[]
      ).map((a) => ({ questionId: a.questionId, value: JSON.parse(a.value) }));
    },

    responses(): ResponseRow[] {
      const rows = db.query("select id, created_at as createdAt from responses order by id").all() as {
        id: number;
        createdAt: string;
      }[];
      const answers = db.query("select response_id as id, question_id as q, value from answers").all() as {
        id: number;
        q: number;
        value: string;
      }[];
      const byResponse = Map.groupBy(answers, (a) => a.id);
      return rows.map(({ id, createdAt }) => ({
        id,
        createdAt,
        answers: new Map((byResponse.get(id) ?? []).map((a) => [a.q, JSON.parse(a.value)])),
      }));
    },

    respond: db.transaction((answers: { questionId: number; value: Value }[]) => {
      const { id } = db.query("insert into responses default values returning id").get() as { id: number };
      const add = db.query("insert into answers (response_id, question_id, value) values ($id, $q, $value)");
      for (const a of answers) add.run({ id, q: a.questionId, value: JSON.stringify(a.value) });
    }),

    change: (change: Change) => apply(change),

    seed(): boolean {
      if (questions().length > 0) return false;
      db.transaction(() => {
        apply({ type: "title", title: demo.title });
        for (const q of demo.questions) insert(q);
      })();
      return true;
    },

    close: () => db.close(),
  };
}

export type Store = ReturnType<typeof open>;
