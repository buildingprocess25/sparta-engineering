import { redirect } from "next/navigation"

import { ReportAreaPicker } from "@/components/es-dashboard/report-area-picker"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"
import { getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"

export const dynamic = "force-dynamic"

export default async function RepairAreaPage() {
  const user = await getWorkPermitUser()
  if (user?.role !== "ES" || !(await getActiveWorkPermit(user))) redirect("/dashboard/reports/new")

  const { areas, areaIssue } = await getEsDashboardFlowOptions()

  return (
    <ReportFlowShell
      eyebrow="PERBAIKAN / TEMUAN"
      title="Pilih Area Temuan"
      description="Pilih lokasi temuan ES atau arahan AHO sebelum masuk ke form detail."
    >
      <ReportAreaPicker
        areas={areas}
        areaIssue={areaIssue}
        reportType="repair"
      />
    </ReportFlowShell>
  )
}
