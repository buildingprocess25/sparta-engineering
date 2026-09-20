import {
  ArrowUpToLine,
  Bath,
  DoorClosed,
  Droplet,
  Fan,
  Grid,
  Lightbulb,
  Plug,
  Square,
  ToggleRight,
  Waves,
  Wind,
  Zap,
} from "lucide-react"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export const FRM_TSM_005_FORM_CODE = "FRM_TSM_005"

export const FRM_TSM_005_CONFIG: ChecklistConfig = {
  formCode: FRM_TSM_005_FORM_CODE,
  formName: "Form Checklist Fisik Bangunan Utama & Penunjang",
  items: [
    { id: "atap_zincalume", label: "Atap Zincalume / dak beton", icon: ArrowUpToLine },
    { id: "dinding_partisi", label: "Dinding / partisi / Cladding", icon: Square },
    { id: "aspalt_paving", label: "Aspalt / Paving / Cor", icon: Grid },
    { id: "pintu_gerbang", label: "Pintu Gerbang", icon: DoorClosed },
    { id: "pintu", label: "Pintu", icon: DoorClosed },
    { id: "jendela", label: "Jendela", icon: Square },
    { id: "grounding", label: "Grounding", icon: Zap },
    { id: "lampu_pju", label: "Lampu PJU", icon: Lightbulb },
    { id: "panel_listrik", label: "Panel Listrik", icon: Zap },
    { id: "water_torn", label: "Water Torn / Ground Tank", icon: Droplet },
    { id: "water_recycle", label: "Water Recycle", icon: Droplet },
    { id: "saluran_air_bersih", label: "Saluran air bersih", icon: Waves },
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
