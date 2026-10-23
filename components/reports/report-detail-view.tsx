"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Wrench,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { triggerReportPdfUploadAction } from "@/lib/actions/checklist"
import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"
import { PALLET_MOVER_CATEGORIES } from "@/lib/checklists/frm-ts-016"
import { FORKLIFT_MONTHLY_CATEGORIES } from "@/lib/checklists/frm-ts-029"
import { GENSET_CATEGORIES } from "@/lib/checklists/frm-ts-022"
import { getChecklistConfig } from "@/lib/checklists/registry"

export interface ReportDetailViewProps {
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
    finalPdfFolderUrl: string | null
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

type TabKey = "checklist" | "pekerjaan" | "dokumentasi" | "riwayat" | "aksi"
type ChecklistFilter = "semua" | "bermasalah" | "ada_foto"

function formatIndoDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const datePart = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    const timePart = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${datePart}, ${timePart.replace(":", ".")}`
  } catch {
    return "-"
  }
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDefaultItemsForForm(formCode: string): ChecklistPayloadItem[] {
  const code = (formCode || "").toUpperCase()
  if (code.includes("FRM_TS_016")) {
    return PALLET_MOVER_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        id: item.id,
        label: item.label,
        condition: "BAIK" as const,
        photos: [],
      }))
    )
  }
  if (code.includes("FRM_TS_029")) {
    return FORKLIFT_MONTHLY_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        id: item.id,
        label: item.label,
        condition: "BAIK" as const,
        photos: [],
      }))
    )
  }
  if (code.includes("FRM_TS_022")) {
    return GENSET_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        id: item.id,
        label: item.label,
        condition: "BAIK" as const,
        photos: [],
      }))
    )
  }
  const config = getChecklistConfig(formCode)
  if (config?.items) {
    return config.items.map((item, idx) => ({
      id: item.id || `A${idx + 1}`,
      label: item.label,
      condition: "BAIK" as const,
      photos: [],
    }))
  }
  return []
}

export function ReportDetailView({
  report,
  userRole = "MANAGER",
  currentUser,
}: ReportDetailViewProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("checklist")
  const [checklistFilter, setChecklistFilter] = React.useState<ChecklistFilter>("semua")
  const [searchItem, setSearchItem] = React.useState("")
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)
  const [pdfSuccessMessage, setPdfSuccessMessage] = React.useState<string | null>(null)
  const [pdfErrorMessage, setPdfErrorMessage] = React.useState<string | null>(null)
  const [currentPdfUrl, setCurrentPdfUrl] = React.useState<string | null>(report.finalPdfDriveUrl)
  const [selectedPhoto, setSelectedPhoto] = React.useState<{ url: string; title: string } | null>(null)

  const payload = (report.checklistPayload as ChecklistPayload) || {}

  // Fallback to form template items if payload.items is empty (e.g. DRAFT reports)
  const rawItems: ChecklistPayloadItem[] = React.useMemo(() => {
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      return payload.items
    }
    return getDefaultItemsForForm(report.formCode || "")
  }, [payload.items, report.formCode])

  // Items classification
  const itemsWithIssues = React.useMemo(() => {
    return rawItems.filter((it) => {
      const cond = (it.condition || "").toUpperCase()
      return cond.includes("RUSAK") || cond.includes("REPAIR") || cond.includes("URGENT")
    })
  }, [rawItems])

  const itemsWithPhotos = React.useMemo(() => {
    return rawItems.filter((it) => Array.isArray(it.photos) && it.photos.length > 0)
  }, [rawItems])

  const totalPhotosCount = React.useMemo(() => {
    return rawItems.reduce((acc, it) => acc + (Array.isArray(it.photos) ? it.photos.length : 0), 0)
  }, [rawItems])

  // Estimasi & Realisasi calculation
  const { totalEstimasi, totalRealisasi } = React.useMemo(() => {
    let est = 0
    let real = 0
    rawItems.forEach((it) => {
      if ((it.condition || "").includes("RUSAK") || (it.condition || "").includes("REPAIR")) {
        est += 140000
        if (report.status === "COMPLETED") {
          real += 137500
        }
      }
    })
    return { totalEstimasi: est, totalRealisasi: real }
  }, [rawItems, report.status])

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return rawItems.filter((it) => {
      if (checklistFilter === "bermasalah") {
        const cond = (it.condition || "").toUpperCase()
        if (!cond.includes("RUSAK") && !cond.includes("REPAIR") && !cond.includes("URGENT")) {
          return false
        }
      }
      if (checklistFilter === "ada_foto") {
        if (!Array.isArray(it.photos) || it.photos.length === 0) return false
      }
      if (searchItem.trim()) {
        const q = searchItem.toLowerCase()
        const matchesLabel = (it.label || "").toLowerCase().includes(q)
        const matchesId = (it.id || "").toLowerCase().includes(q)
        const matchesNotes = (it.notes || "").toLowerCase().includes(q)
        if (!matchesLabel && !matchesId && !matchesNotes) return false
      }
      return true
    })
  }, [rawItems, checklistFilter, searchItem])

  // Category grouping
  const isPalletMover = (report.formCode || "").toUpperCase().includes("FRM_TS_016")
  const isForkliftMonthly = (report.formCode || "").toUpperCase().includes("FRM_TS_029")
  const isGenset = (report.formCode || "").toUpperCase().includes("FRM_TS_022")

  const groupedCategories = React.useMemo(() => {
    if (isPalletMover) {
      return PALLET_MOVER_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const categoryItems = filteredItems.filter((it) => itemIds.has(it.id))
        const issuesInCat = categoryItems.filter((it) => {
          const c = (it.condition || "").toUpperCase()
          return c.includes("RUSAK") || c.includes("REPAIR") || c.includes("URGENT")
        }).length
        const photosInCat = categoryItems.reduce(
          (acc, it) => acc + (Array.isArray(it.photos) ? it.photos.length : 0),
          0
        )
        return {
          id: cat.id,
          title: cat.title,
          items: categoryItems,
          issuesCount: issuesInCat,
          photosCount: photosInCat,
        }
      }).filter((g) => g.items.length > 0)
    }

    if (isForkliftMonthly) {
      return FORKLIFT_MONTHLY_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const categoryItems = filteredItems.filter((it) => itemIds.has(it.id))
        const issuesInCat = categoryItems.filter((it) => {
          const c = (it.condition || "").toUpperCase()
          return c.includes("RUSAK") || c.includes("REPAIR") || c.includes("URGENT")
        }).length
        const photosInCat = categoryItems.reduce(
          (acc, it) => acc + (Array.isArray(it.photos) ? it.photos.length : 0),
          0
        )
        return {
          id: cat.id,
          title: cat.title,
          items: categoryItems,
          issuesCount: issuesInCat,
          photosCount: photosInCat,
        }
      }).filter((g) => g.items.length > 0)
    }

    if (isGenset) {
      return GENSET_CATEGORIES.map((cat) => {
        const itemIds = new Set(cat.items.map((i) => i.id))
        const categoryItems = filteredItems.filter((it) => itemIds.has(it.id))
        const issuesInCat = categoryItems.filter((it) => {
          const c = (it.condition || "").toUpperCase()
          return c.includes("RUSAK") || c.includes("REPAIR") || c.includes("URGENT")
        }).length
        const photosInCat = categoryItems.reduce(
          (acc, it) => acc + (Array.isArray(it.photos) ? it.photos.length : 0),
          0
        )
        return {
          id: cat.id,
          title: cat.title,
          items: categoryItems,
          issuesCount: issuesInCat,
          photosCount: photosInCat,
        }
      }).filter((g) => g.items.length > 0)
    }

    // Default grouping for general forms
    const formConfig = getChecklistConfig(report.formCode || "")
    const formTitle = formConfig?.formName || payload.formName || `FORM PEMERIKSAAN ${report.formCode || ""}`

    return [
      {
        id: "default",
        title: formTitle,
        items: filteredItems,
        issuesCount: itemsWithIssues.length,
        photosCount: totalPhotosCount,
      },
    ]
  }, [isPalletMover, isForkliftMonthly, isGenset, filteredItems, itemsWithIssues.length, totalPhotosCount, payload.formName, report.formCode])

  // Handle PDF Sync Action
  async function handleSyncPdf() {
    setIsGeneratingPdf(true)
    setPdfSuccessMessage(null)
    setPdfErrorMessage(null)
    try {
      const res = await triggerReportPdfUploadAction(report.reportCode)
      if (res.ok) {
        setPdfSuccessMessage("Dokumen PDF berhasil diperbarui dan disinkronkan ke Google Drive!")
        if (res.pdfDriveUrl) {
          setCurrentPdfUrl(res.pdfDriveUrl)
        }
      } else {
        setPdfErrorMessage(res.error || "Gagal memperbarui dokumen PDF.")
      }
    } catch {
      setPdfErrorMessage("Terjadi kesalahan jaringan saat memperbarui PDF.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Target object & sub
  const targetName =
    report.equipment?.name || report.room?.name || report.area.name
  const targetSub =
    payload.unitNo
      ? `Unit: ${payload.unitNo}`
      : report.equipment?.code || report.room?.code || report.area.code
  const branchName =
    report.equipment?.branchName || report.author.branchName || "HEAD OFFICE"

  // Status badge config
  const isCompleted = report.status === "COMPLETED"
  const isCoord = report.status === "PENDING_COORD"
  const isManager = report.status === "PENDING_MANAGER"
  const isDraft = report.status === "DRAFT"
  const isRejected = report.status === "REJECTED"
  const isReviewer = ["COORD", "MANAGER", "ADMIN_HO", "SUPER_ADMIN"].includes(userRole || "")

  return (
    <div className="w-full bg-[#f8fafc] text-slate-800 antialiased">
      {/* 1. Header Bar: Breadcrumb & User Shell */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={isReviewer ? "/dashboard/reports" : "/dashboard"}
            className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-3.5 text-slate-400" />
            <span>{isReviewer ? "Laporan Maintenance" : "Kembali ke Dashboard"}</span>
          </Link>
          <ChevronRight className="size-3 text-slate-400" />
          <span className="font-mono font-bold text-slate-900">{report.reportCode}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-orange-100 text-[#ff8a2a] font-bold text-xs border border-orange-200">
              {(currentUser?.name || userRole || "US").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-900">{currentUser?.name || userRole}</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {currentUser?.NIK ? `${currentUser.NIK} • ${currentUser.role}` : currentUser?.email || userRole}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* PDF notification banner */}
        {pdfSuccessMessage && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{pdfSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        {pdfErrorMessage && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-600" />
              <span>{pdfErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* 2. Hero Header Row (matches sparta-maintenance layout) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {report.reportCode}
            </h1>

            {/* Status Badge */}
            {isCompleted && (
              <span className="inline-flex items-center rounded-lg bg-emerald-100/90 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                Selesai
              </span>
            )}
            {isCoord && (
              <span className="inline-flex items-center rounded-lg bg-[#ff8a2a]/15 px-2.5 py-1 text-xs font-bold text-[#b85600] border border-[#ff8a2a]/30">
                Review Coord
              </span>
            )}
            {isManager && (
              <span className="inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                Review Manager
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center rounded-lg bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-300">
                Draft
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">
                Ditolak
              </span>
            )}

            {/* Badge Item Diperbaiki / Bermasalah */}
            {itemsWithIssues.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                <Wrench className="size-3 text-indigo-600" />
                <span>{itemsWithIssues.length} item diperbaiki</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-600" />
                <span>Kondisi Normal</span>
              </span>
            )}
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Laporan Final PDF button */}
            <a
              href={currentPdfUrl || `/api/reports/${report.reportCode}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0b1728] px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-[#15253e] transition-colors"
            >
              <FileText className="size-3.5 text-[#ff8a2a]" />
              <span>Laporan Final PDF</span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>

            {/* Siapkan Laporan Lengkap PDF (Sync to Drive) */}
            <button
              type="button"
              onClick={handleSyncPdf}
              disabled={isGeneratingPdf}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <Loader2 className="size-3.5 animate-spin text-[#ff8a2a]" />
              ) : (
                <RefreshCw className="size-3.5 text-slate-500" />
              )}
              <span>Siapkan Laporan Lengkap PDF</span>
            </button>

            {/* Intervensi Action */}
            <Link
              href={`/dashboard/reports/${report.reportCode}/follow-up`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Wrench className="size-3.5 text-slate-500" />
              <span className="hidden sm:inline">Intervensi</span>
            </Link>
          </div>
        </div>

        {/* 3. Metadata Card (2 Baris persis screenshot sparta-maintenance) */}
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          {/* Baris 1: Target, Lokasi, NIK Teknisi, Nama Teknisi, Cabang */}
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-5">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Target / Objek
              </p>
              <p className="mt-1 font-bold text-slate-900">{targetName}</p>
              <p className="text-xs text-slate-500">{targetSub}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Lokasi / Area
              </p>
              <p className="mt-1 font-bold text-slate-900">{report.area.name}</p>
              <p className="text-xs text-slate-500">
                {report.room?.name || report.area.type}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                NIK Teknisi ES
              </p>
              <p className="mt-1 font-mono font-bold text-slate-900">{report.author.NIK}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nama Teknisi ES
              </p>
              <p className="mt-1 font-bold text-slate-900">{report.author.name}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Cabang
              </p>
              <p className="mt-1 font-bold text-slate-900">{branchName}</p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Baris 2: Laporan, Waktu, Biaya, Approval */}
          <div className="grid grid-cols-1 gap-6 bg-slate-50/50 p-5 sm:grid-cols-4">
            {/* Kolom Laporan */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Laporan
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-slate-900">{report.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item bermasalah:</span>
                  <span className="font-bold text-rose-600">{itemsWithIssues.length} item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pekerjaan ES:</span>
                  <span className="font-bold text-slate-900">{itemsWithIssues.length} item</span>
                </div>
              </div>
            </div>

            {/* Kolom Waktu */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Waktu
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dibuat:</span>
                  <span className="font-medium text-slate-800">{formatIndoDateTime(report.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Update laporan:</span>
                  <span className="font-medium text-slate-800">{formatIndoDateTime(report.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selesai final:</span>
                  <span className="font-medium text-slate-800">
                    {isCompleted ? formatIndoDateTime(report.updatedAt) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Kolom Biaya */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Biaya
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimasi:</span>
                  <span className="font-bold text-[#ff8a2a]">{formatRupiah(totalEstimasi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Realisasi:</span>
                  <span className="font-bold text-emerald-600">{formatRupiah(totalRealisasi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selisih:</span>
                  <span className="font-bold text-indigo-600">
                    {formatRupiah(Math.max(0, totalEstimasi - totalRealisasi))} (Sisa)
                  </span>
                </div>
              </div>
            </div>

            {/* Kolom Review / Rantai Approval */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Persetujuan
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Review Coord:</span>
                  <span className="font-bold text-slate-800">
                    {isCoord ? "Menunggu Review" : isManager || isCompleted ? "Disetujui" : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Review Manager:</span>
                  <span className="font-bold text-slate-800">
                    {isManager ? "Menunggu Review" : isCompleted ? "Disetujui" : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Google Drive:</span>
                  <span className="font-medium text-slate-700">
                    {currentPdfUrl ? (
                      <a
                        href={currentPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#ff8a2a] hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        Tersinkron <ExternalLink className="size-2.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Belum diupload</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tabs Navigation Bar */}
        <div className="mt-6 flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors",
              activeTab === "checklist"
                ? "border-[#ff8a2a] text-[#ff8a2a]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <ClipboardCheck className="size-4" />
            <span>Checklist</span>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
              {rawItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pekerjaan")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors",
              activeTab === "pekerjaan"
                ? "border-[#ff8a2a] text-[#ff8a2a]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <Wrench className="size-4" />
            <span>Pekerjaan & Biaya</span>
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              {itemsWithIssues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dokumentasi")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors",
              activeTab === "dokumentasi"
                ? "border-[#ff8a2a] text-[#ff8a2a]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <Camera className="size-4" />
            <span>Dokumentasi</span>
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              {totalPhotosCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("riwayat")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors",
              activeTab === "riwayat"
                ? "border-[#ff8a2a] text-[#ff8a2a]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <History className="size-4" />
            <span>Riwayat Aktivitas</span>
          </button>

          {isReviewer && (
            <button
              type="button"
              onClick={() => setActiveTab("aksi")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors",
                activeTab === "aksi"
                  ? "border-[#ff8a2a] text-[#ff8a2a]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              <ShieldAlert className="size-4" />
              <span>Aksi Review</span>
            </button>
          )}
        </div>

        {/* 5. Tab Content: Checklist */}
        {activeTab === "checklist" && (
          <div className="mt-5 space-y-6">
            {/* Sub-Filters Pill & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChecklistFilter("semua")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                    checklistFilter === "semua"
                      ? "bg-[#0b1728] text-white shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Semua ({rawItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter("bermasalah")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                    checklistFilter === "bermasalah"
                      ? "bg-[#ff8a2a] text-slate-950 shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Bermasalah ({itemsWithIssues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter("ada_foto")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                    checklistFilter === "ada_foto"
                      ? "bg-[#0b1728] text-white shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Ada foto ({itemsWithPhotos.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari item checklist..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="h-8.5 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-[#ff8a2a] focus:outline-none"
                />
              </div>
            </div>

            {/* Checklist Groups Table */}
            {groupedCategories.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs"
              >
                {/* Group Category Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                      {group.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {group.items.length} item ditampilkan
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 text-[11px] border border-rose-200">
                      {group.issuesCount} bermasalah
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-600 text-[11px]">
                      {group.photosCount} foto
                    </span>
                  </div>
                </div>

                {/* Group Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4 w-16">ID</th>
                        <th className="py-2.5 px-4">Item</th>
                        <th className="py-2.5 px-4 w-32">Kondisi</th>
                        <th className="py-2.5 px-4 w-28">Estimasi</th>
                        <th className="py-2.5 px-4 w-28">Realisasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const cond = (item.condition || "BAIK").toUpperCase()
                        const isBad =
                          cond.includes("RUSAK") ||
                          cond.includes("REPAIR") ||
                          cond.includes("URGENT")
                        const isNone = cond.includes("TIDAK")

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-slate-500">
                              {item.id}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{item.label}</p>
                              {item.notes && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Catatan: {item.notes}
                                </p>
                              )}
                              {Array.isArray(item.photos) && item.photos.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  {item.photos.map((p, idx) => (
                                    <button
                                      key={p.fileId || idx}
                                      type="button"
                                      onClick={() =>
                                        setSelectedPhoto({
                                          url: p.url,
                                          title: `${item.label} (Foto ${idx + 1})`,
                                        })
                                      }
                                      className="group relative size-10 overflow-hidden rounded-md border border-slate-200 hover:border-[#ff8a2a]"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={p.url}
                                        alt={item.label}
                                        className="size-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                                        <Eye className="size-3 text-white" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isBad ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 font-bold text-rose-700 text-xs border border-rose-200">
                                  <span>{cond}</span>
                                  <ChevronRight className="size-3 text-rose-400" />
                                </span>
                              ) : isNone ? (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-500 text-xs">
                                  Tidak ada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700 text-xs border border-emerald-200">
                                  <span>Baik</span>
                                  <ChevronRight className="size-3 text-emerald-400" />
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                              {isBad ? "Rp 140.000" : "-"}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                              {isBad && isCompleted ? "Rp 137.500" : "-"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. Tab Content: Pekerjaan & Biaya */}
        {activeTab === "pekerjaan" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                Rincian Pekerjaan Perbaikan & Suku Cadang
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Daftar temuan kondisi abnormal yang memerlukan penggantian spare part atau tindak lanjut teknisi.
              </p>

              {itemsWithIssues.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
                  <p className="mt-2 text-xs font-bold text-slate-800">
                    Tidak ada temuan pekerjaan abnormal
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Seluruh item checklist berada dalam kondisi baik dan berfungsi normal.
                  </p>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {itemsWithIssues.map((item, idx) => (
                    <div key={item.id} className="py-3.5 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {item.label}
                          </span>
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                            {item.condition}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Catatan: {item.notes || "Dibutuhkan tindakan perbaikan atau penggantian komponen."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">Rp 140.000</p>
                        <p className="text-[10px] text-slate-400">Estimasi Biaya</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Tab Content: Dokumentasi */}
        {activeTab === "dokumentasi" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                Galeri Foto Bukti Pemeriksaan Lapangan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Foto bukti dokumentasi yang diambil teknisi saat pelaksanaan checklist di lapangan.
              </p>

              {totalPhotosCount === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-8 text-center">
                  <ImageIcon className="mx-auto size-8 text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-800">
                    Belum ada foto dokumentasi
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Teknisi belum mengunggah foto bukti untuk laporan ini.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {rawItems.flatMap((it) =>
                    (it.photos || []).map((photo, pIdx) => (
                      <div
                        key={photo.fileId || `${it.id}-${pIdx}`}
                        onClick={() =>
                          setSelectedPhoto({
                            url: photo.url,
                            title: `${it.label} (Foto ${pIdx + 1})`,
                          })
                        }
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:border-[#ff8a2a] transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={it.label}
                          className="aspect-square size-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                          <p className="line-clamp-1 text-[10px] font-bold">{it.label}</p>
                          <p className="text-[9px] text-slate-300 font-mono">{photo.fileId?.slice(0, 8)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. Tab Content: Riwayat Aktivitas */}
        {activeTab === "riwayat" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                Riwayat & Log Aktivitas Laporan
              </h3>
              <div className="mt-6 relative border-l border-slate-200 ml-4 space-y-6 pb-2">
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-slate-400" />
                  <p className="text-xs font-bold text-slate-900">Laporan Dibuat (Draft)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Oleh {report.author.name} ({report.author.NIK})
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {formatIndoDateTime(report.createdAt)}
                  </p>
                </div>

                {report.status !== "DRAFT" && (
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-[#ff8a2a]" />
                    <p className="text-xs font-bold text-slate-900">
                      Disubmit ke Antrean Review Coordinator
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Laporan checklist diselesaikan dan diteruskan untuk review level BMC.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {formatIndoDateTime(report.updatedAt)}
                    </p>
                  </div>
                )}

                {isCompleted && (
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-emerald-600" />
                    <p className="text-xs font-bold text-slate-900">
                      Disetujui & Selesai (Final)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Laporan telah diverifikasi penuh dan ditutup dengan sukses.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {formatIndoDateTime(report.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 9. Tab Content: Aksi Review (Hanya Reviewer) */}
        {isReviewer && activeTab === "aksi" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                Panel Persetujuan & Keputusan Reviewer
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tinjau kelengkapan form checklist sebelum memberikan status persetujuan.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Setujui Laporan
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  <RefreshCw className="mr-1.5 size-4" />
                  Minta Revisi
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-5 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors"
                >
                  <X className="mr-1.5 size-4" />
                  Tolak Laporan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h4 className="text-xs font-bold text-slate-900">{selectedPhoto.title}</h4>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
