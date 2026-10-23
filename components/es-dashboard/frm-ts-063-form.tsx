"use client"

import * as React from "react"
import Image from "next/image"
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Fan,
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
  SelectValue,
} from "@/components/ui/select"
import {
  EXHAUST_FAN_CATEGORIES,
  ALL_EXHAUST_FAN_ITEMS,
  FRM_TS_063_FORM_CODE,
  FRM_TS_063_NRA,
  FRM_TS_063_REF_NRA,
  type ExhaustFanItem,
} from "@/lib/checklists/frm-ts-063"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs063FormProps = {
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

export function FrmTs063Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_063_FORM_CODE,
  isRepairMode = false,
  submitAction,
}: FrmTs063FormProps) {
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

  const currentYearStr = React.useMemo(() => {
    const parts = periodKey.split("-")
    return parts[0] || String(new Date().getFullYear())
  }, [periodKey])

  const activeMonthLabel = MONTH_LIST[currentMonthIdx] ?? "Jan"

  // Header State
  const [location, setLocation] = React.useState("")
  const [unitNo, setUnitNo] = React.useState("")
  const [unitBrand, setUnitBrand] = React.useState("")
  const [generalNotes, setGeneralNotes] = React.useState("")

  // Auto-populate location from areaName if empty
  React.useEffect(() => {
    if (!location && areaName) {
      setLocation(areaName)
    }
  }, [areaName, location])

  // Items State (14 items)
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    for (const it of ALL_EXHAUST_FAN_ITEMS) {
      initial[it.id] = {
        photos: [],
        notes: "",
        uploading: false,
      }
    }
    return initial
  })

  // Accordion state: open all categories by default
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {}
    EXHAUST_FAN_CATEGORIES.forEach((cat) => {
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
  const [previewPhoto, setPreviewPhoto] = React.useState<{
    itemLabel: string
    url: string
  }>()
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!uploadNotice || uploadNotice.tone === "loading") return
    const timer = window.setTimeout(() => setUploadNotice(undefined), 3200)
    return () => window.clearTimeout(timer)
  }, [uploadNotice])

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

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

  const markCategoryAllGood = (categoryId: string) => {
    const category = EXHAUST_FAN_CATEGORIES.find((c) => c.id === categoryId)
    if (!category) return

    setItems((prev) => {
      const next = { ...prev }
      category.items.forEach((item) => {
        next[item.id] = {
          ...(next[item.id] || { photos: [], notes: "", uploading: false }),
          condition: "BAIK",
          photos: [],
          notes: "",
          handler: undefined,
          repairForm: undefined,
        }
      })
      return next
    })
  }

  const uploadPhoto = async (itemId: string, file: File) => {
    updateItem(itemId, { uploading: true })
    setUploadNotice({ tone: "loading", message: "Mengunggah foto bukti..." })

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

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal mengunggah foto")
      }

      setItems((prev) => {
        const current = prev[itemId] || {
          photos: [],
          notes: "",
          uploading: false,
        }
        return {
          ...prev,
          [itemId]: {
            ...current,
            uploading: false,
            photos: [
              ...current.photos,
              { fileId: payload.fileId, url: payload.url },
            ],
          },
        }
      })
      setUploadNotice({ tone: "success", message: "Foto berhasil disimpan." })
    } catch (err) {
      updateItem(itemId, { uploading: false })
      setUploadNotice({
        tone: "error",
        message:
          err instanceof Error
            ? err.message
            : "Gagal mengunggah foto. Silakan coba lagi.",
      })
    }
  }

  const removePhoto = (itemId: string, fileId: string) => {
    setItems((prev) => {
      const current = prev[itemId]
      if (!current) return prev
      return {
        ...prev,
        [itemId]: {
          ...current,
          photos: current.photos.filter((p) => p.fileId !== fileId),
        },
      }
    })
  }

  // Filter categories by search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return EXHAUST_FAN_CATEGORIES
    const query = searchQuery.toLowerCase().trim()
    return EXHAUST_FAN_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) =>
          it.label.toLowerCase().includes(query) ||
          it.actionCode.toLowerCase().includes(query) ||
          it.actionName.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.items.length > 0)
  }, [searchQuery])

  // Count progress
  const totalCount = ALL_EXHAUST_FAN_ITEMS.length
  const evaluatedCount = ALL_EXHAUST_FAN_ITEMS.filter((it) =>
    Boolean(items[it.id]?.condition)
  ).length
  const damagedCount = ALL_EXHAUST_FAN_ITEMS.filter(
    (it) =>
      items[it.id]?.condition === "RUSAK" ||
      items[it.id]?.condition === "REPAIR"
  ).length
  const progressPercentage = Math.round((evaluatedCount / totalCount) * 100)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    if (!location.trim()) {
      setErrors(["Lokasi wajib diisi (misal: Ruang Genset / Bulky / Lantai 2)."])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!unitNo.trim()) {
      setErrors(["No. Unit / Serial wajib diisi (misal: EF-01 / SN-12345)."])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!isRepairMode && evaluatedCount < totalCount) {
      setErrors([
        `Seluruh item wajib diperiksa (${evaluatedCount} dari ${totalCount} terisi). Silakan cek kembali item yang belum diisi.`,
      ])
      return
    }

    const damagedWithoutPhoto = ALL_EXHAUST_FAN_ITEMS.filter((it) => {
      const state = items[it.id]
      const isDamaged =
        state?.condition === "RUSAK" || state?.condition === "REPAIR"
      return isDamaged && (!state?.photos || state.photos.length === 0)
    })

    if (damagedWithoutPhoto.length > 0) {
      setErrors([
        `Item rusak berikut wajib menyertakan minimal 1 foto bukti: ${damagedWithoutPhoto
          .map((i) => i.label)
          .join(", ")}`,
      ])
      return
    }

    const payloadItems: ChecklistPayloadItem[] = ALL_EXHAUST_FAN_ITEMS.filter(
      (it) => {
        const state = items[it.id]
        return isRepairMode ? Boolean(state?.condition) : true
      }
    ).map((it) => {
      const state = items[it.id] || {
        photos: [],
        notes: "",
        uploading: false,
      }
      const cond = (state.condition || "BAIK") as ChecklistCondition
      const isAction = [
        "RUSAK",
        "REPAIR",
        "CLEAN",
        "ADJUST_OR_ADD",
      ].includes(cond)
      return {
        id: it.id,
        label: it.label,
        condition: cond,
        photos: state.photos || [],
        notes:
          state.notes ||
          (isAction ? `Pemeriksaan exhaust fan: ${it.actionName}` : undefined),
        handler: isAction ? state.handler || "BES" : state.handler,
        repairForm: state.repairForm,
      }
    })

    const payload: ChecklistPayload = {
      formCode,
      formName: "Checklist Exhaust Fan",
      areaCode,
      period: "MONTHLY",
      periodKey,
      items: payloadItems,
      unitNo: unitNo.trim() || undefined,
      unitBrand: unitBrand.trim() || undefined,
      locationCode: location.trim() || undefined,
      inspectionYear: currentYearStr,
      generalNotes: generalNotes.trim() || undefined,
    }

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

        window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
      } catch (err) {
        setErrors([
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyimpan formulir.",
        ])
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-16">
      {/* Upload Notification Toast */}
      {uploadNotice ? (
        <div
          className={cn(
            "fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.16)]",
            uploadNotice.tone === "loading" &&
              "border-[#dedede] text-[#111111]",
            uploadNotice.tone === "success" &&
              "border-[#c9ead2] bg-[#f0fbf3] text-[#1f6b35]",
            uploadNotice.tone === "error" &&
              "border-[#ffc9a3] bg-[#fff4ec] text-[#8a3d00]"
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

      {/* Lightbox Modal */}
      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(undefined)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-[#1f2937] p-2 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <span className="text-sm font-medium">
                {previewPhoto.itemLabel}
              </span>
              <button
                type="button"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                onClick={() => setPreviewPhoto(undefined)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black mt-2">
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

      {/* TOP CARD: Identitas Exhaust Fan */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
            <Fan className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111111] sm:text-lg">
              FORM MONTHLY CHECKLIST EXHAUST FAN
            </h2>
            <p className="text-xs text-[#707784]">
              PT Sumber Alfaria Trijaya Tbk • Property & Development • {FRM_TS_063_NRA}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {/* Baris 1: Lokasi (Full-width agar nama ruangan panjang tidak terpotong) */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Lokasi <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="Contoh: Warehouse / Depo / Bulky / Lantai 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 w-full border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          {/* Baris 2: No. Unit / Serial (1 col) + Merk Unit (1 col) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#111111]">
                No. Unit / Serial <span className="text-[#ff8a2a]">*</span>
              </label>
              <Input
                placeholder="Contoh: EF-01 / SN-8821"
                value={unitNo}
                onChange={(e) => setUnitNo(e.target.value)}
                className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#111111]">
                Merk Unit
              </label>
              <Input
                placeholder="Contoh: CKE / KDK / Panasonic / Kruger"
                value={unitBrand}
                onChange={(e) => setUnitBrand(e.target.value)}
                className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
              />
            </div>
          </div>
        </div>

        {/* Periode Inspeksi Text Ringkas */}
        <div className="mt-3.5 flex items-center justify-between border-t border-[#f0eee9] pt-3 text-xs">
          <span className="text-[#707784]">
            Periode: <strong className="font-semibold text-[#111111]">Bulanan (Jan - Des)</strong>
          </span>
          <span className="rounded-md bg-[#fff0e3] border border-[#ffc9a3] px-2.5 py-0.5 text-xs font-bold text-[#c75f00]">
            Bulan: {activeMonthLabel} ({periodKey})
          </span>
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
                Inspeksi Bulanan Exhaust Fan
              </h3>
              <p className="mt-0.5 text-xs text-[#707784]">
                {evaluatedCount} dari {totalCount} item diperiksa •{" "}
                <span
                  className={
                    damagedCount > 0
                      ? "font-bold text-rose-600"
                      : "text-emerald-600"
                  }
                >
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
              placeholder="Cari komponen inspeksi (contoh: motor, fan blade, bearing)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs border-[#e6e2de] bg-[#fbfbfa]"
            />
          </div>
        </div>
      </section>

      {/* Legend / Petunjuk Cara Tindakan Sesuai Form Asli FRM_TS_063 */}
      <section className="rounded-xl border border-[#f0eee9] bg-[#fbfbfa] p-3 text-xs text-[#707784]">
        <div className="flex flex-wrap items-center gap-y-1">
          <span className="font-bold text-[#111111] mr-1">Petunjuk Cara Tindakan:</span>
          <span className="inline-block mx-1 font-semibold text-[#111111]">Ch</span>=Check •
          <span className="inline-block mx-1 font-semibold text-[#111111]">Cl</span>=Clean •
          <span className="inline-block mx-1 font-semibold text-[#111111]">Ch&Cl</span>=Check & Clean •
          <span className="inline-block mx-1 font-semibold text-[#111111]">Adj</span>=Adjust •
          <span className="inline-block mx-1 font-semibold text-[#111111]">Tr</span>=Test Runing
        </div>
        <div className="mt-1 text-[11px] text-[#9ca3af]">
          Kondisi: <strong className="text-emerald-700">Baik (V = OK)</strong> atau{" "}
          <strong className="text-rose-600">Rusak (X = NOK)</strong>
        </div>
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
                  {!isComplete && (
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
                  )}
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

              {/* Items List */}
              {isOpen && (
                <div className="border-t border-[#f0eee9] p-3 sm:p-4 space-y-3 bg-[#fbfbfa]/50">
                  {category.items.map((item: ExhaustFanItem) => {
                    const state = items[item.id] || {
                      photos: [],
                      notes: "",
                      uploading: false,
                    }
                    const isDamaged =
                      state.condition === "RUSAK" ||
                      state.condition === "REPAIR"

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

                          {/* Condition Selectors: Baik (V) vs Rusak (X) */}
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
                                    state.repairForm ||
                                    "SAT/FRM/TS/065_REV:00_161020",
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
                                  onClick={() =>
                                    updateItem(item.id, { handler: "BES" })
                                  }
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
                                  onClick={() =>
                                    updateItem(item.id, { handler: "EKSTERNAL" })
                                  }
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
                                    areaName: `${location || areaName} (Exhaust Fan ${unitNo || ""})`,
                                    userLabel: watermarkUserLabel,
                                    userRole: watermarkUserRole,
                                  })}
                                  onCapture={(file) =>
                                    void uploadPhoto(item.id, file)
                                  }
                                />
                              ) : null}

                              {state.photos.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {state.photos.map((photo) => (
                                    <div
                                      key={photo.fileId}
                                      className="relative group"
                                    >
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
                                        onClick={() =>
                                          removePhoto(item.id, photo.fileId)
                                        }
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
                                      areaName: `${location || areaName} (Exhaust Fan ${unitNo || ""})`,
                                      userLabel: watermarkUserLabel,
                                      userRole: watermarkUserRole,
                                    })}
                                    onCapture={(file) =>
                                      void uploadPhoto(item.id, file)
                                    }
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
                                value={
                                  state.repairForm ||
                                  "SAT/FRM/TS/065_REV:00_161020"
                                }
                                onValueChange={(val) =>
                                  updateItem(item.id, {
                                    repairForm: val || undefined,
                                  })
                                }
                              >
                                <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#ff8a2a] focus:ring-offset-0">
                                  <span
                                    className={cn(
                                      "flex-1 text-left truncate text-[#111111]",
                                      !state.repairForm && "text-[#707784]"
                                    )}
                                  >
                                    {state.repairForm
                                      ? FOLLOW_UP_OPTIONS.find(
                                          (o) => o.id === state.repairForm
                                        )?.label || state.repairForm
                                      : "Pilih form tindak lanjut"}
                                  </span>
                                </SelectTrigger>
                                <SelectContent
                                  alignItemWithTrigger={false}
                                  className="rounded-xl border-[#dedede] bg-white shadow-xl"
                                >
                                  {FOLLOW_UP_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.id}
                                      value={opt.id}
                                      className="py-2.5 text-[13px] font-medium text-[#111111] hover:bg-[#fff7ed] hover:text-[#c2410c] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] cursor-pointer"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 4. Catatan Keterangan Kerusakan (Optional) */}
                            <div>
                              <p className="mb-1 text-xs font-bold text-[#707784]">
                                Keterangan Kerusakan (Opsional)
                              </p>
                              <Input
                                placeholder="Detail kerusakan atau spare part yang diperlukan..."
                                value={state.notes}
                                onChange={(e) =>
                                  updateItem(item.id, { notes: e.target.value })
                                }
                                className="h-9 border-[#e6e2de] bg-[#fbfbfa] text-xs focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CATATAN UMUM (Matching Excel row Catatan) */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)]">
        <label className="mb-1.5 block text-xs font-bold text-[#111111]">
          Catatan Tambahan Pemeriksaan (Opsional)
        </label>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan kondisi operasional exhaust fan, temuan khusus, atau rekomendasi..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="w-full rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-xs text-[#111111] focus:border-[#ff8a2a] focus:outline-hidden focus:ring-2 focus:ring-[#ff8a2a]/20"
        />
      </section>

      {/* FOOTER SUBMISSION BAR */}
      <div className="sticky bottom-4 z-20 rounded-2xl border border-[#e6e2de] bg-white/95 p-4 shadow-[0_8px_30px_rgba(17,17,17,0.12)] backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#707784]">
            {evaluatedCount < totalCount ? (
              <span className="font-semibold text-rose-600">
                Lengkapi seluruh item ({evaluatedCount}/{totalCount}) sebelum submit.
              </span>
            ) : damagedCount > 0 ? (
              <span className="font-semibold text-[#c75f00]">
                Terdapat {damagedCount} item rusak. Form follow-up akan otomatis diproses setelah submit.
              </span>
            ) : (
              <span className="font-semibold text-emerald-600">
                Seluruh item telah diperiksa dalam kondisi Baik.
              </span>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="h-11 rounded-xl bg-[#ff8a2a] px-6 text-sm font-bold text-white shadow-md hover:bg-[#e6761b] disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Simpan & Kirim Checklist
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
