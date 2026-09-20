import type { ChecklistCondition, ChecklistPhoto } from "./payload"

export type ChecklistPhotoState = {
  condition?: ChecklistCondition
  photos: ChecklistPhoto[]
}

export function conditionRequiresPhoto(condition?: ChecklistCondition) {
  return condition === "RUSAK"
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
