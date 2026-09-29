"use client"

import * as React from "react"
import Image from "next/image"
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
  Search,
  Send,
  Trash2,
  Wrench,
  X,
} from "lucide-react"

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
  HAND_PALLET_CATEGORIES,
  ALL_HAND_PALLET_ITEMS,
  FRM_TS_062_FORM_CODE,
  FRM_TS_062_NRA,
  FRM_TS_062_REF_NRA,
  type HandPalletItem,
} from "@/lib/checklists/frm-ts-062"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs062FormProps = {
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

export function FrmTs062Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_062_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs062FormProps) {
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
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Item states
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    for (const item of ALL_HAND_PALLET_ITEMS) {
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

  // Accordion state: all open by default for Hand Pallet (6 compact categories)
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    HAND_PALLET_CATEGORIES.forEach((cat) => {
      initial[cat.id] = true
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
    HAND_PALLET_CATEGORIES.forEach((cat) => {
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
    const category = HAND_PALLET_CATEGORIES.find((c) => c.id === catId)
    if (!category) return

    setItems((prev) => {
      const next = { ...prev }
      category.items.forEach((item) => {
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
  const totalCount = ALL_HAND_PALLET_ITEMS.length
  const evaluatedCount = ALL_HAND_PALLET_ITEMS.filter((item) =>
    Boolean(items[item.id]?.condition)
  ).length
  const damagedCount = ALL_HAND_PALLET_ITEMS.filter(
    (item) => items[item.id]?.condition === "RUSAK"
  ).length
  const progressPercentage = Math.round((evaluatedCount / totalCount) * 100)

  // Filtering
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredCategories = HAND_PALLET_CATEGORIES.map((cat) => {
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
      formName: "Form Monthly Checklist Hand Pallet",
      areaCode,
      period: "MONTHLY",
      periodKey,
      unitNo: unitNo.trim(),
      unitBrand: unitBrand.trim(),
      generalNotes: generalNotes.trim(),
      items: ALL_HAND_PALLET_ITEMS.map((item) => {
        const state = items[item.id]
        const condition = state?.condition || (isRepairMode ? "BAIK" : "TIDAK_ADA")

        return {
          id: item.id,
          label: item.label,
          condition: condition,
          photos: condition === "RUSAK" ? state?.photos || [] : [],
          notes: state?.notes?.trim() || "",
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
      setErrors(["Nomor Unit / Serial wajib diisi (misal: HP-01)."])
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
            <Wrench className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111111] sm:text-lg">
              Identitas Unit Hand Pallet
            </h2>
            <p className="text-xs text-[#707784]">
              {areaName} • {FRM_TS_062_NRA}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* No. Unit / Serial */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              No. Unit / Serial <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="Contoh: HP-01 atau SN-8821"
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
              placeholder="Contoh: Krisbow / OPK / Bishamon"
              value={unitBrand}
              onChange={(e) => setUnitBrand(e.target.value)}
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
                      ? "border-[#ff8a2a] bg-[#fff0e3] text-[#c75f00] font-bold shadow-xs ring-1 ring-[#ff8a2a]"
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
                Inspeksi Bulanan Hand Pallet
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
              placeholder="Cari komponen inspeksi (contoh: roda, fork, hidrolik)..."
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

      {/* Legend / Petunjuk Cara Tindakan (No color badges, plain text with bold codes) */}
      <section className="rounded-xl border border-[#f0eee9] bg-[#fbfbfa] p-3 text-xs text-[#707784]">
        <span className="font-bold text-[#111111]">Petunjuk Cara Tindakan: </span>
        <span className="inline-block mx-1 font-semibold text-[#111111]">Ch</span>=Check •
        <span className="inline-block mx-1 font-semibold text-[#111111]">Cl</span>=Clean •
        <span className="inline-block mx-1 font-semibold text-[#111111]">Td</span>=Test drive
      </section>

      {/* ERROR BANNER */}
      {errors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="size-4" />
            <span>Mohon lengkapi data berikut sebelum submit:</span>
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* CATEGORIES & ITEMS LIST */}
      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const Icon = category.icon
          const isOpen = openCategories[category.id] ?? true

          const catTotal = category.items.length
          const catEvaluated = category.items.filter((item) =>
            Boolean(items[item.id]?.condition)
          ).length
          const catDamaged = category.items.filter(
            (item) => items[item.id]?.condition === "RUSAK"
          ).length
          const isComplete = catEvaluated === catTotal

          return (
            <div
              key={category.id}
              className="overflow-hidden rounded-2xl border border-[#e6e2de] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.04)]"
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

                  {category.items.map((item: HandPalletItem) => {
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
                              Tindakan:{" "}
                              <span className="font-medium text-[#111111]">
                                {item.actionName}
                              </span>
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
                                  repairForm:
                                    state.repairForm || "SAT/FRM/TS/065_REV:00_161020",
                                  notes: state.notes || "",
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
                              Tidak Ada
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
                                  BES (Internal)
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
                                  Eksternal / Vendor
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
                                    areaName: `${areaName} (Hand Pallet)`,
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
                                      areaName: `${areaName} (Hand Pallet)`,
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
                                  })
                                }
                              >
                                <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#ff8a2a] focus:ring-offset-0">
                                  <span
                                    className={cn(
                                      "flex-1 text-left truncate",
                                      !state.repairForm && "text-[#707784]"
                                    )}
                                  >
                                    {state.repairForm
                                      ? FOLLOW_UP_OPTIONS.find((o) => o.id === state.repairForm)?.label ||
                                        state.repairForm
                                      : "Pilih form tindak lanjut"}
                                  </span>
                                </SelectTrigger>
                                <SelectContent
                                  alignItemWithTrigger={false}
                                  className="rounded-xl border-[#dedede] bg-white shadow-lg"
                                >
                                  {FOLLOW_UP_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.id}
                                      value={opt.id}
                                      className="py-2.5 text-[13px] text-[#111111] focus:bg-[#fff0e3] focus:text-[#c75f00]"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 4. Catatan Temuan */}
                            <div className="border-t border-[#eeeeec] pt-4">
                              <label className="mb-1.5 block text-xs font-bold text-[#707784]">
                                Catatan Temuan / Kerusakan (Opsional)
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Tuliskan catatan kerusakan jika ada (contoh: Roda aus, hidrolik bocor halus)..."
                                value={state.notes}
                                onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                className="w-full rounded-xl border border-[#e8e8e6] bg-white p-3 text-xs text-[#111111] focus:border-[#ff8a2a] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ff8a2a]/20"
                              />
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

      {/* GENERAL NOTES */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)]">
        <label className="mb-2 block text-xs font-bold text-[#111111]">
          Catatan Umum / Keterangan Tambahan
        </label>
        <textarea
          rows={3}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Catatan tambahan mengenai kondisi hand pallet secara menyeluruh..."
          className="w-full rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-xs text-[#111111] focus:border-[#ff8a2a] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ff8a2a]/20"
        />
      </section>

      {/* APPROVAL & SIGNATURE CARD */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="mb-3 flex items-center justify-between border-b border-[#f0eee9] pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#707784]">
            Verifikasi & Pengesahan Bertingkat
          </h4>
          <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            INTERNAL USE ONLY
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-center">
            <span className="text-[10px] font-semibold text-[#707784]">Dibuat oleh</span>
            <p className="mt-1 text-xs font-bold text-[#111111]">Br Engineering Support</p>
            <p className="mt-2 text-[11px] text-[#707784]">Pelaksana</p>
          </div>

          <div className="rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-center">
            <span className="text-[10px] font-semibold text-[#707784]">Diperiksa oleh</span>
            <p className="mt-1 text-xs font-bold text-[#111111]">Br Engineering Coord</p>
            <p className="mt-2 text-[11px] text-[#707784]">Reviewer</p>
          </div>

          <div className="rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-center">
            <span className="text-[10px] font-semibold text-[#707784]">Disetujui oleh</span>
            <p className="mt-1 text-xs font-bold text-[#111111]">Br Building & Maintenance Mgr</p>
            <p className="mt-2 text-[11px] text-[#707784]">Approver</p>
          </div>
        </div>

        <div className="mt-4 border-t border-[#f0eee9] pt-3 text-center text-[10px] text-[#8a8a8a]">
          <p className="font-semibold text-[#111111]">NRA: {FRM_TS_062_NRA}</p>
          <p className="mt-0.5">{FRM_TS_062_REF_NRA}</p>
        </div>
      </section>

      {/* SUBMIT BUTTON BAR */}
      <div className="sticky bottom-4 z-40 rounded-2xl border border-[#e6e2de] bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(17,17,17,0.12)] backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#707784]">
            Progress: <span className="font-bold text-[#111111]">{evaluatedCount}/{totalCount} item</span>
            {damagedCount > 0 && (
              <span className="ml-2 font-bold text-rose-600">• {damagedCount} Rusak</span>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-[#ff8a2a] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#e6751c] disabled:opacity-50 sm:w-auto"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="size-4" />
                Simpan & Lanjutkan
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* FULLSCREEN PHOTO PREVIEW MODAL */}
      {previewPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setPreviewPhoto(undefined)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-6" />
          </button>
          <div className="max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl">
            <Image
              src={previewPhoto.url}
              alt={previewPhoto.itemLabel}
              width={800}
              height={800}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            <p className="mt-2 text-center text-xs font-semibold text-white/80">
              {previewPhoto.itemLabel}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
