import Link from "next/link"
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react"
import { getOutboxEmails } from "@/lib/work-permits/email-approval"
import { OutboxView } from "@/components/demo/outbox-view"

export const dynamic = "force-dynamic"

export default async function DemoOutboxPage() {
  const emails = await getOutboxEmails()

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#ff8a2a] text-black font-extrabold shadow-sm">
                <Mail className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Kotak Keluar Email Demo (Simulasi VP)
                </h1>
                <p className="text-xs text-slate-500">
                  Simulasi email notifikasi persetujuan Izin Kerja K3 (MED/003) untuk verifikasi P2K3 &amp; Sekretaris P2K3
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              ● Mode Simulasi Aktif
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs">
          <p className="font-semibold mb-0.5">Alur Email Demo:</p>
          <p className="leading-relaxed text-blue-800">
            Setelah BNM Manager menyetujui pengajuan izin kerja dari dashboard, email permintaan persetujuan muncul di bawah ini untuk <strong>P2K3 / Delegate</strong>. Klik tombol <strong>Buka halaman persetujuan</strong> untuk memutuskan persetujuan tanpa login. Setelah P2K3 ACC, email berikutnya akan otomatis terkirim untuk <strong>Sekretaris P2K3</strong>.
          </p>
        </div>

        {/* Outbox View List */}
        <OutboxView initialEmails={emails} />
      </div>
    </div>
  )
}
