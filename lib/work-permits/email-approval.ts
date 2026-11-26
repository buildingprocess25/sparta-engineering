import crypto from "crypto"
import { getPrisma } from "@/lib/prisma"
import { getSpartaAppMode } from "@/lib/sparta-app-mode"
import type { Prisma, WorkPermit, WorkPermitApprovalRole, WorkPermitStatus } from "@/generated/prisma"

const DEFAULT_BASE_URL = "http://localhost:3000"

export function getAppBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "")
}

export type SimulatedEmailItem = {
  id: string
  toEmail: string
  toName: string | null
  subject: string
  bodyHtml: string
  bodyText: string | null
  actionUrl: string | null
  metadata: {
    permitId?: string
    permitCode?: string
    stage?: WorkPermitStatus
    role?: WorkPermitApprovalRole
    approverNik?: string
  } | null
  sentAt: Date
  readAt: Date | null
  createdAt: Date
}

function approverRolesFor(stage: WorkPermitStatus): WorkPermitApprovalRole[] {
  if (stage === "PENDING_P2K3") return ["P2K3", "DELEGATE"]
  if (stage === "PENDING_SECRETARY") return ["SECRETARY"]
  return []
}

async function hasActiveTokenAssignment(
  client: Pick<Prisma.TransactionClient, "workPermitApprover">,
  token: {
    approvalRole: WorkPermitApprovalRole
    targetStage: WorkPermitStatus
    approverNik: string
    permit: { applicant: { NIK: string; branchName: string } }
  }
) {
  const applicant = token.permit.applicant
  const branch = applicant.branchName.trim()
  if (
    !branch ||
    token.approverNik === applicant.NIK ||
    !approverRolesFor(token.targetStage).includes(token.approvalRole)
  ) return false

  const branchScope = { equals: branch, mode: "insensitive" } as const
  const assignment = await client.workPermitApprover.findFirst({
    where: {
      userNik: token.approverNik,
      approvalRole: token.approvalRole,
      isActive: true,
      branchName: branchScope,
      user: { branchName: branchScope },
    },
    select: { id: true },
  })
  return Boolean(assignment)
}

export async function sendApprovalEmail(
  permitId: string,
  targetStage: "PENDING_P2K3" | "PENDING_SECRETARY"
): Promise<{ ok: boolean; emailId?: string; token?: string; error?: string }> {
  if (getSpartaAppMode() !== "demo") {
    return { ok: false, error: "Pengiriman email simulasi hanya tersedia dalam mode demo." }
  }

  const prisma = getPrisma()

  const permit = await prisma.workPermit.findUnique({
    where: { id: permitId },
    include: {
      applicant: { select: { NIK: true, name: true, branchName: true, email: true } },
    },
  })

  if (!permit) {
    return { ok: false, error: "Izin kerja tidak ditemukan." }
  }

  const applicantBranch = permit.applicant.branchName.trim()
  if (!applicantBranch) {
    return { ok: false, error: "Cabang pemohon belum dikonfigurasi." }
  }

  // 1. Cari approver yang ditugaskan di cabang pemohon
  const approver = await prisma.workPermitApprover.findFirst({
    where: {
      branchName: { equals: applicantBranch, mode: "insensitive" },
      approvalRole: { in: approverRolesFor(targetStage) },
      userNik: { not: permit.applicant.NIK },
      user: { branchName: { equals: applicantBranch, mode: "insensitive" } },
      isActive: true,
    },
    include: {
      user: { select: { NIK: true, name: true, email: true } },
    },
  })

  const approverEmail = approver?.email?.trim() || approver?.user.email?.trim()
  if (!approver || !approverEmail) {
    return { ok: false, error: "Kontak penyetuju untuk cabang ini belum dikonfigurasi." }
  }
  const approverNik = approver.userNik
  const approverName = approver.name || approver.user.name
  const assignedRole = approver.approvalRole

  // 2. Cegah token ganda yang masih aktif
  const existingActiveToken = await prisma.workPermitApprovalToken.findFirst({
    where: {
      permitId: permit.id,
      targetStage,
      approverNik,
      approvalRole: assignedRole,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  let tokenStr: string
  if (existingActiveToken) {
    tokenStr = existingActiveToken.token
  } else {
    tokenStr = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari

    await prisma.workPermitApprovalToken.create({
      data: {
        token: tokenStr,
        permitId: permit.id,
        approverNik,
        approverName,
        approverEmail,
        approvalRole: assignedRole,
        targetStage,
        expiresAt,
      },
    })
  }

  const baseUrl = getAppBaseUrl()
  const actionUrl = `${baseUrl}/work-permits/approve?token=${tokenStr}`
  const stageLabel = targetStage === "PENDING_P2K3" ? "P2K3 / Delegate" : "Sekretaris P2K3"
  const stageNumber = targetStage === "PENDING_P2K3" ? "Tahap 2 dari 3" : "Tahap 3 dari 3 (Akhir)"

  const safetyPayload = (permit.safetyPayload || {}) as Record<string, unknown>
  const targetPeriod = String(safetyPayload.targetPeriod || "-")
  const formattedWorkDate = permit.workDate
    ? new Date(permit.workDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"

  const subject = `[Persetujuan Izin Kerja K3] ${permit.permitCode} - Menunggu ACC ${stageLabel}`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 32px; color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255,138,42,0.2); color: #ff8a2a; padding: 4px 8px; border-radius: 6px;">SPARTA K3 SYSTEM</span>
        <span style="font-size: 12px; color: #94a3b8;">${stageNumber}</span>
      </div>
      <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700;">Permintaan Persetujuan Izin Kerja</h1>
      <p style="margin: 0; font-size: 13px; color: #cbd5e1;">Formulir SAT/FRM/MED/003 (Izin Kerja Risiko Tinggi & Pemeliharaan)</p>
    </div>

    <div style="padding: 32px;">
      <p style="font-size: 14px; margin-top: 0; line-height: 1.6;">
        Halo <strong>${approverName}</strong> (${stageLabel}),
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Terdapat pengajuan Izin Kerja K3 (MED/003) baru yang membutuhkan persetujuan Anda sebagai penjamin keselamatan kerja di cabang <strong>${applicantBranch}</strong>.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">No. Izin Kerja</td>
            <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #0f172a;">${permit.permitCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Pemohon</td>
            <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${permit.applicantName || permit.applicant.name} (${permit.applicantNik})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Cabang / Lokasi</td>
            <td style="padding: 6px 0; color: #1e293b;">${applicantBranch} / ${permit.lokasi}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Rencana Kegiatan</td>
            <td style="padding: 6px 0; color: #1e293b;">${permit.kegiatan}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Periode Target</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0369a1;">${targetPeriod} (Tgl: ${formattedWorkDate})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Tahap Saat Ini</td>
            <td style="padding: 6px 0; font-weight: 700; color: #b45309;">${stageLabel}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${actionUrl}" style="background-color: #ff8a2a; color: #000000; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Buka Halaman Persetujuan
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin: 0 auto; max-width: 440px;">
        Tombol di atas menggunakan tautan persetujuan aman tanpa perlu login manual. Tautan berlaku 7 hari dan hanya dapat digunakan untuk 1 kali pengambilan keputusan (Setujui / Tolak).
      </p>
    </div>

    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center;">
      Simulasi Kotak Keluar Email SPARTA Engineering • Pengujian Lokal & VP Demo
    </div>
  </div>
</body>
</html>
`

  const bodyText = `
[Persetujuan Izin Kerja K3]
No. Izin: ${permit.permitCode}
Tahap: ${stageLabel} (${stageNumber})
Pemohon: ${permit.applicantName || permit.applicant.name} (${permit.applicantNik})
Lokasi: ${applicantBranch} / ${permit.lokasi}
Kegiatan: ${permit.kegiatan}
Periode Target: ${targetPeriod}

Buka halaman persetujuan berikut untuk memberikan keputusan (ACC / Tolak):
${actionUrl}

Tautan di atas aman tanpa login dan hanya dapat digunakan 1 kali.
`

  const emailRecord = await prisma.demoOutboxEmail.create({
    data: {
      toEmail: approverEmail,
      toName: approverName,
      subject,
      bodyHtml,
      bodyText,
      actionUrl,
      metadata: {
        permitId: permit.id,
        permitCode: permit.permitCode,
        stage: targetStage,
        role: assignedRole,
        approverNik,
      },
    },
  })

  return {
    ok: true,
    emailId: emailRecord.id,
    token: tokenStr,
  }
}

export async function getOutboxEmails(): Promise<SimulatedEmailItem[]> {
  const prisma = getPrisma()
  const emails = await prisma.demoOutboxEmail.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
  })
  return emails as unknown as SimulatedEmailItem[]
}

export async function clearOutboxEmails(): Promise<{ ok: boolean; count: number }> {
  const prisma = getPrisma()
  const deleted = await prisma.demoOutboxEmail.deleteMany({})
  return { ok: true, count: deleted.count }
}

export async function getApprovalTokenDetails(token: string) {
  const prisma = getPrisma()
  const tokenRecord = await prisma.workPermitApprovalToken.findUnique({
    where: { token },
    include: {
      permit: {
        include: {
          applicant: { select: { NIK: true, name: true, branchName: true, email: true } },
          manager: { select: { NIK: true, name: true, email: true } },
        },
      },
    },
  })

  if (!tokenRecord) {
    return { ok: false, error: "Tautan token tidak valid atau tidak ditemukan." }
  }

  if (!(await hasActiveTokenAssignment(prisma, tokenRecord))) {
    return { ok: false, error: "Tautan ini tidak lagi memiliki penugasan aktif untuk cabang pemohon." }
  }

  const now = new Date()
  const isUsed = Boolean(tokenRecord.usedAt)
  const isExpired = now > tokenRecord.expiresAt
  const isStageMismatch = tokenRecord.permit.status !== tokenRecord.targetStage
  const canDecide = !isUsed && !isExpired && !isStageMismatch

  return {
    ok: true,
    tokenRecord,
    isUsed,
    isExpired,
    isStageMismatch,
    canDecide,
  }
}

export type SubmitTokenDecisionResult =
  | {
      ok: true
      permit: WorkPermit
      stage: WorkPermitStatus
      decision: "APPROVED" | "REJECTED"
      approverName: string
      approvalRole: WorkPermitApprovalRole
      nextStageTrigger?: { permitId: string; stage: "PENDING_SECRETARY" } | null
    }
  | {
      ok: false
      error: string
    }

export async function submitTokenDecision(input: {
  token: string
  decision: "APPROVED" | "REJECTED"
  notes?: string
}): Promise<SubmitTokenDecisionResult> {
  const { token, decision, notes } = input
  const prisma = getPrisma()

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return { ok: false, error: "Keputusan persetujuan tidak valid." }
  }

  const decisionNotes = typeof notes === "string" ? notes.trim() : ""
  if (decision === "REJECTED" && !decisionNotes) {
    return { ok: false, error: "Alasan penolakan izin kerja wajib diisi." }
  }

  const now = new Date()

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ambil token dan permit
      const tokenRecord = await tx.workPermitApprovalToken.findUnique({
        where: { token },
        include: {
          permit: {
            include: {
              applicant: { select: { NIK: true, name: true, branchName: true } },
            },
          },
        },
      })

      if (!tokenRecord) {
        return { ok: false as const, error: "Tautan token persetujuan tidak valid." }
      }

      if (tokenRecord.usedAt) {
        return {
          ok: false as const,
          error: "Tautan persetujuan ini sudah pernah digunakan sebelumnya.",
        }
      }

      if (now > tokenRecord.expiresAt) {
        return {
          ok: false as const,
          error: "Tautan persetujuan ini sudah kedaluwarsa.",
        }
      }

      if (tokenRecord.permit.status !== tokenRecord.targetStage) {
        return {
          ok: false as const,
          error: `Status izin kerja saat ini (${tokenRecord.permit.status}) tidak sesuai dengan tahap token ini (${tokenRecord.targetStage}).`,
        }
      }

      if (!(await hasActiveTokenAssignment(tx, tokenRecord))) {
        return { ok: false as const, error: "Tautan ini tidak lagi memiliki penugasan aktif untuk cabang pemohon." }
      }

      // Kunci penggunaan token secara atomic untuk mencegah concurrency race condition
      const updateTokenResult = await tx.workPermitApprovalToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
        },
        data: {
          usedAt: now,
          decision,
          notes: decisionNotes || null,
        },
      })

      if (updateTokenResult.count === 0) {
        return {
          ok: false as const,
          error: "Keputusan untuk tautan ini sudah diproses oleh request bersamaan lain.",
        }
      }

      // Tentukan status berikutnya
      let nextStatus: WorkPermitStatus
      if (decision === "REJECTED") {
        nextStatus = "REJECTED"
      } else if (tokenRecord.targetStage === "PENDING_P2K3") {
        nextStatus = "PENDING_SECRETARY"
      } else if (tokenRecord.targetStage === "PENDING_SECRETARY") {
        nextStatus = "APPROVED"
      } else {
        nextStatus = "APPROVED"
      }

      const currentHistory = Array.isArray(tokenRecord.permit.approvalHistory)
        ? (tokenRecord.permit.approvalHistory as Array<Record<string, unknown>>)
        : []

      const auditEntry = {
        actorNik: tokenRecord.approverNik,
        actorName: tokenRecord.approverName,
        accountRole: "EMAIL_LINK",
        approvalRole: tokenRecord.approvalRole,
        stage: tokenRecord.targetStage,
        decision,
        notes:
          decisionNotes ||
          (decision === "APPROVED"
            ? `Disetujui via tautan email oleh ${tokenRecord.approvalRole}`
            : "Ditolak via tautan email"),
        decidedAt: now.toISOString(),
        via: "EMAIL_LINK",
        tokenId: tokenRecord.id,
      }

      const updatedPermit = await tx.workPermit.update({
        where: { id: tokenRecord.permitId, status: tokenRecord.targetStage },
        data: {
          status: nextStatus,
          updatedAt: now,
          approvalHistory: [...currentHistory, auditEntry] as Prisma.InputJsonValue,
        },
      })

      const nextStageTrigger =
        decision === "APPROVED" && nextStatus === "PENDING_SECRETARY"
          ? {
              permitId: tokenRecord.permitId,
              stage: "PENDING_SECRETARY" as const,
            }
          : null

      return {
        ok: true as const,
        permit: updatedPermit,
        stage: tokenRecord.targetStage,
        decision,
        approverName: tokenRecord.approverName,
        approvalRole: tokenRecord.approvalRole,
        nextStageTrigger,
      }
    })

    if (!result.ok) {
      return result
    }

    // 2. Jika tahap P2K3 disetujui, kirim email berikutnya untuk Sekretaris P2K3
    if (result.nextStageTrigger) {
      try {
        await sendApprovalEmail(
          result.nextStageTrigger.permitId,
          result.nextStageTrigger.stage
        )
      } catch (emailErr) {
        console.error("Gagal mengirim email tindak lanjut ke Sekretaris P2K3:", emailErr)
      }
    }

    return result
  } catch (err: unknown) {
    console.error("Error executing submitTokenDecision:", err)
    const message = err instanceof Error ? err.message || String(err) : String(err)
    return { ok: false as const, error: "Gagal memproses keputusan token: " + message }
  }
}
