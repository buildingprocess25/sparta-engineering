"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

type ReportBackButtonProps = {
  fallbackHref?: string
  label?: string
}

export function ReportBackButton({
  fallbackHref = "/dashboard",
  label = "Kembali",
}: ReportBackButtonProps) {
  const router = useRouter()

  function goBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <div className="mb-5 flex items-center">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-[#4c4c4c] outline-none transition-colors hover:text-[#111111] focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/35"
      >
        <ArrowLeft aria-hidden="true" />
        {label}
      </button>
      <Link href={fallbackHref} className="sr-only">
        {label}
      </Link>
    </div>
  )
}
