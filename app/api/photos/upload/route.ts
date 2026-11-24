import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"
import { createGoogleFolderGateway } from "@/lib/google-drive/folder-gateway"
import {
  ensureChecklistEvidenceFolder,
  ensureCompletionEvidenceFolder,
} from "@/lib/google-drive/hierarchy-service"
import { uploadPhotoToDriveCdn } from "@/lib/storage/drive-photo-service"

import { createPhotoUploadPostHandler } from "./handler"

export const POST = createPhotoUploadPostHandler({
  async hasActiveWorkPermit(authorId) {
    const [{ getWorkPermitUser }, { getActiveWorkPermit }] = await Promise.all([
      import("@/lib/work-permits/current-user"), import("@/lib/work-permits/active-permit"),
    ])
    const user = await getWorkPermitUser()
    return user?.NIK === authorId && Boolean(await getActiveWorkPermit(user))
  },
  async recordUploadedPhoto(reportCode, fileId, kind) {
    const { getPrisma } = await import("@/lib/prisma")
    const prisma = getPrisma()
    const report = await prisma.checklistReport.findUnique({
      where: { reportCode },
      select: { id: true, updatedAt: true, drivePhotoFileIds: true },
    })
    if (!report) return
    const existing = Array.isArray(report.drivePhotoFileIds)
      ? report.drivePhotoFileIds.filter((x): x is string => typeof x === "string")
      : []
    if (existing.includes(fileId)) {
      return report.updatedAt.toISOString()
    }
    if (kind === "COMPLETION_EVIDENCE") {
      const updated = await prisma.checklistReport.update({
        where: { id: report.id },
        data: { drivePhotoFileIds: [...existing, fileId] },
        select: { updatedAt: true },
      })
      return updated.updatedAt.toISOString()
    }
    await prisma.checklistReport.update({
      where: { id: report.id },
      data: {
        drivePhotoFileIds: [...existing, fileId],
        updatedAt: report.updatedAt,
      },
    })
    return report.updatedAt.toISOString()
  },
  async getSession() {
    const session = await import("@/lib/session")
    const currentSession = await session.getSession()
    if (
      typeof currentSession?.userId !== "string" ||
      typeof currentSession.role !== "string"
    ) {
      return null
    }

    return {
      userId: currentSession.userId,
      role: currentSession.role,
    }
  },
  async loadReport(reportCode) {
    const { getPrisma } = await import("@/lib/prisma")
    const report = await getPrisma().checklistReport.findUnique({
      where: { reportCode },
      select: {
        reportCode: true,
        authorId: true,
        status: true,
        formCode: true,
        periodKey: true,
        area: { select: { name: true } },
        author: { select: { branchName: true } },
      },
    })

    if (!report?.reportCode) {
      return null
    }

    return {
      ...report,
      reportCode: report.reportCode,
    }
  },
  get rootFolderId() {
    return getDriveCdnClient().config.rootFolderId
  },
  async ensureEvidenceFolder(input) {
    const { drive } = getDriveCdnClient()
    return ensureChecklistEvidenceFolder(
      { gateway: createGoogleFolderGateway(drive) },
      input
    )
  },
  async ensureCompletionEvidenceFolder(input) {
    const { drive } = getDriveCdnClient()
    return ensureCompletionEvidenceFolder(
      { gateway: createGoogleFolderGateway(drive) },
      input
    )
  },
  uploadPhoto: uploadPhotoToDriveCdn,
})
