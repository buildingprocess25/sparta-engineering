import { redirect } from "next/navigation"

import { ReportAreaPicker } from "@/components/es-dashboard/report-area-picker"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"
import { getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"

export const dynamic = "force-dynamic"

type ChecklistAreaPageProps = {
  searchParams: Promise<{
    catalog?: string
  }>
}

export default async function ChecklistAreaPage({
  searchParams,
}: ChecklistAreaPageProps) {
  const [user, { catalog }] = await Promise.all([getWorkPermitUser(), searchParams])
  if (user?.role !== "ES" || !(await getActiveWorkPermit(user))) redirect("/dashboard/reports/new")

  const { areas, areaIssue } = await getEsDashboardFlowOptions()
  const isGeneralCatalog = catalog === "general"

  return (
    <ReportFlowShell
      eyebrow="CHECKLIST"
      title={isGeneralCatalog ? "General Checklist" : "Pilih Area Checklist"}
      description={isGeneralCatalog ? "Cari form checklist bulanan berdasarkan area dan ruangan." : "Pilih area, periode, dan ruangan untuk membuka form checklist."}
    >
      <ReportAreaPicker
        areas={areas}
        areaIssue={areaIssue}
        reportType="checklist"
        monthlyOnly={isGeneralCatalog}
      />
    </ReportFlowShell>
  )
}
