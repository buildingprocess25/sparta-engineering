"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, CheckCircle2, FileText } from "lucide-react"

import type { RealReportItem } from "@/lib/manager-dashboard-types"
import { ReportReviewModal } from "./report-review-modal"
import { cn } from "@/lib/utils"

interface ManagerPendingReviewCardProps {
  reports: RealReportItem[]
  viewerRole?: string
}

function calculateAgeInDays(date: Date | string): number {
  const created = new Date(date).getTime()
  const now = Date.now()
  const diffDays = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)))
  return diffDays
}

function formatDateIndo(date: Date | string): string {
  try {
    const d = new Date(date)
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

export function ManagerPendingReviewCard({
  reports,
  viewerRole = "ADMIN HO",
}: ManagerPendingReviewCardProps) {
  const [selectedReport, setSelectedReport] = React.useState<RealReportItem | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Prioritize pending reports, otherwise take recent reports
  const pendingReports = React.useMemo(() => {
    const pending = reports.filter(
      (r) => r.status === "PENDING_COORD" || r.status === "PENDING_MANAGER"
    )
    if (pending.length > 0) {
      return pending.slice(0, 5)
    }
    return reports.slice(0, 5)
  }, [reports])

  const handleOpenReview = (report: RealReportItem) => {
    setSelectedReport(report)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div>
          {/* Card Header matching BMC Dashboard screenshot */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Laporan Menunggu Review
                </h2>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/80">
                  {reports.filter((r) => r.status === "PENDING_COORD" || r.status === "PENDING_MANAGER").length} Antrean
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Estimasi dan penyelesaian pekerjaan yang perlu segera ditinjau.
              </p>
            </div>

            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
            >
              Buka tabel
              <ArrowUpRight className="size-3.5 text-slate-500" />
            </Link>
          </div>

          {/* Table Container */}
          <div className="mt-4 overflow-x-auto">
            {pendingReports.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-700">
                  Semua Laporan Sudah Direview
                </p>
                <p className="text-[11px] text-slate-400">
                  Tidak ada antrean laporan pending untuk saat ini.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4 font-bold">Laporan</th>
                    <th className="pb-3 px-4 font-bold">Lokasi & Target</th>
                    <th className="pb-3 px-3 font-bold text-center">Status</th>
                    <th className="pb-3 pl-3 font-bold text-right">Umur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingReports.map((report) => {
                    const ageDays = calculateAgeInDays(report.createdAt)
                    const isCoord = report.status === "PENDING_COORD"
                    const isManager = report.status === "PENDING_MANAGER"
                    const isCompleted = report.status === "COMPLETED"

                    return (
                      <tr
                        key={report.id}
                        onClick={() => handleOpenReview(report)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                      >
                        {/* Laporan Col */}
                        <td className="py-3.5 pr-4 align-top">
                          <div className="flex items-center gap-1 font-bold text-sky-600 group-hover:text-sky-700">
                            <span>{report.reportCode || `ENG-${report.id.slice(0, 8).toUpperCase()}`}</span>
                            <ArrowUpRight className="size-3 text-sky-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateIndo(report.createdAt)}
                          </p>
                        </td>

                        {/* Lokasi & Target Col */}
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-bold text-slate-800 line-clamp-1">
                            {report.area.name} {report.room ? `: ${report.room.name}` : report.equipment ? `: ${report.equipment.name}` : ""}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Teknisi: {report.author.name} ({report.author.role || "ES"})
                          </p>
                        </td>

                        {/* Status Col */}
                        <td className="py-3.5 px-3 align-top text-center">
                          {isCoord && (
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200/80">
                              Review Coord
                            </span>
                          )}
                          {isManager && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/80">
                              Review Manager
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                              Selesai
                            </span>
                          )}
                          {!isCoord && !isManager && !isCompleted && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                              {report.status}
                            </span>
                          )}
                        </td>

                        {/* Umur Col */}
                        <td className="py-3.5 pl-3 align-top text-right">
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200/70">
                            {ageDays} hari
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Menampilkan 5 laporan teratas dari database riil</span>
          <Link
            href="/dashboard/reports"
            className="font-semibold text-[#ff8a2a] hover:underline"
          >
            Lihat semua laporan &rarr;
          </Link>
        </div>
      </div>

      {/* Review Modal Dialog */}
      <ReportReviewModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewerRole={viewerRole}
      />
    </>
  )
}
