"use server"

import { getPrisma } from "@/lib/prisma"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { finalizedPermitStatuses } from "@/lib/work-permits/final-approval"
import { approvedPermitPrefix, getDashboardNotifications, getDashboardNotificationSummary, recordDashboardNoticeRead } from "@/lib/dashboard-notifications"

export async function refreshDashboardNotificationSummary() {
  const user = await getWorkPermitUser()
  return user ? getDashboardNotificationSummary(user) : null
}

export async function refreshDashboardNotifications() {
  const user = await getWorkPermitUser()
  return user ? getDashboardNotifications(user) : null
}

export async function markDashboardNotificationRead(id: string) {
  const user = await getWorkPermitUser()
  if (!user || typeof id !== "string" || !id) return null

  const data = await getDashboardNotifications(user)
  const notice = data.notices.find((item) => item.id === id)
  if (!notice) return null
  if (notice.readAt) return data

  if (id.startsWith(approvedPermitPrefix)) {
    await getPrisma().workPermit.updateMany({
      where: {
        id: id.slice(approvedPermitPrefix.length),
        applicantNik: user.NIK,
        status: { in: [...finalizedPermitStatuses] },
        applicantNotificationReadAt: null,
      },
      data: { applicantNotificationReadAt: new Date() },
    })
  } else {
    await recordDashboardNoticeRead(user, notice)
  }
  return getDashboardNotifications(user)
}
