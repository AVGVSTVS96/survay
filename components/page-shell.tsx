import { EmbedHeight } from "@/components/embed-height"
import { cn } from "@/lib/utils"

export function PageShell({
  embed,
  wide,
  children,
}: {
  embed: boolean
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col gap-10",
        embed ? "" : cn("min-h-dvh px-5 py-12", wide ? "max-w-2xl" : "max-w-md justify-center"),
      )}
    >
      {embed && <EmbedHeight />}
      {children}
    </main>
  )
}
