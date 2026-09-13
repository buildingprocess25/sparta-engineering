import { getPrisma } from "@/lib/prisma"
import type { EsDashboardFlowOptions } from "@/lib/es-dashboard-types"

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

    const mappedAreas = areas
      .map((area) => ({
        id: area.id,
        code: area.code,
        name: area.name,
        type: area.type,
        periods: area.checklistAvailabilities.map(
          (availability) => availability.period,
        ),
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
