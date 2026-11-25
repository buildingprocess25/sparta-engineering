import { getPrisma } from "@/lib/prisma"
import { getChecklistFormConfig } from "@/lib/checklist-config"
import type { UserTodoTaskItem, UserTodoSummary } from "./todo-service"
import { recordedTaskStatus, wibDate } from "./preventive-metrics"

export type RecordedTodoTask = UserTodoTaskItem & { reportStatus: string | null }

/** Read-only: never backfill or upsert historical tasks for the analytics dashboard. */
export async function getRecordedTodoTasks(userNik: string, now = new Date()): Promise<RecordedTodoTask[]> {
  const rows = await getPrisma().checklistTask.findMany({
    where: { assignment: { userNik }, status: { not: "CANCELLED" } },
    include: {
      assignment: { include: { equipment: { include: { area: true, room: { include: { area: true } } } }, room: { include: { area: true } } } },
      report: { select: { reportCode: true, status: true, authorId: true } },
    },
    orderBy: [{ targetDate: "asc" }, { id: "asc" }],
  })
  return rows.map(t => {
    const equip = t.assignment.equipment
    const room = t.assignment.room
    const report = t.report?.authorId === userNik ? t.report : null
    return {
      id: t.id, assignmentId: t.assignmentId, targetDate: t.targetDate, periodKey: t.periodKey,
      status: recordedTaskStatus(t, now) as UserTodoTaskItem["status"],
      completedAt: t.completedAt, period: t.assignment.period, formCode: t.assignment.formCode,
      formSlug: t.assignment.isActive ? getChecklistFormConfig(t.assignment.formCode)?.id ?? null : null,
      objectName: equip ? `${equip.name}${equip.unitNo ? ` Unit ${equip.unitNo}` : ""}` : room?.name ?? "Objek Checklist",
      objectType: equip ? "EQUIPMENT" : room ? "ROOM" : "EQUIPMENT",
      unitNo: equip?.unitNo, branchName: equip?.branchName,
      areaName: room?.area?.name ?? equip?.room?.area?.name ?? equip?.area?.name ?? null,
      reportCode: report?.reportCode ?? null, reportStatus: report?.status ?? null,
    }
  })
}

export function recordedTodoSummary(tasks: RecordedTodoTask[], month: string): UserTodoSummary {
  const selected = tasks.filter(t => wibDate(t.targetDate).startsWith(month))
  return { tasks: selected, total: selected.length, pending: selected.filter(t => t.status === "PENDING").length, completed: selected.filter(t => t.status === "COMPLETED").length, overdue: selected.filter(t => t.status === "OVERDUE").length }
}
