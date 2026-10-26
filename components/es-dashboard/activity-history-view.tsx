"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react"

import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import type { UserTodoSummary } from "@/lib/tasks/todo-service"
import { cn } from "@/lib/utils"

type MainTab = "COMPLETED" | "OVERDUE"
type ObjectFilter = "ALL" | "EQUIPMENT" | "ROOM"

interface ActivityHistoryViewProps {
  todoData: UserTodoSummary
  userEmail: string
  userRole: string
  initialTab?: "completed" | "overdue"
}

export function ActivityHistoryView({
  todoData,
  userEmail,
  userRole,
  initialTab,
}: ActivityHistoryViewProps) {
  const [activeTab, setActiveTab] = React.useState<MainTab>(
    initialTab === "overdue" ? "OVERDUE" : "COMPLETED"
  )
  const [objectFilter, setObjectFilter] = React.useState<ObjectFilter>("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")

  const { tasks, completed, overdue } = todoData

  // Filter tasks based on activeTab (COMPLETED vs OVERDUE)
  const tabTasks = React.useMemo(() => {
    return tasks.filter((t) =>
      activeTab === "COMPLETED"
        ? t.status === "COMPLETED"
        : t.status === "OVERDUE"
    )
  }, [tasks, activeTab])

  // Filter further by object type and search query
  const filteredTasks = React.useMemo(() => {
    return tabTasks.filter((task) => {
      // Object filter
      if (objectFilter === "EQUIPMENT" && task.objectType !== "EQUIPMENT")
        return false
      if (objectFilter === "ROOM" && task.objectType !== "ROOM") return false

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = task.objectName.toLowerCase().includes(q)
        const matchForm = task.formCode.toLowerCase().includes(q)
        const matchBranch = task.branchName?.toLowerCase().includes(q)
        return matchName || matchForm || matchBranch
      }

      return true
    })
  }, [tabTasks, objectFilter, searchQuery])

  const equipmentCount = React.useMemo(
    () => tabTasks.filter((t) => t.objectType === "EQUIPMENT").length,
    [tabTasks]
  )
  const roomCount = React.useMemo(
    () => tabTasks.filter((t) => t.objectType === "ROOM").length,
    [tabTasks]
  )

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-"
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-"
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <DashboardShell contentClassName="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl sm:px-6 md:px-8">
        <DashboardHeader
          email={userEmail}
          role={userRole}
          title="Aktivitas"
          countBadge={`${filteredTasks.length}`}
        />

        <div className="mt-5 space-y-4 pb-12">
          {/* Direct Search Bar - Compact rounded-lg */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 md:left-3.5 top-1/2 size-3.5 md:size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tugas, alat, ruangan, kode..."
              className="h-9 md:h-10 w-full rounded-lg md:rounded-xl border border-slate-200 bg-white pl-8.5 md:pl-10 pr-8 text-xs md:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-[#ff8a2a] focus:outline-none focus:ring-1 focus:ring-[#ff8a2a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Hapus pencarian"
              >
                <X className="size-3.5 md:size-4" />
              </button>
            )}
          </div>

          {/* 4 Equal-width Filter Buttons (rata kiri-kanan, soft orange on select) */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 md:gap-3 w-full">
            {/* Selesai */}
            <button
              type="button"
              onClick={() => setActiveTab("COMPLETED")}
              className={cn(
                "h-8 md:h-9 w-full inline-flex items-center justify-center gap-1 rounded-lg md:rounded-xl px-1.5 text-[11px] sm:text-xs md:text-sm transition-all cursor-pointer border",
                activeTab === "COMPLETED"
                  ? "bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-2xs ring-1 ring-orange-300/50"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              <CheckCircle2
                className={cn(
                  "size-3.5 md:size-4 shrink-0",
                  activeTab === "COMPLETED" ? "text-orange-500" : "text-slate-400"
                )}
              />
              <span className="truncate">Selesai</span>
            </button>

            {/* Terlewat */}
            <button
              type="button"
              onClick={() => setActiveTab("OVERDUE")}
              className={cn(
                "h-8 md:h-9 w-full inline-flex items-center justify-center gap-1 rounded-lg md:rounded-xl px-1.5 text-[11px] sm:text-xs md:text-sm transition-all cursor-pointer border",
                activeTab === "OVERDUE"
                  ? "bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-2xs ring-1 ring-orange-300/50"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              <AlertCircle
                className={cn(
                  "size-3.5 md:size-4 shrink-0",
                  activeTab === "OVERDUE" ? "text-orange-500" : "text-slate-400"
                )}
              />
              <span className="truncate">Terlewat</span>
            </button>

            {/* Equipment */}
            <button
              type="button"
              onClick={() =>
                setObjectFilter((prev) =>
                  prev === "EQUIPMENT" ? "ALL" : "EQUIPMENT"
                )
              }
              className={cn(
                "h-8 md:h-9 w-full inline-flex items-center justify-center gap-1 rounded-lg md:rounded-xl px-1.5 text-[11px] sm:text-xs md:text-sm transition-all cursor-pointer border",
                objectFilter === "EQUIPMENT"
                  ? "bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-2xs ring-1 ring-orange-300/50"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              <Wrench
                className={cn(
                  "size-3 md:size-3.5 shrink-0",
                  objectFilter === "EQUIPMENT" ? "text-orange-500" : "text-slate-400"
                )}
              />
              <span className="truncate">Equipment</span>
            </button>

            {/* Ruangan */}
            <button
              type="button"
              onClick={() =>
                setObjectFilter((prev) =>
                  prev === "ROOM" ? "ALL" : "ROOM"
                )
              }
              className={cn(
                "h-8 md:h-9 w-full inline-flex items-center justify-center gap-1 rounded-lg md:rounded-xl px-1.5 text-[11px] sm:text-xs md:text-sm transition-all cursor-pointer border",
                objectFilter === "ROOM"
                  ? "bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-2xs ring-1 ring-orange-300/50"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              <Building2
                className={cn(
                  "size-3 md:size-3.5 shrink-0",
                  objectFilter === "ROOM" ? "text-orange-500" : "text-slate-400"
                )}
              />
              <span className="truncate">Ruangan</span>
            </button>
          </div>

          {/* Looping dari shape history (List of history cards matching mobile invoice reference) */}
          <div className="space-y-3 pt-1">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-7 text-center shadow-2xs">
                {activeTab === "COMPLETED" ? (
                  <>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <FileText className="size-5" />
                    </div>
                    <h4 className="mt-2.5 text-sm font-bold text-slate-800">
                      Belum Ada Checklist Selesai
                    </h4>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                      {searchQuery
                        ? "Tidak ada riwayat selesai yang sesuai dengan kata kunci pencarian Anda."
                        : "Tugas checklist yang telah Anda selesaikan bulan ini akan tercatat di sini."}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles className="size-5" />
                    </div>
                    <h4 className="mt-2.5 text-sm font-bold text-slate-800">
                      Tidak Ada Tugas Terlewat!
                    </h4>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                      {searchQuery
                        ? "Tidak ada riwayat terlewat yang sesuai dengan pencarian Anda."
                        : "Luar biasa! Seluruh jadwal checklist Anda tertib sesuai batas waktu."}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === "COMPLETED"
                  const hasLink = Boolean(task.reportCode)
                  const taskHref = hasLink
                    ? `/dashboard/reports/${task.reportCode}`
                    : undefined

                  const cardInner = (
                    <div className="flex items-center justify-between gap-3 p-3">
                      {/* Left Icon */}
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        {task.objectType === "EQUIPMENT" ? (
                          <Wrench className="size-4.5 text-slate-700" />
                        ) : (
                          <Building2 className="size-4.5 text-slate-700" />
                        )}
                      </div>

                      {/* Middle Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {task.objectName}
                          </h4>
                          {/* Period Badge */}
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              task.period === "WEEKLY"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                                : "bg-purple-50 text-purple-700 border border-purple-200/70"
                            )}
                          >
                            {task.period === "WEEKLY" ? "Mingguan" : "Bulanan"}
                          </span>
                        </div>

                        {/* Subtitle with form code & branch */}
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {task.formCode.split("_")[0]}
                          {task.branchName ? ` · ${task.branchName}` : ""}
                        </p>

                        {/* Bottom Row: Status Badge & Date */}
                        <div className="mt-1.5 flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 className="size-3" />
                                Selesai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                <AlertCircle className="size-3" />
                                Terlewat
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {isCompleted ? (
                              <span>
                                Selesai:{" "}
                                <span className="font-semibold text-slate-700">
                                  {formatDateTime(task.completedAt)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-rose-600 font-medium">
                                Batas: {formatDate(task.targetDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Chevron */}
                      <div className="shrink-0 pl-1 text-slate-300">
                        {hasLink ? (
                          <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff8a2a]" />
                        ) : null}
                      </div>
                    </div>
                  )

                  const containerClass = cn(
                    "group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200",
                    hasLink
                      ? "hover:border-[#ff8a2a]/60 hover:shadow-xs cursor-pointer"
                      : "hover:border-slate-300"
                  )

                  if (hasLink && taskHref) {
                    return (
                      <Link key={task.id} href={taskHref} className={containerClass}>
                        {cardInner}
                      </Link>
                    )
                  }

                  return (
                    <div key={task.id} className={containerClass}>
                      {cardInner}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total Footer */}
            {filteredTasks.length > 0 && (
              <div className="flex items-center justify-between pt-2 text-[11px] sm:text-xs text-slate-400">
                <span>
                  Menampilkan {filteredTasks.length} riwayat {activeTab === "COMPLETED" ? "selesai" : "terlewat"}
                </span>
                <span>Periode bulan berjalan</span>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
