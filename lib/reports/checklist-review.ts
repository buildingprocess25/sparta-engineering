import type { Prisma, PrismaClient } from "@/generated/prisma"
import { needsChecklistFollowUp } from "./checklist-follow-up"
import { nextChecklistVersion } from "./checklist-submission"

export type ReportReviewDecision = "approve" | "reject_revision" | "reject"

export async function saveChecklistReview(prisma: PrismaClient, input: {
  reportId: string
  version: string
  reviewerId: string
  decision: ReportReviewDecision
  notes: string
}) {
  return prisma.$transaction(async (tx) => {
    const reviewer = await tx.user.findUnique({
      where: { NIK: input.reviewerId },
      select: { role: true, branchName: true, name: true },
    })
    if (reviewer?.role !== "COORD" && reviewer?.role !== "MANAGER") {
      return { error: "Akun ini tidak berwenang memberi keputusan review." }
    }
    const report = await tx.checklistReport.findUnique({
      where: { id: input.reportId },
      select: { status: true, reportCode: true, updatedAt: true, checklistPayload: true, author: { select: { branchName: true } } },
    })
    const branch = reviewer.branchName.trim().toUpperCase()
    if (!report || !branch || report.author.branchName.trim().toUpperCase() !== branch) {
      return { error: "Laporan tidak tersedia untuk cabang akun ini." }
    }

    const expectedStatus = reviewer.role === "COORD" ? "PENDING_COORD" : "PENDING_MANAGER"
    const stale = { error: "Laporan sudah berubah atau tidak lagi menunggu keputusan akun ini. Muat ulang halaman." }
    if (report.status !== expectedStatus || report.updatedAt.toISOString() !== input.version) return stale
    if (needsChecklistFollowUp(report.checklistPayload)) {
      return { error: "ES masih perlu melengkapi form tindak lanjut laporan ini." }
    }

    const nextStatus = input.decision === "approve"
      ? reviewer.role === "COORD" ? "PENDING_MANAGER" : "COMPLETED"
      : input.decision === "reject_revision" ? "NEEDS_REVISION" : "REJECTED"

    const now = nextChecklistVersion(report.updatedAt)
    const updated = await tx.checklistReport.updateMany({
      where: { id: input.reportId, status: expectedStatus, updatedAt: report.updatedAt, author: { branchName: report.author.branchName } },
      data: { status: nextStatus, updatedAt: now },
    })
    if (!updated.count) return stale

    if (nextStatus === "NEEDS_REVISION") {
      await tx.checklistReportRevision.create({
        data: {
          reportId: input.reportId,
          reason: input.notes,
          reviewerId: input.reviewerId,
          reviewerName: reviewer.name,
          reviewStage: expectedStatus,
          requestedAt: now,
          previousPayload: report.checklistPayload as Prisma.InputJsonValue,
        },
      })
    }
    return { nextStatus, reportCode: report.reportCode }
  })
}
