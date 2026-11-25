import test from "node:test"
import assert from "node:assert/strict"
import { wibDate, summarizePreventive, recordedTaskStatus, monthOffset, validMonth, calendarTaskHighlight, type RecordedTask } from "./preventive-metrics"
const now = "2026-11-25T08:00:00+07:00"
function row(id: string, status: string, date: string, reportStatus: string | null = null, completedAt: string | null = null): RecordedTask {
  return { id, status, targetDate: date, completedAt, reportStatus, objectType: "EQUIPMENT" }
}
test("WIB calendar and month boundary", () => {
  assert.equal(wibDate("2026-11-30T17:00:00Z"), "2026-12-01")
  assert.equal(monthOffset("2026-01", -1), "2025-12")
  assert.equal(validMonth("2026-13"), false)
})
test("task counts use recorded due month, exclude cancelled and distinguish pending approval", () => {
  const tasks = [row("a","COMPLETED","2026-11-07T23:59:59+07:00","PENDING_COORD","2026-11-07T12:00:00+07:00"), row("b","PENDING","2026-11-14T23:59:59+07:00"), row("c","PENDING","2026-11-30T23:59:59+07:00"), row("d","CANCELLED","2026-11-30T23:59:59+07:00"),row("e","COMPLETED","2026-12-31T23:59:59+07:00","COMPLETED")]
  assert.deepEqual(summarizePreventive(tasks,"2026-11",now), { total:3, completed:1, pending:1, overdue:1, approvalPending:1, notFinal:1, onTime:1, percentage:33 })
  assert.equal(summarizePreventive(tasks,"2026-10",now).percentage,null)
})
test("overdue derivation and late completion do not mutate existing status", () => {
  const late = row("late","COMPLETED","2026-11-07T23:59:59+07:00","COMPLETED","2026-11-09T12:00:00+07:00")
  assert.equal(recordedTaskStatus(late,now),"COMPLETED")
  assert.equal(summarizePreventive([late],"2026-11",now).onTime,0)
  const pending = row("pending","PENDING","2026-11-24T23:59:59+07:00")
  assert.equal(recordedTaskStatus(pending,now),"OVERDUE")
  assert.equal(pending.status,"PENDING")
})

test("calendar soft highlight uses red over orange over green; empty or cancelled remains neutral", () => {
  const done=row("done","COMPLETED","2026-11-30T23:59:59+07:00")
  const pending=row("pending","PENDING","2026-11-30T23:59:59+07:00")
  const late=row("late","PENDING","2026-11-24T23:59:59+07:00")
  assert.equal(calendarTaskHighlight([],now),null)
  assert.equal(calendarTaskHighlight([row("cancelled","CANCELLED","2026-11-30T23:59:59+07:00")],now),null)
  assert.equal(calendarTaskHighlight([done],now),"COMPLETED")
  assert.equal(calendarTaskHighlight([done,pending],now),"PENDING")
  assert.equal(calendarTaskHighlight([done,pending,late],now),"OVERDUE")
})
