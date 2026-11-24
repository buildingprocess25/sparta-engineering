import "server-only"

import { getPrisma } from "@/lib/prisma"
import {
  buildChecklistReportRelativePath,
  REPORT_DOCUMENT_FOLDER,
  buildFinalPdfName,
} from "@/lib/google-drive/hierarchy-policy"
import { ensureDriveFolderPath, uploadPdfToDrive, downloadFileFromDrive } from "@/lib/google-drive/files"
import { generateReportPdfBuffer, isReportFinal } from "./pdf-generator"
import { buildReportPdfData } from "./report-pdf-mapper"

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
      task: { select: { assignment: { select: { room: true } } } },
    },
  })

  if (!report) {
    return { ok: false, reportCode, error: "Laporan tidak ditemukan" }
  }

  const pdfData = await buildReportPdfData(
    { ...report, room: report.room ?? report.task?.assignment?.room ?? null },
    reportCode,
    downloadFileFromDrive,
  )
  const branchName = pdfData.branchName
  const areaName = pdfData.areaName
  const periodKey = pdfData.periodKey

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

    const isFinal = isReportFinal(pdfData)
    const fileName = isFinal
      ? buildFinalPdfName(report.reportCode || reportCode)
      : `${report.reportCode || reportCode}-Laporan-Pemeriksaan.pdf`
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

  await prisma.checklistReport.updateMany({
    where: { id: report.id, updatedAt: report.updatedAt },
    data: {
      updatedAt: report.updatedAt,
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
