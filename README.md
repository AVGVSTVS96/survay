<h1><picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/header-dark.png">
  <img src=".github/header-light.png" alt="survay" width="838">
</picture></h1>

**A small survey app you run yourself.** One survey, one question at a time, and one SQLite file that holds every answer.

[Website](https://survay-site.vercel.app) · [Demo](https://survay-b3zbd.sprites.app) · [Start](#start) · [Put it online](#put-it-online)

![survay](.github/screenshot.png)

It's a template you own, not a service you sign up for: about 2,200 lines of TypeScript on [Bun](https://bun.sh), with Bun's built-in SQLite, in your own repo next to your own answers.

- Four question kinds: multiple choice, checkboxes, rating, text
- Keyboard friendly, resumable on refresh, works on phones
- A dashboard to write the survey and read results as they come in, with CSV export
- `survay results` prints the answers in your terminal

## Start

You need [Bun](https://bun.sh).

```sh
gh repo create my-survay --template AVGVSTVS96/survay --private --clone
cd my-survay && bun install && bun survay
```

```
survay is running

  survey     http://localhost:3000
  dashboard  http://localhost:3000/admin
  password   cZl55Bb04XuHZGp1z23UxjYJ  (saved in data/password)
  answers    data/survay.db  (starts with the demo survey)
```

Open `/admin` with that password. The demo survey is waiting; make it yours.

## Put it online

- **On a [Sprite](https://docs.fly.io/sprites):** `deploy/sprite.sh my-survay` creates it, copies your code, starts survay and prints the public URL and password. A Sprite sleeps when nobody's answering, so it costs nothing while idle, and wakes on the next visit. Answers stay on its disk in `~/survay-data`. Run the script again to ship changes.
- **On any computer with a disk:** run `bun survay` and put HTTPS in front of it, with [Tailscale Funnel](https://tailscale.com/kb/1223/funnel) (`tailscale funnel 3000`), a Cloudflare Tunnel or your own reverse proxy.

## Use

```
survay               start the survey (same as survay serve)
survay serve         --port n, or PORT; 3000 by default
survay results       how everyone answered, in the terminal  (--json for scripts and agents)
survay export        every response as CSV, to stdout
survay password      the dashboard password
```

In your copy it's `bun survay results`; on a Sprite, `sprite exec -s my-survay -- survay results`.

## Options

Put these in `.env` (the deploy script ships it too):

| env                | what it does                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `PUBLIC_RESULTS=1` | Shows everyone the results on `/results` and after they submit. Text answers stay private.    |
| `ADMIN_PASSWORD`   | Your own dashboard password instead of the generated one. Changing it signs everyone out.     |
| `PORT`             | The port to serve on, 3000 by default.                                                        |
| `SURVAY_DATA`      | The folder for `survay.db` and `password`, `data/` by default.                                |
| `DEMO=1`           | Adds `/admin/try`, the dashboard in a sandbox that saves nothing. The survay website uses it. |

Add `?embed=1` to `/` or `/results` to show it in an iframe: the page drops its padding and posts `{ type: "survay:height", height }` to the parent window.

## How it works

```
src/
  cli.ts          the survay command
  server.tsx      Bun.serve: each page rendered on the server, a small JSON API, live updates
  store.ts        the schema, its migrations and every SQL query
  questions.ts    question kinds and the checks every answer and question goes through
  stats.ts        results from answers; report.ts prints them for the terminal
  ui/             the React pages: survey, results, dashboard
data/             your answers and password, kept out of git
deploy/sprite.sh  puts your copy on a Sprite
site/             the website
```

- **One file.** `data/survay.db` is SQLite in WAL mode. Back it up by copying it, or with `sprite checkpoint create` on a Sprite.
- **Answers are checked on the server** against their question, so a crafted answer can't break the results.
- **Results are live.** When anyone answers, the server sends a one-line event to open results pages and dashboards, and they fetch the new numbers.
- **No build step.** `bun survay` bundles the pages with Tailwind in about 60ms when it starts.

## License

MIT
