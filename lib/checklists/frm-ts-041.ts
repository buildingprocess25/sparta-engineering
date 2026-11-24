import {
  Activity,
  ArrowUpDown,
  Boxes,
  Cpu,
  Gauge,
  GitMerge,
  LayoutGrid,
  Repeat,
  RotateCw,
  Scan,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import type {
  ChecklistCondition,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_041_FORM_CODE = "FRM_TS_041"
export const FRM_TS_041_NRA = "SAT/FRM/TS/041_Rev:01_161020"
export const FRM_TS_041_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

const FORM_065_CODE = "SAT/FRM/TS/065_REV:00_161020"
const FORM_065_LABEL = "Form Perbaikan / Penggantian Spare Part Equipment (065)"
const REPAIR_TANPA_BIAYA_CODE = "REPAIR_TANPA_BIAYA"
const REPAIR_TANPA_BIAYA_LABEL = "Repair Tanpa Biaya"

export type ConveyorItem = {
  id: string
  label: string
  actionCode?: string
  actionName?: string
  categoryId: string
}

export type ConveyorCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: ConveyorItem[]
}

export const CONVEYOR_CATEGORIES: ConveyorCategory[] = [
  {
    id: "motor_ac_tangential",
    number: 1,
    title: "1. MOTOR AC ( TANGENTIAL CHAIN)",
    icon: RotateCw,
    items: [
      {
        id: "cvy_ac_tangential_bolted_secure",
        label: "A. Bolted connection - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "motor_ac_tangential",
      },
      {
        id: "cvy_ac_tangential_gear_condition",
        label: "B. Gear & chain - Condition",
        actionCode: "Ch",
        actionName: "Condition Check",
        categoryId: "motor_ac_tangential",
      },
      {
        id: "cvy_ac_tangential_gear_clean",
        label: "B. Gear & chain - Clean & lubricate",
        actionCode: "Cl",
        actionName: "Clean & Lubricate",
        categoryId: "motor_ac_tangential",
      },
      {
        id: "cvy_ac_tangential_roller_active_free",
        label: "C. Roller active & free roller",
        actionCode: "Ch",
        actionName: "Operation Check",
        categoryId: "motor_ac_tangential",
      },
      {
        id: "cvy_ac_tangential_main_switch",
        label: "D. Main switch - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "motor_ac_tangential",
      },
    ],
  },
  {
    id: "motor_ac_teethbelt",
    number: 2,
    title: "2. MOTOR AC ( TEETHBELT)",
    icon: Repeat,
    items: [
      {
        id: "cvy_ac_teethbelt_bolted_secure",
        label: "A. Bolted connection - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "motor_ac_teethbelt",
      },
      {
        id: "cvy_ac_teethbelt_pulley_condition",
        label: "B. Pulley & teethbelt condition",
        actionCode: "Ch",
        actionName: "Condition Check",
        categoryId: "motor_ac_teethbelt",
      },
      {
        id: "cvy_ac_teethbelt_roller_cleaning",
        label: "C. Rolleractive - Check & Cleaning",
        actionCode: "Ch&Cl",
        actionName: "Check & Cleaning",
        categoryId: "motor_ac_teethbelt",
      },
      {
        id: "cvy_ac_teethbelt_main_switch",
        label: "D. Main switch - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "motor_ac_teethbelt",
      },
    ],
  },
  {
    id: "motor_dc",
    number: 3,
    title: "3. MOTOR DC",
    icon: Cpu,
    items: [
      {
        id: "cvy_dc_operation_clean",
        label: "A. Operation & function - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_bolted_secure",
        label: "B. Bolted connection - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_driver_card_secure",
        label: "C. Driver card - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_driver_card_operation",
        label: "C. Driver card - Operation & function",
        actionCode: "Tr",
        actionName: "Operation & Function",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_driver_card_clean",
        label: "C. Driver card - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_junc_box_power_supply",
        label: "D. Jungtion box panel - Power suply condition",
        actionCode: "Ch",
        actionName: "Power Supply Check",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_junc_box_cleaning",
        label: "D. Jungtion box panel - Check & Cleaning",
        actionCode: "Ch&Cl",
        actionName: "Check & Cleaning",
        categoryId: "motor_dc",
      },
      {
        id: "cvy_dc_junc_box_cooling_fan",
        label: "D. Jungtion box panel - Cooling fan check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "motor_dc",
      },
    ],
  },
  {
    id: "empty_case_conveyor",
    number: 4,
    title: "4. EMPTY CASE CONVEYOR",
    icon: Boxes,
    items: [
      {
        id: "cvy_ecc_driveunit_secure",
        label: "A. Driveunit (Motor AC) - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "empty_case_conveyor",
      },
      {
        id: "cvy_ecc_plain_chain_clean",
        label: "B. Plain chain - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "empty_case_conveyor",
      },
      {
        id: "cvy_ecc_guiderail_secure",
        label: "C. Guiderail - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "empty_case_conveyor",
      },
      {
        id: "cvy_ecc_mainswitch_operation",
        label: "D. Mainswitch - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "empty_case_conveyor",
      },
      {
        id: "cvy_ecc_push_button",
        label: "E. Push Button Switch Condition",
        actionCode: "Ch",
        actionName: "Condition Check",
        categoryId: "empty_case_conveyor",
      },
      {
        id: "cvy_ecc_emergency_switch",
        label: "F. Emergency Switch Condition",
        actionCode: "Ch",
        actionName: "Emergency Check",
        categoryId: "empty_case_conveyor",
      },
    ],
  },
  {
    id: "belt_incline_spiral",
    number: 5,
    title: "5. BELT INCLINE/BELTSPIRAL",
    icon: TrendingUp,
    items: [
      {
        id: "cvy_belt_incline_motor_operation",
        label: "A. Motor AC - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "belt_incline_spiral",
      },
      {
        id: "cvy_belt_incline_motor_clean",
        label: "A. Motor AC - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "belt_incline_spiral",
      },
      {
        id: "cvy_belt_incline_belt_operation",
        label: "B. Belt - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "belt_incline_spiral",
      },
      {
        id: "cvy_belt_incline_belt_clean",
        label: "B. Belt - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "belt_incline_spiral",
      },
    ],
  },
  {
    id: "decline_spiral",
    number: 6,
    title: "6. DECLINESPIRAL",
    icon: TrendingDown,
    items: [
      {
        id: "cvy_decline_guiderail_secure",
        label: "A. Guiderail - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "decline_spiral",
      },
      {
        id: "cvy_decline_sliderail_secure",
        label: "B. Sliderail - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "decline_spiral",
      },
      {
        id: "cvy_decline_roller_gravity_secure",
        label: "C. Roller gravity - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "decline_spiral",
      },
    ],
  },
  {
    id: "main_panel",
    number: 7,
    title: "7. MAIN PANEL",
    icon: LayoutGrid,
    items: [
      {
        id: "cvy_panel_contactor_relay",
        label: "A. Contactor, Circuit Breaker, Relay - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_inverter",
        label: "B. Inverter - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_power_supply",
        label: "C. Power Suply condition",
        actionCode: "Ch",
        actionName: "Condition Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_plc",
        label: "D. PLC condition",
        actionCode: "Ch",
        actionName: "PLC Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_powercable",
        label: "E. Condition, connection, connectorcabel - Powercable",
        actionCode: "Ch",
        actionName: "Connection Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_all_wiring_cable",
        label: "E. Condition, connection, connectorcabel - All wiring cable",
        actionCode: "Ch",
        actionName: "Wiring Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_all_wiring_connectors",
        label: "E. Condition, connection, connectorcabel - All wiring connectors",
        actionCode: "Ch",
        actionName: "Connector Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_cooling_fan",
        label: "F. Cooling fan",
        actionCode: "Ch",
        actionName: "Fan Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_push_button",
        label: "G. Push Button Switch Condition",
        actionCode: "Ch",
        actionName: "Switch Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_emergency_switch",
        label: "H. Emergency Switch Condition",
        actionCode: "Ch",
        actionName: "Emergency Check",
        categoryId: "main_panel",
      },
      {
        id: "cvy_panel_interactive_display",
        label: "I. Interactive Display - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "main_panel",
      },
    ],
  },
  {
    id: "sorting_system",
    number: 8,
    title: "8. SORTINGSYSTEM",
    icon: GitMerge,
    items: [
      {
        id: "cvy_sort_stopper_bolted",
        label: "A. Stopper - Bolted connection",
        actionCode: "Ch",
        actionName: "Bolted Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_stopper_mounting",
        label: "A. Stopper - Mounting secure",
        actionCode: "Ch",
        actionName: "Mounting Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_chaintransfer_operation",
        label: "B. Chaintransfer/ popup - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_chaintransfer_mounting",
        label: "B. Chaintransfer/ popup - Mounting secure",
        actionCode: "Ch",
        actionName: "Mounting Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_motor_chain_operation",
        label: "C. Motor chain transfer/motor pop up - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_motor_chain_mounting",
        label: "C. Motor chain transfer/motor pop up - Mounting secure",
        actionCode: "Ch",
        actionName: "Mounting Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_solenoid_operation",
        label: "D. Solenoid valve - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_solenoid_clean",
        label: "D. Solenoid valve - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_solenoid_mounting",
        label: "D. Solenoid valve - Mounting secure",
        actionCode: "Ch",
        actionName: "Mounting Check",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_fotocell_operation",
        label: "E. Foto Cell - Operation & function",
        actionCode: "Tr",
        actionName: "Operation & Function",
        categoryId: "sorting_system",
      },
      {
        id: "cvy_sort_magnetic_switch",
        label: "F. Magnetic Switch - Operation & function",
        actionCode: "Tr",
        actionName: "Operation & Function",
        categoryId: "sorting_system",
      },
    ],
  },
  {
    id: "distance_system",
    number: 9,
    title: "9. DISTANCESYSTEM",
    icon: Scan,
    items: [
      {
        id: "cvy_dist_sensor_operation",
        label: "A. Sensor & reflector - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "distance_system",
      },
      {
        id: "cvy_dist_sensor_mounting",
        label: "A. Sensor & reflector - Mounting secure",
        actionCode: "Ch",
        actionName: "Mounting Check",
        categoryId: "distance_system",
      },
      {
        id: "cvy_dist_barcode_operation",
        label: "B. Barcode scanner - Operation & condition",
        actionCode: "Tr",
        actionName: "Operation & Condition",
        categoryId: "distance_system",
      },
      {
        id: "cvy_dist_barcode_mounting",
        label: "B. Barcode scanner - Mounting secure",
        actionCode: "Ch",
        actionName: "Mounting Check",
        categoryId: "distance_system",
      },
    ],
  },
  {
    id: "liftup_gate",
    number: 10,
    title: "10. LIFTUPGATE",
    icon: ArrowUpDown,
    items: [
      {
        id: "cvy_lift_bolted_secure",
        label: "A. Bolted connection - Check & mounting Secure",
        actionCode: "Ch",
        actionName: "Check & Secure",
        categoryId: "liftup_gate",
      },
      {
        id: "cvy_lift_polycord",
        label: "B. Polycord Condition",
        actionCode: "Ch",
        actionName: "Condition Check",
        categoryId: "liftup_gate",
      },
      {
        id: "cvy_lift_fotocell_operation",
        label: "C. Foto Cell - Operation & function",
        actionCode: "Tr",
        actionName: "Operation & Function",
        categoryId: "liftup_gate",
      },
      {
        id: "cvy_lift_roller_clean",
        label: "D. Roller active - Check & clean",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "liftup_gate",
      },
    ],
  },
  {
    id: "air_compressor",
    number: 11,
    title: "11. AIRCOMPRESOR",
    icon: Wind,
    items: [
      {
        id: "cvy_compressor_oil_leak",
        label: "A. Check Oil Leak",
        actionCode: "Ch",
        actionName: "Leak Check",
        categoryId: "air_compressor",
      },
      {
        id: "cvy_compressor_air_leak",
        label: "B. Check Air Leak",
        actionCode: "Ch",
        actionName: "Air Leak Check",
        categoryId: "air_compressor",
      },
      {
        id: "cvy_compressor_motor_condition",
        label: "C. Check Motor Condition",
        actionCode: "Ch",
        actionName: "Motor Check",
        categoryId: "air_compressor",
      },
      {
        id: "cvy_compressor_vbelt_condition",
        label: "D. Check Vbelt Condition",
        actionCode: "Ch",
        actionName: "V-Belt Check",
        categoryId: "air_compressor",
      },
      {
        id: "cvy_compressor_water_purging",
        label: "E. Water parging",
        actionCode: "Cl",
        actionName: "Water Purging",
        categoryId: "air_compressor",
      },
      {
        id: "cvy_compressor_air_pressure",
        label: "F. Check Air Pressure",
        actionCode: "Ch",
        actionName: "Pressure Check",
        categoryId: "air_compressor",
      },
    ],
  },
]

export const ALL_CONVEYOR_ITEMS: ConveyorItem[] =
  CONVEYOR_CATEGORIES.flatMap((c) => c.items)

export const FRM_TS_041_ITEMS_CONFIG: ChecklistItemConfig[] =
  ALL_CONVEYOR_ITEMS.map((item) => {
    const cat = CONVEYOR_CATEGORIES.find((c) => c.id === item.categoryId)
    return {
      id: item.id,
      label: item.label,
      icon: cat?.icon || Activity,
    }
  })

export const FRM_TS_041_CONDITION_OPTIONS = [
  { value: "BAIK", code: "V", label: "V — OK", shortLabel: "OK (V)" },
  { value: "RUSAK", code: "X", label: "X — Not Good", shortLabel: "Not Good (X)" },
  { value: "ADJUST_OR_ADD", code: "A", label: "A — Adjust", shortLabel: "Adjust (A)" },
  { value: "REPAIR", code: "R", label: "R — Repair", shortLabel: "Repair (R)" },
  { value: "URGENT", code: "U", label: "U — Urgent", shortLabel: "Urgent (U)" },
  { value: "TIDAK_ADA", code: "N", label: "N — None", shortLabel: "None (N)" },
] as const satisfies readonly {
  value: ChecklistCondition
  code: string
  label: string
  shortLabel: string
}[]

export const FRM_TS_041_FINDING_CONDITIONS = [
  "RUSAK",
  "ADJUST_OR_ADD",
  "REPAIR",
  "URGENT",
] as const satisfies readonly ChecklistCondition[]

export const FRM_TS_041_ALL_CONDITIONS = [
  "BAIK",
  "RUSAK",
  "ADJUST_OR_ADD",
  "REPAIR",
  "URGENT",
  "TIDAK_ADA",
] as const satisfies readonly ChecklistCondition[]

export type FrmTs041ItemState = {
  condition?: ChecklistCondition
  photos: ChecklistPhoto[]
  notes: string
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  uploading: boolean
}

export function isFrmTs041FindingCondition(condition?: ChecklistCondition | ""): boolean {
  return (
    condition === "RUSAK" ||
    condition === "ADJUST_OR_ADD" ||
    condition === "REPAIR" ||
    condition === "URGENT"
  )
}

/** Mark only unchecked items in the given category as BAIK without overwriting evaluated items. */
export function markUncheckedConveyorCategoryGood(
  items: Record<string, FrmTs041ItemState>,
  categoryId: string,
): Record<string, FrmTs041ItemState> {
  const category = CONVEYOR_CATEGORIES.find((c) => c.id === categoryId)
  if (!category) return items

  const next = { ...items }
  for (const item of category.items) {
    const existing = next[item.id]
    if (existing?.condition) {
      continue
    }
    next[item.id] = {
      photos: existing?.photos ?? [],
      notes: existing?.notes ?? "",
      uploading: existing?.uploading ?? false,
      condition: "BAIK",
      handler: undefined,
      repairForm: undefined,
    }
  }
  return next
}

/** Transition item condition while preserving uploaded photos and notes in local UI state. */
export function transitionFrmTs041ItemCondition(
  current: FrmTs041ItemState | undefined,
  nextCondition: ChecklistCondition | undefined,
): FrmTs041ItemState {
  const base: FrmTs041ItemState = {
    photos: current?.photos ?? [],
    notes: current?.notes ?? "",
    uploading: current?.uploading ?? false,
  }

  if (!nextCondition || nextCondition === "BAIK" || nextCondition === "TIDAK_ADA") {
    return {
      ...base,
      condition: nextCondition,
      handler: undefined,
      repairForm: undefined,
    }
  }

  if (nextCondition === "RUSAK") {
    return {
      ...base,
      condition: "RUSAK",
      handler: current?.handler || "BES",
      repairForm: current?.repairForm || FORM_065_CODE,
    }
  }

  return {
    ...base,
    condition: nextCondition,
    handler: current?.handler || "BES",
    repairForm: current?.condition === nextCondition ? current.repairForm : undefined,
  }
}

/** Build sanitized FRM_TS_041 payload items without dummy fallback notes or stale OK/None follow-ups. */
export function buildFrmTs041PayloadItems(
  items: Record<string, FrmTs041ItemState>,
  isRepairMode: boolean,
): ChecklistPayloadItem[] {
  return ALL_CONVEYOR_ITEMS.filter((it) =>
    isRepairMode ? Boolean(items[it.id]?.condition) : true,
  ).map((it) => {
    const state = items[it.id] ?? {
      photos: [],
      notes: "",
      uploading: false,
    }
    const cond = (state.condition || "BAIK") as ChecklistCondition
    if (!isFrmTs041FindingCondition(cond)) {
      return {
        id: it.id,
        label: it.label,
        condition: cond,
        photos: [],
        notes: undefined,
        handler: undefined,
        repairForm: undefined,
        repairFormName: undefined,
      }
    }

    const trimmedNotes = state.notes.trim()
    const repairForm =
      state.repairForm === FORM_065_CODE
        ? FORM_065_CODE
        : state.repairForm === REPAIR_TANPA_BIAYA_CODE
          ? REPAIR_TANPA_BIAYA_CODE
          : undefined
    return {
      id: it.id,
      label: it.label,
      condition: cond,
      photos: state.photos ?? [],
      notes: trimmedNotes || undefined,
      handler: state.handler || "BES",
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

export const FRM_TS_041_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_041_FORM_CODE,
  formName: "Checklist Conveyor",
  items: FRM_TS_041_ITEMS_CONFIG,
  conditionOptions: [
    "BAIK",
    "RUSAK",
    "ADJUST_OR_ADD",
    "REPAIR",
    "URGENT",
    "TIDAK_ADA",
  ],
  conditionLabels: {
    BAIK: "OK (V)",
    RUSAK: "Not Good (X)",
    ADJUST_OR_ADD: "Adjust (A)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
    TIDAK_ADA: "None (N)",
    CLEAN: "Clean (C)",
  },
  conditionRequiresPhoto,
}
