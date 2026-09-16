import { ShieldCheck } from "lucide-react"

import { SectionHeading } from "@/components/es-dashboard/section-heading"
import { getPreventiveProgressSummary } from "@/lib/es-dashboard-data"

export async function ProgressSummary() {
  const { total, completed, percentage } = await getPreventiveProgressSummary()
  
  return (
    <section className="mt-8">
      <SectionHeading kicker="Rekap" title="Tugas Preventif Anda" />
      <div className="mt-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
            <ShieldCheck className="text-[#ff8a2a]" aria-hidden="true" />
            CHECKLIST RUTIN
          </div>
          <span className="text-sm text-[#686868]">{completed} / {total} selesai</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#686868]">
          Periode ini, Anda telah menyelesaikan {percentage}% dari total area yang diwajibkan.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9e9e9]">
          <div className="h-full rounded-full bg-[#ff8a2a] transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </section>
  )
}
