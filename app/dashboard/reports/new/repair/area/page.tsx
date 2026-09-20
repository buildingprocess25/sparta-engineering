import { ReportAreaPicker } from "@/components/es-dashboard/report-area-picker"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"

export const dynamic = "force-dynamic"

type RepairAreaPageProps = {
  searchParams: Promise<{
    workPermit?: string
  }>
}

export default async function RepairAreaPage({
  searchParams,
}: RepairAreaPageProps) {
  const [{ areas, areaIssue }, params] = await Promise.all([
    getEsDashboardFlowOptions(),
    searchParams,
  ])

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
        workPermit={params.workPermit}
      />
    </ReportFlowShell>
  )
}
