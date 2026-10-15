"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import type { ManagerDashboardData } from "./mock-data"
import { cn } from "@/lib/utils"

interface ManagerStatusSlaDistributionProps {
  data: ManagerDashboardData
}

export function ManagerStatusSlaDistribution({
  data,
}: ManagerStatusSlaDistributionProps) {
  const { statusDistribution } = data

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
          Distribusi Status & SLA
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Komposisi laporan aktif dan status yang melewati batas waktu operasional.
        </p>
      </div>

      {/* Metric Header & SLA Tag */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">Laporan aktif</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-slate-900">
              {statusDistribution.activeReports.toLocaleString("id-ID")}
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-emerald-700">
                Preventif: {statusDistribution.preventiveActive.toLocaleString("id-ID")}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-700">
                Temuan: {statusDistribution.incidentalActive.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Total Over SLA Badge */}
        {statusDistribution.totalOverSla > 0 && (
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 shadow-2xs">
              {statusDistribution.totalOverSla} lewat SLA
            </span>
          </div>
        )}
      </div>

      {/* Segmented Progress Bar */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 gap-0.5">
        {statusDistribution.statuses.map((status) => {
          if (status.percentage === 0) return null
          return (
            <div
              key={status.id}
              className={cn("h-full rounded-full transition-all", status.color)}
              style={{ width: `${status.percentage}%` }}
              title={`${status.name}: ${status.count} (${status.percentage}%)`}
            />
          )
        })}
      </div>

      {/* Status Sub-Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {statusDistribution.statuses.map((status) => (
          <div
            key={status.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:bg-white hover:border-slate-300 hover:shadow-2xs"
          >
            {/* Top row: Dot + Name + Arrow */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn("size-2.5 shrink-0 rounded-full", status.dotColor)}
                />
                <span className="truncate text-xs font-semibold text-slate-700">
                  {status.name}
                </span>
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Bottom row: Count + Percentage + Over SLA Badge */}
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">
                  {status.count}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {status.percentage}%
                </span>
              </div>

              {status.overSlaCount !== undefined && status.overSlaCount > 0 && (
                <span className="inline-flex items-center rounded-md bg-rose-100/90 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                  {status.overSlaCount} lewat SLA
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
