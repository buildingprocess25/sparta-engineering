import type { ReactNode } from "react"

import { ReportBackButton } from "@/components/es-dashboard/report-back-button"

type ReportFlowShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function ReportFlowShell({
  eyebrow,
  title,
  description,
  children,
}: ReportFlowShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-[#f5f5f3] pb-24 text-[#111111]"
    >
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
        <ReportBackButton />

        <header className="rounded-2xl bg-[#111111] p-5 text-white shadow-xl shadow-black/15">
          <p className="text-xs font-semibold text-[#ffb46f]">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#d9d9d9]">{description}</p>
        </header>

        <div className="mt-5">{children}</div>
      </div>
    </main>
  )
}
