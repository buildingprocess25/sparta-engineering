import { notFound, redirect } from "next/navigation"

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
import { submitChecklistAction, submitChecklistRevisionAction } from "@/lib/actions/checklist"
import type { ChecklistPayload } from "@/lib/checklists/payload"
import { isFrmTsm001Payload } from "@/lib/checklists/payload-001"
import { isFrmTsm004Payload } from "@/lib/checklists/payload-004"
import { asPayloadRecord } from "@/lib/reports/checklist-follow-up"
import { editableChecklistOwner } from "@/lib/reports/checklist-submission"
import { getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"

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
    taskId?: string
    revision?: string
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
  const [routeParams, queryParams, user] = await Promise.all([params, searchParams, getWorkPermitUser()])
  
  const { reportType, formId } = routeParams
  
  if (reportType !== "checklist" && reportType !== "repair") {
    return unavailable("Tipe laporan tidak valid", "Jalur yang Anda pilih tidak valid.")
  }
  
  const meta = FORM_META[formId]
  if (!meta) {
    return unavailable("Form tidak dikenali", "Form ID yang dipilih tidak didukung.")
  }

  if (user?.role !== "ES") {
    return unavailable(
      "Sesi tidak valid",
      "Masuk sebagai Engineering Support untuk mengisi checklist.",
      meta.eyebrow
    )
  }
  const formCode = formId.replaceAll("-", "_").toUpperCase() + (reportType === "repair" ? "_REPAIR" : "")
  if (queryParams.revision !== undefined && (typeof queryParams.revision !== "string" || !queryParams.revision.trim())) notFound()
  const revision = queryParams.revision
    ? await getPrisma().checklistReport.findUnique({
        where: { reportCode: queryParams.revision, status: "NEEDS_REVISION", ...editableChecklistOwner(user.NIK) },
        include: {
          area: true, room: true, equipment: true,
          revisions: { where: { resubmittedAt: null }, select: { reason: true }, take: 1 },
        },
      })
    : null
  if (queryParams.revision && (!revision || (revision.formCode ?? asPayloadRecord(revision.checklistPayload).formCode) !== formCode)) {
    notFound()
  }
  if (!(await getActiveWorkPermit(user))) {
    redirect(revision
      ? `/dashboard/reports/${queryParams.revision}`
      : queryParams.taskId ? "/dashboard" : "/dashboard/reports/new")
  }

  let area: { id: string; code: string; name: string }
  let periodKey: string
  let reportCode: string
  let roomName: string | undefined

  if (revision && queryParams.revision) {
    const savedPeriodKey = revision.periodKey ?? asPayloadRecord(revision.checklistPayload).periodKey
    if (typeof savedPeriodKey !== "string" || !savedPeriodKey) notFound()

    area = revision.area
    periodKey = savedPeriodKey
    reportCode = queryParams.revision
    roomName = revision.equipment
      ? `${revision.equipment.name}${revision.equipment.unitNo ? ` Unit ${revision.equipment.unitNo}` : ""}`
      : revision.room?.name
  } else {
    const validPeriods = ["WEEKLY", "MONTHLY", "QUARTERLY", "SEMESTER"] as const
    type ValidPeriod = (typeof validPeriods)[number]

    let areaId = queryParams.areaId
    let roomId = queryParams.roomId || null
    roomName = queryParams.roomName
    let selectedPeriod = queryParams.period as ValidPeriod | undefined
    let equipmentId: string | undefined = undefined

    // Jika datang dari Tugas Rutin (To-Do List), auto-resolve data terkait
    if (queryParams.taskId) {
      const task = await getPrisma().checklistTask.findUnique({
        where: { id: queryParams.taskId, assignment: { userNik: user.NIK } },
        include: {
          assignment: {
            include: {
              equipment: true,
              room: true,
            },
          },
        },
      })

      if (!task) notFound()
      if (!selectedPeriod) {
        selectedPeriod = task.assignment.period
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

    const selectedArea = await getPrisma().area.findUnique({
      where: { id: areaId },
      select: { id: true, code: true, name: true },
    })

    if (!selectedArea) {
      return unavailable(
        "Area tidak ditemukan",
        "Data area checklist belum tersedia atau sudah tidak aktif.",
        meta.eyebrow,
      )
    }

    area = selectedArea
    periodKey = getCurrentPeriodKey(selectedPeriod)

    const existingReport = queryParams.taskId
      ? await getPrisma().checklistReport.findFirst({
          where: {
            taskId: queryParams.taskId,
          },
          select: { status: true },
        })
      : await getPrisma().checklistReport.findFirst({
          where: {
            areaId: area.id,
            roomId,
            period: selectedPeriod,
            periodKey,
            formCode,
          },
          select: { status: true },
        })

    if (existingReport && existingReport.status !== "DRAFT") {
      return unavailable(
        "Checklist Sudah Disubmit",
        "Laporan checklist untuk tugas / ruangan ini sudah pernah disubmit pada periode ini.",
        meta.eyebrow,
      )
    }

    const draft = await reserveChecklistDraft(
      createPrismaChecklistDraftRepository(),
      {
        authorId: user.NIK,
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
    reportCode = draft.reportCode
  }

  const savedPayload = revision?.checklistPayload
  const initialChecklist = revision ? savedPayload as unknown as ChecklistPayload : undefined
  const formProps = {
    reportCode,
    areaCode: area.code,
    periodKey,
    watermarkUserLabel: `${user.name} (${user.NIK})`,
    watermarkUserRole: user.role,
    submitAction: revision
      ? submitChecklistRevisionAction.bind(null, reportCode, revision.updatedAt.toISOString())
      : submitChecklistAction,
  }

  const isRepair = reportType === "repair"

  return (
    <ReportFlowShell
      backHref={revision ? `/dashboard/reports/${reportCode}` : undefined}
      backLabel={revision ? "Kembali ke Detail Laporan" : undefined}
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
      title={revision ? `Perbaiki Laporan ${reportCode}` : roomName ? `Checklist ${roomName}` : meta.title}
      description={isRepair && formId !== "frm-tsm-004" ? "Pilih item yang rusak dan wajib sertakan foto." : meta.description}
    >
      {revision && (
        <div className="mb-4 space-y-1 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-slate-800">
          <p className="font-semibold">{roomName || area.name} · {periodKey}</p>
          <p className="whitespace-pre-wrap break-words">{revision.revisions[0]?.reason ?? "Alasan revisi sebelumnya tidak tersimpan."}</p>
        </div>
      )}
      {formId === "frm-tsm-001" ? (
        <FrmTsm001Form
          {...formProps}
          initialPayload={isFrmTsm001Payload(savedPayload) ? savedPayload : undefined}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode as "FRM_TSM_001" | "FRM_TSM_001_REPAIR"}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-tsm-004" ? (
        <FrmTsm004Form
          {...formProps}
          initialPayload={isFrmTsm004Payload(savedPayload) ? savedPayload : undefined}
          formCode={formCode as "FRM_TSM_004" | "FRM_TSM_004_REPAIR"}
        />
      ) : formId === "frm-ts-016" ? (
        <FrmTs016Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-tsm-006" ? (
        <FrmTsm006Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-062" ? (
        <FrmTs062Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-tsm-007" ? (
        <FrmTsm007Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-043" ? (
        <FrmTs043Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-045" ? (
        <FrmTs045Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-029" ? (
        <FrmTs029Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-022" ? (
        <FrmTs022Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-tsm-013" ? (
        <FrmTsm013Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-064" ? (
        <FrmTs064Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-tsm-008" ? (
        <FrmTsm008Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-063" ? (
        <FrmTs063Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-041" ? (
        <FrmTs041Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : formId === "frm-ts-028" || formId === "frm-ts-068" ? (
        <FrmTs028Form
          {...formProps}
          initialPayload={initialChecklist}
          areaName={roomName ? `${area.name} - ${roomName}` : area.name}
          formCode={formCode}
          isRepairMode={isRepair}
        />
      ) : (
        <SharedChecklistForm
          {...formProps}
          initialPayload={initialChecklist}
          areaName={area.name}
          roomName={roomName}
          formCode={formCode}
        />
      )}
    </ReportFlowShell>
  )
}
