import type { ChecklistPeriodType } from "@/lib/es-dashboard-types"

export type ChecklistFormConfig = {
  id: string
  title: string
  description: string
}

export const FORM_CODE_TO_CONFIG: Record<string, ChecklistFormConfig> = {
  FRM_TS_043: {
    id: "frm-ts-043",
    title: "Checklist Forklift Weekly",
    description: "SAT/FRM/TS/043",
  },
  FRM_TS_029: {
    id: "frm-ts-029",
    title: "Checklist Forklift Monthly",
    description: "SAT/FRM TS/029",
  },
  FRM_TS_045: {
    id: "frm-ts-045",
    title: "Checklist Pallet Mover Weekly",
    description: "SAT/FRM/TS/045",
  },
  FRM_TS_016: {
    id: "frm-ts-016",
    title: "Checklist Pallet Mover Monthly",
    description: "SAT/FRM/TS/016",
  },
  FRM_TS_062: {
    id: "frm-ts-062",
    title: "Checklist Handpallet",
    description: "SAT/FRM/TS/062",
  },
  FRM_TS_068: {
    id: "frm-ts-068",
    title: "Checklist Baterai Forklift",
    description: "SAT/FRM/TS/068",
  },
  FRM_TS_028: {
    id: "frm-ts-028",
    title: "Checklist Baterai Pallet Mover",
    description: "SAT/FRM/TS/028-REV.002 161020",
  },
  FRM_TSM_008: {
    id: "frm-tsm-008",
    title: "Checklist Perawatan Unit Sewa",
    description: "SAT/FRM/TSM/008_Rev_000_111122",
  },
  FRM_TS_022: {
    id: "frm-ts-022",
    title: "Checklist Genset",
    description: "SAT/FRM/TS/022_Rev : 01_161020",
  },
  FRM_TSM_001: {
    id: "frm-tsm-001",
    title: "Checklist Test ATS",
    description: "SAT/FRM/TSM/001",
  },
  FRM_TSM_006: {
    id: "frm-tsm-006",
    title: "Checklist Hydrant",
    description: "SAT/FRM/TSM/006",
  },
  FRM_TS_063: {
    id: "frm-ts-063",
    title: "Checklist Exhaust Fan",
    description: "SAT/FRM/TS/063_REV : 00_161020",
  },
  FRM_TSM_007: {
    id: "frm-tsm-007",
    title: "Checklist PLTS",
    description: "SAT/FRM/TSM/007",
  },
  FRM_TSM_013: {
    id: "frm-tsm-013",
    title: "Checklist Water Recycle",
    description: "SAT/FRM/TSM/013_REV 000_100123",
  },
  FRM_TS_041: {
    id: "frm-ts-041",
    title: "Checklist Conveyor",
    description: "SAT/FRM/TS/041_REV: 01_161020",
  },
  FRM_TS_064: {
    id: "frm-ts-064",
    title: "Checklist Table Lifter",
    description: "SAT/FRM/TS/064_REV: 00_161020",
  },
  FRM_TSM_003: {
    id: "frm-tsm-003",
    title: "Checklist Ruangan",
    description: "SAT/FRM/TSM/003 REV 000 211022",
  },
  FRM_TSM_005: {
    id: "frm-tsm-005",
    title: "Checklist Bangunan Utama & Penunjang",
    description: "SAT/FRM/TSM/005 REV 211022",
  },
  FRM_TSM_002: {
    id: "frm-tsm-002",
    title: "Checklist Warehouse",
    description: "SAT/FRM/TSM/002_REV_000_211022",
  },
  FRM_TSM_004: {
    id: "frm-tsm-004",
    title: "Checklist Main Cable",
    description: "SAT/FRM/TSM/004_REV_000_211022",
  },
}

type RoomFormAvailability = { formCode: string; period: string }
type RoomWithForms = { formAvailabilities: RoomFormAvailability[] }
type ChecklistAreaType = "OFFICE" | "WAREHOUSE"

export const CHECKLIST_PERIODS: ChecklistPeriodType[] = ["MONTHLY", "WEEKLY", "QUARTERLY", "SEMESTER"]

export function getChecklistFormConfig(formCode: string): ChecklistFormConfig | undefined {
  // Master data and assignments contain both SAT/NRA numbers and internal codes.
  const match = formCode.trim().toUpperCase().match(/^(?:SAT[/ _-]+)?FRM[/ _-]+(TSM?)[/ _-]+(\d{3})(?=$|[ _-]+REV\b|[ _-]+REV_)/)
  return match ? FORM_CODE_TO_CONFIG[`FRM_${match[1]}_${match[2]}`] : undefined
}

export function getFormsForRoom(
  room: RoomWithForms,
  period: ChecklistPeriodType,
  areaType: ChecklistAreaType,
): ChecklistFormConfig[] {
  if (areaType === "OFFICE" && period !== "MONTHLY") return []

  const forms = new Map<string, ChecklistFormConfig>()
  for (const item of room.formAvailabilities) {
    if (item.period !== period) continue
    const config = getChecklistFormConfig(item.formCode)
    if (config) forms.set(config.id, config)
  }
  return [...forms.values()]
}

export function matchesChecklistForm(form: ChecklistFormConfig, search: string): boolean {
  const query = search.trim().toLowerCase()
  const normalizedCode = query.replace(/[^a-z0-9]/g, "")
  return form.title.toLowerCase().includes(query) ||
    form.description.toLowerCase().includes(query) ||
    (!!normalizedCode && form.id.replaceAll("-", "").includes(normalizedCode))
}

export const CHECKLIST_FORMS: Record<
  string, // area type (OFFICE | WAREHOUSE)
  Record<string, ChecklistFormConfig[]> // period (MONTHLY | WEEKLY | QUARTERLY | SEMESTER)
> = {
  OFFICE: {
    MONTHLY: [
      FORM_CODE_TO_CONFIG.FRM_TSM_003,
      FORM_CODE_TO_CONFIG.FRM_TSM_005,
      FORM_CODE_TO_CONFIG.FRM_TSM_002,
      FORM_CODE_TO_CONFIG.FRM_TSM_004,
    ],
    WEEKLY: [
      FORM_CODE_TO_CONFIG.FRM_TSM_003,
      FORM_CODE_TO_CONFIG.FRM_TSM_005,
      FORM_CODE_TO_CONFIG.FRM_TSM_002,
      FORM_CODE_TO_CONFIG.FRM_TSM_004,
    ],
    QUARTERLY: [FORM_CODE_TO_CONFIG.FRM_TSM_007],
    SEMESTER: [FORM_CODE_TO_CONFIG.FRM_TSM_006],
  },
  WAREHOUSE: {
    MONTHLY: [
      FORM_CODE_TO_CONFIG.FRM_TSM_003,
      FORM_CODE_TO_CONFIG.FRM_TSM_005,
      FORM_CODE_TO_CONFIG.FRM_TSM_002,
      FORM_CODE_TO_CONFIG.FRM_TSM_004,
      FORM_CODE_TO_CONFIG.FRM_TS_029,
      FORM_CODE_TO_CONFIG.FRM_TS_016,
      FORM_CODE_TO_CONFIG.FRM_TSM_001,
      FORM_CODE_TO_CONFIG.FRM_TSM_006,
      FORM_CODE_TO_CONFIG.FRM_TS_062,
      FORM_CODE_TO_CONFIG.FRM_TS_068,
      FORM_CODE_TO_CONFIG.FRM_TS_028,
      FORM_CODE_TO_CONFIG.FRM_TS_063,
      FORM_CODE_TO_CONFIG.FRM_TSM_007,
      FORM_CODE_TO_CONFIG.FRM_TSM_013,
      FORM_CODE_TO_CONFIG.FRM_TS_041,
      FORM_CODE_TO_CONFIG.FRM_TS_064,
      FORM_CODE_TO_CONFIG.FRM_TSM_008,
    ],
    WEEKLY: [
      FORM_CODE_TO_CONFIG.FRM_TS_043,
      FORM_CODE_TO_CONFIG.FRM_TS_045,
      FORM_CODE_TO_CONFIG.FRM_TSM_003,
      FORM_CODE_TO_CONFIG.FRM_TSM_005,
      FORM_CODE_TO_CONFIG.FRM_TSM_002,
      FORM_CODE_TO_CONFIG.FRM_TSM_004,
      FORM_CODE_TO_CONFIG.FRM_TSM_006,
    ],
    QUARTERLY: [FORM_CODE_TO_CONFIG.FRM_TSM_007],
    SEMESTER: [FORM_CODE_TO_CONFIG.FRM_TSM_006],
  },
}

export function getChecklistForms(
  areaType: string,
  period: string,
): ChecklistFormConfig[] {
  const areaForms = CHECKLIST_FORMS[areaType]
  if (!areaForms) return []
  return areaForms[period] || []
}
