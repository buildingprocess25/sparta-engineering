import assert from "node:assert/strict"

import {
  getPayloadPhotosForCondition,
  nextChecklistPhotoState,
} from "./photo-state"
import type { ChecklistPhoto } from "./payload"

const photos: ChecklistPhoto[] = [{ fileId: "file-1", url: "/api/photos/file-1" }]

assert.deepEqual(
  nextChecklistPhotoState({ condition: "BAIK", photos }, "TIDAK_ADA"),
  { condition: "TIDAK_ADA", photos }
)

assert.deepEqual(
  nextChecklistPhotoState({ condition: "TIDAK_ADA", photos }, "RUSAK"),
  { condition: "RUSAK", photos }
)

assert.deepEqual(getPayloadPhotosForCondition("BAIK", photos), photos)
assert.deepEqual(getPayloadPhotosForCondition("RUSAK", photos), photos)
assert.deepEqual(getPayloadPhotosForCondition("TIDAK_ADA", photos), [])
