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
      const existingCount = await getPrisma().checklistReport.count({
        where: { reportCode: { startsWith: prefix } },
      })

      return `${prefix}-${String(existingCount + 1).padStart(3, "0")}`
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
