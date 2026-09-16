import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { ProgressSummary } from "@/components/es-dashboard/progress-summary"
import { ReportFlow } from "@/components/es-dashboard/report-flow"
import { StatsGrid } from "@/components/es-dashboard/stats-grid"
import { WelcomePanel } from "@/components/es-dashboard/welcome-panel"
import { getSession } from "@/lib/session"

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.role as string

  if (role === "ES") {
    return (
      <>
        <DashboardShell>
          <DashboardHeader />
          <WelcomePanel />
          <ReportFlow />
          <ProgressSummary />
          <StatsGrid />
        </DashboardShell>
        <BottomNavigation />
      </>
    )
  }

  // Fallback for other roles (COORD, BM, HO, dll)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="w-full bg-[#0072bc] h-14 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center text-white space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center font-bold text-sm shadow-inner">
            S
          </div>
          <span className="font-bold text-sm tracking-widest">SPARTA</span>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard {role}</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Selamat datang, {session?.email as string}. Saat ini Anda login dengan role <span className="font-bold text-[#0072bc]">{role}</span>. Halaman khusus untuk role Anda sedang dalam tahap pengembangan.
        </p>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full max-w-sm">
          <p className="text-sm text-gray-600">
            Fitur pelaporan pekerjaan khusus {role} akan segera hadir di modul SPARTA Engineering.
          </p>
        </div>
      </main>
    </div>
  )
}
