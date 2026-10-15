"use client"

import * as React from "react"
import { Info } from "lucide-react"

import type { ManagerDashboardData } from "./mock-data"
import { cn } from "@/lib/utils"

interface ManagerSlaThresholdPanelProps {
  data: ManagerDashboardData
}

export function ManagerSlaThresholdPanel({
  data,
}: ManagerSlaThresholdPanelProps) {
  const { statusDistribution } = data

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              Batas SLA per status
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Patokan ini membantu user melihat siapa yang perlu follow up.
            </p>
          </div>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Info className="size-4" />
          </div>
        </div>

        {/* SLA Threshold Items List */}
        <div className="mt-4 divide-y divide-slate-100">
          {statusDistribution.statuses.slice(0, 5).map((status) => (
            <div key={status.id} className="py-3 first:pt-0 last:pb-0">
              {/* Top row: Dot + Status Name + SLA Duration Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn("size-2 shrink-0 rounded-full", status.dotColor)}
                  />
                  <span className="truncate text-xs font-bold text-slate-800">
                    {status.name}
                  </span>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                  {status.slaLimit}
                </span>
              </div>

              {/* Subtext description */}
              <p className="mt-1 pl-4 text-[11px] text-slate-500 leading-relaxed">
                {status.slaDescription}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>SLA dihitung sejak submit oleh teknisi</span>
      </div>
    </div>
  )
}
