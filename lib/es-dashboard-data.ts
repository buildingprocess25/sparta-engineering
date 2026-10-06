import { getPrisma } from "@/lib/prisma"
import type {
  ChecklistPeriodType,
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
        rooms: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            formAvailabilities: {
              orderBy: { period: "asc" },
            },
          },
        },
      },
    })

    const mappedAreas = areas
      .map((area) => {
        const areaPeriodsSet = new Set<ChecklistPeriodType>()
        area.rooms.forEach((r) => {
          r.formAvailabilities.forEach((f) => {
            areaPeriodsSet.add(f.period as ChecklistPeriodType)
          })
        })
        const periods = areaPeriodsSet.size > 0
          ? Array.from(areaPeriodsSet)
          : (["MONTHLY", "WEEKLY"] as ChecklistPeriodType[])

        return {
          id: area.id,
          code: area.code,
          name:
            area.code === "office" || area.name.toLowerCase() === "office"
              ? "Branch"
              : area.name,
          type: area.type,
          periods,
          rooms: area.rooms.map((r) => ({
            id: r.id,
            areaId: r.areaId,
            name: r.name,
            code: r.code,
            formAvailabilities: r.formAvailabilities.map((fa) => ({
              id: fa.id,
              formCode: fa.formCode,
              period: fa.period as ChecklistPeriodType,
            })),
          })),
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
