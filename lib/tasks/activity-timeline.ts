import { validMonth, wibDate } from "./preventive-metrics"

export type ActivityRange = { from: string; to: string }
export type TimelineEvent = { id: string; code: string; target: string; at: string; kind: string; title: string; actor: string; notes: string }

function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value
}
export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate()+offset)
  return date.toISOString().slice(0,10)
}
export function monthRange(month: string): ActivityRange | null {
  if (!validMonth(month)) return null
  const [year,m] = month.split("-").map(Number)
  return { from:`${month}-01`, to:new Date(Date.UTC(year,m,0)).toISOString().slice(0,10) }
}
export function activityRange(from: unknown, to: unknown, now: Date | string): ActivityRange {
  if (validDay(from) && validDay(to) && from <= to && to <= shiftDay(from,365)) return {from,to}
  const today = wibDate(now)
  return { from:shiftDay(today,-6), to:today }
}
export function withinActivityRange(at: string, range: ActivityRange) {
  if (!Number.isFinite(Date.parse(at))) return false
  const day = wibDate(at)
  return day >= range.from && day <= range.to
}
export function groupActivity<T extends TimelineEvent>(events: readonly T[], range: ActivityRange, kind = "ALL", query = "") {
  const keyword = query.trim().toLocaleLowerCase("id-ID")
  const rows = events.filter(e=>withinActivityRange(e.at,range) && (kind==="ALL"||e.kind===kind) && [e.code,e.target,e.title,e.actor,e.notes].some(v=>v.toLocaleLowerCase("id-ID").includes(keyword)))
    .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.id.localeCompare(b.id))
  const dates = new Map<string, Map<string,T[]>>()
  for (const row of rows) {
    const day = wibDate(row.at)
    let reports = dates.get(day)
    if (!reports) { reports = new Map(); dates.set(day,reports) }
    let entries = reports.get(row.code)
    if (!entries) { entries=[]; reports.set(row.code,entries) }
    entries.push(row)
  }
  return Array.from(dates,([day,reports])=>Array.from(reports,([code,entries])=>({day,code,entries}))).flat()
}
