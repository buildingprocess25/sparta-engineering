import { SharedChecklistForm } from "@/components/es-dashboard/shared-checklist-form"
import { FrmTsm004Form } from "@/components/es-dashboard/frm-tsm-004-form"
import { FrmTs016Form } from "@/components/es-dashboard/frm-ts-016-form"
import { FrmTsm001Form } from "@/components/es-dashboard/frm-tsm-001-form"
import { FrmTsm006Form } from "@/components/es-dashboard/frm-tsm-006-form"
import { FrmTsm007Form } from "@/components/es-dashboard/frm-tsm-007-form"
import { FrmTs062Form } from "@/components/es-dashboard/frm-ts-062-form"
import { FrmTs043Form } from "@/components/es-dashboard/frm-ts-043-form"
import { FrmTs045Form } from "@/components/es-dashboard/frm-ts-045-form"
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
    roomId?: string
    roomName?: string
    period?: string
    workPermit?: string
    reset?: string
  }>
}

const FORM_META: Record<string, { eyebrow: string; title: string; description: string }> = {
  "frm-tsm-001": {
    eyebrow: "FRM_TSM_001",
    title: "Checklist Test ATS & Pemantauan Genset",
    description: "Pemantauan pengoperasian genset dan pengujian fungsi Automatic Transfer Switch (ATS).",
  },
  "frm-tsm-002": {
    eyebrow: "FRM_TSM_002",
    title: "Checklist Warehouse / Peralatan",
    description: "Pilih kondisi setiap item. Khusus item yang rusak wajib menyertakan foto sebagai bukti.",
  },
  "frm-tsm-003": {
    eyebrow: "FRM_TSM_003",
    title: "Checklist Ruangan",
    description: "Pilih kondisi setiap item. Khusus item yang rusak wajib menyertakan foto sebagai bukti.",
  },
  "frm-tsm-004": {
    eyebrow: "FRM_TSM_004",
    title: "Pemakaian Daya/KWH",
    description: "Isi data tegangan (R, S, T) secara akurat.",
  },
  "frm-tsm-005": {
    eyebrow: "FRM_TSM_005",
    title: "Checklist Pompa Air",
    description: "Pilih kondisi setiap item. Khusus item yang rusak wajib menyertakan foto sebagai bukti.",
  },
  "frm-ts-016": {
    eyebrow: "FRM_TS_016",
    title: "Checklist Pallet Mover Monthly",
    description: "Inspeksi bulanan pallet mover: 12 kategori komponen mekanikal, elektrikal, hidrolik & fungsional.",
  },
  "frm-tsm-006": {
    eyebrow: "FRM_TSM_006",
    title: "Checklist Hydrant",
    description: "Inspeksi mingguan, bulanan, dan 6-bulanan sistem proteksi kebakaran hydrant.",
  },
  "frm-ts-062": {
    eyebrow: "FRM_TS_062",
    title: "Checklist Hand Pallet",
    description: "Inspeksi bulanan hand pallet: identity unit, painting, body & structure, wheels, hydraulics, dan functional test.",
  },
  "frm-tsm-007": {
    eyebrow: "FRM_TSM_007",
    title: "Checklist Pembangkit Listrik Tenaga Surya (PLTS)",
    description: "Inspeksi 1 bulanan dan 3 bulanan sistem panel surya: panel atap, DC protection, inverter, combiner, komunikasi, pembersihan panel, dan jalur kabel.",
  },
  "frm-ts-043": {
    eyebrow: "FRM_TS_043",
    title: "Checklist Forklift Weekly",
    description: "Inspeksi mingguan unit forklift: cleaning handle, dashboard, cooling fan, traction motor, motor pump, dan wheel.",
  },
  "frm-ts-045": {
    eyebrow: "FRM_TS_045",
    title: "Checklist Pallet Mover Weekly",
    description: "Inspeksi mingguan unit pallet mover: handle operation, access modul room, cooling fan, distribution panel, traction motor, motor pump, dan wheel.",
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
  
  const validPeriods = ["WEEKLY", "MONTHLY", "QUARTERLY", "SEMESTER"] as const
  type ValidPeriod = (typeof validPeriods)[number]

  if (
    !queryParams.areaId ||
    !queryParams.period ||
    !validPeriods.includes(queryParams.period as ValidPeriod)
  ) {
    return unavailable(
      "Periode belum dipilih",
      "Pilih area, ruangan, dan periode checklist yang valid.",
      meta.eyebrow,
    )
  }

  const selectedPeriod = queryParams.period as ValidPeriod
  const roomId = queryParams.roomId || null

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
      meta.eyebrow,
    )
  }

  const periodKey = getCurrentPeriodKey(selectedPeriod)

  const formCode =
    reportType === "repair"
      ? `${formId.replace(/-/g, "_").toUpperCase()}_REPAIR`
      : formId.replace(/-/g, "_").toUpperCase()

  const existingReport = await getPrisma().checklistReport.findFirst({
    where: {
      areaId: area.id,
      roomId,
      period: selectedPeriod,
      periodKey,
      formCode,
    },
    select: { id: true, status: true },
  })

  if (existingReport && existingReport.status !== "DRAFT") {
    if (queryParams.reset === "true") {
      // Mode testing: izinkan submit berulang dengan membersihkan laporan sebelumnya jika dimulai dari area picker
      await getPrisma().checklistItem.deleteMany({
        where: {
          reportId: existingReport.id,
        },
      })
      await getPrisma().checklistReport.delete({
        where: {
          id: existingReport.id,
        },
      })
    } else {
      return unavailable(
        "Checklist Sudah Disubmit",
        "Laporan checklist untuk ruangan ini sudah pernah disubmit pada periode ini.",
        meta.eyebrow,
      )
    }
  }

  const draft = await reserveChecklistDraft(
    createPrismaChecklistDraftRepository(),
    {
      authorId: session.userId,
      areaId: area.id,
      roomId,
      areaCode: area.code,
      formCode: formCode,
      period: selectedPeriod,
      periodKey,
    },
  )

  const isRepair = reportType === "repair"

  return (
    <ReportFlowShell
      eyebrow={
        <>
          <span>{meta.eyebrow}</span>
          {isRepair && (
            <>
              <span className="text-white font-normal"> - </span>
              <span>PERBAIKAN</span>
            </>
          )}
        </>
      }
      title={queryParams.roomName ? `Checklist ${queryParams.roomName}` : meta.title}
      description={isRepair && formId !== "frm-tsm-004" ? "Pilih item yang rusak dan wajib sertakan foto." : meta.description}
    >
      {formId === "frm-tsm-001" ? (
        <FrmTsm001Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-tsm-004" ? (
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
      ) : formId === "frm-ts-016" ? (
        <FrmTs016Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-tsm-006" ? (
        <FrmTsm006Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-062" ? (
        <FrmTs062Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-tsm-007" ? (
        <FrmTsm007Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-043" ? (
        <FrmTs043Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-045" ? (
        <FrmTs045Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={queryParams.roomName ? `${area.name} - ${queryParams.roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : (
        <SharedChecklistForm
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={area.name}
          roomName={queryParams.roomName}
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
