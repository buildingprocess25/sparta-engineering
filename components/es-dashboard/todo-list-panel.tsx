"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Sparkles,
  ChevronRight,
  X,
  Building2,
  Wrench,
  Lock,
  ArrowUp,
} from "lucide-react"

import type { UserTodoSummary, UserTodoTaskItem } from "@/lib/tasks/todo-service"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkPermitStatusData } from "@/components/es-dashboard/work-permit-card"
import { useClientWorkPermit } from "@/lib/work-permits/use-client-work-permit"

type PeriodFilter = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER"
type ObjectTypeFilter = "EQUIPMENT" | "ROOM"

interface TodoListPanelProps {
  todoData: UserTodoSummary
  userNik?: string
  workPermitStatus?: WorkPermitStatusData
}

export function TodoListPanel({ todoData, userNik, workPermitStatus }: TodoListPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodFilter | null>(null)
  const [selectedObjectType, setSelectedObjectType] = React.useState<ObjectTypeFilter>("EQUIPMENT")
  const [searchQuery, setSearchQuery] = React.useState("")
  const hasWorkPermit = useClientWorkPermit(userNik, workPermitStatus)

  const { total, pending, completed, overdue, tasks } = todoData

  // Di To-Do List Dashboard HANYA menampilkan tugas aktif PENDING (belum lewat batas waktu)
  // Tugas OVERDUE (Terlewat) dan COMPLETED (Selesai) dipindahkan sepenuhnya ke menu Aktivitas
  const actionablePendingTasks = React.useMemo(
    () => tasks.filter((t) => t.status === "PENDING"),
    [tasks]
  )

  // Count per period dynamically (hanya tugas PENDING aktif)
  const weeklyCount = React.useMemo(
    () => actionablePendingTasks.filter((t) => t.period === "WEEKLY").length,
    [actionablePendingTasks]
  )
  const monthlyCount = React.useMemo(
    () => actionablePendingTasks.filter((t) => t.period === "MONTHLY").length,
    [actionablePendingTasks]
  )
  const quarterlyCount = React.useMemo(
    () => actionablePendingTasks.filter((t) => t.period === "QUARTERLY").length,
    [actionablePendingTasks]
  )
  const semesterCount = React.useMemo(
    () => actionablePendingTasks.filter((t) => t.period === "SEMESTER").length,
    [actionablePendingTasks]
  )

  // Count pending per objectType (hanya tugas PENDING aktif)
  const equipmentPendingCount = React.useMemo(
    () => actionablePendingTasks.filter((t) => t.objectType === "EQUIPMENT").length,
    [actionablePendingTasks]
  )
  const roomPendingCount = React.useMemo(
    () => actionablePendingTasks.filter((t) => t.objectType === "ROOM").length,
    [actionablePendingTasks]
  )

  // Filter tasks based on selectedObjectType, selectedPeriod and searchQuery (hanya tugas PENDING)
  const filteredTasks = React.useMemo(() => {
    return actionablePendingTasks.filter((task) => {
      // Object type filter (Equipment vs Room)
      if (task.objectType !== selectedObjectType) return false

      // Period filter (from period pill buttons)
      if (selectedPeriod) {
        if (task.period !== selectedPeriod) return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = task.objectName.toLowerCase().includes(query)
        const matchForm = task.formCode.toLowerCase().includes(query)
        const matchBranch = task.branchName?.toLowerCase().includes(query)
        return matchName || matchForm || matchBranch
      }

      return true
    })
  }, [actionablePendingTasks, selectedObjectType, selectedPeriod, searchQuery])

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <section className="mt-8">
      {/* Panel Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
        {/* Header Section - light working surface */}
        <div className="border-b border-slate-200 bg-white p-5 text-slate-900">
          {/* Top Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff8a2a] text-black shadow-xs">
                <Clock className="size-4 stroke-[2.5]" />
              </span>
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Tugas Rutin PIC (To-Do List)
              </h3>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* Total */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                <Layers className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-600 leading-tight">Total</p>
                <p className="text-sm font-bold text-slate-900 font-mono leading-tight mt-0.5">{total}</p>
              </div>
            </div>

            {/* Pending (Hero Focus Metric) */}
            <div className="flex items-center gap-2.5 rounded-xl border border-[#ff8a2a]/60 bg-[#ff8a2a]/10 px-3 py-2 text-left shadow-xs ring-1 ring-[#ff8a2a]/30">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff8a2a]/20 text-orange-800">
                <Clock className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-orange-800 leading-tight">Belum Preventif</p>
                <p className="text-sm font-black text-orange-800 font-mono leading-tight mt-0.5">{pending}</p>
              </div>
            </div>

            {/* Terlewat (Link to Checklist Rutin) */}
            <Link
              href="/dashboard/checklists?status=OVERDUE"
              className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700 group-hover:bg-rose-500/25 transition-colors">
                <AlertCircle className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-slate-600 leading-tight">Terlewat</p>
                  <ChevronRight className="size-3 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900" />
                </div>
                <p className="text-sm font-bold text-rose-700 font-mono leading-tight mt-0.5">{overdue}</p>
              </div>
            </Link>

            {/* Selesai (Link to Checklist Rutin) */}
            <Link
              href="/dashboard/checklists?status=COMPLETED"
              className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 group-hover:bg-emerald-500/25 transition-colors">
                <CheckCircle2 className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-slate-600 leading-tight">Sudah Preventif</p>
                  <ChevronRight className="size-3 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900" />
                </div>
                <p className="text-sm font-bold text-emerald-700 font-mono leading-tight mt-0.5">{completed}</p>
              </div>
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Progres Bulan Ini</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-orange-800">{total ? `${completionPercentage}%` : "—"}</span>
                <span className="text-[11px] text-slate-600">({completed}/{total} selesai)</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#ff8a2a] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <Link href="/dashboard/preventive" className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-orange-800 hover:underline focus-visible:outline-2 focus-visible:outline-orange-500">Lihat analisis preventif <ChevronRight className="size-4" aria-hidden="true" /></Link>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 space-y-3">
          {/* Row 1: Filter Periode (Mingguan, Bulanan, 3 Bulanan, 6 Bulanan) */}
          {(weeklyCount > 0 || monthlyCount > 0 || quarterlyCount > 0 || semesterCount > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {weeklyCount > 0 && (
                <Button variant="ghost" size="sm"
                  type="button"
                  onClick={() =>
                    setSelectedPeriod((prev) =>
                      prev === "WEEKLY" ? null : "WEEKLY"
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                    selectedPeriod === "WEEKLY"
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium"
                  )}
                >
                  Mingguan ({weeklyCount})
                </Button>
              )}

              {monthlyCount > 0 && (
                <Button variant="ghost" size="sm"
                  type="button"
                  onClick={() =>
                    setSelectedPeriod((prev) =>
                      prev === "MONTHLY" ? null : "MONTHLY"
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                    selectedPeriod === "MONTHLY"
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium"
                  )}
                >
                  Bulanan ({monthlyCount})
                </Button>
              )}

              {quarterlyCount > 0 && (
                <Button variant="ghost" size="sm"
                  type="button"
                  onClick={() =>
                    setSelectedPeriod((prev) =>
                      prev === "QUARTERLY" ? null : "QUARTERLY"
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                    selectedPeriod === "QUARTERLY"
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium"
                  )}
                >
                  3 Bulanan ({quarterlyCount})
                </Button>
              )}

              {semesterCount > 0 && (
                <Button variant="ghost" size="sm"
                  type="button"
                  onClick={() =>
                    setSelectedPeriod((prev) =>
                      prev === "SEMESTER" ? null : "SEMESTER"
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                    selectedPeriod === "SEMESTER"
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium"
                  )}
                >
                  6 Bulanan ({semesterCount})
                </Button>
              )}
            </div>
          )}

          {/* Row 2: Segmented Control (Equipment vs Ruangan) */}
          <div className="flex rounded-xl bg-slate-200/70 p-1 border border-slate-200">
            <Button variant="ghost"
              type="button"
              onClick={() => setSelectedObjectType("EQUIPMENT")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all",
                selectedObjectType === "EQUIPMENT"
                  ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60",
              )}
            >
              <Wrench className="size-3.5" />
              Equipment ({equipmentPendingCount})
            </Button>
            <Button variant="ghost"
              type="button"
              onClick={() => setSelectedObjectType("ROOM")}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all",
                selectedObjectType === "ROOM"
                  ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60",
              )}
            >
              <Building2 className="size-3.5" />
              Ruangan ({roomPendingCount})
            </Button>
          </div>

          {/* Row 3: Search Input (Placed directly above task cards) */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input aria-label="Cari alat atau ruangan"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari alat atau ruangan..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-xs text-slate-800 placeholder-slate-400 shadow-xs transition-colors focus:border-[#ff8a2a] focus:outline-none focus:ring-1 focus:ring-[#ff8a2a]"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon-xs"
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                aria-label="Bersihkan pencarian"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Task Cards List */}
        <div className="p-4">
          {!hasWorkPermit && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-800">
                  <Lock className="size-4" />
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-bold text-amber-950">
                    {workPermitStatus?.status === "PENDING_MANAGER"
                      ? "Daftar Tugas Terkunci (Menunggu Persetujuan Manager)"
                      : workPermitStatus?.status === "PENDING_P2K3"
                      ? "Daftar Tugas Terkunci (Menunggu Persetujuan P2K3)"
                      : workPermitStatus?.status === "PENDING_SECRETARY"
                      ? "Daftar Tugas Terkunci (Menunggu Persetujuan Sekretaris P2K3)"
                      : workPermitStatus?.status === "REJECTED"
                      ? "Daftar Tugas Terkunci (Izin Kerja Perlu Revisi)"
                      : workPermitStatus?.status === "EXPIRED"
                      ? "Daftar Tugas Terkunci (Izin Kerja Periode Lalu Telah Berakhir)"
                      : "Daftar Tugas Terkunci (Perlu Form Izin Kerja)"}
                  </p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    {workPermitStatus?.status === "PENDING_MANAGER"
                      ? "Pengajuan Form Izin Kerja (SAT/FRM/MED/003) sedang ditinjau Manager. Kartu checklist akan otomatis terbuka setelah seluruh persetujuan disetujui."
                      : workPermitStatus?.status === "PENDING_P2K3"
                      ? "Form Izin Kerja telah disetujui Manager dan sedang menunggu verifikasi P2K3/Delegate. Kartu checklist akan otomatis terbuka setelah seluruh persetujuan lengkap."
                      : workPermitStatus?.status === "PENDING_SECRETARY"
                      ? "Form Izin Kerja sedang menunggu persetujuan akhir Sekretaris P2K3. Kartu checklist akan otomatis terbuka setelah disetujui."
                      : workPermitStatus?.status === "REJECTED"
                      ? "Pengajuan izin kerja ditolak. Silakan periksa catatan revisi dan ajukan kembali."
                      : workPermitStatus?.status === "EXPIRED"
                      ? "Masa berlaku izin kerja periode sebelumnya telah habis. Silakan perbarui Form Izin Kerja untuk bulan ini agar tugas checklist terbuka."
                      : "Sesuai prosedur K3/SMK3, Anda harus melengkapi Form Izin Kerja (SAT/FRM/MED/003) dan disetujui sebelum dapat memulai tugas rutin."}
                  </p>
                </div>
              </div>
              <a
                href="#work-permit-section"
                className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-300/80 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-500/30 whitespace-nowrap"
              >
                <span>
                  {workPermitStatus?.status === "PENDING_MANAGER" ||
                  workPermitStatus?.status === "PENDING_P2K3" ||
                  workPermitStatus?.status === "PENDING_SECRETARY"
                    ? "Lihat Status"
                    : workPermitStatus?.status === "REJECTED"
                    ? "Revisi Izin Kerja"
                    : workPermitStatus?.status === "EXPIRED"
                    ? "Perbarui Izin Kerja"
                    : "Isi Izin Kerja"}
                </span>
                <ArrowUp className="size-3.5" />
              </a>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <CheckCircle2 className="size-10 text-emerald-500/50" />
              <h4 className="mt-3 text-sm font-semibold text-slate-800">
                {searchQuery || selectedPeriod
                  ? "Tidak ada tugas checklist yang sesuai filter"
                  : "Semua Tugas Aktif Selesai!"}
              </h4>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                {searchQuery || selectedPeriod
                  ? "Coba ubah kata kunci pencarian atau reset filter periode."
                  : "Kerja bagus! Tidak ada checklist pending yang perlu Anda kerjakan saat ini."}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/dashboard/activity"
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
                >
                  Lihat Riwayat & Aktivitas
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Container dengan tinggi setara ~8 card dan scrollbar halus */}
              <div className="max-h-[460px] sm:max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {filteredTasks.map((task) => {
                    const isCompleted = task.status === "COMPLETED"
                    const isOverdue = task.status === "OVERDUE"

                    const taskUrl = task.formSlug
                      ? `/dashboard/reports/new/checklist/${task.formSlug}?taskId=${task.id}`
                      : null
                    const canOpenTask = hasWorkPermit && taskUrl !== null

                    const cardContent = (
                      <>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Period Pill */}
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                !hasWorkPermit
                                  ? "bg-slate-100 text-slate-500 border border-slate-200"
                                  : task.period === "WEEKLY"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : task.period === "QUARTERLY"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : task.period === "SEMESTER"
                                  ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              )}
                            >
                              {task.period === "WEEKLY"
                                ? "Mingguan"
                                : task.period === "QUARTERLY"
                                ? "3 Bulanan"
                                : task.period === "SEMESTER"
                                ? "6 Bulanan"
                                : "Bulanan"}
                            </span>

                            {/* Form Code */}
                            <span className="text-[10px] font-medium text-slate-400">
                              {task.formSlug?.replaceAll("-", "_").toUpperCase() ?? task.formCode}
                            </span>
                          </div>

                          {/* Status Badge & Arrow / Lock */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!hasWorkPermit ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                <Lock className="size-3 text-slate-500" />
                                Terkunci
                              </span>
                            ) : isCompleted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="size-3" />
                                Selesai
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                <AlertCircle className="size-3" />
                                Terlewat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Clock className="size-3" />
                                Pending
                              </span>
                            )}
                            {canOpenTask ? (
                              <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff8a2a]" />
                            ) : (
                              <Lock className="size-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Object Name */}
                        <div className="mt-2">
                          <h4
                            className={cn(
                              "text-sm font-bold leading-snug transition-colors",
                              !hasWorkPermit
                                ? "text-slate-500"
                                : "text-slate-900 group-hover:text-[#ff8a2a]"
                            )}
                          >
                            {task.objectName}
                          </h4>
                          {!taskUrl && (
                            <p className="mt-1 text-xs text-slate-600">Form belum terdaftar. Hubungi BEC.</p>
                          )}
                        </div>
                      </>
                    )

                    const cardClassName = cn(
                      "group relative flex flex-col justify-between rounded-xl border p-3 transition-all duration-200",
                      !hasWorkPermit
                        ? "border-slate-200/80 bg-slate-50/60 opacity-60 cursor-not-allowed select-none"
                        : isCompleted
                        ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:shadow-xs"
                        : isOverdue
                        ? "border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:shadow-xs"
                        : "border-slate-200 bg-white hover:border-[#ff8a2a] hover:bg-orange-50/10 hover:shadow-xs"
                    )

                    if (!canOpenTask) {
                      return (
                        <div
                          key={task.id}
                          className={cardClassName}
                          title={hasWorkPermit ? undefined : "Lengkapi Form Izin Kerja di atas untuk membuka tugas ini"}
                          aria-disabled="true"
                        >
                          {cardContent}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={task.id}
                        href={taskUrl}
                        className={cardClassName}
                      >
                        {cardContent}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Status bar indikator total tugas */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span>Total {filteredTasks.length} tugas</span>
                <span className="text-slate-400">Gulir (scroll) untuk melihat seluruh daftar</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
