import {
  Activity,
  Fan,
  Gauge,
  Layers,
  Paintbrush,
  PlayCircle,
  Tag,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_063_FORM_CODE = "FRM_TS_063"
export const FRM_TS_063_NRA = "SAT/FRM/TS/063_Rev : 00_161020"
export const FRM_TS_063_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type ExhaustFanItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type ExhaustFanCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: ExhaustFanItem[]
}

export const EXHAUST_FAN_CATEGORIES: ExhaustFanCategory[] = [
  {
    id: "identity_unit",
    number: 1,
    title: "1. NOMOR IDENTITY UNIT",
    icon: Tag,
    items: [
      {
        id: "ef_identity_unit",
        label: "Nomor Identity Unit",
        actionCode: "Ch",
        actionName: "Check",
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
        id: "ef_painting_condition",
        label: "Painting Condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "painting_condition",
      },
    ],
  },
  {
    id: "all_condition",
    number: 3,
    title: "3. ALL CONDITION",
    icon: Fan,
    items: [
      {
        id: "ef_electrical_conection",
        label: "A. Electrical & Conection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "all_condition",
      },
      {
        id: "ef_mounting_frame_motor",
        label: "B. Mounting & Frame Motor",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "all_condition",
      },
      {
        id: "ef_motor_electric",
        label: "C. Motor Electric",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "all_condition",
      },
      {
        id: "ef_fan_blade_shaft",
        label: "D. Fan Blade & shaft",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "all_condition",
      },
      {
        id: "ef_bearing_lubricant",
        label: "E. Bearing & Lubricant",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "all_condition",
      },
      {
        id: "ef_fan_belt_conection",
        label: "F. Fan Belt Conection ( optional )",
        actionCode: "Adj",
        actionName: "Adjust",
        categoryId: "all_condition",
      },
      {
        id: "ef_pully_conection",
        label: "G. Pully Conection",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "all_condition",
      },
      {
        id: "ef_lubricant",
        label: "H. Lubricant",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "all_condition",
      },
      {
        id: "ef_speed_condition",
        label: "I. Speed Condition",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "all_condition",
      },
      {
        id: "ef_front_grill_protection",
        label: "J. Front Grill Protection",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "all_condition",
      },
      {
        id: "ef_back_swing_protection",
        label: "K. Back swing protection",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "all_condition",
      },
    ],
  },
  {
    id: "operational_test",
    number: 4,
    title: "4. OPERATIONAL TEST",
    icon: PlayCircle,
    items: [
      {
        id: "ef_operational_test_running",
        label: "A. Operational Test Runing",
        actionCode: "Tr",
        actionName: "Test Runing",
        categoryId: "operational_test",
      },
    ],
  },
]

export const ALL_EXHAUST_FAN_ITEMS: ExhaustFanItem[] =
  EXHAUST_FAN_CATEGORIES.flatMap((c) => c.items)

export const FRM_TS_063_ITEMS_CONFIG: ChecklistItemConfig[] =
  ALL_EXHAUST_FAN_ITEMS.map((item) => {
    const cat = EXHAUST_FAN_CATEGORIES.find((c) => c.id === item.categoryId)
    return {
      id: item.id,
      label: item.label,
      icon: cat?.icon || Fan,
    }
  })

export const FRM_TS_063_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_063_FORM_CODE,
  formName: "Checklist Exhaust Fan",
  items: FRM_TS_063_ITEMS_CONFIG,
  conditionOptions: ["BAIK", "RUSAK", "TIDAK_ADA"],
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
