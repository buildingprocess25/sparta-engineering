export const CHECKLIST_CONDITIONS = [
  "ADJUST_OR_ADD",
  "BAIK",
  "CLEAN",
  "REPAIR",
  "RUSAK",
  "TIDAK_ADA",
  "URGENT",
] as const

export type ChecklistCondition = (typeof CHECKLIST_CONDITIONS)[number]

export type ChecklistPhoto = {
  fileId: string
  url: string
}

export type ChecklistPayloadItem = {
  id: string
  label: string
  condition: ChecklistCondition
  photos: ChecklistPhoto[]
  notes?: string
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  repairFormName?: string
  value?: string
  unitNo?: string
  followUpCode?: string
  actionTaken?: string
}

export type ChecklistPayload = {
  formCode: string
  formName: string
  areaCode: string
  period: "MONTHLY" | "WEEKLY" | "QUARTERLY" | "SEMESTER"
  periodKey: string
  items: ChecklistPayloadItem[]

  unitNo?: string
  unitBrand?: string
  unitModel?: string
  capacityKva?: string
  inspectionDate?: string
  inspectionEndDate?: string
  hourMeter?: string
  generalNotes?: string
  locationCode?: string
  inspectionYear?: string
  jenisHydrant?: string
  jenisPerawatan?: string
  subPeriod?: string
  subPeriodLabel?: string
  dayaPLTS?: string
  tahunPLTS?: string
}

export type ChecklistPayloadValidationResult = {
  valid: boolean
  errors: string[]
}

const CONDITION_SET = new Set<string>(CHECKLIST_CONDITIONS)
const ACTION_REQUIRED_CONDITIONS = new Set<ChecklistCondition>([
  "RUSAK",
  "REPAIR",
  "URGENT",
  "ADJUST_OR_ADD",
  "CLEAN",
])

const V7_TARGET_BASE_FORMS = new Set(["FRM_TS_041", "FRM_TS_028"])
const FRM_TS_041_ALLOWED = new Set<ChecklistCondition>([
  "BAIK",
  "RUSAK",
  "ADJUST_OR_ADD",
  "REPAIR",
  "URGENT",
  "TIDAK_ADA",
])
const FRM_TS_041_FINDINGS = new Set<ChecklistCondition>([
  "RUSAK",
  "ADJUST_OR_ADD",
  "REPAIR",
  "URGENT",
])
const FRM_TS_028_ALLOWED = new Set<ChecklistCondition>([
  "BAIK",
  "RUSAK",
  "REPAIR",
  "URGENT",
  "TIDAK_ADA",
])
const FRM_TS_028_FINDINGS = new Set<ChecklistCondition>([
  "RUSAK",
  "REPAIR",
  "URGENT",
])

function hasFollowUpReference(item: Record<string, unknown>): boolean {
  return Boolean(
    (typeof item.repairForm === "string" && item.repairForm.trim()) ||
      (typeof item.repairFormName === "string" && item.repairFormName.trim()) ||
      item.followUp014 !== undefined ||
      item.followUp065 !== undefined ||
      item.followUpData !== undefined,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isChecklistPayload(value: unknown): value is ChecklistPayload {
  if (!isRecord(value) || !Array.isArray(value.items)) return false

  return (
    typeof value.formCode === "string" &&
    typeof value.formName === "string" &&
    typeof value.areaCode === "string" &&
    (value.period === "MONTHLY" ||
      value.period === "WEEKLY" ||
      value.period === "QUARTERLY" ||
      value.period === "SEMESTER") &&
    typeof value.periodKey === "string"
  )
}

function isChecklistItem(value: unknown): value is ChecklistPayloadItem {
  if (!isRecord(value)) return false

  const isValidHandler =
    value.handler === undefined ||
    value.handler === "BES" ||
    value.handler === "EKSTERNAL"

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.condition === "string" &&
    CONDITION_SET.has(value.condition) &&
    Array.isArray(value.photos) &&
    isValidHandler &&
    (value.repairForm === undefined || typeof value.repairForm === "string") &&
    (value.unitNo === undefined || typeof value.unitNo === "string")
  )
}

export function validateChecklistPayload(
  payload: unknown
): ChecklistPayloadValidationResult {
  if (!isChecklistPayload(payload)) {
    return { valid: false, errors: ["Payload checklist tidak valid."] }
  }

  const errors: string[] = []
  const isRepairForm = payload.formCode.endsWith("_REPAIR")
  const baseFormCode = payload.formCode.replace(/_REPAIR$/, "")
  const isV7Form = V7_TARGET_BASE_FORMS.has(baseFormCode)

  if (isV7Form && isRepairForm && payload.items.length === 0) {
    errors.push("Minimal 1 item temuan wajib diisi pada laporan perbaikan/temuan.")
  }

  for (const item of payload.items) {
    if (!isChecklistItem(item)) {
      errors.push("Item checklist tidak valid.")
      continue
    }

    const requiresAction = ACTION_REQUIRED_CONDITIONS.has(item.condition)

    // For RUSAK, photo is still required
    if (item.condition === "RUSAK" && item.photos.length === 0) {
      errors.push(
        `${item.label} wajib memiliki foto untuk kondisi ${item.condition}.`
      )
    }

    if (isV7Form) {
      const allowed =
        baseFormCode === "FRM_TS_041"
          ? isRepairForm
            ? FRM_TS_041_FINDINGS
            : FRM_TS_041_ALLOWED
          : isRepairForm
            ? FRM_TS_028_FINDINGS
            : FRM_TS_028_ALLOWED

      if (!allowed.has(item.condition)) {
        errors.push(
          `${item.label} memiliki kondisi ${item.condition} yang tidak valid untuk form ${payload.formCode}.`
        )
      }

      if (item.condition !== "RUSAK" && requiresAction && item.photos.length === 0) {
        errors.push(
          `${item.label} wajib memiliki foto untuk kondisi ${item.condition}.`
        )
      }

      if (
        (item.condition === "BAIK" || item.condition === "TIDAK_ADA") &&
        hasFollowUpReference(item as unknown as Record<string, unknown>)
      ) {
        errors.push(
          `${item.label} dengan kondisi ${item.condition} tidak boleh memiliki referensi form tindak lanjut.`
        )
      }
    }

    if (requiresAction) {
      if (!item.handler) {
        errors.push(`${item.label} wajib memilih siapa yang akan handle.`)
      }
      if (!item.notes || !item.notes.trim()) {
        errors.push(`${item.label} wajib mengisi keterangan.`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function calculateChecklistIsSafe(payload: unknown): boolean {
  const validation = validateChecklistPayload(payload)
  if (!validation.valid || !isChecklistPayload(payload)) {
    return false
  }

  return payload.items.every(
    (item) =>
      isChecklistItem(item) &&
      item.condition !== "RUSAK" &&
      item.condition !== "URGENT"
  )
}
