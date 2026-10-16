"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react"

type WorkPermitCardProps = {
  userNik?: string
}

export function WorkPermitCard({ userNik }: WorkPermitCardProps = {}) {
  const [hasWorkPermit, setHasWorkPermit] = React.useState(false)

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const permitRaw = userNik
          ? window.sessionStorage.getItem(`sparta_work_permit_${userNik}`)
          : window.sessionStorage.getItem("sparta_work_permit")

        if (permitRaw) {
          try {
            const parsed = JSON.parse(permitRaw)
            if (!userNik || !parsed.userNik || parsed.userNik === userNik) {
              setHasWorkPermit(true)
              return
            }
          } catch {
            // ignore
          }
        }

        if (userNik) {
          const fallback = window.sessionStorage.getItem("sparta_work_permit")
          if (fallback) {
            try {
              const parsed = JSON.parse(fallback)
              if (parsed.userNik === userNik) {
                setHasWorkPermit(true)
                return
              }
            } catch {
              // ignore
            }
          }
        }

        setHasWorkPermit(false)
      }
    } catch {
      // ignore
    }
  }, [userNik])

  return (
    <section id="work-permit-section" className="mt-8 scroll-mt-20">
      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/70 p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-700">
              {hasWorkPermit ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
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
                    hasWorkPermit
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  {hasWorkPermit ? "Izin Kerja Aktif" : "Prasyarat K3"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-xl">
                {hasWorkPermit
                  ? "Form izin kerja telah terisi untuk sesi ini. Anda dapat meninjau kembali formulir jika ada pembaruan kegiatan."
                  : "Pastikan Form Izin Kerja (SMK3) telah dilengkapi sebelum melaksanakan kegiatan inspeksi atau pemeliharaan di area kerja."}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link
              href="/dashboard/reports/new/work-permit?next=dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff8a2a] px-4 py-2.5 text-xs font-bold text-black shadow-xs transition-all hover:bg-[#e0751d] hover:shadow"
            >
              <span>{hasWorkPermit ? "Lihat Izin Kerja" : "Isi Form Izin Kerja"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
