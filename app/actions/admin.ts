"use server"

import { createSession, destroySession, isAuthenticated, verifyPassword } from "@/lib/auth"
import { db } from "@/lib/db"
import { answers, questions, responses, type QuestionKind } from "@/lib/db/schema"
import { asc, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function requireAdmin() {
  if (!(await isAuthenticated())) throw new Error("Unauthorized")
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
  required?: boolean
}

export async function createQuestion(input: QuestionInput) {
  await requireAdmin()
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${questions.position}), -1)` })
    .from(questions)
  await db.insert(questions).values({
    kind: input.kind,
    prompt: input.prompt.trim(),
    description: input.description?.trim() || null,
    options: input.options ?? [],
    scaleMax: input.scaleMax ?? null,
    required: input.required ?? false,
    position: Number(max) + 1,
  })
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function updateQuestion(id: number, input: QuestionInput) {
  await requireAdmin()
  await db
    .update(questions)
    .set({
      kind: input.kind,
      prompt: input.prompt.trim(),
      description: input.description?.trim() || null,
      options: input.options ?? [],
      scaleMax: input.scaleMax ?? null,
      required: input.required ?? false,
    })
    .where(eq(questions.id, id))
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function deleteQuestion(id: number) {
  await requireAdmin()
  await db.delete(questions).where(eq(questions.id, id))
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function reorderQuestions(orderedIds: number[]) {
  await requireAdmin()
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(questions).set({ position: index }).where(eq(questions.id, id)),
    ),
  )
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function getAdminQuestions() {
  await requireAdmin()
  return db.select().from(questions).orderBy(asc(questions.position), asc(questions.id))
}

export async function getResponsesWithAnswers() {
  await requireAdmin()
  const resList = await db.select().from(responses).orderBy(desc(responses.createdAt))
  const ansList = await db.select().from(answers)
  return { responses: resList, answers: ansList }
}
