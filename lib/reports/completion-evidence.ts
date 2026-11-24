import {
  asPayloadRecord,
  hasCostEstimateFollowUp,
  hasForm065FollowUp,
} from "./checklist-follow-up"

export type EvidencePhoto = {
  fileId: string
  url: string
}

export type Form014CompletionEvidence = {
  workPhotos: EvidencePhoto[]
  receiptPhotos: EvidencePhoto[]
  refundTransferPhotos: EvidencePhoto[]
  actualPurchaseAmount: number
}

export type Form065CompletionEvidence = {
  handoverConfirmed: boolean
  handoverRecipient: string
  handoverNotes?: string
  repairWithUnitPhotos: EvidencePhoto[]
  selfieWithUserPhotos: EvidencePhoto[]
}

export type ReportCompletionEvidence = {
  form014?: Form014CompletionEvidence
  form065?: Form065CompletionEvidence
  notes?: string
  submittedAt?: string
  submittedByNik?: string
  submittedByName?: string
}

export const COMPLETION_EVIDENCE_TYPES = [
  "WORK_PROGRESS",
  "PURCHASE_RECEIPT",
  "REFUND_TRANSFER",
  "REPAIR_UNIT",
  "USER_SELFIE",
] as const

export type CompletionEvidenceType = (typeof COMPLETION_EVIDENCE_TYPES)[number]

export const COMPLETION_EVIDENCE_LABELS: Record<CompletionEvidenceType, string> = {
  WORK_PROGRESS: "Foto Saat Pekerjaan (014)",
  PURCHASE_RECEIPT: "Foto Bon Pembelian (014)",
  REFUND_TRANSFER: "Bukti Transfer Pengembalian Dana (014)",
  REPAIR_UNIT: "Foto dengan Unit Saat Perbaikan (065)",
  USER_SELFIE: "Foto Selfie dengan User (065)",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizePhotos(value: unknown): EvidencePhoto[] | null {
  if (!Array.isArray(value)) return []
  const photos: EvidencePhoto[] = []
  for (const entry of value) {
    if (!isRecord(entry)) return null
    if (
      typeof entry.fileId !== "string" ||
      !entry.fileId.trim() ||
      typeof entry.url !== "string" ||
      !entry.url.trim()
    ) {
      return null
    }
    photos.push({ fileId: entry.fileId.trim(), url: entry.url.trim() })
  }
  return photos
}

/** Validate mandatory completion evidence for Form 014 and Form 065 before completing a report. */
export function validateCompletionEvidence(
  payload: unknown,
  evidence: unknown,
): {
  valid: boolean
  errors: string[]
  normalized?: ReportCompletionEvidence
} {
  const needs014 = hasCostEstimateFollowUp(payload)
  const needs065 = hasForm065FollowUp(payload)

  if (!needs014 && !needs065) {
    const raw = isRecord(evidence) ? evidence : {}
    return {
      valid: true,
      errors: [],
      normalized: {
        notes: typeof raw.notes === "string" ? raw.notes.trim() || undefined : undefined,
      },
    }
  }

  if (!isRecord(evidence)) {
    return {
      valid: false,
      errors: ["Bukti penyelesaian pekerjaan wajib dilengkapi sebelum menyelesaikan laporan."],
    }
  }

  const errors: string[] = []
  const normalized: ReportCompletionEvidence = {
    notes:
      typeof evidence.notes === "string"
        ? evidence.notes.trim() || undefined
        : undefined,
  }

  if (needs014) {
    const raw014 = isRecord(evidence.form014) ? evidence.form014 : null
    if (!raw014) {
      errors.push("Bukti penyelesaian Form 014 wajib dilengkapi.")
    } else {
      const workPhotos = normalizePhotos(raw014.workPhotos)
      const receiptPhotos = normalizePhotos(raw014.receiptPhotos)
      const refundTransferPhotos = normalizePhotos(raw014.refundTransferPhotos)
      const actual = Number(raw014.actualPurchaseAmount)

      if (!workPhotos || workPhotos.length === 0) {
        errors.push("Foto saat pekerjaan (Form 014) wajib diunggah.")
      }
      if (!receiptPhotos || receiptPhotos.length === 0) {
        errors.push("Foto bon pembelian (Form 014) wajib diunggah.")
      }
      if (!refundTransferPhotos || refundTransferPhotos.length === 0) {
        errors.push("Bukti transfer pengembalian dana (Form 014) wajib diunggah.")
      }
      if (
        raw014.actualPurchaseAmount === undefined ||
        raw014.actualPurchaseAmount === null ||
        raw014.actualPurchaseAmount === "" ||
        !Number.isFinite(actual) ||
        actual < 0
      ) {
        errors.push("Actual pembelian barang (Rp) wajib diisi dengan angka valid >= 0.")
      }

      if (
        workPhotos &&
        receiptPhotos &&
        refundTransferPhotos &&
        Number.isFinite(actual) &&
        actual >= 0
      ) {
        normalized.form014 = {
          workPhotos,
          receiptPhotos,
          refundTransferPhotos,
          actualPurchaseAmount: actual,
        }
      }
    }
  }

  if (needs065) {
    const raw065 = isRecord(evidence.form065) ? evidence.form065 : null
    if (!raw065) {
      errors.push("Bukti penyelesaian Form 065 wajib dilengkapi.")
    } else {
      const handoverConfirmed = raw065.handoverConfirmed === true
      const handoverRecipient =
        typeof raw065.handoverRecipient === "string"
          ? raw065.handoverRecipient.trim()
          : ""
      const handoverNotes =
        typeof raw065.handoverNotes === "string"
          ? raw065.handoverNotes.trim() || undefined
          : undefined
      const repairWithUnitPhotos = normalizePhotos(raw065.repairWithUnitPhotos)
      const selfieWithUserPhotos = normalizePhotos(raw065.selfieWithUserPhotos)

      if (!handoverConfirmed || !handoverRecipient) {
        errors.push("Konfirmasi serah terima unit selesai dan nama penerima wajib diisi.")
      }
      if (!repairWithUnitPhotos || repairWithUnitPhotos.length === 0) {
        errors.push("Foto dengan unit saat perbaikan (Form 065) wajib diunggah.")
      }
      if (!selfieWithUserPhotos || selfieWithUserPhotos.length === 0) {
        errors.push("Foto selfie dengan user (Form 065) wajib diunggah.")
      }

      if (
        handoverConfirmed &&
        handoverRecipient &&
        repairWithUnitPhotos &&
        selfieWithUserPhotos
      ) {
        normalized.form065 = {
          handoverConfirmed,
          handoverRecipient,
          handoverNotes,
          repairWithUnitPhotos,
          selfieWithUserPhotos,
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? normalized : undefined,
  }
}

/** Extract all fileIds referenced in completion evidence. */
export function extractCompletionEvidencePhotoIds(
  evidence?: ReportCompletionEvidence | null,
): string[] {
  if (!evidence) return []
  const ids: string[] = []
  if (evidence.form014) {
    for (const p of evidence.form014.workPhotos) ids.push(p.fileId)
    for (const p of evidence.form014.receiptPhotos) ids.push(p.fileId)
    for (const p of evidence.form014.refundTransferPhotos) ids.push(p.fileId)
  }
  if (evidence.form065) {
    for (const p of evidence.form065.repairWithUnitPhotos) ids.push(p.fileId)
    for (const p of evidence.form065.selfieWithUserPhotos) ids.push(p.fileId)
  }
  return [...new Set(ids)]
}

/** Read persisted completion evidence from checklistPayload defensively. */
export function readStoredCompletionEvidence(
  checklistPayload: unknown,
): ReportCompletionEvidence | null {
  const payload = asPayloadRecord(checklistPayload)
  const raw = payload.completionEvidence
  return isRecord(raw) ? (raw as ReportCompletionEvidence) : null
}
