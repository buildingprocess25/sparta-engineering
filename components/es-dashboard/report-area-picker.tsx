"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building,
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
import { getFormsForRoom } from "@/lib/checklist-config"
import type {
  EsAreaOption,
  EsDashboardFlowIssue,
  ChecklistPeriodType,
} from "@/lib/es-dashboard-types"
import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

type ReportType = "checklist" | "repair"
type Period = ChecklistPeriodType

type ReportAreaPickerProps = {
  areas: EsAreaOption[]
  areaIssue?: EsDashboardFlowIssue
  reportType: ReportType
  workPermit?: string
}

const periodLabels: Record<Period, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Triwulan",
  SEMESTER: "Semester",
}

const ALL_PERIODS: Period[] = ["MONTHLY", "WEEKLY", "QUARTERLY", "SEMESTER"]

function getAreaDisplayName(area: { code: string; name: string }) {
  if (area.code === "office" || area.name.toLowerCase() === "office") {
    return "Branch"
  }
  return area.name
}

function getAreaIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("branch") || lower.includes("office")) return Building
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
  const [roomId, setRoomId] = React.useState<string>("")
  const [period, setPeriod] = React.useState<Period>()
  const [formId, setFormId] = React.useState<string>()
  const [searchForm, setSearchForm] = React.useState("")

  const selectedArea = areas.find((area) => area.id === areaId)
  const rooms = React.useMemo(() => {
    return selectedArea?.rooms ?? []
  }, [selectedArea])

  const selectedRoom = React.useMemo(() => {
    return rooms.find((r) => r.id === roomId)
  }, [rooms, roomId])

  // Get available forms strictly tied to the selected room and period
  const availableForms = React.useMemo(() => {
    if (!selectedRoom || !period) return []
    return getFormsForRoom(selectedRoom, period)
  }, [selectedRoom, period])

  // Derived periods available for the selected room based on its formAvailabilities
  const roomAvailablePeriods = React.useMemo(() => {
    if (!selectedRoom) return ALL_PERIODS
    const set = new Set<Period>()
    selectedRoom.formAvailabilities.forEach((fa) => set.add(fa.period as Period))
    return ALL_PERIODS.filter((p) => set.has(p))
  }, [selectedRoom])

  const displayAreas = areas.filter(
    (area) => !area.name.toLowerCase().includes("whc"),
  )
  const hasAreas = displayAreas.length > 0

  const canOpenChecklistForm = Boolean(
    selectedArea && selectedRoom && period && formId,
  )

  function chooseArea(nextAreaId: string) {
    setAreaId(nextAreaId)
    setRoomId("")
    setPeriod(undefined)
    setFormId(undefined)
  }

  function chooseRoom(nextRoomId: string) {
    setRoomId(nextRoomId)
    setPeriod(undefined)
    setFormId(undefined)
  }

  function selectPeriod(nextPeriod: Period) {
    setPeriod(nextPeriod)
    setFormId(undefined)
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
      {/* Step 1: Pilih Area */}
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
            {displayAreas.map((area) => {
              const Icon = getAreaIcon(area.name)
              const isSelected = areaId === area.id

              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => chooseArea(area.id)}
                  className={cn(
                    "relative min-h-24 rounded-xl border p-3 text-left transition-colors overflow-hidden",
                    isSelected
                      ? "border-[#ff8a2a] bg-[#fff0e3]"
                      : "border-[#dedede] bg-[#fbfbfb] hover:border-gray-300",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="text-[#111111]" aria-hidden="true" />
                  </div>
                  <span className="mt-3 block font-semibold text-[#111111]">
                    {getAreaDisplayName(area)}
                  </span>
                  <span className="mt-1 block text-xs text-[#686868]">
                    {area.rooms ? `${area.rooms.length} Ruangan` : area.type}
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

      {/* Step 2: Pilih Ruangan (Default fixed dari Excel, tidak bisa ditambah manual) */}
      {selectedArea ? (
        <section>
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              4
            </span>
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#111111]">Pilih Ruangan</h2>
                <p className="mt-0.5 text-sm leading-5 text-[#686868]">
                  Pilih ruangan di {getAreaDisplayName(selectedArea)} ({rooms.length} ruangan tersedia).
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Combobox
              items={rooms}
              value={roomId ? rooms.find((r) => r.id === roomId) ?? null : null}
              onValueChange={(room) => {
                if (room) {
                  chooseRoom(room.id)
                }
              }}
              itemToStringLabel={(room) => room?.name ?? ""}
            >
              <ComboboxInput
                placeholder="Cari & pilih Ruangan..."
                className="h-12 w-full rounded-xl border-[#dedede] bg-[#fbfbfb] text-[#111111]"
              />
              <ComboboxContent className="rounded-xl border-[#dedede] bg-white">
                <ComboboxEmpty>Ruangan tidak ditemukan.</ComboboxEmpty>
                <ComboboxList className="max-h-[220px] overflow-y-auto">
                  {(room) => (
                    <ComboboxItem
                      key={room.id}
                      value={room}
                      className="cursor-pointer rounded-lg text-[#111111] data-highlighted:bg-[#fff0e3] data-highlighted:text-[#a64f00]"
                    >
                      {room.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </section>
      ) : null}

      {/* Step 3: Pilih Periode (Monthly, Weekly, Triwulan, Semester) */}
      {selectedArea && selectedRoom ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              5
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Periode Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Pilih periode checklist untuk {selectedRoom.name}.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {ALL_PERIODS.map((item) => {
              const hasForms = roomAvailablePeriods.includes(item)
              return (
                <FlowOptionButton
                  key={item}
                  title={periodLabels[item]}
                  description={
                    hasForms
                      ? "Tersedia"
                      : "Tidak ada form di periode ini"
                  }
                  active={period === item}
                  disabled={!hasForms}
                  onClick={() => {
                    selectPeriod(item)
                  }}
                />
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Step 4: Pilih Form Checklist (Hanya form yang terikat ke ruangan & periode) */}
      {selectedArea && selectedRoom && period ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              6
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Pilih Form Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Form yang berlaku di {selectedRoom.name} untuk periode {periodLabels[period]}.
              </p>
            </div>
          </div>

          {availableForms.length > 0 ? (
            <div className="mt-3 flex flex-col gap-3">
              {availableForms.length > 4 && (
                <input
                  type="text"
                  placeholder="Cari form..."
                  value={searchForm}
                  onChange={(e) => setSearchForm(e.target.value)}
                  className="w-full rounded-xl border border-[#dedede] px-4 py-3 text-sm placeholder:text-[#a0a5ad] outline-none focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white transition-all"
                />
              )}
              <div className="grid grid-cols-1 gap-3 max-h-[340px] overflow-y-auto -mr-3 pr-3 pb-1 scrollbar-thin">
                {availableForms
                  .filter(
                    (form) =>
                      form.title
                        .toLowerCase()
                        .includes(searchForm.toLowerCase()) ||
                      form.description
                        .toLowerCase()
                        .includes(searchForm.toLowerCase()),
                  )
                  .map((form) => {
                    return (
                      <FlowOptionButton
                        key={form.id}
                        title={form.title}
                        description={form.description}
                        active={formId === form.id}
                        disabled={false}
                        onClick={() => {
                          setFormId(form.id)
                        }}
                      />
                    )
                  })}
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-[#dedede] bg-[#fbfbfb] p-3 text-sm leading-5 text-[#686868]">
              Tidak ada form checklist periode {periodLabels[period]} untuk ruangan {selectedRoom.name}. Silakan pilih periode lain.
            </p>
          )}
        </section>
      ) : null}

      {/* Action Button: Lanjutkan */}
      {canOpenChecklistForm && selectedArea && selectedRoom && period && formId ? (
        <Link
          href={{
            pathname: `/dashboard/reports/new/${reportType}/${formId}`,
            query: {
              areaId: selectedArea.id,
              roomId: selectedRoom.id,
              roomName: selectedRoom.name,
              period: period,
              ...(workPermit ? { workPermit } : {}),
              reset: "true",
            },
          }}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[#111111] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#242424]"
        >
          Lanjutkan
        </Link>
      ) : (
        <Button
          disabled
          className="h-12 bg-[#d8d8d8] text-[#777777]"
        >
          {!selectedArea
            ? "Pilih area laporan"
            : !selectedRoom
              ? "Pilih ruangan"
              : !period
                ? "Pilih periode checklist"
                : availableForms.length === 0
                  ? "Pilih periode yang memiliki form"
                  : "Pilih form checklist"}
        </Button>
      )}
    </div>
  )
}
