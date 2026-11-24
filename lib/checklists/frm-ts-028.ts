import {
  Battery,
  BatteryCharging,
  Gauge,
  Layers,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import type {
  ChecklistCondition,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_028_FORM_CODE = "FRM_TS_028"
export const FRM_TS_068_FORM_CODE = "FRM_TS_068"
export const FRM_TS_028_NRA = "SAT/FRM/TS/028_Rev:002_161020"
export const FRM_TS_028_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

const FORM_065_CODE = "SAT/FRM/TS/065_REV:00_161020"
const FORM_065_LABEL = "Form Perbaikan / Penggantian Spare Part Equipment (065)"
const REPAIR_TANPA_BIAYA_CODE = "REPAIR_TANPA_BIAYA"
const REPAIR_TANPA_BIAYA_LABEL = "Repair Tanpa Biaya"

export type BatteryInspectionItem = {
  id: string
  number: number
  label: string
  category: string
}

export const BATTERY_INSPECTION_ITEMS: BatteryInspectionItem[] = [
  {
    id: "bat_cleaning_permukaan",
    number: 1,
    label: "Cleaning permukaan battery",
    category: "Pembersihan & Fisik",
  },
  {
    id: "bat_check_short_body",
    number: 2,
    label: "Check short body",
    category: "Pembersihan & Fisik",
  },
  {
    id: "bat_cleaning_conector_intercell",
    number: 3,
    label: "Cleaning conector intercell",
    category: "Koneksi & Terminal",
  },
  {
    id: "bat_check_cleaning_pole",
    number: 4,
    label: "Check & Cleaning pole +/-",
    category: "Koneksi & Terminal",
  },
  {
    id: "bat_check_skun_pin_socet",
    number: 5,
    label: "Check skun/pin socet",
    category: "Koneksi & Terminal",
  },
  {
    id: "bat_check_kabel",
    number: 6,
    label: "Check kabel",
    category: "Kabel & Soket",
  },
  {
    id: "bat_check_soket",
    number: 7,
    label: "Check soket +/-",
    category: "Kabel & Soket",
  },
  {
    id: "bat_check_end_conector",
    number: 8,
    label: "Check end conector +/-",
    category: "Kabel & Soket",
  },
  {
    id: "bat_pelumasan_intercell_pole",
    number: 9,
    label: "Pelumasan pd intercell & pole +/-",
    category: "Pelumasan & Perawatan",
  },
  {
    id: "bat_check_keasaman_air_accu",
    number: 10,
    label: "Check keasaman air accu (B.J)",
    category: "Elektrolit & Cell",
  },
  {
    id: "bat_check_tegangan_tiap_cell",
    number: 11,
    label: "Check tegangan tiap cell",
    category: "Elektrolit & Cell",
  },
  {
    id: "bat_check_tegangan_akumulasi",
    number: 12,
    label: "Check tegangan akumulasi semua cell",
    category: "Elektrolit & Cell",
  },
  {
    id: "bat_check_volume_air_accu",
    number: 13,
    label: "Check volume air accu",
    category: "Elektrolit & Cell",
  },
  {
    id: "bat_check_tray_housing",
    number: 14,
    label: "Check kondisi tray / housing battery",
    category: "Pembersihan & Fisik",
  },
]

export type CellMeasurement = {
  cellNo: number
  bj: string
  voltage: string
}

export const FRM_TS_028_ITEMS: ChecklistItemConfig[] = BATTERY_INSPECTION_ITEMS.map((item) => ({
  id: item.id,
  label: item.label,
  icon: Battery,
}))

export const FRM_TS_028_CONDITION_OPTIONS = [
  { value: "BAIK", code: "V", label: "V — OK" },
  { value: "RUSAK", code: "X", label: "X — Not Good" },
  { value: "REPAIR", code: "R", label: "R — Repair" },
  { value: "URGENT", code: "U", label: "U — Urgent" },
  { value: "TIDAK_ADA", code: "N", label: "N — None" },
] as const satisfies readonly {
  value: ChecklistCondition
  code: string
  label: string
}[]

export const FRM_TS_028_FINDING_CONDITIONS = [
  "RUSAK",
  "REPAIR",
  "URGENT",
] as const satisfies readonly ChecklistCondition[]

export const FRM_TS_028_ALL_CONDITIONS = [
  "BAIK",
  "RUSAK",
  "REPAIR",
  "URGENT",
  "TIDAK_ADA",
] as const satisfies readonly ChecklistCondition[]

export type FrmTs028ItemState = {
  condition: ChecklistCondition | ""
  notes: string
  photos: ChecklistPhoto[]
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  uploading?: boolean
}

export function isFrmTs028FindingCondition(condition?: ChecklistCondition | ""): boolean {
  return condition === "RUSAK" || condition === "REPAIR" || condition === "URGENT"
}

/** Initialize battery checklist items; FRM_TS_028 repair mode never pre-fills all items as RUSAK. */
export function createInitialBatteryItems(
  isFrmTs028: boolean,
  isRepairMode: boolean,
): Record<string, FrmTs028ItemState> {
  const initial: Record<string, FrmTs028ItemState> = {}
  for (const it of BATTERY_INSPECTION_ITEMS) {
    initial[it.id] = {
      condition: !isFrmTs028 && isRepairMode ? "RUSAK" : "",
      notes: "",
      photos: [],
    }
  }
  return initial
}

/** Transition FRM_TS_028 item condition while preserving uploaded photos and notes in local UI state. */
export function transitionFrmTs028ItemCondition(
  current: FrmTs028ItemState | undefined,
  nextCondition: ChecklistCondition | "",
): FrmTs028ItemState {
  const base: FrmTs028ItemState = {
    condition: nextCondition,
    notes: current?.notes ?? "",
    photos: current?.photos ?? [],
    uploading: current?.uploading,
  }

  if (!nextCondition || nextCondition === "BAIK" || nextCondition === "TIDAK_ADA") {
    return {
      ...base,
      handler: undefined,
      repairForm: undefined,
    }
  }

  if (nextCondition === "RUSAK") {
    return {
      ...base,
      handler: current?.handler || "BES",
      repairForm: current?.repairForm || FORM_065_CODE,
    }
  }

  return {
    ...base,
    handler: current?.handler || "BES",
    repairForm: current?.condition === nextCondition ? current.repairForm : undefined,
  }
}

/** Build sanitized FRM_TS_028 payload items without dummy fallback notes or stale OK/None follow-ups. */
export function buildFrmTs028PayloadItems(
  items: Record<string, FrmTs028ItemState>,
  isRepairMode: boolean,
): ChecklistPayloadItem[] {
  return BATTERY_INSPECTION_ITEMS.filter((it) =>
    isRepairMode ? Boolean(items[it.id]?.condition) : true,
  ).map((it) => {
    const st = items[it.id]
    const cond = (st?.condition || "BAIK") as ChecklistCondition
    if (!isFrmTs028FindingCondition(cond)) {
      return {
        id: it.id,
        label: it.label,
        condition: cond,
        notes: undefined,
        photos: [],
        handler: undefined,
        repairForm: undefined,
        repairFormName: undefined,
      }
    }

    const trimmedNotes = (st?.notes ?? "").trim()
    const repairForm =
      st?.repairForm === FORM_065_CODE
        ? FORM_065_CODE
        : st?.repairForm === REPAIR_TANPA_BIAYA_CODE
          ? REPAIR_TANPA_BIAYA_CODE
          : undefined
    return {
      id: it.id,
      label: it.label,
      condition: cond,
      notes: trimmedNotes || undefined,
      photos: st?.photos ?? [],
      handler: st?.handler || "BES",
      repairForm,
      repairFormName:
        repairForm === FORM_065_CODE
          ? FORM_065_LABEL
          : repairForm === REPAIR_TANPA_BIAYA_CODE
            ? REPAIR_TANPA_BIAYA_LABEL
            : undefined,
    }
  })
}

export const FRM_TS_028_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_028_FORM_CODE,
  formName: "Form Monthly Checklist Battery",
  items: FRM_TS_028_ITEMS,
  conditionOptions: ["BAIK", "RUSAK", "REPAIR", "URGENT", "TIDAK_ADA"],
  conditionLabels: {
    BAIK: "Baik (V)",
    RUSAK: "Rusak (X)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
    TIDAK_ADA: "None (N)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
  },
  conditionRequiresPhoto,
}

/** Separate config for FRM_TS_068 (Forklift Battery) preserving its 4 existing condition choices. */
export const FRM_TS_068_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_068_FORM_CODE,
  formName: "Form Monthly Checklist Battery",
  items: FRM_TS_028_ITEMS,
  conditionOptions: ["BAIK", "RUSAK", "REPAIR", "URGENT"],
  conditionLabels: {
    BAIK: "Baik (V)",
    RUSAK: "Rusak (X)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
    TIDAK_ADA: "None (N)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
  },
  conditionRequiresPhoto,
}
