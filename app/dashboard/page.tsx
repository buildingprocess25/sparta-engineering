import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { ProgressSummary } from "@/components/es-dashboard/progress-summary"
import { ReportFlow } from "@/components/es-dashboard/report-flow"
import { StatsGrid } from "@/components/es-dashboard/stats-grid"
import { WelcomePanel } from "@/components/es-dashboard/welcome-panel"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { areas, areaIssue } = await getEsDashboardFlowOptions()

  return (
    <>
      <DashboardShell>
        <DashboardHeader />
        <WelcomePanel />
        <ReportFlow areas={areas} areaIssue={areaIssue} />
        <ProgressSummary />
        <StatsGrid />
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
