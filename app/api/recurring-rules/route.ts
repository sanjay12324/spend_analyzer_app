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

    const rule = {
      user_id: user.id,
      label: body.label,
      default_amount: body.default_amount || null,
      unit: body.unit || null,
      frequency: body.frequency,
      weekday_or_day: body.weekday_or_day || null,
      auto_create: body.auto_create || false,
      match_heuristics: body.match_heuristics || null,
      active: body.active !== undefined ? body.active : true,
    }

    const { data, error } = await supabase.from("recurring_rules").insert([rule]).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error("[API] Recurring rule creation error:", error)
    return NextResponse.json({ ok: false, error: "Failed to create rule" }, { status: 500 })
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

    const { data, error } = await supabase
      .from("recurring_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("frequency", { ascending: true })

    if (error) throw error

    return NextResponse.json({ ok: true, items: data })
  } catch (error) {
    console.error("[API] Recurring rules fetch error:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch rules" }, { status: 500 })
  }
}
