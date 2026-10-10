import { isAuthenticated } from "@/lib/auth"
import { toCsv } from "@/lib/csv"
import { db } from "@/lib/db"
import { answers, responses } from "@/lib/db/schema"
import { getQuestions } from "@/lib/survey"
import { asc } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function GET() {
  if (!(await isAuthenticated())) redirect("/admin/login")

  const [questions, responseRows, answerRows] = await Promise.all([
    getQuestions(),
    db.select({ id: responses.id, createdAt: responses.createdAt }).from(responses).orderBy(asc(responses.createdAt)),
    db.select({ responseId: answers.responseId, questionId: answers.questionId, value: answers.value }).from(answers),
  ])
  const date = new Date().toISOString().slice(0, 10)

  return new Response("\uFEFF" + toCsv(questions, responseRows, answerRows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="responses-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
