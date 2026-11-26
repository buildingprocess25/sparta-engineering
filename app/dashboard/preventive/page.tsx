import { EsNavigationUnavailable } from "@/components/es-dashboard/es-navigation-unavailable"
import { PlaceholderScreen } from "@/components/es-dashboard/placeholder-screen"
import { EsPreventiveView } from "@/components/es-dashboard/es-preventive-view"
import { getRecordedTodoTasks } from "@/lib/tasks/recorded-todo-service"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PreventivePage() {
  const session = await getSession()
  if (!session || typeof session.userId !== "string") redirect("/login")
  if (session.role !== "ES") return <PlaceholderScreen title="Preventif" email={session.email as string} role={session.role as string} />
  let data: { now: string; tasks: React.ComponentProps<typeof EsPreventiveView>["tasks"] }
  try {
    const now = new Date()
    const tasks = await getRecordedTodoTasks(session.userId, now)
    data = { now: now.toISOString(), tasks: tasks.map(t => ({ ...t, targetDate: t.targetDate.toISOString(), completedAt: t.completedAt?.toISOString() ?? null })) }
  } catch (error) {
    console.error("ES preventive unavailable", error)
    return <EsNavigationUnavailable email={session.email as string} title="Preventif" href="/dashboard/preventive" />
  }
  return <EsPreventiveView email={session.email as string} tasks={data.tasks} now={data.now} />
}
