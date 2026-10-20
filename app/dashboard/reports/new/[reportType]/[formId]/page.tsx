import { SharedChecklistForm } from "@/components/es-dashboard/shared-checklist-form"
import { FrmTsm004Form } from "@/components/es-dashboard/frm-tsm-004-form"
import { FrmTs016Form } from "@/components/es-dashboard/frm-ts-016-form"
import { FrmTsm001Form } from "@/components/es-dashboard/frm-tsm-001-form"
import { FrmTsm006Form } from "@/components/es-dashboard/frm-tsm-006-form"
import { FrmTsm007Form } from "@/components/es-dashboard/frm-tsm-007-form"
import { FrmTs062Form } from "@/components/es-dashboard/frm-ts-062-form"
import { FrmTs043Form } from "@/components/es-dashboard/frm-ts-043-form"
import { FrmTs045Form } from "@/components/es-dashboard/frm-ts-045-form"
import { FrmTs029Form } from "@/components/es-dashboard/frm-ts-029-form"
import { FrmTs022Form } from "@/components/es-dashboard/frm-ts-022-form"
import { FrmTsm013Form } from "@/components/es-dashboard/frm-tsm-013-form"
import { FrmTs064Form } from "@/components/es-dashboard/frm-ts-064-form"
import { FrmTsm008Form } from "@/components/es-dashboard/frm-tsm-008-form"
import { FrmTs063Form } from "@/components/es-dashboard/frm-ts-063-form"
import { FrmTs041Form } from "@/components/es-dashboard/frm-ts-041-form"
import { FrmTs028Form } from "@/components/es-dashboard/frm-ts-028-form"
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
    taskId?: string
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
    title: "Checklist Bangunan & Penunjang / Pompa",
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
  "frm-ts-041": {
    eyebrow: "FRM_TS_041",
    title: "Checklist Conveyor",
    description: "Inspeksi pemeliharaan rutin unit conveyor.",
  },
  "frm-ts-063": {
    eyebrow: "FRM_TS_063",
    title: "Checklist Exhaust Fan",
    description: "Inspeksi pemeliharaan rutin unit exhaust fan.",
  },
  "frm-ts-022": {
    eyebrow: "FRM_TS_022",
    title: "Checklist Genset",
    description: "Inspeksi pemeliharaan operasional genset.",
  },
  "frm-ts-029": {
    eyebrow: "FRM_TS_029",
    title: "Checklist Forklift Monthly",
    description: "Inspeksi bulanan unit forklift.",
  },
  "frm-tsm-013": {
    eyebrow: "FRM_TSM_013",
    title: "Checklist Water Recycle",
    description: "Inspeksi pemeliharaan peralatan instalasi daur ulang air (water recycle).",
  },
  "frm-ts-064": {
    eyebrow: "FRM_TS_064",
    title: "Checklist Table Lifter Monthly",
    description: "Inspeksi bulanan unit table lifter gudang.",
  },
  "frm-tsm-008": {
    eyebrow: "FRM_TSM_008",
    title: "Checklist Perawatan Unit Sewa",
    description: "Inspeksi pemeliharaan rutin peralatan unit sewa di warehouse/depo/bulky.",
  },
  "frm-ts-028": {
    eyebrow: "FRM_TS_028",
    title: "Checklist Baterai Bulanan",
    description: "Inspeksi bulanan baterai forklift & pallet mover: 14 item inspeksi fisik dan pengukuran B.J serta tegangan statis per sel.",
  },
  "frm-ts-068": {
    eyebrow: "FRM_TS_028",
    title: "Checklist Baterai Bulanan",
    description: "Inspeksi bulanan baterai forklift & pallet mover: 14 item inspeksi fisik dan pengukuran B.J serta tegangan statis per sel.",
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

  let areaId = queryParams.areaId
  let roomId = queryParams.roomId || null
  let roomName = queryParams.roomName
  let selectedPeriod = queryParams.period as ValidPeriod | undefined
  let equipmentId: string | undefined = undefined

  // Jika datang dari Tugas Rutin (To-Do List), auto-resolve data terkait
  if (queryParams.taskId) {
    const task = await getPrisma().checklistTask.findUnique({
      where: { id: queryParams.taskId },
      include: {
        assignment: {
          include: {
            equipment: true,
            room: true,
          },
        },
      },
    })

    if (task) {
      if (!selectedPeriod) {
        selectedPeriod = task.assignment.period as ValidPeriod
      }
      if (task.assignment.room) {
        roomId = roomId || task.assignment.room.id
        roomName = roomName || task.assignment.room.name
        areaId = areaId || task.assignment.room.areaId
      } else if (task.assignment.equipment) {
        equipmentId = task.assignment.equipment.id
        roomName =
          roomName ||
          `${task.assignment.equipment.name}${task.assignment.equipment.unitNo ? ` Unit ${task.assignment.equipment.unitNo}` : ""}`.trim()
        roomId = roomId || task.assignment.equipment.roomId || null
        areaId = areaId || task.assignment.equipment.areaId || undefined
      }
    }
  }

  // Fallback areaId jika tugas belum terhubung ke area spesifik
  if (!areaId) {
    const defaultArea = await getPrisma().area.findFirst({
      where: { isActive: true },
      orderBy: { code: "asc" },
    })
    if (defaultArea) areaId = defaultArea.id
  }

  if (
    !areaId ||
    !selectedPeriod ||
    !validPeriods.includes(selectedPeriod)
  ) {
    return unavailable(
      "Periode belum dipilih",
      "Pilih area, ruangan, dan periode checklist yang valid.",
      meta.eyebrow,
    )
  }

  const [area, user] = await Promise.all([
    getPrisma().area.findUnique({
      where: { id: areaId },
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

  const existingReport = queryParams.taskId
    ? await getPrisma().checklistReport.findFirst({
        where: {
          taskId: queryParams.taskId,
        },
        select: { id: true, status: true },
      })
    : await getPrisma().checklistReport.findFirst({
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
        "Laporan checklist untuk tugas / ruangan ini sudah pernah disubmit pada periode ini.",
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
      taskId: queryParams.taskId || null,
      equipmentId: equipmentId || null,
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
      title={roomName ? `Checklist ${roomName}` : meta.title}
      description={isRepair && formId !== "frm-tsm-004" ? "Pilih item yang rusak dan wajib sertakan foto." : meta.description}
    >
      {formId === "frm-tsm-001" ? (
        <FrmTsm001Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-029" ? (
        <FrmTs029Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-022" ? (
        <FrmTs022Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-tsm-013" ? (
        <FrmTsm013Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-064" ? (
        <FrmTs064Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-tsm-008" ? (
        <FrmTsm008Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-063" ? (
        <FrmTs063Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-041" ? (
        <FrmTs041Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          periodKey={periodKey}
          watermarkUserLabel={
            user ? `${user.name} (${user.NIK})` : session.userId
          }
          watermarkUserRole={user?.role ?? session.role}
          formCode={formCode}
          isRepairMode={isRepair}
          submitAction={submitChecklistAction}
        />
      ) : formId === "frm-ts-028" || formId === "frm-ts-068" ? (
        <FrmTs028Form
          reportCode={draft.reportCode}
          areaCode={area.code}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
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
          roomName={roomName}
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
