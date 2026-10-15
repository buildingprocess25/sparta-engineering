"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  PanelLeft,
  Search,
  X,
} from "lucide-react"
import * as XLSX from "xlsx"

import type { RealReportItem } from "@/lib/manager-dashboard-types"
import { ReportReviewModal } from "./report-review-modal"
import { cn } from "@/lib/utils"

interface AdminReportsTableProps {
  initialReports: RealReportItem[]
  viewerRole?: string
  userEmail?: string
  onToggleSidebar?: () => void
}

type QuickFilterKey =
  | "all"
  | "active"
  | "over_sla"
  | "review_coord"
  | "review_manager"
  | "revision"
  | "completed"
  | "draft"

const QUICK_FILTERS: { key: QuickFilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Laporan aktif" },
  { key: "over_sla", label: "Lewat SLA" },
  { key: "review_coord", label: "Review Coord" },
  { key: "review_manager", label: "Review Manager" },
  { key: "revision", label: "Revisi" },
  { key: "completed", label: "Selesai" },
  { key: "draft", label: "Draft" },
]

function formatIndoDateTime(date: Date | string): string {
  try {
    const d = new Date(date)
    const datePart = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    const timePart = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${datePart}, ${timePart.replace(":", ".")}`
  } catch {
    return "-"
  }
}

export function AdminReportsTable({
  initialReports,
  viewerRole = "MANAGER",
  userEmail = "admin@admin.com",
  onToggleSidebar,
}: AdminReportsTableProps) {
  const router = useRouter()
  const [reports, setReports] = React.useState<RealReportItem[]>(initialReports)
  const [quickFilter, setQuickFilter] = React.useState<QuickFilterKey>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedArea, setSelectedArea] = React.useState<"ALL" | "OFFICE" | "WAREHOUSE">("ALL")
  const [selectedCategory, setSelectedCategory] = React.useState<"ALL" | "PREVENTIVE" | "INCIDENTAL">("ALL")
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [selectedReportForReview, setSelectedReportForReview] =
    React.useState<RealReportItem | null>(null)

  React.useEffect(() => {
    setReports(initialReports)
  }, [initialReports])

  // Filter calculation
  const filteredReports = React.useMemo(() => {
    return reports.filter((r) => {
      // Area filter
      if (selectedArea !== "ALL" && r.area.type !== selectedArea) return false

      // Category filter
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false

      // Quick filter
      if (quickFilter === "active") {
        if (
          r.status !== "PENDING_COORD" &&
          r.status !== "PENDING_MANAGER" &&
          r.status !== "PENDING_REQUESTER"
        )
          return false
      } else if (quickFilter === "review_coord") {
        if (r.status !== "PENDING_COORD") return false
      } else if (quickFilter === "review_manager") {
        if (r.status !== "PENDING_MANAGER") return false
      } else if (quickFilter === "completed") {
        if (r.status !== "COMPLETED") return false
      } else if (quickFilter === "draft") {
        if (r.status !== "DRAFT") return false
      } else if (quickFilter === "over_sla") {
        // SLA calculation: over 2 days from createdAt
        const createdMs = new Date(r.createdAt).getTime()
        const nowMs = Date.now()
        const diffDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24)
        const isPending = r.status === "PENDING_COORD" || r.status === "PENDING_MANAGER"
        if (!isPending || diffDays <= 2) return false
      } else if (quickFilter === "revision") {
        if (r.status !== "DRAFT" && r.status !== "REJECTED") return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesCode = (r.reportCode || "").toLowerCase().includes(q)
        const matchesAuthor =
          (r.author.name || "").toLowerCase().includes(q) || r.author.NIK.includes(q)
        const matchesArea = r.area.name.toLowerCase().includes(q)
        const matchesRoom = (r.room?.name || "").toLowerCase().includes(q)
        const matchesEquipment = (r.equipment?.name || "").toLowerCase().includes(q)
        if (!matchesCode && !matchesAuthor && !matchesArea && !matchesRoom && !matchesEquipment) {
          return false
        }
      }

      return true
    })
  }, [reports, quickFilter, selectedArea, selectedCategory, searchQuery])

  // XLSX Export Function
  const handleExportXLSX = () => {
    const exportRows = filteredReports.map((r) => ({
      "No. Laporan": r.reportCode || "DRAFT",
      "Tanggal Update": formatIndoDateTime(r.updatedAt || r.createdAt),
      "Target / Objek": r.equipment?.name || r.room?.name || r.area.name,
      "Area": r.area.name,
      "Cabang": r.equipment?.branchName || r.author.branchName || "HEAD OFFICE",
      "Teknisi ES": `${r.author.name} (${r.author.NIK})`,
      "Kategori": r.category,
      "Status": r.status,
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Maintenance")
    XLSX.writeFile(workbook, `laporan-maintenance-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const userInitials = React.useMemo(() => {
    return viewerRole
      .split(/[\s_-]+/)
      .map((part) => part.at(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BU"
  }, [viewerRole])

  return (
    <div className="space-y-5">
      {/* Top Bar matching screenshot */}
      <div className="flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        {/* Left: Sidebar toggle + Page Title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Toggle sidebar"
            >
              <PanelLeft className="size-4.5" />
            </button>
          )}
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Laporan Maintenance
          </h1>
        </div>

        {/* Right: Ekspor XLSX + Bell + User Avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportXLSX}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b1728] hover:bg-[#1e293b] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all active:scale-[0.98] border border-slate-800 cursor-pointer"
          >
            <Download className="size-3.5 text-[#ff8a2a]" />
            <span>Ekspor XLSX</span>
          </button>

          {/* Bell Icon with badge 3 */}
          <div className="relative flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <Bell className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ff8a2a] text-[9px] font-black text-slate-950">
              3
            </span>
          </div>

          {/* User Avatar circle */}
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            {userInitials}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-4">
        {/* Total Summary Text */}
        <div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Total <span className="font-bold text-slate-900">{filteredReports.length}</span> laporan sesuai filter
          </p>
        </div>

        {/* Quick Filter Buttons (kotak rounded-lg) with SPARTA Engineering palette */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {QUICK_FILTERS.map((tab) => {
            const isActive = quickFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setQuickFilter(tab.key)}
                className={cn(
                  "h-8.5 inline-flex items-center justify-center rounded-lg px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/40",
                  isActive
                    ? "bg-[#ff8a2a] hover:bg-[#e0751d] text-slate-950 shadow-2xs font-bold"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-2xs"
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Input & Filter Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari laporan, area, teknisi..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none shadow-2xs transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "h-9 inline-flex items-center gap-1.5 rounded-lg border px-3.5 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-[0.98]",
              isFilterOpen
                ? "border-[#ff8a2a] bg-[#ff8a2a]/10 text-slate-950 font-bold"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <Filter className="size-3.5" />
            <span>Filter</span>
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Area:</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 outline-none"
              >
                <option value="ALL">Semua Area</option>
                <option value="OFFICE">Area Office</option>
                <option value="WAREHOUSE">Area Warehouse</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="PREVENTIVE">Preventif</option>
                <option value="INCIDENTAL">Insidental</option>
              </select>
            </div>

            {(selectedArea !== "ALL" || selectedCategory !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedArea("ALL")
                  setSelectedCategory("ALL")
                  setSearchQuery("")
                }}
                className="text-[11px] font-semibold text-rose-600 hover:underline ml-auto"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}

        {/* Main Table Container matching sparta-maintenance */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-white text-[11px] font-bold text-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Laporan</th>
                  <th className="py-3.5 px-4 font-bold">Update</th>
                  <th className="py-3.5 px-4 font-bold">Target & Objek</th>
                  <th className="py-3.5 px-4 font-bold">Cabang</th>
                  <th className="py-3.5 px-4 font-bold">Teknisi ES</th>
                  <th className="py-3.5 px-4 font-bold">Biaya</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FileCheck2 className="mx-auto size-8 text-slate-300" />
                      <p className="mt-2 text-xs font-bold text-slate-700">
                        Tidak ada laporan sesuai filter
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Coba ubah kata kunci pencarian atau ganti filter status di atas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const isCoord = report.status === "PENDING_COORD"
                    const isManager = report.status === "PENDING_MANAGER"
                    const isCompleted = report.status === "COMPLETED"
                    const isDraft = report.status === "DRAFT"
                    const isRejected = report.status === "REJECTED"

                    const targetName =
                      report.equipment?.name || report.room?.name || report.area.name
                    const targetSub =
                      report.room?.name || report.equipment?.code || report.area.code
                    const branchName =
                      report.equipment?.branchName || report.author.branchName || "HEAD OFFICE"

                    const reportUrl = `/dashboard/reports/${report.reportCode || report.id}`

                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => router.push(reportUrl)}
                      >
                        {/* 1. Laporan with distinctive code & hover accent */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <Link
                            href={reportUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 font-mono font-bold text-slate-900 group-hover:text-[#ff8a2a] transition-colors"
                          >
                            <span>{report.reportCode || `ENG-${report.id.slice(0, 8).toUpperCase()}`}</span>
                            <ArrowUpRight className="size-3 text-slate-400 group-hover:text-[#ff8a2a] transition-colors" />
                          </Link>
                        </td>

                        {/* 2. Update (formatted date & time) */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-slate-600 font-medium">
                          {formatIndoDateTime(report.updatedAt || report.createdAt)}
                        </td>

                        {/* 3. Target & Objek (equivalent to Toko) */}
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-bold text-slate-800 line-clamp-1">
                            {targetName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 uppercase">
                            {targetSub}
                          </p>
                        </td>

                        {/* 4. Cabang */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap font-bold text-slate-700">
                          {branchName}
                        </td>

                        {/* 5. Teknisi ES (equivalent to BMS) */}
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-bold text-slate-800">
                            {report.author.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {report.author.NIK}
                          </p>
                        </td>

                        {/* 6. Biaya (Estimasi & Realisasi stacked) */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400">Estimasi</span>
                              <span className="font-semibold text-slate-700">Rp 0</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-400">Realisasi</span>
                              <span className="font-semibold text-slate-700">Rp -</span>
                            </div>
                          </div>
                        </td>

                        {/* 7. Status Pill */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {isDraft && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                              Draft
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              Selesai
                            </span>
                          )}
                          {isCoord && (
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                              Review Coord
                            </span>
                          )}
                          {isManager && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200/80">
                              Review Manager
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                              Ditolak
                            </span>
                          )}
                          {!isDraft && !isCompleted && !isCoord && !isManager && !isRejected && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                              {report.status}
                            </span>
                          )}
                        </td>

                        {/* 8. Aksi */}
                        <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                          <Link
                            href={reportUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                          >
                            <span>Detail</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Modal Dialog */}
      <ReportReviewModal
        report={selectedReportForReview}
        isOpen={Boolean(selectedReportForReview)}
        onClose={() => setSelectedReportForReview(null)}
        viewerRole={viewerRole}
      />
    </div>
  )
}
