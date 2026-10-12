"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Sparkles,
  Wrench,
  DoorOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react"

import type { UserTodoSummary, UserTodoTaskItem } from "@/lib/tasks/todo-service"
import { cn } from "@/lib/utils"

type FilterTab = "ALL" | "PENDING" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "COMPLETED"

interface TodoListPanelProps {
  todoData: UserTodoSummary
}

export function TodoListPanel({ todoData }: TodoListPanelProps) {
  const [activeTab, setActiveTab] = React.useState<FilterTab>("PENDING")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 6

  const { total, pending, completed, overdue, tasks } = todoData

  // Count per period dynamically
  const weeklyCount = React.useMemo(() => tasks.filter((t) => t.period === "WEEKLY").length, [tasks])
  const monthlyCount = React.useMemo(() => tasks.filter((t) => t.period === "MONTHLY").length, [tasks])
  const quarterlyCount = React.useMemo(() => tasks.filter((t) => t.period === "QUARTERLY").length, [tasks])
  const semesterCount = React.useMemo(() => tasks.filter((t) => t.period === "SEMESTER").length, [tasks])

  // Filter tasks based on activeTab and searchQuery
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, activeTab, searchQuery])

  // Reset page to 1 when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage))
  const paginatedTasks = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTasks.slice(start, start + itemsPerPage)
  }, [filteredTasks, currentPage, itemsPerPage])

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <section className="mt-8">
      {/* Panel Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
        {/* Header Section */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
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

            {/* Quick Completion Progress Bar */}
            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-sm sm:w-64">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">Progres Bulan Ini</span>
                  <span className="font-bold text-[#ff8a2a]">{completionPercentage}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-[#ff8a2a] transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {completed}/{total}
              </span>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 border border-white/10">
              <Layers className="size-4 text-slate-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Tugas</p>
                <p className="text-sm font-bold text-white">{total}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 border border-amber-500/20">
              <Clock className="size-4 text-amber-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-300">Belum Selesai</p>
                <p className="text-sm font-bold text-amber-400">{pending}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 border border-rose-500/20">
              <AlertCircle className="size-4 text-rose-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-rose-300">Terlewat</p>
                <p className="text-sm font-bold text-rose-400">{overdue}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 border border-emerald-500/20">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-300">Selesai</p>
                <p className="text-sm font-bold text-emerald-400">{completed}</p>
              </div>
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
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "PENDING"
                  ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
              )}
            >
              <Clock className="size-3.5" />
              Perlu Dikerjakan ({pending + overdue})
            </button>

            {/* Tab Mingguan */}
            {weeklyCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("WEEKLY")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "WEEKLY"
                    ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
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
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "MONTHLY"
                    ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
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
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "QUARTERLY"
                    ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
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
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "SEMESTER"
                    ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
                )}
              >
                6 Bulanan ({semesterCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("COMPLETED")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "COMPLETED"
                  ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
              )}
            >
              <CheckCircle2 className="size-3.5" />
              Selesai ({completed})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "ALL"
                  ? "bg-[#ff8a2a] text-black shadow-xs ring-1 ring-[#ff8a2a]"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
              )}
            >
              Semua ({total})
            </button>
          </div>

          {/* Row 2: Search Input (Full width, placed below tabs) */}
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
          {paginatedTasks.length === 0 ? (
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {paginatedTasks.map((task) => {
                const isCompleted = task.status === "COMPLETED"
                const isOverdue = task.status === "OVERDUE"

                // Target date formatting
                const targetDateFormatted = new Intl.DateTimeFormat("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(task.targetDate))

                // Link direct ke form checklist tanpa mampir pilih area/ruangan
                const taskUrl = `/dashboard/reports/new/checklist/${task.formSlug}?taskId=${task.id}&roomName=${encodeURIComponent(
                  task.objectName
                )}&period=${task.period}`

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200",
                      isCompleted
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isOverdue
                        ? "border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:shadow-md"
                        : "border-slate-200 bg-white hover:border-[#ff8a2a]/50 hover:shadow-md"
                    )}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Object Type Pill */}
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {task.objectType === "EQUIPMENT" ? (
                              <>
                                <Wrench className="size-3 text-slate-500" />
                                Unit
                              </>
                            ) : (
                              <>
                                <DoorOpen className="size-3 text-slate-500" />
                                Ruangan
                              </>
                            )}
                          </span>

                          {/* Period Pill */}
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                              task.period === "WEEKLY"
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

                        {/* Status Badge */}
                        {isCompleted ? (
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
                      </div>

                      {/* Object Name & Details */}
                      <div className="mt-3">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#ff8a2a] transition-colors">
                          {task.objectName}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          {task.branchName && (
                            <span>Cabang: {task.branchName}</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-slate-400" />
                            Batas: {targetDateFormatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isCompleted
                          ? "Tugas telah diselesaikan"
                          : "Klik untuk membuka form"}
                      </span>

                      {isCompleted ? (
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3.5" />
                          Terdata
                        </div>
                      ) : (
                        <Link
                          href={taskUrl}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff8a2a] px-3 py-1.5 text-xs font-bold text-black shadow-sm transition-all hover:bg-[#ff9c48] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a2a]"
                        >
                          Kerjakan
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)} dari{" "}
                {filteredTasks.length} tugas
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="px-2 text-xs font-medium text-slate-600">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
