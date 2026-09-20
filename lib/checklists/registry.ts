import { FRM_TSM_003_CONFIG } from "./frm-tsm-003"
import { FRM_TSM_005_CONFIG } from "./frm-tsm-005"

export function getChecklistItem(formCode: string, itemId: string) {
  const config = getChecklistConfig(formCode)
  return config?.items.find((item) => item.id === itemId) ?? null
}

export function getChecklistConfig(formCode: string) {
  if (formCode === "FRM_TSM_003") {
    return FRM_TSM_003_CONFIG
  }
  if (formCode === "FRM_TSM_005") {
    return FRM_TSM_005_CONFIG
  }
  return null
}
