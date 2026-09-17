import assert from "node:assert/strict"

import { calculateChecklistIsSafe, validateChecklistPayload } from "./payload"

const validPayload = {
  formCode: "FRM_TSM_003",
  formName: "Form Checklist Ruangan",
  areaCode: "office",
  period: "MONTHLY",
  periodKey: "2026-09",
  items: [
    {
      id: "air_conditioner",
      label: "Air Conditioner",
      condition: "BAIK",
      photos: [{ fileId: "file-1", url: "/api/photos/file-1" }],
      notes: "",
    },
    {
      id: "exhaust_fan",
      label: "Exhaust Fan",
      condition: "TIDAK_ADA",
      photos: [],
      notes: "",
    },
  ],
}

assert.deepEqual(validateChecklistPayload(validPayload), {
  valid: true,
  errors: [],
})
assert.equal(calculateChecklistIsSafe(validPayload), true)

const missingPhoto = {
  ...validPayload,
  items: [
    {
      id: "lampu",
      label: "Lampu",
      condition: "RUSAK",
      photos: [],
      notes: "",
    },
  ],
}

assert.deepEqual(validateChecklistPayload(missingPhoto), {
  valid: false,
  errors: ["Lampu wajib memiliki foto untuk kondisi RUSAK."],
})
assert.equal(calculateChecklistIsSafe(missingPhoto), false)
