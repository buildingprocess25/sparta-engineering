import { FRM_TSM_003_CONFIG } from "./frm-tsm-003"
import { FRM_TSM_005_CONFIG } from "./frm-tsm-005"

export function getChecklistItem(formCode: string, itemId: string) {
  if (formCode === "FRM_TSM_003") {
    return FRM_TSM_003_CONFIG.items.find((item) => item.id === itemId) ?? null
  }
  if (formCode === "FRM_TSM_005") {
    return FRM_TSM_005_CONFIG.items.find((item) => item.id === itemId) ?? null
  }
  return null
}
