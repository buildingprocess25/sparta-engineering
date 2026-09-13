"use client"

import * as React from "react"
import { Building2, Warehouse } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FlowOptionButton } from "@/components/es-dashboard/flow-option-button"
import type {
  EsAreaOption,
  EsDashboardFlowIssue,
} from "@/lib/es-dashboard-types"
import { cn } from "@/lib/utils"

type ReportType = "checklist" | "repair"
type Period = "MONTHLY" | "WEEKLY"

type ReportAreaPickerProps = {
  areas: EsAreaOption[]
  areaIssue?: EsDashboardFlowIssue
  reportType: ReportType
  workPermit?: string
}

const periodLabels: Record<Period, string> = {
  MONTHLY: "Monthly",
  WEEKLY: "Weekly",
}

export function ReportAreaPicker({
  areas,
  areaIssue,
  reportType,
  workPermit,
}: ReportAreaPickerProps) {
  const [areaId, setAreaId] = React.useState<string>()
  const [period, setPeriod] = React.useState<Period>()

  const selectedArea = areas.find((area) => area.id === areaId)
  const hasAreas = areas.length > 0
  const requiresPeriod = reportType === "checklist"
  const canContinue = Boolean(selectedArea && (!requiresPeriod || period))

  function chooseArea(nextAreaId: string) {
    const nextArea = areas.find((area) => area.id === nextAreaId)

    setAreaId(nextAreaId)
    setPeriod(
      reportType === "checklist" && nextArea?.periods.length === 1
        ? nextArea.periods[0]
        : undefined,
    )
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
      <section>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
            3
          </span>
          <div>
            <h2 className="font-semibold text-[#111111]">Pilih Area</h2>
            <p className="mt-1 text-sm leading-5 text-[#686868]">
              {workPermit === "fill"
                ? "Form Ijin Kerja akan diisi sebelum laporan detail."
                : "Lanjut tanpa Form Ijin Kerja, lalu pilih area laporan."}
            </p>
          </div>
        </div>

        {hasAreas ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {areas.map((area) => {
              const Icon = area.type === "OFFICE" ? Building2 : Warehouse

              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => chooseArea(area.id)}
                  className={cn(
                    "min-h-24 rounded-xl border p-3 text-left transition-colors",
                    areaId === area.id
                      ? "border-[#ff8a2a] bg-[#fff0e3]"
                      : "border-[#dedede] bg-[#fbfbfb]",
                  )}
                >
                  <Icon className="text-[#111111]" aria-hidden="true" />
                  <span className="mt-3 block font-semibold text-[#111111]">
                    {area.name}
                  </span>
                  <span className="mt-1 block text-xs text-[#686868]">
                    {area.periods.map((item) => periodLabels[item]).join(" / ")}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-[#dedede] bg-[#fbfbfb] p-3 text-sm leading-5 text-[#686868]">
            <span className="block font-semibold text-[#111111]">
              {areaIssue?.title ?? "Data area belum tersedia"}
            </span>
            <span className="mt-1 block">
              {areaIssue?.description ??
                "Jalankan seed area sebelum membuat laporan baru."}
            </span>
          </p>
        )}
      </section>

      {requiresPeriod && selectedArea ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              4
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Periode Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Pilih periode form untuk area {selectedArea.name}.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {selectedArea.periods.map((item) => (
              <FlowOptionButton
                key={item}
                title={periodLabels[item]}
                description="Periode form"
                active={period === item}
                onClick={() => setPeriod(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <Button
        disabled
        className={cn(
          "h-12 bg-[#d8d8d8] text-[#777777]",
          canContinue && "bg-[#111111] text-white opacity-80",
        )}
      >
        Form detail belum tersedia
      </Button>
    </div>
  )
}
