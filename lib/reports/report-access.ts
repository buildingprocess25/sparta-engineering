export type ReportAccessUser = {
  NIK: string
  role: string
  branchName: string
}

export type ReportAccessTarget = {
  authorId: string
  author: {
    branchName: string
  }
  equipment?: {
    branchName?: string | null
  } | null
}

/** Check whether an authenticated user is authorized to read a report, its photos, or its PDF. */
export function canUserAccessReport(
  user: ReportAccessUser | null | undefined,
  report: ReportAccessTarget | null | undefined,
): boolean {
  if (!user || !report) return false

  if (user.role === "ADMIN_HO" || user.role === "SUPER_ADMIN") {
    return true
  }

  if (user.role === "COORD" || user.role === "MANAGER" || user.role === "REQUESTER") {
    const userBranch = user.branchName.trim().toUpperCase()
    const reportBranch = (report.author.branchName || report.equipment?.branchName || "").trim().toUpperCase()
    return Boolean(userBranch) && userBranch === reportBranch
  }

  if (user.role === "ES") {
    return report.authorId === user.NIK
  }

  return false
}
