import { redirect } from "next/navigation"

import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { ChecklistRoutineView } from "@/components/es-dashboard/checklist-routine-view"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { getTodayWorkPermitStatus } from "@/lib/actions/work-permit"
import { getSession } from "@/lib/session"
import { getUserTodoTasks } from "@/lib/tasks/todo-service"

export const dynamic = "force-dynamic"

export default async function ChecklistRoutinePage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "ES" || typeof session.userId !== "string") {
    redirect("/dashboard")
  }

  const [todoData, permitStatus] = await Promise.all([
    getUserTodoTasks(session.userId),
    getTodayWorkPermitStatus(session.userId),
  ])

  return (
    <>
      <DashboardShell contentClassName="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl sm:px-6 md:px-8">
        <DashboardHeader
          title="Checklist Rutin"
          subtitle="SPARTA Engineering"
          email={session.email as string}
          role="ES"
        />
        <ChecklistRoutineView todoData={todoData} hasActivePermit={permitStatus?.status === "APPROVED"} />
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
