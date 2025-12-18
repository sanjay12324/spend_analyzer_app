import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BudgetsClient from "@/components/budgets-client"

export default async function BudgetsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Fetch budgets for current month
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", currentMonth)
    .eq("year", currentYear)

  // Fetch expenses for current month grouped by category
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const endOfMonth = new Date(currentYear, currentMonth, 0)

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startOfMonth.toISOString())
    .lte("date", endOfMonth.toISOString())

  return <BudgetsClient budgets={budgets || []} expenses={expenses || []} userId={user.id} />
}
