# survay: messaging

Source of truth for the site's words. Numbers come from `facts.json` (run `node site/copy/count.mjs` after the build lands; the line count will move).

## Positioning

survay is a small survey app you deploy yourself: one survey, one question at a time, with a dashboard for the results.

## Hero

**One survey, one question at a time.**

A small survey app you deploy yourself, with its own dashboard and your own database.

- Frame caption: `This is the real app. Go ahead, answer it.`
- Zoom control: `Zoom in` / `Zoom out` (aria-label: `Open the survey full screen` / `Close full screen`)

## Sections

### 1. Results

**See how everyone answered.**

The demo's results are public. Answer the survey above and your vote is in there.

Text answers stay hidden on the public page.

### 2. Questions

**Write it in the dashboard.**

Pick one of four kinds, write the prompt, move it up or down.

### 3. Self-host

**One survey per deploy. That's the point.**

Your copy runs on your Vercel account with your own database.

1. Click Deploy. Vercel copies the repo, adds a Neon database and asks for an `ADMIN_PASSWORD`. Make it long and random.
2. Open `/admin`. The demo survey is waiting; make it yours.

### Footer

`MIT licensed. Source on GitHub.`

## CTA labels

| where | label | goes to |
| --- | --- | --- |
| hero, primary | `Deploy your own` | #self-host |
| hero, secondary | `GitHub` | github.com/AVGVSTVS96/survay |
| dashboard frame | `Try it. Nothing here is saved.` | (label on the rebuilt editor) |
| results section | `Open full results` | demo `/results` |
| self-host | Vercel's own Deploy button image, alt `Deploy to Vercel` | Vercel clone URL |
| footer | `GitHub` | github.com/AVGVSTVS96/survay |

## Meta

- Title: `survay: a small survey app you host yourself`
- Description: `One survey per deploy, one question at a time. Deploy to Vercel with your own database. MIT.`

## OG image

- `survay`
- `One survey, one question at a time.`
- Visual: the demo's first question, "Are you scared about AI?", with its four options as the real form shows them.

## Alt text

- Hero frame (iframe `title`): `The survay demo survey, running live`
- Results frame (iframe `title`): `Public results for the demo survey`
- Question editor visual: `The survay dashboard, editing a multiple choice question`
- Wordmark: `survay`
- Deploy button: `Deploy to Vercel`
- OG image: `survay. One survey, one question at a time.`

## Demo survey (verbatim, keep as is)

1. **Are you scared about AI?** (multiple choice, required): yep / nah / its a fucking computer bro stfu / sillycon mafia
2. **bruh..** (multiple choice, required): what bro?! relax.. smh.. / chill dude.
3. **write a 1200 page essay on mannerisms and honeybees** (text, optional), description `zip it! 🤐`
4. **how do you feel about cheeseburgers disappearing from existence?** (checkboxes, required): fucking terrified mate / a little bothered but i’ll survive / couldnt care less mate

The live deploy still reads "about about" in question 4; the seed fixes it.

## X launch post (draft)

Follows `x-pipeline/08-writing-style-guide.md` (T1). Media: 10s screen recording of answering the demo, then the results filling in.

```
found a survey app i'd left in a private repo, so i finished it and open sourced it

> one survey per deploy, one question at a time
> 4 question kinds: multiple choice, checkboxes, rating, text
> dashboard for editing questions and reading results, with csv export
> deploy to vercel with your own neon database

about 1,200 lines of code. the demo asks how you feel about cheeseburgers disappearing from existence

link in replies
```

First reply: `https://github.com/AVGVSTVS96/survay` plus the demo link.

Footnote for the line count: non-blank lines in the app's own .ts/.tsx files (app/, components/, lib/), not counting the generated shadcn parts in components/ui. `site/copy/count.mjs` counts them.
