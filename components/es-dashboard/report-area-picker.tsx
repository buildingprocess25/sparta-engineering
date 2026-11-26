"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building,
  Warehouse,
  Factory,
  Boxes,
  Package,
  Store,
  Box,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FlowOptionButton } from "@/components/es-dashboard/flow-option-button"
import { CHECKLIST_PERIODS, getFormsForRoom, matchesChecklistForm } from "@/lib/checklist-config"
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
  monthlyOnly?: boolean
}

const periodLabels: Record<Period, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Triwulan",
  SEMESTER: "Semester",
}

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
  monthlyOnly = false,
}: ReportAreaPickerProps) {
  const [areaId, setAreaId] = React.useState<string>()
  const [roomId, setRoomId] = React.useState<string>("")
  const [period, setPeriod] = React.useState<Period>()
  const [formId, setFormId] = React.useState<string>()
  const [searchForm, setSearchForm] = React.useState("")

  const selectedArea = areas.find((area) => area.id === areaId)
  const areaRooms = selectedArea?.rooms ?? []
  const periods = CHECKLIST_PERIODS.filter(
    (item) =>
      (!monthlyOnly || item === "MONTHLY") &&
      selectedArea &&
      areaRooms.some((room) => getFormsForRoom(room, item, selectedArea.type).length > 0),
  )
  const rooms = selectedArea && period
    ? areaRooms.filter((room) => getFormsForRoom(room, period, selectedArea.type).length > 0)
    : []
  const selectedRoom = rooms.find((room) => room.id === roomId)
  const availableForms = selectedArea && selectedRoom && period
    ? getFormsForRoom(selectedRoom, period, selectedArea.type)
    : []
  const matchingForms = availableForms.filter((form) => matchesChecklistForm(form, searchForm))

  const displayAreas = areas.filter(
    (area) => !area.name.toLowerCase().includes("whc"),
  )
  const hasAreas = displayAreas.length > 0

  const canOpenChecklistForm = Boolean(
    selectedArea && selectedRoom && period && matchingForms.some((form) => form.id === formId),
  )

  function chooseArea(nextAreaId: string) {
    setAreaId(nextAreaId)
    selectPeriod(undefined)
  }

  function selectPeriod(nextPeriod: Period | undefined) {
    setPeriod(nextPeriod)
    chooseRoom("")
  }

  function chooseRoom(nextRoomId: string) {
    setRoomId(nextRoomId)
    setFormId(undefined)
    setSearchForm("")
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
              Pilih area laporan untuk melanjutkan.
            </p>
          </div>
        </div>

        {hasAreas ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {displayAreas.map((area) => {
              const Icon = getAreaIcon(area.name)
              const isSelected = areaId === area.id

              return (
                <Button variant="ghost"
                  key={area.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => chooseArea(area.id)}
                  className={["inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit", (cn(
                    "relative min-h-24 rounded-xl border p-3 text-left transition-colors overflow-hidden",
                    isSelected
                      ? "border-[#ff8a2a] bg-[#fff0e3]"
                      : "border-[#dedede] bg-[#fbfbfb] hover:border-gray-300",
                  ))].filter(Boolean).join(" ")}
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
                </Button>
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

      {selectedArea ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              4
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Periode Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Pilih periode yang tersedia di {getAreaDisplayName(selectedArea)}.
              </p>
            </div>
          </div>
          {periods.length ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {periods.map((item) => (
                <FlowOptionButton
                  key={item}
                  title={periodLabels[item]}
                  description="Pilih untuk melihat ruangan"
                  active={period === item}
                  disabled={false}
                  onClick={() => selectPeriod(item)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada form checklist untuk area ini.</p>
          )}
        </section>
      ) : null}

      {/* Pilih ruangan yang punya form pada periode terpilih */}
      {selectedArea && period ? (
        <section>
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              5
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
              value={selectedRoom ?? null}
              onValueChange={(room) => chooseRoom(room?.id ?? "")}
              itemToStringLabel={(room) => room?.name ?? ""}
            >
              <ComboboxInput
                aria-label="Cari ruangan"
                placeholder="Cari ruangan…"
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

          <div className="mt-3 flex flex-col gap-3">
            <Input
              aria-label="Cari nama atau kode form"
              placeholder="Cari nama atau kode form…"
              value={searchForm}
              onChange={(event) => {
                setSearchForm(event.target.value)
                setFormId(undefined)
              }}
              className="h-11 rounded-xl"
            />
            {matchingForms.length ? (
              <div className="grid max-h-[340px] grid-cols-1 gap-3 overflow-y-auto pr-1 pb-1 scrollbar-thin">
                {matchingForms.map((form) => (
                  <FlowOptionButton
                    key={form.id}
                    title={form.title}
                    description={form.description}
                    active={formId === form.id}
                    disabled={false}
                    onClick={() => setFormId(form.id)}
                  />
                ))}
              </div>
            ) : (
              <p role="status" className="text-sm text-muted-foreground">Form tidak ditemukan.</p>
            )}
          </div>
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
              period,
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
            : !period
              ? "Pilih periode checklist"
              : !selectedRoom
                ? "Pilih ruangan"
                : "Pilih form checklist"}
        </Button>
      )}
    </div>
  )
}
