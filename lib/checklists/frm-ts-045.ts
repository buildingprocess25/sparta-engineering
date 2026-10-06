import {
  Activity,
  Disc,
  Fan,
  Gauge,
  Sliders,
  SlidersHorizontal,
  Wrench,
} from "lucide-react"

export const FRM_TS_045_FORM_CODE = "FRM_TS_045"
export const FRM_TS_045_NRA = "SAT/FRM/TS/045_Rev : 01_161020"
export const FRM_TS_045_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type PalletMoverWeeklyItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type PalletMoverWeeklyCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: PalletMoverWeeklyItem[]
}

export const PALLET_MOVER_WEEKLY_CATEGORIES: PalletMoverWeeklyCategory[] = [
  {
    id: "handle_operation",
    number: 1,
    title: "1. CLEANING HANDLE OPERATION",
    icon: Sliders,
    items: [
      {
        id: "pm_handle_operation",
        label: "Cleaning Handle Operation",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "handle_operation",
      },
    ],
  },
  {
    id: "access_modul_room",
    number: 2,
    title: "2. CLEANING ACCESS MODUL ROOM",
    icon: SlidersHorizontal,
    items: [
      {
        id: "pm_access_modul_room",
        label: "Cleaning Access Modul Room",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "access_modul_room",
      },
    ],
  },
  {
    id: "cooling_fan_access",
    number: 3,
    title: "3. CLEANING COOLING FAN ACCESS",
    icon: Fan,
    items: [
      {
        id: "pm_cooling_fan_access",
        label: "Cleaning Cooling Fan Access",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "cooling_fan_access",
      },
    ],
  },
  {
    id: "distribution_panel",
    number: 4,
    title: "4. DISTRIBUTION PANEL",
    icon: Gauge,
    items: [
      {
        id: "pm_distribution_panel",
        label: "Distribution Panel",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "distribution_panel",
      },
    ],
  },
  {
    id: "motor_traction",
    number: 5,
    title: "5. CLEAN & CHECK MOTOR TRACTION",
    icon: Activity,
    items: [
      {
        id: "pm_traction_mounting",
        label: "Mounting secure",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
      {
        id: "pm_traction_cable",
        label: "Cable connection",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
      {
        id: "pm_traction_brushes_armatures",
        label: "Brushes & Armatures Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
      {
        id: "pm_traction_brake_pad",
        label: "Brake pad condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
    ],
  },
  {
    id: "motor_pump",
    number: 6,
    title: "6. CLEAN & CHECK MOTOR PUMP",
    icon: Wrench,
    items: [
      {
        id: "pm_pump_mounting",
        label: "Mounting secure",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump",
      },
      {
        id: "pm_pump_cable",
        label: "Cable connection",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump",
      },
      {
        id: "pm_pump_brushes_armatures",
        label: "Brushes & Armatures Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump",
      },
    ],
  },
  {
    id: "wheel",
    number: 7,
    title: "7. WHEEL (RODA)",
    icon: Disc,
    items: [
      {
        id: "pm_wheel_cleaning",
        label: "Cleaning",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "wheel",
      },
    ],
  },
]

export const ALL_PALLET_MOVER_WEEKLY_ITEMS: PalletMoverWeeklyItem[] =
  PALLET_MOVER_WEEKLY_CATEGORIES.flatMap((c) => c.items)
