import type { Prisma } from "@/generated/prisma"

export const finalizedPermitStatuses = ["APPROVED", "COMPLETED"] as const

const stages = [
  { stage: "PENDING_MANAGER", roles: ["MANAGER"], label: "BNM Manager" },
  {
    stage: "PENDING_P2K3",
    roles: ["P2K3", "DELEGATE"],
    label: "P2K3 / Delegate",
  },
  {
    stage: "PENDING_SECRETARY",
    roles: ["SECRETARY"],
    label: "Sekretaris P2K3",
  },
]

type Approval = { name: string; label: string; decidedAt: string }

export function getFinalWorkPermitApproval(permit: {
  status: string
  approvalHistory: Prisma.JsonValue
}) {
  if (
    !finalizedPermitStatuses.some((status) => status === permit.status) ||
    !Array.isArray(permit.approvalHistory)
  )
    return null

  const approvals: Approval[] = []
  for (const stage of stages) {
    const entry = permit.approvalHistory.findLast(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (item.stage === stage.stage ||
          (typeof item.approvalRole === "string" &&
            stage.roles.includes(item.approvalRole)))
    )
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      entry.decision !== "APPROVED" ||
      typeof entry.decidedAt !== "string" ||
      !Number.isFinite(Date.parse(entry.decidedAt)) ||
      typeof entry.actorName !== "string" ||
      !entry.actorName.trim()
    )
      return null

    approvals.push({
      name: entry.actorName,
      label: stage.label,
      decidedAt: new Date(entry.decidedAt).toISOString(),
    })
  }

  return { approvals, decidedAt: approvals[2].decidedAt }
}
