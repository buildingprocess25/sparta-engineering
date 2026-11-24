"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react"

import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChecklistStatusBadge } from "@/components/es-dashboard/checklist-status-badge"
import type { UserTodoSummary } from "@/lib/tasks/todo-service"
import { cn } from "@/lib/utils"

type MainTab = "SUBMITTED" | "COMPLETED" | "OVERDUE" | "REVISION"
type ObjectFilter = "ALL" | "EQUIPMENT" | "ROOM"

interface ActivityHistoryViewProps {
  todoData: UserTodoSummary
  userEmail: string
  userRole: string
  initialTab?: "submitted" | "completed" | "overdue" | "revision"
  reports: {
    id: string
    reportCode: string
    formCode: string | null
    isRoutine: boolean
    isEquipment: boolean
    status: string
    periodKey: string | null
    target: string
  }[]
}

export function ActivityHistoryView({
  todoData,
  userEmail,
  userRole,
  initialTab,
  reports,
}: ActivityHistoryViewProps) {
  const [activeTab, setActiveTab] = React.useState<MainTab>(
    initialTab === "revision" ? "REVISION" : initialTab === "overdue" ? "OVERDUE" : initialTab === "completed" ? "COMPLETED" : "SUBMITTED"
  )
  const [objectFilter, setObjectFilter] = React.useState<ObjectFilter>("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")

  const { tasks } = todoData
  const isRevisionTab = activeTab === "REVISION"
  const isReportTab = isRevisionTab || activeTab === "SUBMITTED"
  const query = searchQuery.trim().toLowerCase()
  const revisions = reports.filter((report) => report.status === "NEEDS_REVISION")
  const filteredReports = (isRevisionTab ? revisions : reports).filter((report) => {
    const matchesObject = isRevisionTab || objectFilter === "ALL" ||
      report.isEquipment === (objectFilter === "EQUIPMENT")
    return matchesObject && [report.reportCode, report.target, report.formCode, report.periodKey].some(
      (value) => value?.toLowerCase().includes(query),
    )
  })

  const tabTasks = React.useMemo(
    () => tasks.filter((task) => task.status === activeTab),
    [tasks, activeTab],
  )

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
      <DashboardShell className="es-report-surface" contentClassName="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl sm:px-6 md:px-8">
        <DashboardHeader
          email={userEmail}
          role={userRole}
          title="Aktivitas"
          countBadge={`${isReportTab ? filteredReports.length : filteredTasks.length}`}
        />

        <div className="mt-5 flex flex-col gap-4 pb-12">
          <InputGroup className="h-10 bg-background">
            <InputGroupInput
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Cari aktivitas"
              placeholder={isReportTab ? "Cari nomor laporan, alat, atau ruangan" : "Cari tugas, alat, ruangan, atau kode"}
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            {searchQuery && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                >
                  <X aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="activity-status-tabs grid h-auto! w-full grid-cols-2 sm:grid-cols-4" aria-label="Status aktivitas">
              <TabsTrigger value="SUBMITTED" className="min-h-9">
                <ClipboardList aria-hidden="true" /> Terkirim
              </TabsTrigger>
              <TabsTrigger value="COMPLETED" className="min-h-9">Sudah Preventif</TabsTrigger>
              <TabsTrigger value="OVERDUE" className="min-h-9">Terlewat</TabsTrigger>
              <TabsTrigger value="REVISION" className="min-h-9">
                Perlu Revisi {revisions.length > 0 && <span aria-label={`${revisions.length} laporan`}>({revisions.length})</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent key={activeTab} value={activeTab}>
              <div className="flex flex-col gap-3">
                {!isRevisionTab && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Jenis objek">
                    <Button
                      type="button"
                      variant="outline"
                      className={objectFilter === "EQUIPMENT" ? "border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100" : undefined}
                      aria-pressed={objectFilter === "EQUIPMENT"}
                      onClick={() => setObjectFilter((previous) => previous === "EQUIPMENT" ? "ALL" : "EQUIPMENT")}
                    >
                      <Wrench data-icon="inline-start" aria-hidden="true" /> Equipment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={objectFilter === "ROOM" ? "border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100" : undefined}
                      aria-pressed={objectFilter === "ROOM"}
                      onClick={() => setObjectFilter((previous) => previous === "ROOM" ? "ALL" : "ROOM")}
                    >
                      <Building2 data-icon="inline-start" aria-hidden="true" /> Ruangan
                    </Button>
                  </div>
                )}

                {isReportTab && (
                  <section aria-label={isRevisionTab ? "Laporan perlu revisi" : "Laporan terkirim"} className="space-y-2">
                    {filteredReports.length ? filteredReports.map((report) => (
                      <Link
                        key={report.id}
                        href={`/dashboard/reports/${encodeURIComponent(report.reportCode)}`}
                        className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <Card size="sm" className="transition-shadow group-hover:ring-orange-300">
                          <CardHeader>
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-800">
                                {report.isEquipment
                                  ? <Wrench className="size-4" aria-hidden="true" />
                                  : <Building2 className="size-4" aria-hidden="true" />}
                              </span>
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <CardTitle className="break-words">{report.target}</CardTitle>
                                <CardDescription className="break-words">
                                  {report.reportCode} · {report.isRoutine ? "Rutin" : "Non-rutin"}
                                </CardDescription>
                                {(report.formCode || report.periodKey) && (
                                  <p className="break-words text-xs text-muted-foreground">
                                    {[report.formCode, report.periodKey].filter(Boolean).join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <CardAction className="flex items-center gap-2">
                              <ChecklistStatusBadge status={report.status} />
                              <ChevronRight className="hidden size-4 text-muted-foreground group-hover:text-orange-800 sm:block" aria-hidden="true" />
                            </CardAction>
                          </CardHeader>
                        </Card>
                      </Link>
                    )) : (
                      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                        {query || (!isRevisionTab && objectFilter !== "ALL")
                          ? "Laporan tidak ditemukan."
                          : isRevisionTab ? "Tidak ada laporan perlu revisi." : "Belum ada laporan terkirim."}
                      </p>
                    )}
                  </section>
                )}

                {/* Looping dari shape history (List of history cards matching mobile invoice reference) */}
                <div hidden={isReportTab} className="space-y-3 pt-1">
                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-7 text-center shadow-2xs">
                      {activeTab === "COMPLETED" ? (
                        <>
                          <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <FileText className="size-5" />
                          </div>
                          <h4 className="mt-2.5 text-sm font-bold text-slate-800">
                            Belum Ada Hasil Preventif
                          </h4>
                          <p className="mt-1 max-w-xs text-xs text-slate-500">
                            {searchQuery
                              ? "Tidak ada hasil preventif yang sesuai dengan kata kunci pencarian Anda."
                              : "Tugas checklist yang sudah Anda kirim bulan ini akan tercatat di sini."}
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
                                <Badge variant="outline">
                                  {task.period === "WEEKLY" ? "Mingguan" : task.period === "QUARTERLY" ? "Triwulan" : task.period === "SEMESTER" ? "Semester" : "Bulanan"}
                                </Badge>
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
                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Sudah Preventif</Badge>
                                  ) : (
                                    <ChecklistStatusBadge status={task.status} />
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500">
                                  {isCompleted ? (
                                    <span>
                                      Preventif:{" "}
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
                        Menampilkan {filteredTasks.length} riwayat {activeTab === "COMPLETED" ? "preventif" : "terlewat"}
                      </span>
                      <span>Periode bulan berjalan</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
