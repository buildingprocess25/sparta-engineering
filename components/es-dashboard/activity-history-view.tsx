"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Search,
  Sparkles,
  Wrench,
  X,
  FileText,
} from "lucide-react"

import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import type { UserTodoSummary, UserTodoTaskItem } from "@/lib/tasks/todo-service"
import { cn } from "@/lib/utils"

type MainTab = "COMPLETED" | "OVERDUE"
type ObjectFilter = "ALL" | "EQUIPMENT" | "ROOM"

interface ActivityHistoryViewProps {
  todoData: UserTodoSummary
  userEmail: string
  userRole: string
}

export function ActivityHistoryView({
  todoData,
  userEmail,
  userRole,
}: ActivityHistoryViewProps) {
  const searchParams = useSearchParams()
  const initialTabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = React.useState<MainTab>(
    initialTabParam === "overdue" ? "OVERDUE" : "COMPLETED"
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
      <DashboardShell>
        <DashboardHeader email={userEmail} role={userRole} />

        <div className="space-y-5 pb-8">
          {/* Header Banner */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ff8a2a] text-black shadow-sm">
                  <History className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    Aktivitas & Riwayat Checklist
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Catatan tugas checklist yang telah selesai dikerjakan dan yang terlewat.
                  </p>
                </div>
              </div>

              {/* Quick Summary Pill Counters */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("COMPLETED")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                    activeTab === "COMPLETED"
                      ? "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/50 shadow-xs"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-emerald-300">
                      Selesai
                    </p>
                    <p className="text-base font-bold text-white">
                      {completed}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("OVERDUE")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                    activeTab === "OVERDUE"
                      ? "border-rose-400 bg-rose-500/20 ring-1 ring-rose-400/50 shadow-xs"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertCircle className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-rose-300">
                      Terlewat
                    </p>
                    <p className="text-base font-bold text-white">
                      {overdue}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Segmented Control Tabs (Opsi A: Selesai vs Terlewat) */}
            <div className="border-b border-slate-100 bg-slate-50/70 p-3">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-200/80 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("COMPLETED")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all",
                    activeTab === "COMPLETED"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      "size-3.5",
                      activeTab === "COMPLETED"
                        ? "text-emerald-600"
                        : "text-slate-400"
                    )}
                  />
                  Selesai ({completed})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("OVERDUE")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all",
                    activeTab === "OVERDUE"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <AlertCircle
                    className={cn(
                      "size-3.5",
                      activeTab === "OVERDUE"
                        ? "text-rose-600"
                        : "text-slate-400"
                    )}
                  />
                  Terlewat ({overdue})
                </button>
              </div>
            </div>

            {/* Sub-Filters & Search Bar */}
            <div className="border-b border-slate-100 bg-white p-3.5 space-y-2.5">
              {/* Filter Objek */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setObjectFilter("ALL")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    objectFilter === "ALL"
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  )}
                >
                  Semua ({tabTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setObjectFilter("EQUIPMENT")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    objectFilter === "EQUIPMENT"
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  )}
                >
                  <Wrench className="size-3" />
                  Equipment ({equipmentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setObjectFilter("ROOM")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    objectFilter === "ROOM"
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  )}
                >
                  <Building2 className="size-3" />
                  Ruangan ({roomCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari riwayat ${
                    activeTab === "COMPLETED" ? "selesai" : "terlewat"
                  }...`}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8.5 pr-8 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-[#ff8a2a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ff8a2a]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Cards */}
            <div className="p-4">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  {activeTab === "COMPLETED" ? (
                    <>
                      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <FileText className="size-6" />
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-slate-800">
                        Belum Ada Checklist Selesai
                      </h4>
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        {searchQuery
                          ? "Tidak ada data riwayat selesai yang sesuai pencarian Anda."
                          : "Tugas checklist yang telah Anda selesaikan bulan ini akan tercatat di sini."}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Sparkles className="size-6" />
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-slate-800">
                        Tidak Ada Tugas Terlewat!
                      </h4>
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        {searchQuery
                          ? "Tidak ada data riwayat terlewat yang sesuai pencarian Anda."
                          : "Luar biasa! Seluruh jadwal checklist Anda tertib sesuai batas waktu."}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {filteredTasks.map((task) => {
                    const isCompleted = task.status === "COMPLETED"

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex flex-col justify-between rounded-xl border p-3.5 transition-all",
                          isCompleted
                            ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                            : "border-rose-200 bg-rose-50/20"
                        )}
                      >
                        <div>
                          {/* Badges Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                  task.period === "WEEKLY"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                )}
                              >
                                {task.period === "WEEKLY"
                                  ? "Mingguan"
                                  : "Bulanan"}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {task.formCode.split("_")[0]}
                              </span>
                            </div>

                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="size-3" />
                                Selesai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                <AlertCircle className="size-3" />
                                Terlewat
                              </span>
                            )}
                          </div>

                          {/* Object Name */}
                          <div className="mt-2.5">
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {task.objectName}
                            </h4>
                            {task.branchName && (
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Cabang: {task.branchName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer Card */}
                        <div className="mt-3.5 border-t border-slate-200/60 pt-2.5 flex items-center justify-between text-xs">
                          {isCompleted ? (
                            <>
                              <div className="text-[11px] text-slate-500">
                                <span>Selesai: </span>
                                <span className="font-semibold text-slate-700">
                                  {formatDateTime(task.completedAt)}
                                </span>
                              </div>
                              {task.reportCode ? (
                                <Link
                                  href={`/dashboard/reports/${task.reportCode}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                                >
                                  Lihat Form
                                  <ChevronRight className="size-3" />
                                </Link>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Laporan tersimpan
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-[11px] text-rose-700">
                                <span className="text-slate-500">
                                  Batas Waktu:{" "}
                                </span>
                                <span className="font-semibold">
                                  {formatDate(task.targetDate)}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                                Kedaluwarsa (Read-only)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total Summary Footer */}
              <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Total {filteredTasks.length}{" "}
                  {activeTab === "COMPLETED" ? "selesai" : "terlewat"}
                </span>
                <span className="text-slate-400">
                  Periode bulan berjalan
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
