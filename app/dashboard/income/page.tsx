import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import IncomeClient from "@/components/income-client"

export default async function IncomePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <IncomeClient />
}
