"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FolderCheck,
  Info,
  Loader2,
  Search,
  Send,
  Trash2,
  Truck,
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
  PALLET_MOVER_CATEGORIES,
  ALL_PALLET_MOVER_ITEMS,
  FRM_TS_016_FORM_CODE,
  FRM_TS_016_NRA,
  type PalletMoverItem,
} from "@/lib/checklists/frm-ts-016"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs016FormProps = {
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
    label: "Form Estimasi Biaya ME (014)",
    badge: "014",
  },
  {
    id: "REPAIR_TANPA_BIAYA",
    label: "Repair Tanpa Biaya (Internal)",
    badge: "Internal",
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

export function FrmTs016Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_016_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs016FormProps) {
  // Parse month index from periodKey (e.g. "2026-09" -> month index 8 = Sep)
  const currentMonthIdx = React.useMemo(() => {
    const parts = periodKey.split("-")
    if (parts.length >= 2) {
      const parsedMonth = parseInt(parts[1], 10)
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        return parsedMonth - 1
      }
    }
    return new Date().getMonth()
  }, [periodKey])

  const activeMonthLabel = MONTH_LIST[currentMonthIdx] || "Jan"

  // Equipment Identity
  const [unitNo, setUnitNo] = React.useState("")
  const [unitBrand, setUnitBrand] = React.useState("")
  const [hourMeter, setHourMeter] = React.useState("")
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Item states
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    for (const item of ALL_PALLET_MOVER_ITEMS) {
      initial[item.id] = {
        condition: undefined,
        photos: [],
        notes: "",
        handler: undefined,
        repairForm: undefined,
        uploading: false,
      }
    }
    return initial
  })

  // UI accordion state: which categories are open
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    PALLET_MOVER_CATEGORIES.forEach((cat, index) => {
      // Open first 3 categories by default
      initial[cat.id] = index < 3
    })
    return initial
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
    PALLET_MOVER_CATEGORIES.forEach((cat) => {
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
    const category = PALLET_MOVER_CATEGORIES.find((c) => c.id === catId)
    if (!category) return

    setItems((prev) => {
      const next = { ...prev }
      category.items.forEach((item) => {
        // Only mark BAIK if not already RUSAK
        if (next[item.id]?.condition !== "RUSAK") {
          next[item.id] = {
            ...next[item.id],
            condition: "BAIK",
            photos: [],
            notes: "",
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
      setUploadNotice({ tone: "success", message: "Upload foto berhasil tersimpan." })
    } catch (err) {
      updateItem(itemId, { uploading: false })
      setUploadNotice({ tone: "error", message: "Upload foto gagal." })
      setErrors([err instanceof Error ? err.message : "Upload foto gagal."])
    }
  }

  function deletePhoto(itemId: string, fileId: string) {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: (prev[itemId]?.photos || []).filter((p) => p.fileId !== fileId),
      },
    }))
  }

  // Progress metrics
  const totalCount = ALL_PALLET_MOVER_ITEMS.length
  const evaluatedCount = ALL_PALLET_MOVER_ITEMS.filter((item) =>
    Boolean(items[item.id]?.condition)
  ).length
  const damagedCount = ALL_PALLET_MOVER_ITEMS.filter(
    (item) => items[item.id]?.condition === "RUSAK"
  ).length
  const progressPercentage = Math.round((evaluatedCount / totalCount) * 100)

  // Filtering
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredCategories = PALLET_MOVER_CATEGORIES.map((cat) => {
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
      formName: "Form Monthly Checklist Pallet Mover",
      areaCode,
      period: "MONTHLY",
      periodKey,
      unitNo: unitNo.trim(),
      unitBrand: unitBrand.trim(),
      hourMeter: hourMeter.trim(),
      generalNotes: generalNotes.trim(),
      items: ALL_PALLET_MOVER_ITEMS.map((item) => {
        const state = items[item.id]
        const condition = state?.condition || (isRepairMode ? "BAIK" : "TIDAK_ADA")

        return {
          id: item.id,
          label: item.label,
          condition: condition,
          photos: condition === "RUSAK" ? state?.photos || [] : [],
          notes:
            state?.notes?.trim() ||
            (condition === "RUSAK"
              ? state?.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
                ? "Form Estimasi Biaya Sipil & ME (014)"
                : state?.repairForm === "REPAIR_TANPA_BIAYA"
                ? "Repair Tanpa Biaya"
                : "Form Penggantian Spare Part (065)"
              : ""),
          handler: state?.handler,
          repairForm: state?.repairForm === "REPAIR_TANPA_BIAYA" ? undefined : state?.repairForm,
          repairFormName:
            state?.repairForm === "SAT/FRM/TS/065_REV:00_161020"
              ? "Form Penggantian Spare Part (065)"
              : state?.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
              ? "Form Estimasi Biaya ME (014)"
              : state?.repairForm === "REPAIR_TANPA_BIAYA"
              ? "Repair Tanpa Biaya"
              : undefined,
        }
      }),
    }
  }

  function handleSubmit() {
    setErrors([])

    // Validate Unit Identification
    if (!unitNo.trim()) {
      setErrors(["Nomor Unit / Serial wajib diisi (misal: PM-01)."])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!isRepairMode && evaluatedCount < totalCount) {
      setErrors([
        `Seluruh item wajib dievaluasi (${evaluatedCount} dari ${totalCount} terisi). Silakan cek kembali kategori yang belum terisi.`,
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
        const result = await submitAction({ reportCode, payload })
        if (!result.ok) {
          setErrors(result.errors)
          return
        }

        const needsFollowUp = payload.items.some(
          (item) =>
            item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
            item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
        )

        if (needsFollowUp) {
          window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
        } else {
          window.location.assign("/dashboard/reports")
        }
      } catch (err) {
        setErrors([err instanceof Error ? err.message : "Terjadi kesalahan saat submit."])
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Upload Notification Toast */}
      {uploadNotice ? (
        <div
          className={cn(
            "fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.16)]",
            uploadNotice.tone === "loading" && "border-[#dedede] text-[#111111]",
            uploadNotice.tone === "success" && "border-[#c9ead2] bg-[#f0fbf3] text-[#1f6b35]",
            uploadNotice.tone === "error" && "border-[#ffc9a3] bg-[#fff4ec] text-[#8a3d00]"
          )}
          role="status"
        >
          {uploadNotice.tone === "loading" ? (
            <Loader2 className="size-4 animate-spin text-[#ff8a2a]" />
          ) : uploadNotice.tone === "success" ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <X className="size-4 text-rose-600" />
          )}
          <span>{uploadNotice.message}</span>
        </div>
      ) : null}

      {/* TOP CARD: Unit & Equipment Identification */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
            <Truck className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111111] sm:text-lg">
              Identitas Unit Pallet Mover
            </h2>
            <p className="text-xs text-[#707784]">
              {areaName} • {FRM_TS_016_NRA}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* No. Unit / Serial */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              No. Unit / Serial <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="Contoh: PM-01 atau SN-9982"
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          {/* Merk Unit */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Merk Unit
            </label>
            <Input
              placeholder="Contoh: Jungheinrich / BT / Linde"
              value={unitBrand}
              onChange={(e) => setUnitBrand(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          {/* Hour Meter (travel) */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Hour Meter (travel)
            </label>
            <Input
              placeholder="Contoh: 1250.5 Jam"
              value={hourMeter}
              onChange={(e) => setHourMeter(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>
        </div>

        {/* Kolom Bulan Jan s/d Des sesuai format Excel */}
        <div className="mt-4 border-t border-[#f0eee9] pt-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#111111]">
              Kolom Periode Inspeksi (Januari - Desember)
            </span>
            <span className="rounded-md bg-[#fff0e3] border border-[#ffc9a3] px-2 py-0.5 text-[11px] font-bold text-[#c75f00]">
              Bulan Ini: {activeMonthLabel} ({periodKey})
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {MONTH_LIST.map((m, idx) => {
              const isCurrent = idx === currentMonthIdx
              return (
                <div
                  key={m}
                  className={cn(
                    "flex items-center justify-center rounded-lg border py-2 px-1 text-center transition-all",
                    isCurrent
                      ? "border-[#ff8a2a] bg-[#fff0e3] text-[#c75f00] font-bold shadow-sm ring-1 ring-[#ff8a2a]"
                      : "border-[#e6e2de] bg-[#fbfbfa] text-[#8a8a8a] opacity-60"
                  )}
                >
                  <span className="text-xs font-semibold">{m}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Progress & Summary Bar */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff0e3] text-[#ff8a2a]">
              <ClipboardCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-[#111111]">
                Inspeksi Bulanan Pallet Mover
              </h3>
              <p className="mt-0.5 text-xs text-[#707784]">
                {evaluatedCount} dari {totalCount} item diperiksa •{" "}
                <span className={damagedCount > 0 ? "font-bold text-rose-600" : "text-emerald-600"}>
                  {damagedCount} rusak
                </span>
              </p>
            </div>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#fbfbfa] border border-[#e6e2de] text-sm font-bold text-[#111111]">
            {progressPercentage}%
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0eee9]">
          <div
            className="h-full rounded-full bg-[#ff8a2a] transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#707784]" />
            <Input
              placeholder="Cari komponen inspeksi (contoh: brake, roda, hidrolik)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs border-[#e6e2de] bg-[#fbfbfa]"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setAllCategories(true)}
              className="rounded-lg border border-[#e6e2de] px-2.5 py-1.5 text-xs font-medium text-[#707784] hover:bg-[#f5f5f3]"
            >
              Buka Semua
            </button>
            <button
              type="button"
              onClick={() => setAllCategories(false)}
              className="rounded-lg border border-[#e6e2de] px-2.5 py-1.5 text-xs font-medium text-[#707784] hover:bg-[#f5f5f3]"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </section>

      {/* Legend / Petunjuk Cara Tindakan */}
      <section className="rounded-xl border border-[#f0eee9] bg-[#fbfbfa] p-3 text-xs text-[#707784]">
        <span className="font-bold text-[#111111]">Petunjuk Cara Tindakan: </span>
        <span className="inline-block mx-1 font-semibold text-[#111111]">In</span>=Interview •
        <span className="inline-block mx-1 font-semibold text-[#111111]">W</span>=Write •
        <span className="inline-block mx-1 font-semibold text-[#111111]">Ch</span>=Check •
        <span className="inline-block mx-1 font-semibold text-[#111111]">A</span>=Adjust •
        <span className="inline-block mx-1 font-semibold text-[#111111]">Cl</span>=Clean •
        <span className="inline-block mx-1 font-semibold text-[#111111]">L</span>=Lubricant •
        <span className="inline-block mx-1 font-semibold text-[#111111]">Td</span>=Test drive
      </section>

      {/* Error Messages */}
      {errors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="size-4 shrink-0" />
            <span>Mohon lengkapi data berikut sebelum submit:</span>
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 12 CATEGORY ACCORDIONS */}
      <div className="flex flex-col gap-3.5">
        {filteredCategories.map((category) => {
          const isOpen = openCategories[category.id] ?? false
          const catTotal = category.items.length
          const catEvaluated = category.items.filter((item) =>
            Boolean(items[item.id]?.condition)
          ).length
          const catDamaged = category.items.filter(
            (item) => items[item.id]?.condition === "RUSAK"
          ).length
          const isComplete = catEvaluated === catTotal
          const Icon = category.icon

          return (
            <div
              key={category.id}
              className={cn(
                "overflow-hidden rounded-2xl border transition-all",
                isComplete
                  ? "border-[#e6e2de] bg-white shadow-sm"
                  : "border-[#e6e2de] bg-white shadow-sm"
              )}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-[#111111]">
                      {category.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-[#707784]">
                      {catEvaluated}/{catTotal} terisi
                      {catDamaged > 0 ? (
                        <span className="ml-1.5 font-bold text-rose-600">
                          ({catDamaged} Rusak)
                        </span>
                      ) : isComplete ? (
                        <span className="ml-1.5 font-medium text-emerald-600">
                          (Semua OK)
                        </span>
                      ) : null}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      markCategoryAllGood(category.id)
                    }}
                    className="hidden rounded-lg border border-[#ff8a2a]/30 bg-[#fff0e3] px-2.5 py-1 text-xs font-semibold text-[#c75f00] transition-colors hover:bg-[#ffe3cc] sm:inline-flex"
                  >
                    Tandai Semua Baik
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="grid size-8 place-items-center rounded-lg text-[#707784] hover:bg-[#f5f5f3]"
                  >
                    {isOpen ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Items List (when opened) */}
              {isOpen ? (
                <div className="border-t border-[#f0eee9] bg-[#fafaf9] p-3 space-y-3 sm:p-4">
                  {/* Mobile Quick Action button */}
                  <div className="flex justify-end sm:hidden">
                    <button
                      type="button"
                      onClick={() => markCategoryAllGood(category.id)}
                      className="rounded-lg border border-[#ff8a2a]/30 bg-[#fff0e3] px-3 py-1 text-xs font-semibold text-[#c75f00] hover:bg-[#ffe3cc]"
                    >
                      ✓ Tandai Semua di Kategori Ini Baik
                    </button>
                  </div>

                  {category.items.map((item) => {
                    const state = items[item.id] || {
                      condition: undefined,
                      photos: [],
                      notes: "",
                      uploading: false,
                    }
                    const isDamaged = state.condition === "RUSAK"

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#e6e2de] bg-white p-3.5 transition-all shadow-[0_2px_8px_rgba(17,17,17,0.02)]"
                      >
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#fff0e3] px-2 py-0.5 text-[11px] font-bold text-[#c75f00]" title={item.actionName}>
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

                          {/* Condition Selectors (Mobile Segmented) */}
                          <div className="flex items-center gap-1.5">
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
                                state.condition === "BAIK"
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
                                  handler: state.handler || "BES",
                                  repairForm: state.repairForm || "SAT/FRM/TS/065_REV:00_161020",
                                  notes: state.notes || "Form Penggantian Spare Part (065)",
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
                                state.condition === "TIDAK_ADA"
                                  ? "border-[#111111] bg-[#111111] text-white font-bold shadow-xs"
                                  : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                              )}
                            >
                              Tidak Ada (T)
                            </button>
                          </div>
                        </div>

                        {/* DAMAGED / NOK EXTRA DETAILS */}
                        {isDamaged ? (
                          <div className="mt-4 border-t border-[#eeeeec] pt-4 flex flex-col gap-4">
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
                                    state.handler === "BES"
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
                                    state.handler === "EKSTERNAL"
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
                              {state.photos.length === 0 ? (
                                <CameraCaptureButton
                                  disabled={state.uploading}
                                  uploading={state.uploading}
                                  watermarkLines={buildChecklistPhotoWatermarkLines({
                                    areaName: `${areaName} (Pallet Mover)`,
                                    userLabel: watermarkUserLabel,
                                    userRole: watermarkUserRole,
                                  })}
                                  onCapture={(file) => void uploadPhoto(item.id, file)}
                                />
                              ) : null}

                              {state.photos.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {state.photos.map((photo) => (
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
                                      areaName: `${areaName} (Pallet Mover)`,
                                      userLabel: watermarkUserLabel,
                                      userRole: watermarkUserRole,
                                    })}
                                    onCapture={(file) => void uploadPhoto(item.id, file)}
                                  />
                                </div>
                              ) : null}
                            </div>

                            {/* 3. TINDAK LANJUT (Dropdown Form Tindak Lanjut) */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                                TINDAK LANJUT <span className="text-red-500">*</span>
                              </p>
                              <Select
                                value={state.repairForm || "SAT/FRM/TS/065_REV:00_161020"}
                                onValueChange={(val) =>
                                  updateItem(item.id, {
                                    repairForm: val || undefined,
                                    notes:
                                      val === "SAT/FRM/TS/065_REV:00_161020"
                                        ? "Form Penggantian Spare Part (065)"
                                        : val === "SAT/FRM/TSM/014_REV:000_060423"
                                        ? "Form Estimasi Biaya Sipil & ME (014)"
                                        : "Repair Tanpa Biaya",
                                  })
                                }
                              >
                                <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#ff8a2a] focus:ring-offset-0">
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
                                      className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* General Notes Section */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)]">
        <label className="mb-1.5 block text-xs font-bold text-[#111111]">
          Catatan Pelaksanaan Inspeksi (Opsional)
        </label>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan tambahan mengenai kondisi umum pallet mover atau rekomendasi teknis..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="w-full rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-xs leading-5 focus-visible:border-[#ff8a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/20"
        />
      </section>

      {/* Approver & Document Footer */}
      <section className="rounded-2xl border border-[#f0eee9] bg-[#fbfbfa] p-4 text-xs text-[#707784] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceae5] pb-2 font-semibold text-[#111111]">
          <span>NRA: SAT/FRM/TS/016_Rev: 02_161020</span>
          <span>INTERNAL USE ONLY</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#707784]">
          REF NRA : SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH
        </p>
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3 text-[11px]">
          <div>
            <span className="text-[#a0a0a0]">Dibuat oleh:</span>
            <p className="font-semibold text-[#111111]">Branch Maintenance Support</p>
          </div>
          <div>
            <span className="text-[#a0a0a0]">Diperiksa oleh:</span>
            <p className="font-semibold text-[#111111]">Branch Maintenance Coordinator</p>
          </div>
          <div>
            <span className="text-[#a0a0a0]">Disetujui oleh:</span>
            <p className="font-semibold text-[#111111]">Branch Building & Maintenance Manager</p>
          </div>
        </div>
      </section>

      {/* SUBMIT BUTTON BAR */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="h-12 w-full rounded-xl bg-[#ff8a2a] text-sm font-bold text-white shadow-lg shadow-[#ff8a2a]/20 hover:bg-[#e67a22] disabled:opacity-50"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Menyimpan Laporan...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="size-4" />
              <span>Kirim Laporan Checklist Pallet Mover</span>
            </div>
          )}
        </Button>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(undefined)}
        >
          <div
            className="relative max-h-[90vh] max-w-xl overflow-hidden rounded-2xl bg-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-bold text-[#111111]">
                {previewPhoto.itemLabel}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(undefined)}
                className="grid size-7 place-items-center rounded-full bg-[#f5f5f3] text-[#111111]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.itemLabel}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
