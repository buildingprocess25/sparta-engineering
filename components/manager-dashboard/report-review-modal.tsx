"use client"

import * as React from "react"
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  FileCheck2,
  HardHat,
  History,
  Image as ImageIcon,
  MapPin,
  RotateCcw,
  Shield,
  User,
  Wrench,
  X,
  XCircle,
} from "lucide-react"

import type { RealReportItem } from "@/lib/manager-dashboard-types"
import { reviewReportDecision } from "@/app/dashboard/reports/actions"
import { cn } from "@/lib/utils"

interface ReportReviewModalProps {
  report: RealReportItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  viewerRole?: string
}

type DialogMode = "NONE" | "APPROVE" | "REVISION" | "REJECT"

export function ReportReviewModal({
  report,
  isOpen,
  onClose,
  onSuccess,
  viewerRole = "MANAGER",
}: ReportReviewModalProps) {
  const [activeTab, setActiveTab] = React.useState<"checklist" | "defect" | "history">("checklist")
  const [activeDialog, setActiveDialog] = React.useState<DialogMode>("NONE")
  const [decisionNotes, setDecisionNotes] = React.useState("")
  const [notesError, setNotesError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [feedbackToast, setFeedbackToast] = React.useState<{ text: string; error?: boolean } | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab("checklist")
      setActiveDialog("NONE")
      setDecisionNotes("")
      setNotesError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, report?.id])

  if (!isOpen || !report) return null

  let itemsList: any[] = []
  if (
    report.checklistPayload &&
    typeof report.checklistPayload === "object" &&
    Array.isArray((report.checklistPayload as any).items)
  ) {
    itemsList = (report.checklistPayload as any).items
  }

  const defectiveItems = itemsList.filter(
    (i) => i.condition === "RUSAK" || i.condition === "REPAIR"
  )

  const isPendingCoord = report.status === "PENDING_COORD"
  const isPendingManager = report.status === "PENDING_MANAGER"
  const isCompleted = report.status === "COMPLETED"
  const isDraft = report.status === "DRAFT"
  const isRejected = report.status === "REJECTED"

  const canApprove = isPendingCoord || isPendingManager

  const handleConfirmDecision = async () => {
    if (activeDialog === "REVISION" && !decisionNotes.trim()) {
      setNotesError("Catatan revisi wajib diisi agar teknisi tahu apa yang perlu diperbaiki.")
      return
    }

    if (activeDialog === "REJECT" && !decisionNotes.trim()) {
      setNotesError("Alasan penolakan laporan wajib diisi.")
      return
    }

    setIsSubmitting(true)
    let decision: "approve" | "reject_revision" | "reject" = "approve"
    if (activeDialog === "REVISION") decision = "reject_revision"
    if (activeDialog === "REJECT") decision = "reject"

    const res = await reviewReportDecision(report.id, decision, decisionNotes.trim())
    setIsSubmitting(false)

    if (res.error) {
      setFeedbackToast({ text: res.error, error: true })
      setTimeout(() => setFeedbackToast(null), 4000)
    } else {
      setFeedbackToast({ text: res.message || "Berhasil memproses keputusan." })
      setActiveDialog("NONE")
      if (onSuccess) onSuccess()
      setTimeout(() => {
        setFeedbackToast(null)
        onClose()
      }, 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Review Workbench Container (BMC/BNM Pattern) */}
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Toast Alert */}
        {feedbackToast && (
          <div
            className={cn(
              "px-5 py-3 text-xs font-bold border-b flex items-center justify-between",
              feedbackToast.error
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}
          >
            <span>{feedbackToast.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                  {report.reportCode || "Laporan Tanpa Kode"}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300">
                  Form: {report.formCode || "FRM_TSM_005"}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300">
                  {report.area.name} ({report.area.type})
                </span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    isPendingCoord && "bg-sky-500/20 text-sky-300 border border-sky-500/30",
                    isPendingManager && "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                    isCompleted && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
                    isDraft && "bg-slate-700 text-slate-300",
                    isRejected && "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  )}
                >
                  {report.status.replace("_", " ")}
                </span>
              </div>

              <h2 className="mt-2 text-base sm:text-lg font-bold text-white leading-tight">
                {report.checklistPayload?.formName ||
                  `Laporan Pemeliharaan Area ${report.area.name}`}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Tutup jendela review"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Workbench Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-colors",
              activeTab === "checklist"
                ? "border-[#ff8a2a] text-slate-900 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <FileCheck2 className="size-4 text-emerald-600" />
            <span>1. Hasil Checklist ({itemsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("defect")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-colors",
              activeTab === "defect"
                ? "border-[#ff8a2a] text-slate-900 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Wrench className="size-4 text-rose-600" />
            <span>2. Temuan Rusak & Estimasi ({defectiveItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-colors",
              activeTab === "history"
                ? "border-[#ff8a2a] text-slate-900 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <History className="size-4 text-purple-600" />
            <span>3. Audit Log Approval</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: HASIL CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="space-y-4">
              {/* Meta row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teknisi ES (Author)</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{report.author.name}</p>
                  <p className="text-[11px] text-slate-500">NIK: {report.author.NIK} • {report.author.branchName}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lokasi / Fasilitas</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">Area {report.area.name}</p>
                  <p className="text-[11px] text-slate-500">Ruangan: {report.room?.name || "Semua Ruangan Area"}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Inspeksi</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {new Date(report.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500">Periode: {report.period || "MONTHLY"} ({report.periodKey || "-"})</p>
                </div>
              </div>

              {/* Checklist Parameters Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Parameter Cek</th>
                      <th className="py-2.5 px-3">Kondisi</th>
                      <th className="py-2.5 px-3">Catatan Temuan</th>
                      <th className="py-2.5 px-3 text-right">Foto Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Data checklist belum diisi atau masih draft awal.
                        </td>
                      </tr>
                    ) : (
                      itemsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.label || item.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                                item.condition === "BAIK" && "bg-emerald-100 text-emerald-800",
                                item.condition === "RUSAK" && "bg-rose-100 text-rose-800",
                                item.condition === "REPAIR" && "bg-amber-100 text-amber-800",
                                !item.condition && "bg-slate-100 text-slate-700"
                              )}
                            >
                              {item.condition || "BAIK"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.notes || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {item.photos && item.photos.length > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                                <ImageIcon className="size-3" />
                                {item.photos.length} Foto
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TEMUAN RUSAK & ESTIMASI */}
          {activeTab === "defect" && (
            <div className="space-y-4">
              {defectiveItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50">
                  <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
                  <p className="mt-2 text-xs font-bold text-slate-800">
                    Tidak Ditemukan Kerusakan Fisik
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Seluruh item checklist berstatus BAIK. Tidak memerlukan form estimasi biaya perbaikan.
                  </p>
                </div>
              ) : (
                defectiveItems.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-rose-200 bg-rose-50/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                          {item.condition}
                        </span>
                        <h4 className="text-xs font-black text-slate-900">{item.label}</h4>
                      </div>
                      {item.handler && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Pelaksana: <span className="font-bold text-slate-800">{item.handler}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white rounded-lg p-3 border border-slate-200">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Catatan Masalah</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{item.notes || "Perlu perbaikan"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Form Tindak Lanjut</p>
                        <p className="font-semibold text-sky-700 mt-0.5">{item.repairFormName || item.repairForm || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOG APPROVAL */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 size-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-900">1. Laporan Disubmit oleh Teknisi ES</p>
                  <p className="text-[11px] text-slate-500">
                    Oleh: {report.author.name} ({report.author.NIK}) • {new Date(report.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="relative">
                  <span
                    className={cn(
                      "absolute -left-6 top-0.5 size-3 rounded-full ring-4 ring-white",
                      isPendingCoord ? "bg-amber-500" : isDraft ? "bg-slate-300" : "bg-emerald-500"
                    )}
                  />
                  <p className="text-xs font-bold text-slate-900">2. Review Coordinator ES (Level BMC)</p>
                  <p className="text-[11px] text-slate-500">
                    {isPendingCoord
                      ? "Menunggu validasi Coordinator."
                      : isDraft
                      ? "Masih dalam draft revisi teknisi."
                      : "Telah divalidasi Coordinator."}
                  </p>
                </div>

                <div className="relative">
                  <span
                    className={cn(
                      "absolute -left-6 top-0.5 size-3 rounded-full ring-4 ring-white",
                      isCompleted ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-slate-300"
                    )}
                  />
                  <p className="text-xs font-bold text-slate-900">3. Approval Final Manager (Level BNM)</p>
                  <p className="text-[11px] text-slate-500">
                    {isCompleted
                      ? "Telah disetujui final dan diarsipkan."
                      : isRejected
                      ? "Laporan ditolak."
                      : "Menunggu persetujuan Manager setelah Coordinator."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Decision Footer Bar (BMC/BNM Pattern) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-5 py-3.5 gap-3">
          <div className="text-xs text-slate-600">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="size-4" />
                Laporan telah resmi disetujui final (Selesai).
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                <XCircle className="size-4" />
                Laporan ini berstatus ditolak.
              </span>
            ) : (
              <span>Pemeriksaan laporan pemeliharaan oleh pimpinan operasional.</span>
            )}
          </div>

          {canApprove && (
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {/* Reject */}
              <button
                type="button"
                onClick={() => setActiveDialog("REJECT")}
                className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs"
              >
                <XCircle className="size-3.5" />
                <span>Tolak</span>
              </button>

              {/* Revision */}
              <button
                type="button"
                onClick={() => setActiveDialog("REVISION")}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 transition-colors shadow-2xs"
              >
                <RotateCcw className="size-3.5" />
                <span>Minta Revisi</span>
              </button>

              {/* Approve */}
              <button
                type="button"
                onClick={() => setActiveDialog("APPROVE")}
                className="flex items-center gap-1.5 rounded-xl bg-[#ff8a2a] px-4 py-2 text-xs font-black text-slate-950 hover:bg-[#e0751d] transition-colors shadow-xs"
              >
                <CheckCircle2 className="size-4" />
                <span>
                  {viewerRole === "COORD" ? "Validasi & Teruskan ke Manager" : "Setujui Final"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decision Dialogs */}
      {activeDialog !== "NONE" && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={() => setActiveDialog("NONE")}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            {activeDialog === "APPROVE" && (
              <>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {viewerRole === "COORD" ? "Validasi Laporan Ini?" : "Setujui Final Laporan Ini?"}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {viewerRole === "COORD"
                    ? "Laporan checklist teknisi akan divalidasi dan diteruskan ke antrean review Manager."
                    : "Laporan akan berstatus selesai dan diarsipkan ke riwayat pemeliharaan engineering."}
                </p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setActiveDialog("NONE")}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmDecision}
                    className="rounded-xl bg-[#ff8a2a] px-4 py-1.5 text-xs font-black text-slate-950 hover:bg-[#e0751d] disabled:opacity-50"
                  >
                    {isSubmitting ? "Memproses..." : "Ya, Setujui"}
                  </button>
                </div>
              </>
            )}

            {activeDialog === "REVISION" && (
              <>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="size-4 text-amber-600" />
                  Kembalikan Laporan untuk Revisi
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Teknisi ES harus memperbaiki data checklist atau foto sebelum laporan dapat diproses kembali.
                </p>

                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catatan Revisi <span className="text-rose-500">* Wajib</span>
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => {
                      setDecisionNotes(e.target.value)
                      if (notesError) setNotesError(null)
                    }}
                    placeholder="Tuliskan bagian parameter atau temuan yang wajib diperbaiki teknisi..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  {notesError && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{notesError}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setActiveDialog("NONE")}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmDecision}
                    className="rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Catatan Revisi"}
                  </button>
                </div>
              </>
            )}

            {activeDialog === "REJECT" && (
              <>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="size-4 text-rose-600" />
                  Tolak Laporan
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Laporan akan ditolak dan tidak dilanjutkan. Berikan alasan penolakan.
                </p>

                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Alasan Penolakan <span className="text-rose-500">* Wajib</span>
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => {
                      setDecisionNotes(e.target.value)
                      if (notesError) setNotesError(null)
                    }}
                    placeholder="Tulis alasan resmi penolakan laporan..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  {notesError && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{notesError}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setActiveDialog("NONE")}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmDecision}
                    className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Menolak..." : "Tolak Laporan"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
