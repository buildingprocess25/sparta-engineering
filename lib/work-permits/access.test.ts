import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  getApplicantWorkPermitScope,
  getManagerWorkPermitScope,
  getPendingWorkPermitDecisionScope,
  type WorkPermitUser,
} from "./access"

const technician: WorkPermitUser = { NIK: "10001", role: "ES", branchName: "BANDUNG" }
const manager: WorkPermitUser = { NIK: "10002", role: "MANAGER", branchName: "BANDUNG" }

describe("work permit access", () => {
  it("scopes technician status and detail to the signed-in applicant", () => {
    assert.deepEqual(getApplicantWorkPermitScope(technician, technician.NIK), {
      applicantNik: technician.NIK,
    })
    assert.equal(getApplicantWorkPermitScope(technician, "10003"), null)
    assert.equal(getApplicantWorkPermitScope(manager, manager.NIK), null)
    assert.equal(getApplicantWorkPermitScope(null, technician.NIK), null)
  })

  it("scopes the manager queue to the applicant's branch", () => {
    assert.deepEqual(getManagerWorkPermitScope(manager), {
      applicant: { branchName: { equals: "BANDUNG", mode: "insensitive" } },
    })
    assert.equal(getManagerWorkPermitScope({ ...manager, branchName: " " }), null)
    assert.equal(getManagerWorkPermitScope(null), null)
  })

  it("reserves the review queue and decisions for branch managers", () => {
    for (const role of ["ES", "COORD", "REQUESTER", "ADMIN_HO", "SUPER_ADMIN"] as const) {
      const user = { ...manager, role }
      assert.equal(getManagerWorkPermitScope(user), null)
      assert.equal(getPendingWorkPermitDecisionScope(user, "permit-1"), null)
    }
  })

  it("requires ID, applicant branch, and pending status in the decision update", () => {
    assert.deepEqual(getPendingWorkPermitDecisionScope(manager, "permit-1"), {
      id: "permit-1",
      status: "PENDING_MANAGER",
      applicant: { branchName: { equals: "BANDUNG", mode: "insensitive" } },
    })
  })

  it("rejects a missing, blank, or malformed permit ID", () => {
    for (const permitId of [undefined, " ", {}]) {
      assert.equal(getPendingWorkPermitDecisionScope(manager, permitId), null)
    }
  })
})
