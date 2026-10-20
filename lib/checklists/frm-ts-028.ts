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
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_028_FORM_CODE = "FRM_TS_028"
export const FRM_TS_028_NRA = "SAT/FRM/TS/028_Rev:002_161020"
export const FRM_TS_028_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

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
