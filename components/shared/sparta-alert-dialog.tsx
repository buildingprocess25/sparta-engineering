"use client"

import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, XCircle, Shield } from "lucide-react"

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"

type Tone = "confirm" | "success" | "warning" | "error" | "info"

const tones = {
  confirm: { Icon: Shield, className: "bg-orange-50 text-orange-700" },
  success: { Icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  warning: { Icon: AlertTriangle, className: "bg-amber-50 text-amber-700" },
  error: { Icon: XCircle, className: "bg-rose-50 text-rose-700" },
  info: { Icon: Shield, className: "bg-slate-100 text-slate-700" },
} as const

export function SpartaAlertDialog({
  open,
  onOpenChange,
  busy = false,
  tone = "confirm",
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  busy?: boolean
  tone?: Tone
  children: ReactNode
}) {
  const { Icon, className } = tones[tone]
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next) }}>
      <AlertDialogContent
        className="z-[70] max-h-[90dvh] overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-xl sm:max-w-md"
        aria-busy={busy}
      >
        <div className={`mx-auto grid size-16 place-items-center rounded-full ${className}`}>
          <Icon className="size-9" aria-hidden="true" />
        </div>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  )
}
