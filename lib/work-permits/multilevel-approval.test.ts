import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { hasRequiredApprovals, selectActiveWorkPermit } from "./active-period"

const applicant = { NIK: "ES001", name: "Budi Teknisi", role: "ES", branchName: "BANDUNG" }

const permitBase = {
  id: "WP-001",
  permitCode: "WP-BAN-20261101-1001",
  applicantNik: applicant.NIK,
  workDate: new Date("2026-11-01T00:00:00.000Z"),
  safetyPayload: { targetPeriod: "2026-11" },
  status: "APPROVED" as const,
  approvalHistory: [],
}

describe("multilevel work permit approval policy", () => {
  it("recognizes complete 3-stage approval (Manager -> P2K3 -> Secretary)", () => {
    const permit = {
      ...permitBase,
      approvalHistory: [
        {
          actorNik: "MGR01",
          actorName: "Pak Manager",
          accountRole: "MANAGER",
          approvalRole: "MANAGER",
          stage: "PENDING_MANAGER",
          decision: "APPROVED",
          decidedAt: "2026-11-01T08:00:00Z",
        },
        {
          actorNik: "P2K3_01",
          actorName: "Bu P2K3",
          accountRole: "COORD",
          approvalRole: "P2K3",
          stage: "PENDING_P2K3",
          decision: "APPROVED",
          decidedAt: "2026-11-01T09:00:00Z",
        },
        {
          actorNik: "SEC01",
          actorName: "Pak Sekretaris",
          accountRole: "USER",
          approvalRole: "SECRETARY",
          stage: "PENDING_SECRETARY",
          decision: "APPROVED",
          decidedAt: "2026-11-01T10:00:00Z",
        },
      ],
    }

    assert.equal(hasRequiredApprovals(permit), true)
    assert.equal(selectActiveWorkPermit([permit], "2026-11"), permit)
  })

  it("recognizes delegate substitution for P2K3 stage", () => {
    const permit = {
      ...permitBase,
      approvalHistory: [
        {
          actorNik: "MGR01",
          actorName: "Pak Manager",
          approvalRole: "MANAGER",
          stage: "PENDING_MANAGER",
          decision: "APPROVED",
        },
        {
          actorNik: "DEL01",
          actorName: "Delegasi P2K3",
          approvalRole: "DELEGATE",
          stage: "PENDING_P2K3",
          decision: "APPROVED",
        },
        {
          actorNik: "SEC01",
          actorName: "Pak Sekretaris",
          approvalRole: "SECRETARY",
          stage: "PENDING_SECRETARY",
          decision: "APPROVED",
        },
      ],
    }

    assert.equal(hasRequiredApprovals(permit), true)
  })

  it("rejects incomplete approval (e.g. only Manager approved, missing P2K3 & Secretary)", () => {
    const incompletePermit = {
      ...permitBase,
      approvalHistory: [
        {
          actorNik: "MGR01",
          actorName: "Pak Manager",
          approvalRole: "MANAGER",
          stage: "PENDING_MANAGER",
          decision: "APPROVED",
        },
      ],
    }

    assert.equal(hasRequiredApprovals(incompletePermit), false)
    assert.equal(selectActiveWorkPermit([incompletePermit], "2026-11"), null)
  })

  it("rejects permit if any stage was rejected", () => {
    const rejectedPermit = {
      ...permitBase,
      status: "REJECTED" as const,
      approvalHistory: [
        {
          actorNik: "MGR01",
          actorName: "Pak Manager",
          approvalRole: "MANAGER",
          decision: "APPROVED",
        },
        {
          actorNik: "P2K3_01",
          actorName: "Bu P2K3",
          approvalRole: "P2K3",
          decision: "REJECTED",
          notes: "APD kurang lengkap",
        },
      ],
    }

    assert.equal(hasRequiredApprovals(rejectedPermit), false)
    assert.equal(selectActiveWorkPermit([rejectedPermit], "2026-11"), null)
  })
})
