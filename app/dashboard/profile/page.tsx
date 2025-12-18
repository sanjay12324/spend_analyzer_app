import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileClient from "@/components/profile-client"

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <ProfileClient user={user} />
}
