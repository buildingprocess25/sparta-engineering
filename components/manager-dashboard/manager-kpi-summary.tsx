"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
} from "lucide-react"

import type { ManagerDashboardData, PeriodFilter } from "./mock-data"
import { cn } from "@/lib/utils"

interface ManagerKpiSummaryProps {
  data: ManagerDashboardData
  selectedPeriod: PeriodFilter
  onPeriodChange: (period: PeriodFilter) => void
}

export function ManagerKpiSummary({
  data,
  selectedPeriod,
  onPeriodChange,
}: ManagerKpiSummaryProps) {
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = React.useState(false)
  const periodDropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPeriodDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const periodLabelMap: Record<PeriodFilter, string> = {
    YTD: "YTD (Tahun Ini)",
    MONTHLY: "Bulan Ini",
    QUARTERLY: "Kuartal Ini",
  }

  const { overview } = data

  return (
    <section className="space-y-4">
      {/* Header Row: Title & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Ringkasan Operasional Engineering
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Monitor status checklist rutin, inspeksi equipment & ruangan, temuan perbaikan, serta antrean approval.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Period Selector Dropdown */}
          <div className="relative" ref={periodDropdownRef}>
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span>{periodLabelMap[selectedPeriod]}</span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 z-50">
                {(["YTD", "MONTHLY", "QUARTERLY"] as PeriodFilter[]).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      onPeriodChange(period)
                      setIsPeriodDropdownOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      selectedPeriod === period
                        ? "bg-slate-100 text-slate-900 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>{periodLabelMap[period]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aktivitas Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Activity className="size-3.5 text-slate-500" />
            <span>Aktivitas</span>
          </button>

          {/* Semua Laporan Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl bg-[#ff8a2a] px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-[#e0751d] transition-colors"
          >
            <FileText className="size-3.5" />
            <span>Semua Laporan</span>
          </button>
        </div>
      </div>

      {/* 3 Big Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card 1: Laporan & Checklist */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-xs">
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 text-slate-500">
              <FileText className="size-4 text-slate-400" />
              <span className="text-xs font-semibold tracking-wide">Laporan & Checklist</span>
            </div>

            {/* Big Stat */}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {overview.totalReports.toLocaleString("id-ID")}
              </span>
              <ArrowUpRight className="size-4 text-slate-400" />
            </div>

            {/* Category Chips: Equipment vs Ruangan */}
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
              <span className="text-sky-700">
                Equipment: {overview.equipmentReports.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700">
                Ruangan: {overview.roomReports.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Sub description */}
            <p className="mt-1 text-[11px] text-slate-400">
              {overview.reportSubDescription}
            </p>
          </div>

          {/* Bottom Split Sub-Metrics */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Selesai</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-600">
                    {overview.reportsSubMetrics.completed.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-emerald-600" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Laporan Aktif</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#0284c7]">
                    {overview.reportsSubMetrics.active.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-[#0284c7]" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Ditolak</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-800">
                    {overview.reportsSubMetrics.rejected.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-slate-400" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Teknisi Aktif</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-800">
                    {overview.reportsSubMetrics.activeUsers.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Penyelesaian Checklist */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-xs">
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="size-4 text-slate-400" />
              <span className="text-xs font-semibold tracking-wide">Penyelesaian Checklist</span>
            </div>

            {/* Big Stat */}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {overview.completionPercentage}%
              </span>
              <ArrowUpRight className="size-4 text-slate-400" />
            </div>

            {/* Category Completion Chips */}
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
              <span className="text-sky-700">
                Equipment: {overview.equipmentCompletion}%
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700">
                Ruangan: {overview.roomCompletion}%
              </span>
            </div>

            {/* Sub description */}
            <p className="mt-1 text-[11px] text-slate-400">
              {overview.completionSubDescription}
            </p>
          </div>

          {/* Bottom Split Sub-Metrics */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Selesai</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-600">
                    {overview.completionSubMetrics.completed.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Equipment Selesai</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#0284c7]">
                    {overview.completionSubMetrics.equipmentCompleted.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-[#0284c7]" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Ruangan Selesai</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-amber-600">
                    {overview.completionSubMetrics.roomCompleted.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-amber-600" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Terlewat / Overdue</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-700">
                    {overview.completionSubMetrics.overdue.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Antrean Approval */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-xs">
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 text-slate-500">
              <ClipboardCheck className="size-4 text-slate-400" />
              <span className="text-xs font-semibold tracking-wide">Antrean Approval</span>
            </div>

            {/* Big Stat */}
            <div className="mt-3 flex items-baseline gap-1.5 min-w-0">
              <span className="truncate text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {overview.approvalFormatted}
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-slate-400" />
            </div>

            {/* Approval Category Chips: Preventif vs Temuan Kerusakan */}
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold flex-wrap">
              <span className="text-emerald-700">
                Preventif: {overview.preventiveApprovalCount.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-700">
                Temuan Kerusakan: {overview.incidentalApprovalCount.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Sub description */}
            <p className="mt-1 text-[11px] text-slate-400">
              {overview.approvalSubDescription}
            </p>
          </div>

          {/* Bottom Split Sub-Metrics */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Tunggu Review Coord</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#0284c7]">
                    {overview.approvalSubMetrics.pendingCoord.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-[#0284c7]" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Tunggu Review Manager</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-600">
                    {overview.approvalSubMetrics.pendingManager.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-emerald-600" />
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-[11px] font-medium text-slate-400">Review Requester (Kerusakan)</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-700">
                    {overview.approvalSubMetrics.pendingRequester.toLocaleString("id-ID")}
                  </span>
                  <ArrowUpRight className="size-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
