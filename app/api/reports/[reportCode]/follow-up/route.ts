import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { ACTIVE_WORK_PERMIT_REQUIRED, getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { saveChecklistFollowUp } from "@/lib/reports/checklist-submission"
import { generateAndUploadReportPdf } from "@/lib/reports/drive-pdf-service"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  try {
    const { reportCode } = await params
    const user = await getWorkPermitUser()
    if (user?.role !== "ES") {
      return NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const { items, version } = body ?? {}

    if (!Array.isArray(items) || typeof version !== "string") {
      return NextResponse.json(
        { message: "Data items tidak valid." },
        { status: 400 }
      )
    }

    const permit = await getActiveWorkPermit(user)
    if (!permit) {
      return NextResponse.json({ message: ACTIVE_WORK_PERMIT_REQUIRED }, { status: 403 })
    }
    const result = await saveChecklistFollowUp(getPrisma(), { reportCode, authorId: user.NIK, permitId: permit.id, version, items })
    if (result === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Laporan tidak ditemukan." },
        { status: 404 }
      )
    }

    if (result === "CONFLICT") {
      return NextResponse.json({ message: "Laporan sudah berubah. Muat ulang sebelum menyimpan." }, { status: 409 })
    }
    if (result === "INVALID") {
      return NextResponse.json({ message: "Periksa kembali jenis tindak lanjut, jumlah, dan harga yang diisi." }, { status: 400 })
    }

    try {
      await generateAndUploadReportPdf(reportCode)
    } catch (error) {
      console.error(`[PDF Auto-Generate Error] on report ${reportCode}:`, error)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/activity")
    revalidatePath(`/dashboard/reports/${reportCode}`)
    revalidatePath(`/dashboard/reports/${reportCode}/follow-up`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error saving follow-up form:", error)
    return NextResponse.json(
      { message: "Gagal menyimpan form tindak lanjut." },
      { status: 500 }
    )
  }
}
