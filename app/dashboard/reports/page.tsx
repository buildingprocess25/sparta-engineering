import { redirect } from "next/navigation"

import { getSession } from "@/lib/session"
import { getRealAdminReports } from "@/lib/manager-dashboard"
import { AdminReportsTable } from "@/components/manager-dashboard/admin-reports-table"
import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const reports = await getRealAdminReports({})

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
