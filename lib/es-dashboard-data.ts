import { getPrisma } from "@/lib/prisma"
import type {
  EsDashboardFlowOptions,
  EsDashboardStat,
  EsDashboardUserContext,
} from "@/lib/es-dashboard-types"
import { getCurrentPeriodKey } from "@/lib/date-utils"
import { getChecklistForms } from "@/lib/checklist-config"

const areaOrder = [
  "office",
  "whc",
  "wh",
  "depo",
  "bulky",
  "store_hub",
  "gudang_anak",
]

type ChecklistCompletionReport = {
  areaId: string
  period: "MONTHLY" | "WEEKLY" | null
  status: string
  formCode?: string | null
}

const submittedChecklistStatuses = new Set([
  "PENDING_COORD",
  "PENDING_MANAGER",
  "PENDING_REQUESTER",
  "COMPLETED",
  "REJECTED",
])

export function getCompletedChecklistPeriods(
  reports: ChecklistCompletionReport[],
): Array<{ areaId: string; period: "MONTHLY" | "WEEKLY" }> {
  return reports.flatMap((report) => {
    if (!report.period || !submittedChecklistStatuses.has(report.status)) {
      return []
    }

    return [{ areaId: report.areaId, period: report.period }]
  })
}

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
        status: true,
        formCode: true,
      },
    })

    const mappedAreas = areas
      .map((area) => {
        const completedPeriods: Array<"MONTHLY" | "WEEKLY"> = []
        const completedFormsSet = new Set<string>()
        
        for (const period of area.checklistAvailabilities.map(a => a.period)) {
          const periodReports = completedReports.filter(
            r => r.areaId === area.id && r.period === period && submittedChecklistStatuses.has(r.status)
          )
          
          periodReports.forEach(r => {
            if (r.formCode) completedFormsSet.add(r.formCode)
          })

          const requiredForms = getChecklistForms(area.type, period).filter(f => !f.id.endsWith("-repair"))
          const requiredCount = Math.max(1, requiredForms.length)
          const completedCount = new Set(periodReports.map(r => r.formCode || "unknown")).size
          
          if (completedCount >= requiredCount) {
            completedPeriods.push(period)
          }
        }

        return {
          id: area.id,
          code: area.code,
          name: area.name,
          type: area.type,
          periods: area.checklistAvailabilities.map(a => a.period),
          completedPeriods,
          completedForms: Array.from(completedFormsSet),
        }
      })
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
    percentage:
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
  }
}

export async function getEsDashboardUserContext(
  userId: string,
): Promise<EsDashboardUserContext | null> {
  try {
    return await getPrisma().user.findUnique({
      where: { NIK: userId },
      select: {
        name: true,
        branchName: true,
        location: true,
        role: true,
      },
    })
  } catch (error) {
    console.error("Failed to load ES dashboard user context", error)
    return null
  }
}

export async function getEsDashboardStats(): Promise<EsDashboardStat[]> {
  const { areas } = await getEsDashboardFlowOptions()
  const activeAreaCount = areas.length
  const periodCount = areas.reduce(
    (total, area) => total + area.periods.length,
    0,
  )

  return [
    {
      value: String(activeAreaCount),
      title: "Area Aktif",
      description: "Area checklist tersedia",
      tone: "silver",
    },
    {
      value: String(periodCount),
      title: "Periode Form",
      description: "Monthly dan weekly aktif",
      tone: "orange",
    },
  ]
}
