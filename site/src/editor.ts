type Kind = "single" | "multi" | "rating" | "text"

type Question = {
  id: number
  kind: Kind
  prompt: string
  description: string
  options: string[]
  scaleMax: number
  required: boolean
}

const KIND_LABELS: Record<Kind, string> = {
  single: "Multiple choice",
  multi: "Checkboxes",
  rating: "Rating",
  text: "Text",
}

const questions: Question[] = [
  { id: 1, kind: "single", prompt: "Are you scared about AI?", description: "", options: ["yep", "nah", "its a fucking computer bro stfu", "sillycon mafia"], scaleMax: 5, required: true },
  { id: 2, kind: "single", prompt: "bruh..", description: "", options: ["what bro?! relax.. smh..", "chill dude."], scaleMax: 5, required: true },
  { id: 3, kind: "text", prompt: "write a 1200 page essay on mannerisms and honeybees", description: "zip it! 🤐", options: [], scaleMax: 5, required: false },
  { id: 4, kind: "multi", prompt: "how do you feel about cheeseburgers disappearing from existence?", description: "", options: ["fucking terrified mate", "a little bothered but i’ll survive", "couldnt care less mate"], scaleMax: 5, required: true },
]

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

export function mountEditor(root: HTMLElement) {
  let editing: number | null = 1
  let draft: Question = structuredClone(questions[0]!)

  const usesOptions = () => draft.kind === "single" || draft.kind === "multi"
  const valid = () => draft.prompt.trim() !== "" && (!usesOptions() || draft.options.filter((o) => o.trim()).length >= 2)

  const row = (q: Question, i: number) => `
    <li class="q-row" data-id="${q.id}">
      <span class="q-arrows">
        <button type="button" data-move="-1" aria-label="Move up" ${i === 0 ? "disabled" : ""}>&uarr;</button>
        <button type="button" data-move="1" aria-label="Move down" ${i === questions.length - 1 ? "disabled" : ""}>&darr;</button>
      </span>
      <button type="button" class="q-open" data-open>
        <span>${esc(q.prompt)}</span>
        <span class="app-muted">${KIND_LABELS[q.kind]}${q.required ? '<span class="app-subtle"> · Required</span>' : ""}</span>
      </button>
    </li>`

  const editor = (q: Question) => `
    <li class="editor" data-id="${q.id}">
      <div class="kinds">${(Object.keys(KIND_LABELS) as Kind[])
        .map((k) => `<button type="button" class="chip" data-kind="${k}" aria-pressed="${draft.kind === k}">${KIND_LABELS[k]}</button>`)
        .join("")}</div>
      <div class="fields">
        <input class="field" data-field="prompt" value="${esc(draft.prompt)}" placeholder="Question" aria-label="Question">
        <input class="field" data-field="description" value="${esc(draft.description)}" placeholder="Description (optional)" aria-label="Description">
      </div>
      ${usesOptions() ? `<div class="opts">${draft.options
        .map((o, i) => `<div class="opt"><input class="field" data-option="${i}" value="${esc(o)}" placeholder="Option ${i + 1}" aria-label="Option ${i + 1}"><button type="button" class="x" data-remove="${i}" aria-label="Remove option" ${draft.options.length <= 2 ? "disabled" : ""}>&times;</button></div>`)
        .join("")}<button type="button" class="add" data-add>Add option</button></div>` : ""}
      ${draft.kind === "rating" ? `<div class="scale"><span class="app-muted">Scale up to</span>${[5, 10]
        .map((n) => `<button type="button" class="chip" data-scale="${n}" aria-pressed="${draft.scaleMax === n}">${n}</button>`)
        .join("")}</div>` : ""}
      <button type="button" class="switch" role="switch" data-required aria-checked="${draft.required}"><span class="track"><span class="knob"></span></span><span class="${draft.required ? "" : "app-muted"}">Required</span></button>
      <div class="editor-foot">
        <button type="button" class="add" data-cancel>Cancel</button>
        <button type="button" class="save" data-save ${valid() ? "" : "disabled"}>Save</button>
      </div>
    </li>`

  function render(focus?: string) {
    root.innerHTML = `
      <div class="app-head"><h3>Dashboard</h3><span class="app-muted">Sign out</span></div>
      <div class="app-tabs"><span>Questions</span><span>Results</span></div>
      <ol class="q-list">${questions.map((q, i) => (q.id === editing ? editor(q) : row(q, i))).join("")}</ol>`
    if (focus) root.querySelector<HTMLElement>(focus)?.focus()
  }

  function flip(change: () => void) {
    const before = new Map([...root.querySelectorAll<HTMLElement>("[data-id]")].map((el) => [el.dataset.id, el.getBoundingClientRect().top]))
    change()
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    for (const el of root.querySelectorAll<HTMLElement>("[data-id]")) {
      const top = before.get(el.dataset.id)
      if (top === undefined) continue
      const dy = top - el.getBoundingClientRect().top
      if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })
    }
  }

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("button")
    if (!target) return
    const id = Number(target.closest<HTMLElement>("[data-id]")?.dataset.id)
    const d = target.dataset
    if (d.move) {
      const i = questions.findIndex((q) => q.id === id)
      const j = i + Number(d.move)
      flip(() => {
        ;[questions[i], questions[j]] = [questions[j]!, questions[i]!]
        render(`[data-id="${id}"] [data-move="${d.move}"]:not(:disabled)`)
      })
    } else if ("open" in d) {
      flip(() => {
        editing = id
        draft = structuredClone(questions.find((q) => q.id === id)!)
        render('[data-field="prompt"]')
      })
    } else if (d.kind) {
      draft.kind = d.kind as Kind
      if (usesOptions() && draft.options.length < 2) draft.options = ["", ""]
      render(`[data-kind="${d.kind}"]`)
    } else if (d.scale) {
      draft.scaleMax = Number(d.scale)
      render(`[data-scale="${d.scale}"]`)
    } else if (d.remove) {
      draft.options.splice(Number(d.remove), 1)
      render("[data-add]")
    } else if ("add" in d) {
      draft.options.push("")
      render(`[data-option="${draft.options.length - 1}"]`)
    } else if ("required" in d) {
      draft.required = !draft.required
      render("[data-required]")
    } else if ("cancel" in d || "save" in d) {
      if ("save" in d) {
        const i = questions.findIndex((q) => q.id === id)
        questions[i] = { ...draft, options: usesOptions() ? draft.options.map((o) => o.trim()).filter(Boolean) : [] }
      }
      flip(() => {
        editing = null
        render(`[data-id="${id}"] [data-open]`)
      })
    }
  })

  root.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement
    if (input.dataset.field === "prompt") draft.prompt = input.value
    else if (input.dataset.field === "description") draft.description = input.value
    else if (input.dataset.option) draft.options[Number(input.dataset.option)] = input.value
    root.querySelector<HTMLButtonElement>("[data-save]")!.disabled = !valid()
  })

  render()
}
