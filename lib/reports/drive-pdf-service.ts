import "server-only"

import { getPrisma } from "@/lib/prisma"
import {
  buildChecklistReportRelativePath,
  REPORT_DOCUMENT_FOLDER,
  buildFinalPdfName,
} from "@/lib/google-drive/hierarchy-policy"
import { ensureDriveFolderPath, uploadPdfToDrive, downloadFileFromDrive } from "@/lib/google-drive/files"
import { generateReportPdfBuffer, type PdfReportData, type PdfReportPhoto } from "./pdf-generator"
import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"

export type GenerateAndUploadResult = {
  ok: boolean
  reportCode: string
  pdfDriveUrl?: string | null
  pdfFolderUrl?: string | null
  error?: string
}

export async function generateAndUploadReportPdf(
  reportCode: string
): Promise<GenerateAndUploadResult> {
  const prisma = getPrisma()

  const report = await prisma.checklistReport.findUnique({
    where: { reportCode },
    include: {
      area: true,
      room: true,
      equipment: true,
      author: true,
    },
  })

  if (!report) {
    return { ok: false, reportCode, error: "Laporan tidak ditemukan" }
  }

  // Parse payload
  const rawPayload = (report.checklistPayload as unknown as ChecklistPayload) || {}
  const rawItems = Array.isArray(rawPayload.items) ? rawPayload.items : []

  const formattedItems: PdfReportData["items"] = rawItems.map(
    (item: ChecklistPayloadItem, index: number) => ({
      id: item.id || String(index + 1),
      label: item.label || `Item ${index + 1}`,
      condition: item.condition || "BAIK",
      actionCode: (item as unknown as { actionCode?: string }).actionCode || "Ch",
      notes: item.notes || undefined,
      handler: item.handler || undefined,
      photosCount: Array.isArray(item.photos) ? item.photos.length : 0,
    })
  )

  // Collect photos from items
  const photosList: PdfReportPhoto[] = []
  for (let idx = 0; idx < rawItems.length; idx++) {
    const item = rawItems[idx]
    if (Array.isArray(item.photos) && item.photos.length > 0) {
      for (const p of item.photos) {
        if (p.fileId) {
          let imgBytes: Buffer | null = null
          try {
            imgBytes = await downloadFileFromDrive(p.fileId)
          } catch {
            // fallback gracefully
          }
          photosList.push({
            itemNo: idx + 1,
            label: item.label,
            condition: item.condition || "BAIK",
            notes: item.notes,
            fileId: p.fileId,
            imageBytes: imgBytes,
          })
        }
      }
    }
  }

  const branchName =
    report.equipment?.branchName || report.author.branchName || "HEAD OFFICE"
  const areaName = report.area.name
  const periodKey = report.periodKey || "2026-10"

  const pdfData: PdfReportData = {
    reportCode: report.reportCode || reportCode,
    formCode: report.formCode || rawPayload.formCode || "FRM_TS_016",
    formName: rawPayload.formName || `FORM CHECKLIST ${report.formCode || ""}`,
    periodKey: periodKey,
    periodLabel: report.period || "MONTHLY",
    createdAt: report.createdAt,
    branchName: branchName,
    areaName: areaName,
    roomName: report.room?.name,
    equipmentName: report.equipment?.name,
    equipmentCode: report.equipment?.code,
    equipmentSerial: rawPayload.unitNo || report.equipment?.code || null,
    equipmentBrand: rawPayload.unitBrand || null,
    authorName: report.author.name,
    authorNik: report.author.NIK,
    isSafe: report.isSafe,
    generalNotes: rawPayload.generalNotes,
    items: formattedItems,
    photos: photosList,
  }

  // 1. Generate PDF buffer
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateReportPdfBuffer(pdfData)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      reportCode,
      error: `Gagal membuat dokumen PDF: ${message}`,
    }
  }

  // 2. Upload to Google Drive (if credentials are configured)
  let driveWebViewLink: string | null = null
  let driveFolderId: string | null = null

  try {
    const reportRelativePath = buildChecklistReportRelativePath({
      branchName,
      areaName,
      periodKey,
      reportCode: report.reportCode || reportCode,
    })

    const fullDocumentFolderPath = [...reportRelativePath, REPORT_DOCUMENT_FOLDER]
    driveFolderId = await ensureDriveFolderPath(fullDocumentFolderPath)

    const fileName = buildFinalPdfName(report.reportCode || reportCode)
    const uploadResult = await uploadPdfToDrive({
      fileName,
      folderId: driveFolderId,
      buffer: pdfBuffer,
      overwriteIfExists: true,
    })

    driveWebViewLink = uploadResult.webViewLink
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(
      `[Google Drive Sync] Tidak dapat mengunggah PDF ke Google Drive (${message}). PDF tetap dapat diunduh langsung.`
    )
  }

  // 3. Update database with drive links
  const driveFolderUrl = driveFolderId
    ? `https://drive.google.com/drive/folders/${driveFolderId}`
    : null

  await prisma.checklistReport.update({
    where: { id: report.id },
    data: {
      finalPdfDriveUrl: driveWebViewLink || report.finalPdfDriveUrl,
      finalPdfFolderUrl: driveFolderUrl || report.finalPdfFolderUrl,
    },
  })

  return {
    ok: true,
    reportCode,
    pdfDriveUrl: driveWebViewLink,
    pdfFolderUrl: driveFolderUrl,
  }
}
