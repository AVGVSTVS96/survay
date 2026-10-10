import { afterAll, describe, expect, test } from "bun:test";

import { serve } from "../src/server.tsx";
import { open } from "../src/store.ts";

const store = open(":memory:");
store.seed();
const server = await serve({ store, password: "letmein", port: 0, publicResults: false, demo: false });
const url = (path: string) => new URL(path, server.url).href;
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(url(path), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

afterAll(() => server.stop(true));

const [first, second, essay, burgers] = store.survey().questions;
const answers = {
  [first!.id]: "yep",
  [second!.id]: "chill dude.",
  [burgers!.id]: ["fucking terrified mate"],
};

describe("the survey", () => {
  test("renders the questions on the server, with the title in the head", async () => {
    const html = await (await fetch(url("/"))).text();
    expect(html).toContain("<title>A few quick questions</title>");
    expect(html).toContain("Are you scared about AI?");
    expect(html).toContain('<meta property="og:description" content="4 questions, one at a time.">');
  });

  test("turns away answers that skip a required question", async () => {
    const res = await post("/api/responses", { shown: [first!.id], answers: {} });
    expect(res.status).toBe(409);
  });

  test("saves a response and only the answers that fit", async () => {
    const res = await post("/api/responses", {
      shown: [first!.id, second!.id, essay!.id, burgers!.id],
      answers: { ...answers, [essay!.id]: "   " },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: null });
    expect(store.survey().responses).toBe(1);
    expect(store.answers()).toHaveLength(3);
  });

  test("drops what the honeypot catches", async () => {
    await post("/api/responses", {
      shown: [first!.id, second!.id, burgers!.id],
      answers,
      website: "spam.example",
    });
    expect(store.survey().responses).toBe(1);
  });

  test("keeps results and the demo dashboard off unless they're turned on", async () => {
    expect((await fetch(url("/results"))).status).toBe(404);
    expect((await fetch(url("/api/results"))).status).toBe(404);
    expect((await fetch(url("/admin/try"))).status).toBe(404);
  });
});

describe("the dashboard", () => {
  test("needs the password", async () => {
    expect((await fetch(url("/api/admin"))).status).toBe(401);
    expect((await fetch(url("/admin/export.csv"))).status).toBe(401);
    expect((await post("/api/login", { password: "nope" })).status).toBe(401);
    expect(await (await fetch(url("/admin"))).text()).toContain("Enter your password");
  });

  test("signs in, edits and exports", async () => {
    const login = await post("/api/login", { password: "letmein" });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
    expect(login.headers.get("set-cookie")).toContain("HttpOnly");

    const page = await fetch(url("/admin"), { headers: { cookie } });
    expect(page.headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
    expect(await page.text()).toContain("Dashboard");

    const renamed = await post("/api/admin", { type: "title", title: "  Lunch?  " }, { cookie });
    expect(((await renamed.json()) as { survey: { title: string } }).survey.title).toBe("Lunch?");

    const bad = await post(
      "/api/admin",
      { type: "add", question: { kind: "single", prompt: "x", options: ["a"] } },
      { cookie },
    );
    expect(bad.status).toBe(422);

    const notJson = await fetch(url("/api/admin"), {
      method: "POST",
      headers: { cookie },
      body: "type=title",
    });
    expect(notJson.status).toBe(415);

    const bytes = new Uint8Array(
      await (await fetch(url("/admin/export.csv"), { headers: { cookie } })).arrayBuffer(),
    );
    expect(bytes.slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));
    const csv = new TextDecoder().decode(bytes);
    expect(csv.split("\r\n")[0]).toBe(
      "Submitted,Are you scared about AI?,bruh..,write a 1200 page essay on mannerisms and honeybees,how do you feel about cheeseburgers disappearing from existence?",
    );
    expect(csv).toContain(",yep,chill dude.,,fucking terrified mate");
  });

  test("rejects a forged session", async () => {
    const res = await fetch(url("/api/admin"), {
      headers: { cookie: `survay_session=${Date.now()}.deadbeef` },
    });
    expect(res.status).toBe(401);
  });
});
