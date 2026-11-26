import { EsNavigationUnavailable } from "@/components/es-dashboard/es-navigation-unavailable"
import { redirect } from "next/navigation"

import { getSession } from "@/lib/session"
import { getDashboardReportScope, getRealAdminReports } from "@/lib/manager-dashboard"
import { AdminReportsTable } from "@/components/manager-dashboard/admin-reports-table"
import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"
import { EsReportsView } from "@/components/es-dashboard/es-reports-view"
import { getEsReportRows } from "@/lib/reports/es-navigation-data"

export const dynamic = "force-dynamic"

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role === "ES") {
    if (typeof session.userId !== "string") redirect("/login")
    let reports: Awaited<ReturnType<typeof getEsReportRows>>
    let status: string | undefined
    try {
      reports = await getEsReportRows(session.userId)
      status = (await searchParams)?.status
    } catch (error) {
      console.error("ES reports unavailable", error)
      return <EsNavigationUnavailable email={session.email as string} title="Laporan" href="/dashboard/reports" />
    }
    return <EsReportsView key={status ?? "ALL"} reports={reports} email={session.email as string} initialStatus={status} />
  }

  const reports = await getRealAdminReports(await getDashboardReportScope(session.userId), {})

  const userEmail = session.email as string || "admin@admin.com"
  const userRole = session.role as string || "MANAGER"

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <ManagerSidebar
        userEmail={userEmail}
        userRole={userRole}
      />

      {/* Main Content Layout Wrapper */}
      <div className="flex min-h-screen flex-col lg:pl-60 transition-all duration-200">
        <main className="flex-1 pb-10">
          <AdminReportsTable
            initialReports={reports}
            viewerRole={userRole}
            userEmail={userEmail}
          />
        </main>
      </div>
    </div>
  )
}
