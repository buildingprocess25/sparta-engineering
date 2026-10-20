import { redirect } from "next/navigation"

import { getSession } from "@/lib/session"
import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"
import { getManagerWorkPermits } from "@/lib/actions/work-permit"
import { WorkPermitsView } from "@/components/manager-dashboard/work-permits-view"

export const dynamic = "force-dynamic"

export default async function WorkPermitsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Jika teknisi ES masuk ke rute ini, arahkan ke form pengisian izin kerja mereka
  if (session.role === "ES") {
    redirect("/dashboard/reports/new/work-permit")
  }

  const permits = await getManagerWorkPermits()
  const userEmail = (session.email as string) || "manager@admin.com"
  const userRole = (session.role as string) || "MANAGER"

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-slate-950">
      <ManagerSidebar userEmail={userEmail} userRole={userRole} />
      <div className="flex min-h-screen flex-col lg:pl-60 transition-all duration-200">
        <main className="flex-1 pb-10">
          <WorkPermitsView
            initialPermits={permits as any}
            viewerRole={userRole}
            userEmail={userEmail}
          />
        </main>
      </div>
    </div>
  )
}
