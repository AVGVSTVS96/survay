import { cookies } from "next/headers"
import crypto from "crypto"

const COOKIE_NAME = "admin_session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function sign(payload: string): string {
  const key = crypto.createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update("session").digest()
  return crypto.createHmac("sha256", key).update(payload).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
  if (!raw || !process.env.ADMIN_PASSWORD) return false
  const [issuedAt, signature] = raw.split(".")
  if (!issuedAt || !signature) return false
  if (!safeEqual(signature, sign(issuedAt))) return false
  const age = Date.now() - Number(issuedAt)
  if (Number.isNaN(age) || age > MAX_AGE_SECONDS * 1000) return false
  return true
}
