"use client"

import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  FileText,
  Home,
  ArrowRight,
  Building2,
  Calendar,
  Wrench,
  Check,
  ShieldCheck,
  Clock,
} from "lucide-react"

export interface ReportCompletionSuccessProps {
  reportCode: string
  isRoutine: boolean
  targetName: string
  branchName?: string
  authorName?: string
  status?: string
  submittedAt?: string
  followUpType?: "014" | "065" | "NONE"
  followUpSummary?: {
    totalCost014?: number
    itemsCount065?: number
  }
}

export function ReportCompletionSuccess({
  reportCode,
  isRoutine,
  targetName,
  branchName = "Cabang",
  authorName = "ES",
  status = "PENDING_COORD",
  submittedAt,
  followUpType = "NONE",
  followUpSummary,
}: ReportCompletionSuccessProps) {
  const router = useRouter()

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

  return (
    <div className="mx-auto w-full max-w-2xl px-2 py-4 sm:py-8">
      <div className="overflow-hidden rounded-3xl border border-[#e6e2de] bg-white shadow-[0_12px_36px_rgba(17,17,17,0.06)]">
        {/* Top Header Card */}
        <div className="relative border-b border-[#f0eee9] bg-gradient-to-b from-[#f7fdf9] to-white px-6 pt-10 pb-8 text-center sm:px-10">
          {/* Success Badge Icon */}
          <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-[0_8px_24px_rgba(16,185,129,0.18)] ring-8 ring-emerald-50/60">
            <CheckCircle2 className="size-11 stroke-[2.2]" />
          </div>

          {/* Routine vs Non-Routine Tag */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-xs mb-3">
            {isRoutine ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-emerald-800">
                <ShieldCheck className="size-3.5" />
                Checklist Rutin Selesai
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-amber-900">
                <FileText className="size-3.5" />
                Laporan Non-Rutin Berhasil Disimpan
              </span>
            )}
          </div>

          {/* Heading Title */}
          <h1 className="text-xl font-extrabold text-[#111111] sm:text-2xl">
            {isRoutine
              ? "Tugas Checklist Rutin Berhasil Diselesaikan!"
              : "Laporan Non-Rutin Berhasil Disimpan!"}
          </h1>

          {/* Subtitle Description */}
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#666666] leading-relaxed">
            {isRoutine
              ? "Tugas to-do checklist berkala Anda telah ditandai selesai. Laporan beserta form tindak lanjut telah diteruskan ke antrean approval Coordinator."
              : "Laporan checklist non-rutin beserta form tindak lanjut perbaikan telah dicatat ke sistem dan diteruskan ke antrean approval Coordinator."}
          </p>
        </div>

        {/* Report Summary Data Block */}
        <div className="p-6 sm:p-8">
          <div className="rounded-2xl border border-[#edebe8] bg-[#faf9f8] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#eae8e4] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                Ringkasan Laporan
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                <Clock className="size-3" />
                Menunggu Review Coord
              </span>
            </div>

            <dl className="grid grid-cols-1 gap-y-3.5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 text-xs">
              <div>
                <dt className="text-[#888888] font-medium">Nomor Laporan</dt>
                <dd className="mt-1 font-mono text-sm font-bold text-[#111111]">
                  {reportCode}
                </dd>
              </div>

              <div>
                <dt className="text-[#888888] font-medium">Target / Objek</dt>
                <dd className="mt-1 font-semibold text-[#111111] truncate">
                  {targetName}
                </dd>
              </div>

              <div>
                <dt className="text-[#888888] font-medium">Cabang & Teknisi</dt>
                <dd className="mt-1 font-semibold text-[#111111]">
                  {branchName} • {authorName}
                </dd>
              </div>

              <div>
                <dt className="text-[#888888] font-medium">Waktu Submit</dt>
                <dd className="mt-1 font-semibold text-[#111111]">
                  {formattedDate} WIB
                </dd>
              </div>

              <div className="sm:col-span-2 border-t border-[#eae8e4] pt-3">
                <dt className="text-[#888888] font-medium">Form Tindak Lanjut</dt>
                <dd className="mt-1">
                  {followUpType === "014" ? (
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-orange-50 border border-orange-200/80 px-3 py-1.5 text-xs text-orange-950 font-semibold">
                      <Wrench className="size-3.5 text-orange-600" />
                      <span>Form Estimasi Biaya Sipil & ME (014)</span>
                      {typeof followUpSummary?.totalCost014 === "number" && (
                        <span className="rounded-md bg-orange-200/70 px-2 py-0.5 text-[11px] font-bold text-orange-900">
                          Total: Rp {followUpSummary.totalCost014.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                  ) : followUpType === "065" ? (
                    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-blue-50 border border-blue-200/80 px-3 py-1.5 text-xs text-blue-950 font-semibold">
                      <Wrench className="size-3.5 text-blue-600" />
                      <span>Form Penggantian Spare Part (065)</span>
                      {typeof followUpSummary?.itemsCount065 === "number" && (
                        <span className="rounded-md bg-blue-200/70 px-2 py-0.5 text-[11px] font-bold text-blue-900">
                          {followUpSummary.itemsCount065} Item Part / Unit
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs text-emerald-900 font-semibold">
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Kondisi Baik / Selesai Tanpa Biaya (Tidak ada form lanjutan)</span>
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            {/* Primary Action Button: Go back to Dashboard / To-Do List */}
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff8a2a] px-6 text-sm font-bold text-white shadow-[0_4px_14px_rgba(255,138,42,0.35)] transition-all hover:bg-[#f07b1a] active:scale-[0.99]"
            >
              <Home className="size-4 shrink-0" />
              <span>{isRoutine ? "Kembali ke To-Do List" : "Kembali ke Dashboard"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
