import assert from "node:assert/strict"
import { test } from "node:test"

import { getChecklistFormConfig, getFormsForRoom, matchesChecklistForm } from "./checklist-config"
import { getScheduledChecklistWeek } from "./date-utils"

test("maps equivalent internal and SAT form codes without falling back to Checklist Ruangan", () => {
  assert.equal(getChecklistFormConfig("FRM_TSM_002")?.id, "frm-tsm-002")
  assert.equal(getChecklistFormConfig("SAT/FRM/TSM/002_REV_000_211022")?.id, "frm-tsm-002")
  assert.equal(getChecklistFormConfig("SAT/FRM TS/029")?.id, "frm-ts-029")
  assert.equal(getChecklistFormConfig("SAT/FRM/TS/028-REV.002 161020")?.id, "frm-ts-028")
  assert.equal(getChecklistFormConfig("SAT/FRM/TS/063_REV : 00_161020")?.id, "frm-ts-063")
  assert.equal(getChecklistFormConfig("FRM_TSM_002_REPAIR"), undefined)
  assert.equal(getChecklistFormConfig("FRM_TSM_999"), undefined)
})

test("applies Office Monthly and retains warehouse periods explicitly set on the room", () => {
  const room = { formAvailabilities: [
    { formCode: "FRM_TSM_003", period: "MONTHLY" },
    { formCode: "SAT/FRM/TSM/003 REV 000 211022", period: "MONTHLY" },
    { formCode: "FRM_TSM_003", period: "WEEKLY" },
    { formCode: "FRM_TSM_006", period: "SEMESTER" },
    { formCode: "FRM_TSM_999", period: "QUARTERLY" },
  ] }

  assert.deepEqual(getFormsForRoom(room, "MONTHLY", "OFFICE").map((form) => form.id), ["frm-tsm-003"])
  assert.deepEqual(getFormsForRoom(room, "WEEKLY", "OFFICE"), [])
  assert.deepEqual(getFormsForRoom(room, "WEEKLY", "WAREHOUSE").map((form) => form.id), ["frm-tsm-003"])
  assert.deepEqual(getFormsForRoom(room, "QUARTERLY", "WAREHOUSE"), [])
  assert.deepEqual(getFormsForRoom(room, "SEMESTER", "WAREHOUSE").map((form) => form.id), ["frm-tsm-006"])
})

test("finds catalog entries by title, SAT code or internal code", () => {
  const form = getChecklistFormConfig("FRM_TSM_002")!
  for (const query of [" Warehouse ", "SAT/FRM/TSM/002", "FRM_TSM_002", "TSM/002", "002"]) {
    assert.equal(matchesChecklistForm(form, query), true, query)
  }
  assert.equal(matchesChecklistForm(form, "TSM/003"), false)
})

test("reads the routine week of month without interpreting ISO or semester keys as routine weeks", () => {
  assert.equal(getScheduledChecklistWeek("2026-11-W3"), "3")
  assert.equal(getScheduledChecklistWeek("2026-W03"), undefined)
  assert.equal(getScheduledChecklistWeek("2026-11-W5"), undefined)
  assert.equal(getScheduledChecklistWeek("2026-S2"), undefined)
})
