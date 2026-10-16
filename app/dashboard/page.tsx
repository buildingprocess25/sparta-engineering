import { ProfileMenu } from "@/components/auth/profile-menu"
import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { ProgressSummary } from "@/components/es-dashboard/progress-summary"
import { ReportFlow } from "@/components/es-dashboard/report-flow"
import { StatsGrid } from "@/components/es-dashboard/stats-grid"
import { WelcomePanel } from "@/components/es-dashboard/welcome-panel"
import { TodoListPanel } from "@/components/es-dashboard/todo-list-panel"
import { WorkPermitCard } from "@/components/es-dashboard/work-permit-card"
import {
  getEsDashboardStats,
  getEsDashboardUserContext,
} from "@/lib/es-dashboard-data"
import { getUserTodoTasks } from "@/lib/tasks/todo-service"
import { getSession } from "@/lib/session"
import { getRealDashboardStats, getRealAdminReports } from "@/lib/manager-dashboard"
import { ManagerDashboardView } from "@/components/manager-dashboard/manager-dashboard-view"

interface DashboardPageProps {
  searchParams?: Promise<{ view?: string }>
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams
  const session = await getSession()
  const role = session?.role as string
  const forceManagerView = searchParams?.view === "manager"

  // If user role is MANAGER, COORD, HO, ADMIN or explicit view=manager is requested
  if (forceManagerView || role === "MANAGER" || role === "COORD" || role === "HO" || role === "ADMIN") {
    const [realStats, realReports] = await Promise.all([
      getRealDashboardStats("ALL"),
      getRealAdminReports({}),
    ])

    return (
      <ManagerDashboardView
        userEmail={session?.email as string || "admin@admin.com"}
        userRole={role || "ADMIN HO"}
        initialRealStats={realStats}
        initialReports={realReports}
      />
    )
  }

  if (role === "ES") {
    const [userContext, stats, todoData] = await Promise.all([
      getEsDashboardUserContext(session?.userId as string),
      getEsDashboardStats(),
      getUserTodoTasks(session?.userId as string),
    ])

    return (
      <>
        <DashboardShell>
          <DashboardHeader email={session?.email as string} role={role} />
          <WelcomePanel user={userContext} />
          <WorkPermitCard userNik={session?.userId as string} />
          <TodoListPanel todoData={todoData} userNik={session?.userId as string} />
          <ReportFlow />
          <ProgressSummary
            total={todoData.total}
            completed={todoData.completed}
            percentage={
              todoData.total > 0
                ? Math.round((todoData.completed / todoData.total) * 100)
                : 0
            }
          />
          <StatsGrid stats={stats} />
        </DashboardShell>
        <BottomNavigation />
      </>
    )
  }

  // Fallback for other roles (COORD, BM, HO, dll)
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f3] font-sans">
      <header className="flex h-16 w-full items-center justify-between border-b border-[#dedede] bg-white px-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#ff8a2a] text-sm font-black text-black shadow-sm">
            S
          </div>
          <span className="text-sm font-bold tracking-wide text-[#111111]">
            SPARTA Engineering
          </span>
        </div>
        <ProfileMenu
          initials={getInitials(role)}
          email={session?.email as string}
        />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Dashboard {role}
        </h1>
        <p className="mb-8 max-w-md text-gray-500">
          Selamat datang, {session?.email as string}. Saat ini Anda login
          dengan role{" "}
          <span className="font-bold text-[#111111]">{role}</span>. Halaman
          khusus untuk role Anda sedang dalam tahap pengembangan.
        </p>
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">
            Fitur pelaporan pekerjaan khusus {role} akan segera hadir di modul
            SPARTA Engineering.
          </p>
        </div>
      </main>
    </div>
  )
}

function getInitials(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
