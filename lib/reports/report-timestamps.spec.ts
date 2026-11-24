import assert from "node:assert/strict"
import { test } from "node:test"
import { getReportCompletedAt, getReviewSubmittedAt, mergeReportHistory, withReviewSubmittedAt } from "./report-timestamps"
import { normalizeApprovalHistory, normalizeExecutionHistory } from "./report-display"

const at = (minute: number) => `2026-11-24T06:${String(minute).padStart(2, "0")}:00.000Z`
const base = { createdAt: at(30), status: "COMPLETED", revisions: [], checklistPayload: {}, approvalHistory: [{ role: "COORD", decision: "approve", decidedAt: at(34) }], executionHistory: [] }

test("submit timestamp uses stored server value, not input or last update", () => {
  assert.equal(withReviewSubmittedAt({ reviewSubmittedAt: at(59) }, {}, new Date(at(32))).reviewSubmittedAt, at(32))
  assert.equal(withReviewSubmittedAt({}, { reviewSubmittedAt: at(32) }, new Date(at(45))).reviewSubmittedAt, at(32))
  assert.equal(getReviewSubmittedAt({ ...base, checklistPayload: { reviewSubmittedAt: at(32) } }), at(32))
  assert.equal(getReviewSubmittedAt(base), null)
})

test("historical follow-up time is bounded by first approval and revision history", () => {
  assert.equal(getReviewSubmittedAt({ ...base, checklistPayload: { followUpCompletedAt: at(32) } }), at(32))
  assert.equal(getReviewSubmittedAt({ ...base, checklistPayload: { followUpCompletedAt: at(45) } }), null)
  assert.equal(getReviewSubmittedAt({ ...base, revisions: [{}], checklistPayload: { followUpCompletedAt: at(32) } }), null)
})

test("completion time and timeline follow actual events", () => {
  const execution = [{ action: "FINISH_WORK", nextStatus: "COMPLETED", performedAt: at(50) }, { action: "START_WORK", performedAt: at(44) }]
  assert.equal(getReportCompletedAt({ ...base, executionHistory: execution }), at(50))
  assert.equal(getReportCompletedAt({ ...base, approvalHistory: [{ role: "MANAGER", decision: "approve", decidedAt: at(35) }] }), at(35))
  assert.equal(getReportCompletedAt(base), null)
  assert.deepEqual(mergeReportHistory(normalizeApprovalHistory(base.approvalHistory), normalizeExecutionHistory(execution)).map(e => e.at), [at(34), at(44), at(50)])
})
