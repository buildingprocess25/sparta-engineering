export function getCurrentPeriodKey(period: "WEEKLY" | "MONTHLY", date: Date = new Date()): string {
  if (period === "MONTHLY") {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
  }

  // WEEKLY (ISO 8601 week number)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const year = d.getUTCFullYear()
  const weekString = String(weekNo).padStart(2, "0")
  
  return `${year}-W${weekString}`
}
