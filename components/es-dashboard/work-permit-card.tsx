import Link from "next/link"
import { WORK_PERMIT_STATUS_LABELS } from "@/lib/work-permits/status-labels"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  History,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatWorkPermitMonth } from "@/lib/work-permits/active-period"
import { getWorkPermitHistoryHref } from "@/lib/work-permits/history"
import {
  getWorkPermitDetailHref,
  getWorkPermitPdfHref,
} from "@/lib/work-permits/links"

export type WorkPermitStatusData = {
  id: string
  permitCode: string
  status:
    | "PENDING_MANAGER"
    | "PENDING_P2K3"
    | "PENDING_SECRETARY"
    | "APPROVED"
    | "REJECTED"
    | "COMPLETED"
    | "EXPIRED"
    | null
  pdfAvailable?: boolean
  kegiatan: string
  lokasi: string
  managerNotes?: string | null
  managerName?: string | null
  createdAt?: string
  managerSignedAt?: string | null
  targetPeriod?: string | null
  pastPeriod?: string | null
  isHMinusWindow?: boolean
  nextMonthPeriod?: string | null
  nextMonthPermit?: {
    id: string
    permitCode: string
    status:
      | "PENDING_MANAGER"
      | "PENDING_P2K3"
      | "PENDING_SECRETARY"
      | "APPROVED"
      | "REJECTED"
      | "COMPLETED"
    targetPeriod: string
  } | null
} | null

const permitFormHref =
  "/dashboard/reports/new/work-permit?source=todo&next=dashboard"

export function WorkPermitCard({
  initialStatus: permit,
}: {
  initialStatus: WorkPermitStatusData
}) {
  const status = permit?.status
  const isPending =
    status === "PENDING_MANAGER" ||
    status === "PENDING_P2K3" ||
    status === "PENDING_SECRETARY"
  const isFinal = status === "APPROVED" || status === "COMPLETED"
  const canReview = isPending || isFinal
  const code = status === "EXPIRED" ? undefined : permit?.permitCode
  const period = formatWorkPermitMonth(permit?.targetPeriod)
  const nextPeriod = formatWorkPermitMonth(permit?.nextMonthPeriod)
  const Icon = isFinal
    ? CheckCircle2
    : status === "REJECTED"
      ? XCircle
      : isPending || status === "EXPIRED"
        ? Clock
        : ShieldCheck

  let description =
    "Lengkapi izin kerja sebelum memulai checklist atau perbaikan."
  let action = "Isi Form Izin Kerja"
  let href = permitFormHref
  if (canReview && code) {
    action = isPending ? "Buka Pengajuan" : "Lihat Izin Kerja"
    href = getWorkPermitDetailHref(code)
    description = isPending
      ? "Checklist dapat dimulai setelah seluruh persetujuan lengkap dan periode izin berlaku."
      : "Gunakan izin ini untuk checklist dan perbaikan pada periode yang tercantum."
  } else if (status === "REJECTED") {
    action = "Revisi Izin Kerja"
    description =
      permit?.managerNotes ||
      "Periksa kembali isian izin sebelum mengajukan ulang."
  } else if (status === "EXPIRED") {
    action = "Ajukan Izin Baru"
    href = `${permitFormHref}&mode=new&period=${encodeURIComponent(permit?.targetPeriod || "")}`
    description = `Izin periode ${formatWorkPermitMonth(permit?.pastPeriod) || "sebelumnya"} telah berakhir.`
  }

  return (
    <section
      id="work-permit-section"
      className="permit-workspace mt-6 scroll-mt-20"
      aria-labelledby="work-permit-heading"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#fff0e3] text-[#9e4715]">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  <h2
                    id="work-permit-heading"
                    className="text-lg font-semibold tracking-tight"
                  >
                    Izin Kerja K3
                  </h2>
                </CardTitle>
                <CardDescription>SAT/FRM/MED/003</CardDescription>
              </div>
            </div>
            <Badge
              variant={status === "REJECTED" ? "destructive" : "secondary"}
              className={isFinal ? "bg-emerald-50 text-emerald-800" : undefined}
            >
              {status ? WORK_PERMIT_STATUS_LABELS[status] : "Perlu diajukan"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {(code || period) && (
              <dl className="grid gap-3 rounded-lg bg-muted/55 p-3 sm:grid-cols-2">
                {code && (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">
                      Nomor izin
                    </dt>
                    <dd className="font-semibold break-words">{code}</dd>
                  </div>
                )}
                {period && (
                  <div
                    className={
                      code
                        ? "flex min-w-0 flex-col gap-0.5 sm:border-l sm:border-border sm:pl-4"
                        : "flex min-w-0 flex-col gap-0.5"
                    }
                  >
                    <dt className="text-xs font-medium text-muted-foreground">
                      Periode izin
                    </dt>
                    <dd className="font-semibold">{period}</dd>
                  </div>
                )}
              </dl>
            )}
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={href} className={buttonVariants({ size: "lg" })}>
                {action}
                <ArrowRight data-icon="inline-end" />
              </Link>
              {permit?.pdfAvailable && code && (
                <a
                  href={getWorkPermitPdfHref(code)}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  <Download data-icon="inline-start" /> Unduh PDF
                </a>
              )}
              <Link
                href={getWorkPermitHistoryHref()}
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                <History data-icon="inline-start" /> Riwayat Izin Kerja
              </Link>
            </div>
          </div>
        </CardContent>
        {permit?.isHMinusWindow && nextPeriod && (
          <CardFooter>
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <CalendarDays
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <p className="font-medium">Izin {nextPeriod}</p>
                  <p className="text-muted-foreground">
                    {permit.nextMonthPermit
                      ? WORK_PERMIT_STATUS_LABELS[permit.nextMonthPermit.status]
                      : "Pengajuan periode berikutnya dibuka."}
                  </p>
                </div>
              </div>
              {!permit.nextMonthPermit && (
                <Link
                  href={`${permitFormHref}&mode=new&period=${encodeURIComponent(permit.nextMonthPeriod || "")}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Ajukan Lebih Awal <ArrowRight data-icon="inline-end" />
                </Link>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </section>
  )
}
