import { ReportAreaPicker } from "@/components/es-dashboard/report-area-picker"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"

export const dynamic = "force-dynamic"

type ChecklistAreaPageProps = {
  searchParams: Promise<{
    workPermit?: string
  }>
}

export default async function ChecklistAreaPage({
  searchParams,
}: ChecklistAreaPageProps) {
  const [{ areas, areaIssue }, params] = await Promise.all([
    getEsDashboardFlowOptions(),
    searchParams,
  ])

  return (
    <ReportFlowShell
      eyebrow="CHECKLIST"
      title="Pilih Area Checklist"
      description="Area menentukan family form dan periode checklist yang tersedia."
    >
      <ReportAreaPicker
        areas={areas}
        areaIssue={areaIssue}
        reportType="checklist"
        workPermit={params.workPermit}
      />
    </ReportFlowShell>
  )
}
