export type FrmTsm001RunningLog = {
  operationalType: "Pemanasan" | "Pemadaman" | "Test ATS"
  timeStart: string
  timeOff: string
  hourMeterStart: string
  hourMeterOff: string
  chargerAlternatorVolt: string
  frequencyHz: string
  oilPressureKpa: string
  voltage3Phase: {
    rs: string
    st: string
    tr: string
  }
  voltageSinglePhase: {
    rn: string
    sn: string
    tn: string
  }
  loadAmpere: {
    r: string
    s: string
    t: string
  }
  fuelConsumptionLiter: string
}

export type FrmTsm001AtsTest = {
  testDate: string
  systemAtsStatus: "OK" | "NOK"
  voltageBatteryCharge: string
  voltageBatteryLoadStart: string
  transferDurationMinutes: string
  photos?: Array<{ fileId: string; url: string }>
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  repairFormName?: string
  notes?: string
}

export type FrmTsm001Payload = {
  formCode: "FRM_TSM_001" | "FRM_TSM_001_REPAIR"
  formName: string
  areaCode: string
  period: "MONTHLY" | "WEEKLY"
  periodKey: string
  branch: string
  merk: string
  kva: string
  bulan: string
  runningLog: FrmTsm001RunningLog
  atsTest: FrmTsm001AtsTest
  catatanKeterangan: string
}

export type FrmTsm001ValidationResult = {
  valid: boolean
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isFrmTsm001Payload(value: unknown): value is FrmTsm001Payload {
  if (!isRecord(value)) return false

  return (
    (value.formCode === "FRM_TSM_001" || value.formCode === "FRM_TSM_001_REPAIR") &&
    typeof value.formName === "string" &&
    typeof value.areaCode === "string" &&
    (value.period === "MONTHLY" || value.period === "WEEKLY") &&
    typeof value.periodKey === "string" &&
    isRecord(value.runningLog) &&
    isRecord(value.atsTest)
  )
}

export function validateFrmTsm001Payload(
  payload: unknown
): FrmTsm001ValidationResult {
  if (!isFrmTsm001Payload(payload)) {
    return { valid: false, errors: ["Payload form FRM_TSM_001 tidak valid."] }
  }

  const errors: string[] = []

  if (!payload.merk || !payload.merk.trim()) {
    errors.push("Merk Genset wajib diisi.")
  }

  if (!payload.kva || !payload.kva.trim()) {
    errors.push("Kapasitas KVA wajib diisi.")
  }

  // If ATS test is NOK, validate handler and photos
  if (payload.atsTest.systemAtsStatus === "NOK") {
    if (!payload.atsTest.handler) {
      errors.push("Penanggung jawab (Handler) wajib dipilih saat ATS berstatus NOK.")
    }
    if (!payload.atsTest.photos || payload.atsTest.photos.length === 0) {
      errors.push("Foto bukti temuan wajib dilampirkan saat ATS berstatus NOK.")
    }
  }

  return { valid: errors.length === 0, errors }
}
