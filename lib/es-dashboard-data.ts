import { getPrisma } from "@/lib/prisma"
import type { EsDashboardFlowOptions } from "@/lib/es-dashboard-types"
import { getCurrentPeriodKey } from "@/lib/date-utils"

const areaOrder = [
  "office",
  "whc",
  "wh",
  "depo",
  "bulky",
  "store_hub",
  "gudang_anak",
]

export async function getEsDashboardFlowOptions(): Promise<EsDashboardFlowOptions> {
  try {
    const areas = await getPrisma().area.findMany({
      where: { isActive: true },
      include: {
        checklistAvailabilities: {
          orderBy: { period: "asc" },
        },
      },
    })

    const currentWeeklyKey = getCurrentPeriodKey("WEEKLY")
    const currentMonthlyKey = getCurrentPeriodKey("MONTHLY")

    const completedReports = await getPrisma().checklistReport.findMany({
      where: {
        category: "PREVENTIVE",
        OR: [
          { period: "WEEKLY", periodKey: currentWeeklyKey },
          { period: "MONTHLY", periodKey: currentMonthlyKey },
        ],
      },
      select: {
        areaId: true,
        period: true,
      },
    })

    const mappedAreas = areas
      .map((area) => ({
        id: area.id,
        code: area.code,
        name: area.name,
        type: area.type,
        periods: area.checklistAvailabilities.map(
          (availability) => availability.period,
        ),
        completedPeriods: completedReports
          .filter((report) => report.areaId === area.id)
          .map((report) => report.period as "MONTHLY" | "WEEKLY"),
      }))
      .sort((left, right) => {
        const leftIndex = areaOrder.indexOf(left.code)
        const rightIndex = areaOrder.indexOf(right.code)

        return normalizeAreaIndex(leftIndex) - normalizeAreaIndex(rightIndex)
      })

    if (mappedAreas.length === 0) {
      return {
        areas: [],
        areaIssue: {
          title: "Data area belum tersedia",
          description: "Jalankan seed area sebelum membuat laporan baru.",
        },
      }
    }

    return { areas: mappedAreas }
  } catch (error) {
    console.error("Failed to load ES dashboard area options", error)

    return {
      areas: [],
      areaIssue: {
        title: "Data area belum bisa dimuat",
        description:
          "Koneksi database belum tersedia. Dashboard tetap bisa dibuka, tetapi pembuatan laporan dinonaktifkan sementara.",
      },
    }
  }
}

function normalizeAreaIndex(index: number) {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export async function getPreventiveProgressSummary() {
  const options = await getEsDashboardFlowOptions()
  let totalTasks = 0
  let completedTasks = 0
  
  for (const area of options.areas) {
    totalTasks += area.periods.length
    if (area.completedPeriods) {
      completedTasks += area.completedPeriods.length
    }
  }

  return {
    total: totalTasks,
    completed: completedTasks,
    percentage: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
  }
}
