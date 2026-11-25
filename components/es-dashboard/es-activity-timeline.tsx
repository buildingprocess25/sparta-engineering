"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, ClipboardList, Wrench, RotateCcw, ChevronRight, CalendarDays, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { EsNavigationShell } from "./es-navigation-shell"
import { wibDate } from "@/lib/tasks/preventive-metrics"
import { activityRange, groupActivity, monthRange, shiftDay, type ActivityRange } from "@/lib/tasks/activity-timeline"
import type { EsActivityEvent } from "@/lib/reports/es-navigation-data"

const filters = [{value:"ALL",label:"Semua"},{value:"SUBMISSION",label:"Pengiriman"},{value:"APPROVAL",label:"Approval"},{value:"REVISION",label:"Revisi"},{value:"EXECUTION",label:"Pelaksanaan"}]
const icons = { SUBMISSION: ClipboardList, APPROVAL: CheckCircle2, REVISION: RotateCcw, EXECUTION: Wrench }
const dateFormat = new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"long",year:"numeric"})
const timeFormat = new Intl.DateTimeFormat("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",hourCycle:"h23"})
const dateLabel = (day: string) => dateFormat.format(new Date(`${day}T00:00:00+07:00`))
export function EsActivityTimeline({events,email,range,now}:{events:EsActivityEvent[];email:string;range:ActivityRange;now:string}) {
  const router=useRouter()
  const today=wibDate(now)
  const [filter,setFilter] = useState("ALL")
  const [query,setQuery] = useState("")
  const [from,setFrom] = useState(range.from)
  const [to,setTo] = useState(range.to)
  const [month,setMonth] = useState(range.to.slice(0,7))
  const [limit,setLimit] = useState(20)
  const groups = groupActivity(events,range,filter,query)
  const dates = new Map<string,typeof groups>()
  for(const group of groups.slice(0,limit)) { dates.set(group.day,[...(dates.get(group.day)??[]),group]) }
  function navigate(next:ActivityRange) {
    const params=new URLSearchParams(next)
    router.push(`/dashboard/activity?${params.toString()}`)
  }
  const checked=activityRange(from,to,now)
  const valid=Boolean(from&&to&&checked.from===from&&checked.to===to)
  const presets=[{label:"Hari ini",from:today,to:today},{label:"Kemarin",from:shiftDay(today,-1),to:shiftDay(today,-1)},{label:"7 hari terakhir",from:shiftDay(today,-6),to:today},{label:"Bulan ini",...monthRange(today.slice(0,7))!}]
  return <EsNavigationShell email={email} title="Aktivitas" description="Telusuri kejadian berdasarkan tanggal dan laporan, dari terlama ke terbaru (WIB).">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-4"/> Periode aktivitas</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">{presets.map(p=><Button key={p.label} variant={range.from===p.from&&range.to===p.to?"default":"outline"} onClick={()=>navigate({from:p.from,to:p.to})}>{p.label}</Button>)}</div>
      <form className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={e=>{e.preventDefault();if(valid)navigate({from,to})}}>
        <div className="min-w-0 space-y-1"><Label htmlFor="activity-from">Dari tanggal</Label><Input id="activity-from" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div className="min-w-0 space-y-1"><Label htmlFor="activity-to">Sampai tanggal</Label><Input id="activity-to" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <Button className="col-span-2 sm:col-span-1" type="submit" disabled={!valid}>Terapkan</Button>
      </form>
      {!valid&&<p role="alert" className="text-xs text-red-700">Pilih tanggal yang valid, berurutan, dengan rentang maksimal 366 hari.</p>}
      <form className="flex items-end gap-2" onSubmit={e=>{e.preventDefault();const next=monthRange(month);if(next)navigate(next)}}><div className="min-w-0 flex-1 space-y-1"><Label htmlFor="activity-month">Atau pilih bulan</Label><Input id="activity-month" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div><Button variant="outline" type="submit" disabled={!monthRange(month)}>Lihat bulan</Button></form>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="h-11 pl-9" aria-label="Cari aktivitas" placeholder="Cari nomor laporan, aktivitas, atau pelaksana..." value={query} onChange={e=>{setQuery(e.target.value);setLimit(20)}}/></div>
      <div className="flex flex-wrap gap-2">{filters.map(f=><Button key={f.value} variant={filter===f.value?"default":"outline"} aria-pressed={filter===f.value} onClick={()=>{setFilter(f.value);setLimit(20)}}>{f.label}</Button>)}</div>
    </CardContent></Card>
    <div className="space-y-1"><p className="text-sm font-medium">{dateLabel(range.from)} – {dateLabel(range.to)}</p><p className="text-xs text-muted-foreground">{groups.reduce((n,g)=>n+g.entries.length,0)} kejadian · {groups.length} kelompok laporan per tanggal. Hanya timestamp tercatat yang ditampilkan.</p></div>
    {!groups.length&&<Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas sesuai periode dan filter. Ubah periode atau pencarian.</CardContent></Card>}
    {[...dates].map(([day,rows])=><Card key={day}><CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-2">{dateLabel(day)}<span className="text-xs font-normal text-muted-foreground">{rows.length} kelompok ditampilkan</span></CardTitle></CardHeader><CardContent className="space-y-3">{rows.map((group)=><details key={`${day}-${group.code}`} className="group rounded-xl border bg-card" open={groups.length===1?true:undefined}><summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-orange-500 [&::-webkit-details-marker]:hidden"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><ClipboardList className="size-5"/></span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{group.code}</span><span className="block break-words text-xs text-muted-foreground">{group.entries[0].target}</span><span className="block text-xs text-muted-foreground">{group.entries.length} aktivitas · {timeFormat.format(new Date(group.entries[0].at))}–{timeFormat.format(new Date(group.entries[group.entries.length-1].at))} WIB</span></span><ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90"/></summary><div className="border-t p-3 sm:p-4"><ol>{group.entries.map((e,i)=>{const Icon=icons[e.kind];return <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">{i<group.entries.length-1&&<span className="absolute bottom-0 left-[17px] top-9 w-px bg-border" aria-hidden="true"/>}<span className={`grid size-9 shrink-0 place-items-center rounded-full border ${e.kind==="APPROVAL"&&e.title.startsWith("Disetujui")?"bg-emerald-50 text-emerald-700":"bg-muted"}`}><Icon className="size-4"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-1"><p className="text-sm font-medium">{e.title}</p><time className="shrink-0 text-xs text-muted-foreground" dateTime={e.at}>{timeFormat.format(new Date(e.at))} WIB</time></div><p className="text-xs text-muted-foreground">{e.actor}</p>{e.notes&&<p className="mt-1 whitespace-pre-wrap break-words text-xs">{e.notes}</p>}</div></li>})}</ol><Link className="mt-3 inline-flex min-h-9 items-center gap-1 border-t pt-2 text-sm font-medium text-orange-800 hover:underline" href={`/dashboard/reports/${encodeURIComponent(group.code)}`}>Lihat detail laporan <ChevronRight className="size-4"/></Link></div></details>)}</CardContent></Card>)}
    {groups.length>limit&&<Button variant="outline" className="w-full" onClick={()=>setLimit(n=>n+20)}>Muat kelompok berikutnya ({groups.length-limit})</Button>}
  </EsNavigationShell>
}
