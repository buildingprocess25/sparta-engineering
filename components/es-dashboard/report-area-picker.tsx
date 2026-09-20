"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  Warehouse,
  Factory,
  Boxes,
  Package,
  Store,
  Box,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { FlowOptionButton } from "@/components/es-dashboard/flow-option-button"
import { getChecklistForms } from "@/lib/checklist-config"
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

function getAreaIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("office")) return Building2
  if (lower.includes("whc")) return Factory
  if (lower.includes("wh")) return Warehouse
  if (lower.includes("depo")) return Boxes
  if (lower.includes("bulky")) return Package
  if (lower.includes("store hub")) return Store
  if (lower.includes("gudang anak")) return Box
  return Warehouse
}

export function ReportAreaPicker({
  areas,
  areaIssue,
  reportType,
  workPermit,
}: ReportAreaPickerProps) {
  const [areaId, setAreaId] = React.useState<string>()
  const [period, setPeriod] = React.useState<Period>()
  const [formId, setFormId] = React.useState<string>()

  const selectedArea = areas.find((area) => area.id === areaId)
  const availableForms = selectedArea && period ? getChecklistForms(selectedArea.type, period) : []

  const hasAreas = areas.length > 0
  const requiresPeriod = true
  const canContinue = Boolean(
    selectedArea && (!requiresPeriod || (period && (!availableForms.length || formId)))
  )
  const canOpenChecklistForm =
    Boolean(selectedArea && period && (formId || !availableForms.length))

  function selectPeriod(nextPeriod: Period) {
    setPeriod(nextPeriod)
    setFormId(undefined)
  }

  const isPeriodCompleted = (area: EsAreaOption, p: Period) =>
    reportType === "checklist" && Boolean(area.completedPeriods?.includes(p))

  const isAreaFullyCompleted = (area: EsAreaOption) =>
    reportType === "checklist" &&
    area.periods.every((p) => isPeriodCompleted(area, p))

  function chooseArea(nextAreaId: string) {
    const nextArea = areas.find((area) => area.id === nextAreaId)
    if (nextArea && isAreaFullyCompleted(nextArea)) return

    setAreaId(nextAreaId)
    setPeriod(
      nextArea?.periods.length === 1 && !isPeriodCompleted(nextArea, nextArea.periods[0])
        ? nextArea.periods[0]
        : undefined,
    )
    setFormId(undefined)
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
              const Icon = getAreaIcon(area.name)
              const isCompleted = isAreaFullyCompleted(area)

              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => chooseArea(area.id)}
                  className={cn(
                    "relative min-h-24 rounded-xl border p-3 text-left transition-colors overflow-hidden",
                    isCompleted
                      ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                      : areaId === area.id
                        ? "border-[#ff8a2a] bg-[#fff0e3]"
                        : "border-[#dedede] bg-[#fbfbfb]",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="text-[#111111]" aria-hidden="true" />
                    {isCompleted && (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        <CheckCircle2 className="size-3" /> Selesai
                      </span>
                    )}
                  </div>
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
            {selectedArea.periods.map((item) => {
              const isCompleted = isPeriodCompleted(selectedArea, item)
              return (
                <FlowOptionButton
                  key={item}
                  title={periodLabels[item]}
                  description={isCompleted ? "Sudah selesai" : "Periode form"}
                  active={period === item}
                  disabled={isCompleted}
                  onClick={() => {
                    if (!isCompleted) selectPeriod(item)
                  }}
                />
              )
            })}
          </div>
        </section>
      ) : null}

      {requiresPeriod && selectedArea && period && availableForms.length > 0 ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              5
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Pilih Form Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Pilih spesifik form checklist yang akan diisi.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {availableForms.map((form) => {
              const formCode = form.id.replace(/-/g, "_").toUpperCase()
              const isFormCompleted = reportType === "checklist" && selectedArea?.completedForms?.includes(formCode)
              
              return (
                <FlowOptionButton
                  key={form.id}
                  title={form.title}
                  description={isFormCompleted ? "Sudah disubmit" : form.description}
                  active={formId === form.id}
                  disabled={isFormCompleted}
                  onClick={() => {
                    if (!isFormCompleted) setFormId(form.id)
                  }}
                />
              )
            })}
          </div>
        </section>
      ) : null}

      {canOpenChecklistForm && selectedArea ? (
        <Link
          href={{
            pathname: `/dashboard/reports/new/${reportType}/${formId || "frm-tsm-003"}`,
            query: {
              areaId: selectedArea.id,
              period: period,
              ...(workPermit ? { workPermit } : {}),
            },
          }}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[#111111] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#242424]"
        >
          Lanjutkan
        </Link>
      ) : (
        <Button
          disabled
          className={cn(
            "h-12 bg-[#d8d8d8] text-[#777777]",
            canContinue && "bg-[#111111] text-white opacity-80",
          )}
        >
          {requiresPeriod && !period
            ? "Pilih periode form"
            : requiresPeriod && period && !formId && availableForms.length > 0
              ? "Pilih form checklist"
              : "Form detail belum tersedia"}
        </Button>
      )}
    </div>
  )
}
