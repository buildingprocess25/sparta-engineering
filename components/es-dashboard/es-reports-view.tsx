"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SpartaFilterSelect } from "@/components/ui/sparta-filter-select"
import { ChecklistStatusBadge } from "./checklist-status-badge"
import { EsNavigationShell } from "./es-navigation-shell"
import { CHECKLIST_STATUS_LABELS } from "@/lib/reports/checklist-status-labels"
import { wibDate, monthLabel } from "@/lib/tasks/preventive-metrics"
import type { EsReportRow } from "@/lib/reports/es-navigation-data"

const kinds = [{ value: "ALL", label: "Semua" }, { value: "ROUTINE", label: "Rutin PIC" }, { value: "INCIDENTAL", label: "Non-Rutin" }, { value: "GENERAL", label: "General Checklist" }]
const approvals = ["PENDING_COORD", "PENDING_MANAGER", "PENDING_REQUESTER"]
const waiting = ["WAITING_PJU", "WAITING_PB", "WAITING_PARTS"]
const groups = [{ label: "Menunggu ACC", value: "APPROVAL" }, { label: "Menunggu Tindak Lanjut", value: "WAITING" }, { label: "Sedang Dikerjakan", value: "IN_PROGRESS" }, { label: "Selesai", value: "COMPLETED" }]
const matchesStatus = (r: EsReportRow, status: string) => status === "ALL" || (status === "APPROVAL" ? approvals.includes(r.status) && !r.pendingFollowUp : status === "WAITING" ? waiting.includes(r.status) || r.pendingFollowUp : r.status === status)

export function EsReportsView({ reports, email, initialStatus = "ALL" }: { reports: EsReportRow[]; email: string; initialStatus?: string }) {
  const [status, setStatus] = useState(Object.prototype.hasOwnProperty.call(CHECKLIST_STATUS_LABELS, initialStatus) ? initialStatus : "ALL")
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("ALL")
  const [month, setMonth] = useState("ALL")
  const months = [...new Set(reports.map(r => wibDate(r.createdAt).slice(0, 7)))].sort().reverse()
  const base = reports.filter(r => (kind === "ALL" || r.kind === kind) && (month === "ALL" || wibDate(r.createdAt).startsWith(month)))
  const shown = base.filter(r => matchesStatus(r, status) && [r.code, r.target, r.area, r.form, r.period].some(v => v.toLowerCase().includes(query.trim().toLowerCase())))
  const options = [{ value: "ALL", label: "Semua status" }, { value: "APPROVAL", label: "Menunggu ACC" }, { value: "WAITING", label: "Menunggu Tindak Lanjut" }, ...Object.entries(CHECKLIST_STATUS_LABELS).map(([value,label]) => ({value,label}))]
  return <EsNavigationShell email={email} title="Laporan" description="Pantau status dan lanjutkan laporan pekerjaan Anda.">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{groups.map(g => <Button key={g.value} type="button" variant="outline" aria-pressed={status === g.value} onClick={() => setStatus(status === g.value ? "ALL" : g.value)} className={`h-auto min-h-24 whitespace-normal flex-col items-start justify-between gap-2 p-3 text-left ${status === g.value ? "border-orange-500 bg-orange-50" : "bg-card"}`}><span className="text-xs text-muted-foreground">{g.label}</span><span className="text-2xl font-semibold tabular-nums">{base.filter(r => matchesStatus(r,g.value)).length}</span></Button>)}</div>
    <Card><CardContent className="space-y-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="h-11 pl-9" aria-label="Cari laporan" placeholder="Cari nomor laporan, equipment, ruangan..." value={query} onChange={e => setQuery(e.target.value)} /></div><div className="flex flex-wrap gap-2">{kinds.map(k => <Button key={k.value} variant={kind === k.value ? "default" : "outline"} aria-pressed={kind === k.value} onClick={() => setKind(k.value)}>{k.label}</Button>)}</div><div className="grid gap-2 sm:grid-cols-2"><SpartaFilterSelect ariaLabel="Bulan pembuatan laporan" value={month} onValueChange={setMonth} options={[{value:"ALL",label:"Semua bulan pembuatan"},...months.map(m=>({value:m,label:monthLabel(m)}))]}/><SpartaFilterSelect ariaLabel="Filter status laporan" value={status} onValueChange={setStatus} options={options}/></div></CardContent></Card>
    <div className="flex items-center justify-between"><h2 className="font-semibold">Daftar Laporan</h2><span className="text-xs text-muted-foreground">{shown.length} dari {base.length}</span></div>
    {shown.length === 0 ? <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Tidak ada laporan sesuai filter.</CardContent></Card> : shown.map(r => <Link key={r.code} href={`/dashboard/reports/${encodeURIComponent(r.code)}`} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-orange-500"><Card size="sm" className="hover:ring-orange-300"><CardHeader><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><FileText className="size-5"/></span><div className="min-w-0 flex-1 space-y-1"><p className="break-all text-xs text-muted-foreground">{r.code}</p><CardTitle className="break-words">{r.target}</CardTitle><p className="text-xs text-muted-foreground">{r.area} · {kinds.find(k=>k.value===r.kind)?.label} · {r.form}</p><p className="text-xs text-muted-foreground">{r.period}</p><div className="pt-1">{r.pendingFollowUp ? <span className="text-xs font-medium text-orange-800">Lengkapi form tindak lanjut</span> : <ChecklistStatusBadge status={r.status}/>}</div></div><ChevronRight className="size-4 shrink-0 text-muted-foreground"/></div></CardHeader></Card></Link>)}
  </EsNavigationShell>
}
