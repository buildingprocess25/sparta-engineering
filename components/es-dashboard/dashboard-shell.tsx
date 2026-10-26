import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function DashboardShell({
  children,
  className,
  contentClassName,
}: DashboardShellProps) {
  return (
    <main
      id="main-content"
      className={cn(
        "min-h-svh overflow-x-hidden bg-[#f5f5f3] pb-24 text-[#111111]",
        className
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex min-h-svh w-full flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]",
          contentClassName || "max-w-md sm:max-w-lg"
        )}
      >
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
