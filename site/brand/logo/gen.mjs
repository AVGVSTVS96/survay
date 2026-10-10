import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";

const here = import.meta.dirname;
const font = opentype.parse(readFileSync(join(here, "ttf/Archivo-760-122.ttf")).buffer);
const size = 100;
const scale = size / font.unitsPerEm;
const xHeight = font.tables.os2.sxHeight * scale;
const tracking = -0.035 * size;

const ink = { light: "#1d1c1a", dark: "#edebe6" };
const form = { light: "#e8735c", dark: "#f08a73" };

const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 100) / 100));

function setWord(word, x = 0) {
  return [...word]
    .map((ch) => {
      const glyph = font.charToGlyph(ch);
      const at = x;
      x += glyph.advanceWidth * scale + tracking;
      return {
        ch,
        glyph,
        x: at,
        width: glyph.advanceWidth * scale,
        path: glyph.getPath(at, 0, size).toPathData(2),
      };
    })
    .concat([])
    .map((g, i, all) => Object.assign(g, { end: i === all.length - 1 ? x - tracking : undefined }));
}

function ellipse(cx, cy, rx, ry) {
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
}

function bubble(cx, cy, rx, ry, letterScale) {
  const a = font.charToGlyph("a");
  const s = size * letterScale;
  const box = a.getPath(0, 0, s).getBoundingBox();
  const lx = cx - (box.x1 + box.x2) / 2;
  const ly = cy - (box.y1 + box.y2) / 2;
  return ellipse(cx, cy, rx, ry) + a.getPath(lx, ly, s).toPathData(2);
}

function bubbleWord() {
  const glyphs = setWord("survay");
  const a = glyphs[4];
  const rx = a.width * 0.64;
  const ry = xHeight * 0.62;
  const shift = rx * 2 - a.width - tracking * 0.9;
  const cx = a.x + rx - tracking * 0.45;
  const parts = glyphs.map((g, i) => {
    if (i < 4) return g.path;
    if (i === 4) return bubble(cx, -xHeight / 2, rx, ry, 0.6);
    return font
      .charToGlyph(g.ch)
      .getPath(g.x + shift, 0, size)
      .toPathData(2);
  });
  const width = glyphs.at(-1).end + shift;
  return {
    d: parts.join(""),
    width,
    top: -Math.max(font.ascender * scale * 0.78, ry + xHeight / 2),
    bottom: -font.descender * scale * 0.9,
  };
}

function plainWord() {
  const glyphs = setWord("survay");
  return {
    d: glyphs.map((g) => g.path).join(""),
    width: glyphs.at(-1).end,
    top: -font.ascender * scale * 0.78,
    bottom: -font.descender * scale * 0.9,
  };
}

function svg({ d, width, top, bottom, extra = "", fill, pad = 4, rule = "evenodd" }) {
  const h = bottom - top;
  const vb = `${-pad} ${top - pad} ${round(String(width + pad * 2 + 0.0001))} ${round(String(h + pad * 2 + 0.0001))}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="survay"><path fill-rule="${rule}" fill="${fill}" d="${round(d)}"/>${extra}</svg>\n`;
}

const themed = (body, vb, label = "survay") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"><style>path{fill:${ink.light}}@media (prefers-color-scheme:dark){path{fill:${ink.dark}}}</style>${body}</svg>\n`;

const write = (name, text) => writeFileSync(join(here, name), text);

const bw = bubbleWord();
write("survay.svg", svg({ ...bw, fill: ink.light }));
write("survay-dark.svg", svg({ ...bw, fill: ink.dark }));

const pw = plainWord();
const ticks = [0, 1, 2]
  .map(
    (i) =>
      `<rect x="${-34}" y="${-xHeight + i * (xHeight / 2.5) + 2}" width="22" height="${xHeight / 6}" fill="${ink.light}"/>`,
  )
  .join("");
write("explore-a-bubble.svg", svg({ ...bw, fill: ink.light }));
write(
  "explore-b-timing.svg",
  svg({ ...pw, fill: ink.light, extra: ticks, pad: 40 }).replace(
    /viewBox="(-?[\d.]+)/,
    (m, x) => `viewBox="${Number(x)}`,
  ),
);
const progress = `<rect x="0" y="${-pw.bottom + 34}" width="${pw.width}" height="2" fill="${form.light}"/><rect x="0" y="${-pw.bottom + 33}" width="${setWord("survay")[4].x}" height="4" fill="${ink.light}"/>`;
write("explore-c-progress.svg", svg({ ...pw, bottom: pw.bottom + 10, fill: ink.light, extra: progress }));

const markR = 50;
const mark = bubble(0, 0, markR, markR * 0.74, 0.74);
const markVb = `${-markR - 2} ${-markR * 0.74 - 2} ${markR * 2 + 4} ${markR * 1.48 + 4}`;
write(
  "mark.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${markVb}" role="img" aria-label="survay"><path fill-rule="evenodd" fill="${ink.light}" d="${round(mark)}"/></svg>\n`,
);
write(
  "mark-dark.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${markVb}" role="img" aria-label="survay"><path fill-rule="evenodd" fill="${ink.dark}" d="${round(mark)}"/></svg>\n`,
);

const iconMark = bubble(16, 16, 15, 11.6, 0.2);
write("favicon.svg", themed(`<path fill-rule="evenodd" d="${round(iconMark)}"/>`, "0 0 32 32"));

const tile = bubble(90, 90, 62, 46, 0.84);
write(
  "apple-touch-icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#fbfaf6"/><path fill-rule="evenodd" fill="${ink.light}" d="${round(tile)}"/></svg>\n`,
);

function liveWord() {
  const glyphs = setWord("survay");
  const a = glyphs[4];
  const rx = a.width * 0.64;
  const ry = xHeight * 0.62;
  const shift = rx * 2 - a.width - tracking * 0.9;
  const cx = a.x + rx - tracking * 0.45;
  const cy = -xHeight / 2;
  const letters = glyphs
    .map((g, i) => (i < 4 ? g.path : i === 4 ? "" : font.charToGlyph(g.ch).getPath(g.x + shift, 0, size).toPathData(2)))
    .join("");
  const letter = font.charToGlyph("a");
  const s = size * 0.6;
  const box = letter.getPath(0, 0, s).getBoundingBox();
  const hole = letter.getPath(cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2, s).toPathData(2);
  const stroke = ry * 0.62;
  const strokes = Math.ceil((rx * 2) / (stroke * 0.62));
  const points = Array.from({ length: strokes + 1 }, (_, i) => {
    const x = cx - rx + (i * rx * 2) / strokes;
    const y = i % 2 ? cy + ry + stroke / 2 : cy - ry - stroke / 2;
    return `${round(String(x + 0.0001))} ${round(String(y + 0.0001))}`;
  });
  return { letters, bubble: ellipse(cx, cy, rx, ry), hole, scribble: `M${points.join("L")}`, stroke, width: glyphs.at(-1).end + shift };
}

const lw = liveWord();
const [vx, vy, vw, vh] = svg({ ...bw, fill: "" }).match(/viewBox="([^"]+)"/)[1].split(" ");
write(
  "survay-live.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" class="live-word" role="img" aria-label="survay">` +
    `<defs><mask id="live-a" maskUnits="userSpaceOnUse" x="${vx}" y="${vy}" width="${vw}" height="${vh}">` +
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#fff"/><path d="${round(lw.hole)}" fill="#000"/></mask>` +
    `<clipPath id="live-bubble"><path d="${round(lw.bubble)}"/></clipPath></defs>` +
    `<path fill="currentColor" d="${round(lw.letters)}"/>` +
    `<path class="ring" fill="none" d="${round(lw.bubble)}"/>` +
    `<g mask="url(#live-a)"><g clip-path="url(#live-bubble)">` +
    `<path class="scribble" fill="none" stroke="currentColor" stroke-width="${round(String(lw.stroke + 0.0001))}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" d="${lw.scribble}"/>` +
    `<path class="fill" fill="currentColor" d="${round(lw.bubble)}"/>` +
    `</g></g></svg>\n`,
);

console.log(`wordmark ${Math.round(bw.width)} wide, x-height ${Math.round(xHeight)}`);
