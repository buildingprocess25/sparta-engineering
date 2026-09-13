import Link from "next/link"
import { PlusCircle } from "lucide-react"

export function ReportFlow() {
  return (
    <section className="mt-5">
      <Link
        href="/dashboard/reports/new"
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#ff8a2a] text-base font-semibold text-black shadow-lg shadow-[#ff8a2a]/20 transition-colors hover:bg-[#ff9c48] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/40"
      >
        <PlusCircle data-icon="inline-start" aria-hidden="true" />
        Buat Laporan Baru
      </Link>
    </section>
  )
}
