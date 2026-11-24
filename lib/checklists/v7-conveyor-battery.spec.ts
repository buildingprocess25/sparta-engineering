import assert from "node:assert/strict"
import test from "node:test"
import type { PrismaClient, ReportStatus } from "../../generated/prisma"
import { getChecklistConditionDisplay } from "./condition-display"
import {
  ALL_CONVEYOR_ITEMS,
  CONVEYOR_CATEGORIES,
  FRM_TS_041_CONDITION_OPTIONS,
  FRM_TS_041_CONFIG,
  buildFrmTs041PayloadItems,
  markUncheckedConveyorCategoryGood,
  transitionFrmTs041ItemCondition,
  type FrmTs041ItemState,
} from "./frm-ts-041"
import {
  BATTERY_INSPECTION_ITEMS,
  FRM_TS_028_CONDITION_OPTIONS,
  FRM_TS_028_CONFIG,
  FRM_TS_068_CONFIG,
  buildFrmTs028PayloadItems,
  createInitialBatteryItems,
  transitionFrmTs028ItemCondition,
  type FrmTs028ItemState,
} from "./frm-ts-028"
import { calculateChecklistIsSafe, validateChecklistPayload, type ChecklistPayload } from "./payload"
import { getChecklistConfig } from "./registry"
import {
  FORM_065,
  getReportItems,
  needsChecklistFollowUp,
  retainChecklistFollowUp,
} from "../reports/checklist-follow-up"
import { saveChecklistReview } from "../reports/checklist-review"
import { saveChecklistFollowUp, saveChecklistSubmission } from "../reports/checklist-submission"

const photo = { fileId: "photo-v7-1", url: "/api/photos/photo-v7-1" }
const baseMeta = {
  areaCode: "wh",
  period: "MONTHLY" as const,
  periodKey: "2026-11",
}

function makeConveyorPayload(
  overrides: Partial<ChecklistPayload> = {},
): ChecklistPayload {
  return {
    ...baseMeta,
    formCode: "FRM_TS_041",
    formName: "Checklist Conveyor",
    items: ALL_CONVEYOR_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      condition: "BAIK",
      photos: [],
    })),
    ...overrides,
  }
}

function makeBatteryPayload(
  overrides: Partial<ChecklistPayload> = {},
): ChecklistPayload {
  return {
    ...baseMeta,
    formCode: "FRM_TS_028",
    formName: "Form Monthly Checklist Battery",
    items: BATTERY_INSPECTION_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      condition: "BAIK",
      photos: [],
    })),
    ...overrides,
  }
}

test("FRM_TS_041 keeps 11 categories, 66 items, and 6 condition options", () => {
  assert.equal(CONVEYOR_CATEGORIES.length, 11)
  assert.equal(ALL_CONVEYOR_ITEMS.length, 66)
  assert.equal(FRM_TS_041_CONFIG.items.length, 66)
  assert.deepEqual(
    FRM_TS_041_CONDITION_OPTIONS.map((o) => o.code),
    ["V", "X", "A", "R", "U", "N"],
  )
  assert.deepEqual(FRM_TS_041_CONFIG.conditionOptions, [
    "BAIK",
    "RUSAK",
    "ADJUST_OR_ADD",
    "REPAIR",
    "URGENT",
    "TIDAK_ADA",
  ])
})

test("FRM_TS_041 Tandai Semua Baik fills only unchecked items without overwriting existing evaluations", () => {
  const cat = CONVEYOR_CATEGORIES[0]
  const [first, second, third, fourth, fifth] = cat.items
  const initial: Record<string, FrmTs041ItemState> = {
    [first.id]: {
      condition: "RUSAK",
      photos: [photo],
      notes: "Baut kendor dan retak",
      handler: "EKSTERNAL",
      repairForm: FORM_065,
      uploading: false,
    },
    [second.id]: {
      condition: "ADJUST_OR_ADD",
      photos: [photo],
      notes: "Perlu penyetelan rantai",
      handler: "BES",
      uploading: false,
    },
    [third.id]: {
      condition: "TIDAK_ADA",
      photos: [],
      notes: "",
      uploading: false,
    },
    [fourth.id]: {
      photos: [],
      notes: "",
      uploading: false,
    },
    [fifth.id]: {
      photos: [],
      notes: "",
      uploading: false,
    },
  }

  const next = markUncheckedConveyorCategoryGood(initial, cat.id)
  assert.equal(next[first.id].condition, "RUSAK")
  assert.deepEqual(next[first.id].photos, [photo])
  assert.equal(next[first.id].notes, "Baut kendor dan retak")
  assert.equal(next[first.id].repairForm, FORM_065)
  assert.equal(next[second.id].condition, "ADJUST_OR_ADD")
  assert.equal(next[second.id].notes, "Perlu penyetelan rantai")
  assert.equal(next[third.id].condition, "TIDAK_ADA")
  assert.equal(next[fourth.id].condition, "BAIK")
  assert.equal(next[fifth.id].condition, "BAIK")
})

test("FRM_TS_041 condition transitions preserve photos/notes in UI state and strip OK/None references on submit", () => {
  const initial: FrmTs041ItemState = {
    condition: "RUSAK",
    photos: [photo],
    notes: "Motor bergetar keras",
    handler: "BES",
    repairForm: FORM_065,
    uploading: false,
  }

  // Switching to BAIK or TIDAK_ADA must NOT erase photos/notes in local UI state
  const asOk = transitionFrmTs041ItemCondition(initial, "BAIK")
  assert.equal(asOk.condition, "BAIK")
  assert.deepEqual(asOk.photos, [photo])
  assert.equal(asOk.notes, "Motor bergetar keras")
  assert.equal(asOk.handler, undefined)
  assert.equal(asOk.repairForm, undefined)

  const asNone = transitionFrmTs041ItemCondition(asOk, "TIDAK_ADA")
  assert.equal(asNone.condition, "TIDAK_ADA")
  assert.deepEqual(asNone.photos, [photo])
  assert.equal(asNone.notes, "Motor bergetar keras")
  assert.equal(asNone.repairForm, undefined)

  // Switching to ADJUST_OR_ADD / REPAIR / URGENT does NOT auto-trigger Form 065
  const asAdjust = transitionFrmTs041ItemCondition(initial, "ADJUST_OR_ADD")
  assert.equal(asAdjust.repairForm, undefined)
  assert.deepEqual(asAdjust.photos, [photo])

  const asRepair = transitionFrmTs041ItemCondition(initial, "REPAIR")
  assert.equal(asRepair.repairForm, undefined)

  const asUrgent = transitionFrmTs041ItemCondition(initial, "URGENT")
  assert.equal(asUrgent.repairForm, undefined)

  // Switching back to RUSAK restores default Form 065
  const backToRusak = transitionFrmTs041ItemCondition(asNone, "RUSAK")
  assert.equal(backToRusak.repairForm, FORM_065)
  assert.deepEqual(backToRusak.photos, [photo])
  assert.equal(backToRusak.notes, "Motor bergetar keras")

  // Building payload strips photos/notes/follow-up for OK and None, and keeps no dummy notes
  const map: Record<string, FrmTs041ItemState> = {}
  for (const item of ALL_CONVEYOR_ITEMS) {
    map[item.id] = { condition: "BAIK", photos: [], notes: "", uploading: false }
  }
  map[ALL_CONVEYOR_ITEMS[0].id] = asOk
  map[ALL_CONVEYOR_ITEMS[1].id] = asNone
  map[ALL_CONVEYOR_ITEMS[2].id] = asRepair

  const built = buildFrmTs041PayloadItems(map, false)
  assert.deepEqual(built[0].photos, [])
  assert.equal(built[0].notes, undefined)
  assert.equal(built[0].repairForm, undefined)
  assert.deepEqual(built[1].photos, [])
  assert.equal(built[1].notes, undefined)
  assert.equal(built[1].repairForm, undefined)
  assert.equal(built[2].condition, "REPAIR")
  assert.equal(built[2].repairForm, undefined)
  assert.equal(built[2].notes, "Motor bergetar keras")
})

test("FRM_TS_028 has 5 conditions and stays isolated from FRM_TS_068", () => {
  assert.equal(BATTERY_INSPECTION_ITEMS.length, 14)
  assert.deepEqual(
    FRM_TS_028_CONDITION_OPTIONS.map((o) => o.code),
    ["V", "X", "R", "U", "N"],
  )
  assert.deepEqual(FRM_TS_028_CONFIG.conditionOptions, [
    "BAIK",
    "RUSAK",
    "REPAIR",
    "URGENT",
    "TIDAK_ADA",
  ])

  // FRM_TS_068 remains strictly 4 conditions without TIDAK_ADA
  assert.deepEqual(FRM_TS_068_CONFIG.conditionOptions, [
    "BAIK",
    "RUSAK",
    "REPAIR",
    "URGENT",
  ])
  assert.deepEqual(getChecklistConfig("FRM_TS_068")?.conditionOptions, [
    "BAIK",
    "RUSAK",
    "REPAIR",
    "URGENT",
  ])
  assert.deepEqual(getChecklistConfig("FRM_TS_028")?.conditionOptions, [
    "BAIK",
    "RUSAK",
    "REPAIR",
    "URGENT",
    "TIDAK_ADA",
  ])

  // Repair mode initialization: FRM_TS_028 starts unselected; FRM_TS_068 preserves existing
  const ts028RepairInit = createInitialBatteryItems(true, true)
  assert.ok(Object.values(ts028RepairInit).every((v) => v.condition === ""))
  const ts068RepairInit = createInitialBatteryItems(false, true)
  assert.ok(Object.values(ts068RepairInit).every((v) => v.condition === "RUSAK"))
})

test("FRM_TS_028 transitions preserve UI state and do not auto-trigger Form 065 on R/U", () => {
  const start: FrmTs028ItemState = {
    condition: "RUSAK",
    photos: [photo],
    notes: "Terminal berkarat",
    handler: "BES",
    repairForm: FORM_065,
  }

  const asRepair = transitionFrmTs028ItemCondition(start, "REPAIR")
  assert.equal(asRepair.repairForm, undefined)
  assert.deepEqual(asRepair.photos, [photo])
  assert.equal(asRepair.notes, "Terminal berkarat")

  const asUrgent = transitionFrmTs028ItemCondition(start, "URGENT")
  assert.equal(asUrgent.repairForm, undefined)
  assert.deepEqual(asUrgent.photos, [photo])

  const asNone = transitionFrmTs028ItemCondition(start, "TIDAK_ADA")
  assert.equal(asNone.condition, "TIDAK_ADA")
  assert.equal(asNone.repairForm, undefined)
  assert.equal(asNone.handler, undefined)
  assert.deepEqual(asNone.photos, [photo])

  const repairMap = createInitialBatteryItems(true, true)
  repairMap[BATTERY_INSPECTION_ITEMS[0].id] = asRepair
  const builtRepair = buildFrmTs028PayloadItems(repairMap, true)
  assert.equal(builtRepair.length, 1)
  assert.equal(builtRepair[0].id, BATTERY_INSPECTION_ITEMS[0].id)
  assert.equal(builtRepair[0].repairForm, undefined)
})

test("V7 backend validation enforces photos, descriptions, condition whitelists, and clean OK/None payloads", () => {
  // Missing photo & description rejected on X, A, R, U
  for (const cond of ["RUSAK", "ADJUST_OR_ADD", "REPAIR", "URGENT"] as const) {
    const noPhoto = makeConveyorPayload({
      items: [
        {
          id: ALL_CONVEYOR_ITEMS[0].id,
          label: ALL_CONVEYOR_ITEMS[0].label,
          condition: cond,
          photos: [],
          notes: "Deskripsi nyata",
          handler: "BES",
        },
      ],
    })
    assert.equal(validateChecklistPayload(noPhoto).valid, false)

    const noNotes = makeConveyorPayload({
      items: [
        {
          id: ALL_CONVEYOR_ITEMS[0].id,
          label: ALL_CONVEYOR_ITEMS[0].label,
          condition: cond,
          photos: [photo],
          notes: "   ",
          handler: "BES",
        },
      ],
    })
    assert.equal(validateChecklistPayload(noNotes).valid, false)

    const validFinding = makeConveyorPayload({
      items: [
        {
          id: ALL_CONVEYOR_ITEMS[0].id,
          label: ALL_CONVEYOR_ITEMS[0].label,
          condition: cond,
          photos: [photo],
          notes: "Temuan valid",
          handler: "BES",
        },
      ],
    })
    assert.deepEqual(validateChecklistPayload(validFinding), { valid: true, errors: [] })
  }

  // OK and None must not carry follow-up references on 041 or 028
  for (const cond of ["BAIK", "TIDAK_ADA"] as const) {
    assert.equal(
      validateChecklistPayload(
        makeConveyorPayload({
          items: [
            {
              id: ALL_CONVEYOR_ITEMS[0].id,
              label: ALL_CONVEYOR_ITEMS[0].label,
              condition: cond,
              photos: [],
              repairForm: FORM_065,
            },
          ],
        }),
      ).valid,
      false,
    )
    assert.equal(
      validateChecklistPayload(
        makeBatteryPayload({
          items: [
            {
              id: BATTERY_INSPECTION_ITEMS[0].id,
              label: BATTERY_INSPECTION_ITEMS[0].label,
              condition: cond,
              photos: [],
              repairForm: FORM_065,
            },
          ],
        }),
      ).valid,
      false,
    )
  }

  // Form-specific condition whitelists
  assert.equal(
    validateChecklistPayload(
      makeBatteryPayload({
        items: [
          {
            id: BATTERY_INSPECTION_ITEMS[0].id,
            label: BATTERY_INSPECTION_ITEMS[0].label,
            condition: "ADJUST_OR_ADD",
            photos: [photo],
            notes: "Tidak valid di 028",
            handler: "BES",
          },
        ],
      }),
    ).valid,
    false,
  )
  assert.equal(
    validateChecklistPayload(
      makeConveyorPayload({
        items: [
          {
            id: ALL_CONVEYOR_ITEMS[0].id,
            label: ALL_CONVEYOR_ITEMS[0].label,
            condition: "CLEAN",
            photos: [photo],
            notes: "Tidak valid di 041",
            handler: "BES",
          },
        ],
      }),
    ).valid,
    false,
  )

  // Repair mode requires >= 1 finding and rejects BAIK/TIDAK_ADA
  assert.equal(
    validateChecklistPayload(
      makeBatteryPayload({ formCode: "FRM_TS_028_REPAIR", items: [] }),
    ).valid,
    false,
  )
  assert.equal(
    validateChecklistPayload(
      makeConveyorPayload({ formCode: "FRM_TS_041_REPAIR", items: [] }),
    ).valid,
    false,
  )
  assert.equal(
    validateChecklistPayload(
      makeBatteryPayload({
        formCode: "FRM_TS_028_REPAIR",
        items: [
          {
            id: BATTERY_INSPECTION_ITEMS[0].id,
            label: BATTERY_INSPECTION_ITEMS[0].label,
            condition: "BAIK",
            photos: [],
          },
        ],
      }),
    ).valid,
    false,
  )
  assert.equal(
    validateChecklistPayload(
      makeBatteryPayload({
        formCode: "FRM_TS_028_REPAIR",
        items: [
          {
            id: BATTERY_INSPECTION_ITEMS[2].id,
            label: BATTERY_INSPECTION_ITEMS[2].label,
            condition: "REPAIR",
            photos: [photo],
            notes: "Konektor intercell longgar",
            handler: "BES",
          },
        ],
      }),
    ).valid,
    true,
  )
})

test("URGENT never produces isSafe = true, while OK/None are safe and TS_068 remains unaffected", () => {
  const urgent041 = makeConveyorPayload({
    items: [
      {
        id: ALL_CONVEYOR_ITEMS[0].id,
        label: ALL_CONVEYOR_ITEMS[0].label,
        condition: "URGENT",
        photos: [photo],
        notes: "Emergency switch macet",
        handler: "BES",
      },
    ],
  })
  assert.equal(calculateChecklistIsSafe(urgent041), false)

  const urgent028 = makeBatteryPayload({
    items: [
      {
        id: BATTERY_INSPECTION_ITEMS[0].id,
        label: BATTERY_INSPECTION_ITEMS[0].label,
        condition: "URGENT",
        photos: [photo],
        notes: "Kabel utama terkelupas",
        handler: "BES",
      },
    ],
  })
  assert.equal(calculateChecklistIsSafe(urgent028), false)

  const okAndNone = makeBatteryPayload({
    items: [
      {
        id: BATTERY_INSPECTION_ITEMS[0].id,
        label: BATTERY_INSPECTION_ITEMS[0].label,
        condition: "BAIK",
        photos: [],
      },
      {
        id: BATTERY_INSPECTION_ITEMS[1].id,
        label: BATTERY_INSPECTION_ITEMS[1].label,
        condition: "TIDAK_ADA",
        photos: [],
      },
    ],
  })
  assert.equal(calculateChecklistIsSafe(okAndNone), true)

  // Non-regression: FRM_TS_068 still validates REPAIR without photo as before
  const ts068Legacy = {
    ...baseMeta,
    formCode: "FRM_TS_068",
    formName: "Form Monthly Checklist Battery",
    items: [
      {
        id: BATTERY_INSPECTION_ITEMS[0].id,
        label: BATTERY_INSPECTION_ITEMS[0].label,
        condition: "REPAIR",
        photos: [],
        notes: "Perlu dikencangkan",
        handler: "BES",
        repairForm: FORM_065,
      },
    ],
  }
  assert.equal(validateChecklistPayload(ts068Legacy).valid, true)
})

test("Adjust/Repair/Urgent without Form 065 still follow COORD -> MANAGER approval, while RUSAK with Form 065 blocks ACC BEC until 065 is completed", async () => {
  const now = new Date("2026-11-24T03:00:00Z")

  function createMockEnv(initialStatus: ReportStatus, formCode: string) {
    const report = {
      id: "rep-v7",
      reportCode: "ENG-V7-001",
      taskId: null as string | null,
      authorId: "ES-01",
      status: initialStatus,
      formCode,
      period: "MONTHLY" as const,
      periodKey: "2026-11",
      updatedAt: now,
      checklistPayload: {} as unknown,
      drivePhotoFileIds: [photo.fileId],
      isSafe: true,
      workPermitId: null as string | null,
      approvalHistory: [] as unknown[],
      area: { code: "wh" },
      author: { branchName: "HO" },
    }
    let revision: Record<string, unknown> | undefined
    const tx = {
      user: {
        findUnique: async ({ where }: { where: { NIK: string } }) => ({
          NIK: where.NIK,
          name: where.NIK,
          role:
            where.NIK === "mgr"
              ? "MANAGER"
              : where.NIK === "req"
                ? "REQUESTER"
                : where.NIK === "es"
                  ? "ES"
                  : "COORD",
          branchName: "HO",
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
          if (where.status !== report.status || where.updatedAt.getTime() !== report.updatedAt.getTime()) {
            return { count: 0 }
          }
          Object.assign(report, data)
          return { count: 1 }
        },
      },
      checklistReportRevision: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          revision = { id: "rev-1", ...data }
        },
        findFirstOrThrow: async () => revision!,
        update: async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(revision!, data)
        },
      },
    }
    const prisma = { $transaction: (work: (c: typeof tx) => unknown) => work(tx) } as unknown as PrismaClient
    return { report, prisma }
  }

  // Case A: FRM_TS_028 with URGENT without Form 065 -> goes to PENDING_COORD -> COORD -> MANAGER -> COMPLETED
  const envA = createMockEnv("DRAFT", "FRM_TS_028")
  const payloadA = makeBatteryPayload({
    items: [
      {
        id: BATTERY_INSPECTION_ITEMS[0].id,
        label: BATTERY_INSPECTION_ITEMS[0].label,
        condition: "URGENT",
        photos: [photo],
        notes: "Isolasi kabel terkelupas",
        handler: "BES",
      },
    ],
  })
  assert.equal(needsChecklistFollowUp(payloadA), false)
  assert.deepEqual(
    await saveChecklistSubmission(envA.prisma, {
      reportCode: envA.report.reportCode,
      authorId: envA.report.authorId,
      permitId: "permit-1",
      payload: payloadA,
      isSafe: calculateChecklistIsSafe(payloadA),
      photoFileIds: [photo.fileId],
    }),
    { pendingFollowUp: false },
  )
  assert.equal(envA.report.status, "PENDING_COORD")
  assert.equal(envA.report.isSafe, false)

  const coordAccA = await saveChecklistReview(envA.prisma, {
    reportId: envA.report.id,
    version: envA.report.updatedAt.toISOString(),
    reviewerId: "coord",
    decision: "approve",
    notes: "ACC Coord",
  })
  assert.equal(coordAccA.nextStatus, "PENDING_MANAGER")

  const mgrAccA = await saveChecklistReview(envA.prisma, {
    reportId: envA.report.id,
    version: envA.report.updatedAt.toISOString(),
    reviewerId: "mgr",
    decision: "approve",
    notes: "ACC Manager",
  })
  assert.equal(mgrAccA.nextStatus, "COMPLETED")

  // Case B: FRM_TS_041 with RUSAK + Form 065 -> ACC BEC blocked until Form 065 saved
  const envB = createMockEnv("DRAFT", "FRM_TS_041")
  const payloadB = makeConveyorPayload({
    items: [
      {
        id: ALL_CONVEYOR_ITEMS[0].id,
        label: ALL_CONVEYOR_ITEMS[0].label,
        condition: "RUSAK",
        photos: [photo],
        notes: "Bearing pecah",
        handler: "BES",
        repairForm: FORM_065,
      },
    ],
  })
  assert.deepEqual(
    await saveChecklistSubmission(envB.prisma, {
      reportCode: envB.report.reportCode,
      authorId: envB.report.authorId,
      permitId: "permit-1",
      payload: payloadB,
      isSafe: calculateChecklistIsSafe(payloadB),
      photoFileIds: [photo.fileId],
    }),
    { pendingFollowUp: true },
  )

  const blockedCoord = await saveChecklistReview(envB.prisma, {
    reportId: envB.report.id,
    version: envB.report.updatedAt.toISOString(),
    reviewerId: "coord",
    decision: "approve",
    notes: "Coba ACC sebelum 065",
  })
  assert.ok(blockedCoord.error)

  const followUpSaved = await saveChecklistFollowUp(envB.prisma, {
    reportCode: envB.report.reportCode,
    authorId: envB.report.authorId,
    permitId: "permit-1",
    version: envB.report.updatedAt.toISOString(),
    items: [
      {
        ...payloadB.items[0],
        followUp065: {
          jenis: "PENGGANTIAN_SPARE_PART",
          namaUnit: "Conveyor 1",
          merk: "Conveyor",
          nomorUnit: "1",
          nomorTiketProblem: "TK-41",
          analisa: "Bearing pecah",
          tindakan: "Ganti bearing",
          parts: [
            {
              id: "p1",
              namaPart: "Bearing 6204",
              nomorPart: "6204",
              asalPart: "STOCK",
              jumlahPart: 1,
            },
          ],
        },
      },
    ],
  })
  assert.equal(followUpSaved, "SAVED")

  const coordAccB = await saveChecklistReview(envB.prisma, {
    reportId: envB.report.id,
    version: envB.report.updatedAt.toISOString(),
    reviewerId: "coord",
    decision: "approve",
    notes: "ACC Coord setelah 065",
  })
  assert.equal(coordAccB.nextStatus, "PENDING_MANAGER")

  const mgrAccB = await saveChecklistReview(envB.prisma, {
    reportId: envB.report.id,
    version: envB.report.updatedAt.toISOString(),
    reviewerId: "mgr",
    decision: "approve",
    notes: "ACC Manager",
  })
  assert.equal(mgrAccB.nextStatus, "PENDING_REQUESTER")
})

test("retainChecklistFollowUp strips stale Form 065 references when V7 item changes to OK or None", () => {
  const previous = makeConveyorPayload({
    items: [
      {
        id: ALL_CONVEYOR_ITEMS[0].id,
        label: ALL_CONVEYOR_ITEMS[0].label,
        condition: "RUSAK",
        photos: [photo],
        notes: "Rusak",
        handler: "BES",
        repairForm: FORM_065,
        followUp065: {
          jenis: "PENGGANTIAN_SPARE_PART",
          namaUnit: "Conveyor",
          merk: "SAT",
          nomorUnit: "1",
          nomorTiketProblem: "TK-1",
          analisa: "Aus",
          tindakan: "Ganti",
          parts: [{ id: "p1", namaPart: "Belt", nomorPart: "B1", asalPart: "STOCK", jumlahPart: 1 }],
        },
      } as never,
    ],
    followUpCompleted: true,
    followUp065Summary: { itemCount: 1 },
  } as never)

  const staleNext = makeConveyorPayload({
    items: [
      {
        id: ALL_CONVEYOR_ITEMS[0].id,
        label: ALL_CONVEYOR_ITEMS[0].label,
        condition: "TIDAK_ADA",
        photos: [],
        repairForm: FORM_065,
      },
    ],
  })

  const cleaned = retainChecklistFollowUp(previous, staleNext)
  assert.equal(needsChecklistFollowUp(cleaned), false)
  const [cleanedItem] = getReportItems(cleaned)
  assert.equal(cleanedItem.repairForm, undefined)
  assert.equal(cleanedItem.followUp065, undefined)
  assert.equal(cleanedItem.followUpData, undefined)
})

test("getChecklistConditionDisplay renders every condition accurately without turning URGENT or ADJUST into Baik", () => {
  assert.equal(getChecklistConditionDisplay("BAIK").shortLabel, "Baik")
  assert.equal(getChecklistConditionDisplay("RUSAK").label, "Not Good (X)")
  assert.equal(getChecklistConditionDisplay("ADJUST_OR_ADD").shortLabel, "Adjust (A)")
  assert.equal(getChecklistConditionDisplay("REPAIR").shortLabel, "Repair (R)")
  assert.equal(getChecklistConditionDisplay("URGENT").shortLabel, "Urgent (U)")
  assert.equal(getChecklistConditionDisplay("TIDAK_ADA").label, "None (N)")
  assert.notEqual(getChecklistConditionDisplay("URGENT").shortLabel, "Baik")
  assert.notEqual(getChecklistConditionDisplay("ADJUST_OR_ADD").shortLabel, "Baik")
  assert.equal(getChecklistConditionDisplay("CUSTOM_STATUS").shortLabel, "CUSTOM_STATUS")
})
