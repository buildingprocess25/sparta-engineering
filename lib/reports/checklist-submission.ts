import type { Prisma, PrismaClient } from "@/generated/prisma"
import { completeChecklistFollowUp, needsChecklistFollowUp, retainChecklistFollowUp } from "./checklist-follow-up"

export const editableChecklistOwner = (authorId: string) => ({
  authorId,
  OR: [{ taskId: null }, { task: { assignment: { userNik: authorId } } }],
}) satisfies Prisma.ChecklistReportWhereInput

export function asChecklistJson(value: object): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value))
}

export function nextChecklistVersion(previous: Date) {
  return new Date(Math.max(Date.now(), previous.getTime() + 1))
}

async function closeRevision(tx: Prisma.TransactionClient, reportId: string, payload: Prisma.InputJsonObject, now: Date) {
  const revision = await tx.checklistReportRevision.findFirstOrThrow({
    where: { reportId, resubmittedAt: null },
    select: { id: true },
  })
  await tx.checklistReportRevision.update({
    where: { id: revision.id },
    data: { resubmittedAt: now, resubmittedPayload: payload },
  })
}

export async function saveChecklistSubmission(prisma: PrismaClient, input: {
  reportCode: string
  authorId: string
  permitId: string
  payload: { formCode: string; areaCode: string; period: string; periodKey: string }
  isSafe: boolean
  photoFileIds: string[]
  revisionVersion?: string
}) {
  const isRevision = input.revisionVersion !== undefined
  const status = isRevision ? "NEEDS_REVISION" : "DRAFT"
  const owner = editableChecklistOwner(input.authorId)

  return prisma.$transaction(async (tx) => {
    const report = await tx.checklistReport.findUnique({
      where: { reportCode: input.reportCode, status, ...owner },
      select: {
        id: true, taskId: true, formCode: true, period: true, periodKey: true,
        updatedAt: true, checklistPayload: true, area: { select: { code: true } },
      },
    })
    if (!report || (isRevision && report.updatedAt.toISOString() !== input.revisionVersion)) return null
    if ((report.formCode && report.formCode !== input.payload.formCode) ||
      (report.periodKey && report.periodKey !== input.payload.periodKey) ||
      report.area.code !== input.payload.areaCode) return null

    const answers = { ...input.payload, period: report.period ?? input.payload.period }
    const payload = asChecklistJson(retainChecklistFollowUp(isRevision ? report.checklistPayload : null, answers))
    const pendingFollowUp = needsChecklistFollowUp(payload)
    const now = nextChecklistVersion(report.updatedAt)
    const updated = await tx.checklistReport.updateMany({
      where: { id: report.id, status, updatedAt: report.updatedAt, ...owner },
      data: {
        checklistPayload: payload,
        drivePhotoFileIds: input.photoFileIds,
        isSafe: input.isSafe,
        workPermitId: input.permitId,
        updatedAt: now,
        status: isRevision && pendingFollowUp ? "NEEDS_REVISION" : "PENDING_COORD",
      },
    })
    if (!updated.count) return null

    if (isRevision && !pendingFollowUp) await closeRevision(tx, report.id, payload, now)
    if (!isRevision && report.taskId) {
      await tx.checklistTask.update({
        where: { id: report.taskId, assignment: { userNik: input.authorId } },
        data: { status: "COMPLETED", completedAt: now },
      })
    }
    return { pendingFollowUp }
  })
}

export async function saveChecklistFollowUp(prisma: PrismaClient, input: {
  reportCode: string; authorId: string; permitId: string; version: string; items: unknown
}) {
  const owner = editableChecklistOwner(input.authorId)
  return prisma.$transaction(async (tx) => {
    const report = await tx.checklistReport.findUnique({
      where: { reportCode: input.reportCode, ...owner },
      select: { id: true, status: true, updatedAt: true, checklistPayload: true },
    })
    if (!report) return "NOT_FOUND"
    if ((report.status !== "PENDING_COORD" && report.status !== "NEEDS_REVISION") ||
      report.updatedAt.toISOString() !== input.version) return "CONFLICT"

    const now = nextChecklistVersion(report.updatedAt)
    const followUp = completeChecklistFollowUp(report.checklistPayload, input.items, now)
    if (!followUp) return "INVALID"

    const payload = asChecklistJson(followUp)
    const isRevision = report.status === "NEEDS_REVISION"
    const updated = await tx.checklistReport.updateMany({
      where: { id: report.id, status: report.status, updatedAt: report.updatedAt, ...owner },
      data: {
        checklistPayload: payload,
        updatedAt: now,
        ...(isRevision && { status: "PENDING_COORD", workPermitId: input.permitId }),
      },
    })
    if (!updated.count) return "CONFLICT"
    if (isRevision) await closeRevision(tx, report.id, payload, now)
    return "SAVED"
  })
}
