"use server"

import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import {
  executeReportSparePartWork,
  saveChecklistReview,
  type SparePartExecutionAction,
} from "@/lib/reports/checklist-review"

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

    const result = await saveChecklistReview(getPrisma(), {
      reportId,
      version,
      reviewerId: session.userId,
      decision,
      notes: decisionNotes,
    })
    if (!result.nextStatus) return { error: result.error }
    const { nextStatus, reportCode } = result

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/activity")
    if (reportCode) {
      revalidatePath(`/dashboard/reports/${reportCode}`)
    }

    const approvalMessage: Partial<Record<typeof nextStatus, string>> = {
      COMPLETED: "Laporan telah resmi disetujui final (Selesai).",
      PENDING_MANAGER: "Laporan diverifikasi Coordinator dan diteruskan ke Manager.",
      PENDING_REQUESTER: "Laporan disetujui Manager dan diteruskan ke Requester (WHM/DWHM).",
      WAITING_PJU: "Form 014 disetujui Requester. Laporan menunggu proses PJU.",
      WAITING_PB: "Usulan disetujui Requester. Menunggu proses pengadaan PB.",
      WAITING_PARTS: "Usulan disetujui Requester. Part dialokasikan dari stok gudang.",
    }

    return {
      success: true,
      nextStatus,
      message:
        decision === "approve"
          ? approvalMessage[nextStatus] ?? "Persetujuan tersimpan."
          : decision === "reject_revision"
            ? `Laporan dikembalikan untuk revisi: ${decisionNotes}`
            : "Laporan telah ditolak.",
    }
  } catch {
    return { error: "Gagal memproses keputusan laporan." }
  }
}

export async function executeReportSparePartAction(
  reportId: string,
  action: SparePartExecutionAction,
  notes: string,
  version: string,
) {
  try {
    const session = await getSession()
    if (typeof session?.userId !== "string" || !session.userId) {
      return { error: "Sesi tidak valid. Silakan login kembali." }
    }

    const result = await executeReportSparePartWork(getPrisma(), {
      reportId,
      version,
      actorId: session.userId,
      action,
      notes,
    })
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
        action === "PROCESS_PB"
          ? "Proses pengadaan PB dicatat. Status kini Menunggu Part."
          : action === "START_WORK"
            ? "Pekerjaan perbaikan resmi dimulai (Sedang Dikerjakan)."
            : "Pekerjaan perbaikan telah selesai (Status Selesai).",
    }
  } catch {
    return { error: "Gagal memproses aksi pelaksanaan pekerjaan." }
  }
}
