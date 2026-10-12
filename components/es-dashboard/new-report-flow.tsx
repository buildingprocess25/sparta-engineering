"use client"

import * as React from "react"
import Link from "next/link"
import { ClipboardCheck, ShieldAlert, Wrench } from "lucide-react"

import { ReportChoiceCard } from "@/components/es-dashboard/report-choice-card"

export function NewReportFlow() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
      {/* Step 1: Form Izin Kerja */}
      <section>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
            1
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#111111]">Form Ijin Kerja</h2>
            <p className="mt-1 text-sm leading-5 text-[#686868]">
              Lengkapi form izin kerja (SAT/FRM/MED/003) sesuai klausul keselamatan kerja (SMK3) sebelum melaksanakan inspeksi atau perbaikan non-rutin.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between rounded-xl border border-[#ff8a2a] bg-[#fff5ec] p-3 text-left">
            <div className="min-w-0 pr-3">
              <span className="block font-semibold text-[#111111] text-sm">
                Isi Form Izin Kerja (SAT/FRM/MED/003)
              </span>
              <span className="mt-0.5 block text-xs text-[#774000]">
                Form akan dibuka sebelum pemilihan area kerja.
              </span>
            </div>
            <Link
              href="/dashboard/reports/new/work-permit?next=checklist"
              className="shrink-0 rounded-lg bg-[#ff8a2a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e0751d] transition-colors"
            >
              Buka Form
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
              Pilih jalur kerja. Sistem akan membuka Form Izin Kerja terlebih dahulu.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <ReportChoiceCard
            href="/dashboard/reports/new/work-permit?next=checklist"
            title="Checklist"
            description="Isi Form Izin Kerja, lalu pilih area checklist."
            icon={ClipboardCheck}
          />
          <ReportChoiceCard
            href="/dashboard/reports/new/work-permit?next=repair"
            title="Perbaikan / Temuan"
            description="Isi Form Izin Kerja, lalu pilih area temuan."
            icon={Wrench}
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
