import {
  Activity,
  Battery,
  BatteryCharging,
  CircleDot,
  Compass,
  Footprints,
  Gauge,
  Layers,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Wrench,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_029_FORM_CODE = "FRM_TS_029"
export const FRM_TS_029_NRA = "SAT/FRM/TS/029_Rev : 02_161020"
export const FRM_TS_029_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type ForkliftMonthlyItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type ForkliftMonthlyCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: ForkliftMonthlyItem[]
}

export const FORKLIFT_MONTHLY_CATEGORIES: ForkliftMonthlyCategory[] = [
  {
    id: "interview_user",
    number: 1,
    title: "1. INTERVIEW USER",
    icon: UserCheck,
    items: [
      {
        id: "fk_interview_user",
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
    title: "2. HOUR METER 1 ( travel )",
    icon: Gauge,
    items: [
      {
        id: "fk_hour_meter_1",
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
    title: "3. BODY & STRUCTURE",
    icon: ShieldCheck,
    items: [
      {
        id: "fk_body_bolted",
        label: "A. Bolted Connection & mounting secure",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "body_structure",
      },
      {
        id: "fk_body_battery_protection",
        label: "B. Battery protection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "fk_body_roller_battery",
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
    title: "4. DRIVE UNIT",
    icon: Activity,
    items: [
      {
        id: "fk_drive_motor_traction",
        label: "A. Motor traction & Mounting secure",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "fk_drive_brake_function",
        label: "B. Brake function & condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "fk_drive_air_gap",
        label: "C. Air Gap Break ( Standart @unit )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "drive_unit",
      },
      {
        id: "fk_drive_system_mounting",
        label: "D1. Drive system: Mounting secure",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "fk_drive_system_cable",
        label: "D2. Drive system: Cable connection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
      {
        id: "fk_drive_gearbox",
        label: "E. Gear Box condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "drive_unit",
      },
      {
        id: "fk_drive_oil_leakage",
        label: "F. Oil Level & Leakage",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "drive_unit",
      },
    ],
  },
  {
    id: "wheels",
    number: 5,
    title: "5. WHEELS",
    icon: CircleDot,
    items: [
      {
        id: "fk_wheel_drive",
        label: "A. Drive wheel ( Lining & Bolted condition )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "wheels",
      },
      {
        id: "fk_wheel_load",
        label: "B. Load wheel ( Lining, Bolted & Bearing condition )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "wheels",
      },
      {
        id: "fk_wheel_supporting",
        label: "C. Supporting wheel ( Lining, Bolted & Bearing condition )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "wheels",
      },
    ],
  },
  {
    id: "steering_control",
    number: 6,
    title: "6. STEERING CONTROL",
    icon: Compass,
    items: [
      {
        id: "fk_steer_orbitrol",
        label: "A. Steering unit orbitrol function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
      {
        id: "fk_steer_power_steering",
        label: "B. Power steering operation ( electric / hydraulic )",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
      {
        id: "fk_steer_travel_switch",
        label: "C. Travel switch function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
      {
        id: "fk_steer_lift_lower",
        label: "D. Lift and lower button function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
      {
        id: "fk_steer_sideshift_tilt",
        label: "E. Sideshift, tilt & reach function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
      {
        id: "fk_steer_emergency_switch",
        label: "F. Emergency switch function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
      {
        id: "fk_steer_safety_drive",
        label: "G. Safety drive function",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "steering_control",
      },
    ],
  },
  {
    id: "hydraulics",
    number: 7,
    title: "7. HYDRAULICS",
    icon: Wrench,
    items: [
      {
        id: "fk_hyd_pump_mounting",
        label: "A1. Pump motor: Mounting secure",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "hydraulics",
      },
      {
        id: "fk_hyd_pump_cables",
        label: "A2. Pump motor: Cables connection",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
      {
        id: "fk_hyd_pump_brushes",
        label: "A3. Pump motor: Kit brushes ( motor dc ) & rotor / stator",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
      {
        id: "fk_hyd_pump_clean_dust",
        label: "A4. Pump motor: Clean up motor from dust",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
      {
        id: "fk_hyd_oil_strainer",
        label: "B. Oil Level & Strainer",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "fk_hyd_hose_piping",
        label: "C. Hose & Piping Connections",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "hydraulics",
      },
      {
        id: "fk_hyd_manifold",
        label: "D. Manifold distribution hydraulic",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "hydraulics",
      },
    ],
  },
  {
    id: "standing_seating",
    number: 8,
    title: "8. STANDING & SEATING PLATFORM",
    icon: Footprints,
    items: [
      {
        id: "fk_platform_pedals",
        label: "A. Pedals function ( brake, accelerator & safety bar )",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "standing_seating",
      },
      {
        id: "fk_platform_seating",
        label: "B. Seating operator ( optional )",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "standing_seating",
      },
      {
        id: "fk_platform_safety_prot",
        label: "C. Safety protection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "standing_seating",
      },
      {
        id: "fk_platform_panel_monitor",
        label: "D. Panel cabinet / monitor",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "standing_seating",
      },
      {
        id: "fk_platform_lighting",
        label: "E. Lighting & head lamp",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "standing_seating",
      },
      {
        id: "fk_platform_overhead_prot",
        label: "F. Overhead protector",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "standing_seating",
      },
    ],
  },
  {
    id: "mast_assembly",
    number: 9,
    title: "9. MAST ASSEMBLY",
    icon: Layers,
    items: [
      {
        id: "fk_mast_lift_chain",
        label: "A. Lift chain condition",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "mast_assembly",
      },
      {
        id: "fk_mast_chain_adj",
        label: "B. Chain adjustment",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "mast_assembly",
      },
      {
        id: "fk_mast_gap_level_fork",
        label: "C. Gap level fork",
        actionCode: "Ch&A",
        actionName: "Check & Adjust",
        categoryId: "mast_assembly",
      },
      {
        id: "fk_mast_cylinder_cond",
        label: "D. Cylinder condition: Lift, reach, tilt, sideshift",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "mast_assembly",
      },
    ],
  },
  {
    id: "electrical_system",
    number: 10,
    title: "10. ELECTRICAL SYSTEM",
    icon: Zap,
    items: [
      {
        id: "fk_elec_fuse_main",
        label: "A1. Fuses: Main fuse 300 - 400A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_fuse_modul",
        label: "A2. Fuses: Modul / access fuse 100 - 250A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_fuse_accessories",
        label: "A3. Fuses: Accessories fuse 2 - 10A",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_fuse_housing",
        label: "A4. Fuses: Fuse housing",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_fuse_accessories_unit",
        label: "A5. Fuses: Accessories",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_contactor_condition",
        label: "B. Contactor: Switch on contactor condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_wiring_connector",
        label: "C. Wiring connector",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
      {
        id: "fk_elec_all_sensors",
        label: "D. All sensors",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_system",
      },
    ],
  },
  {
    id: "functional_test",
    number: 11,
    title: "11. FUNCTIONAL TEST",
    icon: PlayCircle,
    items: [
      {
        id: "fk_func_test_drive",
        label: "A. Operational check & test drive",
        actionCode: "Td",
        actionName: "Test Drive",
        categoryId: "functional_test",
      },
    ],
  },
  {
    id: "charger_battery",
    number: 12,
    title: "12. CHARGER BATTERY",
    icon: BatteryCharging,
    items: [
      {
        id: "fk_charger_operational",
        label: "A. Operational & condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "charger_battery",
      },
    ],
  },
]

export const ALL_FORKLIFT_MONTHLY_ITEMS: ForkliftMonthlyItem[] =
  FORKLIFT_MONTHLY_CATEGORIES.flatMap((c) => c.items)

const CHECKLIST_ITEMS: ChecklistItemConfig[] = ALL_FORKLIFT_MONTHLY_ITEMS.map(
  (item) => ({
    id: item.id,
    label: item.label,
    icon: Wrench,
  })
)

export const FRM_TS_029_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_029_FORM_CODE,
  formName: "Form Monthly Checklist Forklift",
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
