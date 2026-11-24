import { notFound, redirect } from "next/navigation"
import Link from "next/link"

import { getPrisma } from "@/lib/prisma"
import type { ChecklistPayload } from "@/lib/checklists/payload"
import { ACTIVE_WORK_PERMIT_REQUIRED, getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { FollowUpFormsEditor } from "@/components/es-dashboard/follow-up-forms-editor"
import { ReportCompletionSuccess } from "@/components/es-dashboard/report-completion-success"
import { Button } from "@/components/ui/button"
import { FORM_014, FORM_065, getReportItems, needsChecklistFollowUp } from "@/lib/reports/checklist-follow-up"
import { editableChecklistOwner } from "@/lib/reports/checklist-submission"

export default async function FollowUpOrchestratorPage({
  params,
}: {
  params: Promise<{ reportCode: string }>
}) {
  const { reportCode } = await params
  const detailHref = `/dashboard/reports/${encodeURIComponent(reportCode)}`

  const user = await getWorkPermitUser()
  if (user?.role !== "ES") {
    redirect("/login")
  }

  const report = await getPrisma().checklistReport.findUnique({
    where: {
      reportCode,
      ...editableChecklistOwner(user.NIK),
    },
    include: {
      area: true,
      room: true,
      equipment: true,
      author: true,
      task: {
        include: {
          assignment: true,
        },
      },
    },
  })

  if (!report) {
    notFound()
  }

  if (report.status === "DRAFT") {
    return (
      <ReportFlowShell
        eyebrow="CHECKLIST"
        title="Laporan belum terkirim"
        description="Laporan ini masih Draft. Kembali ke form checklist, lalu klik Simpan & Kirim Checklist."
      >
        <p className="text-sm">Nomor laporan: {reportCode}</p>
      </ReportFlowShell>
    )
  }

  const payload = (report.checklistPayload ?? {}) as unknown as ChecklistPayload & {
    followUpCompleted?: boolean
    followUp014Summary?: { totalCost: number }
    followUp065Summary?: { itemCount: number }
  }
  const items = getReportItems(payload)

  const needs014 = items.some(
    (item) => item.repairForm === FORM_014
  )
  const needs065 = items.some(
    (item) => item.repairForm === FORM_065
  )

  const isRoutine = Boolean(report.taskId)
  const targetName =
    report.equipment?.name ||
    report.room?.name ||
    report.area?.name ||
    "Objek Maintenance"

  const { followUp014Summary, followUp065Summary } = payload
  const isRevision = report.status === "NEEDS_REVISION"
  const needsFollowUp = needsChecklistFollowUp(payload)
  if (isRevision && !needsFollowUp) redirect(detailHref)

  if (!needsFollowUp) {
    return (
      <ReportFlowShell
        eyebrow="TINDAK LANJUT"
        title="Status Penyelesaian Laporan"
        description="Konfirmasi penyelesaian checklist dan form tindak lanjut."
      >
        <ReportCompletionSuccess
          reportCode={reportCode}
          isRoutine={isRoutine}
          targetName={targetName}
          branchName={report.author?.branchName || "Cabang"}
          authorName={report.author?.name || "ES"}
          status={report.status}
          submittedAt={report.updatedAt.toISOString()}
          followUpType={
            followUp014Summary || needs014
              ? "014"
              : followUp065Summary || needs065
                ? "065"
                : "NONE"
          }
          followUpSummary={{
            totalCost014: followUp014Summary?.totalCost,
            itemsCount065: followUp065Summary?.itemCount,
          }}
        />
      </ReportFlowShell>
    )
  }

  if (report.status !== "PENDING_COORD" && !isRevision) {
    redirect(detailHref)
  }

  if (!(await getActiveWorkPermit(user))) {
    return (
      <ReportFlowShell
        eyebrow="TINDAK LANJUT"
        title="Izin Kerja K3 diperlukan"
        description={ACTIVE_WORK_PERMIT_REQUIRED}
        backHref={detailHref}
        backLabel="Kembali ke Detail Laporan"
      >
        <Button nativeButton={false} size="lg" render={<Link href="/dashboard/reports/new/work-permit" />}>
          Buka Izin Kerja
        </Button>
      </ReportFlowShell>
    )
  }

  return (
    <ReportFlowShell
      eyebrow="TINDAK LANJUT"
      title="Form Tindak Lanjut Perbaikan"
      description="Lengkapi rincian estimasi biaya atau spare part untuk item yang rusak."
      backHref={detailHref}
      backLabel="Kembali ke Detail Laporan"
    >
      <FollowUpFormsEditor
        reportCode={reportCode}
        version={report.updatedAt.toISOString()}
        isRevision={isRevision}
        payload={{ ...payload, items }}
        context={{
          branchName: report.author?.branchName || "HO",
          authorName: report.author?.name || "ES",
          areaName: report.area?.name || "Area",
          areaCode: report.area?.code || "",
          targetName,
          isRoutine,
          createdAt: report.createdAt.toISOString(),
          equipment: report.equipment
            ? {
                name: report.equipment.name,
                unitNo: report.equipment.unitNo,
                code: report.equipment.code,
              }
            : undefined,
        }}
      />
    </ReportFlowShell>
  )
}
