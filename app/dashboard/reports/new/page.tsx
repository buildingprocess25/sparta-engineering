import { NewReportFlow } from "@/components/es-dashboard/new-report-flow"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"

export default function NewReportPage() {
  return (
    <ReportFlowShell
      eyebrow="LAPORAN BARU"
      title="Mulai Laporan"
      description="Tentukan kebutuhan Form Ijin Kerja lalu pilih jalur laporan yang akan dibuat."
    >
      <NewReportFlow />
    </ReportFlowShell>
  )
}
