import { redirect } from "next/navigation"

import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { WorkPermitHistoryList } from "@/components/es-dashboard/work-permit-history-list"
import { getPrisma } from "@/lib/prisma"
import { getApplicantWorkPermitScope } from "@/lib/work-permits/access"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { getWorkPermitHistoryPagination } from "@/lib/work-permits/history"

export default async function WorkPermitHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const [user, params] = await Promise.all([getWorkPermitUser(), searchParams])
  if (!user) redirect("/login")

  const where = getApplicantWorkPermitScope(user, user.NIK)
  if (!where) redirect("/dashboard")

  const workPermits = getPrisma().workPermit
  const count = await workPermits.count({ where })
  const { page, pageCount, skip, take } = getWorkPermitHistoryPagination(count, params.page)
  const permits = await workPermits.findMany({
    where,
    orderBy: [{ applicantSignedAt: "desc" }, { id: "desc" }],
    skip,
    take,
    select: {
      permitCode: true,
      kegiatan: true,
      lokasi: true,
      status: true,
      applicantSignedAt: true,
      safetyPayload: true,
      workDate: true,
    },
  })

  return (
    <ReportFlowShell
      eyebrow="SAT/FRM/MED/003"
      title="Riwayat Izin Kerja"
      description="Buka pengajuan untuk melihat dokumen dan keputusan Manager."
      backHref="/dashboard"
    >
      <WorkPermitHistoryList permits={permits} page={page} pageCount={pageCount} />
    </ReportFlowShell>
  )
}
