import { redirect } from "next/navigation"

import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { ChecklistRoutineView } from "@/components/es-dashboard/checklist-routine-view"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { getTodayWorkPermitStatus } from "@/lib/actions/work-permit"
import { getSession } from "@/lib/session"
import { getUserTodoTasks } from "@/lib/tasks/todo-service"
import { getRecordedTodoTasks, recordedTodoSummary } from "@/lib/tasks/recorded-todo-service"
import { validMonth, wibDate, monthLabel } from "@/lib/tasks/preventive-metrics"

export const dynamic = "force-dynamic"

export default async function ChecklistRoutinePage({ searchParams }: { searchParams?: Promise<{ status?: string; month?: string }> }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.role !== "ES" || typeof session.userId !== "string") {
    redirect("/dashboard")
  }

  const filters = await searchParams
  const month = validMonth(filters?.month) ? filters.month : null
  const historical = month !== null && month !== wibDate(new Date()).slice(0, 7)
  const initialStatus = filters?.status === "PENDING" || filters?.status === "COMPLETED" || filters?.status === "OVERDUE" ? filters.status : "ALL"
  const [todoData, permitStatus] = await Promise.all([
    month ? getRecordedTodoTasks(session.userId).then(tasks => recordedTodoSummary(tasks, month)) : getUserTodoTasks(session.userId),
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
        {month && <p className="mt-4 text-sm text-muted-foreground">Target tercatat: {monthLabel(month)}{historical ? " · Riwayat (hanya lihat)" : ""}</p>}
        <ChecklistRoutineView key={`${month ?? "active"}-${initialStatus}`} todoData={todoData} initialStatus={initialStatus} hasActivePermit={!historical && permitStatus?.status === "APPROVED"} />
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
