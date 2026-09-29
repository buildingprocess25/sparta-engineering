import {
  Activity,
  CircleDot,
  Droplet,
  Layers,
  Paintbrush,
  PlayCircle,
  Tag,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TS_062_FORM_CODE = "FRM_TS_062"
export const FRM_TS_062_NRA = "SAT/FRM/TS/062_Rev : 00_161020"
export const FRM_TS_062_REF_NRA =
  "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH"

export type HandPalletItem = {
  id: string
  label: string
  actionCode: string
  actionName: string
  categoryId: string
}

export type HandPalletCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: HandPalletItem[]
}

export const HAND_PALLET_CATEGORIES: HandPalletCategory[] = [
  {
    id: "identity_unit",
    number: 1,
    title: "1. NOMOR USER / IDENTITY UNIT",
    icon: Tag,
    items: [
      {
        id: "hp_identity_unit",
        label: "Nomor User / Identity Unit",
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
        id: "hp_painting_condition",
        label: "Painting Condition",
        actionCode: "Ch",
        actionName: "Check",
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
        id: "hp_body_bolted",
        label: "A. Bolted Connection & mounting secure",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_fork",
        label: "B. Fork",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_handle",
        label: "C. Handle",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_shaft",
        label: "D. Shaft ( AS )",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_bushing",
        label: "E. All Bushing",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_pin_shaft",
        label: "F. All Pin Shaft",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_linkage",
        label: "G. Linkage",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
      {
        id: "hp_body_lubricant",
        label: "H. Lubricant",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "body_structure",
      },
    ],
  },
  {
    id: "wheels",
    number: 4,
    title: "4. WHEELS",
    icon: CircleDot,
    items: [
      {
        id: "hp_wheels_drive",
        label: "A. Drive wheel ( Lining & Bearing condition )",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "wheels",
      },
      {
        id: "hp_wheels_load",
        label: "B. Load wheel ( Lining & Bearing condition )",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "wheels",
      },
      {
        id: "hp_wheels_roller_exit",
        label: "C. Roller exit ( Lining condition )",
        actionCode: "Ch&Cl",
        actionName: "Check & Clean",
        categoryId: "wheels",
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
        id: "hp_hydraulics_oil_level",
        label: "A. Oil level",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "hp_hydraulics_oil_leaks",
        label: "B. Oil leaks",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "hp_hydraulics_seal_ram",
        label: "C. Seal & piston RAM",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "hp_hydraulics_seal_pump",
        label: "D. Seal & piston Pump",
        actionCode: "Ch",
        actionName: "Check",
        categoryId: "hydraulics",
      },
      {
        id: "hp_hydraulics_seal_control",
        label: "E. Seal & Piston Control",
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
    icon: Activity,
    items: [
      {
        id: "hp_functional_onload",
        label: "A. Operational Test Onload",
        actionCode: "Td",
        actionName: "Test drive",
        categoryId: "functional_test",
      },
    ],
  },
]

export const ALL_HAND_PALLET_ITEMS: HandPalletItem[] = HAND_PALLET_CATEGORIES.flatMap(
  (c) => c.items
)

export const ACTION_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Ch: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "Ch&Cl": {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  Td: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
}

export const FRM_TS_062_ITEMS_CONFIG: ChecklistItemConfig[] = ALL_HAND_PALLET_ITEMS.map((item) => {
  const cat = HAND_PALLET_CATEGORIES.find((c) => c.id === item.categoryId)
  return {
    id: item.id,
    label: item.label,
    icon: cat?.icon || Activity,
  }
})

export const FRM_TS_062_CONFIG: ChecklistConfig = {
  formCode: FRM_TS_062_FORM_CODE,
  formName: "Form Monthly Checklist Hand Pallet",
  items: FRM_TS_062_ITEMS_CONFIG,
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
