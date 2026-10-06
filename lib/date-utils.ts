export function getCurrentPeriodKey(
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER",
  date: Date = new Date(),
): string {
  const year = date.getFullYear()

  if (period === "MONTHLY") {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
  }

  if (period === "QUARTERLY") {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `${year}-Q${quarter}`
  }

  if (period === "SEMESTER") {
    const semester = date.getMonth() < 6 ? 1 : 2
    return `${year}-S${semester}`
  }

  // WEEKLY (ISO 8601 week number)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const weekString = String(weekNo).padStart(2, "0")

  return `${year}-W${weekString}`
}

