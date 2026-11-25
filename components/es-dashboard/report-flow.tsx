import Link from "next/link"
import { ClipboardCheck, ClipboardList, Wrench } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ReportChoiceCard } from "@/components/es-dashboard/report-choice-card"

export function ReportFlow({ hasActivePermit = false }: { hasActivePermit?: boolean } = {}) {
  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="text-lg">Pilih Aktivitas</CardTitle>
        <CardDescription>{hasActivePermit ? "Mulai pemeriksaan atau laporkan temuan di lapangan." : "Jadwal rutin dapat dilihat. Aktifkan izin kerja sebelum mulai pekerjaan."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ReportChoiceCard href="/dashboard/checklists" title="Checklist Rutin" description="Lihat dan kerjakan tugas preventif sesuai penugasan PIC." icon={ClipboardCheck} />
          <ReportChoiceCard href="/dashboard/reports/new/repair/area" title="Perbaikan / Temuan" description={hasActivePermit ? "Laporkan kerusakan atau temuan non-rutin." : "Memerlukan izin kerja aktif."} icon={Wrench} disabled={!hasActivePermit} />
          <ReportChoiceCard href="/dashboard/reports/new/checklist/area?catalog=general" title="General Checklist" description={hasActivePermit ? "Pilih form checklist berdasarkan area dan ruangan." : "Memerlukan izin kerja aktif."} icon={ClipboardList} disabled={!hasActivePermit} />
        </div>
        <Link href="/dashboard/reports/new" className="inline-flex min-h-9 items-center text-sm font-medium text-orange-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-orange-500">Buka alur laporan &amp; izin kerja</Link>
      </CardContent>
    </Card>
  )
}
