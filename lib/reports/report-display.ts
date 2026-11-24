import {
  asPayloadRecord,
  FORM_014,
  FORM_065,
  getReportItems,
  hasCostEstimateFollowUp,
  hasForm065FollowUp,
  hasRepairWithoutCost,
  needsChecklistFollowUp,
} from "./checklist-follow-up"
import { readStoredCompletionEvidence } from "./completion-evidence"

const INDO_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

const PERIOD_BASE_LABELS: Record<string, string> = {
  MONTHLY: "Bulanan",
  WEEKLY: "Mingguan",
  QUARTERLY: "3 Bulanan",
  SEMESTER: "6 Bulanan",
}

/** Format period & periodKey into a human-readable Indonesian operational period label. */
export function formatChecklistPeriodLabel(
  period?: string | null,
  periodKey?: string | null,
  subPeriodLabel?: string | null,
): string {
  const key = (periodKey || "").trim()
  const base = period ? PERIOD_BASE_LABELS[period.toUpperCase()] : undefined

  if (subPeriodLabel && subPeriodLabel.trim()) {
    return base ? `${base} · ${subPeriodLabel.trim()}` : subPeriodLabel.trim()
  }

  const weekMatch = key.match(/^(\d{4})-W0?(\d{1,2})$/i)
  if (weekMatch) {
    const label = `Minggu ${Number(weekMatch[2])} (${weekMatch[1]})`
    return base ? `${base} · ${label}` : label
  }

  const monthMatch = key.match(/^(\d{4})-(\d{2})$/)
  if (monthMatch) {
    const monthName = INDO_MONTHS[Number(monthMatch[2]) - 1] || monthMatch[2]
    const label = `${monthName} ${monthMatch[1]}`
    return base ? `${base} · ${label}` : label
  }

  const quarterMatch = key.match(/^(\d{4})-Q(\d)$/i)
  if (quarterMatch) {
    const label = `Kuartal ${quarterMatch[2]} ${quarterMatch[1]}`
    return base ? `${base} · ${label}` : label
  }

  const semesterMatch = key.match(/^(\d{4})-S(\d)$/i)
  if (semesterMatch) {
    const label = `Semester ${semesterMatch[2]} ${semesterMatch[1]}`
    return base ? `${base} · ${label}` : label
  }

  if (base && key) return `${base} · ${key}`
  return base || key || "-"
}

export type NormalizedApprovalEntry = {
  actorNik: string
  actorName: string
  role: string
  stage: string
  decision: string
  notes: string
  decidedAt: string
}

/** Normalize approvalHistory entries supporting both current and legacy field names. */
export function normalizeApprovalHistory(raw: unknown): NormalizedApprovalEntry[] {
  if (!Array.isArray(raw)) return []
  const result: NormalizedApprovalEntry[] = []

  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue
    const r = entry as Record<string, unknown>
    const actorNik = String(r.approverNik ?? r.reviewerId ?? "").trim()
    const actorName = String(r.approverName ?? r.reviewerName ?? "").trim()
    const role = String(r.role ?? r.reviewerRole ?? r.accountRole ?? "").trim()
    const stage = String(r.stage ?? "").trim()
    const decision = String(r.decision ?? "").trim()
    const notes = String(r.notes ?? "").trim()
    const decidedAt = r.decidedAt ? String(r.decidedAt) : ""

    if (!decision && !actorName && !role) continue
    result.push({
      actorNik,
      actorName: actorName || actorNik || "-",
      role,
      stage,
      decision,
      notes,
      decidedAt,
    })
  }

  return result
}

export type NormalizedExecutionEntry = {
  actorNik: string
  actorName: string
  role: string
  action: string
  actionLabel: string
  previousStatus: string
  nextStatus: string
  referenceNo?: string
  notes: string
  performedAt: string
}

const EXECUTION_ACTION_LABELS: Record<string, string> = {
  PROCESS_PJU: "Proses PJU Online Dicatat",
  PROCESS_PB: "Proses Pengadaan PB Dicatat",
  PICKUP_STOCK: "Pengambilan Stock Barang Dicatat",
  START_WORK: "Pekerjaan Perbaikan Dimulai",
  FINISH_WORK: "Pekerjaan Selesai & Bukti Penyelesaian Lengkap",
}

/** Normalize executionHistory entries for UI timelines and PDFs. */
export function normalizeExecutionHistory(raw: unknown): NormalizedExecutionEntry[] {
  if (!Array.isArray(raw)) return []
  const result: NormalizedExecutionEntry[] = []

  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue
    const r = entry as Record<string, unknown>
    const action = String(r.action ?? "").trim()
    const actorNik = String(r.actorNik ?? r.actorId ?? "").trim()
    const actorName = String(r.actorName ?? "").trim()
    const role = String(r.role ?? "").trim()
    const previousStatus = String(r.previousStatus ?? r.fromStatus ?? "").trim()
    const nextStatus = String(r.nextStatus ?? r.toStatus ?? "").trim()
    const referenceNo =
      typeof r.referenceNo === "string" && r.referenceNo.trim()
        ? r.referenceNo.trim()
        : undefined
    const notes = String(r.notes ?? "").trim()
    const performedAt = String(r.performedAt ?? r.occurredAt ?? "").trim()

    if (!action && !performedAt) continue
    result.push({
      actorNik,
      actorName: actorName || actorNik || "-",
      role,
      action,
      actionLabel: EXECUTION_ACTION_LABELS[action] ?? action,
      previousStatus,
      nextStatus,
      referenceNo,
      notes,
      performedAt,
    })
  }

  return result
}

export function hasExecutionAction(raw: unknown, action: string): boolean {
  return normalizeExecutionHistory(raw).some((entry) => entry.action === action)
}

export type ReportCompletenessSummary = {
  filledItems: number
  expectedItems: number | null
  followUpLabel: string
  followUpComplete: boolean
  evidenceLabel: string
  evidenceComplete: boolean
}

/** Compute clear completeness indicators for checklist items, follow-up forms, and completion evidence. */
export function getReportCompletenessSummary(input: {
  status: string
  checklistPayload: unknown
  expectedItems?: number | null
}): ReportCompletenessSummary {
  const items = getReportItems(input.checklistPayload)
  const filledItems = items.length
  const needs014 = hasCostEstimateFollowUp(input.checklistPayload)
  const needs065 = hasForm065FollowUp(input.checklistPayload)
  const repairNoCost = hasRepairWithoutCost(input.checklistPayload)
  const pendingFollowUp = needsChecklistFollowUp(input.checklistPayload)

  let followUpLabel = "Tidak Diperlukan"
  let followUpComplete = true
  if (needs014 || needs065) {
    const formTags = [
      needs014 ? "Form 014" : null,
      needs065 ? "Form 065" : null,
    ]
      .filter(Boolean)
      .join(" + ")
    if (pendingFollowUp) {
      followUpLabel = `${formTags} (Belum Lengkap)`
      followUpComplete = false
    } else {
      followUpLabel = `${formTags} Lengkap`
    }
  } else if (repairNoCost) {
    followUpLabel = "Repair Tanpa Biaya"
  }

  const evidence = readStoredCompletionEvidence(input.checklistPayload)
  let evidenceLabel = "Tidak Diperlukan"
  let evidenceComplete = true
  if (needs014 || needs065) {
    const has014Ev = !needs014 || Boolean(evidence?.form014)
    const has065Ev = !needs065 || Boolean(evidence?.form065)
    if (has014Ev && has065Ev) {
      evidenceLabel = "Bukti Penyelesaian Lengkap"
      evidenceComplete = true
    } else if (input.status === "COMPLETED") {
      evidenceLabel = "Selesai (Laporan Historis)"
      evidenceComplete = true
    } else {
      evidenceLabel = "Menunggu Bukti Penyelesaian"
      evidenceComplete = false
    }
  }

  const payloadRecord = asPayloadRecord(input.checklistPayload)
  const hasExplicit014Or065 = items.some(
    (it) => it.repairForm === FORM_014 || it.repairForm === FORM_065,
  )
  if (!hasExplicit014Or065 && payloadRecord.followUpCompleted === true && followUpLabel === "Tidak Diperlukan") {
    followUpLabel = "Lengkap"
  }

  return {
    filledItems,
    expectedItems: input.expectedItems ?? null,
    followUpLabel,
    followUpComplete,
    evidenceLabel,
    evidenceComplete,
  }
}
