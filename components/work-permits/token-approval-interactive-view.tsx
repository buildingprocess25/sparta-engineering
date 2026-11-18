"use client"

import * as React from "react"
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, ShieldCheck, ArrowRight, UserCheck } from "lucide-react"
import { submitTokenDecisionAction } from "@/app/work-permits/approve/actions"

type TokenApprovalInteractiveViewProps = {
  token: string
  approverName: string
  approverEmail: string
  approvalRole: string
  targetStage: string
  permitCode: string
  applicantName: string
  applicantNik: string
  branchName: string
  lokasi: string
  kegiatan: string
  workDate: string
  targetPeriod: string
  duration: string
  workers: string[]
  apdList: string[]
  highRiskList: string[]
  approvalHistory: Array<{
    actorName: string
    actorNik: string
    approvalRole: string
    decision: string
    notes?: string
    decidedAt: string
  }>
}

export function TokenApprovalInteractiveView({
  token,
  approverName,
  approverEmail,
  approvalRole,
  targetStage,
  permitCode,
  applicantName,
  applicantNik,
  branchName,
  lokasi,
  kegiatan,
  workDate,
  targetPeriod,
  duration,
  workers,
  apdList,
  highRiskList,
  approvalHistory,
}: TokenApprovalInteractiveViewProps) {
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [decisionResult, setDecisionResult] = React.useState<{
    decision: "APPROVED" | "REJECTED"
    decidedAt: string
    notes?: string
    nextStatus?: string
  } | null>(null)

  const roleLabel = approvalRole === "SECRETARY" ? "Sekretaris P2K3" : "P2K3 / Delegate"

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    if (decision === "REJECTED" && !notes.trim()) {
      setErrorMessage("Catatan / alasan penolakan wajib diisi bila menolak izin kerja.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await submitTokenDecisionAction(token, decision, notes)
      if (!res.ok) {
        setErrorMessage(res.error || "Gagal menyimpan keputusan.")
        setIsSubmitting(false)
        return
      }

      setDecisionResult({
        decision,
        decidedAt: new Date().toISOString(),
        notes: notes.trim(),
        nextStatus: (res as any).permit?.status,
      })
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan sistem: " + (err.message || String(err)))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (decisionResult) {
    const isAcc = decisionResult.decision === "APPROVED"
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex size-16 items-center justify-center rounded-2xl ${
              isAcc ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {isAcc ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}
          </div>

          <span
            className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
              isAcc ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {isAcc ? "Disetujui (ACC)" : "Ditolak"}
          </span>

          <h2 className="mt-3 text-xl font-bold text-slate-900">
            {isAcc ? "Keputusan Persetujuan Berhasil Disimpan" : "Izin Kerja Ditolak"}
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-md">
            Keputusan Anda sebagai <strong>{roleLabel}</strong> untuk permohonan izin kerja{" "}
            <span className="font-mono font-semibold text-slate-800">{permitCode}</span> telah
            tercatat di sistem SPARTA.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2 max-w-md mx-auto">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Penyetuju:</span>
            <span className="font-semibold text-slate-800">{approverName} ({roleLabel})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Waktu Keputusan:</span>
            <span className="font-medium text-slate-800">
              {new Date(decisionResult.decidedAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Status Terkini:</span>
            <span className="font-bold text-emerald-700">
              {decisionResult.nextStatus === "APPROVED"
                ? "DISETUJUI LENGKAP"
                : decisionResult.nextStatus === "PENDING_SECRETARY"
                ? "MENUNGGU SEKRETARIS P2K3"
                : decisionResult.nextStatus}
            </span>
          </div>
          {decisionResult.notes && (
            <div className="pt-1">
              <span className="text-slate-500">Catatan:</span>
              <p className="mt-0.5 font-medium text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                "{decisionResult.notes}"
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Halaman ini dapat Anda tutup sekarang. Tautan ini telah dinonaktifkan untuk mencegah duplikasi keputusan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Approver Header Banner */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ff8a2a] text-black">
            <UserCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Konfirmasi Penyetuju K3</h2>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                {roleLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Anda masuk sebagai <strong>{approverName}</strong> ({approverEmail}). Tautan ini dikhususkan bagi Anda untuk memberikan keputusan perizinan.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Permohonan Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="size-4 text-[#ff8a2a]" />
          Ringkasan Permohonan Izin Kerja (SAT/FRM/MED/003)
        </h3>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-slate-500 block mb-1">Nomor Izin Kerja:</span>
            <span className="font-mono text-sm font-bold text-slate-900">{permitCode}</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-slate-500 block mb-1">Periode Target Pelaksanaan:</span>
            <span className="text-sm font-bold text-sky-800">{targetPeriod} ({workDate})</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-slate-500 block mb-1">Pemohon (Engineering Staff):</span>
            <span className="font-semibold text-slate-900">{applicantName}</span>
            <span className="text-slate-500 block mt-0.5 font-mono">NIK: {applicantNik}</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <span className="text-slate-500 block mb-1">Cabang & Lokasi Pekerjaan:</span>
            <span className="font-semibold text-slate-900">{branchName}</span>
            <span className="text-slate-600 block mt-0.5">{lokasi}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-3">
          <div>
            <span className="text-slate-500 block font-medium">Uraian Pekerjaan / Kegiatan:</span>
            <p className="mt-1 font-semibold text-slate-800 text-sm">{kegiatan}</p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200/60">
            <div>
              <span className="text-slate-500">Pelaksana:</span>{" "}
              <span className="font-semibold text-slate-800">{workers.length > 0 ? workers.join(", ") : "Tim Internal ES"}</span>
            </div>
            <div>
              <span className="text-slate-500">Estimasi Durasi:</span>{" "}
              <span className="font-semibold text-slate-800">{duration || "1 Hari"}</span>
            </div>
          </div>
        </div>

        {/* APD & Safety */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 mb-2">Peralatan Keselamatan & APD Wajib:</h4>
          <div className="flex flex-wrap gap-1.5">
            {apdList.length > 0 ? (
              apdList.map((apd, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200"
                >
                  ✓ {apd}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Standar APD dasar berlaku (Helm, Rompi, Sepatu Safety)</span>
            )}
          </div>
        </div>

        {/* Pekerjaan Berisiko Tinggi */}
        {highRiskList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-rose-600" />
              Pekerjaan Berisiko Tinggi Aktif:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {highRiskList.map((risk, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 border border-rose-200"
                >
                  ⚠️ {risk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat Approval Sebelumnya */}
        {approvalHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Riwayat Verifikasi Sebelumnya:</h4>
            <div className="space-y-2">
              {approvalHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{item.actorName}</span>{" "}
                    <span className="text-slate-500">({item.approvalRole})</span>
                    {item.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">"{item.notes}"</p>}
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    {item.decision}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decision Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Keputusan Persetujuan</h3>
        <p className="mt-1 text-xs text-slate-500">
          Sebagai <strong>{roleLabel}</strong>, pastikan seluruh persyaratan keselamatan telah terpenuhi sebelum memberikan persetujuan (ACC).
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="notes" className="block text-xs font-medium text-slate-700 mb-1.5">
            Catatan Penyetuju / Alasan (Wajib jika menolak, opsional jika menyetujui):
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            placeholder="Contoh: APD lengkap dan terverifikasi, disetujui untuk pelaksanaan..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#ff8a2a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ff8a2a]"
          />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => handleDecision("APPROVED")}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Setujui Izin Kerja (ACC)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDecision("REJECTED")}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-5 py-3 text-xs font-bold text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <XCircle className="size-4" />
            <span>Tolak Izin Kerja</span>
          </button>
        </div>
      </div>
    </div>
  )
}
