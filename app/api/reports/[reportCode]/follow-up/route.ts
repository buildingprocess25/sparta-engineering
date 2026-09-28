import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { ChecklistPayload } from "@/lib/checklists/payload"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  try {
    const { reportCode } = await params
    const session = await getSession()

    if (
      typeof session?.userId !== "string" ||
      typeof session.role !== "string" ||
      session.role !== "ES"
    ) {
      return NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 })
    }

    const body = await req.json()
    const { items, followUp014Summary, followUp065Summary } = body

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { message: "Data items tidak valid." },
        { status: 400 }
      )
    }

    const report = await getPrisma().checklistReport.findUnique({
      where: {
        reportCode,
        authorId: session.userId,
      },
    })

    if (!report) {
      return NextResponse.json(
        { message: "Laporan tidak ditemukan." },
        { status: 404 }
      )
    }

    const currentPayload = (report.checklistPayload as unknown as ChecklistPayload) || {}

    // Update items in payload while preserving the checklist items structure
    const updatedPayload = {
      ...currentPayload,
      items,
      followUpCompleted: true,
      followUpCompletedAt: new Date().toISOString(),
      followUp014Summary: followUp014Summary || null,
      followUp065Summary: followUp065Summary || null,
    }

    await getPrisma().checklistReport.update({
      where: {
        reportCode,
      },
      data: {
        checklistPayload: updatedPayload,
        status: "PENDING_COORD", // Ensure it transitions to coordinator queue
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath(`/dashboard/reports/${reportCode}`)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Error saving follow-up form:", error)
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
