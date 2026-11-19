import { ActivityHistoryView } from "@/components/es-dashboard/activity-history-view"
import { PlaceholderScreen } from "@/components/es-dashboard/placeholder-screen"
import { getUserTodoTasks } from "@/lib/tasks/todo-service"
import { getSession } from "@/lib/session"
import { getPrisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

interface ActivityPageProps {
  searchParams?: Promise<{ tab?: string }>
}

export default async function ActivityPage(props: ActivityPageProps) {
  const searchParams = await props.searchParams
  const session = await getSession()
  
  if (typeof session?.userId !== "string") {
    redirect("/login")
  }

  if (session.role === "ES") {
    const authorId = session.userId
    const [todoData, reports] = await Promise.all([
      getUserTodoTasks(authorId),
      getPrisma().checklistReport.findMany({
        where: { authorId, status: { not: "DRAFT" }, reportCode: { not: null } },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          id: true, reportCode: true, formCode: true, taskId: true, periodKey: true, status: true,
          equipment: { select: { name: true, unitNo: true } },
          room: { select: { name: true } },
          area: { select: { name: true } },
        },
      }),
    ])

    return (
      <ActivityHistoryView
        todoData={todoData}
        reports={reports.flatMap((report) => report.reportCode ? [{
          id: report.id,
          reportCode: report.reportCode,
          formCode: report.formCode,
          isRoutine: Boolean(report.taskId),
          isEquipment: Boolean(report.equipment),
          status: report.status,
          periodKey: report.periodKey,
          target: report.equipment
            ? `${report.equipment.name}${report.equipment.unitNo ? ` Unit ${report.equipment.unitNo}` : ""}`
            : report.room?.name ?? report.area.name,
        }] : [])}
        userEmail={session.email as string}
        userRole={session.role as string}
        initialTab={searchParams?.tab === "revision" ? "revision" : searchParams?.tab === "overdue" ? "overdue" : searchParams?.tab === "completed" ? "completed" : "submitted"}
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
