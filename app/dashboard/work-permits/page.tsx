import { redirect } from "next/navigation"

import { getPrisma } from "@/lib/prisma"
import { ManagerSidebar } from "@/components/manager-dashboard/manager-sidebar"
import { getManagerWorkPermits } from "@/lib/actions/work-permit"
import { WorkPermitsView } from "@/components/manager-dashboard/work-permits-view"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"

export const dynamic = "force-dynamic"

export default async function WorkPermitsPage() {
  const user = await getWorkPermitUser()

  if (!user) {
    redirect("/login")
  }

  // Jika teknisi ES masuk ke rute ini, arahkan ke form pengisian izin kerja mereka
  if (user.role === "ES") {
    redirect("/dashboard/reports/new/work-permit")
  }

  const isManager = user.role === "MANAGER"
  const isApprover = await getPrisma().workPermitApprover.findFirst({
    where: {
      branchName: { equals: user.branchName.trim(), mode: "insensitive" },
      userNik: user.NIK,
      isActive: true,
    },
  })
  if (!isManager && !isApprover) redirect("/dashboard")

  const permits = await getManagerWorkPermits()

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-slate-950">
      <ManagerSidebar userEmail={user.email ?? undefined} userRole={user.role} />
      <div className="flex min-h-screen flex-col lg:pl-60 transition-all duration-200">
        <main className="flex-1 pb-10">
          <WorkPermitsView
            initialPermits={permits}
            viewerRole={user.role}
            userEmail={user.email ?? undefined}
          />
        </main>
      </div>
    </div>
  )
}
