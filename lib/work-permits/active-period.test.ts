import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getActiveWorkPermitWhere, selectActiveWorkPermit } from "./active-period"

const legacyPermit = {
  id: "legacy",
  status: "APPROVED" as const,
  workDate: new Date("2026-12-01T00:00:00.000Z"),
  safetyPayload: {},
}

describe("active work permit period", () => {
  it("scopes the candidate query to the technician and approved month, including December rollover", () => {
    assert.deepEqual(getActiveWorkPermitWhere("ES001", "2026-12"), {
      applicantNik: "ES001",
      status: "APPROVED",
      OR: [
        { safetyPayload: { path: ["targetPeriod"], equals: "2026-12" } },
        {
          workDate: {
            gte: new Date("2026-12-01T00:00:00.000Z"),
            lt: new Date("2027-01-01T00:00:00.000Z"),
          },
        },
      ],
    })
  })

  it("honors the explicit target period when the saved work date falls in a different month", () => {
    const january = { ...legacyPermit, safetyPayload: { targetPeriod: "2027-01" } }

    assert.equal(selectActiveWorkPermit([january], "2026-12"), null)
    assert.equal(selectActiveWorkPermit([january], "2027-01"), january)
  })

  it("accepts a legacy approval dated in the month and skips pending and expired permits", () => {
    const pending = { ...legacyPermit, status: "PENDING_MANAGER" as const }
    const expired = { ...legacyPermit, workDate: new Date("2026-11-01T00:00:00.000Z") }

    assert.equal(selectActiveWorkPermit([pending, expired], "2026-12"), null)
    assert.equal(selectActiveWorkPermit([pending, expired, legacyPermit], "2026-12"), legacyPermit)
  })
})
