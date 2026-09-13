"use client"

import * as React from "react"
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Warehouse,
  Wrench,
} from "lucide-react"

import { FlowOptionButton } from "@/components/es-dashboard/flow-option-button"
import { Button } from "@/components/ui/button"
import type {
  EsAreaOption,
  EsDashboardFlowIssue,
} from "@/lib/es-dashboard-types"
import { cn } from "@/lib/utils"

type WorkPermitChoice = "fill" | "skip"
type ReportType = "checklist" | "repair"
type Period = "MONTHLY" | "WEEKLY"

type ReportFlowProps = {
  areas: EsAreaOption[]
  areaIssue?: EsDashboardFlowIssue
}

const reportTypes = [
  {
    id: "checklist",
    title: "Checklist",
    description: "Laporan rutin area kerja.",
    icon: ClipboardCheck,
  },
  {
    id: "repair",
    title: "Perbaikan / Temuan",
    description: "Temuan ES atau arahan AHO.",
    icon: Wrench,
  },
] satisfies Array<{
  id: ReportType
  title: string
  description: string
  icon: typeof ClipboardCheck
}>

const periodLabels: Record<Period, string> = {
  MONTHLY: "Monthly",
  WEEKLY: "Weekly",
}

export function ReportFlow({ areas, areaIssue }: ReportFlowProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [workPermit, setWorkPermit] = React.useState<WorkPermitChoice>()
  const [reportType, setReportType] = React.useState<ReportType>()
  const [areaId, setAreaId] = React.useState<string>()
  const [period, setPeriod] = React.useState<Period>()

  const hasAreas = areas.length > 0
  const selectedArea = areas.find((area) => area.id === areaId)
  const availablePeriods = selectedArea?.periods ?? []
  const requiresPeriod = reportType === "checklist"
  const canChooseReportType = Boolean(workPermit)
  const canChooseArea = Boolean(workPermit && reportType && hasAreas)
  const canChoosePeriod = Boolean(canChooseArea && selectedArea && requiresPeriod)
  const canContinue = Boolean(
    workPermit && reportType && selectedArea && (!requiresPeriod || period),
  )

  function chooseReportType(nextReportType: ReportType) {
    setReportType(nextReportType)
    setAreaId(undefined)
    setPeriod(undefined)
  }

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
    <section className="mt-5">
      <Button
        className="h-14 w-full rounded-lg bg-[#ff8a2a] text-base font-semibold text-black shadow-lg shadow-[#ff8a2a]/20 hover:bg-[#ff9c48]"
        onClick={() => setIsOpen((value) => !value)}
      >
        Buat Laporan Baru
      </Button>

      {isOpen ? (
        <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
          <FlowSection
            step="1"
            title="Form Ijin Kerja"
            description="Pilih sesuai kebutuhan pekerjaan hari ini."
          >
            <div className="grid grid-cols-2 gap-3">
              <FlowOptionButton
                title="Isi Form"
                description="Butuh izin kerja"
                active={workPermit === "fill"}
                onClick={() => setWorkPermit("fill")}
              />
              <FlowOptionButton
                title="Lewati"
                description="Tidak diperlukan"
                active={workPermit === "skip"}
                onClick={() => setWorkPermit("skip")}
              />
            </div>
          </FlowSection>

          <FlowSection
            step="2"
            title="Jenis Laporan"
            description="Checklist atau laporan temuan perbaikan."
            disabled={!canChooseReportType}
          >
            <div className="flex flex-col gap-3">
              {reportTypes.map(({ id, title, description, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  disabled={!canChooseReportType}
                  onClick={() => chooseReportType(id)}
                  className={cn(
                    "flex min-h-20 items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                    reportType === id
                      ? "border-[#ff8a2a] bg-[#fff0e3]"
                      : "border-[#dedede] bg-[#fbfbfb]",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#111111]">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-[#111111]">{title}</span>
                    <span className="mt-1 block text-sm leading-5 text-[#686868]">
                      {description}
                    </span>
                  </span>
                  {reportType === id ? (
                    <Check className="shrink-0 text-[#a64f00]" aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>
          </FlowSection>

          <FlowSection
            step="3"
            title="Area"
            description="Pilih area spesifik. Template form mengikuti family area."
            disabled={!canChooseArea}
          >
            {hasAreas ? (
              <div className="grid grid-cols-2 gap-3">
                {areas.map((area) => {
                  const Icon = area.type === "OFFICE" ? Building2 : Warehouse

                  return (
                    <button
                      key={area.id}
                      type="button"
                      disabled={!canChooseArea}
                      onClick={() => chooseArea(area.id)}
                      className={cn(
                        "min-h-24 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
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
                        {area.periods
                          .map((item) => periodLabels[item])
                          .join(" / ")}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-[#dedede] bg-[#fbfbfb] p-3 text-sm leading-5 text-[#686868]">
                <span className="block font-semibold text-[#111111]">
                  {areaIssue?.title ?? "Data area belum tersedia"}
                </span>
                <span className="mt-1 block">
                  {areaIssue?.description ??
                    "Jalankan seed area sebelum membuat laporan baru."}
                </span>
              </p>
            )}
          </FlowSection>

          {requiresPeriod ? (
            <FlowSection
              step="4"
              title="Periode Checklist"
              description="Office hanya monthly. Warehouse-family bisa monthly atau weekly."
              disabled={!canChoosePeriod}
            >
              <div className="grid grid-cols-2 gap-3">
                {availablePeriods.map((item) => (
                  <FlowOptionButton
                    key={item}
                    title={periodLabels[item]}
                    description="Periode form"
                    active={period === item}
                    disabled={!canChoosePeriod}
                    onClick={() => setPeriod(item)}
                  />
                ))}
              </div>
            </FlowSection>
          ) : null}

          <Button
            disabled={!canContinue}
            className="h-12 bg-[#111111] text-white hover:bg-[#252525] disabled:bg-[#d8d8d8] disabled:text-[#777777]"
          >
            Lanjutkan
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function FlowSection({
  step,
  title,
  description,
  disabled,
  children,
}: {
  step: string
  title: string
  description: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn(disabled && "opacity-55")}>
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
          {step}
        </span>
        <div>
          <h3 className="font-semibold text-[#111111]">{title}</h3>
          <p className="mt-1 text-sm leading-5 text-[#686868]">{description}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}
