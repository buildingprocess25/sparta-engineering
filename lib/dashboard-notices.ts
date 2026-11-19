export type DashboardNotice = {
  id: string
  kind: "permit" | "report"
  title: string
  reference: string
  href: string
  actionLabel: string
  occurredAt: string
  readAt: string | null
  pdfHref?: string
  attention?: boolean
}

export type DashboardNoticeData = { unreadCount: number; notices: DashboardNotice[] }

export type DashboardNoticeSummary = {
  unreadCount: number
  latestUnreadApprovalAt: string | null
}

export function getLatestUnreadApprovalAt(notices: DashboardNotice[]): string | null {
  const approval = notices.find((notice) => notice.pdfHref && notice.readAt === null)
  return approval?.occurredAt ?? null
}
