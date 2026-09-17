import { PlaceholderScreen } from "@/components/es-dashboard/placeholder-screen"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function PreventivePage() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <PlaceholderScreen
      title="Preventif"
      email={session.email as string}
      role={session.role as string}
    />
  )
}
