type Kind = "single" | "multi" | "rating" | "text";

type Question = {
  id: number;
  kind: Kind;
  prompt: string;
  description: string;
  options: string[];
  scaleMax: number;
  multiline: boolean;
  required: boolean;
};

const KIND_LABELS: Record<Kind, string> = {
  single: "Multiple choice",
  multi: "Checkboxes",
  rating: "Rating",
  text: "Text",
};

const blank = (id: number): Question => ({
  id,
  kind: "single",
  prompt: "",
  description: "",
  options: ["", ""],
  scaleMax: 5,
  multiline: true,
  required: false,
});

const questions: Question[] = [
  {
    ...blank(1),
    prompt: "Are you scared about AI?",
    options: ["yep", "nah", "its a fucking computer bro stfu", "sillycon mafia"],
    required: true,
  },
  { ...blank(2), prompt: "bruh..", options: ["what bro?! relax.. smh..", "chill dude."], required: true },
  {
    ...blank(3),
    kind: "text",
    prompt: "write a 1200 page essay on mannerisms and honeybees",
    description: "zip it! 🤐",
    options: [],
  },
  {
    ...blank(4),
    kind: "multi",
    prompt: "how do you feel about cheeseburgers disappearing from existence?",
    options: ["fucking terrified mate", "a little bothered but i’ll survive", "couldnt care less mate"],
    required: true,
  },
];

const answered = new Set(questions.map((q) => q.id));
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const hasOptions = (k: Kind) => k === "single" || k === "multi";

export function mountEditor(root: HTMLElement) {
  let nextId = 5;
  let editing: number | null = nextId;
  let draft = { ...blank(nextId), kind: "rating" as Kind, options: [] };
  let confirming = false;

  const isNew = () => !questions.some((q) => q.id === draft.id);
  const valid = () =>
    draft.prompt.trim() !== "" &&
    (!hasOptions(draft.kind) || new Set(draft.options.map((o) => o.trim()).filter(Boolean)).size >= 2);
  const chip = (attr: string, value: string | number, label: string, on: boolean, disabled = false) =>
    `<button type="button" class="chip" ${attr}="${value}" aria-pressed="${on}" ${disabled ? "disabled" : ""}>${label}</button>`;

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
    </li>`;

  const editor = () => {
    const locked = answered.has(draft.id);
    return `
    <li class="editor" data-id="${draft.id}">
      <div class="kinds">${(Object.keys(KIND_LABELS) as Kind[]).map((k) => chip("data-kind", k, KIND_LABELS[k], draft.kind === k, locked && k !== draft.kind)).join("")}
        ${locked ? '<p class="app-subtle locked">The type is locked because this question has answers.</p>' : ""}</div>
      <div class="fields">
        <input class="field" data-field="prompt" value="${esc(draft.prompt)}" placeholder="Question" aria-label="Question">
        <input class="field" data-field="description" value="${esc(draft.description)}" placeholder="Description (optional)" aria-label="Description">
      </div>
      ${
        hasOptions(draft.kind)
          ? `<div class="opts">${draft.options
              .map(
                (o, i) =>
                  `<div class="opt"><input class="field" data-option="${i}" value="${esc(o)}" placeholder="Option ${i + 1}" aria-label="Option ${i + 1}"><button type="button" class="x" data-remove="${i}" aria-label="Remove option" ${draft.options.length <= 2 ? "disabled" : ""}>&times;</button></div>`,
              )
              .join("")}<button type="button" class="add" data-add>Add option</button></div>`
          : ""
      }
      ${draft.kind === "rating" ? `<div class="scale"><span class="app-muted">Scale up to</span>${[5, 10].map((n) => chip("data-scale", n, String(n), draft.scaleMax === n)).join("")}</div>` : ""}
      ${draft.kind === "text" ? `<div class="scale"><span class="app-muted">Answer box</span>${chip("data-lines", 0, "One line", !draft.multiline)}${chip("data-lines", 1, "Paragraph", draft.multiline)}</div>` : ""}
      <button type="button" class="switch" role="switch" data-required aria-checked="${draft.required}"><span class="track"><span class="knob"></span></span><span class="${draft.required ? "" : "app-muted"}">Required</span></button>
      ${
        confirming
          ? `<div class="editor-foot"><span>Delete this question?</span><span class="foot-actions"><button type="button" class="add" data-keep>Keep it</button><button type="button" class="save danger" data-delete>Delete</button></span></div>`
          : `<div class="editor-foot">${isNew() ? "<span></span>" : '<button type="button" class="add del" data-confirm>Delete</button>'}<span class="foot-actions"><button type="button" class="add" data-cancel>Cancel</button><button type="button" class="save" data-save ${valid() ? "" : "disabled"}>Save</button></span></div>`
      }
    </li>`;
  };

  function render(focus?: string) {
    root.innerHTML = `
      <div class="app-head"><div><h3>Dashboard</h3><p class="app-muted">Copy link</p></div><span class="app-muted">Sign out</span></div>
      <div class="app-tabs"><span>Questions</span><span>Results</span></div>
      <label class="title-field"><span class="app-muted">Title</span><input class="field" value="A few quick questions" aria-label="Title"></label>
      <ol class="q-list">${questions.map((q, i) => (q.id === editing ? editor() : row(q, i))).join("")}${editing !== null && isNew() ? editor() : ""}</ol>
      ${editing === null ? '<button type="button" class="save add-q" data-new>Add question</button>' : ""}`;
    if (focus) root.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
  }

  function flip(change: () => void) {
    const before = new Map(
      [...root.querySelectorAll<HTMLElement>("[data-id]")].map((el) => [
        el.dataset.id,
        el.getBoundingClientRect().top,
      ]),
    );
    change();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const el of root.querySelectorAll<HTMLElement>("[data-id]")) {
      const top = before.get(el.dataset.id);
      const dy = top === undefined ? 0 : top - el.getBoundingClientRect().top;
      if (dy)
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], {
          duration: 260,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        });
    }
  }

  const close = (id: number) =>
    flip(() => {
      editing = null;
      confirming = false;
      render(`[data-id="${id}"] [data-open]`);
    });

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("button");
    if (!target) return;
    const id = Number(target.closest<HTMLElement>("[data-id]")?.dataset.id);
    const d = target.dataset;
    if (d.move) {
      const i = questions.findIndex((q) => q.id === id);
      const j = i + Number(d.move);
      flip(() => {
        [questions[i], questions[j]] = [questions[j]!, questions[i]!];
        render(`[data-id="${id}"] [data-move="${d.move}"]:not(:disabled)`);
      });
    } else if ("open" in d || "new" in d) {
      flip(() => {
        editing = "new" in d ? ++nextId : id;
        draft = "new" in d ? blank(editing) : structuredClone(questions.find((q) => q.id === id)!);
        confirming = false;
        render('[data-field="prompt"]');
      });
    } else if (d.kind) {
      draft.kind = d.kind as Kind;
      if (hasOptions(draft.kind) && draft.options.length < 2) draft.options = ["", ""];
      render(`[data-kind="${d.kind}"]`);
    } else if (d.scale) {
      draft.scaleMax = Number(d.scale);
      render(`[data-scale="${d.scale}"]`);
    } else if (d.lines) {
      draft.multiline = d.lines === "1";
      render(`[data-lines="${d.lines}"]`);
    } else if (d.remove) {
      draft.options.splice(Number(d.remove), 1);
      render("[data-add]");
    } else if ("add" in d) {
      draft.options.push("");
      render(`[data-option="${draft.options.length - 1}"]`);
    } else if ("required" in d) {
      draft.required = !draft.required;
      render("[data-required]");
    } else if ("confirm" in d || "keep" in d) {
      confirming = "confirm" in d;
      render(confirming ? "[data-keep]" : "[data-confirm]");
    } else if ("delete" in d) {
      flip(() => {
        questions.splice(
          questions.findIndex((q) => q.id === id),
          1,
        );
        editing = null;
        confirming = false;
        render();
      });
    } else if ("cancel" in d) {
      close(id);
    } else if ("save" in d) {
      const saved = {
        ...draft,
        options: hasOptions(draft.kind)
          ? [...new Set(draft.options.map((o) => o.trim()).filter(Boolean))]
          : [],
      };
      const i = questions.findIndex((q) => q.id === id);
      if (i === -1) questions.push(saved);
      else questions[i] = saved;
      close(id);
    }
  });

  root.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.dataset.field === "prompt") draft.prompt = input.value;
    else if (input.dataset.field === "description") draft.description = input.value;
    else if (input.dataset.option) draft.options[Number(input.dataset.option)] = input.value;
    const save = root.querySelector<HTMLButtonElement>("[data-save]");
    if (save) save.disabled = !valid();
  });

  render();
}
