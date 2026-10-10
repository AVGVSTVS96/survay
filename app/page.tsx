import { PageShell } from "@/components/page-shell"
import { SurveyForm } from "@/components/survey-form"
import { getQuestions, getTitle } from "@/lib/survey"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getTitle()
  return title ? { title: { absolute: title }, openGraph: { title } } : {}
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>
}) {
  const [{ embed }, questions, title] = await Promise.all([searchParams, getQuestions(), getTitle()])

  return (
    <PageShell embed={embed === "1"}>
      {title && (
        <header className="flex flex-col gap-1">
          <p className="text-muted-foreground">{title}</p>
        </header>
      )}
      <SurveyForm questions={questions} embed={embed === "1"} />
    </PageShell>
  )
}
