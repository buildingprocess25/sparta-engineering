import {
  Activity,
  ArrowUpDown,
  CircleDot,
  Cog,
  Compass,
  Footprints,
  Gauge,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_016_FORM_CODE = "FRM_TS_016"
export const FRM_TS_016_NRA = "SAT/FRM/TS/016_Rev: 02_161020"

export type PalletMoverItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type PalletMoverCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: PalletMoverItem[]
}

export const PALLET_MOVER_CATEGORIES: PalletMoverCategory[] = [
  {
    id: "interview_user",
    number: 1,
    title: "1. Interview User",
    icon: UserCheck,
    items: [
      {
        id: "pm_interview_user",
        label: "Interview User / Operator",
        actionCode: "In",
        actionName: "Interview",
        categoryId: "interview_user",
      },
    ],
  },
  {
    id: "hour_meter",
    number: 2,
    title: "2. Hour Meter",
    icon: Gauge,
    items: [
      {
        id: "pm_hour_meter_1",
        label: "Hour Meter 1 ( travel )",
        actionCode: "W",
        actionName: "Write",
        categoryId: "hour_meter",
      },
    ],
  },
  {
    id: "body_structure",
    number: 3,
    title: "3. Body & Structure",
    icon: ShieldCheck,
    items: [
      {
        id: "pm_body_bolted",
        label: "A. Bolted Connection & mounting secure",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "body_structure",
      },
      {
        id: "pm_body_battery_protect",
        label: "B. Battery protection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "pm_body_roller_battery",
        label: "C. Roller battery",
        actionCode: "Ch&C",
        actionName: "Check & Clean",
        categoryId: "body_structure",
      },
    ],
  },
  {
    id: "drive_unit",
    number: 4,
    title: "4. Drive Unit",
    icon: Cog,
    items: [
      {
        id: "pm_drive_motor_traction",
        label: "A. Motor traction & Mounting secure",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "pm_drive_brake_func",
        label: "B. Brake function & condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "pm_drive_air_gap_brake",
        label: "C. Air Gap Break ( Standart @unit )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "drive_unit",
      },
      {
        id: "pm_drive_mounting_secure",
        label: "D.1 Drive system - Mounting secure",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "pm_drive_cable_conn",
        label: "D.2 Drive system - Cable connection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "pm_drive_gearbox",
        label: "E. Gear Box condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "drive_unit",
      },
      {
        id: "pm_drive_oil_level",
        label: "F. Oil Level & Leakage",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
    ],
  },
  {
    id: "wheel",
    number: 5,
    title: "5. Wheel",
    icon: CircleDot,
    items: [
      {
        id: "pm_wheel_drive",
        label: "A. Drive wheel ( Lining & Bolted condition )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "wheel",
      },
      {
        id: "pm_wheel_load",
        label: "B. Load wheel ( Lining, bearing & condition )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "wheel",
      },
      {
        id: "pm_wheel_supporting",
        label: "C. Supporting wheel ( Lining, Bearing & condition )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "wheel",
      },
    ],
  },
  {
    id: "steering_controller",
    number: 6,
    title: "6. Steering / Controller Shaft",
    icon: Compass,
    items: [
      {
        id: "pm_steer_tiller_mounting",
        label: "A. Tiller arm function - Mounting secure",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_controller",
      },
      {
        id: "pm_steer_travel_switch",
        label: "B. Travel switch function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_controller",
      },
      {
        id: "pm_steer_lift_lower",
        label: "C. Lift and lower button function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_controller",
      },
      {
        id: "pm_steer_safety_drive",
        label: "D. Safety drive function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_controller",
      },
    ],
  },
  {
    id: "hydraulics",
    number: 7,
    title: "7. Hydraulics",
    icon: Activity,
    items: [
      {
        id: "pm_hyd_pump_mounting",
        label: "A.1 Pump motor - Mounting secure",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "hydraulics",
      },
      {
        id: "pm_hyd_cables_conn",
        label: "A.2 Pump motor - Cables connection",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
      {
        id: "pm_hyd_brushes_rotor",
        label: "A.3 Pump motor - Kit brushes & rotor / stator",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
      {
        id: "pm_hyd_clean_dust",
        label: "A.4 Pump motor - Clean up motor from dust",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
      {
        id: "pm_hyd_oil_strainer",
        label: "B. Oil Level & Strainer",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "pm_hyd_hose_piping",
        label: "C. Hose & Piping Connections",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "hydraulics",
      },
      {
        id: "pm_hyd_main_cylinder",
        label: "D. Main lift Cylinder condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
    ],
  },
  {
    id: "safety_foots_pad",
    number: 8,
    title: "8. Safety Foots Pad",
    icon: Footprints,
    items: [
      {
        id: "pm_foot_bolt_secure",
        label: "A. Bolt connection & mounting secure",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "safety_foots_pad",
      },
      {
        id: "pm_foot_spring_cond",
        label: "B. Spring element condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "safety_foots_pad",
      },
      {
        id: "pm_foot_sensor_protect",
        label: "C. Sensor protection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "safety_foots_pad",
      },
    ],
  },
  {
    id: "safety_gate",
    number: 9,
    title: "9. Safety Gate",
    icon: ShieldAlert,
    items: [
      {
        id: "pm_gate_sensor_protect",
        label: "A. Sensor protection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "safety_gate",
      },
      {
        id: "pm_gate_cushion_cond",
        label: "B.1 Lateral path - Cushion condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "safety_gate",
      },
      {
        id: "pm_gate_arm_cond",
        label: "B.2 Lateral path - Arm condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "safety_gate",
      },
    ],
  },
  {
    id: "load_lifting_frame",
    number: 10,
    title: "10. Load Lifting & Hoist Frame",
    icon: ArrowUpDown,
    items: [
      {
        id: "pm_hoist_lever_cond",
        label: "A. Lever condition",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "load_lifting_frame",
      },
      {
        id: "pm_hoist_rod_pull",
        label: "B. Rod pull condition",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "load_lifting_frame",
      },
      {
        id: "pm_hoist_joint_fork",
        label: "C. Joint fork condition",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "load_lifting_frame",
      },
    ],
  },
  {
    id: "electrical_system",
    number: 11,
    title: "11. Electrical System",
    icon: Zap,
    items: [
      {
        id: "pm_elec_fuse_main",
        label: "A.1 Main fuse 200 - 300A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_fuse_brake",
        label: "A.2 Magnetic brake controller Fuse 10 - 15A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_fuse_controller",
        label: "A.3 Travel / Lift Controller Fuse 5 - 7 A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_fuse_accessories",
        label: "A.4 Accessories fuse 2 - 10A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_accessories_other",
        label: "A.5 Accessories",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_contactor_switch",
        label: "B. Contactor - Switch on contactor condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_wiring_connector",
        label: "C. Wiring connector",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "pm_elec_sensors_all",
        label: "D. All sensors",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
    ],
  },
  {
    id: "functional_test",
    number: 12,
    title: "12. Functional Test",
    icon: PlayCircle,
    items: [
      {
        id: "pm_func_test_drive",
        label: "A. OPERATIONAL CHECK & TEST DRIVE",
        actionCode: "Td",
        actionName: "Test Drive",
        categoryId: "functional_test",
      },
    ],
  },
]

export const ALL_PALLET_MOVER_ITEMS: PalletMoverItem[] = PALLET_MOVER_CATEGORIES.flatMap(
  (cat) => cat.items
)

const sharedItems: ChecklistItemConfig[] = ALL_PALLET_MOVER_ITEMS.map((item) => {
  const cat = PALLET_MOVER_CATEGORIES.find((c) => c.id === item.categoryId)
  return {
    id: item.id,
    label: item.label,
    icon: cat?.icon || Activity,
  }
})

export const FRM_TS_016_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_016_FORM_CODE,
  formName: "Form Monthly Checklist Pallet Mover",
  items: sharedItems,
  conditionOptions: [
    "BAIK",
    "RUSAK",
    "TIDAK_ADA",
  ],
  conditionLabels: {
    BAIK: "Baik (V / OK)",
    RUSAK: "Rusak (X / NOK)",
    TIDAK_ADA: "Tidak Ada (T)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
  },
  conditionRequiresPhoto,
}
