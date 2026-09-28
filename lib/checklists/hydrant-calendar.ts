/**
 * Utility kalender riil untuk perhitungan minggu dan semester form Checklist Hydrant (SAT/FRM/TSM/006).
 * Menghitung hari sebenarnya berdasarkan tahun dan bulan (termasuk tahun kabisat dan variasi 28, 29, 30, 31 hari).
 */

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

export type HydrantWeekOption = {
  id: "MGG_1" | "MGG_2" | "MGG_3" | "MGG_4"
  weekNumber: number
  label: string
  shortLabel: string
  dateRangeLabel: string
  startDay: number
  endDay: number
  isPast: boolean
  isCurrent: boolean
}

/**
 * Menghitung jumlah hari sebenarnya dalam suatu bulan dan tahun.
 * @param year Tahun penuh (contoh: 2026)
 * @param monthIndex Index bulan 0 - 11 (0 = Januari, 11 = Desember)
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/**
 * Menghasilkan 4 rentang minggu checklist hydrant untuk bulan dan tahun tertentu.
 * Menghitung status apakah minggu tersebut sudah lewat (`isPast`) dan minggu saat ini (`isCurrent`).
 */
export function getHydrantWeekRanges(
  referenceDate: Date = new Date()
): {
  year: number
  monthIndex: number
  monthName: string
  monthShort: string
  daysInMonth: number
  currentDay: number
  activeWeekId: "MGG_1" | "MGG_2" | "MGG_3" | "MGG_4"
  weeks: HydrantWeekOption[]
} {
  const year = referenceDate.getFullYear()
  const monthIndex = referenceDate.getMonth()
  const currentDay = referenceDate.getDate()
  const daysInMonth = getDaysInMonth(year, monthIndex)

  const monthName = MONTH_NAMES_ID[monthIndex] ?? ""
  const monthShort = MONTH_NAMES_SHORT[monthIndex] ?? ""

  // Tentukan minggu aktif saat ini
  let activeWeekId: "MGG_1" | "MGG_2" | "MGG_3" | "MGG_4" = "MGG_1"
  if (currentDay > 21) {
    activeWeekId = "MGG_4"
  } else if (currentDay > 14) {
    activeWeekId = "MGG_3"
  } else if (currentDay > 7) {
    activeWeekId = "MGG_2"
  } else {
    activeWeekId = "MGG_1"
  }

  const rawWeeks = [
    {
      id: "MGG_1" as const,
      weekNumber: 1,
      startDay: 1,
      endDay: 7,
    },
    {
      id: "MGG_2" as const,
      weekNumber: 2,
      startDay: 8,
      endDay: 14,
    },
    {
      id: "MGG_3" as const,
      weekNumber: 3,
      startDay: 15,
      endDay: 21,
    },
    {
      id: "MGG_4" as const,
      weekNumber: 4,
      startDay: 22,
      endDay: daysInMonth,
    },
  ]

  const weeks: HydrantWeekOption[] = rawWeeks.map((w) => {
    const isPast = currentDay > w.endDay
    const isCurrent = w.id === activeWeekId
    const dateRangeLabel = `${w.startDay} - ${w.endDay} ${monthName} ${year}`
    const shortLabel = `Mgg ${w.weekNumber} (${w.startDay}-${w.endDay} ${monthShort})`
    const label = `Minggu ${w.weekNumber} (${w.startDay} - ${w.endDay} ${monthName})`

    return {
      ...w,
      label,
      shortLabel,
      dateRangeLabel,
      isPast,
      isCurrent,
    }
  })

  return {
    year,
    monthIndex,
    monthName,
    monthShort,
    daysInMonth,
    currentDay,
    activeWeekId,
    weeks,
  }
}

/**
 * Menghasilkan semester default berdasarkan tanggal saat ini.
 */
export function getCurrentHydrantSemester(referenceDate: Date = new Date()): "SEMESTER_1" | "SEMESTER_2" {
  const monthIndex = referenceDate.getMonth()
  return monthIndex <= 5 ? "SEMESTER_1" : "SEMESTER_2"
}
