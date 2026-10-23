"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  Battery,
  BatteryCharging,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileCheck,
  Gauge,
  Hash,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Search,
  Send,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react"

import { CameraCaptureButton } from "@/components/es-dashboard/camera-capture-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BATTERY_INSPECTION_ITEMS,
  FRM_TS_028_FORM_CODE,
  FRM_TS_028_NRA,
  FRM_TS_028_REF_NRA,
  type BatteryInspectionItem,
  type CellMeasurement,
} from "@/lib/checklists/frm-ts-028"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs028FormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  watermarkUserLabel: string
  watermarkUserRole: string
  formCode?: string
  isRepairMode?: boolean
  defaultUnitName?: string
  defaultUnitNo?: number
  submitAction(input: {
    reportCode: string
    payload: ChecklistPayload
  }): Promise<{ ok: true; isSafe?: boolean } | { ok: false; errors: string[] }>
  onSuccess?(data: { isSafe: boolean }): void
}

export const FOLLOW_UP_OPTIONS = [
  {
    id: "SAT/FRM/TS/065_REV:00_161020",
    label: "Form Penggantian Spare Part (065)",
    badge: "065",
  },
]

type ItemState = {
  condition: ChecklistCondition | ""
  notes: string
  photos: ChecklistPhoto[]
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  uploading?: boolean
}

export function FrmTs028Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_028_FORM_CODE,
  isRepairMode = false,
  defaultUnitName = "",
  defaultUnitNo,
  submitAction,
  onSuccess,
}: FrmTs028FormProps) {
  // Determine initial Unit Type from equipment name if available
  const initialUnitType =
    defaultUnitName.toUpperCase().includes("PALLET") ||
      defaultUnitName.toUpperCase().includes("MOVER")
      ? "Pallet Mover"
      : "Forklift"

  // 1. Header Metadata State
  const [warehouse, setWarehouse] = React.useState(areaName || "Warehouse")
  const [unitType, setUnitType] = React.useState<"Forklift" | "Pallet Mover">(initialUnitType)
  const [unitNo, setUnitNo] = React.useState(defaultUnitNo ? String(defaultUnitNo) : "")
  const [volt, setVolt] = React.useState("")
  const [brand, setBrand] = React.useState<"Jungheinrich" | "Crown">("Jungheinrich")
  const [generalCondition, setGeneralCondition] = React.useState("")

  // 2. Cell Measurements State (12 cells for Pallet Mover, 24 for Forklift)
  const initialCellCount = unitType === "Pallet Mover" ? 12 : 24
  const [cellCount, setCellCount] = React.useState<number>(initialCellCount)
  const [cellData, setCellData] = React.useState<CellMeasurement[]>(() =>
    Array.from({ length: 24 }, (_, idx) => ({
      cellNo: idx + 1,
      bj: "",
      voltage: "",
    }))
  )

  // Sync cell count when unitType changes
  const handleUnitTypeChange = (val: "Forklift" | "Pallet Mover") => {
    setUnitType(val)
    if (val === "Pallet Mover") {
      setCellCount(12)
    } else {
      setCellCount(24)
    }
  }

  // Update single cell measurement
  const updateCell = (cellNo: number, field: "bj" | "voltage", value: string) => {
    setCellData((prev) =>
      prev.map((c) => (c.cellNo === cellNo ? { ...c, [field]: value } : c))
    )
  }

  // Quick prefill normal cells (e.g. B.J = 1.28, Volt = 2.10V)
  const prefillNormalCells = () => {
    setCellData((prev) =>
      prev.map((c) =>
        c.cellNo <= cellCount
          ? {
            ...c,
            bj: c.bj || "1.28",
            voltage: c.voltage || "2.10",
          }
          : c
      )
    )
  }

  // Calculate total voltage
  const totalVoltage = React.useMemo(() => {
    let sum = 0
    let validCount = 0
    for (let i = 0; i < cellCount; i++) {
      const v = parseFloat(cellData[i]?.voltage || "0")
      if (!isNaN(v) && v > 0) {
        sum += v
        validCount++
      }
    }
    return validCount > 0 ? sum.toFixed(2) : "0.00"
  }, [cellData, cellCount])

  // 3. Inspection Items State (14 items)
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    BATTERY_INSPECTION_ITEMS.forEach((it) => {
      initial[it.id] = {
        condition: isRepairMode ? "RUSAK" : "",
        notes: "",
        photos: [],
      }
    })
    return initial
  })

  const evaluatedCount = React.useMemo(
    () => BATTERY_INSPECTION_ITEMS.filter((it) => Boolean(items[it.id]?.condition)).length,
    [items]
  )

  // Photo preview lightbox state
  const [previewPhoto, setPreviewPhoto] = React.useState<{ itemLabel: string; url: string } | null>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [searchFilter, setSearchFilter] = React.useState("")

  // Update item helper
  const updateItem = (itemId: string, partial: Partial<ItemState>) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...partial,
      },
    }))
  }

  // Set condition handler
  const setCondition = (itemId: string, cond: ChecklistCondition) => {
    setItems((prev) => {
      const isDefect = cond === "RUSAK" || cond === "REPAIR" || cond === "URGENT"
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          condition: cond,
          handler: isDefect ? prev[itemId]?.handler || "BES" : prev[itemId]?.handler,
          repairForm: isDefect
            ? prev[itemId]?.repairForm || "SAT/FRM/TS/065_REV:00_161020"
            : prev[itemId]?.repairForm,
        },
      }
    })
  }

  // Photo upload handler
  const uploadPhoto = async (itemId: string, file: File) => {
    updateItem(itemId, { uploading: true })
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set(
        "context",
        JSON.stringify({
          kind: "CHECKLIST_ITEM",
          reportCode,
          formCode,
          itemId,
          sequence: (items[itemId]?.photos?.length || 0) + 1,
        })
      )

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Upload foto gagal.")
      }

      setItems((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          uploading: false,
          photos: [...(prev[itemId]?.photos || []), payload],
        },
      }))
    } catch (err: unknown) {
      updateItem(itemId, { uploading: false })
      const msg = err instanceof Error ? err.message : "Gagal mengupload foto."
      setSubmitError(msg)
    }
  }

  // Photo delete handler
  const deletePhoto = (itemId: string, fileId: string) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: (prev[itemId]?.photos || []).filter((p) => p.fileId !== fileId),
      },
    }))
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Check unfilled items
    const unfilled = BATTERY_INSPECTION_ITEMS.filter((it) => !items[it.id]?.condition)
    if (unfilled.length > 0) {
      setSubmitError(`Harap isi semua kondisi komponen. Ada ${unfilled.length} item yang belum diisi.`)
      return
    }

    if (!unitNo.trim()) {
      setSubmitError("Nomor Unit wajib diisi.")
      return
    }

    if (!volt.trim()) {
      setSubmitError("Tegangan (Volt) wajib diisi.")
      return
    }

    if (!generalCondition.trim()) {
      setSubmitError("Kondisi wajib diisi.")
      return
    }

    // Validate defect items require photos and notes
    for (const it of BATTERY_INSPECTION_ITEMS) {
      const st = items[it.id]
      const cond = st?.condition
      if (cond === "RUSAK" || cond === "REPAIR" || cond === "URGENT") {
        if (!st?.photos || st.photos.length === 0) {
          setSubmitError(`Foto bukti wajib diupload untuk ${it.label}.`)
          return
        }
        if (!st?.notes?.trim()) {
          setSubmitError(`Keterangan wajib diisi untuk ${it.label}.`)
          return
        }
      }
    }

    setIsSubmitting(true)

    // Build items payload
    const payloadItems: ChecklistPayloadItem[] = BATTERY_INSPECTION_ITEMS.map((it) => {
      const st = items[it.id]
      const cond = (st?.condition || "BAIK") as ChecklistCondition
      const isDefect = cond === "RUSAK" || cond === "REPAIR" || cond === "URGENT"
      const followUp = FOLLOW_UP_OPTIONS.find((f) => f.id === st?.repairForm)

      return {
        id: it.id,
        label: it.label,
        condition: cond,
        notes: st?.notes || (isDefect ? followUp?.label : undefined),
        photos: st?.photos || [],
        handler: isDefect ? st?.handler || "BES" : undefined,
        repairForm: isDefect && st?.repairForm !== "REPAIR_TANPA_BIAYA" ? st?.repairForm : undefined,
        repairFormName: isDefect && st?.repairForm !== "REPAIR_TANPA_BIAYA" ? followUp?.label : undefined,
      }
    })

    const payload: ChecklistPayload = {
      formCode,
      formName: "Form Monthly Checklist Battery",
      areaCode,
      period: "MONTHLY",
      periodKey,
      unitNo: unitNo.trim(),
      unitBrand: brand,
      unitModel: unitType,
      capacityKva: volt,
      generalNotes: JSON.stringify({
        warehouse,
        unitType,
        unitNo,
        volt,
        brand,
        generalCondition,
        cellCount,
        totalVoltage,
        cellMeasurements: cellData.slice(0, cellCount),
      }),
      items: payloadItems,
    }

    const validation = validateChecklistPayload(payload)
    if (!validation.valid) {
      setIsSubmitting(false)
      setSubmitError(validation.errors.join(", "))
      return
    }

    try {
      const res = await submitAction({ reportCode, payload })
      if (!res.ok) {
        setIsSubmitting(false)
        setSubmitError(
          Array.isArray((res as any).errors)
            ? (res as any).errors.join(", ")
            : "Terjadi kesalahan saat menyimpan checklist."
        )
        return
      }

      if (onSuccess) {
        onSuccess({ isSafe: res.isSafe ?? true })
      } else {
        const needsFollowUp = payloadItems.some(
          (item) =>
            item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
            item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
        )
        window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setSubmitError(err.message || "Terjadi kesalahan saat menyimpan checklist.")
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* 1. KARTU IDENTITAS UNIT & SPESIFIKASI BATERAI */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
              <BatteryCharging className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#111111]">
                Identitas Unit & Baterai
              </h2>
              <p className="text-xs text-[#707784]">
                Spesifikasi forklift & pallet mover
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="rounded-md border border-[#e5e5e5] bg-[#fbfbfa] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#555555]">
              {FRM_TS_028_NRA}
            </span>
            <span className="text-[10px] text-[#707784] font-medium">
              Periode: {periodKey}
            </span>
          </div>
        </div>

        {/* 2-Column Mobile Grid for Metadata Inputs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WH / Lokasi */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              WH / Lokasi <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              readOnly={Boolean(areaName)}
              value={warehouse || areaName}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder="Contoh: WH DC / Area Charger"
              className={cn(
                "h-11 rounded-xl border-[#dedede] text-sm font-medium",
                areaName
                  ? "bg-gray-100 text-[#444444]"
                  : "bg-[#fbfbfb] text-[#111111] focus:border-[#ff8a2a]"
              )}
            />
          </div>

          {/* Tipe Unit */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              Tipe Unit <span className="text-red-500">*</span>
            </label>
            <Select
              value={unitType}
              onValueChange={(val) => {
                if (val) handleUnitTypeChange(val as "Forklift" | "Pallet Mover")
              }}
            >
              <SelectTrigger className="w-full !h-11 h-11 rounded-xl border border-[#dedede] bg-[#fbfbfb] px-3.5 text-sm font-medium text-[#111111] shadow-none focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a]">
                <SelectValue placeholder="Pilih Tipe Unit" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="rounded-xl border border-[#dedede] bg-white p-1 shadow-lg ring-1 ring-black/5"
              >
                <SelectItem
                  value="Forklift"
                  className="rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer hover:bg-[#fff0e3] hover:text-[#ff8a2a] focus:bg-[#fff0e3] focus:text-[#ff8a2a] data-[state=checked]:bg-[#fff0e3] data-[state=checked]:text-[#ff8a2a] data-[state=checked]:font-semibold"
                >
                  Forklift (48V / 24 Sel)
                </SelectItem>
                <SelectItem
                  value="Pallet Mover"
                  className="rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer hover:bg-[#fff0e3] hover:text-[#ff8a2a] focus:bg-[#fff0e3] focus:text-[#ff8a2a] data-[state=checked]:bg-[#fff0e3] data-[state=checked]:text-[#ff8a2a] data-[state=checked]:font-semibold"
                >
                  Pallet Mover (24V / 12 Sel)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nomor Unit */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              Nomor Unit <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              placeholder="mis. FL-01 / 1"
              className="h-11 rounded-xl border-[#dedede] bg-[#fbfbfb] text-sm font-medium text-[#111111] focus:border-[#ff8a2a]"
            />
          </div>

          {/* Tegangan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#111111]">
                Tegangan (Volt) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-[#ff8a2a]">
                {unitType === "Pallet Mover" ? "24V (12 Sel)" : "48V (24 Sel)"}
              </span>
            </div>
            <Input
              type="text"
              value={volt}
              onChange={(e) => setVolt(e.target.value)}
              placeholder="Contoh: 48V"
              className="h-11 rounded-xl border-[#dedede] bg-[#fbfbfb] text-sm font-medium text-[#111111] focus:border-[#ff8a2a]"
            />
          </div>

          {/* Merk Baterai */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              Merk <span className="text-red-500">*</span>
            </label>
            <Select
              value={brand}
              onValueChange={(val) => {
                if (val) setBrand(val as "Jungheinrich" | "Crown")
              }}
            >
              <SelectTrigger className="w-full !h-11 h-11 rounded-xl border border-[#dedede] bg-[#fbfbfb] px-3.5 text-sm font-medium text-[#111111] shadow-none focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a]">
                <SelectValue placeholder="Pilih Merk Baterai" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="rounded-xl border border-[#dedede] bg-white p-1 shadow-lg ring-1 ring-black/5"
              >
                <SelectItem
                  value="Jungheinrich"
                  className="rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer hover:bg-[#fff0e3] hover:text-[#ff8a2a] focus:bg-[#fff0e3] focus:text-[#ff8a2a] data-[state=checked]:bg-[#fff0e3] data-[state=checked]:text-[#ff8a2a] data-[state=checked]:font-semibold"
                >
                  Jungheinrich
                </SelectItem>
                <SelectItem
                  value="Crown"
                  className="rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer hover:bg-[#fff0e3] hover:text-[#ff8a2a] focus:bg-[#fff0e3] focus:text-[#ff8a2a] data-[state=checked]:bg-[#fff0e3] data-[state=checked]:text-[#ff8a2a] data-[state=checked]:font-semibold"
                >
                  Crown
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kondisi */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              Kondisi <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={generalCondition}
              onChange={(e) => setGeneralCondition(e.target.value)}
              placeholder="mis. Baik / Siap Operasi"
              className="h-11 rounded-xl border-[#dedede] bg-[#fbfbfb] text-sm font-medium text-[#111111] focus:border-[#ff8a2a]"
            />
          </div>
        </div>
      </div>

      {/* 2. TABEL BAGIAN / KOMPONEN FISIK (14 ITEM) */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
              <Wrench className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                1. Pemeriksaan Komponen Fisik
              </h2>
              <p className="text-[11px] text-slate-500">
                14 item pemeriksaan fisik baterai & kabel
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
            {evaluatedCount} / {BATTERY_INSPECTION_ITEMS.length} Terisi
          </span>
        </div>

        {/* List of 14 Inspection Items with Mobile Optimized 5-Column Buttons */}
        <div className="mt-3 divide-y divide-slate-100">
          {BATTERY_INSPECTION_ITEMS.map((item) => {
            const current = items[item.id]?.condition || ""
            const isDefect = current === "RUSAK" || current === "REPAIR" || current === "URGENT"

            return (
              <div
                key={item.id}
                className="py-3 px-1 rounded-xl transition-colors space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700">
                    {item.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {item.label}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* 4-Column Button Grid for Touch Targets on Mobile */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {(
                    [
                      {
                        key: "BAIK",
                        label: "V",
                        title: "OK (Baik)",
                        activeClass:
                          "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 shadow-xs",
                        hoverClass:
                          "hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700",
                      },
                      {
                        key: "RUSAK",
                        label: "X",
                        title: "Not Good (Rusak)",
                        activeClass:
                          "border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 shadow-xs",
                        hoverClass:
                          "hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700",
                      },
                      {
                        key: "REPAIR",
                        label: "R",
                        title: "Repair (Perlu Perbaikan)",
                        activeClass:
                          "border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500/30 shadow-xs",
                        hoverClass:
                          "hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800",
                      },
                      {
                        key: "URGENT",
                        label: "U",
                        title: "Urgent (Mendesak)",
                        activeClass:
                          "border-slate-500 bg-slate-100 text-slate-800 ring-1 ring-slate-500/30 shadow-xs",
                        hoverClass:
                          "hover:border-slate-400 hover:bg-slate-100/70 hover:text-slate-800",
                      },
                    ] as const
                  ).map((btn) => {
                    const isSelected = current === btn.key

                    return (
                      <button
                        key={btn.key}
                        type="button"
                        title={btn.title}
                        onClick={() => setCondition(item.id, btn.key)}
                        className={cn(
                          "h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center active:scale-[0.98]",
                          isSelected
                            ? btn.activeClass
                            : cn(
                              "border-[#dedede] bg-white text-[#525252]",
                              btn.hoverClass
                            )
                        )}
                      >
                        {btn.label}
                      </button>
                    )
                  })}
                </div>

                {/* Damage Details Panel when RUSAK / REPAIR / URGENT (Consistent with other forms) */}
                {isDefect && (
                  <div className="mt-3 rounded-xl border border-[#eeeeec] bg-[#fafafa] p-3.5 flex flex-col gap-3.5">
                    {/* 1. AKAN DIHANDLE */}
                    <div>
                      <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                        AKAN DIHANDLE <span className="text-red-500">*</span>
                      </p>
                      <div className="flex rounded-xl bg-[#f5f5f3] p-1">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { handler: "BES" })}
                          className={cn(
                            "flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all",
                            (items[item.id]?.handler || "BES") === "BES"
                              ? "bg-[#ff8a2a] text-white shadow-xs"
                              : "text-[#707784] hover:text-[#111111]"
                          )}
                        >
                          BES
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { handler: "EKSTERNAL" })}
                          className={cn(
                            "flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all",
                            items[item.id]?.handler === "EKSTERNAL"
                              ? "bg-[#ff8a2a] text-white shadow-xs"
                              : "text-[#707784] hover:text-[#111111]"
                          )}
                        >
                          Eksternal
                        </button>
                      </div>
                    </div>

                    {/* 2. Foto bukti */}
                    <div className="border-t border-[#eeeeec] pt-3.5">
                      <p className="mb-2 text-xs font-bold text-[#707784]">
                        Foto bukti <span className="text-red-500">*</span>
                      </p>
                      {(!items[item.id]?.photos || items[item.id]?.photos.length === 0) && (
                        <CameraCaptureButton
                          disabled={items[item.id]?.uploading}
                          uploading={items[item.id]?.uploading}
                          watermarkLines={buildChecklistPhotoWatermarkLines({
                            areaName: `${areaName} (Baterai ${unitType} #${unitNo || "1"})`,
                            userLabel: watermarkUserLabel,
                            userRole: watermarkUserRole,
                          })}
                          onCapture={(file) => void uploadPhoto(item.id, file)}
                        />
                      )}
                      {items[item.id]?.photos && items[item.id]?.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {items[item.id]?.photos.map((photo) => (
                            <div key={photo.fileId} className="relative group">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewPhoto({
                                    itemLabel: item.label,
                                    url: photo.url,
                                  })
                                }
                                className="block overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111] text-left shadow-xs"
                              >
                                <Image
                                  src={photo.url}
                                  alt={`Foto ${item.label}`}
                                  width={80}
                                  height={80}
                                  className="size-20 object-cover cursor-pointer"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePhoto(item.id, photo.fileId)}
                                className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white shadow-xs transition-transform hover:scale-110 active:scale-95"
                                title="Hapus foto"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          ))}
                          <CameraCaptureButton
                            disabled={items[item.id]?.uploading}
                            uploading={items[item.id]?.uploading}
                            watermarkLines={buildChecklistPhotoWatermarkLines({
                              areaName: `${areaName} (Baterai ${unitType} #${unitNo || "1"})`,
                              userLabel: watermarkUserLabel,
                              userRole: watermarkUserRole,
                            })}
                            onCapture={(file) => void uploadPhoto(item.id, file)}
                          />
                        </div>
                      )}
                    </div>

                    {/* 3. KETERANGAN */}
                    <div className="border-t border-[#eeeeec] pt-3.5">
                      <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                        KETERANGAN <span className="text-red-500">*</span>
                      </p>
                      <textarea
                        value={items[item.id]?.notes || ""}
                        onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                        placeholder="Tambahkan keterangan temuan kerusakan..."
                        className="w-full min-h-[72px] rounded-xl border border-[#e8e8e6] bg-white p-3 text-[13px] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none placeholder:text-[#a0a5ad] focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 resize-y"
                      />
                    </div>

                    {/* 4. FORM TINDAK LANJUT */}
                    <div className="border-t border-[#eeeeec] pt-3.5">
                      <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                        FORM TINDAK LANJUT <span className="text-red-500">*</span>
                      </p>
                      <Select
                        value={items[item.id]?.repairForm || "SAT/FRM/TS/065_REV:00_161020"}
                        onValueChange={(val) =>
                          updateItem(item.id, {
                            repairForm: val || undefined,
                          })
                        }
                      >
                        <SelectTrigger className="w-full !h-11 h-11 rounded-xl border border-[#e8e8e6] bg-white px-3 text-[13px] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none focus:border-[#ff8a2a]/50 focus:ring-3 focus:ring-[#ff8a2a]/20 focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 focus-visible:ring-offset-0 transition-all">
                          <SelectValue placeholder="Pilih form tindak lanjut" />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="rounded-xl border border-[#dedede] bg-white p-1 shadow-lg ring-1 ring-black/5"
                        >
                          {FOLLOW_UP_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.id}
                              value={opt.id}
                              className="rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer hover:bg-[#fff0e3] hover:text-[#ff8a2a] focus:bg-[#fff0e3] focus:text-[#ff8a2a] data-[state=checked]:bg-[#fff0e3] data-[state=checked]:text-[#ff8a2a] data-[state=checked]:font-semibold"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend per user guideline (plain uncolored) */}
        <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
          <strong>Ket. Kondisi :</strong> V = OK &nbsp;•&nbsp; X = Not Good &nbsp;•&nbsp; R = Repair &nbsp;•&nbsp; U = Urgent
        </div>
      </div>

      {/* 3. TABEL DATA POINT 10 & 11 (PENGUKURAN SEL BATERAI) - TARUH DI BAWAHNYA */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Gauge className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                2. Pengukuran Sel Baterai
              </h2>
              <p className="text-[11px] text-slate-500">
                Data Point 10 & 11 ({cellCount} Sel • {unitType})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={prefillNormalCells}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
          >
            <Zap className="size-3 text-amber-500" />
            <span>Isi Standar</span>
          </button>
        </div>

        {/* Cell Count Selector Toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setCellCount(12)}
            className={cn(
              "rounded-lg py-1.5 text-xs font-semibold transition-all",
              cellCount === 12
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            12 Sel (Pallet Mover)
          </button>
          <button
            type="button"
            onClick={() => setCellCount(24)}
            className={cn(
              "rounded-lg py-1.5 text-xs font-semibold transition-all",
              cellCount === 24
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            24 Sel (Forklift)
          </button>
        </div>

        {/* Tabel Sel 1 - 12 */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="bg-slate-50/90 px-3 py-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Sel Baterai 01 – 12</span>
            <span className="text-[10px] font-normal text-slate-500">Grup 1</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2 px-2.5 text-center w-14">No Cell</th>
                <th className="py-2 px-3">B.J (Keasaman)</th>
                <th className="py-2 px-3">Teg. Static (V)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {cellData.slice(0, Math.min(12, cellCount)).map((cell) => (
                <tr key={cell.cellNo} className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-2.5 text-center font-bold text-slate-700 bg-slate-50/50">
                    {String(cell.cellNo).padStart(2, "0")}
                  </td>
                  <td className="py-1.5 px-2.5">
                    <Input
                      type="text"
                      value={cell.bj}
                      onChange={(e) => updateCell(cell.cellNo, "bj", e.target.value)}
                      placeholder="1.28"
                      className="h-8 text-xs font-mono font-medium rounded-lg"
                    />
                  </td>
                  <td className="py-1.5 px-2.5">
                    <Input
                      type="text"
                      value={cell.voltage}
                      onChange={(e) => updateCell(cell.cellNo, "voltage", e.target.value)}
                      placeholder="2.10"
                      className="h-8 text-xs font-mono font-medium rounded-lg"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabel Sel 13 - 24 (Bawahnya Sel 12, tidak 2 kolom sejajar) */}
        {cellCount === 24 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-slate-50/90 px-3 py-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>Sel Baterai 13 – 24</span>
              <span className="text-[10px] font-normal text-slate-500">Grup 2</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5 text-center w-14">No Cell</th>
                  <th className="py-2 px-3">B.J (Keasaman)</th>
                  <th className="py-2 px-3">Teg. Static (V)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {cellData.slice(12, 24).map((cell) => (
                  <tr key={cell.cellNo} className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-2.5 text-center font-bold text-slate-700 bg-slate-50/50">
                      {String(cell.cellNo).padStart(2, "0")}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <Input
                        type="text"
                        value={cell.bj}
                        onChange={(e) => updateCell(cell.cellNo, "bj", e.target.value)}
                        placeholder="1.28"
                        className="h-8 text-xs font-mono font-medium rounded-lg"
                      />
                    </td>
                    <td className="py-1.5 px-2.5">
                      <Input
                        type="text"
                        value={cell.voltage}
                        onChange={(e) => updateCell(cell.cellNo, "voltage", e.target.value)}
                        placeholder="2.10"
                        className="h-8 text-xs font-mono font-medium rounded-lg"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Voltage Summary Card */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div>
            <p className="text-xs font-bold text-slate-900">
              Total Tegangan Statik ({cellCount} Sel)
            </p>
            <p className="text-[10px] text-slate-500">
              Min: {cellCount === 12 ? "24.0V (Pallet Mover)" : "48.0V (Forklift)"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <span className="font-mono text-base font-bold text-slate-950">
              {totalVoltage} <span className="text-xs font-normal text-slate-500">V</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. LEMBAR PENGESAHAN & LEGALITAS (INTERNAL USE ONLY) */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
          <div className="flex items-center gap-1.5">
            <FileCheck className="size-3.5 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              3. Kolom Pengesahan Formulir
            </h3>
          </div>
          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-slate-700">
            INTERNAL USE ONLY
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 flex flex-col justify-between h-24">
            <p className="text-[10px] font-bold text-slate-700">Dibuat Oleh,</p>
            <div className="border-t border-dashed border-slate-300 pt-1">
              <p className="text-[10px] font-semibold text-slate-900 truncate">Br. Tech Support</p>
              <p className="text-[9px] text-slate-400">Teknisi</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 flex flex-col justify-between h-24">
            <p className="text-[10px] font-bold text-slate-700">Diperiksa,</p>
            <div className="border-t border-dashed border-slate-300 pt-1">
              <p className="text-[10px] font-semibold text-slate-900 truncate">Br. Coord TS</p>
              <p className="text-[9px] text-slate-400">Koordinator</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 flex flex-col justify-between h-24">
            <p className="text-[10px] font-bold text-slate-700">Disetujui,</p>
            <div className="border-t border-dashed border-slate-300 pt-1">
              <p className="text-[10px] font-semibold text-slate-900 truncate">Br. B&M Mgr</p>
              <p className="text-[9px] text-slate-400">Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error message if any */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Sticky Mobile Bottom Submit Bar */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-slate-900">{FRM_TS_028_NRA}</span>
          <span className="font-mono text-xs font-semibold text-slate-600">
            {evaluatedCount} / {BATTERY_INSPECTION_ITEMS.length} Terisi
          </span>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff8a2a] py-3 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-[#e0751d] active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Menyimpan Laporan...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Simpan & Kirim Laporan</span>
            </>
          )}
        </button>
      </div>

      {/* Lightbox Photo Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eeeeec] p-4">
              <p className="text-sm font-bold text-[#111111]">{previewPhoto.itemLabel}</p>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="grid size-8 place-items-center rounded-lg text-[#707784] hover:bg-[#f5f5f3]"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-2">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.itemLabel}
                width={600}
                height={600}
                className="max-h-[75vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
