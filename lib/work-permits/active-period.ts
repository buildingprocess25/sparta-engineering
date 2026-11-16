import type { Prisma, WorkPermit } from "@/generated/prisma"

type PermitPeriodFields = Pick<WorkPermit, "safetyPayload" | "workDate">

export function getWorkPermitPeriod(permit: PermitPeriodFields): string {
  const payload = permit.safetyPayload
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const targetPeriod = payload.targetPeriod
    if (typeof targetPeriod === "string" && targetPeriod) return targetPeriod
  }

  return permit.workDate.toISOString().slice(0, 7)
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

export function selectActiveWorkPermit<T extends PermitPeriodFields & Pick<WorkPermit, "status">>(
  candidates: T[],
  period: string,
): T | null {
  return candidates.find((permit) => permit.status === "APPROVED" && getWorkPermitPeriod(permit) === period) ?? null
}
