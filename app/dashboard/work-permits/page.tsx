import { redirect } from "next/navigation"

import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"
import { getManagerWorkPermits } from "@/lib/actions/work-permit"
import { WorkPermitsView } from "@/components/manager-dashboard/work-permits-view"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"

export const dynamic = "force-dynamic"

export default async function WorkPermitsPage({ searchParams }: { searchParams: Promise<{ permitCode?: string }> }) {
  const [user, query] = await Promise.all([getWorkPermitUser(), searchParams])

  if (!user) {
    redirect("/login")
  }

  // Jika teknisi ES masuk ke rute ini, arahkan ke form pengisian izin kerja mereka
  if (user.role === "ES") {
    redirect("/dashboard/reports/new/work-permit")
  }

  if (user.role !== "MANAGER") redirect("/dashboard")

  const permitCode = typeof query.permitCode === "string" ? query.permitCode : undefined
  const permits = await getManagerWorkPermits()

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-slate-950">
      <ManagerSidebar userEmail={user.email ?? undefined} userRole={user.role} />
      <div className="flex min-h-screen flex-col lg:pl-60 transition-all duration-200">
        <main className="flex-1 pb-10">
          <WorkPermitsView
            key={permitCode ?? "list"}
            initialPermits={permits}
            initialPermitCode={permitCode}
            viewerRole={user.role}
            userEmail={user.email ?? undefined}
          />
        </main>
      </div>
    </div>
  )
}
