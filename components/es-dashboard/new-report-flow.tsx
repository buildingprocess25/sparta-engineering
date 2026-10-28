"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ClipboardCheck, ShieldAlert, Wrench } from "lucide-react"

import { ReportChoiceCard } from "@/components/es-dashboard/report-choice-card"
import type { WorkPermitStatusData } from "@/components/es-dashboard/work-permit-card"

type NewReportFlowProps = {
  userNik?: string
  initialWorkPermitStatus?: WorkPermitStatusData
}

export function NewReportFlow({ userNik, initialWorkPermitStatus }: NewReportFlowProps = {}) {
  const isInitiallyApproved = initialWorkPermitStatus?.status === "APPROVED"
  const [hasWorkPermit, setHasWorkPermit] = React.useState(isInitiallyApproved)

  React.useEffect(() => {
    if (initialWorkPermitStatus) {
      setHasWorkPermit(initialWorkPermitStatus.status === "APPROVED")
      return
    }

    try {
      if (typeof window !== "undefined") {
        const permitRaw = userNik
          ? window.sessionStorage.getItem(`sparta_work_permit_${userNik}`)
          : window.sessionStorage.getItem("sparta_work_permit")

        if (permitRaw) {
          try {
            const parsed = JSON.parse(permitRaw)
            if (!userNik || !parsed.userNik || parsed.userNik === userNik) {
              if (parsed.status) {
                setHasWorkPermit(parsed.status === "APPROVED")
              } else {
                setHasWorkPermit(true)
              }
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
                if (parsed.status) {
                  setHasWorkPermit(parsed.status === "APPROVED")
                } else {
                  setHasWorkPermit(true)
                }
                return
              }
            } catch {
              // ignore
            }
          }
        }

        const params = new URLSearchParams(window.location.search)
        if (params.get("permit") === "done") {
          setHasWorkPermit(true)
          return
        }

        setHasWorkPermit(false)
      }
    } catch {
      // ignore
    }
  }, [userNik, initialWorkPermitStatus])

  return (
    <div className="flex flex-col gap-6 sm:gap-7 rounded-2xl md:rounded-3xl border border-[#dedede] bg-white p-4 sm:p-6 md:p-8 shadow-sm">
      {/* Step 1: Form Izin Kerja */}
      <section>
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-xs sm:text-sm font-semibold text-white">
            1
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-base sm:text-lg text-[#111111]">Form Izin Kerja</h2>
            <p className="mt-1 text-sm sm:text-base leading-5 sm:leading-6 text-[#686868]">
              Lengkapi form izin kerja (SAT/FRM/MED/003) sesuai klausul keselamatan kerja (SMK3) sebelum melaksanakan inspeksi atau perbaikan non-rutin.
            </p>
          </div>
        </div>

        <div className="mt-3.5 sm:mt-4">
          <div
            className={
              hasWorkPermit
                ? "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl md:rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 sm:p-4 md:p-5 text-left transition-colors"
                : "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl md:rounded-2xl border border-[#ff8a2a] bg-[#fff5ec] p-3.5 sm:p-4 md:p-5 text-left transition-colors"
            }
          >
            <div className="min-w-0 pr-0 sm:pr-3">
              <div className="flex items-center gap-2">
                {hasWorkPermit && (
                  <CheckCircle2 className="size-4.5 sm:size-5 text-emerald-600 shrink-0" />
                )}
                <span className="block font-semibold text-[#111111] text-sm sm:text-base">
                  {hasWorkPermit
                    ? "Form Izin Kerja (SAT/FRM/MED/003) - Terisi"
                    : "Isi Form Izin Kerja (SAT/FRM/MED/003)"}
                </span>
              </div>
              <span className="mt-1 block text-xs sm:text-sm text-[#774000]">
                {hasWorkPermit
                  ? "Izin kerja aktif & terkonfirmasi. Pilihan laporan di bawah telah terbuka."
                  : "Wajib diisi sebelum dapat memilih jenis laporan di bawah."}
              </span>
            </div>
            <Link
              href={
                hasWorkPermit
                  ? "/dashboard/reports/new/work-permit?view=readonly&source=non-routine&next=select"
                  : "/dashboard/reports/new/work-permit?source=non-routine&next=select"
              }
              className={
                hasWorkPermit
                  ? "shrink-0 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                  : "shrink-0 inline-flex items-center justify-center rounded-xl bg-[#ff8a2a] px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#e0751d] transition-colors shadow-xs"
              }
            >
              {hasWorkPermit ? "Lihat Izin Kerja" : "Buka Form"}
            </Link>
          </div>
        </div>
      </section>

      {/* Step 2: Jenis Laporan */}
      <section>
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-full bg-[#111111] text-xs sm:text-sm font-semibold text-white">
            2
          </span>
          <div>
            <h2 className="font-semibold text-base sm:text-lg text-[#111111]">Jenis Laporan</h2>
            <p className="mt-1 text-sm sm:text-base leading-5 sm:leading-6 text-[#686868]">
              {hasWorkPermit
                ? "Pilih jalur kerja non-rutin yang akan dilaksanakan."
                : "Harap isi Form Izin Kerja pada Langkah 1 untuk membuka pilihan jalur kerja."}
            </p>
          </div>
        </div>
        <div className="mt-3.5 sm:mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <ReportChoiceCard
            href="/dashboard/reports/new/checklist/area?workPermit=fill"
            title="Checklist"
            description={
              hasWorkPermit
                ? "Pilih area dan inventaris checklist non-rutin."
                : "Wajib mengisi Form Izin Kerja pada langkah 1 terlebih dahulu."
            }
            icon={ClipboardCheck}
            disabled={!hasWorkPermit}
          />
          <ReportChoiceCard
            href="/dashboard/reports/new/repair/area?workPermit=fill"
            title="Perbaikan / Temuan"
            description={
              hasWorkPermit
                ? "Pilih area temuan perbaikan non-rutin."
                : "Wajib mengisi Form Izin Kerja pada langkah 1 terlebih dahulu."
            }
            icon={Wrench}
            disabled={!hasWorkPermit}
          />
          <ReportChoiceCard
            href="#"
            title="General Checklist"
            description="Segera hadir pada pembaruan mendatang."
            icon={ClipboardCheck}
            disabled
          />
        </div>
      </section>

      <div className="rounded-xl md:rounded-2xl bg-[#f8f8f8] border border-[#eeeeee] p-3.5 sm:p-4 text-xs sm:text-sm leading-5 sm:leading-6 text-[#686868] flex items-start gap-2.5 sm:gap-3">
        <ShieldAlert className="size-4 sm:size-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#222]">Kebijakan Keselamatan: </span>
          Berdasarkan SOP SAT/KEB/MED/001, pelaksana wajib memastikan Form Izin Kerja terisi sebelum memulai pekerjaan.
        </div>
      </div>
    </div>
  )
}
