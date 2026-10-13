"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ClipboardCheck, ShieldAlert, Wrench } from "lucide-react"

import { ReportChoiceCard } from "@/components/es-dashboard/report-choice-card"

export function NewReportFlow() {
  const [hasWorkPermit, setHasWorkPermit] = React.useState(false)

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const permit = window.sessionStorage.getItem("sparta_work_permit")
        const params = new URLSearchParams(window.location.search)
        if (permit || params.get("permit") === "done" || params.get("workPermit") === "fill") {
          setHasWorkPermit(true)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
      {/* Step 1: Form Izin Kerja */}
      <section>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
            1
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#111111]">Form Izin Kerja</h2>
            <p className="mt-1 text-sm leading-5 text-[#686868]">
              Lengkapi form izin kerja (SAT/FRM/MED/003) sesuai klausul keselamatan kerja (SMK3) sebelum melaksanakan inspeksi atau perbaikan non-rutin.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div
            className={
              hasWorkPermit
                ? "flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-left transition-colors"
                : "flex items-center justify-between rounded-xl border border-[#ff8a2a] bg-[#fff5ec] p-3 text-left transition-colors"
            }
          >
            <div className="min-w-0 pr-3">
              <div className="flex items-center gap-1.5">
                {hasWorkPermit && (
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                )}
                <span className="block font-semibold text-[#111111] text-sm">
                  {hasWorkPermit
                    ? "Form Izin Kerja (SAT/FRM/MED/003) - Terisi"
                    : "Isi Form Izin Kerja (SAT/FRM/MED/003)"}
                </span>
              </div>
              <span className="mt-0.5 block text-xs text-[#774000]">
                {hasWorkPermit
                  ? "Izin kerja aktif & terkonfirmasi. Pilihan laporan di bawah telah terbuka."
                  : "Wajib diisi sebelum dapat memilih jenis laporan di bawah."}
              </span>
            </div>
            <Link
              href="/dashboard/reports/new/work-permit?next=select"
              className={
                hasWorkPermit
                  ? "shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                  : "shrink-0 rounded-lg bg-[#ff8a2a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e0751d] transition-colors"
              }
            >
              {hasWorkPermit ? "Ubah Form" : "Buka Form"}
            </Link>
          </div>
        </div>
      </section>

      {/* Step 2: Jenis Laporan */}
      <section>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
            2
          </span>
          <div>
            <h2 className="font-semibold text-[#111111]">Jenis Laporan</h2>
            <p className="mt-1 text-sm leading-5 text-[#686868]">
              {hasWorkPermit
                ? "Pilih jalur kerja non-rutin yang akan dilaksanakan."
                : "Harap isi Form Izin Kerja pada Langkah 1 untuk membuka pilihan jalur kerja."}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3">
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

      <div className="rounded-xl bg-[#f8f8f8] p-3 text-xs leading-5 text-[#686868] flex items-start gap-2.5">
        <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#222]">Kebijakan Keselamatan: </span>
          Berdasarkan SOP SAT/KEB/MED/001, pelaksana wajib memastikan Form Izin Kerja terisi sebelum memulai pekerjaan.
        </div>
      </div>
    </div>
  )
}
