import { getPrisma } from "@/lib/prisma"

import type {
  ChecklistDraft,
  ChecklistDraftRepository,
  CreateChecklistDraftInput,
} from "./drive-draft-service"

function compactAreaCode(areaCode: string): string {
  return areaCode.replace(/[^a-z0-9]/gi, "").toUpperCase() || "AREA"
}

function compactPeriodKey(periodKey: string): string {
  return periodKey.replace(/[^0-9]/g, "") || "000000"
}

export function createPrismaChecklistDraftRepository(): ChecklistDraftRepository & {
  promoteDraft(input: { reportCode: string; authorId: string }): Promise<void>
} {
  return {
    async findDraftByUser(authorId): Promise<ChecklistDraft | null> {
      const draft = await getPrisma().checklistReport.findFirst({
        where: { authorId, status: "DRAFT" },
        select: {
          reportCode: true,
          areaId: true,
          roomId: true,
          periodKey: true,
          formCode: true,
          taskId: true,
          equipmentId: true,
        },
        orderBy: { updatedAt: "desc" },
      })

      if (!draft?.reportCode || !draft.periodKey || !draft.formCode) {
        return null
      }

      return {
        reportCode: draft.reportCode,
        areaId: draft.areaId,
        roomId: draft.roomId,
        periodKey: draft.periodKey,
        formCode: draft.formCode,
        taskId: draft.taskId,
        equipmentId: draft.equipmentId,
      }
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

    async createDraft(input: CreateChecklistDraftInput) {
      await getPrisma().checklistReport.create({
        data: {
          reportCode: input.reportCode,
          areaId: input.areaId,
          roomId: input.roomId || null,
          authorId: input.authorId,
          category: "PREVENTIVE",
          formCode: input.formCode,
          period: input.period,
          periodKey: input.periodKey,
          status: "DRAFT",
          taskId: input.taskId || null,
          equipmentId: input.equipmentId || null,
        },
      })
    },

    async deleteDraft(reportCode) {
      await getPrisma().checklistReport.deleteMany({
        where: { reportCode, status: "DRAFT" },
      })
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
