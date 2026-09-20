import assert from "node:assert/strict"

import { buildChecklistPhotoWatermarkLines } from "./photo-watermark"

const lines = buildChecklistPhotoWatermarkLines({
  areaName: "Office",
  userLabel: "BMS User (12345678)",
  userRole: "ES",
  capturedAt: new Date(2026, 8, 18, 13, 51, 58),
})

assert.deepEqual(lines, [
  { text: "SPARTA Engineering", weight: 700 },
  { text: "18 Sep 2026, 13:51:58", weight: 400 },
  { text: "Oleh: BMS User (12345678) - ES", weight: 400 },
  { text: "Area: Office", weight: 400 },
])
