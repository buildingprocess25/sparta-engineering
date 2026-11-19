import assert from "node:assert/strict"
import { test } from "node:test"

import {
  reserveChecklistDraft,
  type ChecklistDraftRepository,
  type CreateChecklistDraftInput,
  type ChecklistDraft,
} from "./drive-draft-service"

const reservation = {
  authorId: "ES001",
  areaId: "area-office",
  areaCode: "office",
  roomId: "room-1",
  formCode: "FRM_TSM_003",
  period: "MONTHLY",
  periodKey: "2026-09",
} as const

const roomDraft: ChecklistDraft = {
  ...reservation,
  id: "report-1",
  reportCode: "ENG-OFFICE-202609-001",
  status: "DRAFT",
  updatedAt: new Date("2026-09-03"),
  taskId: null,
  equipmentId: null,
  canRebind: true,
}

class FakeRepository implements ChecklistDraftRepository {
  candidates: ChecklistDraft[] = []
  created: CreateChecklistDraftInput[] = []
  rebound: CreateChecklistDraftInput[] = []

  async findCandidates() {
    return this.candidates
  }

  async generateReportCode() {
    return "ENG-OFFICE-202609-002"
  }

  async createDraft(input: CreateChecklistDraftInput) {
    this.created.push(input)
    return true
  }

  async rebindDraft(_draft: ChecklistDraft, input: CreateChecklistDraftInput) {
    this.rebound.push(input)
    return true
  }
}

test("reuses a matching draft with saved answers", async () => {
  const repository = new FakeRepository()
  repository.candidates = [{ ...roomDraft, canRebind: false }]
  assert.deepEqual(await reserveChecklistDraft(repository, reservation), { reportCode: roomDraft.reportCode })
  assert.deepEqual(repository.created, [])
  assert.deepEqual(repository.rebound, [])
})

test("recovers an empty task draft using the assigned form and period", async () => {
  const repository = new FakeRepository()
  repository.candidates = [{ ...roomDraft, taskId: "task-1", formCode: "FRM_TSM_002", periodKey: "2026-W37" }]
  const input = { ...reservation, taskId: "task-1", period: "WEEKLY" as const, periodKey: "2026-09-W2" }
  assert.deepEqual(await reserveChecklistDraft(repository, input), { reportCode: roomDraft.reportCode })
  assert.deepEqual(repository.rebound, [{ ...input, reportCode: roomDraft.reportCode }])
  assert.deepEqual(repository.created, [])
})

test("does not overwrite a legacy draft if the target is occupied or if the draft has saved data", async () => {
  const repository = new FakeRepository()
  const oldTask = { ...roomDraft, id: "report-old", periodKey: "2026-08", taskId: "task-1" }
  const input = { ...reservation, taskId: "task-1" }
  repository.candidates = [oldTask, roomDraft]
  assert.deepEqual(await reserveChecklistDraft(repository, input), { unavailable: "conflict" })
  repository.candidates = [{ ...oldTask, canRebind: false }]
  assert.deepEqual(await reserveChecklistDraft(repository, input), { unavailable: "legacy" })
  assert.deepEqual(repository.rebound, [])
  assert.deepEqual(repository.created, [])
})

test("keeps an existing room draft private and recognizes a submitted report", async () => {
  const repository = new FakeRepository()
  repository.candidates = [{ ...roomDraft, authorId: "ES002" }]
  assert.deepEqual(await reserveChecklistDraft(repository, reservation), { unavailable: "conflict" })
  repository.candidates = [{ ...roomDraft, status: "PENDING_COORD" }]
  assert.deepEqual(await reserveChecklistDraft(repository, reservation), { unavailable: "submitted", existingReportCode: roomDraft.reportCode })
})
