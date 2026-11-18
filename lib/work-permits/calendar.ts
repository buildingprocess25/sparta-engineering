const calendarDateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function getWorkPermitCalendarDate(date = new Date()) {
  return calendarDateFormat.format(date)
}

export function getWorkPermitCalendarPeriod(date = new Date()) {
  return getWorkPermitCalendarDate(date).slice(0, 7)
}

export function getNextWorkPermitPeriod(period: string) {
  const start = new Date(`${period}-01T00:00:00Z`)
  start.setUTCMonth(start.getUTCMonth() + 1)
  return start.toISOString().slice(0, 7)
}

export function resolveRequestedWorkPermitDate(
  workDate?: string,
  requestedPeriod?: string,
  now = new Date()
) {
  const calendarDate =
    workDate ||
    (requestedPeriod ? `${requestedPeriod}-01` : getWorkPermitCalendarDate(now))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) return null

  const date = new Date(`${calendarDate}T00:00:00.000Z`)
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== calendarDate
  )
    return null

  const targetPeriod = requestedPeriod || calendarDate.slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetPeriod)) return null

  return { date, targetPeriod, codeDate: calendarDate.replaceAll("-", "") }
}
