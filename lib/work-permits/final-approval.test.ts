import assert from "node:assert/strict"
import { test } from "node:test"

import { getFinalWorkPermitApproval } from "./final-approval"

const history = [
  {
    stage: "PENDING_MANAGER",
    actorName: "BNM Manager",
    decision: "APPROVED",
    decidedAt: "2026-11-18T03:00:00Z",
  },
  {
    approvalRole: "DELEGATE",
    actorName: "P2K3 Delegate",
    decision: "APPROVED",
    decidedAt: "2026-11-18T04:00:00Z",
  },
  {
    stage: "PENDING_SECRETARY",
    actorName: "Sekretaris P2K3",
    decision: "APPROVED",
    decidedAt: "2026-11-18T05:00:00Z",
  },
]

test("publishes approval using the final decision timestamp for a fully audited permit", () => {
  const final = getFinalWorkPermitApproval({
    status: "APPROVED",
    approvalHistory: history,
  })
  assert.equal(final?.decidedAt, "2026-11-18T05:00:00.000Z")
  assert.deepEqual(
    final?.approvals.map(({ name }) => name),
    ["BNM Manager", "P2K3 Delegate", "Sekretaris P2K3"]
  )
  assert.deepEqual(
    getFinalWorkPermitApproval({
      status: "COMPLETED",
      approvalHistory: history,
    }),
    final
  )
})

test("does not publish permits awaiting a decision or with incomplete or rejected evidence", () => {
  assert.equal(
    getFinalWorkPermitApproval({
      status: "PENDING_SECRETARY",
      approvalHistory: history.slice(0, 2),
    }),
    null
  )
  assert.equal(
    getFinalWorkPermitApproval({ status: "APPROVED", approvalHistory: [] }),
    null
  )
  assert.equal(
    getFinalWorkPermitApproval({
      status: "APPROVED",
      approvalHistory: [...history, { ...history[2], decision: "REJECTED" }],
    }),
    null
  )
  assert.equal(
    getFinalWorkPermitApproval({
      status: "APPROVED",
      approvalHistory: [
        null,
        ...history.slice(0, 2),
        { ...history[2], decidedAt: "invalid" },
      ],
    }),
    null
  )
})
