import type { ReactNode } from "react"
import { Info } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PermitPublicLayout } from "@/components/work-permits/permit-public-layout"
import { TokenApprovalInteractiveView } from "@/components/work-permits/token-approval-interactive-view"
import { getApprovalTokenDetails } from "@/lib/work-permits/email-approval"

type WorkPermitsApprovePageProps = {
  searchParams: Promise<{ token?: string }>
}

export const dynamic = "force-dynamic"

const apdLabels: Record<string, string> = {
  helm: "Helm",
  sepatu: "Sepatu keselamatan",
  sarungTangan: "Sarung tangan",
  topiHelm: "Topi / Helm",
  kacamata: "Kacamata",
  masker: "Masker",
  faceshield: "Faceshield",
  weldingFacer: "Welding Facer",
  apron: "Apron",
  earPlug: "Ear Plug / Muff",
  safetyVest: "Safety Vest",
  sarungBahan: "Sarung Tangan Bahan",
  sarungKulit: "Sarung Tangan Kulit",
  sarungKaret: "Sarung Tangan Karet",
  safetyShoes: "Safety Shoes",
  weldingGloves: "Welding Gloves",
  dustMask: "Dust Mask",
  bodyHarness: "Body Harness",
}

const riskTypes = [
  ["hotWork", "Pekerjaan panas (las / gerinda)"],
  ["workHeight", "Pekerjaan di ketinggian (> 1,8 meter)"],
  ["confinedSpace", "Pekerjaan di ruang terbatas"],
  ["electrical", "Pekerjaan listrik bertegangan"],
] as const

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function ApprovalLinkState({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <PermitPublicLayout>
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <Info className="mb-2 size-7 text-muted-foreground" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-base leading-7 text-muted-foreground">
            {children}
          </div>
        </CardContent>
      </Card>
    </PermitPublicLayout>
  )
}

export default async function WorkPermitsApprovePage({
  searchParams,
}: WorkPermitsApprovePageProps) {
  const { token } = await searchParams
  if (!token || typeof token !== "string") {
    return (
      <ApprovalLinkState title="Tautan persetujuan tidak lengkap">
        <p>Buka kembali halaman persetujuan dari email yang Anda terima.</p>
      </ApprovalLinkState>
    )
  }

  const tokenData = await getApprovalTokenDetails(token)
  if (!tokenData.ok || !tokenData.tokenRecord) {
    return (
      <ApprovalLinkState title="Tautan persetujuan tidak ditemukan">
        <p>Periksa kembali email pengajuan izin kerja atau hubungi pemohon.</p>
      </ApprovalLinkState>
    )
  }

  const { tokenRecord, isUsed, isExpired, isStageMismatch } = tokenData
  const { permit, targetStage } = tokenRecord
  const roleLabel =
    tokenRecord.approvalRole === "SECRETARY"
      ? "Sekretaris P2K3"
      : "P2K3 / Delegate"

  if (isUsed) {
    return (
      <ApprovalLinkState title="Tautan sudah digunakan">
        <p>
          Izin kerja <strong>{permit.permitCode}</strong>{" "}
          {tokenRecord.decision === "APPROVED" ? "disetujui" : "ditolak"} pada
          tahap {roleLabel}.
        </p>
        <p>
          {tokenRecord.approverName}
          {tokenRecord.usedAt
            ? ` · ${dateTimeFormat.format(tokenRecord.usedAt)}`
            : ""}
        </p>
        {tokenRecord.notes && (
          <p className="break-words whitespace-pre-wrap">{tokenRecord.notes}</p>
        )}
      </ApprovalLinkState>
    )
  }

  if (isExpired) {
    return (
      <ApprovalLinkState title="Tautan persetujuan kedaluwarsa">
        <p>
          Masa aktif tautan berakhir pada{" "}
          {dateTimeFormat.format(tokenRecord.expiresAt)}. Hubungi pemohon untuk
          mendapatkan tautan baru.
        </p>
      </ApprovalLinkState>
    )
  }

  if (
    isStageMismatch ||
    (targetStage !== "PENDING_P2K3" && targetStage !== "PENDING_SECRETARY")
  ) {
    return (
      <ApprovalLinkState title="Tahap persetujuan sudah ditutup">
        <p>
          Pengajuan <strong>{permit.permitCode}</strong> tidak lagi menunggu
          keputusan dari tautan ini.
        </p>
      </ApprovalLinkState>
    )
  }

  const safety = jsonRecord(permit.safetyPayload)
  const apdList = Object.entries(jsonRecord(jsonRecord(safety.apd).items))
    .filter(([, selected]) => selected === true)
    .map(([key]) => apdLabels[key] || key)
  const highRiskList = riskTypes
    .filter(([key]) => jsonRecord(safety[key]).active === true)
    .map(([, label]) => label)
  const approvalHistory = Array.isArray(permit.approvalHistory)
    ? permit.approvalHistory.map((entry) => {
        const item = jsonRecord(entry)
        const date =
          typeof item.decidedAt === "string" ? Date.parse(item.decidedAt) : NaN
        return {
          actorName:
            typeof item.actorName === "string" ? item.actorName : "Penyetuju",
          approvalRole:
            typeof item.approvalRole === "string"
              ? item.approvalRole
              : String(item.stage || ""),
          decision: typeof item.decision === "string" ? item.decision : "",
          notes: typeof item.notes === "string" ? item.notes : undefined,
          decidedAt: Number.isNaN(date)
            ? undefined
            : new Date(date).toISOString(),
        }
      })
    : []

  return (
    <PermitPublicLayout>
      <TokenApprovalInteractiveView
        token={token}
        approverName={tokenRecord.approverName}
        approverEmail={tokenRecord.approverEmail}
        targetStage={targetStage}
        permitCode={permit.permitCode}
        applicantName={permit.applicantName || permit.applicant.name}
        applicantNik={permit.applicantNik}
        branchName={permit.applicant.branchName}
        lokasi={permit.lokasi}
        kegiatan={permit.kegiatan}
        workDate={permit.workDate.toLocaleDateString("id-ID", {
          dateStyle: "long",
          timeZone: "Asia/Jakarta",
        })}
        targetPeriod={
          typeof safety.targetPeriod === "string"
            ? safety.targetPeriod
            : "Belum dicantumkan"
        }
        duration={permit.duration}
        workers={
          Array.isArray(permit.workers)
            ? permit.workers
                .filter(
                  (worker): worker is string => typeof worker === "string"
                )
                .filter(Boolean)
            : []
        }
        apdList={apdList}
        highRiskList={highRiskList}
        approvalHistory={approvalHistory}
      />
    </PermitPublicLayout>
  )
}
