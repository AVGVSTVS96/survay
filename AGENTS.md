# survay

One survey, one question at a time: a Bun server, React pages rendered on the server, and one SQLite file, `data/survay.db`. See README.md.

## Check

```sh
bun run check   # typecheck + lint + format + tests; must pass
bun run fix     # autofix lint and format
bun run dev     # serve on :3000 and restart on changes
```

## Where things go

```
src/cli.ts         the survay command: serve, results, export, password
src/server.tsx     every route; renders <App> on the server and hydrates it with the same props
src/store.ts       the schema, its migrations (pragma user_version) and every SQL query
src/questions.ts   kinds, parseAnswer, parseQuestion: the only gate for what gets stored
src/stats.ts       results from answers, shared by the server, the dashboard sandbox and the CLI
src/report.ts      the terminal view of results, shared by the CLI and the website
src/ui/            client.tsx hydrates; app.tsx picks the page; api.ts is the dashboard's server and sandbox
test/              bun test: pure logic, the store on :memory:, and the server over HTTP
deploy/sprite.sh   ships a copy to a Fly.io Sprite
site/              the website, its own Vite+ project: cd site && bun run build
```

## Rules

- `data/` holds people's answers and stays out of git. Change it through `src/store.ts` or the CLI.
- Read results with `bun survay results --json` or `bun survay export`.
- A schema change is a new entry at the end of `migrations` in `src/store.ts`.
- The website's words come from `site/copy/MESSAGING.md`, its numbers from `site/copy/facts.json` (`bun site/copy/count.mjs`).
