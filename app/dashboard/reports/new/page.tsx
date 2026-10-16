import { NewReportFlow } from "@/components/es-dashboard/new-report-flow"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getSession } from "@/lib/session"

export default async function NewReportPage() {
  const session = await getSession()
  const userNik = typeof session?.userId === "string" ? session.userId : undefined

  return (
    <ReportFlowShell
      eyebrow="LAPORAN BARU"
      title="Mulai Laporan"
      description="Tentukan kebutuhan Form Ijin Kerja lalu pilih jalur laporan yang akan dibuat."
    >
      <NewReportFlow userNik={userNik} />
    </ReportFlowShell>
  )
}
