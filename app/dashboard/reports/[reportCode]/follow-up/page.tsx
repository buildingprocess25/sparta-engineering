import { notFound, redirect } from "next/navigation"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { ChecklistPayload } from "@/lib/checklists/payload"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { FollowUpFormsEditor } from "@/components/es-dashboard/follow-up-forms-editor"
import { ReportCompletionSuccess } from "@/components/es-dashboard/report-completion-success"

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

  const isRoutine = Boolean(report.taskId)
  const targetName =
    report.equipment?.name ||
    report.room?.name ||
    report.area?.name ||
    "Objek Maintenance"

  const anyPayload = payload as any
  const isFollowUpCompleted = Boolean(anyPayload?.followUpCompleted)
  const followUp014Summary = anyPayload?.followUp014Summary
  const followUp065Summary = anyPayload?.followUp065Summary

  if (isFollowUpCompleted || (!needs014 && !needs065)) {
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
          submittedAt={report.updatedAt ? report.updatedAt.toISOString() : undefined}
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
          targetName: targetName,
          isRoutine: isRoutine,
          createdAt: report.createdAt.toISOString(),
        }}
      />
    </ReportFlowShell>
  )
}

