import Link from "next/link"
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react"
import { getApprovalTokenDetails } from "@/lib/work-permits/email-approval"
import { TokenApprovalInteractiveView } from "@/components/work-permits/token-approval-interactive-view"

type WorkPermitsApprovePageProps = {
  searchParams: Promise<{ token?: string }>
}

export const dynamic = "force-dynamic"

export default async function WorkPermitsApprovePage(props: WorkPermitsApprovePageProps) {
  const searchParams = await props.searchParams
  const token = searchParams.token

  if (!token || typeof token !== "string") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Tautan Tidak Lengkap</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Parameter token persetujuan tidak ditemukan. Silakan klik tombol <strong>Buka halaman persetujuan</strong> langsung dari email yang Anda terima.
          </p>
        </div>
      </div>
    )
  }

  const tokenData = await getApprovalTokenDetails(token)

  if (!tokenData.ok || !tokenData.tokenRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Tautan Tidak Dikenali</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {tokenData.error || "Token persetujuan tidak ditemukan di sistem atau database."}
          </p>
        </div>
      </div>
    )
  }

  const { tokenRecord, isUsed, isExpired, isStageMismatch } = tokenData
  const permit = tokenRecord.permit
  const roleLabel = tokenRecord.approvalRole === "SECRETARY" ? "Sekretaris P2K3" : "P2K3 / Delegate"

  // Case 1: Tautan sudah pernah digunakan
  if (isUsed) {
    const isApproved = tokenRecord.decision === "APPROVED"
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div
            className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
              isApproved ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {isApproved ? <CheckCircle2 className="size-8" /> : <XCircle className="size-8" />}
          </div>
          <span
            className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${
              isApproved ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {isApproved ? "Telah Disetujui (ACC)" : "Telah Ditolak"}
          </span>
          <h1 className="mt-3 text-lg font-bold text-slate-900">Tautan Sudah Pernah Digunakan</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Keputusan persetujuan untuk izin kerja{" "}
            <span className="font-mono font-semibold text-slate-800">{permit.permitCode}</span> telah diproses sebelumnya dan tautan ini sudah tidak dapat digunakan kembali.
          </p>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Penyetuju:</span>
              <span className="font-semibold text-slate-800">{tokenRecord.approverName} ({roleLabel})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Waktu Proses:</span>
              <span className="font-medium text-slate-800">
                {tokenRecord.usedAt
                  ? new Date(tokenRecord.usedAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
              </span>
            </div>
            {tokenRecord.notes && (
              <div className="pt-1">
                <span className="text-slate-500">Catatan:</span>
                <p className="mt-0.5 font-medium text-slate-800 italic bg-white p-2 rounded border border-slate-200">
                  "{tokenRecord.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Case 2: Tautan sudah kedaluwarsa
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock className="size-8" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Tautan Persetujuan Kedaluwarsa</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Masa aktif tautan persetujuan ini telah berakhir pada{" "}
            <strong>
              {new Date(tokenRecord.expiresAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </strong>
            . Silakan minta pemohon untuk menerbitkan ulang atau hubungi administrator.
          </p>
        </div>
      </div>
    )
  }

  // Case 3: Status pengajuan sudah tidak cocok dengan tahap ini
  if (isStageMismatch) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Tahap Persetujuan Tidak Aktif</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Pengajuan izin kerja <span className="font-mono font-semibold">{permit.permitCode}</span> saat ini berada pada status{" "}
            <strong>{permit.status}</strong>, sehingga permohonan pada tautan ini sudah tidak dapat diubah.
          </p>
        </div>
      </div>
    )
  }

  // Extract Safety Payload details
  const safetyPayload = (permit.safetyPayload || {}) as Record<string, any>
  const apdItemsObj = (safetyPayload.apd?.items || {}) as Record<string, boolean>
  const apdList = Object.entries(apdItemsObj)
    .filter(([_, active]) => Boolean(active))
    .map(([key]) => key)

  const highRiskList: string[] = []
  if (safetyPayload.hotWork?.active) highRiskList.push("Pekerjaan Panas (Hot Work / Las / Gerinda)")
  if (safetyPayload.workHeight?.active) highRiskList.push("Pekerjaan di Ketinggian (> 1.8 Meter)")
  if (safetyPayload.confinedSpace?.active) highRiskList.push("Pekerjaan di Ruang Terbatas (Confined Space)")
  if (safetyPayload.electrical?.active) highRiskList.push("Pekerjaan Listrik Bertegangan (Electrical)")

  const approvalHistory = Array.isArray(permit.approvalHistory)
    ? (permit.approvalHistory as any[]).map((item) => ({
        actorName: item.actorName || "Penyetuju",
        actorNik: item.actorNik || "",
        approvalRole: item.approvalRole || item.stage || "VERIFIER",
        decision: item.decision || "APPROVED",
        notes: item.notes,
        decidedAt: item.decidedAt || new Date().toISOString(),
      }))
    : []

  const formattedWorkDate = permit.workDate
    ? new Date(permit.workDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff8a2a] text-black font-extrabold shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900">
                SPARTA ENGINEERING
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Sistem Perizinan K3 & Verifikasi Lapangan
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-2xs">
              🔒 Verifikasi Token Email
            </span>
          </div>
        </div>

        {/* Main Interactive View */}
        <TokenApprovalInteractiveView
          token={token}
          approverName={tokenRecord.approverName}
          approverEmail={tokenRecord.approverEmail}
          approvalRole={tokenRecord.approvalRole}
          targetStage={tokenRecord.targetStage}
          permitCode={permit.permitCode}
          applicantName={permit.applicantName || permit.applicant.name}
          applicantNik={permit.applicantNik}
          branchName={permit.applicant.branchName}
          lokasi={permit.lokasi}
          kegiatan={permit.kegiatan}
          workDate={formattedWorkDate}
          targetPeriod={safetyPayload.targetPeriod || "-"}
          duration={permit.duration}
          workers={Array.isArray(permit.workers) ? (permit.workers as string[]) : []}
          apdList={apdList}
          highRiskList={highRiskList}
          approvalHistory={approvalHistory}
        />

        <div className="mt-8 text-center text-[11px] text-slate-400">
          SPARTA K3 Verifier • SAT Maintenance Engineering System
        </div>
      </div>
    </div>
  )
}
