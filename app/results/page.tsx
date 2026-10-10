import { PageShell } from "@/components/page-shell"
import { ResultsView } from "@/components/results-view"
import { getPublicStats, getResponseCount, getTitle, publicResults } from "@/lib/survey"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Results" }

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>
}) {
  if (!publicResults) notFound()

  const [{ embed }, stats, responseCount, title] = await Promise.all([
    searchParams,
    getPublicStats(),
    getResponseCount(),
    getTitle(),
  ])

  return (
    <PageShell embed={embed === "1"} wide>
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg-display text-em text-foreground text-balance">{title || "Results"}</h1>
          <p className="text-muted-foreground">
            {responseCount} {responseCount === 1 ? "response" : "responses"}
          </p>
        </div>
        {embed !== "1" && (
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            Take the survey
          </Link>
        )}
      </header>
      {responseCount === 0 ? (
        <p className="text-muted-foreground">No responses yet.</p>
      ) : (
        <ResultsView stats={stats} />
      )}
    </PageShell>
  )
}
