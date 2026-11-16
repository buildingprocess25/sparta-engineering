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

  // Jika teknisi ES, tampilkan riwayat aktivitas checklist (Selesai & Terlewat)
  if (session.role === "ES") {
    const authorId = session.userId
    const [todoData, revisions] = await Promise.all([
      getUserTodoTasks(authorId),
      getPrisma().checklistReport.findMany({
        where: { authorId, status: "NEEDS_REVISION", reportCode: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, reportCode: true, formCode: true, taskId: true, periodKey: true,
          equipment: { select: { name: true, unitNo: true } },
          room: { select: { name: true } },
          area: { select: { name: true } },
        },
      }),
    ])

    return (
      <ActivityHistoryView
        todoData={todoData}
        revisions={revisions.flatMap((report) => report.reportCode ? [{
          id: report.id,
          reportCode: report.reportCode,
          formCode: report.formCode,
          isRoutine: Boolean(report.taskId),
          periodKey: report.periodKey,
          target: report.equipment
            ? `${report.equipment.name}${report.equipment.unitNo ? ` Unit ${report.equipment.unitNo}` : ""}`
            : report.room?.name ?? report.area.name,
        }] : [])}
        userEmail={session.email as string}
        userRole={session.role as string}
        initialTab={searchParams?.tab === "revision" ? "revision" : searchParams?.tab === "overdue" ? "overdue" : "completed"}
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
