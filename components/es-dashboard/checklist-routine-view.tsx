"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  RotateCcw,
  Search,
  Wrench,
  X,
} from "lucide-react"

import type { UserTodoSummary, UserTodoTaskItem } from "@/lib/tasks/todo-service"

import { SpartaFilterSelect } from "@/components/ui/sparta-filter-select"

const PERIOD_LABEL: Record<string, string> = {
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
  QUARTERLY: "3 Bulanan",
  SEMESTER: "6 Bulanan",
}

type StatusFilter = "ALL" | "PENDING" | "COMPLETED" | "OVERDUE"
type ObjectFilter = "ALL" | "EQUIPMENT" | "ROOM"

type Props = {
  todoData: UserTodoSummary
  hasActivePermit: boolean
}

function dateLabel(date: Date | string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function taskLink(task: UserTodoTaskItem, hasActivePermit: boolean) {
  if (task.status === "COMPLETED") {
    return task.reportCode ? `/dashboard/reports/${encodeURIComponent(task.reportCode)}` : null
  }
  if (!hasActivePermit || task.status === "CANCELLED" || !task.formSlug) return null
  return `/dashboard/reports/new/checklist/${task.formSlug}?taskId=${encodeURIComponent(task.id)}`
}

function getStatus(task: UserTodoTaskItem) {
  if (task.status === "COMPLETED") {
    return { label: "Sudah Preventif", pill: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" }
  }
  if (task.status === "OVERDUE") {
    return { label: "Terlewat", pill: "border-slate-300 bg-slate-100 text-slate-700", dot: "bg-slate-500" }
  }
  return { label: "Belum Preventif", pill: "border-orange-200 bg-orange-50 text-orange-800", dot: "bg-orange-500" }
}


export function ChecklistRoutineView({ todoData, hasActivePermit }: Props) {
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [objectType, setObjectType] = React.useState<ObjectFilter>("ALL")
  const [period, setPeriod] = React.useState("ALL")
  const [area, setArea] = React.useState("ALL")
  const [query, setQuery] = React.useState("")

  const tasks = React.useMemo(
    () => todoData.tasks.filter((task) => task.status !== "CANCELLED"),
    [todoData.tasks],
  )
  const areas = React.useMemo(
    () => Array.from(new Set(tasks.map((task) => task.areaName).filter((name): name is string => Boolean(name)))).sort(),
    [tasks],
  )
  const counts = React.useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "PENDING").length,
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
    overdue: tasks.filter((task) => task.status === "OVERDUE").length,
  }), [tasks])

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID")
    return tasks.filter((task) => {
      if (status !== "ALL" && task.status !== status) return false
      if (objectType !== "ALL" && task.objectType !== objectType) return false
      if (period !== "ALL" && task.period !== period) return false
      if (area !== "ALL" && task.areaName !== area) return false
      return !keyword || [task.objectName, task.formCode, task.areaName, task.branchName, task.periodKey]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(keyword))
    })
  }, [tasks, status, objectType, period, area, query])

  const hasFilters = Boolean(query.trim()) || status !== "ALL" || objectType !== "ALL" || period !== "ALL" || area !== "ALL"

  function resetFilters() {
    setStatus("ALL")
    setObjectType("ALL")
    setPeriod("ALL")
    setArea("ALL")
    setQuery("")
  }

  const statuses: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Semua", count: counts.all },
    { key: "PENDING", label: "Belum Preventif", count: counts.pending },
    { key: "COMPLETED", label: "Sudah Preventif", count: counts.completed },
    { key: "OVERDUE", label: "Terlewat", count: counts.overdue },
  ]

  return (
    <div className="mt-6 space-y-5 pb-10 text-slate-900">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-700">Pemeriksaan berkala</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Tugas preventif PIC</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Cari tugas yang dijadwalkan, kerjakan pemeriksaan, dan pantau yang sudah preventif.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-orange-500"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Kembali
        </Link>
      </section>

      {!hasActivePermit && (
        <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3" role="status">
          <LockKeyhole className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-950">Izin kerja MED/003 belum aktif</p>
            <p className="mt-0.5 text-xs leading-5 text-amber-900">
              Daftar dan riwayat tetap bisa dilihat, tetapi pemeriksaan baru memerlukan izin kerja yang disetujui lengkap.
            </p>
          </div>
        </section>
      )}

      <section aria-label="Ringkasan preventif" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total tugas", count: counts.all, Icon: ClipboardList, mark: "bg-slate-300", iconClass: "bg-slate-100 text-slate-700" },
          { label: "Belum Preventif", count: counts.pending, Icon: CalendarDays, mark: "bg-orange-400", iconClass: "bg-orange-50 text-orange-700" },
          { label: "Sudah Preventif", count: counts.completed, Icon: CheckCircle2, mark: "bg-emerald-500", iconClass: "bg-emerald-50 text-emerald-700" },
          { label: "Terlewat", count: counts.overdue, Icon: AlertTriangle, mark: "bg-slate-500", iconClass: "bg-slate-100 text-slate-600" },
        ].map(({ label, count, Icon, mark, iconClass }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`absolute inset-x-0 top-0 h-1 ${mark}`} />
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium leading-5 text-slate-600">{label}</span>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{count}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="routine-filter-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 id="routine-filter-title" className="text-sm font-bold text-slate-900">Cari dan filter tugas</h3>
            <p className="mt-0.5 text-xs text-slate-500">Pilih area, periode, atau jenis objek yang ingin diperiksa.</p>
          </div>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-orange-800 transition hover:bg-orange-50">
              <RotateCcw className="size-3.5" aria-hidden="true" /> Reset filter
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search" id="routine-task-search" aria-label="Cari tugas checklist" value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama equipment, ruangan, atau kode form..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          {query && <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Jenis objek</span>
            <SpartaFilterSelect
              ariaLabel="Filter jenis objek"
              value={objectType}
              onValueChange={(next) => {
                if (next === "ALL" || next === "EQUIPMENT" || next === "ROOM") setObjectType(next)
              }}
              options={[
                { value: "ALL", label: "Semua objek" },
                { value: "EQUIPMENT", label: "Equipment" },
                { value: "ROOM", label: "Ruangan" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Periode</span>
            <SpartaFilterSelect
              ariaLabel="Filter periode"
              value={period}
              onValueChange={setPeriod}
              options={[
                { value: "ALL", label: "Semua periode" },
                ...Object.entries(PERIOD_LABEL).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Area kerja</span>
            <SpartaFilterSelect
              ariaLabel="Filter area kerja"
              value={area}
              onValueChange={setArea}
              options={[
                { value: "ALL", label: "Semua area" },
                ...areas.map((name) => ({ value: name, label: name })),
              ]}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="routine-list-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 id="routine-list-title" className="text-base font-bold text-slate-900">Daftar tugas</h3>
            <p className="mt-0.5 text-xs text-slate-500">Menampilkan {filtered.length} dari {counts.all} tugas terjadwal</p>
          </div>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter status preventif">
          {statuses.map((item) => (
            <button
              key={item.key} type="button" onClick={() => setStatus(item.key)} aria-pressed={status === item.key}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-500 ${status === item.key
                ? "border-orange-300 bg-orange-50 text-orange-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              {item.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${status === item.key ? "bg-orange-100 text-orange-900" : "bg-slate-100 text-slate-600"}`}>{item.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <Search className="size-7 text-slate-400" aria-hidden="true" />
            <h4 className="mt-3 text-sm font-bold text-slate-800">{tasks.length ? "Tidak ada tugas yang sesuai filter" : "Belum ada tugas PIC"}</h4>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">
              {tasks.length ? "Coba ubah pencarian atau filter. Ini tidak berarti seluruh pekerjaan preventif sudah dikerjakan." : "Tugas preventif akan muncul setelah PIC ditugaskan ke equipment atau ruangan."}
            </p>
            {tasks.length > 0 && <button type="button" onClick={resetFilters} className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">Tampilkan semua tugas</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((task) => {
              const href = taskLink(task, hasActivePermit)
              const statusInfo = getStatus(task)
              const isCompleted = task.status === "COMPLETED"
              const Icon = task.objectType === "EQUIPMENT" ? Wrench : Building2
              const actionLabel = isCompleted
                ? (href ? "Lihat hasil preventif" : "Hasil belum tersedia")
                : (href ? "Kerjakan checklist" : !hasActivePermit ? "Menunggu izin MED/003" : "Form belum tersedia")
              const content = (
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all sm:p-5 group-hover:border-orange-300 group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusInfo.pill}`}>
                      <span className={`size-1.5 rounded-full ${statusInfo.dot}`} /> {statusInfo.label}
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold leading-6 text-slate-900">{task.objectName}</h4>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {task.areaName ?? task.branchName ?? "Area belum terdata"} <span className="px-1 text-slate-300">•</span> {PERIOD_LABEL[task.period] ?? task.period}
                  </p>
                  <p className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-medium text-slate-700">{task.formCode}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      {isCompleted ? `Preventif: ${dateLabel(task.completedAt)}` : `Batas: ${dateLabel(task.targetDate)}`}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${href ? "text-orange-800" : "text-slate-500"}`}>
                      {actionLabel} {href && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                    </span>
                  </div>
                </div>
              )
              return href ? (
                <Link key={task.id} href={href} className="group block rounded-2xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-orange-500" aria-label={`${actionLabel}: ${task.objectName}`}>
                  {content}
                </Link>
              ) : (
                <div key={task.id} aria-disabled="true" className="group opacity-85">{content}</div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
