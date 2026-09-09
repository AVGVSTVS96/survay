import { cookies } from "next/headers"
import crypto from "crypto"

const COOKIE_NAME = "admin_session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

// The signing secret. If ADMIN_SESSION_SECRET is set we use it (stable across
// restarts). Otherwise we generate a strong random secret once per process so
// the admin never has to manage a secret by hand. The tradeoff is that an
// auto-generated secret rotates on a full server restart, which just means the
// admin logs in again — perfectly fine for a single-admin app.
const globalForSecret = globalThis as unknown as { adminSecret?: string }

function getSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET
  if (!globalForSecret.adminSecret) {
    globalForSecret.adminSecret = crypto.randomBytes(48).toString("base64")
  }
  return globalForSecret.adminSecret
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

/** Constant-time password check against ADMIN_PASSWORD. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  // Hash both sides so timingSafeEqual gets equal-length buffers regardless of input length.
  const inputHash = crypto.createHash("sha256").update(input).digest("hex")
  const expectedHash = crypto.createHash("sha256").update(expected).digest("hex")
  return safeEqual(inputHash, expectedHash)
}

export async function createSession() {
  const issuedAt = Date.now().toString()
  const value = `${issuedAt}.${sign(issuedAt)}`
  const store = await cookies()
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return false
  const [issuedAt, signature] = raw.split(".")
  if (!issuedAt || !signature) return false
  if (!safeEqual(signature, sign(issuedAt))) return false
  const age = Date.now() - Number(issuedAt)
  if (Number.isNaN(age) || age > MAX_AGE_SECONDS * 1000) return false
  return true
}
