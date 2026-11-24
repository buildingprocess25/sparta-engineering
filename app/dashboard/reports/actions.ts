"use server"

import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import {
  executeReportSparePartWork,
  saveChecklistReview,
  type ReportExecutionAction,
  type SparePartExecutionAction,
} from "@/lib/reports/checklist-review"
import { generateAndUploadReportPdf } from "@/lib/reports/drive-pdf-service"

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

    if (reportCode) {
      try {
        await generateAndUploadReportPdf(reportCode)
      } catch (pdfErr) {
        console.error(`[PDF Sync Error] on review ${reportCode}:`, pdfErr)
      }
    }

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
      WAITING_PJU: "Form 014 disetujui Requester. Laporan menunggu proses PJU Online.",
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
  action: ReportExecutionAction | SparePartExecutionAction,
  notes: string,
  version: string,
  options?: {
    referenceNo?: string
    completionEvidence?: unknown
  },
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
      referenceNo: options?.referenceNo,
      completionEvidence: options?.completionEvidence,
    })
    if (!result.nextStatus) return { error: result.error }
    const { nextStatus, reportCode } = result

    if (reportCode) {
      try {
        await generateAndUploadReportPdf(reportCode)
      } catch (pdfErr) {
        console.error(`[PDF Sync Error] on execution ${reportCode}:`, pdfErr)
      }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")
    revalidatePath("/dashboard/activity")
    if (reportCode) {
      revalidatePath(`/dashboard/reports/${reportCode}`)
    }

    const actionMessage: Record<ReportExecutionAction, string> = {
      PROCESS_PJU: "Proses PJU Online dicatat beserta timestamp server.",
      PROCESS_PB: "Proses pengadaan PB dicatat. Status kini Menunggu Part.",
      PICKUP_STOCK: "Pengambilan stock barang dicatat beserta timestamp server.",
      START_WORK: "Pekerjaan perbaikan resmi dimulai (Sedang Dikerjakan).",
      FINISH_WORK: "Bukti penyelesaian tervalidasi dan laporan resmi berstatus Selesai.",
    }

    return {
      success: true,
      nextStatus,
      message: actionMessage[action],
    }
  } catch {
    return { error: "Gagal memproses aksi pelaksanaan pekerjaan." }
  }
}
