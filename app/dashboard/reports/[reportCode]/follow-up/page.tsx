import { notFound, redirect } from "next/navigation"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { ChecklistPayload } from "@/lib/checklists/payload"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { FollowUpFormsEditor } from "@/components/es-dashboard/follow-up-forms-editor"

export default async function FollowUpOrchestratorPage({
  params,
}: {
  params: Promise<{ reportCode: string }>
}) {
  const { reportCode } = await params
  
  const session = await getSession()
  if (!session?.userId || session.role !== "ES") {
    redirect("/login")
  }

  const report = await getPrisma().checklistReport.findUnique({
    where: {
      reportCode: reportCode,
    },
    include: {
      area: true,
      author: true,
    },
  })

  if (!report || report.authorId !== session.userId) {
    notFound()
  }

  const payload = (report.checklistPayload as unknown as ChecklistPayload) || {}
  const items = payload.items || []

  const needs014 = items.some(
    (item) => item.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
  )
  const needs065 = items.some(
    (item) => item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
  )

  if (!needs014 && !needs065) {
    return (
      <ReportFlowShell
        eyebrow="TINDAK LANJUT"
        title="Form Tindak Lanjut Perbaikan"
        description="Pengecekan form lanjutan perbaikan."
      >
        <div className="rounded-2xl border border-[#dedede] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
            ✓
          </div>
          <h2 className="text-base font-bold text-[#111111]">Tidak Ada Form Lanjutan</h2>
          <p className="mt-1 text-xs text-[#707784] leading-relaxed">
            Semua item checklist dalam kondisi baik atau perbaikan dapat diselesaikan langsung tanpa biaya (Repair Tanpa Biaya). Laporan ini telah berhasil disimpan dan diteruskan ke antrean approval.
          </p>
          <div className="mt-5 flex justify-center">
            <a
              href="/dashboard/reports"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#ff8a2a] px-6 text-xs font-bold text-white shadow-sm hover:bg-[#f07b1a]"
            >
              Lihat Daftar Laporan
            </a>
          </div>
        </div>
      </ReportFlowShell>
    )
  }

  return (
    <ReportFlowShell
      eyebrow="TINDAK LANJUT"
      title="Form Tindak Lanjut Perbaikan"
      description="Lengkapi rincian estimasi biaya atau spare part untuk item yang rusak."
    >
      <FollowUpFormsEditor
        reportCode={reportCode}
        payload={payload}
        context={{
          branchName: report.author?.branchName || "HO",
          authorName: report.author?.name || "ES",
          areaName: report.area?.name || "Area",
          areaCode: report.area?.code || "",
          createdAt: report.createdAt.toISOString(),
        }}
      />
    </ReportFlowShell>
  )
}

