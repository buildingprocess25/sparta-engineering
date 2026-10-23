"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  FolderCheck,
  Gauge,
  Hash,
  Info,
  Loader2,
  MapPin,
  Search,
  Send,
  Trash2,
  Truck,
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
  FORKLIFT_MONTHLY_CATEGORIES,
  ALL_FORKLIFT_MONTHLY_ITEMS,
  FRM_TS_029_FORM_CODE,
  FRM_TS_029_NRA,
  FRM_TS_029_REF_NRA,
  type ForkliftMonthlyItem,
} from "@/lib/checklists/frm-ts-029"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs029FormProps = {
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
]

export const MONTH_LIST = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

export function FrmTs029Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_029_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs029FormProps) {
  const currentMonthIdx = React.useMemo(() => {
    const parts = periodKey.split("-")
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10)
      if (m >= 1 && m <= 12) return m - 1
    }
    return new Date().getMonth()
  }, [periodKey])

  const [unitNo, setUnitNo] = React.useState("")
  const [unitBrand, setUnitBrand] = React.useState("")
  const [hourMeter, setHourMeter] = React.useState("")
  const [generalNotes, setGeneralNotes] = React.useState("")

  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    ALL_FORKLIFT_MONTHLY_ITEMS.forEach((item) => {
      initial[item.id] = {
        condition: isRepairMode ? undefined : undefined,
        photos: [],
        notes: "",
        uploading: false,
      }
    })
    return initial
  })

  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    FORKLIFT_MONTHLY_CATEGORIES.forEach((cat, idx) => {
      state[cat.id] = idx === 0 || idx === 1
    })
    return state
  })

  const [searchQuery, setSearchQuery] = React.useState("")
  const [errors, setErrors] = React.useState<string[]>([])
  const [uploadNotice, setUploadNotice] = React.useState<{
    tone: "loading" | "success" | "error"
    message: string
  }>()
  const [previewPhoto, setPreviewPhoto] = React.useState<{ itemLabel: string; url: string }>()
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!uploadNotice || uploadNotice.tone === "loading") return
    const timer = window.setTimeout(() => setUploadNotice(undefined), 3200)
    return () => window.clearTimeout(timer)
  }, [uploadNotice])

  function toggleCategory(catId: string) {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  function setAllCategories(open: boolean) {
    const updated: Record<string, boolean> = {}
    FORKLIFT_MONTHLY_CATEGORIES.forEach((cat) => {
      updated[cat.id] = open
    })
    setOpenCategories(updated)
  }

  function updateItem(itemId: string, patch: Partial<ItemState>) {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...patch,
      },
    }))
  }

  function markCategoryAllGood(catId: string) {
    const category = FORKLIFT_MONTHLY_CATEGORIES.find((c) => c.id === catId)
    if (!category) return

    setItems((prev) => {
      const next = { ...prev }
      category.items.forEach((item) => {
        if (next[item.id]?.condition !== "RUSAK") {
          next[item.id] = {
            ...next[item.id],
            condition: "BAIK",
            photos: [],
            notes: next[item.id]?.notes || "",
            handler: undefined,
            repairForm: undefined,
          }
        }
      })
      return next
    })
  }

  async function uploadPhoto(itemId: string, file: File) {
    updateItem(itemId, { uploading: true })
    setUploadNotice({ tone: "loading", message: "Foto sedang diupload..." })
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

      setUploadNotice({ tone: "success", message: "Foto bukti berhasil disimpan." })
    } catch (err: unknown) {
      updateItem(itemId, { uploading: false })
      const msg = err instanceof Error ? err.message : "Gagal mengupload foto"
      setUploadNotice({ tone: "error", message: msg })
    }
  }

  function removePhoto(itemId: string, fileId: string) {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: (prev[itemId]?.photos || []).filter((p) => p.fileId !== fileId),
      },
    }))
  }

  // Progress metrics
  const totalCount = ALL_FORKLIFT_MONTHLY_ITEMS.length
  const evaluatedCount = ALL_FORKLIFT_MONTHLY_ITEMS.filter((item) =>
    Boolean(items[item.id]?.condition)
  ).length
  const damagedCount = ALL_FORKLIFT_MONTHLY_ITEMS.filter(
    (item) => items[item.id]?.condition === "RUSAK"
  ).length
  const progressPercentage = Math.round((evaluatedCount / totalCount) * 100)

  // Filtering
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredCategories = FORKLIFT_MONTHLY_CATEGORIES.map((cat) => {
    if (!normalizedQuery) return cat
    const matchingItems = cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.actionCode.toLowerCase().includes(normalizedQuery) ||
        item.actionName.toLowerCase().includes(normalizedQuery)
    )
    return { ...cat, items: matchingItems }
  }).filter((cat) => cat.items.length > 0)

  function buildPayload(): ChecklistPayload {
    return {
      formCode,
      formName: "Form Monthly Checklist Forklift",
      areaCode,
      period: "MONTHLY",
      periodKey,
      unitNo: unitNo.trim(),
      unitBrand: unitBrand.trim(),
      hourMeter: hourMeter.trim(),
      generalNotes: generalNotes.trim(),
      items: ALL_FORKLIFT_MONTHLY_ITEMS.map((item) => {
        const state = items[item.id]
        const condition = state?.condition || (isRepairMode ? "BAIK" : "TIDAK_ADA")

        // Sync hour meter note if present
        let itemNotes = state?.notes?.trim() || ""
        if (item.id === "fk_hour_meter_1" && hourMeter.trim()) {
          itemNotes = itemNotes ? `${hourMeter.trim()} (${itemNotes})` : hourMeter.trim()
        }

        return {
          id: item.id,
          label: item.label,
          actionCode: item.actionCode,
          condition: condition,
          photos: condition === "RUSAK" ? state?.photos || [] : (state?.photos || []),
          notes:
            itemNotes ||
            (condition === "RUSAK"
              ? "Form Penggantian Spare Part (065)"
              : ""),
          handler: state?.handler,
          repairForm: condition === "RUSAK" ? (state?.repairForm || "SAT/FRM/TS/065_REV:00_161020") : state?.repairForm,
          repairFormName:
            condition === "RUSAK" || state?.repairForm === "SAT/FRM/TS/065_REV:00_161020"
              ? "Form Penggantian Spare Part (065)"
              : undefined,
        }
      }),
    }
  }

  function handleSubmit() {
    setErrors([])

    // Validate Unit Identification
    if (!unitNo.trim()) {
      setErrors(["Nomor Unit / Serial wajib diisi (misal: FL-01 atau FD-25)."])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!isRepairMode && evaluatedCount < totalCount) {
      setErrors([
        `Seluruh item wajib dievaluasi (${evaluatedCount} dari ${totalCount} terisi). Silakan cek kembali kategori yang belum terisi.`,
      ])
      return
    }

    // Validate photos for damaged items
    const missingPhotos: string[] = []
    ALL_FORKLIFT_MONTHLY_ITEMS.forEach((item) => {
      const state = items[item.id]
      if (state?.condition === "RUSAK" && (!state.photos || state.photos.length === 0)) {
        missingPhotos.push(item.label)
      }
    })

    if (missingPhotos.length > 0) {
      setErrors([
        `Item rusak berikut wajib menyertakan foto bukti: ${missingPhotos.slice(0, 3).join(", ")}${
          missingPhotos.length > 3 ? ` (+${missingPhotos.length - 3} lainnya)` : ""
        }`,
      ])
      return
    }

    const payload = buildPayload()
    const validation = validateChecklistPayload(payload)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    startTransition(async () => {
      try {
        const result = await submitAction({
          reportCode,
          payload,
        })
        if (!result.ok) {
          setErrors(result.errors)
          return
        }

        const needsFollowUp = payload.items.some(
          (item) =>
            item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
            item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
        )

        window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat submit checklist"
        setErrors([msg])
      }
    })
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info Banner: Standard Alfamart Document Header */}
      <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-sm space-y-4">
        <div className="border-b border-dashed border-[#e6e6e6] pb-3">
          <h2 className="text-lg font-bold text-[#0b1728] tracking-tight">
            FORM MONTHLY CHECKLIST FORKLIFT
          </h2>
          <p className="text-xs text-[#707784] mt-0.5">
            Formulir inspeksi kelayakan fisik dan operasional bulanan unit forklift.
          </p>
        </div>

        {/* Baris 1: Lokasi & No. Unit / Serial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <MapPin className="size-3.5 text-[#ff8a2a]" />
              Lokasi <span className="text-red-500">*</span>
            </label>
            <div className="flex h-10 w-full items-center rounded-xl border border-[#e5e5e5] bg-[#f8f9fa] px-3 text-xs font-medium text-[#1f2937]">
              {areaName}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Hash className="size-3.5 text-[#ff8a2a]" />
              No. Unit / Serial <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: FL-01 / FD-25-09"
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>
        </div>

        {/* Baris 2: Merk Unit & Hour Meter 1 (Travel) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Building2 className="size-3.5 text-[#ff8a2a]" />
              Merk Unit
            </label>
            <Input
              placeholder="Contoh: Toyota / Nichiyu / TCM"
              value={unitBrand}
              onChange={(e) => setUnitBrand(e.target.value)}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
              <Gauge className="size-3.5 text-[#ff8a2a]" />
              Hour Meter 1 (Travel)
            </label>
            <Input
              placeholder="Misal: 1420.5 jam"
              value={hourMeter}
              onChange={(e) => {
                setHourMeter(e.target.value)
                if (items["fk_hour_meter_1"]) {
                  updateItem("fk_hour_meter_1", { condition: "BAIK", notes: e.target.value })
                }
              }}
              className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
            />
          </div>
        </div>

        {/* Baris 3: Catatan Umum Inspeksi (Full Width) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#374151]">
            <FileText className="size-3.5 text-[#ff8a2a]" />
            Catatan Umum Inspeksi
          </label>
          <Input
            placeholder="Catatan menyeluruh kondisi unit forklift..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="h-10 rounded-xl border-[#e5e5e5] bg-white text-xs text-[#111111] placeholder:text-[#9ca3af] focus-visible:ring-[#ff8a2a]"
          />
        </div>

        {/* Legend Information Box */}
        <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#6b7280]">
          <span className="font-bold text-[#111827]">Kode Tindakan:</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">In</strong> = Interview</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">Cl</strong> = Clean</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">W</strong> = Write</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">Td</strong> = Test Drive</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">A</strong> = Adjust</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">Ch</strong> = Check</span>
          <span className="inline-flex items-center gap-1"><strong className="text-[#0b1728] font-bold">L</strong> = Lubricant</span>
          <span className="ml-auto text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            V = OK / X = NOK
          </span>
        </div>
      </div>

      {/* Progress Card */}
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e3] text-[#c75f00]">
              <ClipboardCheck className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[#111111]">
                Checklist Item
              </h2>
              <p className="mt-0.5 text-sm text-[#686868]">
                {areaName} Monthly - {evaluatedCount} dari {totalCount} item dievaluasi
              </p>
            </div>
          </div>
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#f5f5f3] text-sm font-bold text-[#111111]">
            {progressPercentage}%
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#efefed]">
          <div
            className="h-full rounded-full bg-[#ff8a2a] transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </section>

      {/* Mode Checklist Wajib Info Card */}
      <section className="flex items-start gap-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff0e3] text-[#c75f00]">
          <Info className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-semibold text-[#111111]">
            {isRepairMode ? "Mode Temuan / Perbaikan" : "Mode Checklist Wajib"}
          </h3>
          <p className="mt-1 text-sm leading-5 text-[#686868]">
            {isRepairMode
              ? "Pilih minimal 1 item yang rusak. Kondisi rusak wajib menyertakan foto bukti."
              : "Pilih kondisi setiap item. Khusus item yang rusak wajib menyertakan foto sebagai bukti."}
          </p>
        </div>
      </section>

      {/* Search Input Underneath Progress Bar */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#707784] size-5"
          aria-hidden="true"
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kategori atau item checklist"
          className="h-14 rounded-2xl border-[#e3e3e3] bg-white pl-12 text-sm text-[#111111] shadow-[0_4px_14px_rgba(17,17,17,0.04)] placeholder:text-[#707784]"
        />
      </div>

      {/* Notifications */}
      {uploadNotice && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 transition-all",
            uploadNotice.tone === "loading" && "bg-blue-50 text-blue-800 border border-blue-200",
            uploadNotice.tone === "success" && "bg-emerald-50 text-emerald-800 border border-emerald-200",
            uploadNotice.tone === "error" && "bg-rose-50 text-rose-800 border border-rose-200"
          )}
        >
          {uploadNotice.tone === "loading" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          {uploadNotice.tone === "success" && <Check className="h-4 w-4 text-emerald-600" />}
          {uploadNotice.tone === "error" && <AlertCircle className="h-4 w-4 text-rose-600" />}
          {uploadNotice.message}
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-rose-900">
            <AlertCircle className="h-4 w-4" />
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

                          {/* Condition Selectors (Clean, structured, no messy wrapping) */}
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
                                })
                              }}
                              className={cn(
                                "rounded-xl border px-2.5 py-2 text-xs font-medium transition-all",
                                itemState.condition === "TIDAK_ADA"
                                  ? "border-[#111111] bg-[#111111] text-white font-bold shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Tidak Ada (T)
                            </button>
                          </div>
                        </div>

                        {/* Damage & Action Details Box (Consistent with shared-checklist-form & frm-ts-016) */}
                        {(isDamaged || itemState.condition === "REPAIR" || itemState.photos.length > 0) && (
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
                                    areaName: `${areaName} (Forklift)`,
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
                                      areaName: `${areaName} (Forklift)`,
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
                                        ? "Form Estimasi Biaya Sipil & ME (014)"
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
                                placeholder="Tambahkan keterangan atau jelaskan kondisi kerusakan secara detail..."
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

      {/* Floating Bottom Submit Bar */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-[#0b1728]">
            {evaluatedCount}/{totalCount} Komponen Terverifikasi
          </div>
          <div className="text-xs text-[#707070]">
            Pastikan seluruh data unit dan bukti pemeriksaan telah sesuai sebelum mengirim laporan.
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || (!isRepairMode && evaluatedCount < totalCount)}
          className="bg-[#ff8a2a] hover:bg-[#e67316] text-white font-bold px-6 h-11 text-sm shadow-sm transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim Laporan...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Form Monthly Forklift
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
              <img
                src={previewPhoto.url}
                alt={previewPhoto.itemLabel}
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
