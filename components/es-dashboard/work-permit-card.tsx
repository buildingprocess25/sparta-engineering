"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react"

export type WorkPermitStatusData = {
  id: string
  permitCode: string
  status: "PENDING_MANAGER" | "APPROVED" | "REJECTED" | "COMPLETED"
  kegiatan: string
  lokasi: string
  managerNotes?: string | null
  managerName?: string | null
  createdAt?: string
} | null

type WorkPermitCardProps = {
  userNik?: string
  initialStatus?: WorkPermitStatusData
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
                  : "bg-amber-500/15 border-amber-500/25 text-amber-700"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : isPending ? (
                <Clock className="size-5 text-amber-700 animate-pulse" />
              ) : isRejected ? (
                <XCircle className="size-5 text-rose-600" />
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
                      : "bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  {isApproved
                    ? "Disetujui Manager (Izin Aktif)"
                    : isPending
                    ? "Menunggu Approval Manager"
                    : isRejected
                    ? "Ditolak / Perlu Revisi"
                    : "Prasyarat K3"}
                </span>

                {permitCode && (
                  <span className="font-mono text-[11px] font-semibold text-slate-500">
                    {permitCode}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-xl">
                {isApproved
                  ? `Izin kerja telah disahkan oleh ${dbPermit?.managerName || "Manager"}. Seluruh checklist rutin harian Anda kini dapat dikerjakan.`
                  : isPending
                  ? "Pengajuan izin kerja telah terkirim ke antrean Manager. Checklist rutin akan otomatis terbuka segera setelah disetujui."
                  : isRejected
                  ? `Catatan Manager: ${dbPermit?.managerNotes || "Perbaiki kelengkapan APD / prasyarat K3 sebelum mengajukan kembali."}`
                  : "Pastikan Form Izin Kerja (SMK3) telah dilengkapi dan disetujui Manager sebelum melaksanakan kegiatan inspeksi atau pemeliharaan."}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link
              href="/dashboard/reports/new/work-permit?next=dashboard"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                isApproved
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : isPending
                  ? "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
                  : isRejected
                  ? "bg-rose-600 text-white hover:bg-rose-700"
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
                  : "Isi Form Izin Kerja"}
              </span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
