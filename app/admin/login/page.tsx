import { AdminLoginForm } from "@/components/admin-login-form"
import { isAuthenticated } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin")

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <AdminLoginForm />
    </main>
  )
}
