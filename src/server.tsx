import tailwind from "bun-plugin-tailwind";
import { renderToString } from "react-dom/server";

import { sessions, secure } from "./auth.ts";
import { toCsv } from "./csv.ts";
import { parseAnswer } from "./questions.ts";
import { computeStats, withoutText } from "./stats.ts";
import { parseChange, type Store, type Survey } from "./store.ts";
import { App, type Props } from "./ui/app.tsx";

export type Options = {
  store: Store;
  password: string;
  port: number;
  publicResults: boolean;
  demo: boolean;
};

type Req = Bun.BunRequest;

const root = new URL("..", import.meta.url).pathname;

async function bundle() {
  const build = await Bun.build({
    entrypoints: [`${root}src/ui/client.tsx`],
    plugins: [tailwind],
    minify: process.env.NODE_ENV === "production",
    naming: "[name]-[hash].[ext]",
    define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production") },
  });
  if (!build.success) throw new AggregateError(build.logs, "The client failed to build.");
  const files = new Map(build.outputs.map((o) => [`/assets/${o.path.replace(/^\.\//, "")}`, o]));
  const find = (ext: string) => [...files.keys()].find((path) => path.endsWith(ext))!;
  return { files, js: find(".js"), css: find(".css") };
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

const fail = (error: string, status: number) => json({ error }, status);

const embedded = (req: Req) => new URL(req.url).searchParams.get("embed") === "1";

async function readJson(req: Req): Promise<unknown> {
  if (!req.headers.get("content-type")?.startsWith("application/json")) return null;
  return req.json().catch(() => null);
}

export async function serve({ store, password, port, publicResults, demo }: Options) {
  const assets = await bundle();
  const auth = sessions(password);
  const live = new Set<ReadableStreamDefaultController<string>>();

  const broadcast = () => {
    for (const client of live) client.enqueue("event: change\ndata: {}\n\n");
  };

  const snapshot = (survey: Survey = store.survey()) => ({
    survey,
    stats: computeStats(survey.questions, store.answers()),
  });

  const publicSnapshot = () => {
    const { survey, stats } = snapshot();
    const questions = survey.questions.filter((q) => q.kind !== "text");
    return { survey: { ...survey, questions }, stats: stats.filter((s) => s.kind !== "text") };
  };

  function page(req: Req, props: Props, head: { title: string; description?: string }) {
    const html = renderToString(<App {...props} />);
    const url = new URL(req.url);
    const origin = `${secure(req) ? "https" : url.protocol.slice(0, -1)}://${req.headers.get("host") ?? url.host}`;
    const meta = [
      `<title>${escapeHtml(head.title)}</title>`,
      head.description && `<meta name="description" content="${escapeHtml(head.description)}">`,
      `<meta property="og:title" content="${escapeHtml(head.title)}">`,
      head.description && `<meta property="og:description" content="${escapeHtml(head.description)}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:url" content="${escapeHtml(origin + url.pathname)}">`,
      `<meta property="og:image" content="${origin}/og.png">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta name="twitter:card" content="summary_large_image">`,
    ];
    const document = `<!doctype html>
<html lang="en"${props.embed ? " data-embed" : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fcfcfa">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1c1b1a">
${meta.filter(Boolean).join("\n")}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/geist-var.woff2" as="font" type="font/woff2" crossorigin>
<style>@font-face{font-family:Geist;src:url(/fonts/geist-var.woff2) format("woff2");font-weight:100 900;font-display:swap}</style>
<link rel="stylesheet" href="${assets.css}">
<script type="module" src="${assets.js}"></script>
</head>
<body>
<div id="root">${html}</div>
<script id="props" type="application/json">${JSON.stringify(props).replace(/</g, "\\u003c")}</script>
</body>
</html>`;
    return new Response(document, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const dashboard = (req: Req, sandbox: boolean) => {
    const answers = sandbox
      ? store.answers().filter((a) => typeof a.value !== "string" || !isText(a.questionId))
      : null;
    const response = page(
      req,
      {
        view: "dashboard",
        embed: embedded(req),
        snapshot: sandbox ? sandboxSnapshot() : snapshot(),
        answers,
      },
      { title: "Dashboard" },
    );
    if (!sandbox) response.headers.set("content-security-policy", "frame-ancestors 'none'");
    return response;
  };

  const isText = (id: number) => store.survey().questions.find((q) => q.id === id)?.kind === "text";

  const sandboxSnapshot = () => {
    const { survey, stats } = snapshot();
    return { survey, stats: withoutText(stats) };
  };

  const admin =
    (handler: (req: Req) => Response | Promise<Response>) =>
    (req: Req): Response | Promise<Response> =>
      auth.valid(req) ? handler(req) : fail("Sign in first.", 401);

  const server = Bun.serve({
    port,
    development: false,
    routes: {
      "/": (req) => {
        const survey = store.survey();
        const n = survey.questions.length;
        return page(
          req,
          { view: "survey", embed: embedded(req), survey, search: new URL(req.url).search },
          {
            title: survey.title || "survay",
            description: `${n} ${n === 1 ? "question" : "questions"}, one at a time.`,
          },
        );
      },

      "/results": (req) => {
        if (!publicResults) return new Response("Not found", { status: 404 });
        const results = publicSnapshot();
        return page(
          req,
          { view: "results", embed: embedded(req), snapshot: results },
          {
            title: results.survey.title ? `${results.survey.title} · results` : "Results",
            description: `${results.survey.responses} responses so far.`,
          },
        );
      },

      "/admin": (req) =>
        auth.valid(req)
          ? dashboard(req, false)
          : page(req, { view: "login", embed: false }, { title: "Dashboard" }),

      "/admin/try": (req) => (demo ? dashboard(req, true) : new Response("Not found", { status: 404 })),

      "/admin/export.csv": admin(() => {
        const csv = toCsv(store.survey().questions, store.responses());
        return new Response(`\uFEFF${csv}`, {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="survay-${new Date().toISOString().slice(0, 10)}.csv"`,
            "cache-control": "no-store",
          },
        });
      }),

      "/api/responses": {
        POST: async (req) => {
          const input = (await readJson(req)) as {
            shown?: unknown;
            answers?: unknown;
            website?: unknown;
          } | null;
          if (!input) return fail("Send JSON.", 415);
          const shown = new Set(Array.isArray(input.shown) ? input.shown : []);
          const given = (input.answers ?? {}) as Record<string, unknown>;
          const parsed = store
            .survey()
            .questions.filter((q) => shown.has(q.id))
            .map((q) => ({ q, value: parseAnswer(q, given[q.id]) }));

          if (parsed.some(({ q, value }) => q.required && value === null))
            return fail("This survey just changed. Please check your answers.", 409);

          const answers = parsed.flatMap(({ q, value }) =>
            value === null ? [] : [{ questionId: q.id, value }],
          );
          if (!input.website && answers.length > 0) {
            store.respond(answers);
            broadcast();
          }
          return json({ results: publicResults ? publicSnapshot().stats : null });
        },
      },

      "/api/results": () => (publicResults ? json(publicSnapshot()) : fail("Not found", 404)),

      "/api/live": (req) => {
        if (!publicResults && !auth.valid(req)) return fail("Sign in first.", 401);
        server.timeout(req, 0);
        let self: ReadableStreamDefaultController<string>;
        const stream = new ReadableStream<string>({
          start(controller) {
            self = controller;
            live.add(controller);
            controller.enqueue(": live\n\n");
          },
          cancel() {
            live.delete(self);
          },
        });
        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-store",
            connection: "keep-alive",
          },
        });
      },

      "/api/admin": {
        GET: admin(() => json(snapshot())),
        POST: admin(async (req) => {
          const input = await readJson(req);
          if (input === null) return fail("Send JSON.", 415);
          const change = parseChange(input);
          if (!change) return fail("That change doesn't make sense.", 422);
          const error = store.change(change);
          if (error) return fail(error, 422);
          broadcast();
          return json(snapshot());
        }),
      },

      "/api/login": {
        POST: async (req) => {
          const input = (await readJson(req)) as { password?: unknown } | null;
          if (!auth.check(input?.password)) return fail("Incorrect password.", 401);
          auth.start(req);
          return json({ ok: true });
        },
      },

      "/api/logout": {
        POST: (req) => {
          auth.end(req);
          return Response.redirect("/admin", 303);
        },
      },

      "/favicon.svg": Bun.file(`${root}public/favicon.svg`),
      "/apple-touch-icon.png": Bun.file(`${root}public/apple-touch-icon.png`),
      "/og.png": Bun.file(`${root}public/og.png`),
      "/fonts/geist-var.woff2": new Response(Bun.file(`${root}public/fonts/geist-var.woff2`), {
        headers: { "cache-control": "public, max-age=31536000, immutable" },
      }),
      "/assets/*": (req) => {
        const file = assets.files.get(new URL(req.url).pathname);
        return file
          ? new Response(file, { headers: { "cache-control": "public, max-age=31536000, immutable" } })
          : new Response("Not found", { status: 404 });
      },
    },
    fetch: () => new Response("Not found", { status: 404 }),
  });

  return server;
}
