import {
  Activity,
  Droplet,
  Layers,
  Paintbrush,
  PlayCircle,
  Power,
  Tag,
  Wrench,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_064_FORM_CODE = "FRM_TS_064"
export const FRM_TS_064_NRA = "SAT/FRM/TS/064_Rev : 00_161020"
export const FRM_TS_064_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type TableLifterItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type TableLifterCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: TableLifterItem[]
}

export const TABLE_LIFTER_CATEGORIES: TableLifterCategory[] = [
  {
    id: "identity_unit",
    number: 1,
    title: "1. NOMOR IDENTITY UNIT",
    icon: Tag,
    items: [
      {
        id: "tl_identity_unit",
        label: "Nomor Identity Unit",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "identity_unit",
      },
    ],
  },
  {
    id: "painting_condition",
    number: 2,
    title: "2. PAINTING CONDITION",
    icon: Paintbrush,
    items: [
      {
        id: "tl_painting_condition",
        label: "Painting Condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "painting_condition",
      },
    ],
  },
  {
    id: "body_structure",
    number: 3,
    title: "3. BODY & STRUCTURE",
    icon: Layers,
    items: [
      {
        id: "tl_body_bolted",
        label: "A. Bolted Connection & mounting secure",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "body_structure",
      },
      {
        id: "tl_body_table_load",
        label: "B. Table Load Condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "tl_body_vertical_pantograph",
        label: "C. Vertical Pantograph",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "tl_body_shaft_pantograph",
        label: "D. Shaft pantograph",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "tl_body_bushing_bearing",
        label: "E. Bushing & Bearing Pantograph",
        actionCode: "Ch&L",
        actionName: "Check & Lubricant",
        categoryId: "body_structure",
      },
      {
        id: "tl_body_gutter_housing",
        label: "F. Gutter / Housing condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "body_structure",
      },
    ],
  },
  {
    id: "electrical_condition",
    number: 4,
    title: "4. ELECTRICAL CONDITION",
    icon: Zap,
    items: [
      {
        id: "tl_elec_panel",
        label: "A. Panel condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "electrical_condition",
      },
      {
        id: "tl_elec_connection",
        label: "B. Electrical connection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_condition",
      },
      {
        id: "tl_elec_switch_button",
        label: "C. Switch button",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "electrical_condition",
      },
      {
        id: "tl_elec_motor_pump",
        label: "D. Electric motor pump condition",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "electrical_condition",
      },
    ],
  },
  {
    id: "hydraulics",
    number: 5,
    title: "5. HYDRAULICS",
    icon: Droplet,
    items: [
      {
        id: "tl_hyd_oil_level",
        label: "A. Oil Level Reservoir",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "tl_hyd_oil_leaks",
        label: "B. Oil leaks",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "tl_hyd_seal_piston",
        label: "C. Seal & piston RAM",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "tl_hyd_seal_pump",
        label: "D. Seal Shaft Hydraulic Pump",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "tl_hyd_shaft_coupling",
        label: "E. Shaft & Coupling Connection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "tl_hyd_hose",
        label: "F. Hose hydraulic Connection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "tl_hyd_cylinder_ram",
        label: "G. Cylinder RAM condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
    ],
  },
  {
    id: "functional_test",
    number: 6,
    title: "6. FUNCTIONAL TEST",
    icon: PlayCircle,
    items: [
      {
        id: "tl_func_operational_test",
        label: "A. Operational Test Onload",
        actionCode: "Tr",
        actionName: "Test Running",
        categoryId: "functional_test",
      },
    ],
  },
]

export const ALL_TABLE_LIFTER_ITEMS: TableLifterItem[] =
  TABLE_LIFTER_CATEGORIES.flatMap((c) => c.items)

const CHECKLIST_ITEMS: ChecklistItemConfig[] = ALL_TABLE_LIFTER_ITEMS.map((item) => ({
  id: item.id,
  label: item.label,
  icon: Wrench,
}))

export const FRM_TS_064_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_064_FORM_CODE,
  formName: "Checklist Table Lifter Monthly",
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
