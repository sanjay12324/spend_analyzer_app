import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startOfMonth.toISOString())
    .lte("date", endOfMonth.toISOString())
    .order("date", { ascending: false })

  // Fetch incomes
  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id)
    .gte("date_received", startOfMonth.toISOString().split("T")[0])
    .lte("date_received", endOfMonth.toISOString().split("T")[0])

  // Fetch recurring rules
  const { data: recurringRules } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)

  return (
    <DashboardClient
      expenses={expenses || []}
      incomes={incomes || []}
      recurringRules={recurringRules || []}
      userId={user.id}
    />
  )
}
