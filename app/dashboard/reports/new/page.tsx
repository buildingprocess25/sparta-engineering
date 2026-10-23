import { NewReportFlow } from "@/components/es-dashboard/new-report-flow"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getSession } from "@/lib/session"
import { getTodayWorkPermitStatus } from "@/lib/actions/work-permit"

export default async function NewReportPage() {
  const session = await getSession()
  const userNik = typeof session?.userId === "string" ? session.userId : undefined
  const workPermitStatus = await getTodayWorkPermitStatus(userNik)

  return (
    <ReportFlowShell
      eyebrow="LAPORAN BARU"
      title="Mulai Laporan"
      description="Tentukan kebutuhan Form Ijin Kerja lalu pilih jalur laporan yang akan dibuat."
    >
      <NewReportFlow userNik={userNik} initialWorkPermitStatus={workPermitStatus} />
    </ReportFlowShell>
  )
}
