import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import { generateReportPdfBuffer, isReportFinal } from "@/lib/reports/pdf-generator"
import { downloadFileFromDrive } from "@/lib/google-drive/files"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { canUserAccessReport } from "@/lib/reports/report-access"
import { buildReportPdfData } from "@/lib/reports/report-pdf-mapper"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  const user = await getWorkPermitUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { reportCode } = await params
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
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 })
  }

  if (!canUserAccessReport(user, report)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const pdfData = await buildReportPdfData(
    { ...report, room: report.room ?? report.task?.assignment?.room ?? null },
    reportCode,
    downloadFileFromDrive,
  )

  try {
    const pdfBuffer = await generateReportPdfBuffer(pdfData)
    const isFinal = isReportFinal(pdfData)
    const filename = `${reportCode}-${isFinal ? "Laporan-Final" : "Laporan-Pemeriksaan"}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
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
