import { logout } from "@/app/actions/admin"
import { AdminDashboard } from "@/components/admin-dashboard"
import { CopyLink } from "@/components/copy-link"
import { isAuthenticated } from "@/lib/auth"
import { getQuestions, getResponseCount, getStats, getTitle } from "@/lib/survey"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Dashboard" }

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login")

  const [questions, stats, responseCount, title] = await Promise.all([
    getQuestions(),
    getStats(),
    getResponseCount(),
    getTitle(),
  ])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 px-5 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg-display text-em text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {responseCount} {responseCount === 1 ? "response" : "responses"}
            <span className="text-subtle"> · </span>
            <CopyLink />
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
        title={title}
        questions={questions}
        stats={stats}
        responseCount={responseCount}
      />
    </main>
  )
}
