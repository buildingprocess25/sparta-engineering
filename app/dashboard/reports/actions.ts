"use server"

import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function reviewReportDecision(
  reportId: string,
  decision: "approve" | "reject_revision" | "reject",
  notes?: string
) {
  try {
    const session = await getSession()
    const prisma = getPrisma()

    const currentReport = await prisma.checklistReport.findUnique({
      where: { id: reportId },
    })

    if (!currentReport) {
      return { error: "Laporan tidak ditemukan." }
    }

    const userRole = session?.role ?? "MANAGER"
    let nextStatus: "PENDING_COORD" | "PENDING_MANAGER" | "PENDING_REQUESTER" | "COMPLETED" | "REJECTED" | "DRAFT"

    if (decision === "approve") {
      if (userRole === "COORD") {
        nextStatus = "PENDING_MANAGER"
      } else {
        nextStatus = "COMPLETED"
      }
    } else if (decision === "reject_revision") {
      nextStatus = "DRAFT"
    } else {
      nextStatus = "REJECTED"
    }

    await prisma.checklistReport.update({
      where: { id: reportId },
      data: {
        status: nextStatus,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")

    return {
      success: true,
      nextStatus,
      message:
        decision === "approve"
          ? nextStatus === "COMPLETED"
            ? "Laporan telah resmi disetujui final (Selesai)."
            : "Laporan diverifikasi Coordinator dan diteruskan ke Manager."
          : decision === "reject_revision"
          ? `Laporan dikembalikan untuk revisi: ${notes ?? ""}`
          : "Laporan telah ditolak.",
    }
  } catch (err: any) {
    return { error: err.message || "Gagal memproses keputusan laporan." }
  }
}
