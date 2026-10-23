import { FRM_TSM_002_CONFIG } from "./frm-tsm-002"
import { FRM_TSM_003_CONFIG } from "./frm-tsm-003"
import { FRM_TSM_005_CONFIG } from "./frm-tsm-005"
import { FRM_TS_016_CONFIG } from "./frm-ts-016"
import { FRM_TS_022_CONFIG } from "./frm-ts-022"
import { FRM_TS_029_CONFIG } from "./frm-ts-029"
import { FRM_TSM_013_CONFIG } from "./frm-tsm-013"
import { FRM_TS_064_CONFIG } from "./frm-ts-064"
import { FRM_TSM_008_CONFIG } from "./frm-tsm-008"
import { FRM_TS_063_CONFIG } from "./frm-ts-063"
import { FRM_TS_041_CONFIG } from "./frm-ts-041"
import { FRM_TS_028_CONFIG } from "./frm-ts-028"
import { FRM_TS_062_CONFIG } from "./frm-ts-062"
import { FRM_TS_043_CONFIG } from "./frm-ts-043"
import { FRM_TS_045_CONFIG } from "./frm-ts-045"
import { FRM_TSM_006_CONFIG } from "./frm-tsm-006"
import { FRM_TSM_007_CONFIG } from "./frm-tsm-007"
import { FRM_TSM_001_CONFIG } from "./frm-tsm-001"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export function getChecklistItem(formCode: string, itemId: string) {
  const config = getChecklistConfig(formCode)
  const found = config?.items.find((item) => item.id === itemId)
  if (found) return found

  // Special case for Genset ATS (FRM_TSM_001)
  if (
    (formCode === "FRM_TSM_001" || formCode === "FRM_TSM_001_REPAIR") &&
    itemId === "system_ats_test"
  ) {
    return { id: "system_ats_test", label: "Pengujian Sistem ATS" }
  }

  // Graceful fallback for any valid form so photo upload is never rejected with 404
  if (config) {
    return { id: itemId, label: itemId }
  }

  return null
}

const REPAIR_CONDITION_OPTIONS = ["RUSAK"] as const

export function getChecklistConfig(formCode: string): ChecklistConfig | null {
  if (formCode === "FRM_TSM_002") return FRM_TSM_002_CONFIG
  if (formCode === "FRM_TSM_003") return FRM_TSM_003_CONFIG
  if (formCode === "FRM_TSM_005") return FRM_TSM_005_CONFIG
  if (formCode === "FRM_TS_016") return FRM_TS_016_CONFIG
  if (formCode === "FRM_TS_022") return FRM_TS_022_CONFIG
  if (formCode === "FRM_TS_029") return FRM_TS_029_CONFIG
  if (formCode === "FRM_TSM_013") return FRM_TSM_013_CONFIG
  if (formCode === "FRM_TS_064") return FRM_TS_064_CONFIG
  if (formCode === "FRM_TSM_008") return FRM_TSM_008_CONFIG
  if (formCode === "FRM_TS_063") return FRM_TS_063_CONFIG
  if (formCode === "FRM_TS_041") return FRM_TS_041_CONFIG
  if (formCode === "FRM_TS_028" || formCode === "FRM_TS_068") return FRM_TS_028_CONFIG
  if (formCode === "FRM_TS_062") return FRM_TS_062_CONFIG
  if (formCode === "FRM_TS_043") return FRM_TS_043_CONFIG
  if (formCode === "FRM_TS_045") return FRM_TS_045_CONFIG
  if (formCode === "FRM_TSM_006") return FRM_TSM_006_CONFIG
  if (formCode === "FRM_TSM_007") return FRM_TSM_007_CONFIG
  if (formCode === "FRM_TSM_001") return FRM_TSM_001_CONFIG

  // Repair variants
  const baseMap: Record<string, ChecklistConfig> = {
    FRM_TSM_002: FRM_TSM_002_CONFIG,
    FRM_TSM_003: FRM_TSM_003_CONFIG,
    FRM_TSM_005: FRM_TSM_005_CONFIG,
    FRM_TS_016: FRM_TS_016_CONFIG,
    FRM_TS_022: FRM_TS_022_CONFIG,
    FRM_TS_029: FRM_TS_029_CONFIG,
    FRM_TSM_013: FRM_TSM_013_CONFIG,
    FRM_TS_064: FRM_TS_064_CONFIG,
    FRM_TSM_008: FRM_TSM_008_CONFIG,
    FRM_TS_063: FRM_TS_063_CONFIG,
    FRM_TS_041: FRM_TS_041_CONFIG,
    FRM_TS_028: FRM_TS_028_CONFIG,
    FRM_TS_068: FRM_TS_028_CONFIG,
    FRM_TS_062: FRM_TS_062_CONFIG,
    FRM_TS_043: FRM_TS_043_CONFIG,
    FRM_TS_045: FRM_TS_045_CONFIG,
    FRM_TSM_006: FRM_TSM_006_CONFIG,
    FRM_TSM_007: FRM_TSM_007_CONFIG,
    FRM_TSM_001: FRM_TSM_001_CONFIG,
  }

  if (formCode.endsWith("_REPAIR")) {
    const baseCode = formCode.replace("_REPAIR", "")
    const baseConfig = baseMap[baseCode]
    if (baseConfig) {
      return {
        ...baseConfig,
        formCode,
        conditionOptions: [...REPAIR_CONDITION_OPTIONS],
        allowPartial: true,
      }
    }
  }

  return null
}
