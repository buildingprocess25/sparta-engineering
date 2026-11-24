import type { Prisma, PrismaClient, ReportStatus } from "@/generated/prisma"
import {
  asPayloadRecord,
  getReportItems,
  hasCostEstimateFollowUp,
  requiresRequesterReview,
  needsChecklistFollowUp,
  needsPbProcurement,
} from "./checklist-follow-up"
import { nextChecklistVersion } from "./checklist-submission"
import {
  extractCompletionEvidencePhotoIds,
  readStoredCompletionEvidence,
  validateCompletionEvidence,
} from "./completion-evidence"
import { hasExecutionAction } from "./report-display"
import { selectActiveWorkPermit } from "../work-permits/active-period"
import { getWorkPermitCalendarPeriod } from "../work-permits/calendar"

export type ReportReviewDecision = "approve" | "reject_revision" | "reject"
export type ReportExecutionAction =
  | "PROCESS_PJU"
  | "PROCESS_PB"
  | "PICKUP_STOCK"
  | "START_WORK"
  | "FINISH_WORK"
export type SparePartExecutionAction = ReportExecutionAction

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
      select: { NIK: true, role: true, branchName: true, name: true },
    })
    if (reviewer?.role !== "COORD" && reviewer?.role !== "MANAGER" && reviewer?.role !== "REQUESTER") {
      return { error: "Akun ini tidak berwenang memberi keputusan review." }
    }
    const report = await tx.checklistReport.findUnique({
      where: { id: input.reportId },
      select: {
        id: true,
        status: true,
        reportCode: true,
        updatedAt: true,
        checklistPayload: true,
        approvalHistory: true,
        author: { select: { branchName: true } },
      },
    })
    const branch = reviewer.branchName.trim().toUpperCase()
    if (!report || !branch || report.author.branchName.trim().toUpperCase() !== branch) {
      return { error: "Laporan tidak tersedia untuk cabang akun ini." }
    }

    const expectedStatus: ReportStatus =
      reviewer.role === "COORD"
        ? "PENDING_COORD"
        : reviewer.role === "MANAGER"
          ? "PENDING_MANAGER"
          : "PENDING_REQUESTER"

    const stale = { error: "Laporan sudah berubah atau tidak lagi menunggu keputusan akun ini. Muat ulang halaman." }
    if (report.status !== expectedStatus || report.updatedAt.toISOString() !== input.version) return stale
    if (needsChecklistFollowUp(report.checklistPayload)) {
      return { error: "ES masih perlu melengkapi form tindak lanjut laporan ini." }
    }

    let nextStatus: ReportStatus
    if (input.decision === "approve") {
      if (reviewer.role === "COORD") {
        nextStatus = "PENDING_MANAGER"
      } else if (reviewer.role === "MANAGER") {
        nextStatus = requiresRequesterReview(report.checklistPayload)
          ? "PENDING_REQUESTER"
          : "COMPLETED"
      } else {
        nextStatus = hasCostEstimateFollowUp(report.checklistPayload)
          ? "WAITING_PJU"
          : needsPbProcurement(report.checklistPayload)
            ? "WAITING_PB"
            : "WAITING_PARTS"
      }
    } else if (input.decision === "reject_revision") {
      nextStatus = "NEEDS_REVISION"
    } else {
      nextStatus = "REJECTED"
    }

    const now = nextChecklistVersion(report.updatedAt)
    const existingHistory = Array.isArray(report.approvalHistory)
      ? (report.approvalHistory as Array<Record<string, unknown>>)
      : []

    const auditRecord = {
      approverNik: reviewer.NIK,
      approverName: reviewer.name,
      role: reviewer.role,
      stage: expectedStatus,
      decision: input.decision,
      notes: input.notes,
      decidedAt: now.toISOString(),
    }

    const updated = await tx.checklistReport.updateMany({
      where: {
        id: input.reportId,
        status: expectedStatus,
        updatedAt: report.updatedAt,
        author: { branchName: report.author.branchName },
      },
      data: {
        status: nextStatus,
        updatedAt: now,
        approvalHistory: [...existingHistory, auditRecord] as Prisma.InputJsonValue,
      },
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

export async function executeReportSparePartWork(
  prisma: PrismaClient,
  input: {
    reportId: string
    version: string
    actorId: string
    action: ReportExecutionAction
    notes?: string
    referenceNo?: string
    completionEvidence?: unknown
  },
) {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { NIK: input.actorId },
      select: { NIK: true, role: true, branchName: true, name: true },
    })
    if (actor?.role !== "ES") {
      return { error: "Hanya teknisi (ES) yang berwenang mencatat pelaksanaan pekerjaan." }
    }

    const report = await tx.checklistReport.findUnique({
      where: { id: input.reportId },
      select: {
        id: true,
        status: true,
        reportCode: true,
        updatedAt: true,
        authorId: true,
        checklistPayload: true,
        drivePhotoFileIds: true,
        executionHistory: true,
        author: { select: { branchName: true, NIK: true } },
      },
    })

    const branch = actor.branchName.trim().toUpperCase()
    if (!report || !branch || report.author.branchName.trim().toUpperCase() !== branch) {
      return { error: "Laporan tidak tersedia untuk cabang akun ini." }
    }

    if (report.authorId !== actor.NIK) {
      return { error: "Hanya teknisi pembuat laporan yang dapat mencatat pelaksanaan pekerjaan." }
    }

    if (report.status === "COMPLETED") {
      return { error: "Laporan yang telah berstatus Selesai tidak dapat diubah kembali." }
    }

    const versionMismatch = { error: "Versi laporan sudah berubah karena ada pembaruan terbaru. Muat ulang halaman lalu coba lagi." }
    const invalidStatus = { error: "Status laporan tidak sesuai dengan tahapan pelaksanaan yang diminta. Muat ulang halaman." }
    if (report.updatedAt.toISOString() !== input.version) return versionMismatch

    let expectedStatus: ReportStatus
    let nextStatus: ReportStatus
    let nextPayload: Prisma.InputJsonValue | undefined
    let nextDrivePhotoFileIds: string[] | undefined

    if (input.action === "PROCESS_PJU") {
      if (report.status !== "WAITING_PJU" || !hasCostEstimateFollowUp(report.checklistPayload)) {
        return invalidStatus
      }
      expectedStatus = "WAITING_PJU"
      nextStatus = "WAITING_PJU"
    } else if (input.action === "PROCESS_PB") {
      if (report.status !== "WAITING_PB") {
        return invalidStatus
      }
      expectedStatus = "WAITING_PB"
      nextStatus = "WAITING_PARTS"
    } else if (input.action === "PICKUP_STOCK") {
      if (report.status !== "WAITING_PARTS") {
        return invalidStatus
      }
      expectedStatus = "WAITING_PARTS"
      nextStatus = "WAITING_PARTS"
    } else if (input.action === "START_WORK") {
      if (report.status === "WAITING_PJU") {
        if (!hasExecutionAction(report.executionHistory, "PROCESS_PJU")) {
          return { error: "Catat proses PJU Online terlebih dahulu sebelum memulai pekerjaan." }
        }
        expectedStatus = "WAITING_PJU"
      } else if (report.status === "WAITING_PARTS") {
        expectedStatus = "WAITING_PARTS"
      } else {
        return invalidStatus
      }
      nextStatus = "IN_PROGRESS"
    } else if (input.action === "FINISH_WORK") {
      if (report.status !== "IN_PROGRESS") {
        return invalidStatus
      }
      expectedStatus = "IN_PROGRESS"
      nextStatus = "COMPLETED"
    } else {
      return { error: "Aksi pelaksanaan pekerjaan tidak valid." }
    }

    if (report.status !== expectedStatus) return invalidStatus

    // Periksa izin kerja aktif untuk aksi START_WORK dan FINISH_WORK
    if (input.action === "START_WORK" || input.action === "FINISH_WORK") {
      const currentPeriod = getWorkPermitCalendarPeriod()
      const activeCandidates = await tx.workPermit.findMany({
        where: {
          applicantNik: actor.NIK,
          status: "APPROVED",
        },
        select: {
          id: true,
          status: true,
          safetyPayload: true,
          workDate: true,
          approvalHistory: true,
          managerNik: true,
          managerSignedAt: true,
        },
      })
      const hasPermit = selectActiveWorkPermit(activeCandidates, currentPeriod)
      if (!hasPermit) {
        return { error: "Teknisi belum memiliki Form Izin Kerja (MED/003) yang telah disetujui lengkap untuk bulan berjalan." }
      }
    }

    const now = nextChecklistVersion(report.updatedAt)

    if (input.action === "FINISH_WORK") {
      const evidenceCheck = validateCompletionEvidence(
        report.checklistPayload,
        input.completionEvidence,
      )
      if (!evidenceCheck.valid || !evidenceCheck.normalized) {
        return { error: evidenceCheck.errors.join(" ") }
      }

      const storedDriveIds = Array.isArray(report.drivePhotoFileIds)
        ? report.drivePhotoFileIds.filter((id): id is string => typeof id === "string")
        : []
      const existingCompletionIds = extractCompletionEvidencePhotoIds(
        readStoredCompletionEvidence(report.checklistPayload),
      )
      const existingChecklistIds = getReportItems(report.checklistPayload).flatMap((item) =>
        Array.isArray(item.photos) ? item.photos.map((p) => p.fileId) : [],
      )
      const allowedPhotoIds = new Set([
        ...storedDriveIds,
        ...existingCompletionIds,
        ...existingChecklistIds,
      ])

      const submittedPhotoIds = extractCompletionEvidencePhotoIds(evidenceCheck.normalized)
      if (submittedPhotoIds.some((id) => !allowedPhotoIds.has(id))) {
        return {
          error: "Referensi foto bukti penyelesaian tidak valid atau bukan milik laporan ini.",
        }
      }

      const storedEvidence = {
        ...evidenceCheck.normalized,
        submittedAt: now.toISOString(),
        submittedByNik: actor.NIK,
        submittedByName: actor.name,
      }
      nextPayload = {
        ...asPayloadRecord(report.checklistPayload),
        completionEvidence: storedEvidence,
      } as Prisma.InputJsonValue
      nextDrivePhotoFileIds = [...new Set([...storedDriveIds, ...submittedPhotoIds])]
    }

    const existingHistory = Array.isArray(report.executionHistory)
      ? (report.executionHistory as Array<Record<string, unknown>>)
      : []

    const auditRecord = {
      actorNik: actor.NIK,
      actorName: actor.name,
      role: actor.role,
      action: input.action,
      previousStatus: expectedStatus,
      nextStatus,
      referenceNo: input.referenceNo?.trim() || undefined,
      notes: input.notes?.trim() || "",
      performedAt: now.toISOString(),
    }

    const updated = await tx.checklistReport.updateMany({
      where: {
        id: input.reportId,
        status: expectedStatus,
        updatedAt: report.updatedAt,
      },
      data: {
        status: nextStatus,
        updatedAt: now,
        executionHistory: [...existingHistory, auditRecord] as Prisma.InputJsonValue,
        ...(nextPayload !== undefined ? { checklistPayload: nextPayload } : {}),
        ...(nextDrivePhotoFileIds !== undefined ? { drivePhotoFileIds: nextDrivePhotoFileIds } : {}),
      },
    })
    if (!updated.count) return versionMismatch

    return { nextStatus, reportCode: report.reportCode }
  })
}
