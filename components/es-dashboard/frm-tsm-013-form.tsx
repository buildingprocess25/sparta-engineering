"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  Beaker,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplet,
  Droplets,
  FileText,
  Filter,
  Gauge,
  Info,
  Loader2,
  MapPin,
  Pipette,
  Power,
  Search,
  Send,
  Sparkles,
  Trash2,
  Waves,
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
  WATER_RECYCLE_CATEGORIES,
  WATER_RECYCLE_ALL_ITEMS,
  FRM_TSM_013_FORM_CODE,
  FRM_TSM_013_NRA,
  FRM_TSM_013_REF_NRA,
  type WaterRecycleChecklistItem,
} from "@/lib/checklists/frm-tsm-013"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTsm013FormProps = {
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
  actionTaken?: string
  meterValue?: string
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
    label: "Form Estimasi Biaya ME (014)",
    badge: "014",
  },
  {
    id: "REPAIR_TANPA_BIAYA",
    label: "Repair Tanpa Biaya (Internal)",
    badge: "Internal",
  },
]

export function FrmTsm013Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TSM_013_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTsm013FormProps) {
  // Metadata States
  const [locationCode, setLocationCode] = React.useState("")
  const [inspectionDate, setInspectionDate] = React.useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("")

  // Category collapse state: default open all categories
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    WATER_RECYCLE_CATEGORIES.forEach((cat) => {
      initial[cat.id] = true
    })
    return initial
  })

  // Items State
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    WATER_RECYCLE_ALL_ITEMS.forEach((it) => {
      initial[it.id] = {
        photos: [],
        notes: "",
        uploading: false,
      }
    })
    return initial
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [submitSuccess, setSubmitSuccess] = React.useState(false)
  const [previewPhoto, setPreviewPhoto] = React.useState<
    { itemLabel: string; url: string } | undefined
  >()

  // Toggle single category
  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  // Update item field
  const updateItem = (itemId: string, patch: Partial<ItemState>) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { photos: [], notes: "", uploading: false }),
        ...patch,
      },
    }))
  }

  // Quick Action: Mark all items in category as OK (BAIK)
  const markCategoryAllGood = (categoryId: string) => {
    const cat = WATER_RECYCLE_CATEGORIES.find((c) => c.id === categoryId)
    if (!cat) return

    setItems((prev) => {
      const next = { ...prev }
      cat.items.forEach((item) => {
        next[item.id] = {
          ...(next[item.id] || { photos: [], notes: "", uploading: false }),
          condition: "BAIK",
          actionTaken: "OK",
          photos: [],
          notes: item.isMeterInput ? next[item.id]?.notes || "" : "",
          handler: undefined,
          repairForm: undefined,
        }
      })
      return next
    })
  }

  const uploadPhoto = async (itemId: string, file: File) => {
    updateItem(itemId, { uploading: true })
    setErrors([])

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
      const msg = err instanceof Error ? err.message : "Gagal mengupload foto"
      setErrors([msg])
    }
  }

  const removePhoto = (itemId: string, fileId: string) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: (prev[itemId]?.photos || []).filter((p) => p.fileId !== fileId),
      },
    }))
  }

  // Filtered categories & items
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return WATER_RECYCLE_CATEGORIES

    const query = searchQuery.toLowerCase()
    return WATER_RECYCLE_CATEGORIES.map((cat) => {
      const matchedItems = cat.items.filter(
        (it) =>
          it.label.toLowerCase().includes(query) ||
          it.conditionDesc.toLowerCase().includes(query) ||
          it.activity.toLowerCase().includes(query) ||
          cat.title.toLowerCase().includes(query)
      )
      return {
        ...cat,
        items: matchedItems,
      }
    }).filter((cat) => cat.items.length > 0)
  }, [searchQuery])

  // Progress metrics
  const totalItemsCount = WATER_RECYCLE_ALL_ITEMS.length
  const evaluatedCount = React.useMemo(() => {
    return WATER_RECYCLE_ALL_ITEMS.filter((item) => {
      const state = items[item.id]
      return Boolean(state?.condition)
    }).length
  }, [items])

  const damagedCount = React.useMemo(() => {
    return WATER_RECYCLE_ALL_ITEMS.filter((item) => {
      const state = items[item.id]
      return state?.condition === "RUSAK" || state?.condition === "REPAIR"
    }).length
  }, [items])

  const progressPercent = Math.round((evaluatedCount / totalItemsCount) * 100)

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate completeness if not repair mode
    if (!isRepairMode && evaluatedCount < totalItemsCount) {
      const uncompleted = WATER_RECYCLE_ALL_ITEMS.filter((it) => !items[it.id]?.condition)
      setErrors([
        `Pemeriksaan belum lengkap (${evaluatedCount}/${totalItemsCount} item). Masih ada item yang belum dicek: ${uncompleted
          .slice(0, 3)
          .map((i) => i.label)
          .join(", ")}${uncompleted.length > 3 ? "..." : ""}`,
      ])
      return
    }

    // Validate damaged items have photos
    const damagedWithoutPhoto = WATER_RECYCLE_ALL_ITEMS.filter((it) => {
      const state = items[it.id]
      const isDamaged = state?.condition === "RUSAK" || state?.condition === "REPAIR"
      return isDamaged && (!state?.photos || state.photos.length === 0)
    })

    if (damagedWithoutPhoto.length > 0) {
      setErrors([
        `Item rusak berikut wajib menyertakan foto bukti: ${damagedWithoutPhoto
          .map((i) => i.label)
          .join(", ")}`,
      ])
      return
    }

    setSubmitting(true)

    try {
      const payloadItems = WATER_RECYCLE_ALL_ITEMS.map((it) => {
        const state = items[it.id] || { photos: [], notes: "", uploading: false }
        const cond = (state.condition || "BAIK") as ChecklistCondition
        const isAction = ["RUSAK", "REPAIR", "CLEAN", "ADJUST_OR_ADD"].includes(cond)
        return {
          id: it.id,
          label: it.label,
          condition: cond,
          photos: state.photos || [],
          notes: state.meterValue
            ? `Meteran: ${state.meterValue} m³${state.notes ? ` - ${state.notes}` : ""}`
            : state.notes || (state.actionTaken ? `Tindakan: ${state.actionTaken}` : isAction ? "Pemeriksaan rutin berkala" : undefined),
          handler: isAction ? (state.handler || "BES") : state.handler,
          repairForm: state.repairForm,
          value: state.meterValue,
        }
      })

      const payload: ChecklistPayload = {
        formCode,
        formName: "Checklist Water Recycle",
        areaCode,
        period: "MONTHLY",
        periodKey,
        items: payloadItems,
        locationCode: locationCode.trim() || undefined,
        inspectionDate: inspectionDate.trim() || undefined,
        generalNotes: [
          locationCode ? `Kode Lokasi: ${locationCode}` : null,
          generalNotes ? `Catatan: ${generalNotes}` : null,
          "Dosis Standar: Tawas 1kg/m³, Kaporit 1kg/m³",
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
      }

      const validation = validateChecklistPayload(payload)
      if (!validation.valid) {
        setErrors(validation.errors)
        setSubmitting(false)
        return
      }

      const result = await submitAction({
        reportCode,
        payload,
      })

      if (!result.ok) {
        setErrors(result.errors || ["Terjadi kesalahan saat menyimpan formulir."])
        setSubmitting(false)
        return
      }

      setSubmitSuccess(true)
      window.location.href = `/dashboard/reports/${reportCode}?submitted=true`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim laporan checklist."
      setErrors([msg])
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert Error Banner */}
      {errors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-sm">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Harap periksa kembali pengisian Anda:
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Document & Identity Card */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm space-y-4">
        <div className="border-b border-[#f0f0f0] pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#fff5eb] px-2 py-0.5 text-[11px] font-bold text-[#ff8a2a] border border-[#ff8a2a]/20">
              FRM_TSM_013
            </span>
            <span className="text-[11px] font-medium text-[#707784]">
              {FRM_TSM_013_NRA}
            </span>
          </div>
          <h1 className="mt-1 text-base font-bold text-[#111111]">
            Checklist Perawatan Peralatan Water Recycle
          </h1>
        </div>

        {/* Chemical Dosage Standard Card */}
        <div className="rounded-xl border border-[#e8e8e6] bg-[#fbfbfa] p-3.5 flex items-start gap-3">
          <div className="grid size-7 place-items-center rounded-lg bg-[#fff5eb] text-[#ff8a2a] shrink-0 mt-0.5">
            <Beaker className="size-3.5" />
          </div>
          <div className="text-xs text-[#2e333d] leading-relaxed">
            <span className="font-bold text-[#111111]">Standar Dosis Chemical (Water Recycle):</span>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#555b66]">
              <span className="inline-flex items-center gap-1">
                • Pemakaian Tawas: <b className="text-[#111111] font-semibold">1 kg / 1 m³</b>
              </span>
              <span className="inline-flex items-center gap-1">
                • Pemakaian Kaporit: <b className="text-[#111111] font-semibold">1 kg / 1 m³</b> <span className="text-[#707784] font-normal">(Rasio 1:1)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Form Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Baris 1: Lokasi & Tanggal Pengecekan */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Building2 className="size-3.5 text-[#ff8a2a]" />
              Lokasi (Branch / Depo / Bulky) <span className="text-red-500">*</span>
            </label>
            <Input
              value={areaName}
              readOnly
              className="h-10 rounded-xl border-[#e5e5e5] bg-[#f9f9f9] text-xs font-medium text-[#4b5563]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Calendar className="size-3.5 text-[#ff8a2a]" />
              Tanggal Pengecekan <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] focus-visible:ring-[#ff8a2a]"
            />
          </div>

          {/* Baris 2: Kode Lokasi & Periode */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <MapPin className="size-3.5 text-[#ff8a2a]" />
              Kode Lokasi (Misal: JZ01)
            </label>
            <Input
              placeholder="Contoh: JZ01 / WH01"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Activity className="size-3.5 text-[#ff8a2a]" />
              Periode Inspeksi
            </label>
            <Input
              value={`Bulanan (${periodKey})`}
              readOnly
              className="h-10 rounded-xl border-[#e5e5e5] bg-[#f9f9f9] text-xs font-medium text-[#4b5563]"
            />
          </div>
        </div>

        {/* Baris 3: Catatan Umum Kondisi Water Recycle - 1 Baris Full */}
        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
            <FileText className="size-3.5 text-[#ff8a2a]" />
            Catatan Umum Kondisi Water Recycle
          </label>
          <Input
            placeholder="Kondisi umum kejernihan air, pompa, ketersediaan tawas/kaporit..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
          />
        </div>
      </div>

      {/* Sticky Progress & Search Bar */}
      <div className="sticky top-3 z-20 space-y-2.5 rounded-2xl border border-[#dedede] bg-white/95 p-4 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111111]">Kelengkapan Pemeriksaan:</span>
            <span className="font-medium text-[#707784]">
              {evaluatedCount} dari {totalItemsCount} item selesai
            </span>
            {damagedCount > 0 && (
              <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-700">
                {damagedCount} Nok
              </span>
            )}
          </div>
          <span className="font-bold text-[#ff8a2a]">{progressPercent}%</span>
        </div>

        {/* Progress Bar Line (Solid Orange) */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
          <div
            className="h-full bg-[#ff8a2a] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Full-width Instant Search Input */}
        <div className="relative pt-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#9ca3af]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari item pemeriksaan water recycle (misal: ruang filter, pompa, kaporit, pipa)..."
            className="h-10 w-full rounded-xl border-[#e5e5e5] bg-[#fafafa] pl-9 text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
          />
        </div>
      </div>

      {/* 3 Categories Section */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isOpen = Boolean(openCategories[category.id])
          const Icon = category.icon

          const categoryItems = category.items
          const categoryEvaluated = categoryItems.filter(
            (it) => items[it.id]?.condition
          ).length
          const isCategoryComplete =
            categoryItems.length > 0 && categoryEvaluated === categoryItems.length

          return (
            <div
              key={category.id}
              className="rounded-2xl border border-[#dedede] bg-white shadow-sm overflow-hidden transition-all"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="flex items-center justify-between p-4 cursor-pointer select-none bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors border-b border-[#f0f0f0]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff5eb] text-[#ff8a2a]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#111111]">{category.title}</h2>
                    <span className="text-[11px] text-[#707784]">
                      {categoryEvaluated} dari {categoryItems.length} item diperiksa
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      markCategoryAllGood(category.id)
                    }}
                    className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg"
                  >
                    Semua OK
                  </Button>

                  <div className="grid h-7 w-7 place-items-center rounded-lg text-[#707784]">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              {isOpen && (
                <div className="p-4 space-y-4 divide-y divide-[#f5f5f5]">
                  {categoryItems.map((item, idx) => {
                    const itemState = items[item.id] || {
                      photos: [],
                      notes: "",
                      uploading: false,
                    }
                    const isDamaged =
                      itemState.condition === "RUSAK" || itemState.condition === "REPAIR"

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl p-3 transition-colors",
                          idx > 0 && "pt-4",
                          isDamaged && "bg-red-50/20"
                        )}
                      >
                        {/* Item Label & Activity Pill */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#111111]">
                                {item.label}
                              </span>
                              <span className="rounded-md bg-[#f5f5f3] border border-[#e8e8e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#666c77]">
                                {item.activity}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#707784]">
                              Standar: <span className="text-[#374151] font-medium">{item.conditionDesc}</span>
                            </p>
                          </div>

                          {/* Evaluation Action Buttons - 1 solid clean row without wrapping */}
                          <div className="flex items-center gap-1.5 sm:shrink-0 w-full sm:w-auto">
                            {/* OK (V) */}
                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, {
                                  condition: "BAIK",
                                  actionTaken: "OK",
                                  photos: [],
                                  notes: item.isMeterInput ? itemState.notes : "",
                                  handler: undefined,
                                  repairForm: undefined,
                                })
                              }}
                              className={cn(
                                "flex-1 sm:flex-initial rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                itemState.condition === "BAIK" && itemState.actionTaken !== "Tes"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              OK (V)
                            </button>

                            {/* Item-specific shortcut: Kuras (for Cek/Kuras) */}
                            {item.activity === "Cek/Kuras" && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateItem(item.id, {
                                    condition: "CLEAN",
                                    actionTaken: "Kuras",
                                    handler: "BES",
                                    photos: [],
                                    notes: "Telah dilakukan pengurasan berkala",
                                    repairForm: undefined,
                                  })
                                }}
                                className={cn(
                                  "flex-1 sm:flex-initial rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                  itemState.condition === "CLEAN"
                                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
                                    : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                                )}
                              >
                                Kuras
                              </button>
                            )}

                            {/* Item-specific shortcut: Ganti (for Cek/Ganti) */}
                            {item.activity === "Cek/Ganti" && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateItem(item.id, {
                                    condition: "ADJUST_OR_ADD",
                                    actionTaken: "Ganti",
                                    handler: "BES",
                                    photos: [],
                                    notes: item.isChemical
                                      ? "Penambahan chemical tawas/kaporit pada keranjang"
                                      : "Penggantian material filter baru",
                                    repairForm: undefined,
                                  })
                                }}
                                className={cn(
                                  "flex-1 sm:flex-initial rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                  itemState.condition === "ADJUST_OR_ADD"
                                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-xs"
                                    : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                                )}
                              >
                                {item.isChemical ? "Tambah" : "Ganti"}
                              </button>
                            )}

                            {/* Item-specific shortcut: Tes (for Tes) */}
                            {item.activity === "Tes" && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateItem(item.id, {
                                    condition: "BAIK",
                                    actionTaken: "Tes",
                                    photos: [],
                                    notes: "Tes fungsi operasional normal dan responsif",
                                    handler: undefined,
                                    repairForm: undefined,
                                  })
                                }}
                                className={cn(
                                  "flex-1 sm:flex-initial rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                  itemState.condition === "BAIK" && itemState.actionTaken === "Tes"
                                    ? "border-purple-500 bg-purple-50 text-purple-700 shadow-xs"
                                    : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                                )}
                              >
                                Tes OK
                              </button>
                            )}

                            {/* Nok (X) */}
                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, {
                                  condition: "RUSAK",
                                  handler: itemState.handler || "BES",
                                  repairForm:
                                    itemState.repairForm || "SAT/FRM/TS/065_REV:00_161020",
                                  notes: itemState.notes || "Form Penggantian Spare Part (065)",
                                })
                              }}
                              className={cn(
                                "flex-1 sm:flex-initial rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                isDamaged
                                  ? "border-red-500 bg-red-50 text-red-600 shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Nok (X)
                            </button>
                          </div>
                        </div>

                        {/* Special Field for Meteran Air: Input Angka Meter (m³) */}
                        {item.isMeterInput && (
                          <div className="mt-2 rounded-xl border border-[#e8e8e6] bg-[#fafaf9] p-3">
                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#111111]">
                              <Gauge className="size-3.5 text-[#ff8a2a]" />
                              Angka Meteran Air Terbaca (m³) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="Contoh: 120 / 250 (angka m³)"
                              value={itemState.meterValue || ""}
                              onChange={(e) => {
                                const val = e.target.value
                                updateItem(item.id, {
                                  meterValue: val,
                                  condition: itemState.condition || "BAIK",
                                  notes: `Angka Meteran: ${val} m³`,
                                })
                              }}
                              className="h-10 rounded-xl border-[#dedede] bg-white text-xs font-semibold text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
                            />
                          </div>
                        )}

                        {/* Standardized Follow-up Section when Damaged (Nok / X) */}
                        {(isDamaged || itemState.photos.length > 0) && (
                          <div className="mt-5 border-t border-[#eeeeec] pt-4 flex flex-col gap-4">
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
                                    "flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
                                    itemState.handler === "BES"
                                      ? "bg-[#ff8a2a] text-white shadow"
                                      : "text-[#707784] hover:text-[#111111]"
                                  )}
                                >
                                  BES
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { handler: "EKSTERNAL" })}
                                  className={cn(
                                    "flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
                                    itemState.handler === "EKSTERNAL"
                                      ? "bg-[#ff8a2a] text-white shadow"
                                      : "text-[#707784] hover:text-[#111111]"
                                  )}
                                >
                                  Eksternal
                                </button>
                              </div>
                            </div>

                            {/* 2. Foto bukti */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-xs font-bold text-[#707784]">
                                Foto bukti <span className="text-red-500">*</span>
                              </p>
                              {itemState.photos.length === 0 ? (
                                <CameraCaptureButton
                                  disabled={itemState.uploading}
                                  uploading={itemState.uploading}
                                  watermarkLines={buildChecklistPhotoWatermarkLines({
                                    areaName: `${areaName} (Water Recycle)`,
                                    userLabel: watermarkUserLabel,
                                    userRole: watermarkUserRole,
                                  })}
                                  onCapture={(file) => void uploadPhoto(item.id, file)}
                                />
                              ) : null}

                              {itemState.photos.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {itemState.photos.map((photo) => (
                                    <div key={photo.fileId} className="relative group">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewPhoto({
                                            itemLabel: item.label,
                                            url: photo.url,
                                          })
                                        }
                                        className="group block overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111] text-left shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
                                      >
                                        <Image
                                          src={photo.url}
                                          alt={`Foto bukti ${item.label}`}
                                          width={80}
                                          height={80}
                                          className="size-20 object-cover"
                                          unoptimized
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removePhoto(item.id, photo.fileId)}
                                        className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white shadow transition-transform hover:scale-110 active:scale-95"
                                        title="Hapus foto"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <CameraCaptureButton
                                    disabled={itemState.uploading}
                                    uploading={itemState.uploading}
                                    watermarkLines={buildChecklistPhotoWatermarkLines({
                                      areaName: `${areaName} (Water Recycle)`,
                                      userLabel: watermarkUserLabel,
                                      userRole: watermarkUserRole,
                                    })}
                                    onCapture={(file) => void uploadPhoto(item.id, file)}
                                  />
                                </div>
                              ) : null}
                            </div>

                            {/* 3. TINDAK LANJUT */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                TINDAK LANJUT <span className="text-red-500">*</span>
                              </p>
                              <Select
                                value={itemState.repairForm || "SAT/FRM/TS/065_REV:00_161020"}
                                onValueChange={(val) =>
                                  updateItem(item.id, {
                                    repairForm: val || undefined,
                                    notes:
                                      itemState.notes.trim() ||
                                      (val === "SAT/FRM/TS/065_REV:00_161020"
                                        ? "Form Penggantian Spare Part (065)"
                                        : val === "SAT/FRM/TSM/014_REV:000_060423"
                                        ? "Form Estimasi Biaya ME (014)"
                                        : "Repair Tanpa Biaya"),
                                  })
                                }
                              >
                                <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#ff8a2a] focus:ring-offset-0">
                                  <span className={cn("flex-1 text-left truncate", !itemState.repairForm && "text-[#707784]")}>
                                    {itemState.repairForm
                                      ? FOLLOW_UP_OPTIONS.find((o) => o.id === itemState.repairForm)?.label || itemState.repairForm
                                      : "Pilih form tindak lanjut"}
                                  </span>
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
                                  {FOLLOW_UP_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.id}
                                      value={opt.id}
                                      className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 4. KETERANGAN */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                KETERANGAN <span className="text-red-500">*</span>
                              </p>
                              <textarea
                                value={itemState.notes}
                                onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                placeholder="Jelaskan kondisi kerusakan atau temuan water recycle secara detail..."
                                className="w-full min-h-[80px] rounded-xl border border-[#e8e8e6] bg-white p-3 text-[13px] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none placeholder:text-[#a0a5ad] focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 resize-y"
                              />
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

      {/* Bottom Submit Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="text-xs text-[#707784] text-center sm:text-left">
          {evaluatedCount === totalItemsCount ? (
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Check className="h-4 w-4" />
              Semua {totalItemsCount} item pemeriksaan water recycle telah terisi lengkap.
            </span>
          ) : (
            <span>
              Sisa <b>{totalItemsCount - evaluatedCount}</b> item yang belum diperiksa.
            </span>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#ff8a2a] hover:bg-[#e67519] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan Laporan...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Kirim Laporan Checklist Water Recycle
            </>
          )}
        </Button>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(undefined)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#f0f0f0]">
              <div className="text-sm font-bold text-[#0b1728]">{previewPhoto.itemLabel}</div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(undefined)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-[#7a7a7a]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-neutral-900 max-h-[75vh]">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.itemLabel}
                width={800}
                height={600}
                className="max-h-[70vh] w-auto object-contain rounded"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
