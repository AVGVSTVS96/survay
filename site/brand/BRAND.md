# survay · brand

**The idea in a sentence:** survay looks like the answer sheet you filled in at school: the form is printed in one salmon ink, and your answers are the graphite bubbles.

## Personality

- **Small and finished.** One survey per copy, one file of answers. The page shows the whole thing working instead of listing what it does.
- **Plays along with the demo.** The demo questions are silly on purpose ("sillycon mafia"); the brand stays straight-faced next to them, which is the joke.
- **Shows the real app.** The hero is the live survey, the results are the live results page, and the dashboard is the real one in its sandbox (`/admin/try`, nothing saved), all in iframes. The terminal prints the demo's real results through the CLI's own `report()`.

## What it is and isn't

| it is                                          | it isn't                                    |
| ---------------------------------------------- | ------------------------------------------- |
| a form you fill in, one bubble at a time       | a survey platform with workspaces and seats |
| one survey on your computer, one SQLite file   | a hosted service, a waitlist                |
| a bubble sheet: printed salmon, graphite marks | a Typeform clone with gradients and emoji   |

## The visual system

### Type: Archivo (OFL, Google Fonts)

One family with a width axis, so the wordmark and the prose share bones.

- **Display:** Archivo at `font-stretch: 112%`, weight 680, letter-spacing `-0.03em`, line-height 1.04. Headlines `clamp(30px, 4.4vw, 52px)`; the "Own it" headline goes to 68px.
- **Wordmark:** Archivo 760 at width 122, tracked `-0.035em`, drawn as outlines by `logo/gen.mjs` from a static instance (`logo/ttf/Archivo-760-122.ttf`).
- **Body:** Archivo 400 at width 100, 17px/1.5; ledes 18 to 20px in `--ink-2`.
- **The app's own type:** anything that is the app (the OG images' form) uses **Geist**, like the real app. The brand never restyles the product.
- No mono costume. The only mono is real code and real terminal output, in the system mono. Terminal bars are drawn as boxes 1ch per block, so they line up in any font.

### Color: paper, graphite, dropout salmon

Answer sheets print the form in a "dropout" ink the scanner ignores, so only your pencil marks count. survay keeps that split.

| token         | light                   | dark                   | use                                                                    |
| ------------- | ----------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `--paper`     | `#f5f3ed`               | `#0f0e0d`              | the page: a step below the app's own background                        |
| `--sheet`     | `oklch(0.992 0.002 90)` | `oklch(0.17 0.004 70)` | the app's `--background`, exactly; anything holding the app sits on it |
| `--ink`       | `#1d1c1a`               | `#edebe6`              | text, filled bubbles, primary buttons                                  |
| `--ink-2`     | `#5d5a54`               | `#a5a29b`              | ledes, secondary text                                                  |
| `--ink-3`     | `#6f6b64`               | `#8a867f`              | URLs, captions                                                         |
| `--form`      | `#e8735c`               | `#f08a73`              | the printed form: rules, sheet borders, empty bubbles                  |
| `--form-ink`  | `#b13f28`               | `#f49c86`              | text printed in the form color (passes 4.5:1 on both fields)           |
| `--form-line` | `#f1b8aa`               | `#3a2c27`              | soft rules inside the form                                             |

Rule: **salmon is the form, graphite is the answer.** Anything you can mark or press is ink; anything printed to guide you is salmon. Dark keeps salmon light (a light brand color stays light) and lays it on a near-neutral field a step below the app's dark UI, so the iframe and the page never fight.

### Grid and spacing

- Page max 1240px, gutters `clamp(16px, 4vw, 40px)`. Sections split by full-bleed 1.5px `--form` rules, never by background changes.
- Every frame holding the app is a sheet: 1.5px `--form` border, 6px radius, `--sheet` fill, a salmon bar on top. 10px on buttons, the app's own radii inside the app.
- No shadows. 1.5px `--form` borders on anything that is "the form".

### Motifs

1. **The filled bubble.** The `a` in survay is a pencil-filled answer bubble. It is the mark, the favicon and the step numbers in the self-host list.
2. **The timing track.** The column of black dashes down an answer sheet's edge, which scanners read to find each row. It runs down the hero sheet and the OG image.
3. **The answer row.** `01  (A) (B) (C) (●)` in the README header: question number in `--form-ink`, empty bubbles in salmon, the chosen one in ink.
4. **The sheet.** The live app, the dashboard and the terminal always sit on a salmon-bordered sheet, never on a device mockup or browser chrome.

### Motion

Motion follows state. Nothing loops and nothing runs on a timer.

- **The bubble fills in:** on load the hero wordmark reads `surv( )y` with an empty salmon bubble. A pencil scribble fills it (720ms, `cubic-bezier(0.77, 0, 0.175, 1)`) and the `a` appears in the negative space. Once, on the hero only.
- **The timing track is your progress:** its marks are printed salmon and fill with graphite from the top as you answer, all of them when you submit, each mark 12ms after the one above.
- **The printed form:** until the live app reports in, the sheet shows its form printed in `--form-line`, then crossfades to the real thing, so a Sprite waking from sleep never shows a blank box.
- **Zoom in:** the sheet grows from its spot to the full viewport (420ms, `cubic-bezier(0.32, 0.72, 0, 1)`) and shrinks back on Zoom out or Esc, pressed in the page or inside the survey (320ms). The iframe never moves in the DOM, so your answers survive the zoom.
- **Live:** the dot in the results bar pulses when a new answer lands, and the terminal's bars grow with it. Your own picks get a quiet `you` in the results.
- **Reorder:** dashboard rows slide to their new place (FLIP, 260ms).
- Presses scale to 0.97; copy buttons fill their bubble. Hover effects only on devices that hover. Reduced motion turns movement off.

### Iconography

None. Glyphs only: `↗ ↑ ↓ ×`, with the text variation selector so no platform draws them as emoji.

## Marks

Three directions, drawn from Archivo outlines by `logo/gen.mjs`:

- **a · bubble (picked).** The `a` knocked out of a filled oval. It reads as "survay" and as "answer a" at once, it's the product's radio button, and it holds at 16px as a filled oval. Files: `survay.svg`, `survay-dark.svg`, `survay-live.svg` (the hero's animated parts), `mark.svg`, `mark-dark.svg`, `favicon.svg` (follows the system theme), `apple-touch-icon.svg`.
- **b · timing track.** Three dashes before a plain wordmark. Not picked: the dashes need the sheet around them to mean anything; alone they read as a hamburger menu.
- **c · progress.** A plain wordmark over the app's progress hairline, filled up to the `a`. Not picked: it's the app's quietest detail, and a hairline disappears at 16px.

## Directions

Hero mockups in `directions/` (shots in the job folder):

- **a · bubble sheet (picked):** Archivo wide, paper and salmon, the live survey on an answer sheet with a timing track.
- **b · one question:** a giant centered "Ask one thing at a time." in Instrument Sans with one cobalt accent. Not picked: it's the safe SaaS layout, and the cobalt has nothing to do with the product.
- **c · tally:** Familjen Grotesk, four poppy option colors, stacked results bars and a hard-shadow phone. Not picked: four colors for four options is a chart legend, not a brand, and the hard shadow is hex's look.

## Assets

| file                                               | source                            | size        |
| -------------------------------------------------- | --------------------------------- | ----------- |
| `site/public/og.png`                               | `assets/og.html`                  | 1200×630    |
| `public/og.png` (the app, any survey)            | `assets/app-og.html`              | 1200×630    |
| `.github/header-light.png`, `header-dark.png`      | `assets/readme-{light,dark}.html` | 838×220 @2x |
| `site/public/apple-touch-icon.png`, `icon-512.png` | `assets/icon.html`                | 180, 512    |
| `site/public/favicon.svg`                          | `logo/gen.mjs`                    | themed SVG  |

Rebuild: `bun run logo`, then `bun ~/.agents/skills/brand-it/scripts/shoot.mjs brand/assets/og.html 1200x630 public/og.png` (and the same for the others, sizes above).
