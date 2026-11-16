import type { Prisma, User } from "@/generated/prisma"

export type WorkPermitUser = Pick<User, "NIK" | "role" | "branchName">

export function getApplicantWorkPermitScope(user: WorkPermitUser | null, userNik?: string) {
  if (user?.role !== "ES" || user.NIK !== userNik) return null
  return { applicantNik: user.NIK }
}

export function getManagerWorkPermitScope(user: WorkPermitUser | null): Prisma.WorkPermitWhereInput | null {
  if (user?.role !== "MANAGER" || !user.branchName.trim()) return null

  return {
    applicant: { branchName: { equals: user.branchName, mode: "insensitive" } },
  }
}

export function getPendingWorkPermitDecisionScope(
  user: WorkPermitUser | null,
  permitId: unknown,
): Prisma.WorkPermitWhereInput | null {
  if (typeof permitId !== "string" || !permitId.trim()) return null

  const scope = getManagerWorkPermitScope(user)
  if (!scope) return null

  return { ...scope, id: permitId, status: "PENDING_MANAGER" }
}
