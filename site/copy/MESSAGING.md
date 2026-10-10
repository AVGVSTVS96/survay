# survay: messaging

Source of truth for the site's words. Numbers come from `facts.json` (run `bun site/copy/count.mjs` after code changes; the line count moves).

## Positioning

survay is a small survey app you run yourself: one survey, one question at a time, one SQLite file that holds every answer. It's a template you copy, not a service you sign up for.

## Hero

**One survey, one question at a time.**

A small survey app you run yourself. Every answer lands in one file you own.

- Frame caption: `This is the real app. Go ahead, answer it.`
- Frame caption once you've submitted: `You're in the results below.` (links to #results)
- Zoom control: `Zoom in` / `Zoom out` (aria-label: `Open the survey full screen` / `Close full screen`)

## Sections

### 1. Results

**See how everyone answered.**

The demo's results are public. Answer the survey above and watch your vote land.

- Caption: `Text answers stay off the public page.`
- Link: `Open full results`

### 2. Dashboard

**Write it in the dashboard.**

Pick one of four kinds, write the prompt, move it up or down.

- Window label: `Try it. Nothing here is saved.`

### 3. Own it

**One survey per copy. That's the point.**

Your copy is a folder on your computer. One file in it, `data/survay.db`, holds every answer.

1. **Make a copy and start it.** (the real `bun survay` output)
2. **Put it online.** A Sprite sleeps when nobody's answering and wakes on the next visit. Any computer with a disk works too.
3. **Read the answers anywhere.** (the real `survay results` output, live from the demo)

### Footer

`MIT licensed. Source on GitHub.`

## CTA labels

| where | label | goes to |
| --- | --- | --- |
| hero, primary | `Run your own` | #own |
| hero, secondary | `GitHub` | github.com/AVGVSTVS96/survay |
| results section | `Open full results` | demo `/results` |
| dashboard frame | `Try it. Nothing here is saved.` | (label on the live sandbox) |
| command lines | `Copy` / `Copied` | clipboard |
| footer | `GitHub` | github.com/AVGVSTVS96/survay |

## Meta

- Title: `survay: a small survey app you run yourself`
- Description: `One survey, one question at a time. Bun, one SQLite file and a dashboard, on your computer or a Sprite. MIT.`

## OG image

- `survay`
- `One survey, one question at a time.`
- Visual: the demo's first question, "Are you scared about AI?", with its four options as the real form shows them.

## Alt text

- Hero frame (iframe `title`): `The survay demo survey, running live`
- Results frame (iframe `title`): `Public results for the demo survey`
- Dashboard frame (iframe `title`): `The survay dashboard. Edits stay in this tab.`
- Wordmark: `survay`
- OG image: `survay. One survey, one question at a time.`

## Demo survey (verbatim, keep as is)

1. **Are you scared about AI?** (multiple choice, required): yep / nah / its a fucking computer bro stfu / sillycon mafia
2. **bruh..** (multiple choice, required): what bro?! relax.. smh.. / chill dude.
3. **write a 1200 page essay on mannerisms and honeybees** (text, optional), description `zip it! 🤐`
4. **how do you feel about cheeseburgers disappearing from existence?** (checkboxes, required): fucking terrified mate / a little bothered but i’ll survive / couldnt care less mate

## X launch post (draft)

Follows `x-pipeline/08-writing-style-guide.md` (T1). Media: 10s screen recording of answering the demo while the results and the terminal fill in.

```
found a survey app i'd left in a private repo, so i finished it and open sourced it

> one survey per copy, one question at a time
> runs on your computer: bun and one sqlite file
> deploy/sprite.sh puts it online, asleep until someone answers
> survay results prints the answers in your terminal

about {linesOfCodeRounded} lines of code. the demo asks how you feel about cheeseburgers disappearing from existence

link in replies
```

First reply: `https://github.com/AVGVSTVS96/survay` plus the site link.

Footnote for the line count: non-blank lines in the app's own `.ts`/`.tsx` files under `src/`. `site/copy/count.mjs` counts them.
