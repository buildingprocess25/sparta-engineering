import type { ReactNode } from "react"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-[#f5f5f3] pb-24 text-[#111111]"
    >
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:mb-3 focus:rounded-md focus:bg-[#ff8a2a] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Lewati ke konten
        </a>
        {children}
      </div>
    </main>
  )
}
