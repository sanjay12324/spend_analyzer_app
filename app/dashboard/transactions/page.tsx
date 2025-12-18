import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TransactionsClient from "@/components/transactions-client"

export default async function TransactionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(100)

  return <TransactionsClient expenses={expenses || []} userId={user.id} />
}
