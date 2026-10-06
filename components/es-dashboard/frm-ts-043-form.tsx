"use client"

import * as React from "react"
import Image from "next/image"
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  Info,
  Loader2,
  Search,
  Send,
  Sliders,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { CameraCaptureButton } from "@/components/es-dashboard/camera-capture-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  FORKLIFT_WEEKLY_CATEGORIES,
  ALL_FORKLIFT_WEEKLY_ITEMS,
  FRM_TS_043_FORM_CODE,
  FRM_TS_043_NRA,
  FRM_TS_043_REF_NRA,
  type ForkliftWeeklyItem,
} from "@/lib/checklists/frm-ts-043"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs043FormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  watermarkUserLabel: string
  watermarkUserRole: string
  formCode?: string
  isRepairMode?: boolean
  submitAction(input: {
    reportCode: string
    payload: ChecklistPayload
  }): Promise<{ ok: true; isSafe?: boolean } | { ok: false; errors: string[] }>
}

type ItemState = {
  condition?: ChecklistCondition
  photos: ChecklistPhoto[]
  notes: string
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  uploading: boolean
}

const FOLLOW_UP_OPTIONS = [
  {
    id: "SAT/FRM/TS/065_REV:00_161020",
    label: "Form Penggantian Spare Part (065)",
    badge: "065",
  },
  {
    id: "SAT/FRM/TSM/014_REV:000_060423",
    label: "Form Estimasi Biaya Sipil & ME (014)",
    badge: "014",
  },
  {
    id: "REPAIR_TANPA_BIAYA",
    label: "Repair Tanpa Biaya",
    badge: "Tanpa Biaya",
  },
]

type PreviewPhoto = {
  itemLabel: string
  url: string
}

function getCurrentWeekId(): string {
  const day = new Date().getDate()
  // Day 1-7: M1, 8-14: M2, 15-21: M3, 22-28: M4, 29-31: M5
  const weekNum = Math.min(5, Math.max(1, Math.ceil(day / 7)))
  return `M${weekNum}`
}

const WEEKS = [
  { id: "M1", label: "Minggu 1" },
  { id: "M2", label: "Minggu 2" },
  { id: "M3", label: "Minggu 3" },
  { id: "M4", label: "Minggu 4" },
  { id: "M5", label: "Minggu 5" },
]

export function FrmTs043Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_043_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs043FormProps) {
  const router = useRouter()

  // Week locked to current week of month
  const currentWeekId = React.useMemo(() => getCurrentWeekId(), [])
  const selectedWeek = currentWeekId

  // Metadata
  const [unitNo, setUnitNo] = React.useState("")
  const [inspectionDate, setInspectionDate] = React.useState(
    () => new Date().toISOString().split("T")[0],
  )
  const [hourMeter, setHourMeter] = React.useState("")
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Form items state (NO default condition - user must evaluate each item)
  const [itemsState, setItemsState] = React.useState<Record<string, ItemState>>(
    () => {
      const initial: Record<string, ItemState> = {}
      for (const item of ALL_FORKLIFT_WEEKLY_ITEMS) {
        initial[item.id] = {
          condition: undefined,
          photos: [],
          notes: "",
          handler: "BES",
          repairForm: "SAT/FRM/TS/065_REV:00_161020",
          uploading: false,
        }
      }
      return initial
    },
  )

  const [searchQuery, setSearchQuery] = React.useState("")
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {}
    FORKLIFT_WEEKLY_CATEGORIES.forEach((cat) => {
      init[cat.id] = true
    })
    return init
  })

  const [previewPhoto, setPreviewPhoto] = React.useState<PreviewPhoto | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitErrors, setSubmitErrors] = React.useState<string[]>([])

  const totalItems = ALL_FORKLIFT_WEEKLY_ITEMS.length
  const counts = React.useMemo(() => {
    let baik = 0
    let rusak = 0
    let photosCount = 0
    for (const item of ALL_FORKLIFT_WEEKLY_ITEMS) {
      const state = itemsState[item.id]
      if (state?.condition === "BAIK") baik++
      if (state?.condition === "RUSAK") rusak++
      photosCount += state?.photos?.length || 0
    }
    const belumDiisi = totalItems - baik - rusak
    return { baik, rusak, photosCount, belumDiisi }
  }, [itemsState, totalItems])

  const missingPhotos = React.useMemo(() => {
    const list: string[] = []
    for (const item of ALL_FORKLIFT_WEEKLY_ITEMS) {
      const state = itemsState[item.id]
      if (state?.condition === "RUSAK" && (!state.photos || state.photos.length === 0)) {
        list.push(item.label)
      }
    }
    return list
  }, [itemsState])

  const anyUploading = Object.values(itemsState).some((s) => s.uploading)
  const isFilled = isRepairMode
    ? counts.rusak > 0
    : ALL_FORKLIFT_WEEKLY_ITEMS.every((item) => Boolean(itemsState[item.id]?.condition))

  const canSubmit = isFilled && missingPhotos.length === 0 && !anyUploading && unitNo.trim() !== ""

  function toggleCategory(categoryId: string) {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }


  function setCondition(itemId: string, cond: ChecklistCondition) {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition: cond,
        photos: cond === "BAIK" ? [] : prev[itemId]?.photos || [],
      },
    }))
  }

  function updateItemState(itemId: string, patch: Partial<ItemState>) {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...patch,
      },
    }))
  }

  async function uploadPhoto(itemId: string, file: File) {
    updateItemState(itemId, { uploading: true })
    setSubmitErrors([])

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
          sequence: (itemsState[itemId]?.photos?.length || 0) + 1,
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

      setItemsState((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          uploading: false,
          photos: [...(prev[itemId]?.photos || []), payload],
        },
      }))
    } catch (err) {
      updateItemState(itemId, { uploading: false })
      setSubmitErrors([err instanceof Error ? err.message : "Upload foto gagal."])
    }
  }

  function deletePhoto(itemId: string, fileId: string) {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: (prev[itemId]?.photos || []).filter((p) => p.fileId !== fileId),
      },
    }))
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    setSubmitErrors([])

    try {
      const payloadItems = ALL_FORKLIFT_WEEKLY_ITEMS.filter((item) => {
        if (isRepairMode) return itemsState[item.id]?.condition === "RUSAK"
        return Boolean(itemsState[item.id]?.condition)
      }).map((item) => {
        const state = itemsState[item.id]!
        const cond = state.condition!
        const followUp = FOLLOW_UP_OPTIONS.find((f) => f.id === state.repairForm)
        return {
          id: item.id,
          label: item.label,
          condition: cond,
          photos: state.photos || [],
          notes: state.notes || (cond === "RUSAK" ? followUp?.label : undefined),
          handler: cond === "RUSAK" ? state.handler || "BES" : undefined,
          repairForm: cond === "RUSAK" ? state.repairForm : undefined,
          repairFormName: cond === "RUSAK" ? followUp?.label : undefined,
        }
      })

      const weekLabel = WEEKS.find((w) => w.id === selectedWeek)?.label || selectedWeek

      const payload: ChecklistPayload = {
        formCode,
        formName: "Checklist Forklift Weekly",
        areaCode,
        period: "WEEKLY",
        periodKey,
        unitNo: unitNo.trim(),
        hourMeter: hourMeter.trim(),
        generalNotes: generalNotes.trim()
          ? `[${weekLabel} | Tgl: ${inspectionDate} | H1: ${hourMeter || "-"}] ${generalNotes.trim()}`
          : `[${weekLabel} | Tgl: ${inspectionDate} | H1: ${hourMeter || "-"}]`,
        items: payloadItems,
      }

      const val = validateChecklistPayload(payload)
      if (!val.valid) {
        setSubmitErrors(val.errors)
        setIsSubmitting(false)
        return
      }

      const res = await submitAction({ reportCode, payload })
      if (!res.ok) {
        setSubmitErrors(res.errors)
        setIsSubmitting(false)
        return
      }

      const needsFollowUp = payload.items.some(
        (item) =>
          item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
          item.repairForm === "SAT/FRM/TS/065_REV:00_161020",
      )

      if (needsFollowUp) {
        router.push(`/dashboard/reports/${reportCode}/follow-up`)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error(err)
      setSubmitErrors(["Terjadi kesalahan sistem saat menyimpan checklist."])
      setIsSubmitting(false)
    }
  }

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return FORKLIFT_WEEKLY_CATEGORIES
    const q = searchQuery.toLowerCase()
    return FORKLIFT_WEEKLY_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0)
  }, [searchQuery])

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* SOP Reference Banner */}
      <div className="rounded-xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-[#ff8a2a]">{FRM_TS_043_NRA}</p>
            <p className="text-xs text-[#686868]">{FRM_TS_043_REF_NRA}</p>
          </div>
          <span className="self-start rounded-full bg-[#fff0e3] px-2.5 py-0.5 text-[11px] font-bold text-[#ff8a2a]">
            Weekly Inspection
          </span>
        </div>
      </div>

      {/* Header Info / Unit Metadata */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
          <Truck className="size-5 text-[#ff8a2a]" />
          <h2 className="text-base font-bold text-[#111111]">
            Identitas Unit Forklift & Periode
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Unit No */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              No. Unit Forklift <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="mis. FL-01 / N01"
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              className="h-11 rounded-xl border-[#dedede] bg-[#fbfbfb] text-sm focus:border-[#ff8a2a]"
            />
          </div>

          {/* Area / Lokasi */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#111111]">
              Lokasi / Ruangan
            </label>
            <Input
              type="text"
              readOnly
              value={areaName}
              className="h-11 rounded-xl border-[#dedede] bg-gray-100 text-sm font-medium text-[#444444]"
            />
          </div>

          {/* Minggu Selector */}
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-semibold text-[#111111]">
                Minggu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-[#ff8a2a]">
                Terkunci otomatis sesuai minggu berjalan ({WEEKS.find((w) => w.id === currentWeekId)?.label})
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {WEEKS.map((w) => {
                const isCurrent = w.id === currentWeekId
                return (
                  <div
                    key={w.id}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all select-none",
                      isCurrent
                        ? "border-[#ff8a2a] bg-[#fff0e3] text-[#ff8a2a] shadow-xs ring-1 ring-[#ff8a2a]"
                        : "border-[#e5e5e5] bg-gray-50 text-[#a3a3a3] opacity-60",
                    )}
                  >
                    <span>{w.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tanggal Pelaksanaan */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
              <Calendar className="size-3.5 text-[#ff8a2a]" />
              Tanggal Pelaksanaan
            </label>
            <Input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="h-11 rounded-xl border-[#dedede] bg-[#fbfbfb] text-sm focus:border-[#ff8a2a]"
            />
          </div>

          {/* Hour Meter 1 (H1) */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
              <Clock className="size-3.5 text-[#ff8a2a]" />
              Hour Meter 1 (H1)
            </label>
            <Input
              type="text"
              placeholder="mis. 1240.5"
              value={hourMeter}
              onChange={(e) => setHourMeter(e.target.value)}
              className="h-11 rounded-xl border-[#dedede] bg-[#fbfbfb] text-sm focus:border-[#ff8a2a]"
            />
          </div>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#111111] text-xs font-bold text-white">
              {totalItems}
            </span>
            <div>
              <p className="text-xs font-bold text-[#111111]">Total Komponen</p>
              <p className="text-[11px] text-[#686868]">21 titik periksa (CL/C)</p>
            </div>
          </div>

        </div>

        {/* Search Field */}
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#a0a5ad]" />
          <input
            type="text"
            placeholder="Cari item pemeriksaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#dedede] bg-[#fbfbfb] py-2.5 pl-10 pr-4 text-xs placeholder:text-[#a0a5ad] outline-none focus:border-[#ff8a2a]"
          />
        </div>
      </div>

      {/* Missing Photos Alert */}
      {missingPhotos.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <div>
              <h4 className="text-xs font-bold text-red-900">
                Foto Bukti Kerusakan Wajib ({missingPhotos.length} item)
              </h4>
              <p className="mt-0.5 text-xs text-red-700">
                Semua item kondisi Rusak wajib mengambil foto bukti:
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-red-800">
                {missingPhotos.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error messages */}
      {submitErrors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <div className="text-xs text-red-800">
              <p className="font-bold">Gagal menyimpan laporan:</p>
              <ul className="mt-1 list-inside list-disc">
                {submitErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Category Accordions */}
      <div className="flex flex-col gap-4">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon
          const isOpen = openCategories[cat.id] ?? true
          const catItems = cat.items

          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-2xl border border-[#dedede] bg-white shadow-sm"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="flex w-full items-center justify-between border-b border-[#f0f0f0] bg-white p-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111111]">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#686868]">
                      {catItems.length} item pengecekan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-[#dedede] bg-[#fbfbfb] px-2 py-0.5 text-[10px] font-bold text-[#686868]">
                    CL/C
                  </span>
                  {isOpen ? (
                    <ChevronUp className="size-4 text-[#888888]" />
                  ) : (
                    <ChevronDown className="size-4 text-[#888888]" />
                  )}
                </div>
              </button>

              {/* Items List */}
              {isOpen && (
                <div className="divide-y divide-[#f0f0f0]">
                  {catItems.map((item) => {
                    const state = itemsState[item.id] || {
                      condition: undefined,
                      photos: [],
                      notes: "",
                      handler: "BES",
                      repairForm: "SAT/FRM/TS/065_REV:00_161020",
                      uploading: false,
                    }
                    const isBaik = state.condition === "BAIK"
                    const isRusak = state.condition === "RUSAK"

                    return (
                      <div key={item.id} className="p-4 transition-colors">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                              {item.actionCode}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[#111111]">
                                {item.label}
                              </p>
                              <p className="text-xs text-[#888888]">
                                Tindakan: {item.actionName}
                              </p>
                            </div>
                          </div>

                          {/* Segmented Condition Controls */}
                          <div className="flex items-center gap-1.5 self-start sm:self-center">
                            <button
                              type="button"
                              onClick={() =>
                                updateItemState(item.id, {
                                  condition: "BAIK",
                                  photos: [],
                                  notes: "",
                                  handler: undefined,
                                  repairForm: undefined,
                                })
                              }
                              className={cn(
                                "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none",
                                isBaik
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]",
                              )}
                            >
                              Baik (V)
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateItemState(item.id, {
                                  condition: "RUSAK",
                                  handler: state.handler || "BES",
                                  repairForm: state.repairForm || "SAT/FRM/TS/065_REV:00_161020",
                                })
                              }
                              className={cn(
                                "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none",
                                isRusak
                                  ? "border-red-500 bg-red-50 text-red-700 shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]",
                              )}
                            >
                              Rusak (X)
                            </button>
                          </div>
                        </div>

                        {/* Damage Details Panel when RUSAK */}
                        {isRusak && (
                          <div className="mt-4 border-t border-[#eeeeec] pt-4 flex flex-col gap-4">
                            {/* AKAN DIHANDLE */}
                            <div>
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                AKAN DIHANDLE <span className="text-red-500">*</span>
                              </p>
                              <div className="flex rounded-xl bg-[#f5f5f3] p-1">
                                <button
                                  type="button"
                                  onClick={() => updateItemState(item.id, { handler: "BES" })}
                                  className={cn(
                                    "flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
                                    state.handler === "BES"
                                      ? "bg-[#ff8a2a] text-white shadow"
                                      : "text-[#707784] hover:text-[#111111]",
                                  )}
                                >
                                  BES
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItemState(item.id, { handler: "EKSTERNAL" })}
                                  className={cn(
                                    "flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
                                    state.handler === "EKSTERNAL"
                                      ? "bg-[#ff8a2a] text-white shadow"
                                      : "text-[#707784] hover:text-[#111111]",
                                  )}
                                >
                                  Eksternal
                                </button>
                              </div>
                            </div>

                            {/* Foto bukti */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-xs font-bold text-[#707784]">
                                Foto bukti <span className="text-red-500">*</span>
                              </p>
                              {(!state.photos || state.photos.length === 0) && (
                                <CameraCaptureButton
                                  disabled={state.uploading}
                                  uploading={state.uploading}
                                  watermarkLines={buildChecklistPhotoWatermarkLines({
                                    areaName: `${areaName} (Forklift: ${unitNo || "-"})`,
                                    userLabel: watermarkUserLabel,
                                    userRole: watermarkUserRole,
                                  })}
                                  onCapture={(file) => void uploadPhoto(item.id, file)}
                                />
                              )}
                              {state.photos && state.photos.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {state.photos.map((photo) => (
                                    <div key={photo.fileId} className="relative">
                                      <div className="block overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111]">
                                        <Image
                                          src={photo.url}
                                          alt={`Foto ${item.label}`}
                                          width={80}
                                          height={80}
                                          className="size-20 object-cover cursor-pointer"
                                          onClick={() =>
                                            setPreviewPhoto({
                                              itemLabel: item.label,
                                              url: photo.url,
                                            })
                                          }
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => deletePhoto(item.id, photo.fileId)}
                                        className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white shadow"
                                        title="Hapus foto"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <CameraCaptureButton
                                    disabled={state.uploading}
                                    uploading={state.uploading}
                                    watermarkLines={buildChecklistPhotoWatermarkLines({
                                      areaName: `${areaName} (Forklift: ${unitNo || "-"})`,
                                      userLabel: watermarkUserLabel,
                                      userRole: watermarkUserRole,
                                    })}
                                    onCapture={(file) => void uploadPhoto(item.id, file)}
                                  />
                                </div>
                              )}
                            </div>

                            {/* KETERANGAN */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                KETERANGAN <span className="text-red-500">*</span>
                              </p>
                              <textarea
                                value={state.notes}
                                onChange={(e) => updateItemState(item.id, { notes: e.target.value })}
                                placeholder="Tambahkan keterangan temuan kerusakan..."
                                className="w-full min-h-[80px] rounded-xl border border-[#e8e8e6] bg-white p-3 text-[13px] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none placeholder:text-[#a0a5ad] focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 resize-y"
                              />
                            </div>

                            {/* FORM TINDAK LANJUT */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                FORM TINDAK LANJUT <span className="text-red-500">*</span>
                              </p>
                              <Select
                                value={state.repairForm || "SAT/FRM/TS/065_REV:00_161020"}
                                onValueChange={(val) =>
                                  updateItemState(item.id, {
                                    repairForm: val || undefined,
                                  })
                                }
                              >
                                <SelectTrigger className="w-full !h-11 h-11 rounded-xl border border-[#e8e8e6] bg-white px-3 text-[13px] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none focus:border-[#ff8a2a]/50 focus:ring-3 focus:ring-[#ff8a2a]/20 focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 focus-visible:ring-offset-0 transition-all">
                                  <span className={cn("flex-1 text-left truncate", !state.repairForm && "text-[#707784]")}>
                                    {state.repairForm
                                      ? FOLLOW_UP_OPTIONS.find((o) => o.id === state.repairForm)?.label || state.repairForm
                                      : "Pilih form tindak lanjut"}
                                  </span>
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
                                  {FOLLOW_UP_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.id}
                                      value={opt.id}
                                      className="text-[#111111] hover:bg-[#fffbeb] focus:bg-[#fffbeb] focus:text-[#b45309] data-[state=checked]:bg-[#fffbeb] data-[state=checked]:text-[#b45309] font-medium py-2.5 cursor-pointer text-xs"
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
              )}
            </div>
          )
        })}
      </div>

      {/* General Notes */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm">
        <label className="mb-1.5 block text-xs font-bold text-[#111111]">
          Catatan Tambahan (General Notes)
        </label>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan tambahan mengenai operasional atau kondisi forklift..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="w-full rounded-xl border border-[#dedede] bg-[#fbfbfb] p-3 text-xs placeholder:text-[#a0a5ad] outline-none focus:border-[#ff8a2a]"
        />
      </div>

      {/* Verifikasi & Pelaksana Inspeksi */}
      <section className="rounded-2xl border border-[#dedede] bg-[#fbfbfa] p-4 text-xs text-[#707784] sm:p-5">
        <div className="flex items-center gap-2 font-bold text-[#111111]">
          <Info className="size-4 text-[#ff8a2a]" />
          <span>Verifikasi &amp; Pelaksana Inspeksi</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[#dedede] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Dibuat oleh</span>
            <span className="font-bold text-[#111111]">{watermarkUserLabel}</span>
            <span className="block text-[10px] text-[#999]">Branch Engineering Support</span>
          </div>
          <div className="rounded-xl border border-[#dedede] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Diperiksa oleh</span>
            <span className="font-bold text-[#555]">Branch Engineering Coord.</span>
          </div>
          <div className="rounded-xl border border-[#dedede] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Disetujui oleh</span>
            <span className="font-bold text-[#555]">Br Building &amp; Maintenance Mgr</span>
          </div>
        </div>
        <div className="mt-3 border-t border-[#f0f0f0] pt-2.5 text-center text-[10px] text-[#888]">
          <p className="font-semibold text-[#111111]">{FRM_TS_043_NRA}</p>
          <p className="mt-0.5">{FRM_TS_043_REF_NRA}</p>
        </div>
      </section>

      {/* Submit Button Section */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="h-12 w-full rounded-2xl bg-[#ff8a2a] text-sm font-bold text-white shadow-lg shadow-[#ff8a2a]/25 transition-all hover:bg-[#ea580c] disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Menyimpan Laporan Forklift...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="size-4" />
              <span>Simpan &amp; Kirim Checklist Forklift</span>
            </div>
          )}
        </Button>
        {!canSubmit && (
          <p className="mt-2 text-center text-xs text-[#888888]">
            {unitNo.trim() === ""
              ? "Nomor unit forklift wajib diisi"
              : counts.belumDiisi > 0
                ? `${counts.belumDiisi} dari ${totalItems} item belum ditentukan kondisinya`
                : missingPhotos.length > 0
                  ? "Foto bukti wajib untuk item yang rusak"
                  : anyUploading
                    ? "Foto sedang diupload..."
                    : ""}
          </p>
        )}
      </div>

      {/* Fullscreen Photo Viewer */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-lg overflow-hidden rounded-2xl bg-white p-2">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-1.5 text-white"
            >
              <X className="size-4" />
            </button>
            <div className="relative aspect-4/3 w-full">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.itemLabel}
                fill
                className="object-contain"
              />
            </div>
            <p className="p-3 text-center text-xs font-semibold text-[#111111]">
              {previewPhoto.itemLabel}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
