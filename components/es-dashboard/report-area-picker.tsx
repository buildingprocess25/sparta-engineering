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
import ROOM_SUGGESTIONS from "@/lib/room-suggestions.json"
import type {
  EsAreaOption,
  EsDashboardFlowIssue,
} from "@/lib/es-dashboard-types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
  const [roomId, setRoomId] = React.useState<string>("")
  const [period, setPeriod] = React.useState<Period>()
  const [formId, setFormId] = React.useState<string>()

  const [rooms, setRooms] = React.useState<{ id: string, name: string }[]>([])
  const [isAddRoomOpen, setIsAddRoomOpen] = React.useState(false)
  const [newRoomName, setNewRoomName] = React.useState("")
  const [searchForm, setSearchForm] = React.useState("")

  const selectedArea = areas.find((area) => area.id === areaId)
  const availableForms = selectedArea && period ? getChecklistForms(selectedArea.type, period) : []

  const displayAreas = areas.filter((area) => !area.name.toLowerCase().includes("whc"))
  const hasAreas = displayAreas.length > 0
  const requiresPeriod = true
  const canContinue = Boolean(
    selectedArea && (selectedArea.code !== "store_hub" ? roomId : true) && (!requiresPeriod || (period && (!availableForms.length || formId)))
  )
  const canOpenChecklistForm =
    Boolean(selectedArea && (selectedArea.code !== "store_hub" ? roomId : true) && period && (formId || !availableForms.length))

  function selectPeriod(nextPeriod: Period) {
    setPeriod(nextPeriod)
    setFormId(undefined)
  }

  React.useEffect(() => {
    if (selectedArea) {
      if (selectedArea.code === "office") {
        setRooms(ROOM_SUGGESTIONS["OFFICE"].map((name, i) => ({ id: `office-${i}`, name })))
      } else if (selectedArea.code === "wh") {
        setRooms(ROOM_SUGGESTIONS["WAREHOUSE"].map((name, i) => ({ id: `wh-${i}`, name })))
      } else {
        setRooms([])
      }
    }
  }, [selectedArea?.code])

  // Mode testing: nonaktifkan status completed agar form/area tidak disable
  const isPeriodCompleted = (_area: EsAreaOption, _p: Period) => false
  const isAreaFullyCompleted = (_area: EsAreaOption) => false

  function chooseArea(nextAreaId: string) {
    const nextArea = areas.find((area) => area.id === nextAreaId)
    if (nextArea && isAreaFullyCompleted(nextArea)) return

    setAreaId(nextAreaId)
    setRoomId("")
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
            {displayAreas.map((area) => {
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

      {selectedArea && selectedArea.code !== "store_hub" ? (
        <section>
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              4
            </span>
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#111111]">Pilih Ruangan</h2>
                <p className="mt-0.5 text-sm leading-5 text-[#686868]">
                  Pilih spesifik ruangan di area {selectedArea.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoomOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-[#dedede] px-2.5 py-1.5 text-xs font-semibold text-[#111111] transition-colors hover:border-[#ffc9a3] hover:bg-[#fff0e3] hover:text-[#a64f00]"
              >
                + Tambah
              </button>
            </div>
          </div>
          <div className="mt-3">
            <Combobox
              items={rooms}
              value={roomId ? rooms.find(r => r.id === roomId) ?? null : null}
              onValueChange={(room) => {
                if (room) {
                  setRoomId(room.id)
                  setPeriod(undefined)
                  setFormId(undefined)
                }
              }}
              itemToStringLabel={(room) => room?.name ?? ""}
            >
              <ComboboxInput
                placeholder="Pilih Ruangan..."
                className="h-12 w-full rounded-xl border-[#dedede] bg-[#fbfbfb] text-[#111111]"
              />
              <ComboboxContent className="rounded-xl border-[#dedede] bg-white">
                <ComboboxEmpty>Ruangan tidak ditemukan.</ComboboxEmpty>
                <ComboboxList className="max-h-[152px] overflow-y-auto">
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

      {requiresPeriod && selectedArea && (selectedArea.code !== "store_hub" ? roomId : true) ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              {selectedArea.code !== "store_hub" ? "5" : "4"}
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Periode Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Pilih periode form untuk ruangan tersebut.
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

      {requiresPeriod && selectedArea && (selectedArea.code !== "store_hub" ? roomId : true) && period && availableForms.length > 0 ? (
        <section>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              {selectedArea.code !== "store_hub" ? "6" : "5"}
            </span>
            <div>
              <h2 className="font-semibold text-[#111111]">Pilih Form Checklist</h2>
              <p className="mt-1 text-sm leading-5 text-[#686868]">
                Pilih spesifik form checklist yang akan diisi.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Cari form..."
              value={searchForm}
              onChange={(e) => setSearchForm(e.target.value)}
              className="w-full rounded-xl border border-[#dedede] px-4 py-3 text-sm placeholder:text-[#a0a5ad] outline-none focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white transition-all"
            />
            <div className="grid grid-cols-1 gap-3 max-h-[340px] overflow-y-auto -mr-3 pr-3 pb-1 scrollbar-thin">
            {availableForms.filter(form => 
              form.title.toLowerCase().includes(searchForm.toLowerCase()) || 
              form.description.toLowerCase().includes(searchForm.toLowerCase())
            ).map((form) => {
              // Mode testing: jangan disable form yang sudah pernah disubmit
              const isFormCompleted = false

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
        </section>
      ) : null}

      {canOpenChecklistForm && selectedArea && (selectedArea.code !== "store_hub" ? roomId : true) ? (
        <Link
          href={{
            pathname: `/dashboard/reports/new/${reportType}/${formId || "frm-tsm-003"}`,
            query: {
              areaId: selectedArea.id,
              ...(selectedArea.code !== "store_hub" ? { roomId, roomName: rooms.find(r => r.id === roomId)?.name } : {}),
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
          {(!roomId && selectedArea?.code !== "store_hub")
            ? "Pilih ruangan"
            : requiresPeriod && !period
              ? "Pilih periode form"
              : requiresPeriod && period && !formId && availableForms.length > 0
                ? "Pilih form checklist"
                : "Form detail belum tersedia"}
        </Button>
      )}

      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="rounded-2xl border-[#dedede] bg-white text-[#111111] shadow-lg sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Tambah Ruangan Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama ruangan lalu klik Simpan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor="room-name" className="text-sm font-medium text-[#111111]">
              Nama Ruangan
            </label>
            <Input
              id="room-name"
              placeholder="mis. Ruang Meeting B"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newRoomName.trim()) {
                  const newId = `room-custom-${Date.now()}`
                  setRooms((prev) => [...prev, { id: newId, name: newRoomName.trim() }])
                  setRoomId(newId)
                  setPeriod(undefined)
                  setFormId(undefined)
                  setIsAddRoomOpen(false)
                  setNewRoomName("")
                }
              }}
            />
            {selectedArea && (ROOM_SUGGESTIONS[selectedArea.type as keyof typeof ROOM_SUGGESTIONS]?.length > 0) && (
              <div className="mt-2">
                <p className="mb-2 text-xs text-[#686868]">Saran Cepat:</p>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-2 pb-2">
                  {ROOM_SUGGESTIONS[selectedArea.type as keyof typeof ROOM_SUGGESTIONS].map((suggestion: string) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewRoomName(suggestion)}
                      className="rounded-full border border-[#dedede] bg-[#fbfbfa] px-3 py-1.5 text-xs text-[#111111] transition-colors hover:bg-[#f0f0f0]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddRoomOpen(false)
                setNewRoomName("")
              }}
              className="h-9 rounded-lg border border-[#dedede] bg-white px-4 text-sm text-[#686868] transition-colors hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!newRoomName.trim()}
              onClick={() => {
                if (newRoomName.trim()) {
                  const newId = `room-custom-${Date.now()}`
                  setRooms((prev) => [...prev, { id: newId, name: newRoomName.trim() }])
                  setRoomId(newId)
                  setPeriod(undefined)
                  setFormId(undefined)
                  setIsAddRoomOpen(false)
                  setNewRoomName("")
                }
              }}
              className="h-9 rounded-lg bg-[#ff8a2a] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#e67a22] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Simpan
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
