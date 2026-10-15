"use client"

import * as React from "react"

import {
  type AreaFilter,
  type PeriodFilter,
  MANAGER_DASHBOARD_DATA,
} from "./mock-data"
import { ManagerKpiSummary } from "./manager-kpi-summary"
import { ManagerPendingReviewCard } from "./manager-pending-review-card"
import { ManagerSidebar } from "./manager-sidebar"
import { ManagerSlaThresholdPanel } from "./manager-sla-threshold-panel"
import { ManagerTopbar } from "./manager-topbar"
import {
  type RealReportItem,
  mapRealStatsToDashboardData,
} from "@/lib/manager-dashboard-types"
import { cn } from "@/lib/utils"

interface ManagerDashboardViewProps {
  userEmail?: string
  userRole?: string
  initialRealStats?: any
  initialReports?: RealReportItem[]
}

export function ManagerDashboardView({
  userEmail = "admin@admin.com",
  userRole = "ADMIN HO",
  initialRealStats,
  initialReports = [],
}: ManagerDashboardViewProps) {
  const [selectedArea, setSelectedArea] = React.useState<AreaFilter>("ALL")
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodFilter>("YTD")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)

  const activeData = React.useMemo(() => {
    if (initialRealStats) {
      return mapRealStatsToDashboardData({
        ...initialRealStats,
        areaFilter: selectedArea,
      })
    }
    return MANAGER_DASHBOARD_DATA[selectedArea]
  }, [initialRealStats, selectedArea])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-[#ff8a2a]/20 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <ManagerSidebar
        userEmail={userEmail}
        userRole={userRole}
        isCollapsed={isSidebarCollapsed}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Layout Wrapper */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          isSidebarCollapsed ? "lg:pl-18" : "lg:pl-60"
        )}
      >
        {/* Topbar */}
        <ManagerTopbar
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          userEmail={userEmail}
          userRole={userRole}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Top Hero: Ringkasan Operasional & 3 KPI Cards (Real DB Data) */}
          <ManagerKpiSummary
            data={activeData}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />

          {/* Middle Row: Laporan Menunggu Review (Left 2/3) + Batas SLA per status (Right 1/3) */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-8 h-full">
              <ManagerPendingReviewCard
                reports={initialReports}
                viewerRole={userRole}
              />
            </div>

            <div className="lg:col-span-4 h-full">
              <ManagerSlaThresholdPanel data={activeData} />
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
