import type { LucideIcon } from "lucide-react"

import { dashboardStats } from "@/components/es-dashboard/dashboard-constants"
import { SectionHeading } from "@/components/es-dashboard/section-heading"
import { cn } from "@/lib/utils"

export function StatsGrid() {
  return (
    <section className="mt-8">
      <SectionHeading kicker="Stats Laporan" title="Ringkasan" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {dashboardStats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function StatCard({
  value,
  title,
  description,
  tone,
  icon: Icon,
}: {
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
  icon: LucideIcon
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative min-h-40 overflow-hidden rounded-2xl p-5 text-left shadow-sm",
        tone === "orange" ? "bg-[#fff0e3]" : "bg-white",
      )}
    >
      <div
        className={cn(
          "absolute -right-7 -top-8 size-28 rounded-full",
          tone === "orange" ? "bg-[#ffd0a3]" : "bg-[#eeeeee]",
        )}
      />
      <Icon
        className={cn(
          "absolute right-6 top-6",
          tone === "orange" ? "text-[#d86b0d]" : "text-[#bdbdbd]",
        )}
        aria-hidden="true"
      />
      <p className="text-5xl font-semibold text-[#111111]">{value}</p>
      <p className="mt-6 text-sm font-semibold text-[#111111]">{title}</p>
      <p className="mt-1 text-xs text-[#686868]">{description}</p>
    </button>
  )
}
