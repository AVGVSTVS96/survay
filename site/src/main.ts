import facts from "../copy/facts.json" with { type: "json" }
import type { QuestionStat } from "../../src/stats.ts"
import { report } from "../../src/report.ts"

type Message =
  | { type: "survay:height"; height: number }
  | { type: "survay:progress"; step: number; total: number; done: boolean }
  | { type: "survay:results"; survey: { title: string; responses: number }; stats: QuestionStat[] }
  | { type: "survay:escape" }

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!

const survey = $<HTMLIFrameElement>("#survey")
const results = $<HTMLIFrameElement>("#results-frame")
const dashboard = $<HTMLIFrameElement>("#dashboard-frame")
const sheet = $("#sheet")
const slot = sheet.parentElement!
const zoom = $<HTMLButtonElement>("#zoom")
const timing = $("#timing")
const live = $("#live")
const terminal = $("#report")

const motion = () => !matchMedia("(prefers-reduced-motion: reduce)").matches
const frameOf = (source: MessageEventSource | null) =>
  [survey, results, dashboard].find((frame) => frame.contentWindow === source)

let progress = 0

addEventListener("message", (event: MessageEvent<Message>) => {
  if (event.origin !== facts.demo) return
  const frame = frameOf(event.source)
  if (!frame) return
  const message = event.data

  switch (message.type) {
    case "survay:height":
      if (!(message.height > 0)) return
      frame.style.height = `${message.height}px`
      frame.closest<HTMLElement>("[data-state]")!.dataset.state = "ready"
      return
    case "survay:progress":
      progress = message.done ? 1 : message.step / message.total
      sheet.dataset.done = String(message.done)
      paintTiming()
      return
    case "survay:results": {
      const text = report(message.survey.title, message.survey.responses, message.stats)
      if (text === terminal.textContent) return
      if (terminal.dataset.ready) pulse(live)
      terminal.dataset.ready = "true"
      terminal.textContent = text
      paintBars()
      return
    }
    case "survay:escape":
      if (sheet.classList.contains("zoomed")) void close()
  }
})

for (const frame of [survey, results, dashboard]) {
  const hello = () => frame.contentWindow?.postMessage({ type: "survay:hello" }, facts.demo)
  frame.addEventListener("load", hello)
  hello()
}

function paintTiming() {
  const marks = [...timing.children] as HTMLElement[]
  const filled = Math.round(progress * marks.length)
  marks.forEach((mark, i) => mark.classList.toggle("on", i < filled))
}

new ResizeObserver(() => {
  const count = Math.max(0, Math.floor((timing.clientHeight - 32) / 23))
  if (count === timing.children.length) return
  timing.replaceChildren(
    ...Array.from({ length: count }, (_, i) => {
      const mark = document.createElement("i")
      mark.style.setProperty("--i", String(i))
      return mark
    }),
  )
  paintTiming()
}).observe(timing)

function paintBars() {
  terminal.innerHTML = terminal.innerHTML.replace(/(█*)(░+)|(█+)/g, (_, on = "", off = "", full = "") => {
    const filled = (on || full).length
    const empty = off.length
    return `<span class="bar" style="--on:${filled};--off:${empty}" aria-label="${filled} of ${filled + empty}">${"█".repeat(filled)}${"░".repeat(empty)}</span>`
  })
}

function pulse(element: HTMLElement) {
  element.classList.remove("pulse")
  void element.offsetWidth
  element.classList.add("pulse")
}

const box = (r: DOMRect) => ({ top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
const full = () => ({ top: "0px", left: "0px", width: `${innerWidth}px`, height: `${innerHeight}px` })
const ease = "cubic-bezier(0.32, 0.72, 0, 1)"

function setZoomed(on: boolean) {
  zoom.setAttribute("aria-expanded", String(on))
  zoom.setAttribute("aria-label", on ? "Close full screen" : "Open the survey full screen")
  document.body.classList.toggle("locked", on)
}

async function open() {
  const from = sheet.getBoundingClientRect()
  slot.style.height = `${from.height}px`
  sheet.classList.add("zoomed")
  setZoomed(true)
  survey.focus()
  if (motion()) await sheet.animate([box(from), full()], { duration: 420, easing: ease }).finished
}

async function close() {
  const to = slot.getBoundingClientRect()
  setZoomed(false)
  if (motion()) await sheet.animate([full(), box(to)], { duration: 320, easing: ease }).finished
  sheet.classList.remove("zoomed")
  slot.style.height = ""
  zoom.focus({ preventScroll: true })
}

zoom.addEventListener("click", () => void (sheet.classList.contains("zoomed") ? close() : open()))
$("a.sheet-note").addEventListener("click", (event) => {
  if (!sheet.classList.contains("zoomed")) return
  event.preventDefault()
  void close().then(() => $("#results").scrollIntoView({ behavior: motion() ? "smooth" : "auto" }))
})
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sheet.classList.contains("zoomed")) void close()
})

for (const line of document.querySelectorAll<HTMLElement>(".cmd")) {
  const copy = document.createElement("button")
  copy.type = "button"
  copy.className = "copy"
  copy.innerHTML = `<b aria-hidden="true"></b><span>Copy</span>`
  const label = copy.querySelector("span")!
  copy.addEventListener("click", () => {
    void navigator.clipboard.writeText(line.firstElementChild!.textContent!).then(() => {
      copy.classList.add("copied")
      label.textContent = "Copied"
    })
  })
  const reset = () => {
    copy.classList.remove("copied")
    label.textContent = "Copy"
  }
  copy.addEventListener("pointerleave", (event) => event.pointerType === "mouse" && reset())
  copy.addEventListener("blur", reset)
  line.append(copy)
}

const links = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>(".nav nav a[href^='#']")].map((a) => [a.hash.slice(1), a]),
)
const sections = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) links.get(entry.target.id)?.toggleAttribute("aria-current", entry.isIntersecting)
  },
  { rootMargin: "-45% 0px -50% 0px" },
)
for (const id of links.keys()) sections.observe(document.getElementById(id)!)
