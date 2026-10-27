import { Suspense } from "react"
import { FrmMed003Form } from "@/components/es-dashboard/frm-med-003-form"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { getUserFullWorkPermit } from "@/lib/actions/work-permit"

export const dynamic = "force-dynamic"

type WorkPermitPageProps = {
  searchParams: Promise<{
    next?: string
    source?: string
    view?: string
    mode?: string
    permitCode?: string
    kegiatan?: string
    lokasi?: string
    area?: string
    areaName?: string
    room?: string
    roomName?: string
    areaId?: string
    roomId?: string
    taskId?: string
  }>
}

export default async function WorkPermitPage({
  searchParams,
}: WorkPermitPageProps) {
  const [params, session] = await Promise.all([searchParams, getSession()])

  let userName = ""
  let branchName = ""

  if (typeof session?.userId === "string") {
    const user = await getPrisma().user.findUnique({
      where: { NIK: session.userId },
      select: { name: true, branchName: true },
    })
    if (user) {
      userName = user.name
      branchName = user.branchName || ""
    }
  }

  const isFromTodo = params.source === "todo" || params.next === "dashboard"
  const isFromNonRoutine = params.source === "non-routine" || params.next === "select"

  // 1. Kegiatan / Pekerjaan default
  let resolvedKegiatan = params.kegiatan || ""
  if (!resolvedKegiatan) {
    if (isFromTodo) {
      resolvedKegiatan = "Checklist Rutinan"
    } else if (isFromNonRoutine) {
      resolvedKegiatan = "Checklist & Pemeliharaan Non-Rutin"
    }
  }

  // 2. Area & Room context resolution
  let areaText = params.area || params.areaName || ""
  let roomText = params.room || params.roomName || ""

  if (params.taskId) {
    const task = await getPrisma().checklistTask.findUnique({
      where: { id: params.taskId },
      include: {
        assignment: {
          include: {
            room: { include: { area: true } },
            equipment: { include: { room: { include: { area: true } } } },
          },
        },
      },
    })
    if (task) {
      const room = task.assignment.room || task.assignment.equipment?.room
      const area = room?.area
      if (area?.name && !areaText) areaText = area.name
      if (room?.name && !roomText) roomText = room.name
      if (!params.kegiatan && isFromTodo) {
        const targetName = task.assignment.equipment?.name || task.assignment.room?.name
        resolvedKegiatan = targetName ? `Checklist Rutinan - ${targetName}` : "Checklist Rutinan"
      }
    }
  } else {
    if (params.areaId && !areaText) {
      const areaRecord = await getPrisma().area.findUnique({
        where: { id: params.areaId },
        select: { name: true },
      })
      if (areaRecord) areaText = areaRecord.name
    }
    if (params.roomId && !roomText) {
      const roomRecord = await getPrisma().room.findUnique({
        where: { id: params.roomId },
        select: { name: true, area: { select: { name: true } } },
      })
      if (roomRecord) {
        roomText = roomRecord.name
        if (!areaText && roomRecord.area?.name) areaText = roomRecord.area.name
      }
    }
  }

  // 3. Lokasi Pekerjaan default: [Branch] - [Area] - [Ruang]
  let resolvedLokasi = params.lokasi || ""
  if (!resolvedLokasi) {
    const parts: string[] = []
    if (branchName) parts.push(branchName)
    if (areaText && !parts.some((p) => p.toLowerCase().includes(areaText.toLowerCase()))) {
      parts.push(areaText)
    }
    if (roomText) parts.push(roomText)
    resolvedLokasi = parts.join(" - ") || branchName || ""
  }

  const userNik = typeof session?.userId === "string" ? session.userId : undefined
  const fullPermit = await getUserFullWorkPermit(userNik, params.permitCode)

  const isExplicitReadonly = params.view === "readonly"
  const isExplicitNew = params.mode === "new"

  // Tampilkan Read-Only view jika:
  // 1. Parameter eksplisit view=readonly, ATAU
  // 2. User sudah memiliki izin kerja APPROVED dan tidak sedang dalam mode 'new'
  const showReadOnlyView = !isExplicitNew && (isExplicitReadonly || fullPermit?.status === "APPROVED")

  return (
    <ReportFlowShell
      eyebrow="SAT/FRM/MED/003"
      title={showReadOnlyView ? "Detail Izin Kerja (Read-Only)" : "Form Izin Kerja"}
      description={
        showReadOnlyView
          ? "Dokumen resmi izin kerja K3 teknisi yang aktif dan terdaftar di database."
          : "Lengkapi izin kerja (SMK3) sebelum melaksanakan checklist atau perbaikan non-rutin."
      }
      maxWidth="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl sm:px-6 md:px-8"
    >
      <Suspense fallback={<div className="p-4 text-center text-sm text-gray-500">Memuat formulir...</div>}>
        <FrmMed003Form
          userNik={userNik}
          defaultUserName={userName}
          defaultUserBranch={branchName}
          defaultKegiatan={resolvedKegiatan}
          defaultLokasi={resolvedLokasi}
          nextPath={params.next}
          isReadOnly={showReadOnlyView}
          initialData={fullPermit as any}
        />
      </Suspense>
    </ReportFlowShell>
  )
}
