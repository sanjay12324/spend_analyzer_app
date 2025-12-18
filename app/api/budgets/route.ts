import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    const budget = {
      user_id: user.id,
      category_label: body.category_label,
      monthly_limit: body.monthly_limit,
      month: body.month,
      year: body.year,
    }

    const { data, error } = await supabase.from("budgets").insert([budget]).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error("[API] Budget creation error:", error)
    return NextResponse.json({ ok: false, error: "Failed to create budget" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("budgets").select("*").eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ ok: true, items: data })
  } catch (error) {
    console.error("[API] Budgets fetch error:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch budgets" }, { status: 500 })
  }
}
