import assert from "node:assert/strict"
import test from "node:test"
import type { PrismaClient, ReportStatus } from "../../generated/prisma"
import { createPhotoGetHandler } from "../../app/api/photos/[fileId]/handler"
import { validateChecklistCompleteness } from "../checklists/completeness"
import type { ChecklistPayload } from "../checklists/payload"
import { getChecklistConfig } from "../checklists/registry"
import {
  FORM_014,
  FORM_065,
  FORM_065_LABEL,
  hasCostEstimateFollowUp,
  hasForm065FollowUp,
  hasRepairWithoutCost,
  needsChecklistFollowUp,
  REPAIR_TANPA_BIAYA,
  requiresRequesterReview,
} from "./checklist-follow-up"
import { executeReportSparePartWork, saveChecklistReview } from "./checklist-review"
import { saveChecklistSubmission } from "./checklist-submission"
import { validateCompletionEvidence } from "./completion-evidence"
import { buildInitialForm065State } from "./follow-up-prefill"
import { generateReportPdfBuffer, isReportFinal } from "./pdf-generator"
import { canUserAccessReport } from "./report-access"
import {
  formatChecklistPeriodLabel,
  getReportCompletenessSummary,
  normalizeApprovalHistory,
  normalizeExecutionHistory,
} from "./report-display"
import { buildReportPdfData } from "./report-pdf-mapper"

const periodKey = "2026-11"
const baseDate = new Date("2026-11-18T03:00:00.000Z")

function makeActivePermitList(authorNik: string) {
  return [
    {
      id: `permit-${authorNik}`,
      status: "APPROVED",
      safetyPayload: { targetPeriod: periodKey },
      workDate: baseDate,
      managerNik: "M001",
      managerSignedAt: baseDate,
      approvalHistory: [
        { approvalRole: "MANAGER", decision: "APPROVED" },
        { approvalRole: "P2K3", decision: "APPROVED" },
        { approvalRole: "SECRETARY", decision: "APPROVED" },
      ],
    },
  ]
}

test("REPAIR_TANPA_BIAYA is explicit, skips Form 014/065 and Requester, and completes on Manager ACC", async () => {
  const payload = {
    formCode: "FRM_TS_041",
    formName: "Checklist Conveyor",
    areaCode: "wh",
    period: "MONTHLY",
    periodKey,
    items: [
      {
        id: "roller",
        label: "Roller Conveyor",
        condition: "REPAIR",
        notes: "Kencangkan baut penahan",
        photos: [{ fileId: "p-no-cost", url: "/api/photos/p-no-cost" }],
        handler: "BES",
        repairForm: REPAIR_TANPA_BIAYA,
        repairFormName: "Repair Tanpa Biaya",
      },
    ],
  }

  assert.equal(hasRepairWithoutCost(payload), true)
  assert.equal(hasCostEstimateFollowUp(payload), false)
  assert.equal(hasForm065FollowUp(payload), false)
  assert.equal(needsChecklistFollowUp(payload), false)
  assert.equal(requiresRequesterReview(payload), false)

  const report = {
    id: "rep-nocost",
    reportCode: "ENG-WH-202611-901",
    authorId: "ES001",
    status: "PENDING_COORD" as ReportStatus,
    updatedAt: baseDate,
    checklistPayload: payload,
    approvalHistory: [] as unknown[],
    author: { branchName: "HO" },
  }

  const tx = {
    user: {
      findUnique: async ({ where }: { where: { NIK: string } }) => ({
        NIK: where.NIK,
        name: where.NIK === "C001" ? "Coord HO" : "Manager HO",
        role: where.NIK === "C001" ? "COORD" : "MANAGER",
        branchName: "HO",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...report }),
      updateMany: async ({ data }: { data: Partial<typeof report> }) => {
        Object.assign(report, data)
        return { count: 1 }
      },
    },
  }
  const prisma = {
    $transaction: (work: (c: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient

  const r1 = await saveChecklistReview(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    reviewerId: "C001",
    decision: "approve",
    notes: "ACC Coord",
  })
  assert.equal(r1.nextStatus, "PENDING_MANAGER")

  const r2 = await saveChecklistReview(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    reviewerId: "M001",
    decision: "approve",
    notes: "ACC Manager",
  })
  assert.equal(r2.nextStatus, "COMPLETED")
  assert.equal(report.status, "COMPLETED")
})

test("Form 065 uses updated title and prefills unit identity from Equipment master data", () => {
  assert.equal(
    FORM_065_LABEL,
    "Form Perbaikan / Penggantian Spare Part Equipment (065)",
  )

  const state = buildInitialForm065State({
    itemLabel: "Drive Motor",
    itemNotes: "Getaran tinggi",
    equipment: {
      name: "Pallet Mover Crown WP3000",
      unitNo: 4,
      code: "PM-04",
    },
  })

  assert.equal(state.namaUnit, "Pallet Mover Crown WP3000")
  assert.equal(state.nomorUnit, "4")
  assert.equal(state.analisa, "Getaran tinggi")
  assert.equal(state.jenis, "PENGGANTIAN_SPARE_PART")
})

test("Form 014 workflow enforces PROCESS_PJU before START_WORK, records server timestamps, and validates completion evidence", async () => {
  const payload014 = {
    formCode: "FRM_TSM_003",
    formName: "ME Office",
    areaCode: "office",
    period: "MONTHLY",
    periodKey,
    followUpCompleted: true,
    items: [
      {
        id: "ac",
        label: "AC Ruang Server",
        condition: "RUSAK",
        notes: "Kompresor mati",
        photos: [{ fileId: "chk-1", url: "/api/photos/chk-1" }],
        handler: "BES",
        repairForm: FORM_014,
        followUp014: {
          materials: [
            {
              id: "m1",
              namaBarang: "Kapasitor AC",
              jumlah: 1,
              satuan: "Unit",
              hargaUnit: 300000,
              total: 300000,
            },
          ],
          totalCost: 300000,
        },
      },
    ],
  }

  const report = {
    id: "rep-014-exec",
    reportCode: "ENG-OFF-202611-014",
    authorId: "ES001",
    status: "WAITING_PJU" as ReportStatus,
    updatedAt: baseDate,
    checklistPayload: payload014,
    drivePhotoFileIds: ["chk-1", "work-1", "rcp-1", "trf-1"],
    executionHistory: [] as unknown[],
    author: { NIK: "ES001", branchName: "HO" },
  }

  const tx = {
    user: {
      findUnique: async () => ({
        NIK: "ES001",
        name: "Budi Teknisi",
        role: "ES",
        branchName: "HO",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...report }),
      updateMany: async ({ data }: { data: Partial<typeof report> }) => {
        Object.assign(report, data)
        return { count: 1 }
      },
    },
    workPermit: {
      findMany: async () => makeActivePermitList("ES001"),
    },
  }
  const prisma = {
    $transaction: (work: (c: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient

  // START_WORK before PROCESS_PJU is blocked
  const startEarly = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "START_WORK",
  })
  assert.ok(startEarly.error)

  // Record PJU Online -> stays WAITING_PJU with timestamp & actor
  const pjuRes = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "PROCESS_PJU",
    referenceNo: "PJU-2026-0088",
    notes: "Input PJU online selesai",
  })
  assert.equal(pjuRes.nextStatus, "WAITING_PJU")
  assert.equal(report.executionHistory.length, 1)

  // START_WORK after PROCESS_PJU succeeds without pre-work evidence upload
  const startRes = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "START_WORK",
  })
  assert.equal(startRes.nextStatus, "IN_PROGRESS")

  // FINISH_WORK rejected if refundTransferPhotos missing or actualPurchaseAmount negative
  const badEvidence = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "FINISH_WORK",
    completionEvidence: {
      form014: {
        workPhotos: [{ fileId: "work-1", url: "/api/photos/work-1" }],
        receiptPhotos: [{ fileId: "rcp-1", url: "/api/photos/rcp-1" }],
        refundTransferPhotos: [],
        actualPurchaseAmount: 275000,
      },
    },
  })
  assert.ok(badEvidence.error)
  assert.equal(report.status, "IN_PROGRESS")

  // FINISH_WORK rejected when using foreign photo ID not owned by report
  const foreignPhoto = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "FINISH_WORK",
    completionEvidence: {
      form014: {
        workPhotos: [{ fileId: "foreign-id", url: "/api/photos/foreign-id" }],
        receiptPhotos: [{ fileId: "rcp-1", url: "/api/photos/rcp-1" }],
        refundTransferPhotos: [{ fileId: "trf-1", url: "/api/photos/trf-1" }],
        actualPurchaseAmount: 275000,
      },
    },
  })
  assert.match(foreignPhoto.error || "", /bukan milik laporan/)

  // Valid Form 014 evidence completes report
  const finishRes = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "FINISH_WORK",
    notes: "AC normal",
    completionEvidence: {
      form014: {
        workPhotos: [{ fileId: "work-1", url: "/api/photos/work-1" }],
        receiptPhotos: [{ fileId: "rcp-1", url: "/api/photos/rcp-1" }],
        refundTransferPhotos: [{ fileId: "trf-1", url: "/api/photos/trf-1" }],
        actualPurchaseAmount: 275000,
      },
    },
  })
  assert.equal(finishRes.nextStatus, "COMPLETED")
  assert.equal(report.status, "COMPLETED")

  // COMPLETED report is immutable
  const mutateCompleted = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "PROCESS_PJU",
  })
  assert.match(mutateCompleted.error || "", /Selesai tidak dapat diubah/)

  const execEntries = normalizeExecutionHistory(report.executionHistory)
  assert.equal(execEntries.length, 3)
  assert.equal(execEntries[0]?.referenceNo, "PJU-2026-0088")
  assert.ok(execEntries.every((e) => Boolean(e.performedAt) && e.actorNik === "ES001"))
})

test("PICKUP_STOCK records timestamp before START_WORK on Form 065", async () => {
  const report = {
    id: "rep-065-stock",
    reportCode: "ENG-WH-202611-065",
    authorId: "ES001",
    status: "WAITING_PARTS" as ReportStatus,
    updatedAt: baseDate,
    checklistPayload: {
      formCode: "FRM_TS_063",
      items: [
        {
          id: "fan",
          label: "Fan",
          condition: "RUSAK",
          repairForm: FORM_065,
          followUp065: { jenis: "PENGGANTIAN_SPARE_PART", parts: [] },
        },
      ],
    },
    drivePhotoFileIds: [],
    executionHistory: [] as unknown[],
    author: { NIK: "ES001", branchName: "HO" },
  }

  const tx = {
    user: {
      findUnique: async () => ({
        NIK: "ES001",
        name: "Budi Teknisi",
        role: "ES",
        branchName: "HO",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...report }),
      updateMany: async ({ data }: { data: Partial<typeof report> }) => {
        Object.assign(report, data)
        return { count: 1 }
      },
    },
    workPermit: { findMany: async () => makeActivePermitList("ES001") },
  }
  const prisma = {
    $transaction: (work: (c: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient

  const pickup = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "PICKUP_STOCK",
    referenceNo: "GI-2026-11",
    notes: "Ambil bearing di gudang",
  })
  assert.equal(pickup.nextStatus, "WAITING_PARTS")
  assert.equal(
    normalizeExecutionHistory(report.executionHistory)[0]?.action,
    "PICKUP_STOCK",
  )

  const started = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "START_WORK",
  })
  assert.equal(started.nextStatus, "IN_PROGRESS")
})

test("validateChecklistCompleteness enforces full routine items, Hydrant/PLTS period items, and _REPAIR minimum", () => {
  const fanConfig = getChecklistConfig("FRM_TS_063")!
  const completeFan: ChecklistPayload = {
    formCode: "FRM_TS_063",
    formName: fanConfig.formName,
    areaCode: "wh",
    period: "MONTHLY",
    periodKey,
    items: fanConfig.items.map((item) => ({
      id: item.id,
      label: item.label,
      condition: "BAIK",
      photos: [],
    })),
  }
  assert.equal(validateChecklistCompleteness(completeFan).valid, true)

  const partialRoutine: ChecklistPayload = {
    ...completeFan,
    items: completeFan.items.slice(0, 1),
  }
  assert.equal(validateChecklistCompleteness(partialRoutine).valid, false)

  const repairValid: ChecklistPayload = {
    ...partialRoutine,
    formCode: "FRM_TS_063_REPAIR",
  }
  assert.equal(validateChecklistCompleteness(repairValid).valid, true)

  const repairEmpty: ChecklistPayload = {
    ...partialRoutine,
    formCode: "FRM_TS_063_REPAIR",
    items: [],
  }
  assert.equal(validateChecklistCompleteness(repairEmpty).valid, false)

  const hydrantMissingMode: ChecklistPayload = {
    formCode: "FRM_TSM_006",
    formName: "Hydrant",
    areaCode: "wh",
    period: "WEEKLY",
    periodKey: "2026-W46",
    items: [],
  }
  assert.equal(validateChecklistCompleteness(hydrantMissingMode).valid, false)
})

test("saveChecklistSubmission rejects photo fileIds not owned by the report", async () => {
  const report = {
    id: "rep-own",
    taskId: null,
    formCode: "FRM_TS_063",
    period: "MONTHLY",
    periodKey,
    updatedAt: baseDate,
    checklistPayload: {},
    drivePhotoFileIds: ["owned-photo-1"],
    area: { code: "wh" },
  }
  const tx = {
    checklistReport: {
      findUnique: async () => report,
      updateMany: async () => ({ count: 1 }),
    },
  }
  const prisma = {
    $transaction: (work: (c: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient

  const rejected = await saveChecklistSubmission(prisma, {
    reportCode: "ENG-OWN-01",
    authorId: "ES001",
    permitId: "permit-1",
    isSafe: false,
    photoFileIds: ["stolen-photo-id"],
    payload: {
      formCode: "FRM_TS_063",
      areaCode: "wh",
      period: "MONTHLY",
      periodKey,
    },
  })
  assert.equal(rejected, null)
})

test("photo GET handler and canUserAccessReport enforce auth and branch isolation", async () => {
  assert.equal(
    canUserAccessReport(
      { NIK: "ES001", role: "ES", branchName: "HO" },
      { authorId: "ES001", author: { branchName: "HO" } },
    ),
    true,
  )
  assert.equal(
    canUserAccessReport(
      { NIK: "ES002", role: "ES", branchName: "HO" },
      { authorId: "ES001", author: { branchName: "HO" } },
    ),
    false,
  )
  assert.equal(
    canUserAccessReport(
      { NIK: "C001", role: "COORD", branchName: "SBY" },
      { authorId: "ES001", author: { branchName: "HO" } },
    ),
    false,
  )
  assert.equal(
    canUserAccessReport(
      { NIK: "ADM01", role: "ADMIN_HO", branchName: "HO" },
      { authorId: "ES001", author: { branchName: "SBY" } },
    ),
    true,
  )

  const target = { authorId: "ES001", author: { branchName: "HO" } }
  const makePhotoGet = (user: { NIK: string; role: string; branchName: string } | null) =>
    createPhotoGetHandler({
      getCurrentUser: async () => user,
      findOwningReport: async (fileId) => (fileId === "f-owned" ? target : null),
      fetchPhoto: async () => ({
        mimeType: "image/jpeg",
        body: new Uint8Array([1, 2, 3]),
      }),
    })

  const unauth = await makePhotoGet(null)(
    new Request("http://localhost/api/photos/f-owned"),
    { params: Promise.resolve({ fileId: "f-owned" }) },
  )
  assert.equal(unauth.status, 401)

  const crossBranch = await makePhotoGet({ NIK: "M002", role: "MANAGER", branchName: "SBY" })(
    new Request("http://localhost/api/photos/f-owned"),
    { params: Promise.resolve({ fileId: "f-owned" }) },
  )
  assert.equal(crossBranch.status, 403)

  const missing = await makePhotoGet({ NIK: "ES001", role: "ES", branchName: "HO" })(
    new Request("http://localhost/api/photos/missing"),
    { params: Promise.resolve({ fileId: "missing" }) },
  )
  assert.equal(missing.status, 404)

  const allowed = await makePhotoGet({ NIK: "ES001", role: "ES", branchName: "HO" })(
    new Request("http://localhost/api/photos/f-owned"),
    { params: Promise.resolve({ fileId: "f-owned" }) },
  )
  assert.equal(allowed.status, 200)
})

test("period labels, history normalization, completeness summary, and unified PDF mapper work together", async () => {
  assert.equal(formatChecklistPeriodLabel("MONTHLY", "2026-11"), "Bulanan · November 2026")
  assert.equal(formatChecklistPeriodLabel("WEEKLY", "2026-W46"), "Mingguan · Minggu 46 (2026)")

  const approvals = normalizeApprovalHistory([
    { approverNik: "C01", approverName: "Coord Satu", role: "COORD", stage: "PENDING_COORD", decision: "approve", decidedAt: baseDate.toISOString() },
    { reviewerId: "M01", reviewerName: "Mgr Legacy", reviewerRole: "MANAGER", stage: "PENDING_MANAGER", decision: "approve", decidedAt: baseDate.toISOString() },
  ])
  assert.equal(approvals[0]?.actorName, "Coord Satu")
  assert.equal(approvals[1]?.actorName, "Mgr Legacy")

  const payload = {
    formCode: "FRM_TS_063",
    formName: "Checklist Exhaust Fan",
    period: "MONTHLY",
    periodKey: "2026-11",
    followUpCompleted: true,
    items: [
      {
        id: "fan",
        label: "Fan",
        condition: "RUSAK",
        notes: "Motor bunyi",
        photos: [{ fileId: "f1", url: "/api/photos/f1" }],
        repairForm: FORM_065,
        followUp065: { jenis: "PERBAIKAN", namaUnit: "EF-1", parts: [] },
      },
    ],
    completionEvidence: {
      form065: {
        handoverConfirmed: true,
        handoverRecipient: "Supervisor WH",
        repairWithUnitPhotos: [{ fileId: "u1", url: "/api/photos/u1" }],
        selfieWithUserPhotos: [{ fileId: "s1", url: "/api/photos/s1" }],
      },
    },
  }

  const summary = getReportCompletenessSummary({
    status: "COMPLETED",
    checklistPayload: payload,
    expectedItems: 6,
  })
  assert.equal(summary.filledItems, 1)
  assert.equal(summary.expectedItems, 6)
  assert.equal(summary.followUpComplete, true)
  assert.equal(summary.evidenceComplete, true)

  const pdfData = await buildReportPdfData(
    {
      reportCode: "ENG-WH-202611-777",
      formCode: "FRM_TS_063",
      period: "MONTHLY",
      periodKey: "2026-11",
      createdAt: baseDate,
      isSafe: false,
      status: "COMPLETED",
      approvalHistory: [
        { approverNik: "C01", approverName: "Coord Satu", role: "COORD", stage: "PENDING_COORD", decision: "approve", decidedAt: baseDate.toISOString() },
        { approverNik: "M01", approverName: "Mgr Satu", role: "MANAGER", stage: "PENDING_MANAGER", decision: "approve", decidedAt: baseDate.toISOString() },
        { approverNik: "R01", approverName: "Req Satu", role: "REQUESTER", stage: "PENDING_REQUESTER", decision: "approve", decidedAt: baseDate.toISOString() },
      ],
      executionHistory: [
        { actorNik: "ES01", actorName: "Teknisi", role: "ES", action: "FINISH_WORK", performedAt: baseDate.toISOString(), notes: "OK" },
      ],
      checklistPayload: payload,
      area: { name: "Warehouse" },
      equipment: { name: "EF-1", code: "EF01", branchName: "HO" },
      author: { NIK: "ES01", name: "Teknisi", branchName: "HO" },
    },
    "ENG-WH-202611-777",
    async () => null,
  )

  assert.equal(isReportFinal(pdfData), true)
  assert.equal(pdfData.photos?.length, 3)
  const pdfBuffer = await generateReportPdfBuffer(pdfData)
  assert.ok(pdfBuffer.length > 1000)
})

test("validateCompletionEvidence rejects empty/invalid Form 014 and Form 065 submissions", () => {
  const p014 = {
    items: [{ id: "1", repairForm: FORM_014 }],
  }
  const ev014 = validateCompletionEvidence(p014, {
    form014: {
      workPhotos: [],
      receiptPhotos: [],
      refundTransferPhotos: [],
      actualPurchaseAmount: -5,
    },
  })
  assert.equal(ev014.valid, false)
  assert.ok(ev014.errors.length >= 4)

  const p065 = {
    items: [{ id: "1", repairForm: FORM_065 }],
  }
  const ev065 = validateCompletionEvidence(p065, {
    form065: {
      handoverConfirmed: false,
      handoverRecipient: "",
      repairWithUnitPhotos: [],
      selfieWithUserPhotos: [],
    },
  })
  assert.equal(ev065.valid, false)
  assert.ok(ev065.errors.length >= 3)
})

test("optional approval notes on ACC BEC/Manager/Requester persist to approvalHistory and PDF", async () => {
  const payload = {
    formCode: "FRM_TS_063",
    formName: "Checklist Exhaust Fan",
    areaCode: "wh",
    period: "MONTHLY",
    periodKey,
    followUpCompleted: true,
    items: [
      {
        id: "fan",
        label: "Fan",
        condition: "RUSAK",
        notes: "Motor bergetar",
        photos: [{ fileId: "p1", url: "/api/photos/p1" }],
        handler: "BES",
        repairForm: FORM_065,
        followUp065: { jenis: "PERBAIKAN", namaUnit: "EF-1", parts: [] },
      },
    ],
  }
  const report = {
    id: "rep-acc-notes",
    reportCode: "ENG-WH-202611-888",
    authorId: "ES001",
    status: "PENDING_COORD" as ReportStatus,
    updatedAt: baseDate,
    checklistPayload: payload,
    approvalHistory: [] as unknown[],
    author: { branchName: "HO" },
  }
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { NIK: string } }) => ({
        NIK: where.NIK,
        name: where.NIK === "C001" ? "Coord ACC" : where.NIK === "M001" ? "Mgr ACC" : "Req ACC",
        role: where.NIK === "C001" ? "COORD" : where.NIK === "M001" ? "MANAGER" : "REQUESTER",
        branchName: "HO",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...report }),
      updateMany: async ({ data }: { data: Partial<typeof report> }) => {
        Object.assign(report, data)
        return { count: 1 }
      },
    },
  }
  const prisma = {
    $transaction: (work: (c: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient

  await saveChecklistReview(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    reviewerId: "C001",
    decision: "approve",
    notes: "Cek baut pengikat",
  })
  await saveChecklistReview(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    reviewerId: "M001",
    decision: "approve",
    notes: "",
  })
  await saveChecklistReview(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    reviewerId: "R001",
    decision: "approve",
    notes: "Prioritaskan hari ini",
  })

  const normalized = normalizeApprovalHistory(report.approvalHistory)
  assert.equal(normalized[0]?.notes, "Cek baut pengikat")
  assert.equal(normalized[1]?.notes, "")
  assert.equal(normalized[2]?.notes, "Prioritaskan hari ini")

  const pdfData = await buildReportPdfData(
    {
      reportCode: report.reportCode,
      formCode: "FRM_TS_063",
      period: "MONTHLY",
      periodKey,
      createdAt: baseDate,
      isSafe: false,
      status: "COMPLETED",
      approvalHistory: report.approvalHistory,
      executionHistory: [],
      checklistPayload: payload,
      area: { name: "Warehouse" },
      equipment: { name: "EF-1", code: "EF01", branchName: "HO" },
      author: { NIK: "ES001", name: "Teknisi", branchName: "HO" },
    },
    report.reportCode,
    async () => null,
  )
  const pdfBuf = await generateReportPdfBuffer(pdfData)
  assert.ok(pdfBuf.length > 1000)
})

test("photo handler supports BES/BEC/Manager/Requester access, equipment branch fallback, and Vary: Cookie", async () => {
  const target = {
    authorId: "ES001",
    author: { branchName: "" },
    equipment: { branchName: "WH PARUNG" },
  }
  for (const role of ["ES", "COORD", "MANAGER", "REQUESTER"]) {
    const res = await createPhotoGetHandler({
      getCurrentUser: async () => ({
        NIK: role === "ES" ? "ES001" : `${role}1`,
        role,
        branchName: "WH PARUNG",
      }),
      findOwningReport: async () => target,
      fetchPhoto: async () => ({
        mimeType: "image/png",
        body: new Uint8Array([137, 80, 78, 71]),
      }),
    })(new Request("http://localhost/api/photos/photo-1"), {
      params: Promise.resolve({ fileId: "photo-1" }),
    })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get("Content-Type"), "image/png")
    assert.equal(res.headers.get("Vary"), "Cookie")
  }
})

test("FINISH_WORK distinguishes version conflict from invalid status and incomplete evidence", async () => {
  const payload = {
    formCode: "FRM_TS_063",
    items: [
      {
        id: "fan",
        label: "Fan",
        condition: "RUSAK",
        repairForm: FORM_065,
        followUp065: { jenis: "PERBAIKAN", parts: [] },
      },
    ],
  }
  const report = {
    id: "rep-occ",
    reportCode: "ENG-WH-202611-007",
    authorId: "ES001",
    status: "IN_PROGRESS" as ReportStatus,
    updatedAt: baseDate,
    checklistPayload: payload,
    drivePhotoFileIds: ["u-1", "s-1"],
    executionHistory: [] as unknown[],
    author: { NIK: "ES001", branchName: "WH PARUNG" },
  }
  const tx = {
    user: {
      findUnique: async () => ({
        NIK: "ES001",
        name: "Budi BES",
        role: "ES",
        branchName: "WH PARUNG",
      }),
    },
    checklistReport: {
      findUnique: async () => ({ ...report }),
      updateMany: async ({ data }: { data: Partial<typeof report> }) => {
        Object.assign(report, data)
        return { count: 1 }
      },
    },
    workPermit: { findMany: async () => makeActivePermitList("ES001") },
  }
  const prisma = {
    $transaction: (work: (c: typeof tx) => unknown) => work(tx),
  } as unknown as PrismaClient

  const staleRes = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: "2026-11-18T02:00:00.000Z",
    actorId: "ES001",
    action: "FINISH_WORK",
  })
  assert.match(staleRes.error || "", /Versi laporan sudah berubah/)

  const invalidStatusRes = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "PROCESS_PB",
  })
  assert.match(invalidStatusRes.error || "", /Status laporan tidak sesuai/)

  const okRes = await executeReportSparePartWork(prisma, {
    reportId: report.id,
    version: report.updatedAt.toISOString(),
    actorId: "ES001",
    action: "FINISH_WORK",
    completionEvidence: {
      form065: {
        handoverConfirmed: true,
        handoverRecipient: "Pak Budi",
        repairWithUnitPhotos: [{ fileId: "u-1", url: "/api/photos/u-1" }],
        selfieWithUserPhotos: [{ fileId: "s-1", url: "/api/photos/s-1" }],
      },
    },
  })
  assert.equal(okRes.nextStatus, "COMPLETED")
})

test("historical COMPLETED reports show Selesai (Laporan Historis) without retroactive evidence requirement", () => {
  const payload = {
    formCode: "FRM_TS_063",
    followUpCompleted: true,
    items: [
      {
        id: "fan",
        label: "Fan",
        condition: "RUSAK",
        repairForm: FORM_065,
        followUp065: { jenis: "PENGGANTIAN_SPARE_PART", parts: [] },
      },
    ],
  }

  const historical = getReportCompletenessSummary({
    status: "COMPLETED",
    checklistPayload: payload,
    expectedItems: 6,
  })
  assert.equal(historical.evidenceLabel, "Selesai (Laporan Historis)")
  assert.equal(historical.evidenceComplete, true)

  const ongoing = getReportCompletenessSummary({
    status: "IN_PROGRESS",
    checklistPayload: payload,
    expectedItems: 6,
  })
  assert.equal(ongoing.evidenceLabel, "Menunggu Bukti Penyelesaian")
  assert.equal(ongoing.evidenceComplete, false)
})
