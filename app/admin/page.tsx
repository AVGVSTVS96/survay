import { getAdminQuestions, getResponsesWithAnswers, logout } from "@/app/actions/admin"
import { AdminDashboard } from "@/components/admin-dashboard"
import { isAuthenticated } from "@/lib/auth"
import { computeStats } from "@/lib/stats"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login")

  const questions = await getAdminQuestions()
  const { responses, answers } = await getResponsesWithAnswers()
  const stats = computeStats(questions, answers)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 px-5 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg-display text-em text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {responses.length} {responses.length === 1 ? "response" : "responses"}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </header>

      <AdminDashboard
        questions={questions}
        stats={stats}
        responseCount={responses.length}
      />
    </main>
  )
}
