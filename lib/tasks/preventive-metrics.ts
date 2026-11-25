/** Analytics uses recorded tasks, not generated retrospective assignments. WIB is explicit. */
export function wibDate(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value))
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

export const validMonth = (value: unknown): value is string => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${month}-01T00:00:00+07:00`))
}
export function monthOffset(month: string, offset: number) {
  const [year, m] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, m - 1 + offset, 1))
  return date.toISOString().slice(0, 7)
}
export type RecordedTask = {
  id: string
  targetDate: Date | string
  completedAt: Date | string | null
  status: string
  objectType: "EQUIPMENT" | "ROOM"
  reportStatus: string | null
}
export function recordedTaskStatus(task: Pick<RecordedTask, "status" | "targetDate">, now: Date | string) {
  if (task.status === "PENDING" && new Date(task.targetDate).getTime() < new Date(now).getTime()) return "OVERDUE"
  return task.status
}
export function summarizePreventive(tasks: readonly RecordedTask[], month: string, now: Date | string) {
  const rows = tasks.filter(task => task.status !== "CANCELLED" && wibDate(task.targetDate).startsWith(month))
  const count = (status: string) => rows.filter(task => recordedTaskStatus(task, now) === status).length
  const total = rows.length
  const completed = count("COMPLETED")
  const approvalPending = rows.filter(t => t.status === "COMPLETED" && ["PENDING_COORD", "PENDING_MANAGER", "PENDING_REQUESTER"].includes(t.reportStatus ?? "")).length
  const notFinal = rows.filter(t => t.status === "COMPLETED" && t.reportStatus !== "COMPLETED").length
  const onTime = rows.filter(t => t.status === "COMPLETED" && t.completedAt && new Date(t.completedAt).getTime() <= new Date(t.targetDate).getTime()).length
  return { total, completed, pending: count("PENDING"), overdue: count("OVERDUE"), approvalPending, notFinal, onTime, percentage: total ? Math.round(completed / total * 100) : null }
}

/** A date has a single soft surface; mixed tasks use the most urgent status. */
export function calendarTaskHighlight(tasks: readonly Pick<RecordedTask, "status" | "targetDate">[], now: Date | string) {
  const statuses = tasks.filter(t=>t.status!=="CANCELLED").map(t=>recordedTaskStatus(t,now))
  if (statuses.includes("OVERDUE")) return "OVERDUE"
  if (statuses.some(s=>s!=="COMPLETED")) return "PENDING"
  return statuses.length ? "COMPLETED" : null
}
