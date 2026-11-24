import { asPayloadRecord } from "./checklist-follow-up"
import { normalizeApprovalHistory, normalizeExecutionHistory, type NormalizedApprovalEntry, type NormalizedExecutionEntry } from "./report-display"

function validTime(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null
  return value
}

type ReportTimes = {
  checklistPayload: unknown
  approvalHistory?: unknown
  executionHistory?: unknown
  createdAt: string
  status: string
  revisions: readonly unknown[]
}

/** Never accept a submission timestamp supplied by the browser. Preserve only the stored value. */
export function withReviewSubmittedAt(payload: object, previous: unknown, readyAt: Date | null) {
  const result = { ...asPayloadRecord(payload) }
  delete result.reviewSubmittedAt
  const original = validTime(asPayloadRecord(previous).reviewSubmittedAt)
  if (original) result.reviewSubmittedAt = original
  else if (readyAt) result.reviewSubmittedAt = readyAt.toISOString()
  return result
}

/** Legacy follow-up completion is usable only when it predates the first approval and has no revision. */
export function getReviewSubmittedAt(report: ReportTimes): string | null {
  const payload = asPayloadRecord(report.checklistPayload)
  const explicit = validTime(payload.reviewSubmittedAt)
  const firstApproval = normalizeApprovalHistory(report.approvalHistory)
    .map((entry) => Date.parse(entry.decidedAt)).filter(Number.isFinite).sort((a, b) => a - b)[0]
  const createdAt = Date.parse(report.createdAt)
  const withinBounds = (time: string) => (!Number.isFinite(createdAt) || Date.parse(time) >= createdAt)
    && (firstApproval === undefined || Date.parse(time) <= firstApproval)
  if (explicit && withinBounds(explicit)) return explicit
  const followUp = validTime(payload.followUpCompletedAt)
  return report.revisions.length === 0 && followUp && withinBounds(followUp) ? followUp : null
}

export function getReportCompletedAt(report: ReportTimes): string | null {
  if (report.status !== "COMPLETED") return null
  const finished = normalizeExecutionHistory(report.executionHistory)
    .filter((entry) => entry.action === "FINISH_WORK" && entry.nextStatus === "COMPLETED")
    .map((entry) => validTime(entry.performedAt)).filter((time): time is string => time !== null)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
  if (finished) return finished
  const approval = normalizeApprovalHistory(report.approvalHistory).slice(-1)[0]
  return approval?.role === "MANAGER" && approval.decision === "approve" ? validTime(approval.decidedAt) : null
}

type HistoryEvent = { kind: "approval"; entry: NormalizedApprovalEntry; at: string }
  | { kind: "execution"; entry: NormalizedExecutionEntry; at: string }

export function mergeReportHistory(approvals: NormalizedApprovalEntry[], executions: NormalizedExecutionEntry[]): HistoryEvent[] {
  const entries: HistoryEvent[] = [
    ...approvals.map((entry) => ({ kind: "approval" as const, entry, at: entry.decidedAt })),
    ...executions.map((entry) => ({ kind: "execution" as const, entry, at: entry.performedAt })),
  ]
  const time = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : Number.MAX_SAFE_INTEGER
  return entries.sort((a, b) => time(a.at) - time(b.at))
}
