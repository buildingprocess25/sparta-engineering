import { SharedChecklistForm } from "@/components/es-dashboard/shared-checklist-form"
import { FrmTsm004Form } from "@/components/es-dashboard/frm-tsm-004-form"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getCurrentPeriodKey } from "@/lib/date-utils"
import { getPrisma } from "@/lib/prisma"
import { reserveChecklistDraft } from "@/lib/reports/drive-draft-service"
import { createPrismaChecklistDraftRepository } from "@/lib/reports/drive-draft-prisma-repository"
import { getSession } from "@/lib/session"
import { submitChecklistAction } from "@/lib/actions/checklist"

export const dynamic = "force-dynamic"

type DynamicFormPageProps = {
  params: Promise<{
    reportType: string
    formId: string
  }>
  searchParams: Promise<{
    areaId?: string
    period?: string
    workPermit?: string
  }>
}

const FORM_META: Record<string, { eyebrow: string; title: string; description: string }> = {
  "frm-tsm-002": {
    eyebrow: "FRM_TSM_002",
    title: "Checklist Warehouse / Peralatan",
    description: "Pilih kondisi setiap item. Baik dan rusak wajib memakai foto sebagai bukti.",
  },
  "frm-tsm-003": {
    eyebrow: "FRM_TSM_003",
    title: "Checklist Ruangan",
    description: "Pilih kondisi setiap item. Baik dan rusak wajib memakai foto sebagai bukti.",
  },
  "frm-tsm-004": {
    eyebrow: "FRM_TSM_004",
    title: "Pemakaian Daya/KWH",
    description: "Isi data tegangan (R, S, T) secara akurat.",
  },
  "frm-tsm-005": {
    eyebrow: "FRM_TSM_005",
    title: "Checklist Pompa Air",
    description: "Pilih kondisi setiap item. Baik dan rusak wajib memakai foto sebagai bukti.",
  },
}

function unavailable(title: string, description: string, eyebrow?: string) {
  return (
    <ReportFlowShell
      eyebrow={eyebrow || "Form"}
      title={title}
      description={description}
    >
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 text-sm leading-6 text-[#686868] shadow-sm">
        Kembali ke pemilihan area untuk membuka form checklist yang tersedia.
      </div>
    </ReportFlowShell>
  )
}

export default async function DynamicFormPage({
  params,
  searchParams,
}: DynamicFormPageProps) {
  const [routeParams, queryParams, session] = await Promise.all([params, searchParams, getSession()])
  
  const { reportType, formId } = routeParams
  
  if (reportType !== "checklist" && reportType !== "repair") {
    return unavailable("Tipe laporan tidak valid", "Jalur yang Anda pilih tidak valid.")
  }
  
  const meta = FORM_META[formId]
  if (!meta) {
    return unavailable("Form tidak dikenali", "Form ID yang dipilih tidak didukung.")
  }

  if (
    typeof session?.userId !== "string" ||
    typeof session.role !== "string" ||
    session.role !== "ES"
  ) {
    return unavailable(
      "Sesi tidak valid",
      "Masuk sebagai Engineering Support untuk mengisi checklist.",
      meta.eyebrow
    )
  }
  
  if (!queryParams.areaId || queryParams.period !== "MONTHLY") {
    return unavailable(
      "Form belum tersedia",
      `${meta.eyebrow} hanya tersedia untuk checklist Monthly pada tahap ini.`,
      meta.eyebrow
    )
  }

  const [area, user] = await Promise.all([
    getPrisma().area.findUnique({
      where: { id: queryParams.areaId },
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
      "Data area checklist belum tersedia atau sudah tidak aktif.",
      meta.eyebrow
    )
  }

  const periodKey = getCurrentPeriodKey("MONTHLY")
  
  const formCode = reportType === "repair" 
    ? `${formId.replace(/-/g, "_").toUpperCase()}_REPAIR` 
    : formId.replace(/-/g, "_").toUpperCase()

  const existingReport = await getPrisma().checklistReport.findUnique({
    where: {
      areaId_period_periodKey_formCode: {
        areaId: area.id,
        period: "MONTHLY",
        periodKey,
        formCode,
      }
    },
    select: { status: true }
  })

  if (existingReport && existingReport.status !== "DRAFT") {
    return unavailable(
      "Laporan sudah dibuat",
      "Laporan untuk area dan periode ini sudah pernah disubmit.",
      meta.eyebrow
    )
  }

  const draft = await reserveChecklistDraft(
    createPrismaChecklistDraftRepository(),
    {
      authorId: session.userId,
      areaId: area.id,
      areaCode: area.code,
      formCode: formCode,
      period: "MONTHLY",
      periodKey,
    }
  )

  const isRepair = reportType === "repair"

  return (
    <ReportFlowShell
      eyebrow={`${meta.eyebrow}${isRepair ? " - PERBAIKAN" : ""}`}
      title={meta.title}
      description={isRepair && formId !== "frm-tsm-004" ? "Pilih item yang rusak dan wajib sertakan foto." : meta.description}
    >
      {formId === "frm-tsm-004" ? (
        <FrmTsm004Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode as "FRM_TSM_004" | "FRM_TSM_004_REPAIR"}
          submitAction={submitChecklistAction}
        />
      ) : (
        <SharedChecklistForm
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          submitAction={submitChecklistAction}
        />
      )}
    </ReportFlowShell>
  )
}
