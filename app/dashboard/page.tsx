import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { ProgressSummary } from "@/components/es-dashboard/progress-summary"
import { ReportFlow } from "@/components/es-dashboard/report-flow"
import { StatsGrid } from "@/components/es-dashboard/stats-grid"
import { WelcomePanel } from "@/components/es-dashboard/welcome-panel"

export default function DashboardPage() {
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
