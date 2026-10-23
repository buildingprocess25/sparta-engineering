"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Gauge,
  Info,
  Loader2,
  MapPin,
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
  GENSET_CATEGORIES,
  GENSET_ALL_ITEMS,
  GENSET_FOLLOW_UP_CODES,
  FRM_TS_022_FORM_CODE,
  FRM_TS_022_NRA,
  FRM_TS_022_REF_NRA,
  type GensetChecklistItem,
} from "@/lib/checklists/frm-ts-022"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs022FormProps = {
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
  followUpCode?: string
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
]

export function FrmTs022Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_022_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs022FormProps) {
  // Metadata States
  const [unitBrand, setUnitBrand] = React.useState("")
  const [unitModel, setUnitModel] = React.useState("")
  const [capacityKva, setCapacityKva] = React.useState("")
  const [inspectionDate, setInspectionDate] = React.useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("")

  // Category collapse state: default open first 2 categories
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    GENSET_CATEGORIES.forEach((cat, idx) => {
      initial[cat.id] = idx < 2
    })
    return initial
  })

  // Items State
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    GENSET_ALL_ITEMS.forEach((it) => {
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

  // Quick Action: Mark all items in category as BAIK
  const markCategoryAllGood = (categoryId: string) => {
    const cat = GENSET_CATEGORIES.find((c) => c.id === categoryId)
    if (!cat) return

    setItems((prev) => {
      const next = { ...prev }
      cat.items.forEach((item) => {
        next[item.id] = {
          ...(next[item.id] || { photos: [], notes: "", uploading: false }),
          condition: "BAIK",
          photos: [],
          notes: "",
          handler: undefined,
          repairForm: undefined,
          followUpCode: undefined,
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
    if (!searchQuery.trim()) return GENSET_CATEGORIES

    const query = searchQuery.toLowerCase()
    return GENSET_CATEGORIES.map((cat) => {
      const matchedItems = cat.items.filter(
        (it) =>
          it.label.toLowerCase().includes(query) ||
          it.actionCode.toLowerCase().includes(query) ||
          it.actionName.toLowerCase().includes(query) ||
          cat.title.toLowerCase().includes(query)
      )
      return {
        ...cat,
        items: matchedItems,
      }
    }).filter((cat) => cat.items.length > 0)
  }, [searchQuery])

  // Progress metrics
  const totalItemsCount = GENSET_ALL_ITEMS.length
  const evaluatedCount = React.useMemo(() => {
    return Object.values(items).filter((it) => Boolean(it.condition)).length
  }, [items])
  const damagedCount = React.useMemo(() => {
    return Object.values(items).filter((it) => it.condition === "RUSAK").length
  }, [items])
  const progressPercent = Math.round((evaluatedCount / (totalItemsCount || 1)) * 100)

  // Form Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate metadata
    const validationErrors: string[] = []
    if (!unitBrand.trim()) {
      validationErrors.push("Merk Genset wajib diisi.")
    }
    if (!inspectionDate.trim()) {
      validationErrors.push("Tanggal Pengecekan wajib diisi.")
    }

    // Build payload items
    const payloadItems = GENSET_ALL_ITEMS.map((cfg) => {
      const it = items[cfg.id]
      const condition: ChecklistCondition = it?.condition || "BAIK"
      return {
        id: cfg.id,
        label: cfg.label,
        condition,
        photos: it?.photos || [],
        notes: it?.notes || undefined,
        handler: it?.handler || undefined,
        repairForm: it?.repairForm || undefined,
        repairFormName: it?.repairForm
          ? FOLLOW_UP_OPTIONS.find((f) => f.id === it.repairForm)?.label
          : undefined,
        followUpCode: it?.followUpCode || undefined,
      }
    })

    const payload: ChecklistPayload = {
      formCode,
      formName: "Checklist Genset",
      areaCode,
      period: "MONTHLY",
      periodKey,
      items: payloadItems,
      unitBrand: unitBrand.trim(),
      unitModel: unitModel.trim() || undefined,
      capacityKva: capacityKva.trim() || undefined,
      inspectionDate: inspectionDate.trim(),
      generalNotes: generalNotes.trim() || undefined,
    }

    const valResult = validateChecklistPayload(payload)
    if (!valResult.valid) {
      validationErrors.push(...valResult.errors)
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      setSubmitting(true)
      const res = await submitAction({ reportCode, payload })
      if (!res.ok) {
        setErrors(res.errors || ["Terjadi kesalahan saat menyimpan formulir."])
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setSubmitSuccess(true)
        const needsFollowUp = payload.items.some(
          (item) =>
            item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
            item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
        )

        window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
      }
    } catch (err) {
      setErrors([
        err instanceof Error
          ? err.message
          : "Gagal mengirim formulir checklist genset.",
      ])
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Official Header Card */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f0f0] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ff8a2a]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff8a2a]">
              <Zap className="h-3.5 w-3.5" />
              FORM CHECKLIST GENSET
            </div>
            <p className="text-xs text-[#707784] mt-1 font-mono">
              {FRM_TS_022_NRA}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-medium text-[#707784]">
              Standar Operasional:
            </span>
            <p className="text-[11px] font-semibold text-[#111111]">
              SOP/TS/011 Monitoring Perawatan Equipment
            </p>
          </div>
        </div>

        {/* Baris 1: Branch / Area & Tanggal Pengecekan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <MapPin className="size-3.5 text-[#ff8a2a]" />
              Branch / Area <span className="text-red-500">*</span>
            </label>
            <div className="flex h-10 w-full items-center rounded-xl border border-[#e5e5e5] bg-[#f8f9fa] px-3 text-xs font-medium text-[#1f2937]">
              {areaName}
            </div>
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
        </div>

        {/* Baris 2: Merk Genset & Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Building2 className="size-3.5 text-[#ff8a2a]" />
              Merk Genset <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Cummins / Perkins / Yanmar / CAT"
              value={unitBrand}
              onChange={(e) => setUnitBrand(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Wrench className="size-3.5 text-[#ff8a2a]" />
              Model Genset
            </label>
            <Input
              placeholder="Contoh: Silent Type / Open Type"
              value={unitModel}
              onChange={(e) => setUnitModel(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>
        </div>

        {/* Baris 3: Kapasitas (kVa) - 1 Baris Full */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
            <Gauge className="size-3.5 text-[#ff8a2a]" />
            Kapasitas (kVa)
          </label>
          <Input
            placeholder="Contoh: 150 kVa / 250 kVa"
            value={capacityKva}
            onChange={(e) => setCapacityKva(e.target.value)}
            className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
          />
        </div>

        {/* Baris 4: Catatan Umum Kondisi Genset - 1 Baris Full */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
            <FileText className="size-3.5 text-[#ff8a2a]" />
            Catatan Umum Kondisi Genset
          </label>
          <Input
            placeholder="Catatan kondisi keseluruhan mesin, getaran, atau operasional..."
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
                {damagedCount} Rusak
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

        {/* Search Control (Clean, Full Width) */}
        <div className="relative w-full pt-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#9ca3af]" />
          <Input
            placeholder="Cari item pemeriksaan, oli, filter, baterai, aki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 pr-14 text-xs rounded-xl border-[#e5e5e5] bg-white focus-visible:ring-[#ff8a2a]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-[#9ca3af] hover:text-[#111111] font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Alert Box */}
      {errors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Terdapat data yang belum lengkap:
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 12 Categories List */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isOpen = openCategories[category.id] ?? false
          const catEvaluated = category.items.filter((item) => Boolean(items[item.id]?.condition)).length
          const catDamaged = category.items.filter((item) => items[item.id]?.condition === "RUSAK").length
          const isComplete = catEvaluated === category.items.length
          const IconComp = category.icon || Wrench

          return (
            <div
              key={category.id}
              className={cn(
                "rounded-2xl border transition-all overflow-hidden bg-white shadow-sm",
                isOpen ? "border-[#ff8a2a]/40 ring-1 ring-[#ff8a2a]/20" : "border-[#dedede]"
              )}
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 select-none transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      isComplete
                        ? catDamaged > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                        : "bg-[#0b1728]/5 text-[#0b1728]"
                    )}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b1728]">{category.title}</h3>
                    <div className="text-[11px] text-[#7a7a7a]">
                      {catEvaluated}/{category.items.length} item diperiksa
                      {catDamaged > 0 && (
                        <span className="ml-2 font-semibold text-rose-600">
                          ({catDamaged} Rusak)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isRepairMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        markCategoryAllGood(category.id)
                      }}
                      className="text-[11px] h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Set Semua Baik
                    </Button>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#8c8c8c]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#8c8c8c]" />
                  )}
                </div>
              </div>

              {/* Category Items Body */}
              {isOpen && (
                <div className="border-t border-[#f0f0f0] p-3.5 space-y-3 bg-[#fafafa]/50">
                  {category.items.map((item) => {
                    const itemState = items[item.id] || { photos: [], notes: "", uploading: false }
                    const isDamaged = itemState.condition === "RUSAK"

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#e6e2de] bg-white p-3.5 transition-all shadow-[0_2px_8px_rgba(17,17,17,0.02)]"
                      >
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded-md bg-[#fff0e3] px-2 py-0.5 text-[11px] font-bold text-[#c75f00]"
                                title={item.actionName}
                              >
                                {item.actionCode}
                              </span>
                              <span className="text-xs font-semibold text-[#111111]">
                                {item.label}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#707784]">
                              Tindakan: <span className="font-medium text-[#111111]">{item.actionName}</span>
                            </p>
                          </div>

                          {/* Segmented condition options (clean, single row) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, {
                                  condition: "BAIK",
                                  photos: [],
                                  notes: "",
                                  handler: undefined,
                                  repairForm: undefined,
                                  followUpCode: undefined,
                                })
                              }}
                              className={cn(
                                "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none",
                                itemState.condition === "BAIK"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Baik (V)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, {
                                  condition: "RUSAK",
                                  handler: itemState.handler || "BES",
                                  followUpCode: itemState.followUpCode || "R",
                                  repairForm:
                                    itemState.repairForm || "SAT/FRM/TS/065_REV:00_161020",
                                  notes: itemState.notes || "Form Penggantian Spare Part (065)",
                                })
                              }}
                              className={cn(
                                "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none",
                                isDamaged
                                  ? "border-red-500 bg-red-50 text-red-600 shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Rusak (X)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateItem(item.id, {
                                  condition: "TIDAK_ADA",
                                  photos: [],
                                  notes: "",
                                  handler: undefined,
                                  repairForm: undefined,
                                  followUpCode: undefined,
                                })
                              }}
                              className={cn(
                                "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none",
                                itemState.condition === "TIDAK_ADA"
                                  ? "border-[#111111] bg-[#111111] text-white shadow-xs font-bold"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Tidak Ada (T)
                            </button>
                          </div>
                        </div>

                        {/* Follow-up Section when Damaged (Rusak) or has photos */}
                        {(isDamaged || itemState.photos.length > 0) && (
                          <div className="mt-5 border-t border-[#eeeeec] pt-4 flex flex-col gap-4">
                            {/* 1. KODE TINDAK LANJUT (SOP TS/011) */}
                            <div>
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                KODE TINDAK LANJUT (SOP TS/011) <span className="text-red-500">*</span>
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {GENSET_FOLLOW_UP_CODES.map((fcode) => (
                                  <button
                                    key={fcode.code}
                                    type="button"
                                    onClick={() => updateItem(item.id, { followUpCode: fcode.code })}
                                    className={cn(
                                      "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all",
                                      itemState.followUpCode === fcode.code
                                        ? "border-[#ff8a2a] bg-[#fff5eb] text-[#c2410c] ring-1 ring-[#ff8a2a]"
                                        : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                                    )}
                                  >
                                    {fcode.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 2. AKAN DIHANDLE */}
                            <div className="border-t border-[#eeeeec] pt-4">
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

                            {/* 3. FOTO BUKTI */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-xs font-bold text-[#707784]">
                                Foto bukti <span className="text-red-500">*</span>
                              </p>
                              {itemState.photos.length === 0 ? (
                                <CameraCaptureButton
                                  disabled={itemState.uploading}
                                  uploading={itemState.uploading}
                                  watermarkLines={buildChecklistPhotoWatermarkLines({
                                    areaName: `${areaName} (Genset)`,
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
                                      areaName: `${areaName} (Genset)`,
                                      userLabel: watermarkUserLabel,
                                      userRole: watermarkUserRole,
                                    })}
                                    onCapture={(file) => void uploadPhoto(item.id, file)}
                                  />
                                </div>
                              ) : null}
                            </div>

                            {/* 4. TINDAK LANJUT */}
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

                            {/* 5. KETERANGAN / CATATAN KERUSAKAN */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                KETERANGAN <span className="text-red-500">*</span>
                              </p>
                              <textarea
                                value={itemState.notes}
                                onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                placeholder="Jelaskan kondisi kerusakan genset atau catatan temuan secara detail..."
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
              Semua {totalItemsCount} item pemeriksaan telah terisi lengkap.
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
              Menyimpan Laporan Genset...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Kirim Laporan Checklist Genset
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
