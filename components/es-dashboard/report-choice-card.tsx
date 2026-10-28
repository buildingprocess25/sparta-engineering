import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"

type ReportChoiceCardProps = {
  href: string
  title: string
  description: string
  icon: LucideIcon
  active?: boolean
  disabled?: boolean
}

export function ReportChoiceCard({
  href,
  title,
  description,
  icon: Icon,
  active,
  disabled,
}: ReportChoiceCardProps) {
  const content = (
    <>
      {/* Mobile-only icon */}
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white border border-[#eaeaea] shadow-xs text-[#111111] md:hidden">
        <Icon className="size-5" aria-hidden="true" />
      </span>

      {/* Tablet-only top row: Icon + Arrow */}
      <div className="hidden md:flex w-full items-center justify-between">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white border border-[#eaeaea] shadow-xs text-[#111111]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {active ? (
          <Check className="size-5 shrink-0 text-[#a64f00]" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-5 shrink-0 text-[#b2b2b2] transition-transform group-hover:translate-x-1 group-hover:text-[#ff8a2a]" aria-hidden="true" />
        )}
      </div>

      {/* Title & Description */}
      <div className="min-w-0 flex-1 md:mt-4 md:w-full">
        <span className="block font-semibold text-[#111111] text-sm md:text-base transition-colors group-hover:text-[#ff8a2a]">
          {title}
        </span>
        <span className="mt-1 block text-xs md:text-sm leading-5 text-[#686868]">
          {description}
        </span>
      </div>

      {/* Mobile-only arrow */}
      <span className="shrink-0 self-center md:hidden">
        {active ? (
          <Check className="size-4.5 text-[#a64f00]" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-4.5 text-[#b2b2b2]" aria-hidden="true" />
        )}
      </span>
    </>
  )

  const className = cn(
    "group flex min-h-20 md:min-h-[175px] items-center md:items-start md:flex-col md:justify-between gap-3 md:gap-0 rounded-xl md:rounded-2xl border p-3.5 md:p-5 text-left transition-all",
    active
      ? "border-[#ff8a2a] bg-[#fff0e3] shadow-xs"
      : "border-[#dedede] bg-[#fbfbfb] hover:border-[#ff8a2a]/60 hover:bg-[#fffaf5] hover:shadow-xs",
    disabled && "pointer-events-none opacity-45",
  )

  if (disabled) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}
