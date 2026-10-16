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
  Droplet,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Paintbrush,
  PlayCircle,
  Power,
  Search,
  Send,
  Sparkles,
  Tag,
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
  TABLE_LIFTER_CATEGORIES,
  ALL_TABLE_LIFTER_ITEMS,
  FRM_TS_064_FORM_CODE,
  FRM_TS_064_NRA,
  FRM_TS_064_REF_NRA,
  type TableLifterItem,
} from "@/lib/checklists/frm-ts-064"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs064FormProps = {
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
    label: "Repair Tanpa Biaya (Internal BES)",
    badge: "Internal",
  },
] as const

const ACTION_LEGENDS = [
  { code: "Ch", name: "Check", desc: "Pemeriksaan visual & fisik", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { code: "Cl", name: "Clean", desc: "Pembersihan dari kotoran/debu", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { code: "L", name: "Lubricant", desc: "Pelumasan komponen gerak/bearing", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { code: "Tr", name: "Test Running", desc: "Uji fungsi operasional beban", color: "bg-purple-50 text-purple-700 border-purple-200" },
]

export function FrmTs064Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_064_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs064FormProps) {
  // Form header state
  const [unitNo, setUnitNo] = React.useState("")
  const [unitBrand, setUnitBrand] = React.useState("")
  const [inspectionDate, setInspectionDate] = React.useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Search & Collapsible states
  const [searchQuery, setSearchQuery] = React.useState("")
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    TABLE_LIFTER_CATEGORIES.forEach((cat) => {
      initial[cat.id] = true
    })
    return initial
  })

  // Items evaluation state
  const [items, setItems] = React.useState<Record<string, ItemState>>({})

  // Form submission & UI states
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [success, setSuccess] = React.useState(false)

  // Lightbox preview modal state
  const [previewPhoto, setPreviewPhoto] = React.useState<{
    itemLabel: string
    url: string
  } | null>(null)

  // Toggle Category open/close
  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  // Update single item state helper
  const updateItem = (itemId: string, updates: Partial<ItemState>) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {
          photos: [],
          notes: "",
          uploading: false,
        }),
        ...updates,
      },
    }))
  }

  // Mark all items in category as OK
  const markCategoryAllGood = (categoryId: string) => {
    const category = TABLE_LIFTER_CATEGORIES.find((c) => c.id === categoryId)
    if (!category) return

    setItems((prev) => {
      const next = { ...prev }
      category.items.forEach((item) => {
        next[item.id] = {
          ...(next[item.id] || { photos: [], notes: "", uploading: false }),
          condition: "BAIK",
          actionTaken: "OK",
          photos: [],
          notes: "",
          handler: undefined,
          repairForm: undefined,
        }
      })
      return next
    })
  }

  // Photo upload handler with server integration
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

  // Photo remove handler
  const removePhoto = (itemId: string, fileId: string) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: (prev[itemId]?.photos || []).filter((p) => p.fileId !== fileId),
      },
    }))
  }

  // Filtered categories & items based on real-time search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return TABLE_LIFTER_CATEGORIES

    const query = searchQuery.toLowerCase()
    return TABLE_LIFTER_CATEGORIES.map((cat) => {
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

  // Progress metrics calculation
  const totalItemsCount = ALL_TABLE_LIFTER_ITEMS.length
  const evaluatedCount = React.useMemo(() => {
    return ALL_TABLE_LIFTER_ITEMS.filter((item) => {
      const state = items[item.id]
      return Boolean(state?.condition)
    }).length
  }, [items])

  const damagedCount = React.useMemo(() => {
    return ALL_TABLE_LIFTER_ITEMS.filter((item) => {
      const state = items[item.id]
      return state?.condition === "RUSAK" || state?.condition === "REPAIR"
    }).length
  }, [items])

  const progressPercent = Math.round((evaluatedCount / totalItemsCount) * 100)

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate completeness if not in repair mode
    if (!isRepairMode && evaluatedCount < totalItemsCount) {
      const uncompleted = ALL_TABLE_LIFTER_ITEMS.filter((it) => !items[it.id]?.condition)
      setErrors([
        `Pemeriksaan belum lengkap (${evaluatedCount}/${totalItemsCount} item). Masih ada item yang belum dicek: ${uncompleted
          .slice(0, 3)
          .map((i) => i.label)
          .join(", ")}${uncompleted.length > 3 ? "..." : ""}`,
      ])
      return
    }

    // Validate damaged items must include at least 1 evidence photo
    const damagedWithoutPhoto = ALL_TABLE_LIFTER_ITEMS.filter((it) => {
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
      const payloadItems = ALL_TABLE_LIFTER_ITEMS.map((it) => {
        const state = items[it.id] || { photos: [], notes: "", uploading: false }
        const cond = (state.condition || "BAIK") as ChecklistCondition
        const isAction = ["RUSAK", "REPAIR", "CLEAN", "ADJUST_OR_ADD"].includes(cond)
        return {
          id: it.id,
          label: it.label,
          condition: cond,
          photos: state.photos || [],
          notes: state.notes || (state.actionTaken ? `Tindakan: ${state.actionTaken}` : isAction ? "Pemeriksaan rutin berkala" : undefined),
          handler: isAction ? (state.handler || "BES") : state.handler,
          repairForm: state.repairForm,
        }
      })

      const payload: ChecklistPayload = {
        formCode,
        formName: "Checklist Table Lifter Monthly",
        areaCode,
        period: "MONTHLY",
        periodKey,
        items: payloadItems,
        unitNo: unitNo.trim() || undefined,
        unitBrand: unitBrand.trim() || undefined,
        inspectionDate: inspectionDate || undefined,
        generalNotes: generalNotes.trim() || undefined,
      }

      const clientValidation = validateChecklistPayload(payload)
      if (!clientValidation.valid) {
        setErrors(clientValidation.errors)
        setSubmitting(false)
        return
      }

      const res = await submitAction({ reportCode, payload })
      if (!res.ok) {
        setErrors(res.errors)
        setSubmitting(false)
        return
      }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: "smooth" })

      setTimeout(() => {
        window.location.href = `/dashboard/reports`
      }, 1500)
    } catch (err: unknown) {
      setSubmitting(false)
      const msg = err instanceof Error ? err.message : "Gagal menyimpan laporan checklist"
      setErrors([msg])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* Success Notification Alert */}
      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500 text-white">
              <Check className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Checklist Berhasil Disimpan</h3>
              <p className="text-xs text-emerald-700">
                Laporan Table Lifter telah dicatat dan siap ditinjau. Mengalihkan...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errors.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-50/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-500 text-white">
              <AlertCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">Perhatian Diperlukan</h3>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-rose-700">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header Document & Identity Card */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#fff5eb] border border-[#ff8a2a]/20 px-2 py-0.5 text-[11px] font-bold text-[#ff8a2a]">
                {formCode}
              </span>
              <span className="rounded-md bg-[#f5f5f3] border border-[#e8e8e6] px-2 py-0.5 text-[11px] font-semibold text-[#707784]">
                BULANAN
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#111111]">
              Checklist Table Lifter Monthly
            </h1>
            <p className="text-xs text-[#707784]">
              NRA: <span className="font-semibold text-[#374151]">{FRM_TS_064_NRA}</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#f0f0f0] bg-[#fafafa] p-3 text-right sm:min-w-[200px]">
            <span className="text-[10px] font-bold tracking-wider text-[#9ca3af] uppercase">
              Area / Lokasi
            </span>
            <p className="text-xs font-bold text-[#111111] truncate">{areaName}</p>
            <span className="text-[11px] text-[#707784] font-medium">{periodKey}</span>
          </div>
        </div>

        {/* Action Codes Legend - Industrial Clean Style */}
        <div className="rounded-xl border border-[#dedede] bg-[#fafafa] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
              Keterangan Tindakan (Action Code):
            </span>
            <span className="text-[10px] font-medium text-[#707784]">
              Ref: {FRM_TS_064_REF_NRA.split(" ")[0]}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ACTION_LEGENDS.map((leg) => (
              <div
                key={leg.code}
                className={cn(
                  "rounded-lg border p-2 flex items-center gap-2",
                  leg.color
                )}
              >
                <span className="font-black text-xs px-1.5 py-0.5 rounded bg-white/80 shadow-2xs">
                  {leg.code}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate leading-tight">{leg.name}</p>
                  <p className="text-[9px] opacity-80 truncate leading-tight">{leg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Identity & Inspection Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111111]">
              Nomor Unit / Serial Lifter
            </label>
            <Input
              placeholder="Contoh: TL-01 / SN-2024-X"
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111111]">
              Merk / Brand Table Lifter
            </label>
            <Input
              placeholder="Contoh: Bishamon / Nanshin / Krisbow"
              value={unitBrand}
              onChange={(e) => setUnitBrand(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111111]">
              Tanggal Pemeriksaan
            </label>
            <Input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs font-medium text-[#111111] focus-visible:ring-[#ff8a2a]"
            />
          </div>
        </div>

        {/* General Notes for Unit */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111111]">
            Catatan Umum Pemeriksaan Table Lifter
          </label>
          <Input
            placeholder="Kondisi umum hidrolik, kebocoran oli, kebersihan pantograph, kestabilan meja saat beban..."
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

        {/* Instant Search Input */}
        <div className="relative pt-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#9ca3af]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari item pemeriksaan table lifter (misal: pantograph, bearing, oli hidrolik, hose, panel)..."
            className="h-10 w-full rounded-xl border-[#e5e5e5] bg-[#fafafa] pl-9 text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
          />
        </div>
      </div>

      {/* 6 Categories Section */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const isOpen = Boolean(openCategories[category.id])
          const Icon = category.icon

          const categoryItems = category.items
          const categoryEvaluated = categoryItems.filter(
            (it) => items[it.id]?.condition
          ).length

          return (
            <div
              key={category.id}
              className="rounded-2xl border border-[#dedede] bg-white shadow-xs overflow-hidden transition-all"
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
                        {/* Item Label & Action Code Pill */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#111111]">
                                {item.label}
                              </span>
                              <span className="rounded-md bg-[#fff5eb] border border-[#ff8a2a]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#c2410c]">
                                {item.actionCode}
                              </span>
                              <span className="text-[10px] text-[#707784] font-medium">
                                ({item.actionName})
                              </span>
                            </div>
                            <p className="text-[11px] text-[#707784]">
                              Standar Tindakan:{" "}
                              <span className="text-[#374151] font-semibold">
                                {item.actionCode === "Ch&Cl"
                                  ? "Pengecekan kondisi & Pembersihan menyeluruh"
                                  : item.actionCode === "Ch&L"
                                  ? "Pengecekan fisik & Pelumasan gemuk/lubricant"
                                  : item.actionCode === "Tr"
                                  ? "Uji fungsional naik-turun dengan beban operasional"
                                  : "Pemeriksaan visual & kekencangan/kondisi normal"}
                              </span>
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
                                  notes: "",
                                  handler: undefined,
                                  repairForm: undefined,
                                })
                              }}
                              className={cn(
                                "flex-1 sm:flex-initial rounded-xl border px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                itemState.condition === "BAIK"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              OK (V)
                            </button>

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
                                "flex-1 sm:flex-initial rounded-xl border px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap text-center",
                                isDamaged
                                  ? "border-red-500 bg-red-50 text-red-600 shadow-2xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Nok (X)
                            </button>
                          </div>
                        </div>

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
                                    areaName: `${areaName} (Table Lifter${unitNo ? ` - ${unitNo}` : ""})`,
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
                                      areaName: `${areaName} (Table Lifter${unitNo ? ` - ${unitNo}` : ""})`,
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
                                placeholder="Jelaskan kondisi kerusakan pada komponen table lifter secara rinci..."
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

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#dedede] bg-white/95 p-4 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="text-xs">
            <span className="font-semibold text-[#707784]">Status Pemeriksaan: </span>
            <span className="font-bold text-[#111111]">
              {evaluatedCount} / {totalItemsCount} item selesai
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={submitting || (!isRepairMode && evaluatedCount < totalItemsCount)}
              className="h-11 rounded-xl bg-[#ff8a2a] px-6 text-xs font-bold text-white shadow-md hover:bg-[#e0751e] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Kirim Laporan Checklist
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f0f0f0] p-4">
              <h3 className="text-xs font-bold text-[#111111]">{previewPhoto.itemLabel}</h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="grid size-7 place-items-center rounded-lg text-[#707784] hover:bg-[#f5f5f5]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative max-h-[75vh] min-h-[250px] w-full overflow-auto bg-black p-2 flex items-center justify-center">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.itemLabel}
                width={800}
                height={600}
                className="max-h-[70vh] w-auto object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
