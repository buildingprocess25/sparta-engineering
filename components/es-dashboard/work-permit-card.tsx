"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react"

export type WorkPermitStatusData = {
  id: string
  permitCode: string
  status: "PENDING_MANAGER" | "APPROVED" | "REJECTED" | "COMPLETED" | "EXPIRED" | null
  kegiatan: string
  lokasi: string
  managerNotes?: string | null
  managerName?: string | null
  createdAt?: string
  managerSignedAt?: string | null
  targetPeriod?: string | null
  pastPeriod?: string | null
  isHMinusWindow?: boolean
  nextMonthPeriod?: string | null
  nextMonthPermit?: {
    id: string
    permitCode: string
    status: "PENDING_MANAGER" | "APPROVED" | "REJECTED" | "COMPLETED"
    targetPeriod: string
  } | null
} | null

type WorkPermitCardProps = {
  userNik?: string
  initialStatus?: WorkPermitStatusData
}

function formatMonthLabel(period?: string | null): string {
  if (!period) return ""
  try {
    const [year, month] = period.split("-").map(Number)
    if (!year || !month) return period
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  } catch {
    return period
  }
}

export function WorkPermitCard({ userNik, initialStatus }: WorkPermitCardProps = {}) {
  const [mounted, setMounted] = React.useState(false)
  const [dbPermit, setDbPermit] = React.useState<WorkPermitStatusData>(initialStatus ?? null)
  const [sessionPermit, setSessionPermit] = React.useState<any>(null)

  React.useEffect(() => {
    setMounted(true)
    if (initialStatus !== undefined) {
      setDbPermit(initialStatus)
    }
  }, [initialStatus])

  React.useEffect(() => {
    if (!mounted) return
    try {
      if (typeof window !== "undefined") {
        const permitRaw = userNik
          ? window.sessionStorage.getItem(`sparta_work_permit_${userNik}`)
          : window.sessionStorage.getItem("sparta_work_permit")

        if (permitRaw) {
          try {
            const parsed = JSON.parse(permitRaw)
            if (!userNik || !parsed.userNik || parsed.userNik === userNik) {
              setSessionPermit(parsed)
              return
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }, [userNik, mounted])

  // Tentukan state efektif: Prioritas dari Database, fallback ke session jika sudah mounted
  const effectiveStatus = dbPermit?.status || (mounted ? sessionPermit?.status : null) || null
  const permitCode = dbPermit?.permitCode || (mounted ? sessionPermit?.permitCode : null) || null

  const isApproved = effectiveStatus === "APPROVED"
  const isPending = effectiveStatus === "PENDING_MANAGER"
  const isRejected = effectiveStatus === "REJECTED"
  const isExpired = effectiveStatus === "EXPIRED"

  const targetPeriodLabel = formatMonthLabel(dbPermit?.targetPeriod)
  const pastPeriodLabel = formatMonthLabel(dbPermit?.pastPeriod)
  const nextMonthPeriodLabel = formatMonthLabel(dbPermit?.nextMonthPeriod)

  return (
    <section id="work-permit-section" className="mt-8 scroll-mt-20">
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
          isApproved
            ? "border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-emerald-50/70"
            : isPending
            ? "border-amber-300 bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-amber-50/80"
            : isRejected
            ? "border-rose-300 bg-gradient-to-r from-rose-50/95 via-red-50/50 to-rose-50/80"
            : isExpired
            ? "border-amber-400 bg-gradient-to-r from-amber-50/95 via-orange-50/70 to-amber-50/90"
            : "border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/70"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                isApproved
                  ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-700"
                  : isPending
                  ? "bg-amber-500/20 border-amber-500/35 text-amber-800"
                  : isRejected
                  ? "bg-rose-500/20 border-rose-500/35 text-rose-800"
                  : isExpired
                  ? "bg-amber-500/25 border-amber-500/40 text-amber-900"
                  : "bg-amber-500/15 border-amber-500/25 text-amber-700"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : isPending ? (
                <Clock className="size-5 text-amber-700 animate-pulse" />
              ) : isRejected ? (
                <XCircle className="size-5 text-rose-600" />
              ) : isExpired ? (
                <Clock className="size-5 text-amber-800" />
              ) : (
                <ShieldAlert className="size-5 text-amber-600" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Form Izin Kerja (SAT/FRM/MED/003)
                </h3>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    isApproved
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : isPending
                      ? "bg-amber-200/90 text-amber-950 border border-amber-300"
                      : isRejected
                      ? "bg-rose-100 text-rose-900 border border-rose-200"
                      : isExpired
                      ? "bg-amber-200 text-amber-950 border border-amber-300 font-bold"
                      : "bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  {isApproved
                    ? `Disetujui Manager (${targetPeriodLabel || "Bulan Ini"})`
                    : isPending
                    ? `Menunggu Approval Manager (${targetPeriodLabel || "Bulan Ini"})`
                    : isRejected
                    ? "Ditolak / Perlu Revisi"
                    : isExpired
                    ? `Kedaluwarsa (${pastPeriodLabel || "Bulan Lalu"} Berakhir)`
                    : "Prasyarat K3"}
                </span>

                {permitCode && !isExpired && (
                  <span className="font-mono text-[11px] font-semibold text-slate-500">
                    {permitCode}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-xl">
                {isApproved
                  ? `Izin kerja periode ${targetPeriodLabel} telah disahkan oleh ${dbPermit?.managerName || "Manager"}. Seluruh checklist rutin bulanan Anda kini dapat dikerjakan.`
                  : isPending
                  ? `Pengajuan izin kerja periode ${targetPeriodLabel} telah terkirim ke antrean Manager. Checklist rutin akan otomatis terbuka segera setelah disetujui.`
                  : isRejected
                  ? `Catatan Manager: ${dbPermit?.managerNotes || "Perbaiki kelengkapan APD / prasyarat K3 sebelum mengajukan kembali."}`
                  : isExpired
                  ? `Masa berlaku izin kerja periode ${pastPeriodLabel || "sebelumnya"} telah berakhir. Sesuai prosedur K3 bulanan, ajukan Form Izin Kerja baru untuk melanjutkan checklist periode ini.`
                  : "Pastikan Form Izin Kerja (SMK3) telah dilengkapi dan disetujui Manager sebelum melaksanakan kegiatan inspeksi atau pemeliharaan."}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link
              href={
                isApproved || isPending
                  ? `/dashboard/reports/new/work-permit?view=readonly&source=todo&next=dashboard${
                      permitCode ? `&permitCode=${encodeURIComponent(permitCode)}` : ""
                    }`
                  : isExpired
                  ? `/dashboard/reports/new/work-permit?source=todo&next=dashboard&mode=new${
                      dbPermit?.targetPeriod ? `&period=${encodeURIComponent(dbPermit.targetPeriod)}` : ""
                    }`
                  : `/dashboard/reports/new/work-permit?source=todo&next=dashboard`
              }
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                isApproved
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : isPending
                  ? "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
                  : isRejected
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : isExpired
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#ff8a2a] text-black hover:bg-[#e0751d]"
              }`}
            >
              <span>
                {isApproved
                  ? "Lihat Izin Kerja"
                  : isPending
                  ? "Buka Pengajuan"
                  : isRejected
                  ? "Revisi Izin Kerja"
                  : isExpired
                  ? "Perbarui Izin Kerja"
                  : "Isi Form Izin Kerja"}
              </span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* H- Bulan Depan Callout Banner */}
        {dbPermit?.isHMinusWindow && nextMonthPeriodLabel && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {dbPermit.nextMonthPermit ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Izin Periode {nextMonthPeriodLabel}:
                </span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                    dbPermit.nextMonthPermit.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {dbPermit.nextMonthPermit.status === "APPROVED"
                    ? "Disetujui (Siap Aktif Tgl 1)"
                    : "Menunggu Approval Manager"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-900">
                <Clock className="size-3.5 text-amber-700 shrink-0" />
                <span>
                  Jendela pengajuan izin kerja <strong>{nextMonthPeriodLabel} (H-)</strong> sudah dibuka.
                </span>
              </div>
            )}

            {!dbPermit.nextMonthPermit && (
              <Link
                href={`/dashboard/reports/new/work-permit?source=todo&next=dashboard&mode=new&period=${encodeURIComponent(
                  dbPermit.nextMonthPeriod || ""
                )}`}
                className="inline-flex items-center gap-1 font-bold text-[#d97706] hover:text-[#b45309] hover:underline"
              >
                <span>Ajukan Lebih Awal</span>
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
