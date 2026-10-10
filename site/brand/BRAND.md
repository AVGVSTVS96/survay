# survay · brand

**The idea in a sentence:** survay looks like the answer sheet you filled in at school: the form is printed in one salmon ink, and your answers are the graphite bubbles.

## Personality

- **Small and finished.** One survey per deploy. The page shows the whole thing working instead of listing what it does.
- **Plays along with the demo.** The demo questions are silly on purpose ("sillycon mafia"); the brand stays straight-faced next to them, which is the joke.
- **Shows the real app.** The hero is the live survey and the results are the live results page, both in iframes. The dashboard is rebuilt from the app's own components and tokens, because it sits behind a password.

## What it is and isn't

| it is | it isn't |
| --- | --- |
| a form you fill in, one bubble at a time | a survey platform with workspaces and seats |
| one survey on your own Vercel and Neon | a hosted service, a waitlist |
| a bubble sheet: printed salmon, graphite marks | a Typeform clone with gradients and emoji |

## The visual system

### Type: Archivo (OFL, Google Fonts)

One family with a width axis, so the wordmark and the prose share bones.

- **Display:** Archivo at `font-stretch: 112%`, weight 680, letter-spacing `-0.03em`, line-height 1.04. Headlines `clamp(30px, 4.4vw, 52px)`; the self-host headline goes to 68px.
- **Wordmark:** Archivo 760 at width 122, tracked `-0.035em`, drawn as outlines by `logo/gen.mjs` from a static instance (`logo/ttf/Archivo-760-122.ttf`).
- **Body:** Archivo 400 at width 100, 17px/1.5; ledes 18 to 20px in `--ink-2`.
- **The app's own type:** anything that is the app (the rebuilt dashboard, the OG image's form) uses **Geist**, like the real app. The brand never restyles the product.
- No mono costume. The only mono is real code: `ADMIN_PASSWORD`, `pnpm db:push`, `/admin`.

### Color: paper, graphite, dropout salmon

Answer sheets print the form in a "dropout" ink the scanner ignores, so only your pencil marks count. survay keeps that split.

| token | light | dark | use |
| --- | --- | --- | --- |
| `--paper` | `#f5f3ed` | `#0f0e0d` | the page: a step below the app's own background |
| `--sheet` | `oklch(0.992 0.002 90)` | `oklch(0.17 0.004 70)` | the app's `--background`, exactly; anything holding the app sits on it |
| `--ink` | `#1d1c1a` | `#edebe6` | text, filled bubbles, primary buttons |
| `--ink-2` | `#5d5a54` | `#a5a29b` | ledes, secondary text |
| `--ink-3` | `#6f6b64` | `#8a867f` | URLs, captions |
| `--form` | `#e8735c` | `#f08a73` | the printed form: rules, sheet borders, empty bubbles |
| `--form-ink` | `#b13f28` | `#f49c86` | text printed in the form color (passes 4.5:1 on both fields) |
| `--form-line` | `#f1b8aa` | `#3a2c27` | soft rules inside the form |

Rule: **salmon is the form, graphite is the answer.** Anything you can mark or press is ink; anything printed to guide you is salmon. Dark keeps salmon light (a light brand color stays light) and lays it on a near-neutral field a step below the app's dark UI, so the iframe and the page never fight.

### Grid and spacing

- Page max 1240px, gutters `clamp(16px, 4vw, 40px)`. Sections split by 1px `--form` rules, not background changes, except the dashboard band, which sits on `--sheet` like a page torn out of the form.
- Radii: 6px on the sheet (paper), 10px on buttons, 12px on browser windows, the app's own radii inside the app.
- No shadows. 1.5px `--form` borders on anything that is "the form".

### Motifs

1. **The filled bubble.** The `a` in survay is a pencil-filled answer bubble. It is the mark, the favicon and the step numbers in the self-host list.
2. **The timing track.** The column of black dashes down an answer sheet's edge, which scanners read to find each row. It runs down the hero sheet and the OG image.
3. **The answer row.** `01  (A) (B) (C) (●)` in the README header: question number in `--form-ink`, empty bubbles in salmon, the chosen one in ink.
4. **The sheet.** The live app always sits on a salmon-bordered sheet or in a plain browser window, never on a device mockup.

### Motion

- **Zoom in:** the sheet grows from its spot to the full viewport (top, left, width, height, 420ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`) and shrinks back on Zoom out or Esc in 360ms. The iframe is never moved in the DOM, so your answers survive the zoom.
- **Reorder:** rows in the rebuilt dashboard slide to their new place (FLIP, 260ms), like the real app's optimistic reorder.
- Presses scale to 0.97. Reduced motion turns all of it off.

### Iconography

None. Glyphs only: `↗ ↑ ↓ ×`. The Deploy button is Vercel's own image.

## Marks

Three directions, drawn from Archivo outlines by `logo/gen.mjs`:

- **a · bubble (picked).** The `a` knocked out of a filled oval. It reads as "survay" and as "answer a" at once, it's the product's radio button, and it holds at 16px as a filled oval. Files: `survay.svg`, `survay-dark.svg`, `mark.svg`, `mark-dark.svg`, `favicon.svg` (follows the system theme), `apple-touch-icon.svg`.
- **b · timing track.** Three dashes before a plain wordmark. Not picked: the dashes need the sheet around them to mean anything; alone they read as a hamburger menu.
- **c · progress.** A plain wordmark over the app's progress hairline, filled up to the `a`. Not picked: it's the app's quietest detail, and a hairline disappears at 16px.

## Directions

Hero mockups in `directions/` (shots in the job folder):

- **a · bubble sheet (picked):** Archivo wide, paper and salmon, the live survey on an answer sheet with a timing track.
- **b · one question:** a giant centered "Ask one thing at a time." in Instrument Sans with one cobalt accent. Not picked: it's the safe SaaS layout, and the cobalt has nothing to do with the product.
- **c · tally:** Familjen Grotesk, four poppy option colors, stacked results bars and a hard-shadow phone. Not picked: four colors for four options is a chart legend, not a brand, and the hard shadow is hex's look.

## Assets

| file | source | size |
| --- | --- | --- |
| `site/public/og.png` | `assets/og.html` | 1200×630 |
| `.github/header-light.png`, `header-dark.png` | `assets/readme-{light,dark}.html` | 838×220 @2x |
| `site/public/apple-touch-icon.png`, `icon-512.png` | `assets/icon.html` | 180, 512 |
| `site/public/favicon.svg` | `logo/gen.mjs` | themed SVG |

Rebuild: `bun run logo`, then `bun ~/.agents/skills/brand-it/scripts/shoot.mjs brand/assets/og.html 1200x630 public/og.png` (and the same for the others, sizes above).
