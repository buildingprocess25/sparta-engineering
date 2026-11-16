"use server"

import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { saveChecklistReview } from "@/lib/reports/checklist-review"

export async function reviewReportDecision(
  reportId: string,
  decision: "approve" | "reject_revision" | "reject",
  notes: string,
  version: string,
) {
  try {
    const session = await getSession()
    if (typeof session?.userId !== "string" || !session.userId) {
      return { error: "Sesi tidak valid. Silakan login kembali." }
    }

    if (decision !== "approve" && decision !== "reject_revision" && decision !== "reject") {
      return { error: "Keputusan review tidak valid." }
    }

    const decisionNotes = typeof notes === "string" ? notes.trim() : ""
    if (decision !== "approve" && !decisionNotes) {
      return { error: "Catatan keputusan wajib diisi." }
    }

    const result = await saveChecklistReview(getPrisma(), { reportId, version, reviewerId: session.userId, decision, notes: decisionNotes })
    if (!result.nextStatus) return { error: result.error }
    const { nextStatus, reportCode } = result

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/activity")
    if (reportCode) {
      revalidatePath(`/dashboard/reports/${reportCode}`)
    }

    return {
      success: true,
      nextStatus,
      message:
        decision === "approve"
          ? nextStatus === "COMPLETED"
            ? "Laporan telah resmi disetujui final (Selesai)."
            : "Laporan diverifikasi Coordinator dan diteruskan ke Manager."
          : decision === "reject_revision"
            ? `Laporan dikembalikan untuk revisi: ${decisionNotes}`
            : "Laporan telah ditolak.",
    }
  } catch {
    return { error: "Gagal memproses keputusan laporan." }
  }
}
