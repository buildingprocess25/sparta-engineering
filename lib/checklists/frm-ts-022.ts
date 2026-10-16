import {
  Activity,
  Battery,
  CircleDot,
  Cpu,
  Droplet,
  Fuel,
  Gauge,
  Power,
  RotateCcw,
  ShieldCheck,
  Thermometer,
  Wind,
  Wrench,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_022_FORM_CODE = "FRM_TS_022"
export const FRM_TS_022_NRA = "SAT/FRM/TS/022_Rev : 01_161020"
export const FRM_TS_022_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type GensetChecklistItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type GensetChecklistCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: GensetChecklistItem[]
}

export const GENSET_FOLLOW_UP_CODES = [
  { code: "A", label: "A - Adjust or Add" },
  { code: "C", label: "C - Clean" },
  { code: "R", label: "R - Repair" },
  { code: "U", label: "U - Urgent" },
] as const

export const GENSET_CATEGORIES: GensetChecklistCategory[] = [
  {
    id: "oil_level",
    number: 1,
    title: "1. OIL LEVEL",
    icon: Droplet,
    items: [
      {
        id: "oil_check_level",
        label: "A. Check level oli",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "oil_level",
      },
      {
        id: "oil_check_viscosity",
        label: "B. Check kekentalan oli",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "oil_level",
      },
    ],
  },
  {
    id: "fuel_system",
    number: 2,
    title: "2. FUEL SYSTEM",
    icon: Fuel,
    items: [
      {
        id: "fuel_tank_level",
        label: "A. Check level tangki bahan bakar",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "fuel_system",
      },
      {
        id: "fuel_leaks",
        label: "B. Check leaks (selang/pipa)",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "fuel_system",
      },
    ],
  },
  {
    id: "air_cleaner_indicator",
    number: 3,
    title: "3. AIR CLEANER INDICATOR",
    icon: Wind,
    items: [
      {
        id: "air_cleaner_check",
        label: "A. Check air cleaner indicator",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "air_cleaner_indicator",
      },
    ],
  },
  {
    id: "belts",
    number: 4,
    title: "4. BELTS",
    icon: RotateCcw,
    items: [
      {
        id: "belts_fan_belt_check",
        label: "A. Check keretakan & tegangan tali kipas",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "belts",
      },
    ],
  },
  {
    id: "cooling_system",
    number: 5,
    title: "5. COOLING SYSTEM",
    icon: Thermometer,
    items: [
      {
        id: "cooling_coolant_level",
        label: "A. Check coolant level",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "cooling_system",
      },
    ],
  },
  {
    id: "batteries",
    number: 6,
    title: "6. BATTERIES",
    icon: Battery,
    items: [
      {
        id: "battery_water_level",
        label: "A. Check level air accu",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "batteries",
      },
      {
        id: "battery_water_ph",
        label: "B. Check PH air accu",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "batteries",
      },
      {
        id: "battery_clean_terminal",
        label: "C. Clean terminal battery",
        actionCode: "Cl",
        actionName: "Clean",
        categoryId: "batteries",
      },
      {
        id: "battery_check_voltage",
        label: "D. Check voltage",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "batteries",
      },
    ],
  },
  {
    id: "generator",
    number: 7,
    title: "7. GENERATOR",
    icon: Zap,
    items: [
      {
        id: "gen_check_clean",
        label: "A. Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "generator",
      },
    ],
  },
  {
    id: "control_panel",
    number: 8,
    title: "8. CONTROL PANEL",
    icon: Cpu,
    items: [
      {
        id: "panel_meter_reading",
        label: "A. Check meter reading (Amp, Voltage, etc) & wiring",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "control_panel",
      },
    ],
  },
  {
    id: "warming_up_genset",
    number: 9,
    title: "9. WARMING UP GENSET",
    icon: Power,
    items: [
      {
        id: "warmup_duration_10m",
        label: "A. Time duration 10 minute",
        actionCode: "Td",
        actionName: "Test Run",
        categoryId: "warming_up_genset",
      },
    ],
  },
  {
    id: "check_voltage_onload",
    number: 10,
    title: "10. CHECK VOLTAGE BATTERY / ONLOAD",
    icon: Gauge,
    items: [
      {
        id: "voltage_onload_24_12",
        label: "A. 24 Volt (Min 20 Volt) / 12 Volt (Min 10 Volt)",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "check_voltage_onload",
      },
    ],
  },
  {
    id: "test_ats_system",
    number: 11,
    title: "11. TEST ATS SYSTEM",
    icon: Activity,
    items: [
      {
        id: "ats_simulasi_pln",
        label: "A. Simulasi listrik PLN Padam",
        actionCode: "Td",
        actionName: "Test Run",
        categoryId: "test_ats_system",
      },
    ],
  },
  {
    id: "around_inspection",
    number: 12,
    title: "12. AROUND INSPECTION",
    icon: ShieldCheck,
    items: [
      {
        id: "around_engine_radiator",
        label: "A. Inspect engine, radiator, etc.",
        actionCode: "In",
        actionName: "Inspect",
        categoryId: "around_inspection",
      },
    ],
  },
]

export const GENSET_ALL_ITEMS: GensetChecklistItem[] =
  GENSET_CATEGORIES.flatMap((c) => c.items)

const CHECKLIST_ITEMS: ChecklistItemConfig[] = GENSET_ALL_ITEMS.map((item) => ({
  id: item.id,
  label: item.label,
  icon: Wrench,
}))

export const FRM_TS_022_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_022_FORM_CODE,
  formName: "Form Checklist Genset",
  items: CHECKLIST_ITEMS,
  conditionOptions: [
    "BAIK",
    "RUSAK",
    "REPAIR",
    "TIDAK_ADA",
    "ADJUST_OR_ADD",
    "CLEAN",
    "URGENT",
  ],
  conditionLabels: {
    BAIK: "Baik (V)",
    RUSAK: "Rusak (X)",
    REPAIR: "Repair (R)",
    TIDAK_ADA: "Tidak Ada (T)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
    URGENT: "Urgent (U)",
  },
  conditionRequiresPhoto,
}
