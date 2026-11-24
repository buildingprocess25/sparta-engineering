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
  ExternalLink,
  FileText,
  Home,
  Info,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Wrench,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChecklistStatusBadge } from "@/components/es-dashboard/checklist-status-badge"
import { CompletionEvidencePanel } from "@/components/es-dashboard/completion-evidence-panel"
import { WORK_PERMIT_STATUS_LABELS } from "@/lib/work-permits/status-labels"
import type { WorkPermitStatus } from "@/generated/prisma"
import type { ChecklistPayload, ChecklistPayloadItem } from "@/lib/checklists/payload"
import { getChecklistConditionDisplay } from "@/lib/checklists/condition-display"
import { PALLET_MOVER_WEEKLY_CATEGORIES } from "@/lib/checklists/frm-ts-045"
import { FORKLIFT_WEEKLY_CATEGORIES } from "@/lib/checklists/frm-ts-043"
import { PALLET_MOVER_CATEGORIES } from "@/lib/checklists/frm-ts-016"
import { FORKLIFT_MONTHLY_CATEGORIES } from "@/lib/checklists/frm-ts-029"
import { GENSET_CATEGORIES } from "@/lib/checklists/frm-ts-022"
import { getChecklistConfig } from "@/lib/checklists/registry"
import {
  FORM_014_LABEL,
  FORM_065_LABEL,
  getReportItems,
  REPAIR_TANPA_BIAYA,
  REPAIR_TANPA_BIAYA_LABEL,
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
import { RevisionHistory } from "@/components/reports/checklist-revision-history"
import { executeReportSparePartAction } from "@/app/dashboard/reports/actions"

function formatIndoWib(dateInput?: string | null): string {
  if (!dateInput) return "-"
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return "-"
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d) + " WIB"
  )
}

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
    approvalHistory?: unknown
    executionHistory?: unknown
    revisions: ChecklistRevisionHistory[]
    workPermit?: {
      id: string
      permitCode: string
      status: WorkPermitStatus
    } | null
  }
  userRole?: string
  revisionUrl?: string | null
  canEditRevision?: boolean
  followUp?: { href: string; label: string }
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
  revisionUrl,
  canEditRevision,
  followUp,
}: EsFormDetailViewProps) {
  const router = useRouter()
  const [previewPhoto, setPreviewPhoto] = React.useState<PreviewPhoto | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({})
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
          setExecutionFeedback({ message: result.error || "Gagal memproses aksi pelaksanaan.", isError: true })
          return
        }
        setExecReferenceNo("")
        setExecNotes("")
        setExecutionFeedback({ message: result.message || "Aksi berhasil diproses.", isError: false })
        router.refresh()
      } catch {
        setExecutionFeedback({ message: "Gagal memproses aksi pelaksanaan.", isError: true })
      }
    })
  }

  const payload = (report.checklistPayload as ChecklistPayload) || {}
  const rawItems: ChecklistPayloadItem[] = React.useMemo(() => getReportItems(report.checklistPayload), [report.checklistPayload])
  const activeRevision = report.revisions.find((entry) => !entry.resubmittedAt)
  const isRevision = report.status === "NEEDS_REVISION"
  const permitStatus = report.workPermit?.status
  const permitApproved = permitStatus === "APPROVED" || permitStatus === "COMPLETED"
  const PermitIcon = permitApproved ? ShieldCheck : Shield

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

  const periodLabel = React.useMemo(
    () =>
      formatChecklistPeriodLabel(
        report.period || payload.period,
        report.periodKey || payload.periodKey,
        payload.subPeriodLabel,
      ),
    [report.period, report.periodKey, payload.period, payload.periodKey, payload.subPeriodLabel],
  )

  const completeness = React.useMemo(
    () =>
      getReportCompletenessSummary({
        status: report.status,
        checklistPayload: report.checklistPayload,
        expectedItems: formConfig?.items?.length ?? null,
      }),
    [report.status, report.checklistPayload, formConfig?.items?.length],
  )
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
  const pjuRecorded = hasExecutionAction(report.executionHistory, "PROCESS_PJU")
  const stockPickedUp = hasExecutionAction(report.executionHistory, "PICKUP_STOCK")

  // Count conditions
  const conditionStats = React.useMemo(() => {
    let baik = 0
    let rusak = 0
    let other = 0
    for (const it of rawItems) {
      const display = getChecklistConditionDisplay(it.condition)
      if (display.tone === "ok") baik++
      else if (display.isFinding && display.code !== "C") rusak++
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
    <div className="es-report-surface min-h-screen bg-[#fafaf9] text-[#111111] antialiased">
      {/* 1. Mobile-friendly Top Navigation Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#e8e8e6] bg-white/95 px-4 backdrop-blur-md">
        <Link
          href={isRevision ? "/dashboard/activity?tab=revision" : "/dashboard"}
          className="inline-flex size-9 items-center justify-center rounded-xl bg-[#f5f5f3] text-[#111111] transition-transform active:scale-95"
          aria-label={isRevision ? "Kembali ke Perlu Revisi" : "Kembali ke Dashboard"}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707784]">
            Detail Laporan
          </span>
          <span className="font-mono text-xs font-bold text-[#111111]">
            {report.reportCode}
          </span>
        </div>

        <ChecklistStatusBadge status={report.status} />
      </header>

      {/* 2. Main Form Content Wrapper */}
      <main className="mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {followUp && (
          <div className="flex flex-col items-start gap-2">
            <Alert role="status">
              <AlertTitle>Form tindak lanjut belum lengkap</AlertTitle>
              <AlertDescription>Lengkapi form agar BEC bisa meninjau laporan ini.</AlertDescription>
            </Alert>
            <Button nativeButton={false} size="lg" render={<Link href={followUp.href} />}>
              {followUp.label}
            </Button>
          </div>
        )}
        {isRevision && (
          <section className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h2 className="text-sm font-bold text-orange-900">Perlu Revisi</h2>
            <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
              {activeRevision?.reason ?? "Alasan revisi sebelumnya tidak tersimpan."}
            </p>
            {revisionUrl && canEditRevision && (
              <Button nativeButton={false} size="lg" render={<Link href={revisionUrl} />}>
                Perbaiki Laporan
              </Button>
            )}
            {revisionUrl && !canEditRevision && (
              <div className="space-y-2">
                <p className="text-sm text-slate-700">Aktifkan Izin Kerja bulan ini untuk memperbaiki laporan.</p>
                <Button nativeButton={false} size="lg" variant="outline" render={<Link href="/dashboard/reports/new/work-permit" />}>
                  Buka Izin Kerja
                </Button>
              </div>
            )}
          </section>
        )}
        <RevisionHistory revisions={report.revisions.filter((entry) => entry.resubmittedAt)} />
        {(report.status === "WAITING_PJU" ||
          report.status === "WAITING_PB" ||
          report.status === "WAITING_PARTS" ||
          report.status === "IN_PROGRESS") && (
          <Card>
            <CardHeader>
              <CardTitle>
                {report.status === "WAITING_PJU"
                  ? "Proses PJU Online (Form 014)"
                  : report.status === "WAITING_PB"
                    ? "Pengadaan Baru (PB)"
                    : report.status === "WAITING_PARTS"
                      ? "Pengambilan Stock & Penyiapan Unit"
                      : "Pelaksanaan & Bukti Penyelesaian"}
              </CardTitle>
              <CardDescription>
                {report.status === "WAITING_PJU"
                  ? "Catat nomor/keterangan PJU Online terlebih dahulu sebelum memulai pekerjaan lapangan."
                  : report.status === "WAITING_PB"
                    ? "Catat proses pengadaan PB setelah konfirmasi dari logistik."
                    : report.status === "WAITING_PARTS"
                      ? "Catat pengambilan stock barang bila diperlukan, lalu pastikan Izin Kerja bulan berjalan aktif sebelum memulai pekerjaan."
                      : "Lengkapi seluruh bukti penyelesaian pekerjaan untuk menutup laporan menjadi Selesai."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {report.status !== "IN_PROGRESS" && (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={execReferenceNo}
                      disabled={isExecutionPending}
                      onChange={(e) => setExecReferenceNo(e.target.value)}
                      placeholder={
                        report.status === "WAITING_PJU"
                          ? "No. PJU Online (opsional)"
                          : report.status === "WAITING_PB"
                            ? "No. PB / Pengadaan (opsional)"
                            : "No. Referensi / Dokumen (opsional)"
                      }
                    />
                    <Input
                      value={execNotes}
                      disabled={isExecutionPending}
                      onChange={(e) => setExecNotes(e.target.value)}
                      placeholder="Catatan tahap pelaksanaan (opsional)"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {report.status === "WAITING_PJU" && (
                      <>
                        <Button
                          disabled={isExecutionPending}
                          variant={pjuRecorded ? "outline" : "default"}
                          onClick={() => handleExecuteAction("PROCESS_PJU")}
                          size="lg"
                        >
                          {pjuRecorded ? "Catat Ulang Proses PJU Online" : "Catat Proses PJU Online"}
                        </Button>
                        {pjuRecorded && (
                          <Button
                            disabled={isExecutionPending}
                            onClick={() => handleExecuteAction("START_WORK")}
                            size="lg"
                          >
                            Mulai Pekerjaan Perbaikan
                          </Button>
                        )}
                      </>
                    )}
                    {report.status === "WAITING_PB" && (
                      <Button
                        disabled={isExecutionPending}
                        onClick={() => handleExecuteAction("PROCESS_PB")}
                        size="lg"
                      >
                        Konfirmasi PB Diproses / Part Siap
                      </Button>
                    )}
                    {report.status === "WAITING_PARTS" && (
                      <>
                        <Button
                          disabled={isExecutionPending}
                          variant={stockPickedUp ? "outline" : "secondary"}
                          onClick={() => handleExecuteAction("PICKUP_STOCK")}
                          size="lg"
                        >
                          {stockPickedUp
                            ? "Catat Ulang Pengambilan Stock"
                            : "Catat Pengambilan Stock Barang"}
                        </Button>
                        <Button
                          disabled={isExecutionPending}
                          onClick={() => handleExecuteAction("START_WORK")}
                          size="lg"
                        >
                          Mulai Pekerjaan Perbaikan
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}

              {report.status === "IN_PROGRESS" && (
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
                  className={cn(
                    "text-xs font-semibold",
                    executionFeedback.isError ? "text-rose-700" : "text-emerald-700",
                  )}
                >
                  {executionFeedback.message}
                </p>
              )}
            </CardContent>
          </Card>
        )}
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
                {periodLabel}
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

          <div className="flex flex-col gap-3 pt-3">
            {report.workPermit && (
              <>
                <Separator />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg",
                      permitApproved ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground",
                    )}>
                      <PermitIcon className="size-4" aria-hidden="true" />
                    </span>
                    <dl className="min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">Izin Kerja K3</dt>
                      <dd className="break-words text-sm font-semibold">{report.workPermit.permitCode}</dd>
                    </dl>
                  </div>
                  <Badge
                    variant={permitStatus === "REJECTED" ? "destructive" : "outline"}
                    className={permitApproved ? "border-emerald-200 bg-emerald-100 text-emerald-900" : undefined}
                  >
                    {WORK_PERMIT_STATUS_LABELS[report.workPermit.status]}
                  </Badge>
                </div>
              </>
            )}
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0" aria-hidden="true" />
              Mode baca · Isian yang sudah dikirim hanya bisa dilihat.
            </p>
          </div>
        </div>

        {/* Summary Condition Counts & Completeness Bar */}
        <div className="flex flex-col gap-2 rounded-xl border border-[#dedede] bg-white p-3 shadow-xs text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111111]">Total Titik Periksa</span>
              <p className="text-[11px] text-[#707784]">
                {completeness.filledItems}
                {completeness.expectedItems ? ` / ${completeness.expectedItems}` : ""} item checklist
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[11px]">
                {conditionStats.baik} Baik
              </span>
              {conditionStats.rusak > 0 && (
                <span className="rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[11px]">
                  {conditionStats.rusak} Bermasalah
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#f0f0f0] pt-2">
            <Badge
              variant="outline"
              className={
                completeness.followUpComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }
            >
              Tindak Lanjut: {completeness.followUpLabel}
            </Badge>
            <Badge
              variant="outline"
              className={
                completeness.evidenceComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }
            >
              {completeness.evidenceLabel}
            </Badge>
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
                      const display = getChecklistConditionDisplay(item.condition)
                      const isAction = display.isFinding
                      const photos = Array.isArray(item.photos) ? item.photos : []
                      const pillClasses: Record<typeof display.tone, string> = {
                        ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
                        danger: "border-rose-200 bg-rose-50 text-rose-700",
                        urgent: "border-red-300 bg-red-100 text-red-900",
                        warning: "border-amber-200 bg-amber-50 text-amber-800",
                        info: "border-sky-200 bg-sky-50 text-sky-800",
                        neutral: "border-slate-200 bg-slate-100 text-slate-700",
                      }

                      return (
                        <div key={item.id} className="p-3.5 space-y-3">
                          {/* Item Label & Read-Only Condition Pill */}
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#111111]">{item.label}</p>
                              {item.id && (
                                <p className="text-[10px] text-[#888888] font-mono">
                                  ID: {item.id}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-start sm:self-center">
                              <span
                                className={cn(
                                  "rounded-lg border px-3 py-1.5 text-xs font-bold",
                                  pillClasses[display.tone]
                                )}
                              >
                                {display.label}
                              </span>
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
                                            unoptimized
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

                              {item.repairForm || item.repairFormName ? (
                                <dl className="flex flex-col gap-1.5">
                                  <dt className="text-xs font-medium text-muted-foreground">Form tindak lanjut</dt>
                                  <dd>
                                    <Badge variant="outline" className="h-auto max-w-full whitespace-normal border-orange-200 bg-orange-50 text-orange-900">
                                      <Wrench data-icon="inline-start" aria-hidden="true" />
                                      <span>
                                        {item.repairForm === REPAIR_TANPA_BIAYA
                                          ? REPAIR_TANPA_BIAYA_LABEL
                                          : item.repairForm?.includes("065")
                                            ? FORM_065_LABEL
                                            : item.repairForm?.includes("014")
                                              ? FORM_014_LABEL
                                              : item.repairFormName || item.repairForm}
                                      </span>
                                    </Badge>
                                  </dd>
                                </dl>
                              ) : null}
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

        {/* Stored Completion Evidence Summary */}
        {storedEvidence && (storedEvidence.form014 || storedEvidence.form065) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bukti Penyelesaian Tersimpan</CardTitle>
              <CardDescription>
                Dilaporkan oleh {storedEvidence.submittedByName || storedEvidence.submittedByNik || "-"} pada{" "}
                {formatIndoWib(storedEvidence.submittedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              {storedEvidence.form014 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 flex flex-col gap-2">
                  <p className="font-bold text-orange-950">
                    Actual Pembelian Barang (Form 014): Rp{" "}
                    {storedEvidence.form014.actualPurchaseAmount.toLocaleString("id-ID")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: COMPLETION_EVIDENCE_LABELS.WORK_PROGRESS, photos: storedEvidence.form014.workPhotos },
                      { label: COMPLETION_EVIDENCE_LABELS.PURCHASE_RECEIPT, photos: storedEvidence.form014.receiptPhotos },
                      { label: COMPLETION_EVIDENCE_LABELS.REFUND_TRANSFER, photos: storedEvidence.form014.refundTransferPhotos },
                    ].map((group) =>
                      group.photos.map((photo, idx) => (
                        <button
                          key={photo.fileId}
                          type="button"
                          onClick={() => setPreviewPhoto({ itemLabel: `${group.label} (${idx + 1})`, url: photo.url })}
                          className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <Image unoptimized src={photo.url} alt={group.label} fill sizes="120px" className="object-cover" />
                        </button>
                      )),
                    )}
                  </div>
                </div>
              )}
              {storedEvidence.form065 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 flex flex-col gap-2">
                  <p className="font-bold text-indigo-950">
                    Serah Terima Unit (Form 065): {storedEvidence.form065.handoverRecipient}
                  </p>
                  {storedEvidence.form065.handoverNotes && (
                    <p className="text-slate-700">{storedEvidence.form065.handoverNotes}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: COMPLETION_EVIDENCE_LABELS.REPAIR_UNIT, photos: storedEvidence.form065.repairWithUnitPhotos },
                      { label: COMPLETION_EVIDENCE_LABELS.USER_SELFIE, photos: storedEvidence.form065.selfieWithUserPhotos },
                    ].map((group) =>
                      group.photos.map((photo, idx) => (
                        <button
                          key={photo.fileId}
                          type="button"
                          onClick={() => setPreviewPhoto({ itemLabel: `${group.label} (${idx + 1})`, url: photo.url })}
                          className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <Image unoptimized src={photo.url} alt={group.label} fill sizes="120px" className="object-cover" />
                        </button>
                      )),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approval & Execution Timelines */}
        {(normalizedApproval.length > 0 || normalizedExecution.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Histori Persetujuan &amp; Pelaksanaan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              {normalizedApproval.map((entry, idx) => (
                <div key={`app-${idx}`} className="flex flex-col gap-0.5 border-l-2 border-emerald-400 pl-3">
                  <span className="font-bold text-slate-900">
                    {entry.decision === "approve"
                      ? `Disetujui ${entry.role} (${entry.actorName})`
                      : entry.decision === "reject_revision"
                        ? `Minta Revisi ${entry.role} (${entry.actorName})`
                        : `Ditolak ${entry.role} (${entry.actorName})`}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatIndoWib(entry.decidedAt)}
                    {entry.notes ? ` · "${entry.notes}"` : ""}
                  </span>
                </div>
              ))}
              {normalizedExecution.map((entry, idx) => (
                <div key={`exec-${idx}`} className="flex flex-col gap-0.5 border-l-2 border-blue-400 pl-3">
                  <span className="font-bold text-slate-900">
                    {entry.actionLabel} · {entry.actorName} ({entry.actorNik})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatIndoWib(entry.performedAt)}
                    {entry.referenceNo ? ` · Ref: ${entry.referenceNo}` : ""}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
              unoptimized
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
