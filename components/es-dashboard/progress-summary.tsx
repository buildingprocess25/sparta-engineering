import { ShieldCheck } from "lucide-react"

import { SectionHeading } from "@/components/es-dashboard/section-heading"

export function ProgressSummary() {
  return (
    <section className="mt-8">
      <SectionHeading kicker="Rekap" title="Progress awal" />
      <div className="mt-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
            <ShieldCheck className="text-[#ff8a2a]" aria-hidden="true" />
            FLOW ES DASHBOARD
          </div>
          <span className="text-sm text-[#686868]">1 / 4 tahap</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#686868]">
          Mulai dari Form Ijin Kerja, lalu pilih jalur laporan dan area.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9e9e9]">
          <div className="h-full w-1/4 rounded-full bg-[#ff8a2a]" />
        </div>
      </div>
    </section>
  )
}
