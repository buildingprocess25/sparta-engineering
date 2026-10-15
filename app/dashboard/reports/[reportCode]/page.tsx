import { notFound, redirect } from "next/navigation"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { ReportDetailView } from "@/components/reports/report-detail-view"
import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportCode: string }>
}) {
  const { reportCode } = await params
  const session = await getSession()

  if (!session) {
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
      author: true,
    },
  })

  if (!report) {
    notFound()
  }

  // Serialize dates and ensure non-null reportCode for client component boundary
  const serializedReport = {
    ...report,
    reportCode: report.reportCode || reportCode,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }

  const userEmail = (session.email as string) || "admin@admin.com"
  const userRole = (session.role as string) || "MANAGER"

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-slate-950">
      {/* Sidebar Navigation matching Sparta Maintenance layout */}
      <ManagerSidebar userEmail={userEmail} userRole={userRole} />

      {/* Main Content Layout Wrapper */}
      <div className="flex min-h-screen flex-col lg:pl-60 transition-all duration-200">
        <main className="flex-1 pb-10">
          <ReportDetailView report={serializedReport} userRole={userRole} />
        </main>
      </div>
    </div>
  )
}
