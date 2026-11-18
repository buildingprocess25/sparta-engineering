import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import type { WorkPermit } from "@/generated/prisma"
import { cn } from "@/lib/utils"
import { getWorkPermitPeriod } from "@/lib/work-permits/active-period"
import { getWorkPermitHistoryHref } from "@/lib/work-permits/history"

type WorkPermitHistoryListProps = {
  permits: Pick<WorkPermit, "permitCode" | "kegiatan" | "lokasi" | "status" | "applicantSignedAt" | "safetyPayload" | "workDate">[]
  page: number
  pageCount: number
}

const statuses = {
  PENDING_MANAGER: { label: "Menunggu Manager", color: "bg-amber-100 text-amber-900" },
  PENDING_P2K3: { label: "Menunggu P2K3", color: "bg-orange-100 text-orange-900" },
  PENDING_SECRETARY: { label: "Menunggu Sekretaris", color: "bg-purple-100 text-purple-900" },
  APPROVED: { label: "Disetujui", color: "bg-emerald-100 text-emerald-900" },
  REJECTED: { label: "Ditolak", color: "bg-rose-100 text-rose-900" },
  COMPLETED: { label: "Selesai", color: "bg-muted text-foreground" },
} satisfies Record<WorkPermit["status"], { label: string; color: string }>

const periodFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" })
const submissionFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })

export function WorkPermitHistoryList({ permits, page, pageCount }: WorkPermitHistoryListProps) {
  if (!permits.length) {
    return (
      <section className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold text-card-foreground">Belum ada pengajuan</h2>
        <Link href="/dashboard/reports/new/work-permit?mode=new" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Ajukan Izin Kerja
        </Link>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Daftar pengajuan" className="divide-y divide-border rounded-2xl border border-border bg-card">
        {permits.map((permit) => {
          const status = statuses[permit.status]
          const period = getWorkPermitPeriod(permit)
          const periodDate = new Date(`${period}-01T00:00:00Z`)
          const periodLabel = Number.isNaN(periodDate.getTime()) ? period : periodFormatter.format(periodDate)

          return (
            <li key={permit.permitCode} className="first:rounded-t-2xl last:rounded-b-2xl">
              <Link
                href={{
                  pathname: "/dashboard/reports/new/work-permit",
                  query: { view: "readonly", source: "history", permitCode: permit.permitCode, historyPage: page },
                }}
                className="flex items-center gap-3 rounded-[inherit] px-4 py-4 text-card-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="break-all text-xs font-medium text-muted-foreground">{permit.permitCode}</span>
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", status.color)}>{status.label}</span>
                  </div>
                  <p className="break-words text-sm font-semibold sm:text-base">{permit.kegiatan}</p>
                  <p className="break-words text-sm text-muted-foreground">{permit.lokasi}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Periode {periodLabel}</span>
                    <span>Diajukan <time dateTime={permit.applicantSignedAt.toISOString()}>{submissionFormatter.format(permit.applicantSignedAt)}</time></span>
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>

      {pageCount > 1 && (
        <nav aria-label="Halaman riwayat izin kerja" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Halaman {page} dari {pageCount}</p>
          <div className="flex flex-wrap gap-2">
            {page > 1 && (
              <Link href={getWorkPermitHistoryHref(String(page - 1))} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Sebelumnya
              </Link>
            )}
            {page < pageCount && (
              <Link href={getWorkPermitHistoryHref(String(page + 1))} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Selanjutnya
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
