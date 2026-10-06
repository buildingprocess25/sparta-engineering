import {
  Activity,
  Fan,
  Gauge,
  Sliders,
  Wrench,
  Disc,
  Zap,
} from "lucide-react"

export const FRM_TS_043_FORM_CODE = "FRM_TS_043"
export const FRM_TS_043_NRA = "SAT/FRM/TS/043_Rev : 01_161020"
export const FRM_TS_043_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type ForkliftWeeklyItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type ForkliftWeeklyCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: ForkliftWeeklyItem[]
}

export const FORKLIFT_WEEKLY_CATEGORIES: ForkliftWeeklyCategory[] = [
  {
    id: "multi_task_handle",
    number: 1,
    title: "1. CLEANING MULTI TASK HANDLE",
    icon: Sliders,
    items: [
      {
        id: "fl_multi_task_handle",
        label: "Cleaning Multi Task Handle",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "multi_task_handle",
      },
    ],
  },
  {
    id: "dashboard",
    number: 2,
    title: "2. CLEANING DASHBOARD",
    icon: Gauge,
    items: [
      {
        id: "fl_dash_acces_1",
        label: "Acces 1",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "dashboard",
      },
      {
        id: "fl_dash_acces_2",
        label: "Acces 2",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "dashboard",
      },
      {
        id: "fl_dash_acces_3",
        label: "Acces 3",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "dashboard",
      },
      {
        id: "fl_dash_acces_4",
        label: "Acces 4",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "dashboard",
      },
      {
        id: "fl_dash_distribution_panel",
        label: "Distribution Panel",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "dashboard",
      },
    ],
  },
  {
    id: "cooling_fan",
    number: 3,
    title: "3. CLEANING COOLING FAN",
    icon: Fan,
    items: [
      {
        id: "fl_cooling_fan_acces",
        label: "Cooling Fan Acces",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "cooling_fan",
      },
      {
        id: "fl_cooling_fan_motor",
        label: "Cooling Fan Motor",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "cooling_fan",
      },
    ],
  },
  {
    id: "motor_traction",
    number: 4,
    title: "4. CLEAN & CHECK MOTOR TRACTION",
    icon: Activity,
    items: [
      {
        id: "fl_traction_mounting_secure",
        label: "Mounting Secure",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
      {
        id: "fl_traction_cable_connection",
        label: "Cable Connection",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
      {
        id: "fl_traction_brake_pad",
        label: "Brake Pad Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
      {
        id: "fl_traction_armatures",
        label: "Armatures Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_traction",
      },
    ],
  },
  {
    id: "motor_pump_1",
    number: 5,
    title: "5. CLEAN & CHECK MOTOR PUMP 1",
    icon: Zap,
    items: [
      {
        id: "fl_pump1_mounting_secure",
        label: "Mounting Secure",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_1",
      },
      {
        id: "fl_pump1_cable_connection",
        label: "Cable Connection",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_1",
      },
      {
        id: "fl_pump1_brushes",
        label: "Brushes Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_1",
      },
      {
        id: "fl_pump1_armatures",
        label: "Armatures Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_1",
      },
    ],
  },
  {
    id: "motor_pump_2",
    number: 6,
    title: "6. CLEAN & CHECK MOTOR PUMP 2",
    icon: Wrench,
    items: [
      {
        id: "fl_pump2_mounting_secure",
        label: "Mounting Secure",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_2",
      },
      {
        id: "fl_pump2_cable_connection",
        label: "Cable Connection",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_2",
      },
      {
        id: "fl_pump2_brushes",
        label: "Brushes Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_2",
      },
      {
        id: "fl_pump2_armatures",
        label: "Armatures Condition",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "motor_pump_2",
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
        id: "fl_wheel_cleaning",
        label: "Cleaning",
        actionCode: "CL/C",
        actionName: "Clean & Check",
        categoryId: "wheel",
      },
    ],
  },
]

export const ALL_FORKLIFT_WEEKLY_ITEMS: ForkliftWeeklyItem[] =
  FORKLIFT_WEEKLY_CATEGORIES.flatMap((c) => c.items)
