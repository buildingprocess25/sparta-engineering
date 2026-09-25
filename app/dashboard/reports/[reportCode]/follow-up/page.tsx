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
      authorId: session.userId,
    },
  })

  if (!report) {
    notFound()
  }

  const payload = report.checklistPayload as unknown as ChecklistPayload
  const items = payload.items || []

  const needs014 = items.some(
    (item) => item.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
  )
  const needs065 = items.some(
    (item) => item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
  )

  if (!needs014 && !needs065) {
    redirect("/dashboard/reports")
  }

  return (
    <ReportFlowShell
      eyebrow="TINDAK LANJUT"
      title="Form Lanjutan"
      description="Lengkapi detail perbaikan untuk item yang rusak."
    >
      <FollowUpFormsEditor reportCode={reportCode} payload={payload} />
    </ReportFlowShell>
  )
}

