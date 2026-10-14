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
  Filter,
  X,
  Building2,
  Wrench,
  Lock,
} from "lucide-react"

import type { UserTodoSummary, UserTodoTaskItem } from "@/lib/tasks/todo-service"
import { cn } from "@/lib/utils"

type FilterTab = "ALL" | "PENDING" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "COMPLETED"
type ObjectTypeFilter = "EQUIPMENT" | "ROOM"

interface TodoListPanelProps {
  todoData: UserTodoSummary
}

export function TodoListPanel({ todoData }: TodoListPanelProps) {
  const [activeTab, setActiveTab] = React.useState<FilterTab>("PENDING")
  const [selectedObjectType, setSelectedObjectType] = React.useState<ObjectTypeFilter>("EQUIPMENT")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [hasWorkPermit, setHasWorkPermit] = React.useState(false)

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const permit = window.sessionStorage.getItem("sparta_work_permit")
        const params = new URLSearchParams(window.location.search)
        if (permit || params.get("permit") === "done" || params.get("workPermit") === "fill") {
          setHasWorkPermit(true)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const { total, pending, completed, overdue, tasks } = todoData

  // Count per period dynamically
  const weeklyCount = React.useMemo(() => tasks.filter((t) => t.period === "WEEKLY").length, [tasks])
  const monthlyCount = React.useMemo(() => tasks.filter((t) => t.period === "MONTHLY").length, [tasks])
  const quarterlyCount = React.useMemo(() => tasks.filter((t) => t.period === "QUARTERLY").length, [tasks])
  const semesterCount = React.useMemo(() => tasks.filter((t) => t.period === "SEMESTER").length, [tasks])

  // Count pending per objectType
  const equipmentPendingCount = React.useMemo(
    () => tasks.filter((t) => t.objectType === "EQUIPMENT" && t.status !== "COMPLETED").length,
    [tasks],
  )
  const roomPendingCount = React.useMemo(
    () => tasks.filter((t) => t.objectType === "ROOM" && t.status !== "COMPLETED").length,
    [tasks],
  )

  // Filter tasks based on selectedObjectType, activeTab and searchQuery
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Object type filter (Equipment vs Room)
      if (task.objectType !== selectedObjectType) return false

      // Tab filter
      if (activeTab === "PENDING") {
        if (task.status === "COMPLETED") return false
      } else if (activeTab === "COMPLETED") {
        if (task.status !== "COMPLETED") return false
      } else if (activeTab === "WEEKLY") {
        if (task.period !== "WEEKLY") return false
      } else if (activeTab === "MONTHLY") {
        if (task.period !== "MONTHLY") return false
      } else if (activeTab === "QUARTERLY") {
        if (task.period !== "QUARTERLY") return false
      } else if (activeTab === "SEMESTER") {
        if (task.period !== "SEMESTER") return false
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
  }, [tasks, selectedObjectType, activeTab, searchQuery])

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <section className="mt-8">
      {/* Panel Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
        {/* Header Section */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
          {/* Top Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ff8a2a] text-black shadow-sm">
                <Sparkles className="size-4" />
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white">
                Tugas Rutin PIC (To-Do List)
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              Daftar checklist inventaris equipment & ruangan yang ditugaskan kepada Anda.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 border border-white/10">
              <Layers className="size-3.5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-300 leading-tight whitespace-nowrap">Total</p>
                <p className="text-xs font-bold text-white leading-tight">{total}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 border border-amber-500/20">
              <Clock className="size-3.5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-amber-300 leading-tight whitespace-nowrap">Pending</p>
                <p className="text-xs font-bold text-amber-400 leading-tight">{pending}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5 border border-rose-500/20">
              <AlertCircle className="size-3.5 text-rose-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-rose-300 leading-tight whitespace-nowrap">Terlewat</p>
                <p className="text-xs font-bold text-rose-400 leading-tight">{overdue}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 border border-emerald-500/20">
              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-emerald-300 leading-tight whitespace-nowrap">Selesai</p>
                <p className="text-xs font-bold text-emerald-400 leading-tight">{completed}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar (Placed below the 4 metric cards) */}
          <div className="mt-3.5 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">Progres Bulan Ini</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#ff8a2a]">{completionPercentage}%</span>
                <span className="text-xs text-slate-400 font-medium">({completed}/{total} selesai)</span>
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#ff8a2a] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 space-y-3">
          {/* Row 1: Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                activeTab === "PENDING"
                  ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
              )}
            >
              <Clock className="size-3.5" />
              Pending ({pending + overdue})
            </button>

            {/* Tab Mingguan */}
            {weeklyCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("WEEKLY")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  activeTab === "WEEKLY"
                    ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
                )}
              >
                Mingguan ({weeklyCount})
              </button>
            )}

            {/* Tab Bulanan */}
            {monthlyCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("MONTHLY")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  activeTab === "MONTHLY"
                    ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
                )}
              >
                Bulanan ({monthlyCount})
              </button>
            )}

            {/* Tab 3 Bulanan jika user punya penugasan 3 bulanan */}
            {quarterlyCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("QUARTERLY")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  activeTab === "QUARTERLY"
                    ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
                )}
              >
                3 Bulanan ({quarterlyCount})
              </button>
            )}

            {/* Tab 6 Bulanan jika user punya penugasan 6 bulanan */}
            {semesterCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("SEMESTER")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  activeTab === "SEMESTER"
                    ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
                )}
              >
                6 Bulanan ({semesterCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("COMPLETED")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                activeTab === "COMPLETED"
                  ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
              )}
            >
              <CheckCircle2 className="size-3.5" />
              Selesai ({completed})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                activeTab === "ALL"
                  ? "bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900 font-medium",
              )}
            >
              Semua ({total})
            </button>
          </div>

          {/* Row 2: Segmented Control (Equipment vs Ruangan) */}
          <div className="flex rounded-xl bg-slate-200/70 p-1 border border-slate-200">
            <button
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
            </button>
            <button
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
            </button>
          </div>

          {/* Row 3: Search Input (Placed directly above task cards) */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari alat atau ruangan..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-xs text-slate-800 placeholder-slate-400 shadow-xs transition-colors focus:border-[#ff8a2a] focus:outline-none focus:ring-1 focus:ring-[#ff8a2a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                aria-label="Bersihkan pencarian"
              >
                <X className="size-3.5" />
              </button>
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
                    Daftar Tugas Terkunci (Perlu Form Izin Kerja)
                  </p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Sesuai prosedur K3/SMK3, Anda harus melengkapi{" "}
                    <strong>Form Izin Kerja (SAT/FRM/MED/003)</strong> di atas sebelum dapat memulai checklist tugas rutin.
                  </p>
                </div>
              </div>
              <a
                href="#work-permit-section"
                className="shrink-0 self-start sm:self-center rounded-lg bg-amber-500/20 border border-amber-300/80 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-500/30 whitespace-nowrap"
              >
                Isi Izin Kerja &uarr;
              </a>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <CheckCircle2 className="size-10 text-emerald-500/50" />
              <h4 className="mt-3 text-sm font-semibold text-slate-800">
                {activeTab === "PENDING"
                  ? "Semua Tugas Sudah Selesai!"
                  : "Tidak ada tugas checklist yang sesuai"}
              </h4>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                {activeTab === "PENDING"
                  ? "Kerja bagus! Tidak ada checklist pending yang perlu Anda kerjakan saat ini."
                  : "Coba ubah filter atau kata kunci pencarian Anda."}
              </p>
            </div>
          ) : (
            <>
              {/* Scrollable Container dengan tinggi setara ~8 card dan scrollbar halus */}
              <div className="max-h-[460px] sm:max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {filteredTasks.map((task) => {
                    const isCompleted = task.status === "COMPLETED"
                    const isOverdue = task.status === "OVERDUE"

                    // Link direct ke form checklist tanpa mampir pilih area/ruangan
                    const taskUrl = `/dashboard/reports/new/checklist/${task.formSlug}?taskId=${task.id}&roomName=${encodeURIComponent(
                      task.objectName
                    )}&period=${task.period}`

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
                              {task.formCode.split("_")[0]}
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
                            {hasWorkPermit ? (
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

                    if (!hasWorkPermit) {
                      return (
                        <div
                          key={task.id}
                          className={cardClassName}
                          title="Lengkapi Form Izin Kerja di atas untuk membuka tugas ini"
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
