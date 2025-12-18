import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { validateAmount, validateDate, sanitizeNote, validateString } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate inputs
    const amount = validateAmount(body.amount)
    const date = body.date ? validateDate(body.date) : new Date().toISOString()
    const note = sanitizeNote(body.note)
    const categoryLabel = body.category_label ? validateString(body.category_label, 100) : null

    const expense = {
      user_id: user.id,
      date,
      amount,
      unit: body.unit || null,
      quantity: body.quantity || null,
      note,
      language_tag: body.language_tag || "en",
      category_label: categoryLabel,
      rule_id: body.rule_id || null,
      items: body.items || null,
    }

    const { data, error } = await supabase.from("expenses").insert([expense]).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error("[API] Expense creation error:", error)
    const message = error instanceof Error ? error.message : "Failed to create expense"
    const status = message.includes("Invalid") ? 400 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}

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

    let query = supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false })

    if (start) query = query.gte("date", start)
    if (end) query = query.lte("date", end)

    const { data, error } = await query

    if (error) throw error

    const totalSpent = data.reduce((sum: number, exp: any) => sum + (Number.parseFloat(exp.amount.toString()) || 0), 0)

    return NextResponse.json({ ok: true, items: data, totals: { spent: totalSpent } })
  } catch (error) {
    console.error("[API] Expenses fetch error:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch expenses" }, { status: 500 })
  }
}
