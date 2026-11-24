import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"
import { getReportItems } from "./checklist-follow-up"
import {
  COMPLETION_EVIDENCE_LABELS,
  readStoredCompletionEvidence,
  type EvidencePhoto,
} from "./completion-evidence"
import type { PdfReportData, PdfReportPhoto } from "./pdf-generator"
import { formatChecklistPeriodLabel } from "./report-display"

export type MappablePdfReport = {
  reportCode: string | null
  formCode: string | null
  period: string | null
  periodKey: string | null
  createdAt: Date | string
  isSafe: boolean
  status: string
  approvalHistory?: unknown
  executionHistory?: unknown
  checklistPayload: unknown
  area: { name: string }
  room?: { name: string } | null
  equipment?: {
    name: string
    code: string
    branchName: string
  } | null
  author: {
    NIK: string
    name: string
    branchName: string
  }
}

export type DownloadPhotoBytes = (fileId: string) => Promise<Buffer | null>

/** Map a persisted ChecklistReport record into PdfReportData for both HTTP PDF and Google Drive sync. */
export async function buildReportPdfData(
  report: MappablePdfReport,
  fallbackReportCode: string,
  downloadPhoto: DownloadPhotoBytes,
): Promise<PdfReportData> {
  const rawPayload = (report.checklistPayload as unknown as ChecklistPayload) || {}
  const rawItems = getReportItems(report.checklistPayload)
  const completionEvidence = readStoredCompletionEvidence(report.checklistPayload)

  const formattedItems: PdfReportData["items"] = rawItems.map(
    (item: ChecklistPayloadItem, index: number) => ({
      id: item.id || String(index + 1),
      label: item.label || `Item ${index + 1}`,
      condition: item.condition || "BAIK",
      actionCode: (item as unknown as { actionCode?: string }).actionCode || "Ch",
      notes: item.notes || undefined,
      handler: item.handler || undefined,
      photosCount: Array.isArray(item.photos) ? item.photos.length : 0,
    }),
  )

  const photosList: PdfReportPhoto[] = []

  for (let idx = 0; idx < rawItems.length; idx++) {
    const item = rawItems[idx]
    if (!Array.isArray(item.photos) || item.photos.length === 0) continue
    for (const p of item.photos) {
      if (!p.fileId) continue
      let imgBytes: Buffer | null = null
      try {
        imgBytes = await downloadPhoto(p.fileId)
      } catch {
        // fallback gracefully when Drive photo bytes are unavailable
      }
      photosList.push({
        itemNo: idx + 1,
        label: item.label,
        condition: item.condition || "BAIK",
        notes: item.notes,
        fileId: p.fileId,
        imageBytes: imgBytes,
      })
    }
  }

  const completionGroups: Array<{ label: string; photos: EvidencePhoto[] }> = []
  if (completionEvidence?.form014) {
    completionGroups.push(
      { label: COMPLETION_EVIDENCE_LABELS.WORK_PROGRESS, photos: completionEvidence.form014.workPhotos },
      { label: COMPLETION_EVIDENCE_LABELS.PURCHASE_RECEIPT, photos: completionEvidence.form014.receiptPhotos },
      { label: COMPLETION_EVIDENCE_LABELS.REFUND_TRANSFER, photos: completionEvidence.form014.refundTransferPhotos },
    )
  }
  if (completionEvidence?.form065) {
    completionGroups.push(
      { label: COMPLETION_EVIDENCE_LABELS.REPAIR_UNIT, photos: completionEvidence.form065.repairWithUnitPhotos },
      { label: COMPLETION_EVIDENCE_LABELS.USER_SELFIE, photos: completionEvidence.form065.selfieWithUserPhotos },
    )
  }

  let compNo = rawItems.length
  for (const group of completionGroups) {
    for (const p of group.photos) {
      if (!p.fileId) continue
      compNo += 1
      let imgBytes: Buffer | null = null
      try {
        imgBytes = await downloadPhoto(p.fileId)
      } catch {
        // fallback gracefully
      }
      photosList.push({
        itemNo: compNo,
        label: `Bukti Penyelesaian - ${group.label}`,
        condition: "BUKTI_SELESAI",
        notes: completionEvidence?.notes,
        fileId: p.fileId,
        imageBytes: imgBytes,
      })
    }
  }

  const branchName =
    report.equipment?.branchName || report.author.branchName || "HEAD OFFICE"
  const periodKey = report.periodKey || rawPayload.periodKey || "2026-10"

  return {
    reportCode: report.reportCode || fallbackReportCode,
    formCode: report.formCode || rawPayload.formCode || "FRM_TS_016",
    formName: rawPayload.formName || `FORM CHECKLIST ${report.formCode || ""}`,
    periodKey,
    periodLabel: formatChecklistPeriodLabel(
      report.period || rawPayload.period,
      periodKey,
      rawPayload.subPeriodLabel,
    ),
    createdAt: report.createdAt,
    branchName,
    areaName: report.area.name,
    roomName: report.room?.name,
    equipmentName: report.equipment?.name,
    equipmentCode: report.equipment?.code,
    equipmentSerial: rawPayload.unitNo || report.equipment?.code || null,
    equipmentBrand: rawPayload.unitBrand || null,
    authorName: report.author.name,
    authorNik: report.author.NIK,
    isSafe: report.isSafe,
    status: report.status,
    approvalHistory: Array.isArray(report.approvalHistory)
      ? (report.approvalHistory as PdfReportData["approvalHistory"])
      : [],
    executionHistory: Array.isArray(report.executionHistory)
      ? (report.executionHistory as unknown[])
      : [],
    checklistPayload: report.checklistPayload,
    completionEvidence,
    generalNotes: rawPayload.generalNotes,
    items: formattedItems,
    photos: photosList,
  }
}
