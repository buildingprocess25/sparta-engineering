import { FRM_TSM_002_CONFIG } from "./frm-tsm-002"
import { FRM_TSM_003_CONFIG } from "./frm-tsm-003"
import { FRM_TSM_005_CONFIG } from "./frm-tsm-005"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export function getChecklistItem(formCode: string, itemId: string) {
  const config = getChecklistConfig(formCode)
  return config?.items.find((item) => item.id === itemId) ?? null
}

const REPAIR_CONDITION_OPTIONS = ["RUSAK"] as const

export function getChecklistConfig(formCode: string): ChecklistConfig | null {
  if (formCode === "FRM_TSM_002") return FRM_TSM_002_CONFIG
  if (formCode === "FRM_TSM_003") return FRM_TSM_003_CONFIG
  if (formCode === "FRM_TSM_005") return FRM_TSM_005_CONFIG

  if (formCode === "FRM_TSM_002_REPAIR") {
    return {
      ...FRM_TSM_002_CONFIG,
      formCode: "FRM_TSM_002_REPAIR",
      conditionOptions: [...REPAIR_CONDITION_OPTIONS],
      allowPartial: true,
    }
  }
  if (formCode === "FRM_TSM_003_REPAIR") {
    return {
      ...FRM_TSM_003_CONFIG,
      formCode: "FRM_TSM_003_REPAIR",
      conditionOptions: [...REPAIR_CONDITION_OPTIONS],
      allowPartial: true,
    }
  }
  if (formCode === "FRM_TSM_005_REPAIR") {
    return {
      ...FRM_TSM_005_CONFIG,
      formCode: "FRM_TSM_005_REPAIR",
      conditionOptions: [...REPAIR_CONDITION_OPTIONS],
      allowPartial: true,
    }
  }

  return null
}
