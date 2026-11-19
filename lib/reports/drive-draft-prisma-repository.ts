import { Prisma } from "@/generated/prisma"
import { getPrisma } from "@/lib/prisma"

import type {
  ChecklistDraftRepository,
  CreateChecklistDraftInput,
} from "./drive-draft-service"

function compactAreaCode(areaCode: string): string {
  return areaCode.replace(/[^a-z0-9]/gi, "").toUpperCase() || "AREA"
}

function compactPeriodKey(periodKey: string): string {
  return periodKey.replace(/[^0-9]/g, "") || "000000"
}

function draftContext(input: CreateChecklistDraftInput) {
  return {
    reportCode: input.reportCode,
    areaId: input.areaId,
    roomId: input.roomId ?? null,
    formCode: input.formCode,
    period: input.period,
    periodKey: input.periodKey,
    taskId: input.taskId ?? null,
    equipmentId: input.equipmentId ?? null,
  }
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export function createPrismaChecklistDraftRepository(): ChecklistDraftRepository & {
  promoteDraft(input: { reportCode: string; authorId: string }): Promise<void>
} {
  return {
    async findCandidates(input) {
      const keys: Prisma.ChecklistReportWhereInput[] = []
      if (input.taskId) keys.push({ taskId: input.taskId })
      if (input.roomId) {
        keys.push({
          areaId: input.areaId,
          roomId: input.roomId,
          period: input.period,
          periodKey: input.periodKey,
          formCode: input.formCode,
        })
      }
      if (!keys.length) return []
      const rows = await getPrisma().checklistReport.findMany({
        where: { OR: keys },
        select: {
          id: true,
          authorId: true,
          reportCode: true,
          status: true,
          updatedAt: true,
          areaId: true,
          roomId: true,
          period: true,
          periodKey: true,
          formCode: true,
          taskId: true,
          equipmentId: true,
          checklistPayload: true,
          drivePhotoFileIds: true,
          revisions: { select: { id: true }, take: 1 },
          items: { select: { id: true }, take: 1 },
        },
      })
      return rows.map(({ checklistPayload, drivePhotoFileIds, revisions, items, ...report }) => ({
        ...report,
        canRebind: JSON.stringify(checklistPayload) === "{}" &&
          Array.isArray(drivePhotoFileIds) && drivePhotoFileIds.length === 0 &&
          revisions.length === 0 && items.length === 0,
      }))
    },

    async generateReportCode(input) {
      const prefix = `ENG-${compactAreaCode(input.areaCode)}-${compactPeriodKey(
        input.periodKey
      )}`
      const existingReports = await getPrisma().checklistReport.findMany({
        where: { reportCode: { startsWith: prefix } },
        select: { reportCode: true },
      })

      const validReports = existingReports.filter(
        (r): r is { reportCode: string } => typeof r.reportCode === "string" && r.reportCode.length > 0
      )
      const existingCodes = new Set(validReports.map((r) => r.reportCode))

      let maxSeq = 0
      for (const r of validReports) {
        const parts = r.reportCode.split("-")
        const lastPart = parts[parts.length - 1]
        const seq = parseInt(lastPart, 10)
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq
        }
      }

      let candidateSeq = Math.max(maxSeq + 1, existingReports.length + 1)
      let candidate = `${prefix}-${String(candidateSeq).padStart(3, "0")}`
      while (existingCodes.has(candidate)) {
        candidateSeq++
        candidate = `${prefix}-${String(candidateSeq).padStart(3, "0")}`
      }

      return candidate
    },

    async createDraft(input) {
      try {
        await getPrisma().checklistReport.create({
          data: { ...draftContext(input), authorId: input.authorId, category: "PREVENTIVE", status: "DRAFT" },
        })
        return true
      } catch (error) {
        if (isUniqueConflict(error)) return false
        throw error
      }
    },

    async rebindDraft(draft, input) {
      try {
        const { count } = await getPrisma().checklistReport.updateMany({
          where: {
            id: draft.id,
            authorId: input.authorId,
            status: "DRAFT",
            updatedAt: draft.updatedAt,
            checklistPayload: { equals: {} },
            drivePhotoFileIds: { equals: [] },
            revisions: { none: {} },
            items: { none: {} },
          },
          data: draftContext(input),
        })
        return count === 1
      } catch (error) {
        if (isUniqueConflict(error)) return false
        throw error
      }
    },

    async promoteDraft(input) {
      await getPrisma().checklistReport.updateMany({
        where: {
          reportCode: input.reportCode,
          authorId: input.authorId,
          status: "DRAFT",
        },
        data: { status: "PENDING_COORD" },
      })
    },
  }
}
