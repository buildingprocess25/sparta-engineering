"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type ReportBackButtonProps = {
  fallbackHref?: string
  label?: string
  href?: string
}

export function ReportBackButton({
  fallbackHref = "/dashboard",
  label = "Kembali",
  href,
}: ReportBackButtonProps) {
  const router = useRouter()

  function goBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  const controlClass = "inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-[#4c4c4c] outline-none transition-colors hover:text-[#111111] focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/35"

  return (
    <div className="mb-5 flex items-center">
      {href ? (
        <Link href={href} className={controlClass}>
          <ArrowLeft aria-hidden="true" />
          {label}
        </Link>
      ) : (
        <>
          <Button variant="ghost" type="button" onClick={goBack} className={["inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit", (controlClass)].filter(Boolean).join(" ")}>
            <ArrowLeft aria-hidden="true" />
            {label}
          </Button>
          <Link href={fallbackHref} className="sr-only">
            {label}
          </Link>
        </>
      )}
    </div>
  )
}
