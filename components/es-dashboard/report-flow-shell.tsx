import type { ReactNode } from "react"

import { ReportBackButton } from "@/components/es-dashboard/report-back-button"
import { cn } from "@/lib/utils"

type ReportFlowShellProps = {
  eyebrow: ReactNode
  title: string
  description: string
  children: ReactNode
  maxWidth?: string
}

export function ReportFlowShell({
  eyebrow,
  title,
  description,
  children,
  maxWidth = "max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl",
}: ReportFlowShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-[#f5f5f3] pb-24 text-[#111111]"
    >
      <div
        className={cn(
          "mx-auto flex min-h-svh w-full flex-col px-4 sm:px-6 md:px-8 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]",
          maxWidth
        )}
      >
        <ReportBackButton />

        <header className="rounded-2xl md:rounded-3xl bg-[#111111] p-5 sm:p-6 md:p-8 text-white shadow-xl shadow-black/15">
          <p className="text-xs md:text-sm font-semibold text-[#ffb46f]">{eyebrow}</p>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">{title}</h1>
          <p className="mt-2 text-sm md:text-base leading-6 text-[#d9d9d9] max-w-2xl">{description}</p>
        </header>

        <div className="mt-5 sm:mt-6">{children}</div>
      </div>
    </main>
  )
}
