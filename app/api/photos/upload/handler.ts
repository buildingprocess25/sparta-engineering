import { NextResponse } from "next/server"

import { getChecklistItem } from "../../../../lib/checklists/registry"
import { buildChecklistPhotoName } from "../../../../lib/google-drive/hierarchy-policy"
import {
  COMPLETION_EVIDENCE_LABELS,
  COMPLETION_EVIDENCE_TYPES,
  type CompletionEvidenceType,
} from "../../../../lib/reports/completion-evidence"

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

type UploadContext =
  | {
      kind: "CHECKLIST_ITEM"
      reportCode: string
      formCode: string
      itemId: string
      sequence?: number
    }
  | {
      kind: "COMPLETION_EVIDENCE"
      reportCode: string
      evidenceType: CompletionEvidenceType
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
  hasActiveWorkPermit?(authorId: string): Promise<boolean>
  recordUploadedPhoto?(
    reportCode: string,
    fileId: string,
    kind: UploadContext["kind"],
  ): Promise<string | void>
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
  ensureCompletionEvidenceFolder?(input: {
    rootFolderId: string
    branchName: string
    areaName: string
    periodKey: string
    reportCode: string
    evidenceType: string
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

const COMPLETION_TYPE_SET = new Set<string>(COMPLETION_EVIDENCE_TYPES)

function parseUploadContext(value: FormDataEntryValue | null): UploadContext | null {
  if (typeof value !== "string") return null

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (parsed.kind === "CHECKLIST_ITEM") {
      if (
        typeof parsed.reportCode !== "string" ||
        typeof parsed.formCode !== "string" ||
        typeof parsed.itemId !== "string"
      ) {
        return null
      }
      return {
        kind: "CHECKLIST_ITEM",
        reportCode: parsed.reportCode,
        formCode: parsed.formCode,
        itemId: parsed.itemId,
        sequence:
          typeof parsed.sequence === "number" && parsed.sequence > 0
            ? parsed.sequence
            : undefined,
      }
    }

    if (parsed.kind === "COMPLETION_EVIDENCE") {
      if (
        typeof parsed.reportCode !== "string" ||
        typeof parsed.evidenceType !== "string" ||
        !COMPLETION_TYPE_SET.has(parsed.evidenceType)
      ) {
        return null
      }
      return {
        kind: "COMPLETION_EVIDENCE",
        reportCode: parsed.reportCode,
        evidenceType: parsed.evidenceType as CompletionEvidenceType,
        sequence:
          typeof parsed.sequence === "number" && parsed.sequence > 0
            ? parsed.sequence
            : undefined,
      }
    }

    return null
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

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return jsonError("Data upload tidak valid. Pilih foto dan coba lagi.", 400)
    }
    const file = formData.get("file")
    const context = parseUploadContext(formData.get("context"))

    if (!(file instanceof File) || !context) {
      return jsonError("Invalid upload payload", 400)
    }
    if (file.size === 0) {
      return jsonError("Foto kosong. Pilih foto lain.", 400)
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
    if (context.kind === "COMPLETION_EVIDENCE") {
      if (report.status !== "IN_PROGRESS") {
        return jsonError("Report is not editable", 422)
      }
      if (!(await deps.hasActiveWorkPermit?.(session.userId))) {
        return jsonError("Izin Kerja K3 bulan ini harus disetujui Manager.", 403)
      }
      if (!report.periodKey) {
        return jsonError("Report period is not set", 422)
      }

      try {
        const folderInput = {
          rootFolderId: deps.rootFolderId,
          branchName: report.author.branchName ?? "-",
          areaName: report.area.name,
          periodKey: report.periodKey,
          reportCode: report.reportCode,
        }
        const parentFolderId = deps.ensureCompletionEvidenceFolder
          ? await deps.ensureCompletionEvidenceFolder({
              ...folderInput,
              evidenceType: context.evidenceType,
            })
          : await deps.ensureEvidenceFolder({
              ...folderInput,
              evidence: {
                formCode: report.formCode || "COMPLETION",
                itemId: context.evidenceType,
                itemName: COMPLETION_EVIDENCE_LABELS[context.evidenceType],
              },
            })
        const fileName = buildChecklistPhotoName({
          sequence: context.sequence ?? 1,
          randomSuffix: deps.randomId?.() ?? crypto.randomUUID().slice(0, 8),
          extension: extensionFor(file),
        })
        const uploaded = await deps.uploadPhoto(file, { parentFolderId, fileName })

        if (!uploaded.success) {
          console.error("[photo-upload] Drive rejected upload:", uploaded.error)
          return jsonError("Penyimpanan foto gagal. Periksa akses dan koneksi Google Drive.", 502)
        }

        const reportVersion = await deps.recordUploadedPhoto?.(
          report.reportCode,
          uploaded.fileId,
          context.kind,
        )

        return NextResponse.json({
          fileId: uploaded.fileId,
          url: uploaded.url,
          ...(typeof reportVersion === "string" && reportVersion ? { reportVersion } : {}),
        })
      } catch (error) {
        console.error("[photo-upload] Storage error:", error instanceof Error ? error.message : "Unknown error")
        return jsonError("Layanan penyimpanan foto bermasalah. Periksa konfigurasi Google Drive.", 500)
      }
    }

    if (report.status !== "DRAFT" && report.status !== "NEEDS_REVISION") {
      return jsonError("Report is not editable", 422)
    }
    if (report.status === "NEEDS_REVISION" && !(await deps.hasActiveWorkPermit?.(session.userId))) {
      return jsonError("Izin Kerja K3 bulan ini harus disetujui Manager.", 403)
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

    try {
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
        console.error("[photo-upload] Drive rejected upload:", uploaded.error)
        return jsonError("Penyimpanan foto gagal. Periksa akses dan koneksi Google Drive.", 502)
      }

      const reportVersion = await deps.recordUploadedPhoto?.(
        report.reportCode,
        uploaded.fileId,
        context.kind,
      )

      return NextResponse.json({
        fileId: uploaded.fileId,
        url: uploaded.url,
        ...(typeof reportVersion === "string" && reportVersion ? { reportVersion } : {}),
      })
    } catch (error) {
      console.error("[photo-upload] Storage error:", error instanceof Error ? error.message : "Unknown error")
      return jsonError("Layanan penyimpanan foto bermasalah. Periksa konfigurasi Google Drive.", 500)
    }
  }
}
