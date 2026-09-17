import { PlaceholderScreen } from "@/components/es-dashboard/placeholder-screen"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ActivityPage() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <PlaceholderScreen
      title="Aktivitas"
      email={session.email as string}
      role={session.role as string}
    />
  )
}
