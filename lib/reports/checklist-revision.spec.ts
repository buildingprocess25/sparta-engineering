import assert from "node:assert/strict"
import test from "node:test"
import { readWeeklyChecklistNotes, restoreChecklistItems } from "../checklists/edit-state"
import { validateChecklistPayload, type ChecklistPayloadItem } from "../checklists/payload"
import { validateFrmTsm001Payload, type FrmTsm001Payload } from "../checklists/payload-001"
import { validateFrmTsm004Payload, type FrmTsm004Payload } from "../checklists/payload-004"
import { asPayloadRecord, completeChecklistFollowUp, FORM_014, FORM_065, getReportItems, needsChecklistFollowUp, retainChecklistFollowUp } from "./checklist-follow-up"
import { describeRevisionChanges, getChecklistRevisionUrl } from "./checklist-revision-history"
import type { PrismaClient, ReportStatus } from "../../generated/prisma"
import { executeReportSparePartWork, saveChecklistReview } from "./checklist-review"
import { saveChecklistFollowUp, saveChecklistSubmission } from "./checklist-submission"

const periodKey = "2026-11"
const now = new Date("2026-11-16T08:00:00Z")
const areaCode = "wh"
const base = { formName: "Checklist", areaCode, period: "MONTHLY" as const, periodKey }
const photo = { fileId: "existing-photo", url: "/existing-photo.jpg" }
const item: ChecklistPayloadItem = {
  id: "fan", label: "Bearing", condition: "RUSAK", photos: [photo], notes: "Berisik", handler: "BES", repairForm: FORM_065,
}
const parts = [{ id: "part-1", namaPart: "Bearing", nomorPart: "6204", asalPart: "STOCK", jumlahPart: 2 }] as const
const details065 = {
  jenis: "PENGGANTIAN_SPARE_PART", namaUnit: "Exhaust Fan Demo Unit 1", merk: "ABC", nomorUnit: "1",
  nomorTiketProblem: "TK-1", analisa: "Bearing aus", tindakan: "Ganti bearing", parts: [...parts],
}

test("Exhaust Fan 063 keeps its photo and 065 details through a note-only revision", () => {
  const previous = { ...base, formCode: "FRM_TS_063", items: [{ ...item, followUp065: details065 }], followUpCompleted: true }
  const restored = restoreChecklistItems<never>(previous, {})
  assert.deepEqual(restored.fan.photos, [photo])
  assert.equal(restored.fan.notes, "Berisik")

  const next = { ...base, formCode: "FRM_TS_063", items: [{ ...item, notes: "Berisik saat start" }], followUpCompleted: true }
  assert.equal(validateChecklistPayload(next).valid, true)
  const staged = retainChecklistFollowUp(previous, next)
  assert.equal(needsChecklistFollowUp(staged), true)
  assert.deepEqual(getReportItems(staged)[0].followUp065, details065)
  const result = completeChecklistFollowUp(staged, getReportItems(staged), now)
  assert.ok(result)
  assert.equal(needsChecklistFollowUp(result), false)
  assert.deepEqual(result.items[0].photos, [photo])
  assert.deepEqual(result.items[0].followUp065, details065)
  assert.deepEqual(result.followUp065Summary, { itemCount: 1 })
  assert.deepEqual(describeRevisionChanges(previous, result), [{ field: "Item checklist / Bearing / Catatan", before: "Berisik", after: "Berisik saat start" }])
  assert.equal(getChecklistRevisionUrl("ENG-WH-202611-003", "FRM_TS_063"), "/dashboard/reports/new/checklist/frm-ts-063?revision=ENG-WH-202611-003")
})

test("room 014 keeps the matching unit and recalculates subtotal and summary on the server", () => {
  const unitA = { ...item, id: "lamp", label: "Lampu", unitNo: "A", repairForm: FORM_014 }
  const unitB = { ...unitA, unitNo: "B" }
  const material = { id: "mat-1", namaBarang: "Lampu LED", satuan: "Pcs", jumlah: 2, hargaUnit: 125000, total: 250000 }
  const previous = { ...base, formCode: "FRM_TSM_003", items: [
    { ...unitA, followUp014: { materials: [{ ...material, jumlah: 1, total: 125000 }] } },
    { ...unitB, followUp014: { materials: [material] } },
  ] }
  const staged = retainChecklistFollowUp(previous, { ...previous, items: [unitB, { ...unitA, repairForm: undefined }] })
  const [savedUnit, withoutFollowUp] = getReportItems(staged)
  assert.equal(savedUnit.followUp014?.materials[0].jumlah, 2)
  assert.equal(withoutFollowUp.followUp014, undefined)

  const result = completeChecklistFollowUp(staged, [
    { ...savedUnit, photos: [], notes: "edited outside checklist", followUp014: { materials: [{ ...material, jumlah: 3, total: 1 }] } },
    withoutFollowUp,
  ], now)
  assert.ok(result)
  assert.deepEqual(result.items[0].followUp014?.materials[0], { ...material, jumlah: 3, total: 375000 })
  assert.deepEqual(result.followUp014Summary, { totalCost: 375000 })
  assert.deepEqual(result.items[0].photos, [photo])
  assert.equal(result.items[0].notes, unitB.notes)
  assert.equal(completeChecklistFollowUp(staged, [{ ...savedUnit, unitNo: "C" }, withoutFollowUp], now), null)
})

test("non-routine report with follow-up removed is ready for COORD and has no stale summary", () => {
  const previous = {
    ...base, formCode: "FRM_TSM_003_REPAIR", items: [{ ...item, followUp065: details065 }],
    followUpCompleted: true, followUp065Summary: { itemCount: 1 },
  }
  const updated = retainChecklistFollowUp(previous, { ...previous, items: [{ ...item, repairForm: undefined }] })
  assert.equal(needsChecklistFollowUp(updated), false)
  assert.equal(updated.followUp065Summary, undefined)
  assert.equal(getReportItems(updated)[0].followUp065, undefined)
  assert.match(getChecklistRevisionUrl("ENG-TEST-01", previous.formCode) ?? "", /\/repair\/frm-tsm-003/)
})

test("TSM 001 keeps its nested ATS snapshot and routes selected follow-up", () => {
  const phase = { rs: "380", st: "381", tr: "380" }
  const payload: FrmTsm001Payload = {
    ...base, formCode: "FRM_TSM_001_REPAIR", branch: "HO", merk: "ABC", kva: "100", bulan: periodKey,
    runningLog: {
      operationalType: "Test ATS", timeStart: "08:00", timeOff: "08:30", hourMeterStart: "1000", hourMeterOff: "1001",
      chargerAlternatorVolt: "24", frequencyHz: "50", oilPressureKpa: "200", voltage3Phase: phase,
      voltageSinglePhase: { rn: "220", sn: "221", tn: "220" }, loadAmpere: { r: "10", s: "11", t: "10" }, fuelConsumptionLiter: "4",
    },
    atsTest: {
      systemAtsStatus: "NOK", testDate: "2026-11-16", voltageBatteryCharge: "24", voltageBatteryLoadStart: "22",
      transferDurationMinutes: "1", photos: [photo], handler: "BES", repairForm: FORM_065, notes: "Transfer lambat",
    },
    catatanKeterangan: "Periksa ATS",
  }
  assert.equal(validateFrmTsm001Payload(payload).valid, true)
  const staged = retainChecklistFollowUp(null, payload)
  assert.equal(getReportItems(staged)[0].id, "system_ats_test")
  assert.equal(needsChecklistFollowUp(staged), true)
  const result = completeChecklistFollowUp(staged, [{ ...getReportItems(staged)[0], followUp065: details065 }], now)
  assert.ok(result)
  assert.deepEqual(asPayloadRecord(result).atsTest, payload.atsTest)
  assert.deepEqual(asPayloadRecord(result).runningLog, payload.runningLog)
  const edited = { ...payload, atsTest: { ...payload.atsTest, systemAtsStatus: "OK" as const, repairForm: undefined } }
  assert.equal(needsChecklistFollowUp(retainChecklistFollowUp(result, edited)), false)
  assert.equal(getReportItems(retainChecklistFollowUp(result, edited))[0].followUp065, undefined)
})

test("TSM 004 keeps edited measurements and has no follow-up", () => {
  const payload: FrmTsm004Payload = {
    ...base, formCode: "FRM_TSM_004", keterangan: "Normal",
    panels: [{ id: "panel", label: "Panel Utama", measurements: { rn: "220", sn: "", tn: "", rs: "", st: "", tr: "" } }],
  }
  const edited = { ...payload, panels: [{ ...payload.panels[0], measurements: { ...payload.panels[0].measurements, rn: "222" } }] }
  assert.equal(validateFrmTsm004Payload(edited).valid, true)
  const result = retainChecklistFollowUp(payload, edited)
  assert.equal(needsChecklistFollowUp(result), false)
  assert.deepEqual(describeRevisionChanges(payload, result), [{ field: "Panel / Panel Utama / Pengukuran / R–N", before: "220", after: "222" }])
})

test("weekly checklist notes round-trip without adding the inspection header again", () => {
  assert.deepEqual(readWeeklyChecklistNotes("[Minggu Ke-2 | Tgl: 2026-11-10 | H1: 500] Catatan\nbaris 2"), {
    date: "2026-11-10", notes: "Catatan\nbaris 2",
  })
})

test("revision with 065 returns the same routine report to COORD and then Manager", async () => {
  const reportCode = "ENG-WH-202611-003"
  const initial = { ...base, formCode: "FRM_TS_063", items: [{ ...item, followUp065: details065 }], followUpCompleted: true }
  const report = {
    id: "report", reportCode, taskId: "cmwiybcfe0004vwuvb87hw4zs", authorId: "ES-OWNER",
    status: "PENDING_COORD" as ReportStatus, formCode: initial.formCode, period: initial.period,
    periodKey, updatedAt: now, checklistPayload: initial, area: { code: areaCode }, author: { branchName: "HO" },
  }
  let revision: Record<string, unknown> | undefined
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { NIK: string } }) => ({
        NIK: where.NIK,
        role: where.NIK === "manager" ? "MANAGER" : where.NIK === "requester" ? "REQUESTER" : where.NIK === "ES-OWNER" ? "ES" : "COORD",
        name: where.NIK, branchName: where.NIK === "other-branch" ? "OTHER" : "HO",
      }),
    },
    checklistReport: {
      findUnique: async ({ where }: { where: { id?: string; reportCode?: string; status?: string; authorId?: string } }) => {
        if (where.id && where.id !== report.id) return null
        if (where.reportCode && where.reportCode !== report.reportCode) return null
        if (where.status && where.status !== report.status) return null
        if (where.authorId && where.authorId !== report.authorId) return null
        return { ...report }
      },
      updateMany: async ({ where, data }: { where: { id: string; status: string; updatedAt: Date }; data: Partial<typeof report> }) => {
        assert.equal(where.id, report.id)
        if (where.status !== report.status || where.updatedAt.getTime() !== report.updatedAt.getTime()) return { count: 0 }
        Object.assign(report, data)
        return { count: 1 }
      },
    },
    checklistReportRevision: {
      create: async ({ data }: { data: Record<string, unknown> }) => { revision = { id: "revision", ...data } },
      findFirstOrThrow: async () => {
        assert.ok(revision && !revision.resubmittedAt)
        return revision
      },
      update: async ({ data }: { data: Record<string, unknown> }) => { Object.assign(revision!, data) },
    },
    workPermit: {
      findMany: async () => [
        {
          id: "permit-1",
          status: "APPROVED",
          safetyPayload: { targetPeriod: periodKey },
          workDate: now,
          managerNik: "mgr-01",
          managerSignedAt: now,
          approvalHistory: [
            { approvalRole: "MANAGER", decision: "APPROVED" },
            { approvalRole: "P2K3", decision: "APPROVED" },
            { approvalRole: "SECRETARY", decision: "APPROVED" },
          ],
        },
      ],
    },
  }
  const prisma = { $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as unknown as PrismaClient
  const review = (reviewerId: string, decision: "approve" | "reject_revision", version = report.updatedAt.toISOString()) =>
    saveChecklistReview(prisma, { reportId: report.id, version, reviewerId, decision, notes: "Perjelas catatan" })

  assert.ok((await review("other-branch", "reject_revision")).error)
  assert.equal((await review("coord", "reject_revision")).nextStatus, "NEEDS_REVISION")
  assert.equal(report.status, "NEEDS_REVISION")
  assert.equal(revision?.reason, "Perjelas catatan")
  assert.equal(revision?.reviewStage, "PENDING_COORD")
  assert.equal(revision?.reviewerId, "coord")
  assert.ok(revision?.requestedAt instanceof Date)

  const revisionVersion = report.updatedAt.toISOString()
  const input = {
    reportCode, authorId: report.authorId, permitId: "permit", isSafe: false,
    photoFileIds: [photo.fileId], revisionVersion,
    payload: { ...base, formCode: initial.formCode, items: [{ ...item, notes: "Berisik saat start" }] },
  }
  assert.equal(await saveChecklistSubmission(prisma, { ...input, authorId: "ES-OTHER" }), null)
  assert.equal(await saveChecklistSubmission(prisma, { ...input, revisionVersion: undefined }), null)
  assert.deepEqual(await saveChecklistSubmission(prisma, input), { pendingFollowUp: true })
  assert.equal(report.status, "NEEDS_REVISION")
  assert.equal(await saveChecklistSubmission(prisma, input), null)
  assert.equal(await saveChecklistFollowUp(prisma, {
    ...input, version: report.updatedAt.toISOString(), items: getReportItems(report.checklistPayload),
  }), "SAVED")

  assert.equal(report.reportCode, reportCode)
  assert.equal(report.taskId, "cmwiybcfe0004vwuvb87hw4zs")
  assert.equal(report.status, "PENDING_COORD")
  assert.ok(revision?.resubmittedAt instanceof Date)
  assert.deepEqual(getReportItems(revision?.resubmittedPayload)[0].followUp065, details065)
  assert.ok((await review("coord", "approve", revisionVersion)).error)
  assert.equal((await review("coord", "approve")).nextStatus, "PENDING_MANAGER")

  // Form 065 PENGGANTIAN_SPARE_PART: ACC Manager forwards to PENDING_REQUESTER (not completed)
  assert.equal((await review("manager", "approve")).nextStatus, "PENDING_REQUESTER")
  assert.equal(report.status, "PENDING_REQUESTER")

  // Requester (WHM/DWHM) reviews Form 065 proposal: stock parts result in WAITING_PARTS
  assert.equal((await review("requester", "approve")).nextStatus, "WAITING_PARTS")
  assert.equal(report.status, "WAITING_PARTS")

  // BES execution: Start work (verified active permit) -> IN_PROGRESS
  const exec = (actorId: string, action: "PROCESS_PB" | "START_WORK" | "FINISH_WORK", version = report.updatedAt.toISOString()) =>
    executeReportSparePartWork(prisma, { reportId: report.id, version, actorId, action, notes: "Catatan eksekusi" })

  assert.equal((await exec("ES-OWNER", "START_WORK")).nextStatus, "IN_PROGRESS")
  assert.equal(report.status, "IN_PROGRESS")

  // BES execution: Finish work -> COMPLETED (Selesai)
  assert.equal((await exec("ES-OWNER", "FINISH_WORK")).nextStatus, "COMPLETED")
  assert.equal(report.status, "COMPLETED")
})

test("report with 065 PERBAIKAN completes directly on Manager approval", async () => {
  const detailsPerbaikan = { ...details065, jenis: "PERBAIKAN" as const, parts: [] }
  const payload = { ...base, formCode: "FRM_TS_063", items: [{ ...item, followUp065: detailsPerbaikan }], followUpCompleted: true }
  const r = {
    id: "rep-perbaikan", reportCode: "ENG-REP-01", authorId: "ES-OWNER",
    status: "PENDING_MANAGER" as ReportStatus, formCode: payload.formCode, period: payload.period,
    periodKey, updatedAt: now, checklistPayload: payload, area: { code: areaCode }, author: { branchName: "HO" },
  }
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { NIK: string } }) => ({
        role: "MANAGER", name: where.NIK, branchName: "HO",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...r }),
      updateMany: async ({ data }: { data: Partial<typeof r> }) => {
        Object.assign(r, data)
        return { count: 1 }
      },
    },
  }
  const prisma = { $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as unknown as PrismaClient
  const res = await saveChecklistReview(prisma, {
    reportId: r.id, version: r.updatedAt.toISOString(), reviewerId: "manager", decision: "approve", notes: "ACC",
  })
  assert.equal(res.nextStatus, "COMPLETED")
  assert.equal(r.status, "COMPLETED")
})

test("report with 065 PB moves to WAITING_PB on Requester approval and advances to WAITING_PARTS when PB processed", async () => {
  const detailsPb = { ...details065, parts: [{ id: "p1", namaPart: "Belt", nomorPart: "B-12", asalPart: "PB" as const, jumlahPart: 1 }] }
  const payload = { ...base, formCode: "FRM_TS_063", items: [{ ...item, followUp065: detailsPb }], followUpCompleted: true }
  const r = {
    id: "rep-pb", reportCode: "ENG-REP-PB", authorId: "ES-OWNER",
    status: "PENDING_REQUESTER" as ReportStatus, formCode: payload.formCode, period: payload.period,
    periodKey, updatedAt: now, checklistPayload: payload, area: { code: areaCode }, author: { branchName: "HO" },
  }
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { NIK: string } }) => ({
        NIK: where.NIK,
        role: where.NIK === "requester" ? "REQUESTER" : "ES",
        name: where.NIK, branchName: "HO",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...r }),
      updateMany: async ({ data }: { data: Partial<typeof r> }) => {
        Object.assign(r, data)
        return { count: 1 }
      },
    },
    workPermit: { findMany: async () => [] },
  }
  const prisma = { $transaction: (work: (client: typeof tx) => unknown) => work(tx) } as unknown as PrismaClient
  const res = await saveChecklistReview(prisma, {
    reportId: r.id, version: r.updatedAt.toISOString(), reviewerId: "requester", decision: "approve", notes: "ACC PB",
  })
  assert.equal(res.nextStatus, "WAITING_PB")
  assert.equal(r.status, "WAITING_PB")

  const pbRes = await executeReportSparePartWork(prisma, {
    reportId: r.id, version: r.updatedAt.toISOString(), actorId: "ES-OWNER", action: "PROCESS_PB", notes: "PB diajukan",
  })
  assert.equal(pbRes.nextStatus, "WAITING_PARTS")
  assert.equal(r.status, "WAITING_PARTS")
})
