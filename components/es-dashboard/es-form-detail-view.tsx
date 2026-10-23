"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Home,
  Info,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Wrench,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"
import { PALLET_MOVER_WEEKLY_CATEGORIES } from "@/lib/checklists/frm-ts-045"
import { FORKLIFT_WEEKLY_CATEGORIES } from "@/lib/checklists/frm-ts-043"
import { PALLET_MOVER_CATEGORIES } from "@/lib/checklists/frm-ts-016"
import { FORKLIFT_MONTHLY_CATEGORIES } from "@/lib/checklists/frm-ts-029"
import { GENSET_CATEGORIES } from "@/lib/checklists/frm-ts-022"
import { getChecklistConfig } from "@/lib/checklists/registry"

export interface EsFormDetailViewProps {
  report: {
    id: string
    reportCode: string
    status: string
    category: string
    period: string | null
    periodKey: string | null
    formCode: string | null
    isSafe: boolean
    createdAt: string
    updatedAt: string
    finalPdfDriveUrl: string | null
    area: {
      id: string
      name: string
      code: string
      type: string
    }
    room?: {
      id: string
      name: string
      code: string
    } | null
    equipment?: {
      id: string
      name: string
      code: string
      unitNo?: number
      branchName?: string | null
    } | null
    author: {
      NIK: string
      name: string
      role: string
      branchName: string | null
    }
    checklistPayload: unknown
  }
  userRole?: string
  currentUser?: {
    name: string
    NIK: string
    role: string
    email: string
  }
}

type PreviewPhoto = {
  itemLabel: string
  url: string
}

export function EsFormDetailView({
  report,
}: EsFormDetailViewProps) {
  const router = useRouter()
  const [previewPhoto, setPreviewPhoto] = React.useState<PreviewPhoto | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({})

  const payload = (report.checklistPayload as ChecklistPayload) || {}
  const rawItems: ChecklistPayloadItem[] = Array.isArray(payload.items) ? payload.items : []

  const formCode = (report.formCode || payload.formCode || "").toUpperCase()
  const formConfig = getChecklistConfig(formCode)

  const isPalletMoverWeekly = formCode.includes("FRM_TS_045")
  const isForkliftWeekly = formCode.includes("FRM_TS_043")
  const isPalletMoverMonthly = formCode.includes("FRM_TS_016")
  const isForkliftMonthly = formCode.includes("FRM_TS_029")
  const isGensetMonthly = formCode.includes("FRM_TS_022")

  const targetName =
    report.equipment?.name || report.room?.name || report.area.name || "Target Objek"
  const formTitle =
    formConfig?.formName ||
    payload.formName ||
    (isPalletMoverWeekly
      ? "Checklist PALLET MOVER Weekly"
      : isForkliftWeekly
        ? "Checklist FORKLIFT Weekly"
        : `Checklist ${formCode || "Pemeriksaan"}`)

  // Week calculation from periodKey / payload
  const weekLabel = React.useMemo(() => {
    if (payload.subPeriodLabel) return payload.subPeriodLabel
    if (payload.periodKey && payload.periodKey.includes("-W")) {
      const match = payload.periodKey.match(/-W0?(\d+)/)
      if (match) return `Minggu ${match[1]}`
    }
    return "Minggu Berjalan"
  }, [payload.periodKey, payload.subPeriodLabel])

  // Count conditions
  const conditionStats = React.useMemo(() => {
    let baik = 0
    let rusak = 0
    let other = 0
    for (const it of rawItems) {
      const c = (it.condition || "").toUpperCase()
      if (c === "BAIK" || c === "OK") baik++
      else if (c === "RUSAK" || c === "NOK" || c.includes("REPAIR") || c.includes("URGENT")) rusak++
      else other++
    }
    return { baik, rusak, other, total: rawItems.length }
  }, [rawItems])

  // Grouped items into categories
  const categories = React.useMemo(() => {
    if (isPalletMoverWeekly) {
      return PALLET_MOVER_WEEKLY_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const items = rawItems.filter((i) => itemIds.has(i.id))
        return {
          id: cat.id,
          title: cat.title,
          icon: cat.icon,
          badge: "CL/C",
          items,
        }
      })
    }
    if (isForkliftWeekly) {
      return FORKLIFT_WEEKLY_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const items = rawItems.filter((i) => itemIds.has(i.id))
        return {
          id: cat.id,
          title: cat.title,
          icon: cat.icon,
          badge: "CL/C",
          items,
        }
      })
    }
    if (isPalletMoverMonthly) {
      return PALLET_MOVER_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const items = rawItems.filter((i) => itemIds.has(i.id))
        return {
          id: cat.id,
          title: cat.title,
          icon: cat.icon,
          badge: "BULANAN",
          items,
        }
      })
    }
    if (isForkliftMonthly) {
      return FORKLIFT_MONTHLY_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const items = rawItems.filter((i) => itemIds.has(i.id))
        return {
          id: cat.id,
          title: cat.title,
          icon: cat.icon,
          badge: "BULANAN",
          items,
        }
      })
    }
    if (isGensetMonthly) {
      return GENSET_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const items = rawItems.filter((i) => itemIds.has(i.id))
        return {
          id: cat.id,
          title: cat.title,
          icon: cat.icon,
          badge: "BULANAN",
          items,
        }
      })
    }

    // Default: Single category with all items
    return [
      {
        id: "all",
        title: formTitle,
        icon: Sliders,
        badge: "CHECKLIST",
        items: rawItems,
      },
    ]
  }, [
    isPalletMoverWeekly,
    isForkliftWeekly,
    isPalletMoverMonthly,
    isForkliftMonthly,
    isGensetMonthly,
    rawItems,
    formTitle,
  ])

  // Filter categories by search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories
    const q = searchQuery.toLowerCase()
    return categories
      .map((cat) => {
        const filtered = cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            (item.notes || "").toLowerCase().includes(q)
        )
        return { ...cat, items: filtered }
      })
      .filter((cat) => cat.items.length > 0)
  }, [categories, searchQuery])

  function toggleCategory(catId: string) {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: prev[catId] === undefined ? false : !prev[catId],
    }))
  }

  const formattedDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-"

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111111] antialiased">
      {/* 1. Mobile-friendly Top Navigation Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e8e8e6] bg-white/95 px-4 backdrop-blur-md">
        <Link
          href="/dashboard"
          className="inline-flex size-9 items-center justify-center rounded-xl bg-[#f5f5f3] text-[#111111] transition-transform active:scale-95"
          aria-label="Kembali ke Dashboard"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707784]">
            Draft Isian Form
          </span>
          <span className="font-mono text-xs font-bold text-[#111111]">
            {report.reportCode}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          <Clock className="size-3" />
          Review Coord
        </span>
      </header>

      {/* 2. Main Form Content Wrapper */}
      <main className="mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Form Identity Card */}
        <div className="overflow-hidden rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3 border-b border-[#f0f0f0] pb-3">
            <div>
              <span className="inline-block rounded bg-[#fff0e3] px-2 py-0.5 text-[10px] font-bold uppercase text-[#ff8a2a]">
                {formCode}
              </span>
              <h1 className="mt-1 text-base font-extrabold text-[#111111] leading-snug">
                {formTitle}
              </h1>
              <p className="mt-0.5 text-xs text-[#707784]">
                Target: <span className="font-semibold text-[#111111]">{targetName}</span>
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#f5f5f3] border border-[#e8e8e6] px-2 py-1 text-[11px] font-bold text-[#111111]">
                <Calendar className="size-3 text-[#ff8a2a]" />
                {weekLabel}
              </span>
            </div>
          </div>

          {/* Metadata Grid (Read-Only) */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#faf9f8] border border-[#eae8e4] p-2.5">
              <span className="text-[10px] font-medium text-[#888888]">Waktu Submit</span>
              <p className="mt-0.5 font-semibold text-[#111111]">{formattedDate} WIB</p>
            </div>
            <div className="rounded-xl bg-[#faf9f8] border border-[#eae8e4] p-2.5">
              <span className="text-[10px] font-medium text-[#888888]">Teknisi / PIC</span>
              <p className="mt-0.5 font-semibold text-[#111111] truncate">{report.author.name}</p>
            </div>
            {payload.unitNo && (
              <div className="rounded-xl bg-[#faf9f8] border border-[#eae8e4] p-2.5">
                <span className="text-[10px] font-medium text-[#888888]">Nomor Unit</span>
                <p className="mt-0.5 font-semibold text-[#111111]">{payload.unitNo}</p>
              </div>
            )}
            {payload.unitBrand && (
              <div className="rounded-xl bg-[#faf9f8] border border-[#eae8e4] p-2.5">
                <span className="text-[10px] font-medium text-[#888888]">Merk / Model</span>
                <p className="mt-0.5 font-semibold text-[#111111]">{payload.unitBrand}</p>
              </div>
            )}
            {payload.hourMeter && (
              <div className="rounded-xl bg-[#faf9f8] border border-[#eae8e4] p-2.5">
                <span className="text-[10px] font-medium text-[#888888]">Hour Meter</span>
                <p className="mt-0.5 font-semibold text-[#111111]">{payload.hourMeter}</p>
              </div>
            )}
            {report.finalPdfDriveUrl && (
              <div className="rounded-xl bg-[#faf9f8] border border-[#eae8e4] p-2.5">
                <span className="text-[10px] font-medium text-[#888888]">Dokumen PDF</span>
                <a
                  href={report.finalPdfDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 font-semibold text-[#ff8a2a] hover:underline"
                >
                  <span>Buka di Drive</span>
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* Read-Only Notice */}
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50/80 border border-blue-200/60 px-2.5 py-1.5 text-[11px] text-blue-900 font-medium">
            <Lock className="size-3 text-blue-600 shrink-0" />
            <span>Mode Baca: Isian telah tersimpan dan tidak dapat diubah oleh PIC.</span>
          </div>
        </div>

        {/* Summary Condition Counts Bar */}
        <div className="flex items-center justify-between rounded-xl border border-[#dedede] bg-white p-3 shadow-xs text-xs">
          <div>
            <span className="font-bold text-[#111111]">Total Titik Periksa</span>
            <p className="text-[11px] text-[#707784]">{conditionStats.total} item checklist</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[11px]">
              {conditionStats.baik} Baik
            </span>
            {conditionStats.rusak > 0 && (
              <span className="rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[11px]">
                {conditionStats.rusak} Rusak
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#888888]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari item checklist..."
            className="h-10 w-full rounded-xl border border-[#e8e8e6] bg-white pl-9 pr-3 text-xs text-[#111111] shadow-2xs outline-none placeholder:text-[#a0a5ad] focus:border-[#ff8a2a]/50 focus:ring-2 focus:ring-[#ff8a2a]/20"
          />
        </div>

        {/* Category Accordions with Form Inputs in Read-Only Mode */}
        <div className="flex flex-col gap-3">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon || Sliders
            const isOpen = openCategories[cat.id] ?? true
            const catItems = cat.items

            return (
              <div
                key={cat.id}
                className="overflow-hidden rounded-2xl border border-[#dedede] bg-white shadow-xs"
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="flex w-full items-center justify-between border-b border-[#f0f0f0] bg-white p-3.5 text-left transition-colors hover:bg-gray-50/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#fff0e3] text-[#ff8a2a]">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-[#111111]">{cat.title}</h2>
                      <p className="text-[11px] text-[#707784]">{catItems.length} item periksa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-[#dedede] bg-[#fbfbfb] px-2 py-0.5 text-[10px] font-bold text-[#707784]">
                      {cat.badge}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="size-4 text-[#888888]" />
                    ) : (
                      <ChevronDown className="size-4 text-[#888888]" />
                    )}
                  </div>
                </button>

                {/* Items List (Read-Only) */}
                {isOpen && (
                  <div className="divide-y divide-[#f0f0f0]">
                    {catItems.map((item) => {
                      const cond = (item.condition || "").toUpperCase()
                      const isBaik = cond === "BAIK" || cond === "OK"
                      const isRusak =
                        cond === "RUSAK" ||
                        cond === "NOK" ||
                        cond.includes("REPAIR") ||
                        cond.includes("URGENT")
                      const isAction = isRusak || ["CLEAN", "ADJUST_OR_ADD"].includes(cond)
                      const photos = Array.isArray(item.photos) ? item.photos : []

                      return (
                        <div key={item.id} className="p-3.5 space-y-3">
                          {/* Item Label & Segmented Controls */}
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#111111]">{item.label}</p>
                              {item.id && (
                                <p className="text-[10px] text-[#888888] font-mono">
                                  ID: {item.id}
                                </p>
                              )}
                            </div>

                            {/* Read-Only Condition Selector Pill */}
                            <div className="flex items-center gap-1.5 self-start sm:self-center pointer-events-none">
                              <button
                                type="button"
                                disabled
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                                  isBaik
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-gray-100 text-gray-400 opacity-60"
                                )}
                              >
                                Baik (V)
                              </button>
                              <button
                                type="button"
                                disabled
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                                  isRusak
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-gray-100 text-gray-400 opacity-60"
                                )}
                              >
                                Rusak (X)
                              </button>
                              {!isBaik && !isRusak && item.condition && (
                                <span className="rounded-lg bg-orange-500 text-white px-2.5 py-1 text-xs font-bold">
                                  {item.condition}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Damage & Action Details (if not good) */}
                          {isAction && (
                            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-3 space-y-3">
                              {/* AKAN DIHANDLE */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707784]">
                                  Akan Dihandle
                                </span>
                                <div className="mt-1 flex gap-2">
                                  <span
                                    className={cn(
                                      "inline-block rounded-lg px-3 py-1 text-xs font-bold",
                                      item.handler === "EKSTERNAL"
                                        ? "bg-gray-100 text-gray-400"
                                        : "bg-[#ff8a2a] text-white shadow-xs"
                                    )}
                                  >
                                    BES
                                  </span>
                                  {item.handler === "EKSTERNAL" && (
                                    <span className="inline-block rounded-lg bg-[#ff8a2a] px-3 py-1 text-xs font-bold text-white shadow-xs">
                                      Eksternal
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* FOTO BUKTI */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707784]">
                                  Foto Bukti Kerusakan ({photos.length})
                                </span>
                                {photos.length > 0 ? (
                                  <div className="mt-1.5 flex flex-col gap-2">
                                    {photos.map((photo) => (
                                      <div
                                        key={photo.fileId || photo.url}
                                        className="relative group overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111] shadow-xs"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewPhoto({
                                              itemLabel: item.label,
                                              url: photo.url,
                                            })
                                          }
                                          className="block w-full text-left outline-none"
                                        >
                                          <Image
                                            src={photo.url}
                                            alt={`Foto bukti ${item.label}`}
                                            width={640}
                                            height={360}
                                            className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.01]"
                                          />
                                        </button>
                                        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                          Tap untuk memperbesar
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-xs text-slate-500 italic">
                                    Tidak ada foto bukti.
                                  </p>
                                )}
                              </div>

                              {/* KETERANGAN */}
                              {item.notes && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#707784]">
                                    Keterangan
                                  </span>
                                  <div className="mt-1 rounded-lg border border-[#e8e8e6] bg-white p-2.5 text-xs text-[#111111] leading-relaxed">
                                    {item.notes}
                                  </div>
                                </div>
                              )}

                              {/* FORM TINDAK LANJUT */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707784]">
                                  Form Tindak Lanjut
                                </span>
                                <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-900">
                                  <Wrench className="size-3 text-blue-600" />
                                  <span>
                                    {item.repairFormName ||
                                      (item.repairForm?.includes("065")
                                        ? "Form Penggantian Spare Part (065)"
                                        : item.repairForm?.includes("014")
                                          ? "Form Estimasi Biaya Sipil & ME (014)"
                                          : item.repairForm || "Form Penggantian Spare Part (065)")}
                                  </span>
                                </div>
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

        {/* General Notes (if any) */}
        {payload.generalNotes && (
          <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#111111]">Catatan Tambahan (General Notes)</h3>
            <p className="mt-1.5 text-xs text-[#555555] leading-relaxed bg-[#fbfbfb] border border-[#f0f0f0] p-3 rounded-xl">
              {payload.generalNotes}
            </p>
          </div>
        )}

        {/* Sticky Bottom Actions Bar */}
        <div className="sticky bottom-0 -mx-3 -mb-4 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 border-t border-[#e8e8e6] backdrop-blur-md">
          <Button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-11 w-full bg-[#ff8a2a] text-white font-bold text-xs shadow-md hover:bg-[#f07b1a]"
          >
            <Home className="mr-1.5 size-4" />
            Kembali ke To-Do List Dashboard
          </Button>
        </div>
      </main>

      {/* Fullscreen Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewPhoto(null)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white text-[#111111] shadow-lg outline-none transition-transform active:scale-95"
            aria-label="Tutup foto"
          >
            <X className="size-5" />
          </button>
          <div
            className="flex flex-col items-center gap-3 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewPhoto.url}
              alt={`Preview foto bukti ${previewPhoto.itemLabel}`}
              width={1280}
              height={720}
              className="max-h-[80svh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              priority
            />
            <span className="rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
              {previewPhoto.itemLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
