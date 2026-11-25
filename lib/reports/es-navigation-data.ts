import { getPrisma } from "@/lib/prisma"
import { needsChecklistFollowUp } from "./checklist-follow-up"
import { formatChecklistPeriodLabel, normalizeApprovalHistory, normalizeExecutionHistory } from "./report-display"
import { getReviewSubmittedAt } from "./report-timestamps"

export type EsReportRow = { code: string; target: string; area: string; form: string; period: string; periodKey: string | null; kind: "ROUTINE" | "GENERAL" | "INCIDENTAL"; status: string; pendingFollowUp: boolean; createdAt: string; updatedAt: string }
export type EsActivityEvent = { id: string; code: string; target: string; kind: "SUBMISSION" | "APPROVAL" | "REVISION" | "EXECUTION"; title: string; at: string; actor: string; notes: string }
const roles: Record<string, string> = { COORD: "BEC", MANAGER: "Manager", REQUESTER: "Requester", ES: "BES" }

async function ownedReports(userNik: string) {
  return getPrisma().checklistReport.findMany({
    where: { authorId: userNik, reportCode: { not: null } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { id: true, reportCode: true, formCode: true, status: true, category: true, period: true, periodKey: true, taskId: true, createdAt: true, updatedAt: true, checklistPayload: true, approvalHistory: true, executionHistory: true, author: { select: { name: true } }, area: { select: { name: true } }, room: { select: { name: true } }, equipment: { select: { name: true, unitNo: true } }, task: { select: { assignment: { select: { room: { select: { name: true } } } } } }, revisions: { select: { id: true, requestedAt: true, resubmittedAt: true, reviewerName: true, reason: true } } },
  })
}
type OwnedReport = Awaited<ReturnType<typeof ownedReports>>[number]
function target(report: OwnedReport) {
  return report.equipment ? `${report.equipment.name}${report.equipment.unitNo ? ` Unit ${report.equipment.unitNo}` : ""}` : report.room?.name ?? report.task?.assignment.room?.name ?? report.area.name
}
export async function getEsReportRows(userNik: string): Promise<EsReportRow[]> {
  return (await ownedReports(userNik)).flatMap(r => r.reportCode ? [{ code: r.reportCode, target: target(r), area: r.area.name, form: r.formCode ?? "—", period: formatChecklistPeriodLabel(r.period, r.periodKey), periodKey: r.periodKey, kind: r.taskId ? "ROUTINE" : r.category === "INCIDENTAL" ? "INCIDENTAL" : "GENERAL", status: r.status, pendingFollowUp: r.status === "PENDING_COORD" && needsChecklistFollowUp(r.checklistPayload), createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }] : [])
}
export async function getEsActivityEvents(userNik: string): Promise<EsActivityEvent[]> {
  const events: EsActivityEvent[] = []
  for (const r of await ownedReports(userNik)) {
    if (!r.reportCode || r.status === "DRAFT") continue
    const base = { code: r.reportCode, target: target(r) }
    const add = (id: string, kind: EsActivityEvent["kind"], title: string, at: string | null | undefined, actor: string, notes = "") => {
      if (at && Number.isFinite(Date.parse(at))) events.push({ ...base, id: `${r.id}-${id}`, kind, title, at, actor, notes })
    }
    add("submit", "SUBMISSION", "Laporan siap ditinjau BEC", getReviewSubmittedAt({ ...r, createdAt: r.createdAt.toISOString() }), r.author.name)
    normalizeApprovalHistory(r.approvalHistory).forEach((a, i) => {
      const role = roles[a.role] ?? (a.role || "Reviewer")
      const decision = a.decision.toLowerCase()
      const revise = ["reject_revision", "revise", "revision", "request_revision", "needs_revision"].includes(decision)
      add(`approval-${i}`, revise ? "REVISION" : "APPROVAL", decision === "approve" ? `Disetujui ${role}` : decision === "reject" ? `Ditolak ${role}` : revise ? `Revisi diminta ${role}` : `Keputusan ${role}: ${a.decision || "—"}`, a.decidedAt, a.actorName, a.notes)
    })
    for (const rev of r.revisions) {
      const already = events.some(e => e.code === r.reportCode && e.kind === "REVISION" && rev.requestedAt && Date.parse(e.at) === rev.requestedAt.getTime())
      if (!already) add(`revision-${rev.id}`, "REVISION", "Revisi diminta", rev.requestedAt?.toISOString(), rev.reviewerName ?? "—", rev.reason ?? "")
      add(`resubmit-${rev.id}`, "REVISION", "Revisi dikirim kembali", rev.resubmittedAt?.toISOString(), r.author.name)
    }
    normalizeExecutionHistory(r.executionHistory).forEach((e, i) => add(`execution-${i}`, "EXECUTION", e.actionLabel || "Pelaksanaan pekerjaan", e.performedAt, e.actorName, [e.referenceNo, e.notes].filter(Boolean).join(" · ")))
  }
  return events.sort((a,b) => Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id))
}
