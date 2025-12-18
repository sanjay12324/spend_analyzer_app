import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    // Get expenses
    let expenseQuery = supabase.from("expenses").select("*").eq("user_id", user.id)

    if (start) expenseQuery = expenseQuery.gte("date", start)
    if (end) expenseQuery = expenseQuery.lte("date", end)

    const { data: expenses } = await expenseQuery

    // Calculate trend
    const spentTrend = expenses?.reduce(
      (acc, exp) => {
        const date = new Date(exp.date).toISOString().split("T")[0]
        const existing = acc.find((item) => item.date === date)
        if (existing) {
          existing.spent += Number.parseFloat(exp.amount.toString())
        } else {
          acc.push({ date, spent: Number.parseFloat(exp.amount.toString()) })
        }
        return acc
      },
      [] as { date: string; spent: number }[],
    )

    // Calculate categories
    const categoryMap = new Map<string, number>()
    expenses?.forEach((exp) => {
      const category = exp.category_label || "Other"
      categoryMap.set(category, (categoryMap.get(category) || 0) + Number.parseFloat(exp.amount.toString()))
    })

    const categories = Array.from(categoryMap.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      ok: true,
      spentTrend: spentTrend || [],
      categories: categories || [],
    })
  } catch (error) {
    console.error("[API] Dashboard summary error:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch summary" }, { status: 500 })
  }
}
