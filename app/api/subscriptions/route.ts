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

    const subscription = {
      user_id: user.id,
      name: body.name,
      start_date: body.start_date,
      frequency: body.frequency,
      amount: body.amount || null,
      next_billing_date: body.next_billing_date,
      reminder_days: body.reminder_days || 3,
      status: body.status || "active",
    }

    const { data, error } = await supabase.from("subscriptions").insert([subscription]).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data.id })
  } catch (error) {
    console.error("[API] Subscription creation error:", error)
    return NextResponse.json({ ok: false, error: "Failed to create subscription" }, { status: 500 })
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

    const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ ok: true, items: data })
  } catch (error) {
    console.error("[API] Subscriptions fetch error:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}
