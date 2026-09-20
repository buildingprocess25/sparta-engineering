import { NextResponse } from "next/server"

import { getChecklistItem } from "../../../../lib/checklists/registry"
import { buildChecklistPhotoName } from "../../../../lib/google-drive/hierarchy-policy"

const MAX_FILE_SIZE = 4 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

type Session = {
  userId: string
  role: string
}

type UploadContext = {
  kind: "CHECKLIST_ITEM"
  reportCode: string
  formCode: string
  itemId: string
  sequence?: number
}

type LoadedReport = {
  reportCode: string
  authorId: string
  status: string
  formCode: string | null
  periodKey: string | null
  area: { name: string }
  author: { branchName: string | null }
}

type PhotoUploadResult =
  | { success: true; fileId: string; url: string }
  | { success: false; error: string }

export type PhotoUploadHandlerDeps = {
  getSession(): Promise<Session | null>
  loadReport(reportCode: string): Promise<LoadedReport | null>
  rootFolderId: string
  ensureEvidenceFolder(input: {
    rootFolderId: string
    branchName: string
    areaName: string
    periodKey: string
    reportCode: string
    evidence: {
      formCode: string
      itemId: string
      itemName: string
    }
  }): Promise<string>
  uploadPhoto(
    file: File,
    input: { parentFolderId: string; fileName: string }
  ): Promise<PhotoUploadResult>
  randomId?(): string
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function parseUploadContext(value: FormDataEntryValue | null): UploadContext | null {
  if (typeof value !== "string") return null

  try {
    const parsed = JSON.parse(value) as Partial<UploadContext>
    if (
      parsed.kind !== "CHECKLIST_ITEM" ||
      typeof parsed.reportCode !== "string" ||
      typeof parsed.formCode !== "string" ||
      typeof parsed.itemId !== "string"
    ) {
      return null
    }

    return {
      kind: parsed.kind,
      reportCode: parsed.reportCode,
      formCode: parsed.formCode,
      itemId: parsed.itemId,
      sequence:
        typeof parsed.sequence === "number" && parsed.sequence > 0
          ? parsed.sequence
          : undefined,
    }
  } catch {
    return null
  }
}

function extensionFor(file: File): string {
  const nameExtension = file.name.split(".").pop()
  if (nameExtension && nameExtension !== file.name) {
    return nameExtension.toLowerCase()
  }

  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  return "jpg"
}

export function createPhotoUploadPostHandler(deps: PhotoUploadHandlerDeps) {
  return async function post(request: Request) {
    const session = await deps.getSession()
    if (!session) {
      return jsonError("Unauthorized", 401)
    }
    if (session.role !== "ES") {
      return jsonError("Forbidden", 403)
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const context = parseUploadContext(formData.get("context"))

    if (!(file instanceof File) || !context) {
      return jsonError("Invalid upload payload", 400)
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return jsonError("Unsupported file type", 400)
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File size exceeds 4 MB", 400)
    }

    const report = await deps.loadReport(context.reportCode)
    if (!report) {
      return jsonError("Report not found", 404)
    }
    if (report.authorId !== session.userId) {
      return jsonError("Forbidden", 403)
    }
    if (report.status !== "DRAFT") {
      return jsonError("Report is not editable", 422)
    }
    if (report.formCode && report.formCode !== context.formCode) {
      return jsonError("Report form mismatch", 422)
    }
    if (!report.periodKey) {
      return jsonError("Report period is not set", 422)
    }

    const item = getChecklistItem(context.formCode, context.itemId)
    if (!item) {
      return jsonError("Checklist item not found", 404)
    }

    const parentFolderId = await deps.ensureEvidenceFolder({
      rootFolderId: deps.rootFolderId,
      branchName: report.author.branchName ?? "-",
      areaName: report.area.name,
      periodKey: report.periodKey,
      reportCode: report.reportCode,
      evidence: {
        formCode: context.formCode,
        itemId: item.id,
        itemName: item.label,
      },
    })
    const fileName = buildChecklistPhotoName({
      sequence: context.sequence ?? 1,
      randomSuffix: deps.randomId?.() ?? crypto.randomUUID().slice(0, 8),
      extension: extensionFor(file),
    })
    const uploaded = await deps.uploadPhoto(file, { parentFolderId, fileName })

    if (!uploaded.success) {
      return jsonError(uploaded.error, 500)
    }

    return NextResponse.json({
      fileId: uploaded.fileId,
      url: uploaded.url,
    })
  }
}
