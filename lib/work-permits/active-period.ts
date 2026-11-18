import type { Prisma, WorkPermit } from "@/generated/prisma"

type PermitPeriodFields = Pick<WorkPermit, "safetyPayload" | "workDate">

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

export function formatWorkPermitMonth(period?: string | null) {
  if (!period) return ""
  const date = new Date(`${period}-01T00:00:00Z`)
  return Number.isFinite(date.getTime()) ? monthFormatter.format(date) : period
}

export function getWorkPermitPeriod(permit: PermitPeriodFields): string {
  const payload = permit.safetyPayload
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const targetPeriod = payload.targetPeriod
    if (typeof targetPeriod === "string" && targetPeriod) return targetPeriod
  }

  return permit.workDate.toISOString().slice(0, 7)
}

export function hasRequiredApprovals(permit: {
  status: string
  approvalHistory?: unknown
  managerNik?: string | null
  managerSignedAt?: Date | null
}): boolean {
  if (permit.status !== "APPROVED") return false
  const history = Array.isArray(permit.approvalHistory)
    ? permit.approvalHistory.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object" && !Array.isArray(item)
      )
    : []

  if (history.length > 0) {
    const hasMgr =
      history.some(
        (h) =>
          (h.approvalRole === "MANAGER" || h.accountRole === "MANAGER" || h.stage === "PENDING_MANAGER") &&
          h.decision === "APPROVED"
      ) || Boolean(permit.managerNik && permit.managerSignedAt)
    const hasP2K3 = history.some(
      (h) =>
        (h.approvalRole === "P2K3" || h.approvalRole === "DELEGATE" || h.stage === "PENDING_P2K3") &&
        h.decision === "APPROVED"
    )
    const hasSec = history.some(
      (h) =>
        (h.approvalRole === "SECRETARY" || h.stage === "PENDING_SECRETARY") &&
        h.decision === "APPROVED"
    )
    return Boolean(hasMgr && hasP2K3 && hasSec)
  }

  return false
}

export function getActiveWorkPermitWhere(applicantNik: string, period: string): Prisma.WorkPermitWhereInput {
  const monthStart = new Date(`${period}-01T00:00:00.000Z`)
  const nextMonthStart = new Date(monthStart)
  nextMonthStart.setUTCMonth(nextMonthStart.getUTCMonth() + 1)

  return {
    applicantNik,
    status: "APPROVED",
    OR: [
      { safetyPayload: { path: ["targetPeriod"], equals: period } },
      { workDate: { gte: monthStart, lt: nextMonthStart } },
    ],
  }
}

export function selectActiveWorkPermit<
  T extends PermitPeriodFields & Pick<WorkPermit, "status"> & {
    approvalHistory?: unknown
    managerNik?: string | null
    managerSignedAt?: Date | null
  }
>(candidates: T[], period: string): T | null {
  return (
    candidates.find(
      (permit) =>
        permit.status === "APPROVED" &&
        getWorkPermitPeriod(permit) === period &&
        hasRequiredApprovals(permit)
    ) ?? null
  )
}
