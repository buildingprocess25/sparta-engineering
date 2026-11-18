"use server"

import { getPrisma } from "@/lib/prisma"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import {
  finalizedPermitStatuses,
  getFinalWorkPermitApproval,
} from "@/lib/work-permits/final-approval"
import { getWorkPermitNotifications } from "@/lib/work-permits/notifications"

export async function refreshWorkPermitNotifications() {
  const user = await getWorkPermitUser()
  if (user?.role !== "ES") return null
  return getWorkPermitNotifications(user.NIK)
}

export async function markWorkPermitNotificationRead(id: string) {
  const user = await getWorkPermitUser()
  if (user?.role !== "ES" || typeof id !== "string" || !id) return null

  const prisma = getPrisma()
  const scope = {
    id,
    applicantNik: user.NIK,
    status: { in: [...finalizedPermitStatuses] },
  }
  const permit = await prisma.workPermit.findFirst({
    where: scope,
    select: {
      status: true,
      approvalHistory: true,
      applicantNotificationReadAt: true,
    },
  })
  if (!permit || !getFinalWorkPermitApproval(permit)) return null

  if (!permit.applicantNotificationReadAt) {
    await prisma.workPermit.updateMany({
      where: { ...scope, applicantNotificationReadAt: null },
      data: { applicantNotificationReadAt: new Date() },
    })
  }
  return getWorkPermitNotifications(user.NIK)
}
