"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Inbox,
  Clock,
  ShieldCheck,
} from "lucide-react"
import { clearOutboxAction } from "@/app/demo/outbox/actions"
import type { SimulatedEmailItem } from "@/lib/work-permits/email-approval"

interface OutboxViewProps {
  initialEmails: SimulatedEmailItem[]
}

export function OutboxView({ initialEmails }: OutboxViewProps) {
  const router = useRouter()
  const [emails, setEmails] = React.useState<SimulatedEmailItem[]>(initialEmails)
  const [expandedId, setExpandedId] = React.useState<string | null>(
    initialEmails.length > 0 ? initialEmails[0].id : null
  )
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isClearing, setIsClearing] = React.useState(false)

  React.useEffect(() => {
    setEmails(initialEmails)
  }, [initialEmails])

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleClear = async () => {
    if (!window.confirm("Hapus seluruh riwayat email outbox simulasi ini?")) {
      return
    }
    setIsClearing(true)
    try {
      await clearOutboxAction()
      setEmails([])
      setExpandedId(null)
      router.refresh()
    } finally {
      setIsClearing(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-[#ff8a2a]">
            <Inbox className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Email Terkirim (Simulasi)
            </h2>
            <p className="text-xs text-slate-500">
              Total {emails.length} email dalam antrean pengiriman lokal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Muat Ulang</span>
          </button>

          {emails.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all shadow-2xs disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {emails.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Mail className="size-7" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-800">
            Kotak Keluar Masih Kosong
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Belum ada email simulasi yang dikirim. Jalankan alur persetujuan: saat BNM Manager ACC
            pengajuan MED/003, email persetujuan untuk P2K3 / Delegate akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        /* Email List */
        <div className="space-y-4">
          {emails.map((email) => {
            const isExpanded = expandedId === email.id
            const meta = (email.metadata || {}) as Record<string, any>
            const stage = meta.stage as string | undefined
            const permitCode = meta.permitCode as string | undefined

            const stageBadge =
              stage === "PENDING_P2K3"
                ? "P2K3 / Delegate"
                : stage === "PENDING_SECRETARY"
                ? "Sekretaris P2K3"
                : "Approval K3"

            return (
              <div
                key={email.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300"
              >
                {/* Email Item Header */}
                <div
                  onClick={() => toggleExpand(email.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer bg-slate-50/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-[#ff8a2a]">
                      <Mail className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                          {email.toName || "Penerima"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          &lt;{email.toEmail}&gt;
                        </span>
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                          {stageBadge}
                        </span>
                        {permitCode && (
                          <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {permitCode}
                          </span>
                        )}
                      </div>

                      <h4 className="mt-1 text-xs font-bold text-slate-800 line-clamp-1">
                        {email.subject}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="size-3.5" />
                      <span>
                        {new Date(email.sentAt).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500">
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Item Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 bg-white space-y-4">
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-800">
                          Tautan Persetujuan Cepat (Tanpa Login):
                        </span>
                      </div>

                      {email.actionUrl ? (
                        <a
                          href={email.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff8a2a] px-4 py-2 text-xs font-bold text-black hover:bg-[#e0751d] shadow-2xs transition-all"
                        >
                          <span>Buka halaman persetujuan</span>
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tidak ada tautan aksi</span>
                      )}
                    </div>

                    {/* Email Body Preview */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-600">
                        <Eye className="size-3.5" />
                        <span>Pratinjau Tampilan Email:</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                        <iframe
                          title={`Email Preview ${email.id}`}
                          srcDoc={email.bodyHtml}
                          className="w-full h-[480px] bg-white rounded-lg border-0"
                          sandbox="allow-same-origin allow-popups allow-forms"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
