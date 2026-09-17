import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"
import { createGoogleFolderGateway } from "@/lib/google-drive/folder-gateway"
import { ensureChecklistEvidenceFolder } from "@/lib/google-drive/hierarchy-service"
import { uploadPhotoToDriveCdn } from "@/lib/storage/drive-photo-service"

import { createPhotoUploadPostHandler } from "./handler"

export const POST = createPhotoUploadPostHandler({
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
  uploadPhoto: uploadPhotoToDriveCdn,
})
