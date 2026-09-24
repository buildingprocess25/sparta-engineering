import type { ChecklistCondition, ChecklistPhoto } from "./payload"

export type ChecklistPhotoState = {
  condition?: ChecklistCondition
  photos: ChecklistPhoto[]
}

export function conditionRequiresPhoto(condition?: ChecklistCondition) {
  if (!condition) return false
  return ["RUSAK", "REPAIR", "URGENT", "ADJUST_OR_ADD", "CLEAN"].includes(condition)
}

export function nextChecklistPhotoState(
  current: ChecklistPhotoState,
  condition: ChecklistCondition
): ChecklistPhotoState {
  return {
    ...current,
    condition,
  }
}

export function getPayloadPhotosForCondition(
  condition: ChecklistCondition,
  photos: ChecklistPhoto[]
) {
  return conditionRequiresPhoto(condition) ? photos : []
}
