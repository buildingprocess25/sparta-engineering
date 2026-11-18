import assert from "node:assert/strict"
import { test } from "node:test"
import {
  getNextWorkPermitPeriod,
  getWorkPermitCalendarDate,
  getWorkPermitCalendarPeriod,
  resolveRequestedWorkPermitDate,
} from "./calendar"

test("stores the selected work date and uses the same calendar date in the permit code", () => {
  assert.deepEqual(resolveRequestedWorkPermitDate("2026-11-18", "2026-11"), {
    date: new Date("2026-11-18T00:00:00.000Z"),
    targetPeriod: "2026-11",
    codeDate: "20261118",
  })
  assert.equal(resolveRequestedWorkPermitDate("2026-02-30"), null)
  assert.equal(resolveRequestedWorkPermitDate("2026-11-18", "2026-13"), null)
})

test("uses the Jakarta calendar at midnight and rolls December into January", () => {
  const jakartaNewYear = new Date("2026-12-31T17:00:00Z")
  assert.equal(getWorkPermitCalendarDate(jakartaNewYear), "2027-01-01")
  assert.equal(getWorkPermitCalendarPeriod(jakartaNewYear), "2027-01")
  assert.equal(getNextWorkPermitPeriod("2026-12"), "2027-01")
  assert.equal(
    resolveRequestedWorkPermitDate(undefined, undefined, jakartaNewYear)
      ?.codeDate,
    "20270101"
  )
  assert.equal(
    resolveRequestedWorkPermitDate(undefined, "2026-12")?.codeDate,
    "20261201"
  )
})
