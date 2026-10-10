"use server"

import { createSession, destroySession, isAuthenticated, verifyPassword } from "@/lib/auth"
import { db } from "@/lib/db"
import { answers, questions, survey, type QuestionKind } from "@/lib/db/schema"
import { hasOptions, KINDS } from "@/lib/questions"
import { count, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type ActionResult = { error?: string }

async function adminAction(run: () => Promise<string | void>): Promise<ActionResult> {
  if (!(await isAuthenticated())) redirect("/admin/login")
  try {
    const error = await run()
    if (error) return { error }
  } catch (e) {
    console.error(e)
    return { error: "Something went wrong. Try again." }
  }
  revalidatePath("/", "layout")
  return {}
}

export async function login(_prev: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "")
  if (!verifyPassword(password)) {
    return { error: "Incorrect password." }
  }
  await createSession()
  redirect("/admin")
}

export async function logout() {
  await destroySession()
  redirect("/admin/login")
}

export type QuestionInput = {
  kind: QuestionKind
  prompt: string
  description?: string | null
  options?: string[]
  scaleMax?: number | null
  multiline?: boolean
  required?: boolean
}

function toValues(input: QuestionInput) {
  if (!KINDS.includes(input.kind)) return "Pick a question type."
  const prompt = String(input.prompt ?? "").trim()
  if (!prompt) return "Write the question first."
  const options = hasOptions(input.kind)
    ? [...new Set((input.options ?? []).map((o) => String(o).trim()).filter(Boolean))]
    : []
  if (hasOptions(input.kind) && options.length < 2) return "Add at least two different options."
  return {
    kind: input.kind,
    prompt,
    description: String(input.description ?? "").trim() || null,
    options,
    scaleMax: input.kind === "rating" ? (input.scaleMax === 10 ? 10 : 5) : null,
    multiline: input.kind === "text" ? input.multiline !== false : true,
    required: input.required === true,
  }
}

export async function createQuestion(input: QuestionInput) {
  return adminAction(async () => {
    const values = toValues(input)
    if (typeof values === "string") return values
    await db.insert(questions).values({
      ...values,
      position: sql`(select coalesce(max(${questions.position}), -1) + 1 from ${questions})`,
    })
  })
}

export async function updateQuestion(id: number, input: QuestionInput) {
  return adminAction(async () => {
    const values = toValues(input)
    if (typeof values === "string") return values
    const [existing] = await db
      .select({ kind: questions.kind })
      .from(questions)
      .where(eq(questions.id, id))
    if (!existing) return "This question was already deleted."
    if (existing.kind !== values.kind) {
      const [{ n }] = await db
        .select({ n: count() })
        .from(answers)
        .where(eq(answers.questionId, id))
      if (n > 0) return "This question already has answers, so its type can't change."
    }
    await db.update(questions).set(values).where(eq(questions.id, id))
  })
}

export async function deleteQuestion(id: number) {
  return adminAction(async () => {
    await db.delete(questions).where(eq(questions.id, id))
  })
}

export async function reorderQuestions(orderedIds: number[]) {
  return adminAction(async () => {
    await db.transaction(async (tx) => {
      for (const [position, id] of orderedIds.entries()) {
        await tx.update(questions).set({ position }).where(eq(questions.id, id))
      }
    })
  })
}

export async function setTitle(title: string) {
  return adminAction(async () => {
    const value = String(title ?? "").trim().slice(0, 200)
    await db
      .insert(survey)
      .values({ id: 1, title: value })
      .onConflictDoUpdate({ target: survey.id, set: { title: value } })
  })
}
