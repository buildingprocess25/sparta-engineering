import { Suspense } from "react"
import { FrmMed003Form } from "@/components/es-dashboard/frm-med-003-form"
import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

type WorkPermitPageProps = {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function WorkPermitPage({
  searchParams,
}: WorkPermitPageProps) {
  const [params, session] = await Promise.all([searchParams, getSession()])

  let userName = ""
  let branchName = ""

  if (typeof session?.userId === "string") {
    const user = await getPrisma().user.findUnique({
      where: { NIK: session.userId },
      select: { name: true, branchName: true },
    })
    if (user) {
      userName = user.name
      branchName = user.branchName
    }
  }


  return (
    <ReportFlowShell
      eyebrow="SAT/FRM/MED/003"
      title="Form Izin Kerja"
      description="Lengkapi izin kerja (SMK3) sebelum melaksanakan checklist atau perbaikan non-rutin."
    >
      <Suspense fallback={<div className="p-4 text-center text-sm text-gray-500">Memuat formulir...</div>}>
        <FrmMed003Form
          defaultUserName={userName}
          defaultUserBranch={branchName}
          nextPath={params.next}
        />
      </Suspense>
    </ReportFlowShell>
  )
}
