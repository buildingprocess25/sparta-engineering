import {
  AirVent,
  ArrowUpToLine,
  Bath,
  BrickWall,
  DoorClosed,
  Droplet,
  Fan,
  LayoutGrid,
  Lightbulb,
  Plug,
  ToggleRight,
  Waves,
  Zap,
} from "lucide-react"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export const FRM_TSM_003_FORM_CODE = "FRM_TSM_003"

export const FRM_TSM_003_CONFIG: ChecklistConfig = {
  formCode: FRM_TSM_003_FORM_CODE,
  formName: "Form Checklist Ruangan",
  items: [
    { id: "air_conditioner", label: "Air Conditioner", icon: AirVent },
    { id: "exhaust_fan", label: "Exhaust Fan", icon: Fan },
    { id: "saklar", label: "Saklar", icon: ToggleRight },
    { id: "lampu", label: "Lampu", icon: Lightbulb },
    { id: "panel_listrik", label: "Panel Listrik", icon: Zap },
    { id: "stop_kontak", label: "Stop kontak", icon: Plug },
    { id: "dinding_partisi", label: "Dinding/partisi", icon: BrickWall },
    { id: "lantai", label: "Lantai", icon: LayoutGrid },
    { id: "pintu", label: "Pintu", icon: DoorClosed },
    { id: "plafon", label: "Plafon", icon: ArrowUpToLine },
    { id: "closet", label: "Closet", icon: Bath },
    { id: "keran", label: "Keran", icon: Droplet },
    { id: "saluran_air_kotor", label: "Saluran air kotor (Drainase)", icon: Waves },
  ],
  conditionOptions: [
    "ADJUST_OR_ADD",
    "CLEAN",
    "REPAIR",
    "URGENT",
    "BAIK",
    "RUSAK",
    "TIDAK_ADA",
  ],
  conditionLabels: {
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
    BAIK: "Baik (V)",
    RUSAK: "Rusak (X)",
    TIDAK_ADA: "Tidak Ada (T)",
  },
  conditionRequiresPhoto: (condition) => condition === "RUSAK",
}
