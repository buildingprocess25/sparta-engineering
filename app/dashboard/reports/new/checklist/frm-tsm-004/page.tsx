import { FrmTsm004Form } from "@/components/es-dashboard/frm-tsm-004-form"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getCurrentPeriodKey } from "@/lib/date-utils"
import { getPrisma } from "@/lib/prisma"
import { reserveChecklistDraft } from "@/lib/reports/drive-draft-service"
import { createPrismaChecklistDraftRepository } from "@/lib/reports/drive-draft-prisma-repository"
import { getSession } from "@/lib/session"
import { submitFrmTsm004Checklist } from "./actions"

export const dynamic = "force-dynamic"

type FrmTsm004PageProps = {
  searchParams: Promise<{
    areaId?: string
    period?: string
    workPermit?: string
  }>
}

function unavailable(title: string, description: string) {
  return (
    <ReportFlowShell
      eyebrow="FRM_TSM_004"
      title={title}
      description={description}
    >
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 text-sm leading-6 text-[#686868] shadow-sm">
        Kembali ke pemilihan area untuk membuka form checklist yang tersedia.
      </div>
    </ReportFlowShell>
  )
}

export default async function FrmTsm004Page({
  searchParams,
}: FrmTsm004PageProps) {
  const [params, session] = await Promise.all([searchParams, getSession()])

  if (
    typeof session?.userId !== "string" ||
    typeof session.role !== "string" ||
    session.role !== "ES"
  ) {
    return unavailable(
      "Sesi tidak valid",
      "Masuk sebagai Engineering Support untuk mengisi checklist."
    )
  }
  // Tetap monthly sesuai instruksi pengguna meskipun defaultnya 3 bulan di Excel
  if (!params.areaId || params.period !== "MONTHLY") {
    return unavailable(
      "Form belum tersedia",
      "FRM_TSM_004 hanya tersedia untuk checklist Monthly pada tahap ini."
    )
  }

  const [area, user] = await Promise.all([
    getPrisma().area.findUnique({
      where: { id: params.areaId },
      select: { id: true, code: true, name: true },
    }),
    getPrisma().user.findUnique({
      where: { NIK: session.userId },
      select: { NIK: true, name: true, role: true },
    }),
  ])

  if (!area) {
    return unavailable(
      "Area tidak ditemukan",
      "Data area checklist belum tersedia atau sudah tidak aktif."
    )
  }

  const periodKey = getCurrentPeriodKey("MONTHLY")
  const draft = await reserveChecklistDraft(
    createPrismaChecklistDraftRepository(),
    {
      authorId: session.userId,
      areaId: area.id,
      areaCode: area.code,
      formCode: "FRM_TSM_004",
      period: "MONTHLY",
      periodKey,
    }
  )

  return (
    <ReportFlowShell
      eyebrow="FRM_TSM_004"
      title="Checklist Main Cable"
      description="Isi nilai tegangan (Volt) pada masing-masing fase untuk setiap panel. Kosongkan jika panel tidak tersedia di area ini."
    >
      <FrmTsm004Form
        reportCode={draft.reportCode}
        areaCode={area.code}
        areaName={area.name}
        periodKey={periodKey}
        watermarkUserLabel={
          user ? `${user.name} (${user.NIK})` : session.userId
        }
        watermarkUserRole={user?.role ?? session.role}
        submitAction={submitFrmTsm004Checklist}
      />
    </ReportFlowShell>
  )
}