export const ENGINEERING_FOLDER = "Engineering"
export const CHECKLIST_FOLDER = "Checklist"
export const REPORT_DOCUMENT_FOLDER = "01 - Dokumen"
export const CHECKLIST_PHOTO_FOLDER = "02 - Foto Checklist"

export type ChecklistReportPathInput = {
  branchName: string
  areaName: string
  periodKey: string
  reportCode: string
}

export type ChecklistEvidencePathInput = {
  formCode: string
  itemId: string
  itemName: string
}

export function sanitizeDriveSegment(value: string): string {
  return value.replaceAll("/", "-").replaceAll("\\", "-").trim() || "-"
}

export function buildChecklistReportRelativePath(
  input: ChecklistReportPathInput,
): string[] {
  return [
    sanitizeDriveSegment(input.branchName),
    ENGINEERING_FOLDER,
    CHECKLIST_FOLDER,
    sanitizeDriveSegment(input.areaName),
    sanitizeDriveSegment(input.periodKey),
    sanitizeDriveSegment(input.reportCode),
  ]
}

export function buildChecklistEvidenceRelativePath(
  input: ChecklistEvidencePathInput,
): string[] {
  return [
    CHECKLIST_PHOTO_FOLDER,
    sanitizeDriveSegment(input.formCode),
    `${sanitizeDriveSegment(input.itemId)} - ${sanitizeDriveSegment(input.itemName)}`,
  ]
}

export function buildFinalPdfName(reportCode: string): string {
  return `${sanitizeDriveSegment(reportCode)} - Laporan Final.pdf`
}

export function buildChecklistPhotoName(input: {
  sequence: number
  randomSuffix: string
  extension: string
}): string {
  return `checklist-${String(input.sequence).padStart(3, "0")}-${sanitizeDriveSegment(input.randomSuffix)}.${sanitizeDriveSegment(input.extension).toLowerCase()}`
}
