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
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#111111]">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[#111111]">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-[#686868]">
          {description}
        </span>
      </span>
      {active ? (
        <Check className="shrink-0 text-[#a64f00]" aria-hidden="true" />
      ) : (
        <ArrowRight className="shrink-0 text-[#b2b2b2]" aria-hidden="true" />
      )}
    </>
  )

  const className = cn(
    "flex min-h-24 items-start gap-3 rounded-xl border p-3 text-left transition-colors",
    active ? "border-[#ff8a2a] bg-[#fff0e3]" : "border-[#dedede] bg-[#fbfbfb]",
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
