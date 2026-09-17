import assert from "node:assert/strict"

import { buildFrmTsm003Submission } from "./actions"

const result = buildFrmTsm003Submission({
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
  ],
})

assert.equal(result.ok, true)
if (result.ok) {
  assert.equal(result.isSafe, true)
  assert.equal(result.payload.formCode, "FRM_TSM_003")
}
