"use client"

import { DashboardNotifications } from "@/components/dashboard-notifications"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { executeReportSparePartAction, reviewReportDecision } from "@/app/dashboard/reports/actions"
import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"
import { getChecklistConditionDisplay } from "@/lib/checklists/condition-display"
import { PALLET_MOVER_CATEGORIES } from "@/lib/checklists/frm-ts-016"
import { FORKLIFT_MONTHLY_CATEGORIES } from "@/lib/checklists/frm-ts-029"
import { GENSET_CATEGORIES } from "@/lib/checklists/frm-ts-022"
import { getChecklistConfig } from "@/lib/checklists/registry"
import {
  FORM_065_LABEL,
  getReportItems,
  hasCostEstimateFollowUp,
  hasForm065FollowUp,
  needsChecklistFollowUp,
  REPAIR_TANPA_BIAYA,
  REPAIR_TANPA_BIAYA_LABEL,
  requiresRequesterReview,
} from "@/lib/reports/checklist-follow-up"
import {
  COMPLETION_EVIDENCE_LABELS,
  readStoredCompletionEvidence,
} from "@/lib/reports/completion-evidence"
import {
  formatChecklistPeriodLabel,
  getReportCompletenessSummary,
  hasExecutionAction,
  normalizeApprovalHistory,
  normalizeExecutionHistory,
} from "@/lib/reports/report-display"
import type { ChecklistRevisionHistory } from "@/lib/reports/checklist-revision-history"
import { CompletionEvidencePanel } from "@/components/es-dashboard/completion-evidence-panel"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RevisionHistory } from "@/components/reports/checklist-revision-history"

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
    approvalHistory?: unknown
    executionHistory?: unknown
    revisions: ChecklistRevisionHistory[]
    workPermit?: {
      id: string
      permitCode: string
      status: string
    } | null
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
type ReviewDecision = Parameters<typeof reviewReportDecision>[1]

type FollowUp065 = {
  jenis?: string
  namaUnit?: string
  merk?: string
  nomorUnit?: string
  nomorTiketProblem?: string
  analisa?: string
  tindakan?: string
  parts?: {
    id?: string
    namaPart?: string
    nomorPart?: string
    asalPart?: string
    jumlahPart?: number
  }[]
}

type Material014 = {
  id?: string
  namaBarang?: string
  jumlah?: number | string
  satuan?: string
  hargaUnit?: number | string
  total?: number | string
}

type FollowUp014 = {
  totalCost?: number | string
  materials?: Material014[]
  catatan?: string
}

type ReportItem = ChecklistPayloadItem & {
  followUp065?: FollowUp065
  followUp014?: FollowUp014
  followUpData?: FollowUp065 & FollowUp014
}

function getFollowUp065(item: ReportItem): FollowUp065 | undefined {
  return item.followUp065 ??
    (item.repairForm === "SAT/FRM/TS/065_REV:00_161020" ? item.followUpData : undefined)
}

function getFollowUp014(item: ReportItem): FollowUp014 | undefined {
  return item.followUp014 ??
    (item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ? item.followUpData : undefined)
}

function getMaterials014(followUp?: FollowUp014): Material014[] {
  return Array.isArray(followUp?.materials)
    ? followUp.materials.filter((material) => material && typeof material === "object")
    : []
}

function readMaterialNumber(value: unknown): number | null {
  if (typeof value === "string") {
    const text = value.trim()
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null
    value = Number(text)
  }

  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
}

function getMaterialSubtotal(material: Material014): number | null {
  const savedSubtotal = readMaterialNumber(material.total)
  if (savedSubtotal !== null) return savedSubtotal

  const quantity = readMaterialNumber(material.jumlah)
  const unitPrice = readMaterialNumber(material.hargaUnit)
  if (quantity === null || unitPrice === null) return null

  return readMaterialNumber(quantity * unitPrice)
}

function getItemEstimate(item: ReportItem): number | null {
  const followUp = getFollowUp014(item)
  if (!followUp) return null

  const totals = getMaterials014(followUp).map(getMaterialSubtotal)
  if (totals.length > 0 && totals.every((total) => total !== null)) {
    return totals.reduce((sum, total) => sum + total, 0)
  }

  return readMaterialNumber(followUp.totalCost)
}

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
  const router = useRouter()
  const [reviewDecision, setReviewDecision] = React.useState<ReviewDecision | null>(null)
  const [reviewNotes, setReviewNotes] = React.useState("")
  const [reviewFeedback, setReviewFeedback] = React.useState<{
    message: string
    isError: boolean
  } | null>(null)
  const [isReviewPending, startReview] = React.useTransition()
  const [activeTab, setActiveTab] = React.useState<TabKey>("checklist")
  const [checklistFilter, setChecklistFilter] = React.useState<ChecklistFilter>("semua")
  const [searchItem, setSearchItem] = React.useState("")
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false)
  const [pdfSuccessMessage, setPdfSuccessMessage] = React.useState<string | null>(null)
  const [pdfErrorMessage, setPdfErrorMessage] = React.useState<string | null>(null)
  const [currentPdfUrl, setCurrentPdfUrl] = React.useState<string | null>(report.finalPdfDriveUrl)
  const [selectedPhoto, setSelectedPhoto] = React.useState<{ url: string; title: string } | null>(null)
  const [isExecutionPending, startExecution] = React.useTransition()
  const [executionFeedback, setExecutionFeedback] = React.useState<{ message: string; isError: boolean } | null>(null)
  const [execReferenceNo, setExecReferenceNo] = React.useState("")
  const [execNotes, setExecNotes] = React.useState("")
  const [syncedVersion, setSyncedVersion] = React.useState<{ base: string; latest: string } | null>(null)
  const currentReportVersion =
    syncedVersion && syncedVersion.base === report.updatedAt ? syncedVersion.latest : report.updatedAt
  const setCurrentReportVersion = React.useCallback(
    (nextVersion: string) => {
      setSyncedVersion({ base: report.updatedAt, latest: nextVersion })
    },
    [report.updatedAt],
  )

  function handleExecuteAction(
    action: "PROCESS_PJU" | "PROCESS_PB" | "PICKUP_STOCK" | "START_WORK" | "FINISH_WORK",
  ) {
    startExecution(async () => {
      try {
        const result = await executeReportSparePartAction(
          report.id,
          action,
          execNotes,
          currentReportVersion,
          execReferenceNo.trim() ? { referenceNo: execReferenceNo.trim() } : undefined,
        )
        if (!result.success) {
          setExecutionFeedback({ message: result.error || "Gagal memproses pelaksanaan pekerjaan.", isError: true })
          return
        }
        setExecReferenceNo("")
        setExecNotes("")
        setExecutionFeedback({ message: result.message || "Aksi berhasil diproses.", isError: false })
        router.refresh()
      } catch {
        setExecutionFeedback({ message: "Gagal memproses pelaksanaan pekerjaan.", isError: true })
      }
    })
  }

  const payload = (report.checklistPayload as ChecklistPayload) || {}

  // Fallback to form template items if payload.items is empty (e.g. DRAFT reports)
  const rawItems: ReportItem[] = React.useMemo(() => {
    const savedItems = getReportItems(report.checklistPayload)
    return savedItems.length ? savedItems : getDefaultItemsForForm(report.formCode || "")
  }, [report.checklistPayload, report.formCode])

  // Items classification
  const isFindingCondition = React.useCallback((condition?: string | null) => {
    const cond = (condition || "").toUpperCase()
    return (
      cond.includes("RUSAK") ||
      cond.includes("REPAIR") ||
      cond.includes("URGENT") ||
      cond.includes("ADJUST")
    )
  }, [])

  const itemsWithIssues = React.useMemo(() => {
    return rawItems.filter((it) => isFindingCondition(it.condition))
  }, [rawItems, isFindingCondition])

  const workItems = React.useMemo(() => {
    const issueIds = new Set(itemsWithIssues.map((item) => item.id))
    return rawItems.filter((item) => issueIds.has(item.id) || Boolean(getFollowUp014(item)))
  }, [itemsWithIssues, rawItems])

  const itemsWithPhotos = React.useMemo(() => {
    return rawItems.filter((it) => Array.isArray(it.photos) && it.photos.length > 0)
  }, [rawItems])

  const totalPhotosCount = React.useMemo(() => {
    return rawItems.reduce((acc, it) => acc + (Array.isArray(it.photos) ? it.photos.length : 0), 0)
  }, [rawItems])

  const totalEstimasi = rawItems.reduce<number | null>((total, item) => {
    const estimate = getItemEstimate(item)
    return estimate === null ? total : (total ?? 0) + estimate
  }, null)

  // Filtered items
  const filteredItems = React.useMemo(() => {
    return rawItems.filter((it) => {
      if (checklistFilter === "bermasalah") {
        if (!isFindingCondition(it.condition)) {
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
  }, [rawItems, checklistFilter, searchItem, isFindingCondition])

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

  function openReviewDecision(decision: ReviewDecision) {
    setReviewDecision(decision)
    setReviewNotes("")
    setReviewFeedback(null)
  }

  function confirmReviewDecision() {
    if (!reviewDecision || isReviewPending) return
    const decision = reviewDecision
    const notes = reviewNotes.trim()

    if (decision !== "approve" && !notes) {
      setReviewFeedback({ message: "Isi catatan keputusan terlebih dahulu.", isError: true })
      return
    }

    startReview(async () => {
      try {
        const result = await reviewReportDecision(report.id, decision, notes, report.updatedAt)
        if (!result.success) {
          setReviewFeedback({
            message: result.error || "Keputusan review gagal disimpan.",
            isError: true,
          })
          return
        }

        setReviewDecision(null)
        setReviewFeedback({ message: result.message, isError: false })
        router.refresh()
      } catch {
        setReviewFeedback({
          message: "Keputusan review belum bisa disimpan. Muat ulang laporan sebelum mencoba lagi.",
          isError: true,
        })
      }
    })
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
  const isPendingRequester = report.status === "PENDING_REQUESTER"
  const isWaitingPju = report.status === "WAITING_PJU"
  const hasForm014 = hasCostEstimateFollowUp(payload)
  const needsRequester = requiresRequesterReview(payload)
  const isWaitingPb = report.status === "WAITING_PB"
  const isWaitingParts = report.status === "WAITING_PARTS"
  const isInProgress = report.status === "IN_PROGRESS"
  const isDraft = report.status === "DRAFT"
  const needsRevision = report.status === "NEEDS_REVISION"
  const isRejected = report.status === "REJECTED"
  const isReviewer = ["COORD", "MANAGER", "REQUESTER", "ADMIN_HO", "SUPER_ADMIN"].includes(userRole || "")
  const canReview =
    !needsChecklistFollowUp(payload) &&
    ((userRole === "COORD" && isCoord) ||
      (userRole === "MANAGER" && isManager) ||
      (userRole === "REQUESTER" && isPendingRequester))
  const isAuthor = currentUser?.NIK === report.author.NIK || userRole === "ES"
  const formConfigForReport = getChecklistConfig(report.formCode || "")
  const periodLabel = formatChecklistPeriodLabel(
    report.period || payload.period,
    report.periodKey || payload.periodKey,
    payload.subPeriodLabel,
  )
  const completeness = getReportCompletenessSummary({
    status: report.status,
    checklistPayload: report.checklistPayload,
    expectedItems: formConfigForReport?.items?.length ?? null,
  })
  const normalizedApproval = React.useMemo(
    () => normalizeApprovalHistory(report.approvalHistory),
    [report.approvalHistory],
  )
  const normalizedExecution = React.useMemo(
    () => normalizeExecutionHistory(report.executionHistory),
    [report.executionHistory],
  )
  const storedEvidence = React.useMemo(
    () => readStoredCompletionEvidence(report.checklistPayload),
    [report.checklistPayload],
  )
  const completionPhotoCount = React.useMemo(() => {
    if (!storedEvidence) return 0
    return (
      (storedEvidence.form014?.workPhotos.length ?? 0) +
      (storedEvidence.form014?.receiptPhotos.length ?? 0) +
      (storedEvidence.form014?.refundTransferPhotos.length ?? 0) +
      (storedEvidence.form065?.repairWithUnitPhotos.length ?? 0) +
      (storedEvidence.form065?.selfieWithUserPhotos.length ?? 0)
    )
  }, [storedEvidence])
  const totalCombinedPhotosCount = totalPhotosCount + completionPhotoCount
  const actualCost = storedEvidence?.form014?.actualPurchaseAmount ?? null
  const costVariance =
    totalEstimasi !== null && actualCost !== null ? totalEstimasi - actualCost : null
  const pjuRecorded = hasExecutionAction(report.executionHistory, "PROCESS_PJU")
  const stockPickedUp = hasExecutionAction(report.executionHistory, "PICKUP_STOCK")

  const lastRevIdx = normalizedApproval.map((h) => h.decision).lastIndexOf("reject_revision")
  const activeCycleApprovals = lastRevIdx >= 0 ? normalizedApproval.slice(lastRevIdx + 1) : normalizedApproval
  const latestCoordApproval = activeCycleApprovals.filter((h) => h.role === "COORD").slice(-1)[0]
  const latestMgrApproval = activeCycleApprovals.filter((h) => h.role === "MANAGER").slice(-1)[0]
  const latestReqApproval = activeCycleApprovals.filter((h) => h.role === "REQUESTER").slice(-1)[0]
  const has065 = hasForm065FollowUp(payload)

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

        <div className="flex items-center gap-2 sm:gap-3">
          {isReviewer && <DashboardNotifications />}
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
        {report.revisions.length > 0 && activeTab !== "riwayat" && (
          <div className="mb-4">
            <button type="button" onClick={() => setActiveTab("riwayat")} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900">
              {needsRevision ? "Perlu Revisi" : "Laporan pernah direvisi"} · Lihat riwayat
            </button>
          </div>
        )}
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

        {/* Stage & BES Execution Banner */}
        {isPendingRequester && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-xs text-purple-900">
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 text-purple-700 animate-pulse shrink-0" />
              <span>
                <strong>Tahap Menunggu Review Requester (WHM / DWHM)</strong>
                {" · "}
                {hasForm014
                  ? "Estimasi biaya Form 014 sedang ditinjau sebelum proses PJU."
                  : "Usulan penggantian spare part Form 065 sedang ditinjau sebelum alokasi stok atau proses PB."}
              </span>
            </div>
          </div>
        )}

        {(isWaitingPju || isWaitingPb || isWaitingParts || isInProgress) && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700 shrink-0">
                  <Wrench className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {isWaitingPju
                      ? "Tahap: Menunggu PJU Online (Form 014)"
                      : isWaitingPb
                        ? "Tahap: Menunggu PB (Pengadaan Baru)"
                        : isWaitingParts
                          ? "Tahap: Menunggu Part / Pengambilan Stock"
                          : "Tahap: Sedang Dikerjakan (Perbaikan Unit)"}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isWaitingPju
                      ? "Catat proses PJU Online terlebih dahulu sebelum teknisi memulai pekerjaan di lapangan."
                      : isWaitingPb
                        ? "Usulan disetujui Requester. Lakukan proses pengadaan part (PB) dengan logistik, lalu konfirmasi setelah part siap."
                        : isWaitingParts
                          ? "Catat pengambilan stock barang bila diperlukan dan pastikan Izin Kerja (MED/003) bulan berjalan aktif sebelum memulai."
                          : "Pekerjaan perbaikan sedang berlangsung. Lengkapi seluruh bukti penyelesaian sebelum mengubah status menjadi Selesai."}
                  </p>
                </div>
              </div>
            </div>

            {isAuthor && !isInProgress && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    value={execReferenceNo}
                    disabled={isExecutionPending}
                    onChange={(e) => setExecReferenceNo(e.target.value)}
                    placeholder={
                      isWaitingPju
                        ? "No. PJU Online (opsional)"
                        : isWaitingPb
                          ? "No. PB / Pengadaan (opsional)"
                          : "No. Referensi (opsional)"
                    }
                    className="bg-white h-8 text-xs"
                  />
                  <Input
                    value={execNotes}
                    disabled={isExecutionPending}
                    onChange={(e) => setExecNotes(e.target.value)}
                    placeholder="Catatan pelaksanaan (opsional)"
                    className="bg-white h-8 text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isWaitingPju && (
                    <>
                      <button
                        type="button"
                        disabled={isExecutionPending}
                        onClick={() => handleExecuteAction("PROCESS_PJU")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>{pjuRecorded ? "Catat Ulang PJU Online" : "Catat Proses PJU Online"}</span>
                      </button>
                      {pjuRecorded && (
                        <button
                          type="button"
                          disabled={isExecutionPending}
                          onClick={() => handleExecuteAction("START_WORK")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Wrench className="size-3.5" />
                          <span>Mulai Pekerjaan</span>
                        </button>
                      )}
                    </>
                  )}
                  {isWaitingPb && (
                    <button
                      type="button"
                      disabled={isExecutionPending}
                      onClick={() => handleExecuteAction("PROCESS_PB")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Konfirmasi PB Diproses</span>
                    </button>
                  )}
                  {isWaitingParts && (
                    <>
                      <button
                        type="button"
                        disabled={isExecutionPending}
                        onClick={() => handleExecuteAction("PICKUP_STOCK")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>{stockPickedUp ? "Catat Ulang Pengambilan Stock" : "Catat Pengambilan Stock"}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isExecutionPending}
                        onClick={() => handleExecuteAction("START_WORK")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Wrench className="size-3.5" />
                        <span>Mulai Pekerjaan</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {isAuthor && isInProgress && (
              <CompletionEvidencePanel
                reportId={report.id}
                reportCode={report.reportCode}
                reportVersion={currentReportVersion}
                onVersionChange={setCurrentReportVersion}
                checklistPayload={report.checklistPayload}
                authorName={report.author.name}
                authorNik={report.author.NIK}
                disabled={isExecutionPending}
                onSuccess={() => {
                  setExecutionFeedback({
                    message: "Bukti penyelesaian lengkap tersimpan dan laporan berstatus Selesai.",
                    isError: false,
                  })
                  router.refresh()
                }}
              />
            )}

            {executionFeedback && (
              <p
                role={executionFeedback.isError ? "alert" : "status"}
                className={cn("text-[11px] font-semibold", executionFeedback.isError ? "text-rose-700" : "text-emerald-700")}
              >
                {executionFeedback.message}
              </p>
            )}
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
            {isPendingRequester && (
              <span className="inline-flex items-center rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 border border-purple-200">
                Review Requester
              </span>
            )}
            {isWaitingPju && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Menunggu PJU</Badge>}
            {isWaitingPb && (
              <span className="inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                Menunggu PB
              </span>
            )}
            {isWaitingParts && (
              <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-200">
                Menunggu Part
              </span>
            )}
            {isInProgress && (
              <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800 border border-indigo-200">
                Sedang Dikerjakan
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center rounded-lg bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-300">
                Draft
              </span>
            )}
            {needsRevision && (
              <span className="inline-flex items-center rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-900">
                Perlu Revisi
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">
                Ditolak
              </span>
            )}
            {report.workPermit && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>Izin Kerja: {report.workPermit.permitCode}</span>
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
              <span>{isCompleted ? "Laporan Final PDF" : "Lihat Draft PDF"}</span>
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

            {/* Intervensi Action (ES pembuat sebelum Selesai) */}
            {isAuthor && !isCompleted && (
              <Link
                href={`/dashboard/reports/${report.reportCode}/follow-up`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Wrench className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Intervensi</span>
              </Link>
            )}
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
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Periode:</span>
                  <span className="font-bold text-slate-900 text-right">{periodLabel}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Item terisi:</span>
                  <span className="font-bold text-slate-900">
                    {completeness.filledItems}
                    {completeness.expectedItems ? ` / ${completeness.expectedItems}` : ""} item
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Item bermasalah:</span>
                  <span className="font-bold text-rose-600">{itemsWithIssues.length} item</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Tindak lanjut:</span>
                  <span className={cn("font-bold text-right", completeness.followUpComplete ? "text-emerald-700" : "text-amber-700")}>
                    {completeness.followUpLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Bukti selesai:</span>
                  <span className={cn("font-bold text-right", completeness.evidenceComplete ? "text-emerald-700" : "text-amber-700")}>
                    {completeness.evidenceLabel}
                  </span>
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
                  <span className="font-bold text-[#ff8a2a]">
                    {totalEstimasi === null ? "-" : formatRupiah(totalEstimasi)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Realisasi:</span>
                  <span className="font-bold text-emerald-600">
                    {actualCost === null ? "-" : formatRupiah(actualCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selisih:</span>
                  <span className="font-bold text-indigo-600">
                    {costVariance === null ? "-" : formatRupiah(costVariance)}
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
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Review Coord:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {latestCoordApproval
                      ? latestCoordApproval.decision === "approve"
                        ? `Disetujui (${latestCoordApproval.actorName})`
                        : latestCoordApproval.decision === "reject_revision"
                          ? "Minta Revisi"
                          : "Ditolak"
                      : isCoord
                        ? "Menunggu Review"
                        : "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Review Manager:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {latestMgrApproval
                      ? latestMgrApproval.decision === "approve"
                        ? `Disetujui (${latestMgrApproval.actorName})`
                        : latestMgrApproval.decision === "reject_revision"
                          ? "Minta Revisi"
                          : "Ditolak"
                      : isManager
                        ? "Menunggu Review"
                        : "-"}
                  </span>
                </div>
                {(needsRequester || has065 || latestReqApproval) && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Review Requester:</span>
                    <span className="font-bold text-slate-800 text-right">
                      {latestReqApproval
                        ? latestReqApproval.decision === "approve"
                          ? `Disetujui (${latestReqApproval.actorName})`
                          : latestReqApproval.decision === "reject_revision"
                            ? "Minta Revisi"
                            : "Ditolak"
                        : isPendingRequester
                          ? "Menunggu Review"
                          : "-"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
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
              {workItems.length}
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
              {totalCombinedPhotosCount}
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
                        const condDisplay = getChecklistConditionDisplay(item.condition)
                        const badgeStyles: Record<typeof condDisplay.tone, string> = {
                          ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          danger: "bg-rose-50 text-rose-700 border-rose-200",
                          urgent: "bg-red-100 text-red-900 border-red-300",
                          warning: "bg-amber-50 text-amber-800 border-amber-200",
                          info: "bg-sky-50 text-sky-800 border-sky-200",
                          neutral: "bg-slate-100 text-slate-600 border-slate-200",
                        }
                        const estimate = getItemEstimate(item)

                        return (
                          <tr
                            key={item.id}
                            id={`item-row-${item.id}`}
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
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold text-xs border",
                                  badgeStyles[condDisplay.tone]
                                )}
                              >
                                <span>{condDisplay.shortLabel}</span>
                                {condDisplay.isFinding ? (
                                  <ChevronRight className="size-3 opacity-60" />
                                ) : null}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                              {estimate === null ? "—" : formatRupiah(estimate)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                              —
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

              {workItems.length === 0 ? (
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
                  {workItems.map((item, idx) => {
                    const followUp014 = getFollowUp014(item)
                    const materials = getMaterials014(followUp014)
                    const followUp065 = getFollowUp065(item)
                    const parts = Array.isArray(followUp065?.parts) ? followUp065.parts : []
                    const estimate = getItemEstimate(item)
                    const workType = followUp065?.jenis === "PENGGANTIAN_SPARE_PART"
                      ? "Penggantian Spare Part"
                      : followUp065?.jenis === "PERBAIKAN" ? "Perbaikan" : undefined

                    return (
                      <div key={item.id} className="py-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{item.label}</span>
                              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                {getChecklistConditionDisplay(item.condition).shortLabel}
                              </span>
                              {item.repairForm === REPAIR_TANPA_BIAYA && (
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-900">
                                  {REPAIR_TANPA_BIAYA_LABEL}
                                </Badge>
                              )}
                            </div>
                            {item.notes && <p className="mt-1 text-xs text-slate-500">Catatan: {item.notes}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">
                              {estimate === null ? "—" : formatRupiah(estimate)}
                            </p>
                            <p className="text-[10px] text-slate-400">Estimasi Biaya</p>
                          </div>
                        </div>

                        {followUp014 && (
                          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                            <h4 className="font-bold text-slate-900">
                              Form 014 · Estimasi Biaya Sipil &amp; ME
                            </h4>
                            {materials.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[540px] text-left">
                                  <thead className="border-b border-slate-200 text-slate-600">
                                    <tr>
                                      <th scope="col" className="p-2">Material / Pekerjaan</th>
                                      <th scope="col" className="p-2 text-right">Jumlah</th>
                                      <th scope="col" className="p-2">Satuan</th>
                                      <th scope="col" className="p-2 text-right">Harga Satuan</th>
                                      <th scope="col" className="p-2 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {materials.map((material, index) => {
                                      const quantity = readMaterialNumber(material.jumlah)
                                      const unitPrice = readMaterialNumber(material.hargaUnit)
                                      const subtotal = getMaterialSubtotal(material)

                                      return (
                                        <tr key={material.id || index}>
                                          <td className="p-2">{material.namaBarang || "—"}</td>
                                          <td className="p-2 text-right">{quantity ?? "—"}</td>
                                          <td className="p-2">{material.satuan || "—"}</td>
                                          <td className="whitespace-nowrap p-2 text-right">
                                            {unitPrice === null ? "—" : formatRupiah(unitPrice)}
                                          </td>
                                          <td className="whitespace-nowrap p-2 text-right">
                                            {subtotal === null ? "—" : formatRupiah(subtotal)}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-slate-600">Belum ada rincian material tersimpan.</p>
                            )}
                            {followUp014.catatan && (
                              <p className="whitespace-pre-line text-slate-600">Catatan estimasi: {followUp014.catatan}</p>
                            )}
                            <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 font-bold">
                              <span>Total Estimasi Form 014</span>
                              <span>{estimate === null ? "—" : formatRupiah(estimate)}</span>
                            </div>
                          </div>
                        )}

                        {followUp065 && (
                          <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                            <h4 className="font-bold text-slate-900">{FORM_065_LABEL}</h4>
                            <dl className="grid gap-3 sm:grid-cols-2">
                              {[
                                ["Jenis pekerjaan", workType],
                                ["Unit / Equipment", followUp065.namaUnit],
                                ["Merk / Brand", followUp065.merk],
                                ["No. Unit / Asset", followUp065.nomorUnit],
                                ["No. Tiket Problem", followUp065.nomorTiketProblem],
                                ["Analisa kerusakan", followUp065.analisa],
                                ["Tindakan", followUp065.tindakan],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <dt className="text-slate-500">{label}</dt>
                                  <dd className="mt-0.5 break-words font-semibold text-slate-900">{value || "—"}</dd>
                                </div>
                              ))}
                            </dl>
                            {parts.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[420px] text-left">
                                  <thead className="border-b border-slate-200 text-slate-600">
                                    <tr>
                                      <th className="p-2">Spare Part</th>
                                      <th className="p-2">No. Part / Seri</th>
                                      <th className="p-2">Asal Part</th>
                                      <th className="p-2 text-right">Jumlah</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {parts.map((part, partIndex) => (
                                      <tr key={part.id || partIndex}>
                                        <td className="p-2">{part.namaPart || "—"}</td>
                                        <td className="p-2">{part.nomorPart || "—"}</td>
                                        <td className="p-2">
                                          {part.asalPart === "STOCK" ? "Stock Gudang" : part.asalPart === "PB" ? "PB (Pengadaan Baru)" : "—"}
                                        </td>
                                        <td className="p-2 text-right">{part.jumlahPart ?? "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab("checklist")
                                  setTimeout(() => {
                                    const el = document.getElementById(`item-row-${item.id}`)
                                    if (el) {
                                      el.scrollIntoView({ behavior: "smooth", block: "center" })
                                      el.classList.add("bg-amber-100/60")
                                      setTimeout(() => el.classList.remove("bg-amber-100/60"), 2000)
                                    }
                                  }, 60)
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff8a2a] hover:underline"
                              >
                                <ExternalLink className="size-3.5" />
                                <span>Buka Temuan Checklist Terkait ({item.label})</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {storedEvidence && (storedEvidence.form014 || storedEvidence.form065) && (
              <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                    Bukti Penyelesaian Pekerjaan
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Dilaporkan oleh {storedEvidence.submittedByName || storedEvidence.submittedByNik || "-"} ·{" "}
                    {storedEvidence.submittedAt ? formatIndoDateTime(storedEvidence.submittedAt) : "-"}
                  </span>
                </div>
                {storedEvidence.form014 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 space-y-1.5">
                    <p className="font-bold text-orange-950">
                      Form 014 · Actual Pembelian Barang: {formatRupiah(storedEvidence.form014.actualPurchaseAmount)}
                    </p>
                    <p className="text-slate-700">
                      Foto Saat Pekerjaan: {storedEvidence.form014.workPhotos.length} | Foto Bon Pembelian:{" "}
                      {storedEvidence.form014.receiptPhotos.length} | Bukti Transfer Pengembalian:{" "}
                      {storedEvidence.form014.refundTransferPhotos.length}
                    </p>
                  </div>
                )}
                {storedEvidence.form065 && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-1.5">
                    <p className="font-bold text-indigo-950">
                      Form 065 · Serah Terima Unit:{" "}
                      {storedEvidence.form065.handoverConfirmed ? "Terkonfirmasi" : "Belum"} (Penerima:{" "}
                      {storedEvidence.form065.handoverRecipient})
                    </p>
                    {storedEvidence.form065.handoverNotes && (
                      <p className="text-slate-700">Catatan serah terima: {storedEvidence.form065.handoverNotes}</p>
                    )}
                    <p className="text-slate-700">
                      Foto dengan Unit: {storedEvidence.form065.repairWithUnitPhotos.length} | Foto Selfie dengan User:{" "}
                      {storedEvidence.form065.selfieWithUserPhotos.length}
                    </p>
                  </div>
                )}
                {storedEvidence.notes && (
                  <p className="text-slate-600">Catatan penyelesaian: {storedEvidence.notes}</p>
                )}
              </div>
            )}
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

            {completionPhotoCount > 0 && storedEvidence && (
              <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                  Galeri Foto Bukti Penyelesaian Pekerjaan
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dokumentasi pelaksanaan perbaikan, bon pembelian, bukti transfer pengembalian, dan serah terima unit.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {[
                    ...(storedEvidence.form014
                      ? [
                          { label: COMPLETION_EVIDENCE_LABELS.WORK_PROGRESS, photos: storedEvidence.form014.workPhotos },
                          { label: COMPLETION_EVIDENCE_LABELS.PURCHASE_RECEIPT, photos: storedEvidence.form014.receiptPhotos },
                          { label: COMPLETION_EVIDENCE_LABELS.REFUND_TRANSFER, photos: storedEvidence.form014.refundTransferPhotos },
                        ]
                      : []),
                    ...(storedEvidence.form065
                      ? [
                          { label: COMPLETION_EVIDENCE_LABELS.REPAIR_UNIT, photos: storedEvidence.form065.repairWithUnitPhotos },
                          { label: COMPLETION_EVIDENCE_LABELS.USER_SELFIE, photos: storedEvidence.form065.selfieWithUserPhotos },
                        ]
                      : []),
                  ].flatMap((group) =>
                    group.photos.map((photo, pIdx) => (
                      <div
                        key={`comp-${photo.fileId}-${pIdx}`}
                        onClick={() =>
                          setSelectedPhoto({
                            url: photo.url,
                            title: `${group.label} (${pIdx + 1})`,
                          })
                        }
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:border-[#ff8a2a] transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={group.label}
                          className="aspect-square size-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                          <p className="line-clamp-1 text-[10px] font-bold">{group.label}</p>
                          <p className="text-[9px] text-slate-300 font-mono">{photo.fileId.slice(0, 8)}</p>
                        </div>
                      </div>
                    )),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. Tab Content: Riwayat Aktivitas */}
        {activeTab === "riwayat" && (
          <div className="mt-5 space-y-4">
            <RevisionHistory revisions={report.revisions} />
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

                {!isDraft && !report.revisions.length && (
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

                {/* Riwayat Approval Multilevel */}
                {normalizedApproval.map((app, idx) => {
                  const isApprove = app.decision === "approve"
                  const isRevision = app.decision === "reject_revision"
                  return (
                    <div key={`approval-${idx}`} className="relative pl-6">
                      <div className={cn(
                        "absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white",
                        isApprove ? "bg-emerald-600" : isRevision ? "bg-amber-500" : "bg-rose-600"
                      )} />
                      <p className="text-xs font-bold text-slate-900">
                        {isApprove
                          ? `Disetujui oleh ${app.role} (${app.actorName})`
                          : isRevision
                            ? `Minta Revisi oleh ${app.role} (${app.actorName})`
                            : `Ditolak oleh ${app.role} (${app.actorName})`}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tahap: {app.stage || "-"} · NIK: {app.actorNik || "-"}
                        {app.notes ? ` · Catatan: "${app.notes}"` : ""}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {formatIndoDateTime(app.decidedAt)}
                      </p>
                    </div>
                  )
                })}

                {/* Riwayat Pelaksanaan Pekerjaan */}
                {normalizedExecution.map((ex, idx) => (
                  <div key={`exec-${idx}`} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-white bg-blue-600" />
                    <p className="text-xs font-bold text-slate-900">
                      {ex.actionLabel} · {ex.actorName} ({ex.actorNik})
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Status: {ex.previousStatus} → {ex.nextStatus}
                      {ex.referenceNo ? ` · Ref: ${ex.referenceNo}` : ""}
                      {ex.notes ? ` · Catatan: "${ex.notes}"` : ""}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {formatIndoDateTime(ex.performedAt)}
                    </p>
                  </div>
                ))}

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

              {canReview && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isReviewPending}
                    onClick={() => openReviewDecision("approve")}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="mr-1.5 size-4" />
                    {userRole === "COORD"
                      ? "Validasi & Teruskan ke Manager"
                      : userRole === "MANAGER"
                        ? needsRequester
                          ? "Setujui & Teruskan ke Requester (WHM/DWHM)"
                          : "Setujui Final"
                        : hasForm014 ? "Setujui Estimasi Form 014" : "Setujui Form 065"}
                  </button>
                  <button
                    type="button"
                    disabled={isReviewPending}
                    onClick={() => openReviewDecision("reject_revision")}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                  >
                    <RefreshCw className="mr-1.5 size-4" />
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    disabled={isReviewPending}
                    onClick={() => openReviewDecision("reject")}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-5 text-xs font-bold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <X className="mr-1.5 size-4" />
                    Tolak Laporan
                  </button>
                </div>
              )}

              {!canReview && (
                <p className="mt-4 text-xs text-slate-600">
                  Laporan ini tidak sedang menunggu keputusan akunmu.
                </p>
              )}

              {canReview && reviewDecision && (
                <div className="mt-4 rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold">
                    {reviewDecision === "approve"
                      ? userRole === "COORD"
                        ? "Teruskan laporan ini ke Manager?"
                        : userRole === "MANAGER"
                          ? needsRequester
                            ? "Setujui dan teruskan laporan ke Requester (WHM/DWHM)?"
                            : "Setujui laporan ini secara final?"
                          : hasForm014
                            ? "Setujui Form 014 dan lanjut ke tahap Menunggu PJU?"
                            : "Setujui Form 065 ini?"
                      : reviewDecision === "reject_revision"
                        ? "Kembalikan laporan untuk revisi?"
                        : "Tolak laporan ini?"}
                  </p>
                  <label className="mt-3 block text-xs font-medium">
                    {reviewDecision === "approve"
                      ? "Catatan persetujuan (opsional)"
                      : "Catatan keputusan (wajib)"}
                    <Textarea
                      className="mt-1.5"
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      disabled={isReviewPending}
                      placeholder={
                        reviewDecision === "approve"
                          ? "Tambahkan catatan persetujuan jika diperlukan..."
                          : "Tuliskan alasan revisi atau penolakan..."
                      }
                      rows={3}
                    />
                  </label>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={isReviewPending}
                      onClick={() => setReviewDecision(null)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isReviewPending}
                      onClick={confirmReviewDecision}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {isReviewPending ? "Memproses..." : "Konfirmasi"}
                    </button>
                  </div>
                </div>
              )}

              {reviewFeedback && (
                <p
                  role={reviewFeedback.isError ? "alert" : "status"}
                  className={cn("mt-3 text-xs font-semibold", reviewFeedback.isError ? "text-rose-700" : "text-emerald-700")}
                >
                  {reviewFeedback.message}
                </p>
              )}
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
