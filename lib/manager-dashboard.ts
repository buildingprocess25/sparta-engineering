import { getPrisma } from "@/lib/prisma"
import type { AreaFilter, PeriodFilter } from "@/components/manager-dashboard/mock-data"
export type { RealReportItem } from "./manager-dashboard-types"
export { mapRealStatsToDashboardData } from "./manager-dashboard-types"
import type { RealReportItem } from "./manager-dashboard-types"

export async function getRealDashboardStats(areaFilter: AreaFilter = "ALL") {
  const prisma = getPrisma()

  const areaWhere =
    areaFilter === "ALL"
      ? undefined
      : {
          area: {
            type: areaFilter,
          },
        }

  const [
    equipmentTotal,
    roomTotal,
    technicianTotal,
    totalReports,
    statusGroup,
    categoryGroup,
    recentReports,
  ] = await Promise.all([
    prisma.equipment.count({
      where:
        areaFilter === "ALL"
          ? undefined
          : {
              area: {
                type: areaFilter,
              },
            },
    }),
    prisma.room.count({
      where:
        areaFilter === "ALL"
          ? undefined
          : {
              area: {
                type: areaFilter,
              },
            },
    }),
    prisma.user.count({
      where: {
        role: "ES",
      },
    }),
    prisma.checklistReport.count({
      where: areaWhere,
    }),
    prisma.checklistReport.groupBy({
      by: ["status"],
      _count: true,
      where: areaWhere,
    }),
    prisma.checklistReport.groupBy({
      by: ["category"],
      _count: true,
      where: areaWhere,
    }),
    prisma.checklistReport.findMany({
      where: areaWhere,
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: true,
        area: true,
        room: true,
        equipment: true,
        items: true,
      },
    }),
  ])

  // Count by status
  const statusCounts: Record<string, number> = {
    PENDING_COORD: 0,
    PENDING_MANAGER: 0,
    PENDING_REQUESTER: 0,
    COMPLETED: 0,
    REJECTED: 0,
    DRAFT: 0,
  }

  statusGroup.forEach((g) => {
    statusCounts[g.status] = g._count
  })

  // Count by category
  const categoryCounts: Record<string, number> = {
    PREVENTIVE: 0,
    INCIDENTAL: 0,
  }

  categoryGroup.forEach((g) => {
    categoryCounts[g.category] = g._count
  })

  const activeReportsCount =
    statusCounts.PENDING_COORD +
    statusCounts.PENDING_MANAGER +
    statusCounts.PENDING_REQUESTER

  const completedCount = statusCounts.COMPLETED
  const rejectedCount = statusCounts.REJECTED
  const draftCount = statusCounts.DRAFT

  const completionPercentage =
    totalReports > 0 ? Math.round((completedCount / totalReports) * 100) : 0

  return {
    areaFilter,
    equipmentTotal,
    roomTotal,
    technicianTotal,
    totalReports,
    activeReportsCount,
    completedCount,
    rejectedCount,
    draftCount,
    completionPercentage,
    statusCounts,
    categoryCounts,
    recentReports: recentReports.map((r) => {
      let itemsList: any[] = []
      if (
        r.checklistPayload &&
        typeof r.checklistPayload === "object" &&
        Array.isArray((r.checklistPayload as any).items)
      ) {
        itemsList = (r.checklistPayload as any).items
      }
      const defectCount = itemsList.filter(
        (i) => i.condition === "RUSAK" || i.condition === "REPAIR"
      ).length

      return {
        id: r.id,
        reportCode: r.reportCode,
        formCode: r.formCode,
        category: r.category,
        period: r.period,
        periodKey: r.periodKey,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        area: r.area,
        room: r.room,
        equipment: r.equipment,
        author: r.author,
        checklistPayload: r.checklistPayload,
        drivePhotoFileIds: r.drivePhotoFileIds,
        itemsCount: itemsList.length > 0 ? itemsList.length : r.items.length,
        defectCount,
      } as RealReportItem
    }),
  }
}

export async function getRealAdminReports(params: {
  search?: string
  status?: string
  scope?: string
  areaType?: "OFFICE" | "WAREHOUSE"
}) {
  const prisma = getPrisma()

  const whereConditions: any = {}

  if (params.areaType) {
    whereConditions.area = {
      type: params.areaType,
    }
  }

  if (params.scope) {
    if (params.scope === "active") {
      whereConditions.status = {
        in: ["PENDING_COORD", "PENDING_MANAGER", "PENDING_REQUESTER"],
      }
    } else if (params.scope === "review_coord") {
      whereConditions.status = "PENDING_COORD"
    } else if (params.scope === "review_manager") {
      whereConditions.status = "PENDING_MANAGER"
    } else if (params.scope === "completed") {
      whereConditions.status = "COMPLETED"
    } else if (params.scope === "draft") {
      whereConditions.status = "DRAFT"
    }
  } else if (params.status && params.status !== "all") {
    whereConditions.status = params.status
  }

  if (params.search?.trim()) {
    const q = params.search.trim()
    whereConditions.OR = [
      { reportCode: { contains: q, mode: "insensitive" } },
      { formCode: { contains: q, mode: "insensitive" } },
      { author: { name: { contains: q, mode: "insensitive" } } },
      { author: { NIK: { contains: q, mode: "insensitive" } } },
      { equipment: { name: { contains: q, mode: "insensitive" } } },
      { room: { name: { contains: q, mode: "insensitive" } } },
      { area: { name: { contains: q, mode: "insensitive" } } },
    ]
  }

  const reports = await prisma.checklistReport.findMany({
    where: whereConditions,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: true,
      area: true,
      room: true,
      equipment: true,
      items: true,
    },
  })

  return reports.map((r) => {
    let itemsList: any[] = []
    if (
      r.checklistPayload &&
      typeof r.checklistPayload === "object" &&
      Array.isArray((r.checklistPayload as any).items)
    ) {
      itemsList = (r.checklistPayload as any).items
    }
    const defectCount = itemsList.filter(
      (i) => i.condition === "RUSAK" || i.condition === "REPAIR"
    ).length

    return {
      id: r.id,
      reportCode: r.reportCode,
      formCode: r.formCode,
      category: r.category,
      period: r.period,
      periodKey: r.periodKey,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      area: r.area,
      room: r.room,
      equipment: r.equipment,
      author: r.author,
      checklistPayload: r.checklistPayload,
      drivePhotoFileIds: r.drivePhotoFileIds,
      itemsCount: itemsList.length > 0 ? itemsList.length : r.items.length,
      defectCount,
    } as RealReportItem
  })
}

