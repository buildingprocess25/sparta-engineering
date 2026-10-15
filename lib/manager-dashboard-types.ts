import type { AreaFilter, PeriodFilter, ManagerDashboardData } from "@/components/manager-dashboard/mock-data"

export interface RealReportItem {
  id: string
  reportCode: string | null
  formCode: string | null
  category: "PREVENTIVE" | "INCIDENTAL"
  period: "MONTHLY" | "WEEKLY" | "QUARTERLY" | "SEMESTER" | null
  periodKey: string | null
  status: "PENDING_COORD" | "PENDING_MANAGER" | "PENDING_REQUESTER" | "COMPLETED" | "REJECTED" | "DRAFT"
  createdAt: Date
  updatedAt: Date
  area: {
    id: string
    name: string
    type: "OFFICE" | "WAREHOUSE"
    code: string
  }
  room: {
    id: string
    name: string
    code: string
  } | null
  equipment: {
    id: string
    name: string
    code: string
    branchName: string
  } | null
  author: {
    NIK: string
    name: string
    email: string | null
    branchName: string
    role: string
  }
  checklistPayload: any
  drivePhotoFileIds: any
  itemsCount: number
  defectCount: number
}

export function mapRealStatsToDashboardData(stats: {
  areaFilter: AreaFilter
  equipmentTotal: number
  roomTotal: number
  technicianTotal: number
  totalReports: number
  activeReportsCount: number
  completedCount: number
  rejectedCount: number
  draftCount: number
  completionPercentage: number
  statusCounts: Record<string, number>
  categoryCounts: Record<string, number>
}): ManagerDashboardData {
  const activeReports = stats.activeReportsCount
  const pendingCoord = stats.statusCounts.PENDING_COORD || 0
  const pendingManager = stats.statusCounts.PENDING_MANAGER || 0
  const pendingRequester = stats.statusCounts.PENDING_REQUESTER || 0

  const coordPct = activeReports > 0 ? Math.round((pendingCoord / activeReports) * 100) : 0
  const mgrPct = activeReports > 0 ? Math.round((pendingManager / activeReports) * 100) : 0
  const reqPct = activeReports > 0 ? Math.round((pendingRequester / activeReports) * 100) : 0

  return {
    areaFilter: stats.areaFilter,
    period: "YTD",
    overview: {
      totalReports: stats.totalReports,
      totalReportsArrow: "↗",
      equipmentReports: stats.equipmentTotal,
      roomReports: stats.roomTotal,
      reportSubDescription: "Data riil database: seluruh laporan checklist di sistem",
      reportsSubMetrics: {
        completed: stats.completedCount,
        active: stats.activeReportsCount,
        rejected: stats.rejectedCount,
        activeUsers: stats.technicianTotal,
      },
      completionPercentage: stats.completionPercentage,
      completionArrow: "↗",
      equipmentCompletion: stats.completionPercentage,
      roomCompletion: stats.completionPercentage,
      completionSubDescription: "Selesai dibanding seluruh target checklist di database",
      completionSubMetrics: {
        completed: stats.completedCount,
        equipmentCompleted: stats.completedCount,
        roomCompleted: 0,
        overdue: 0,
      },
      approvalCount: stats.activeReportsCount,
      approvalFormatted: `${stats.activeReportsCount} Laporan`,
      approvalArrow: "↗",
      preventiveApprovalCount: stats.categoryCounts.PREVENTIVE || 0,
      incidentalApprovalCount: stats.categoryCounts.INCIDENTAL || 0,
      approvalSubDescription: "Laporan aktif menunggu review berjenjang (Coord, Manager)",
      approvalSubMetrics: {
        pendingCoord,
        pendingManager,
        pendingRequester,
      },
    },
    statusDistribution: {
      activeReports: stats.activeReportsCount,
      preventiveActive: stats.categoryCounts.PREVENTIVE || 0,
      incidentalActive: stats.categoryCounts.INCIDENTAL || 0,
      totalOverSla: 0,
      statuses: [
        {
          id: "review-coord",
          name: "Tunggu Approval Coord",
          count: pendingCoord,
          percentage: coordPct,
          color: "bg-sky-500",
          dotColor: "bg-sky-500",
          overSlaCount: 0,
          slaLimit: "2 hari",
          slaDescription: "Coordinator memvalidasi kelengkapan form checklist dari teknisi.",
        },
        {
          id: "review-manager",
          name: "Tunggu Review Manager",
          count: pendingManager,
          percentage: mgrPct,
          color: "bg-emerald-500",
          dotColor: "bg-emerald-500",
          overSlaCount: 0,
          slaLimit: "2 hari",
          slaDescription: "Manager memverifikasi dan menyetujui laporan pemeliharaan engineering.",
        },
        {
          id: "review-requester",
          name: "Review Requester",
          count: pendingRequester,
          percentage: reqPct,
          color: "bg-purple-500",
          dotColor: "bg-purple-500",
          overSlaCount: 0,
          slaLimit: "3 hari",
          slaDescription: "Requester/User memvalidasi penyelesaian temuan kerusakan unit.",
        },
      ],
    },
  }
}
