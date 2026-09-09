import { getPublicQuestions } from "@/app/actions/survey"
import { SurveyForm } from "@/components/survey-form"

export const dynamic = "force-dynamic"

export default async function Page() {
  const questions = await getPublicQuestions()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-10 px-5 py-12">
      <header className="flex flex-col gap-1">
        <p className="text-muted-foreground">A few quick questions</p>
      </header>
      <SurveyForm questions={questions} />
    </main>
  )
}
