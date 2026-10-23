import { ActivityHistoryView } from "@/components/es-dashboard/activity-history-view"
import { PlaceholderScreen } from "@/components/es-dashboard/placeholder-screen"
import { getUserTodoTasks } from "@/lib/tasks/todo-service"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

interface ActivityPageProps {
  searchParams?: Promise<{ tab?: string }>
}

export default async function ActivityPage(props: ActivityPageProps) {
  const searchParams = await props.searchParams
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }

  // Jika teknisi ES, tampilkan riwayat aktivitas checklist (Selesai & Terlewat)
  if (session.role === "ES") {
    const todoData = await getUserTodoTasks(session.userId as string)

    return (
      <ActivityHistoryView
        todoData={todoData}
        userEmail={session.email as string}
        userRole={session.role as string}
        initialTab={searchParams?.tab === "overdue" ? "overdue" : "completed"}
      />
    )
  }

  return (
    <PlaceholderScreen
      title="Aktivitas"
      email={session.email as string}
      role={session.role as string}
    />
  )
}
