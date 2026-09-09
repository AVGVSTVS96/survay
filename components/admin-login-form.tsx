"use client"

import { login } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { useActionState } from "react"

const initial: { error?: string } = {}

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(login, initial)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg-display text-em text-foreground text-balance">Admin</h1>
        <p className="text-muted-foreground text-pretty">
          Enter your password to manage the survey.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <input
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground/50"
        />
        {state?.error && <p className="text-muted-foreground">{state.error}</p>}
      </div>

      <Button type="submit" disabled={pending} className="min-h-11 rounded-lg">
        {pending ? "Checking" : "Enter"}
      </Button>
    </form>
  )
}
