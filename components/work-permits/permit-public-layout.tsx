import Image from "next/image"
import type { ReactNode } from "react"

export function PermitPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="permit-workspace min-h-svh bg-background text-foreground">
      <header className="border-b border-slate-700 bg-[#0e1929] text-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Image
            src="/assets/logoalfamart.png"
            alt="Alfamart"
            width={74}
            height={28}
            className="h-auto w-[74px]"
          />
          <span className="h-7 w-px bg-slate-600" aria-hidden />
          <Image
            src="/assets/sparta-engineering-logo.png"
            alt=""
            width={27}
            height={36}
            className="h-9 w-auto"
          />
          <span className="text-sm font-semibold">SPARTA Engineering</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {children}
      </main>
    </div>
  )
}
