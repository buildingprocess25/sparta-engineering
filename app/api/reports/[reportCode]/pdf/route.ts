import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import { generateReportPdfBuffer, type PdfReportData } from "@/lib/reports/pdf-generator"
import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"

import { downloadFileFromDrive } from "@/lib/google-drive/files"
import type { PdfReportPhoto } from "@/lib/reports/pdf-generator"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  const { reportCode } = await params
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
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 })
  }

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

  const pdfData: PdfReportData = {
    reportCode: report.reportCode || reportCode,
    formCode: report.formCode || rawPayload.formCode || "FRM_TS_016",
    formName: rawPayload.formName || `FORM CHECKLIST ${report.formCode || ""}`,
    periodKey: report.periodKey || "2026-10",
    periodLabel: report.period || "MONTHLY",
    createdAt: report.createdAt,
    branchName:
      report.equipment?.branchName || report.author.branchName || "HEAD OFFICE",
    areaName: report.area.name,
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

  try {
    const pdfBuffer = await generateReportPdfBuffer(pdfData)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${reportCode}-Laporan-Final.pdf"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Gagal menghasilkan PDF: ${message}` },
      { status: 500 }
    )
  }
}
