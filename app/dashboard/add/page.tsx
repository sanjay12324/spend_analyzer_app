import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AddExpenseClient from "@/components/add-expense-client"

export default async function AddExpensePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch recurring rules for the user
  const { data: recurringRules } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("frequency", { ascending: true })
    .order("label", { ascending: true })

  return <AddExpenseClient recurringRules={recurringRules || []} userId={user.id} />
}
