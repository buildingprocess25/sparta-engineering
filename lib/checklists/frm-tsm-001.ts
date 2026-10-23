import { Activity } from "lucide-react"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export const FRM_TSM_001_CONFIG: ChecklistConfig = {
  formCode: "FRM_TSM_001",
  formName: "Checklist Test ATS & Pemantauan Genset",
  items: [
    {
      id: "system_ats_test",
      label: "Pengujian Sistem ATS",
      icon: Activity,
    },
  ],
  conditionOptions: ["BAIK", "RUSAK"],
  conditionLabels: {
    BAIK: "OK",
    RUSAK: "NOK",
    TIDAK_ADA: "Tidak Ada (T)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
  },
  conditionRequiresPhoto: (condition?: string) => condition === "RUSAK" || condition === "NOK",
}
