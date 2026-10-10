import { existsSync } from "node:fs";

const COOKIE = "survay_session";
const MAX_AGE = 60 * 60 * 24 * 30;

const hmac = (key: string | Uint8Array, data: string) =>
  new Bun.CryptoHasher("sha256", key).update(data).digest("hex");

const same = (a: string, b: string) =>
  a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function password(file: string): Promise<{ value: string; created: boolean }> {
  const env = process.env["ADMIN_PASSWORD"];
  if (env) return { value: env, created: false };
  if (existsSync(file)) return { value: (await Bun.file(file).text()).trim(), created: false };
  const value = Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString("base64url");
  await Bun.write(file, `${value}\n`, { mode: 0o600 });
  return { value, created: true };
}

export function sessions(secret: string) {
  const key = hmac(secret, "survay session");
  const sign = (issued: string) => hmac(key, issued);

  return {
    check: (attempt: unknown) => typeof attempt === "string" && same(hmac(key, attempt), hmac(key, secret)),

    valid(req: Request & { cookies: Bun.CookieMap }) {
      const [issued, signature] = (req.cookies.get(COOKIE) ?? "").split(".");
      if (!issued || !signature || !same(signature, sign(issued))) return false;
      const age = Date.now() - Number(issued);
      return age >= 0 && age < MAX_AGE * 1000;
    },

    start(req: Request & { cookies: Bun.CookieMap }) {
      const issued = String(Date.now());
      req.cookies.set(COOKIE, `${issued}.${sign(issued)}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: secure(req),
        path: "/",
        maxAge: MAX_AGE,
      });
    },

    end(req: Request & { cookies: Bun.CookieMap }) {
      req.cookies.delete({ name: COOKIE, path: "/" });
    },
  };
}

export const secure = (req: Request) =>
  new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
