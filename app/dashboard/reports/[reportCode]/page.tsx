import { notFound, redirect } from "next/navigation"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { ReportDetailView } from "@/components/reports/report-detail-view"
import { EsFormDetailView } from "@/components/es-dashboard/es-form-detail-view"
import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"
import { asPayloadRecord } from "@/lib/reports/checklist-follow-up"
import { describeRevisionChanges, getChecklistRevisionUrl } from "@/lib/reports/checklist-revision-history"
import { getActiveWorkPermit } from "@/lib/work-permits/active-permit"

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportCode: string }>
}) {
  const { reportCode } = await params
  const session = await getSession()

  if (typeof session?.userId !== "string") {
    redirect("/login")
  }

  const report = await getPrisma().checklistReport.findUnique({
    where: {
      reportCode,
    },
    include: {
      area: true,
      room: true,
      equipment: true,
      author: { select: { NIK: true, name: true, role: true, branchName: true } },
      workPermit: { select: { id: true, permitCode: true, status: true } },
      revisions: { orderBy: [{ requestedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }] },
    },
  })

  if (!report) {
    notFound()
  }

  const user = await getPrisma().user.findUnique({
    where: { NIK: session.userId },
    select: { name: true, NIK: true, role: true, email: true, branchName: true },
  })

  if (!user) notFound()
  const isBranchReviewer = user.role === "COORD" || user.role === "MANAGER" || user.role === "REQUESTER"
  const isReviewer = isBranchReviewer || user.role === "ADMIN_HO" || user.role === "SUPER_ADMIN"
  const branch = user.branchName.trim().toUpperCase()
  if (isBranchReviewer && (!branch || branch !== report.author.branchName.trim().toUpperCase())) notFound()
  if (!isReviewer && report.authorId !== user.NIK) notFound()

  const userEmail = user.email || (session.email as string) || "admin@admin.com"
  const userRole = user.role

  const currentUserData = {
    name: user.name,
    NIK: user.NIK,
    role: userRole,
    email: userEmail,
  }

  const serializedReport = {
    ...report,
    reportCode,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    revisions: report.revisions.map(({ previousPayload, resubmittedPayload, requestedAt, resubmittedAt, ...entry }) => ({
      ...entry,
      requestedAt: requestedAt?.toISOString() ?? null,
      resubmittedAt: resubmittedAt?.toISOString() ?? null,
      changes: isReviewer && resubmittedAt ? describeRevisionChanges(previousPayload, resubmittedPayload) : [],
    })),
  }

  if (!isReviewer) {
    const savedFormCode = asPayloadRecord(report.checklistPayload).formCode
    const editUrl = userRole === "ES" && report.status === "NEEDS_REVISION"
      ? getChecklistRevisionUrl(reportCode, report.formCode ?? (typeof savedFormCode === "string" ? savedFormCode : null))
      : null
    const canEdit = Boolean(editUrl && await getActiveWorkPermit(user))
    return (
      <EsFormDetailView
        report={serializedReport}
        userRole={userRole}
        currentUser={currentUserData}
        revisionUrl={editUrl}
        canEditRevision={canEdit}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-black">
      <ManagerSidebar userEmail={userEmail} userRole={userRole} />

      <div className="flex min-h-screen flex-col lg:pl-60 transition-all duration-200">
        <main className="flex-1 pb-10">
          <ReportDetailView
            report={serializedReport}
            userRole={userRole}
            currentUser={currentUserData}
          />
        </main>
      </div>
    </div>
  )
}
