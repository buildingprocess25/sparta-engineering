import "server-only"

import { getPrisma } from "@/lib/prisma"
import { getWorkPermitPeriod } from "./active-period"
import {
  finalizedPermitStatuses,
  getFinalWorkPermitApproval,
} from "./final-approval"

export async function getWorkPermitNotifications(applicantNik: string, { unreadOnly = false } = {}) {
  const permits = await getPrisma().workPermit.findMany({
    where: {
      applicantNik,
      status: { in: [...finalizedPermitStatuses] },
      ...(unreadOnly && { applicantNotificationReadAt: null }),
    },
    select: {
      id: true,
      permitCode: true,
      workDate: true,
      safetyPayload: true,
      status: true,
      approvalHistory: true,
      applicantNotificationReadAt: true,
    },
  })

  const notices = permits
    .flatMap((permit) => {
      const final = getFinalWorkPermitApproval(permit)
      return final
        ? [
            {
              id: permit.id,
              permitCode: permit.permitCode,
              period: getWorkPermitPeriod(permit),
              approvedAt: final.decidedAt,
              readAt: permit.applicantNotificationReadAt?.toISOString() ?? null,
            },
          ]
        : []
    })
    .sort(
      (left, right) =>
        (right.readAt ?? right.approvedAt).localeCompare(
          left.readAt ?? left.approvedAt
        ) ||
        right.approvedAt.localeCompare(left.approvedAt) ||
        left.id.localeCompare(right.id)
    )

  return {
    unreadCount: notices.filter((notice) => notice.readAt === null).length,
    notices,
  }
}
