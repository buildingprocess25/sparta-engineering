export type FrmTsm004Measurements = {
  rn: string
  sn: string
  tn: string
  rs: string
  st: string
  tr: string
}

export type FrmTsm004Panel = {
  id: string
  label: string
  measurements: FrmTsm004Measurements
}

export type FrmTsm004Payload = {
  formCode: "FRM_TSM_004" | "FRM_TSM_004_REPAIR"
  formName: string
  areaCode: string
  period: "MONTHLY" | "WEEKLY"
  periodKey: string
  panels: FrmTsm004Panel[]
  keterangan: string
}

export type FrmTsm004ValidationResult = {
  valid: boolean
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isMeasurements(value: unknown): value is FrmTsm004Measurements {
  if (!isRecord(value)) return false
  return (
    typeof value.rn === "string" &&
    typeof value.sn === "string" &&
    typeof value.tn === "string" &&
    typeof value.rs === "string" &&
    typeof value.st === "string" &&
    typeof value.tr === "string"
  )
}

function isPanel(value: unknown): value is FrmTsm004Panel {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isMeasurements(value.measurements)
  )
}

export function isFrmTsm004Payload(value: unknown): value is FrmTsm004Payload {
  if (!isRecord(value) || !Array.isArray(value.panels)) return false

  return (
    (value.formCode === "FRM_TSM_004" || value.formCode === "FRM_TSM_004_REPAIR") &&
    typeof value.formName === "string" &&
    typeof value.areaCode === "string" &&
    (value.period === "MONTHLY" || value.period === "WEEKLY") &&
    typeof value.periodKey === "string" &&
    typeof value.keterangan === "string"
  )
}

export function validateFrmTsm004Payload(
  payload: unknown
): FrmTsm004ValidationResult {
  if (!isFrmTsm004Payload(payload)) {
    return { valid: false, errors: ["Payload checklist 004 tidak valid."] }
  }

  const errors: string[] = []

  let hasAnyFilled = false

  for (const panel of payload.panels) {
    if (!isPanel(panel)) {
      errors.push("Data panel tidak valid.")
      break
    }
    
    if (Object.values(panel.measurements).some((val) => val.trim() !== "")) {
      hasAnyFilled = true
    }
  }

  if (errors.length === 0 && !hasAnyFilled) {
    errors.push("Minimal satu data pengukuran harus diisi.")
  }

  return { valid: errors.length === 0, errors }
}
