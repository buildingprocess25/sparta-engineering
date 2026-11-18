import { Suspense } from "react"
import { Download } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { notFound, redirect } from "next/navigation"
import { FrmMed003Form } from "@/components/es-dashboard/frm-med-003-form"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getPrisma } from "@/lib/prisma"
import { getUserFullWorkPermit } from "@/lib/actions/work-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { getFinalWorkPermitApproval } from "@/lib/work-permits/final-approval"
import { getWorkPermitPdfHref } from "@/lib/work-permits/links"
import { getWorkPermitHistoryHref } from "@/lib/work-permits/history"

export const dynamic = "force-dynamic"

type WorkPermitPageProps = {
  searchParams: Promise<{
    next?: string
    source?: string
    view?: string
    mode?: string
    permitCode?: string
    historyPage?: string | string[]
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
  const [params, user] = await Promise.all([searchParams, getWorkPermitUser()])
  if (!user) redirect("/login")
  if (user.role !== "ES") redirect("/dashboard")

  const { NIK: userNik, name: userName, branchName } = user
  const fullPermit = await getUserFullWorkPermit(userNik, params.permitCode)
  if (params.permitCode && !fullPermit) notFound()

  const historyHref = params.permitCode && params.source === "history"
    ? getWorkPermitHistoryHref(params.historyPage)
    : undefined

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
      where: { id: params.taskId, assignment: { userNik } },
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

  const isExplicitReadonly = params.view === "readonly"
  const isExplicitNew = params.mode === "new"

  const showReadOnlyView = Boolean(params.permitCode) ||
    (!isExplicitNew && (isExplicitReadonly || fullPermit?.status === "APPROVED"))

  return (
    <ReportFlowShell
      eyebrow="SAT/FRM/MED/003"
      title={showReadOnlyView ? "Detail Izin Kerja (Read-Only)" : "Form Izin Kerja"}
      description={
        showReadOnlyView
          ? "Dokumen izin kerja K3 yang tersimpan beserta status pengajuannya."
          : "Lengkapi izin kerja (SMK3) sebelum melaksanakan checklist atau perbaikan non-rutin."
      }
      maxWidth="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl sm:px-6 md:px-8"
      backHref={historyHref}
      backLabel={historyHref ? "Kembali ke Riwayat" : undefined}
    >
      {showReadOnlyView && fullPermit && getFinalWorkPermitApproval(fullPermit) && (
        <div className="permit-workspace mb-4">
          <a href={getWorkPermitPdfHref(fullPermit.permitCode)} className={buttonVariants({ size: "lg" })}>
            <Download data-icon="inline-start" /> Unduh PDF Izin Kerja
          </a>
        </div>
      )}
      <Suspense fallback={<div className="p-4 text-center text-sm text-gray-500">Memuat formulir...</div>}>
        <FrmMed003Form
          key={showReadOnlyView ? fullPermit?.id : "new"}
          userNik={userNik}
          defaultUserName={userName}
          defaultUserBranch={branchName}
          defaultKegiatan={resolvedKegiatan}
          defaultLokasi={resolvedLokasi}
          nextPath={params.next}
          isReadOnly={showReadOnlyView}
          initialData={fullPermit}
          historyHref={historyHref}
        />
      </Suspense>
    </ReportFlowShell>
  )
}
