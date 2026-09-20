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
}

export type ChecklistPayload = {
  formCode: string
  formName: string
  areaCode: string
  period: "MONTHLY" | "WEEKLY"
  periodKey: string
  items: ChecklistPayloadItem[]
}

export type ChecklistPayloadValidationResult = {
  valid: boolean
  errors: string[]
}

const CONDITION_SET = new Set<string>(CHECKLIST_CONDITIONS)
const PHOTO_REQUIRED_CONDITIONS = new Set<ChecklistCondition>(["RUSAK"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isChecklistPayload(value: unknown): value is ChecklistPayload {
  if (!isRecord(value) || !Array.isArray(value.items)) return false

  return (
    typeof value.formCode === "string" &&
    typeof value.formName === "string" &&
    typeof value.areaCode === "string" &&
    (value.period === "MONTHLY" || value.period === "WEEKLY") &&
    typeof value.periodKey === "string"
  )
}

function isChecklistItem(value: unknown): value is ChecklistPayloadItem {
  if (!isRecord(value)) return false

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.condition === "string" &&
    CONDITION_SET.has(value.condition) &&
    Array.isArray(value.photos)
  )
}

export function validateChecklistPayload(
  payload: unknown
): ChecklistPayloadValidationResult {
  if (!isChecklistPayload(payload)) {
    return { valid: false, errors: ["Payload checklist tidak valid."] }
  }

  const errors: string[] = []

  for (const item of payload.items) {
    if (!isChecklistItem(item)) {
      errors.push("Item checklist tidak valid.")
      continue
    }

    if (
      PHOTO_REQUIRED_CONDITIONS.has(item.condition) &&
      item.photos.length === 0
    ) {
      errors.push(
        `${item.label} wajib memiliki foto untuk kondisi ${item.condition}.`
      )
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
    (item) => isChecklistItem(item) && item.condition !== "RUSAK"
  )
}
