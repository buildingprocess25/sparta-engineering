import assert from "node:assert/strict"

import {
  reserveChecklistDraft,
  type ChecklistDraftRepository,
} from "./drive-draft-service"

class FakeRepository implements ChecklistDraftRepository {
  existingDraft: {
    reportCode: string
    areaId: string
    periodKey: string
    formCode: string
  } | null = null
  deleted: string[] = []
  created: Array<{
    reportCode: string
    areaId: string
    authorId: string
    formCode: string
    period: "MONTHLY" | "WEEKLY"
    periodKey: string
  }> = []

  async findDraftByUser(authorId: string) {
    return authorId === "ES001" ? this.existingDraft : null
  }

  async generateReportCode(input: { areaCode: string; periodKey: string }) {
    return `ENG-${input.areaCode.toUpperCase()}-202609-001`
  }

  async createDraft(input: {
    reportCode: string
    areaId: string
    authorId: string
    formCode: string
    period: "MONTHLY" | "WEEKLY"
    periodKey: string
  }) {
    this.created.push(input)
  }

  async deleteDraft(reportCode: string) {
    this.deleted.push(reportCode)
  }
}

const reuseRepo = new FakeRepository()
reuseRepo.existingDraft = {
  reportCode: "ENG-OFFICE-202609-001",
  areaId: "area-office",
  periodKey: "2026-09",
  formCode: "FRM_TSM_003",
}

assert.deepEqual(
  await reserveChecklistDraft(reuseRepo, {
    authorId: "ES001",
    areaId: "area-office",
    areaCode: "office",
    formCode: "FRM_TSM_003",
    period: "MONTHLY",
    periodKey: "2026-09",
  }),
  { reportCode: "ENG-OFFICE-202609-001" }
)
assert.equal(reuseRepo.created.length, 0)

const replaceRepo = new FakeRepository()
replaceRepo.existingDraft = {
  reportCode: "ENG-WH-202609-001",
  areaId: "area-wh",
  periodKey: "2026-09",
  formCode: "FRM_TSM_003",
}

assert.deepEqual(
  await reserveChecklistDraft(replaceRepo, {
    authorId: "ES001",
    areaId: "area-office",
    areaCode: "office",
    formCode: "FRM_TSM_003",
    period: "MONTHLY",
    periodKey: "2026-09",
  }),
  { reportCode: "ENG-OFFICE-202609-001" }
)
assert.deepEqual(replaceRepo.deleted, ["ENG-WH-202609-001"])
assert.equal(replaceRepo.created[0]?.reportCode, "ENG-OFFICE-202609-001")
