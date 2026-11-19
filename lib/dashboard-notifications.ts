import "server-only"

import type { Prisma, User } from "@/generated/prisma"
import {
  getLatestUnreadApprovalAt,
  type DashboardNotice,
  type DashboardNoticeData,
  type DashboardNoticeSummary,
} from "@/lib/dashboard-notices"
import { getPrisma } from "@/lib/prisma"
import { needsChecklistFollowUp } from "@/lib/reports/checklist-follow-up"
import { formatWorkPermitMonth } from "@/lib/work-permits/active-period"
import { getWorkPermitDetailHref, getWorkPermitPdfHref } from "@/lib/work-permits/links"
import { getWorkPermitNotifications } from "@/lib/work-permits/notifications"

export type NotificationUser = Pick<User, "NIK" | "role" | "branchName">

const reportStages = { COORD: "PENDING_COORD", MANAGER: "PENDING_MANAGER", REQUESTER: "PENDING_REQUESTER" } as const
const besReportTitles = {
  NEEDS_REVISION: "Laporan perlu direvisi",
  REJECTED: "Laporan ditolak",
  COMPLETED: "Laporan selesai",
  WAITING_PJU: "Laporan menunggu PJU",
  WAITING_PB: "Laporan menunggu PB",
  WAITING_PARTS: "Laporan menunggu spare part",
} as const
const permitTitles: Record<string, string> = {
  PENDING_MANAGER: "Izin kerja menunggu persetujuan Manager",
  REJECTED: "Izin kerja ditolak",
}
export const approvedPermitPrefix = "permit-approved:"

const branchKey = (user: NotificationUser) => user.branchName.trim().toUpperCase()
const historyScope = (user: NotificationUser) => ({ userNik: user.NIK, role: user.role, branch: branchKey(user) })

async function getReportNotices(user: NotificationUser): Promise<DashboardNotice[]> {
  const branch = branchKey(user)
  const isBes = user.role === "ES"
  const stage = user.role in reportStages ? reportStages[user.role as keyof typeof reportStages] : undefined
  if (!isBes && (!stage || !branch)) return []

  const terminalCutoff = new Date(Date.now() - 30 * 86_400_000)
  const scope: Prisma.ChecklistReportWhereInput = isBes
    ? {
        authorId: user.NIK,
        OR: [
          { status: { in: ["NEEDS_REVISION", "WAITING_PJU", "WAITING_PB", "WAITING_PARTS"] } },
          { status: { in: ["REJECTED", "COMPLETED"] }, updatedAt: { gte: terminalCutoff } },
        ],
      }
    : { status: stage, author: { branchName: { equals: branch, mode: "insensitive" } } }
  const reports = await getPrisma().checklistReport.findMany({
    where: { ...scope, reportCode: { not: null } },
    select: { id: true, status: true, reportCode: true, updatedAt: true, checklistPayload: true },
  })

  return reports.flatMap((report) => {
    if (!report.reportCode || (!isBes && needsChecklistFollowUp(report.checklistPayload))) return []
    const title = isBes ? besReportTitles[report.status as keyof typeof besReportTitles] : "Laporan siap direview"
    const occurredAt = report.updatedAt.toISOString()
    return [{
      id: `report:${report.id}:${report.status}:${occurredAt}`,
      kind: "report",
      title,
      reference: report.reportCode,
      href: `/dashboard/reports/${encodeURIComponent(report.reportCode)}`,
      actionLabel: isBes ? "Lihat laporan" : "Review laporan",
      occurredAt,
      readAt: null,
      attention: report.status === "WAITING_PJU",
    }]
  })
}

async function getPermitNotices(user: NotificationUser, unreadOnly: boolean): Promise<DashboardNotice[]> {
  const prisma = getPrisma()
  const branch = branchKey(user)
  const isBes = user.role === "ES"
  if (!isBes && (user.role !== "MANAGER" || !branch)) return []

  const [permits, approved] = await Promise.all([
    prisma.workPermit.findMany({
      where: isBes
        ? { applicantNik: user.NIK, status: "REJECTED", updatedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } }
        : { status: "PENDING_MANAGER", applicantNik: { not: user.NIK }, applicant: { branchName: { equals: branch, mode: "insensitive" } } },
      select: { id: true, permitCode: true, status: true, updatedAt: true },
    }),
    isBes ? getWorkPermitNotifications(user.NIK, { unreadOnly }) : null,
  ])
  return [
    ...permits.map((permit): DashboardNotice => ({
      id: `permit:${permit.id}:${permit.status}:${permit.updatedAt.toISOString()}`,
      kind: "permit",
      title: permitTitles[permit.status],
      reference: permit.permitCode,
      href: isBes ? getWorkPermitDetailHref(permit.permitCode) : `/dashboard/work-permits?permitCode=${encodeURIComponent(permit.permitCode)}`,
      actionLabel: isBes ? "Lihat izin" : "Review izin",
      occurredAt: permit.updatedAt.toISOString(),
      readAt: null,
    })),
    ...(approved?.notices ?? []).map((permit): DashboardNotice => ({
      id: `${approvedPermitPrefix}${permit.id}`,
      kind: "permit",
      title: "Izin kerja disetujui",
      reference: `${permit.permitCode} · ${formatWorkPermitMonth(permit.period)}`,
      href: getWorkPermitDetailHref(permit.permitCode),
      actionLabel: "Lihat izin",
      occurredAt: permit.approvedAt,
      readAt: permit.readAt,
      pdfHref: getWorkPermitPdfHref(permit.permitCode),
    })),
  ]
}

async function getActiveNotices(user: NotificationUser, unreadOnly = false) {
  const [reports, permits] = await Promise.all([
    getReportNotices(user),
    getPermitNotices(user, unreadOnly),
  ])
  return [...reports, ...permits]
}

export async function getDashboardNotificationSummary(user: NotificationUser): Promise<DashboardNoticeSummary> {
  const active = await getActiveNotices(user, true)
  const noticeIds = active.filter((notice) => !notice.pdfHref).map((notice) => notice.id)
  const readCount = noticeIds.length
    ? await getPrisma().dashboardNoticeRead.count({
        where: { ...historyScope(user), noticeId: { in: noticeIds } },
      })
    : 0

  return {
    unreadCount: active.length - readCount,
    latestUnreadApprovalAt: getLatestUnreadApprovalAt(active),
  }
}

export async function getDashboardNotifications(user: NotificationUser): Promise<DashboardNoticeData> {
  const [active, history] = await Promise.all([
    getActiveNotices(user),
    getPrisma().dashboardNoticeRead.findMany({
      where: {
        ...historyScope(user),
        OR: [
          { kind: "report" },
          { kind: "permit", noticeId: { contains: user.role === "MANAGER" ? ":PENDING_MANAGER:" : ":REJECTED:" } },
        ],
      },
    }),
  ])
  const notices = new Map(active.map((notice) => [notice.id, notice]))
  for (const read of history) {
    notices.set(read.noticeId, {
      id: read.noticeId,
      kind: read.kind === "permit" ? "permit" : "report",
      title: read.title,
      reference: read.reference,
      href: read.href,
      actionLabel: read.actionLabel,
      occurredAt: read.occurredAt.toISOString(),
      readAt: read.readAt.toISOString(),
    })
  }
  const ordered = [...notices.values()].sort((a, b) =>
    (b.readAt ?? b.occurredAt).localeCompare(a.readAt ?? a.occurredAt) || a.id.localeCompare(b.id)
  )
  return { notices: ordered, unreadCount: ordered.filter((notice) => !notice.readAt).length }
}

export async function recordDashboardNoticeRead(user: NotificationUser, notice: DashboardNotice) {
  const scope = { ...historyScope(user), noticeId: notice.id }
  await getPrisma().dashboardNoticeRead.createMany({
    skipDuplicates: true,
    data: [{
      ...scope,
      kind: notice.kind,
      title: notice.title,
      reference: notice.reference,
      href: notice.href,
      actionLabel: notice.actionLabel,
      occurredAt: new Date(notice.occurredAt),
    }],
  })
}
