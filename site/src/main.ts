import { mountEditor } from "./editor.ts";

const demo = "https://survey-platform-taupe.vercel.app";
const survey = document.querySelector<HTMLIFrameElement>("#survey")!;
const results = document.querySelector<HTMLIFrameElement>("#results-frame")!;
const sheet = document.querySelector<HTMLElement>("#sheet")!;
const slot = sheet.parentElement!;
const zoom = document.querySelector<HTMLButtonElement>("#zoom")!;

let surveyChanged = false;
let lastSurveyHeight = 0;

addEventListener("message", (event) => {
  if (event.origin !== demo || event.data?.type !== "survay:height") return;
  const height = Number(event.data.height);
  if (!(height > 0)) return;
  if (event.source === survey.contentWindow) {
    if (lastSurveyHeight && height !== lastSurveyHeight) surveyChanged = true;
    lastSurveyHeight = height;
    survey.style.height = `${height}px`;
  } else if (event.source === results.contentWindow) {
    results.style.height = `${height}px`;
  }
});

new IntersectionObserver(([entry]) => {
  if (!entry?.isIntersecting || !surveyChanged) return;
  surveyChanged = false;
  results.src = results.src;
}).observe(results);

const motion = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;
const box = (r: DOMRect) => ({
  top: `${r.top}px`,
  left: `${r.left}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
});
const full = () => ({ top: "0px", left: "0px", width: `${innerWidth}px`, height: `${innerHeight}px` });

function setZoomed(on: boolean) {
  zoom.setAttribute("aria-expanded", String(on));
  zoom.setAttribute("aria-label", on ? "Close full screen" : "Open the survey full screen");
  document.body.classList.toggle("locked", on);
}

async function open() {
  const from = sheet.getBoundingClientRect();
  slot.style.height = `${from.height}px`;
  sheet.classList.add("zoomed");
  Object.assign(sheet.style, { inset: "0" });
  setZoomed(true);
  if (motion())
    await sheet.animate([box(from), full()], { duration: 420, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })
      .finished;
}

async function close() {
  const to = slot.getBoundingClientRect();
  setZoomed(false);
  if (motion())
    await sheet.animate([full(), box(to)], { duration: 360, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })
      .finished;
  sheet.classList.remove("zoomed");
  sheet.style.inset = "";
  slot.style.height = "";
}

zoom.addEventListener("click", () => (sheet.classList.contains("zoomed") ? close() : open()));
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sheet.classList.contains("zoomed")) close();
});

mountEditor(document.querySelector<HTMLElement>("#app")!);
