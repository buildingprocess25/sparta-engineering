import "server-only"

import { getCurrentPeriodKey } from "@/lib/date-utils"
import { getPrisma } from "@/lib/prisma"
import type { WorkPermitUser } from "./access"
import { getActiveWorkPermitWhere, selectActiveWorkPermit } from "./active-period"

export const ACTIVE_WORK_PERMIT_REQUIRED = "Izin Kerja K3 bulan ini harus disetujui Manager. Buka menu Izin Kerja untuk melihat status atau mengajukan izin."

export async function getActiveWorkPermit(user: WorkPermitUser | null, now = new Date()) {
  if (user?.role !== "ES") return null

  const period = getCurrentPeriodKey("MONTHLY", now)
  const candidates = await getPrisma().workPermit.findMany({
    where: getActiveWorkPermitWhere(user.NIK, period),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      permitCode: true,
      status: true,
      kegiatan: true,
      lokasi: true,
      managerNotes: true,
      managerSignedAt: true,
      createdAt: true,
      safetyPayload: true,
      workDate: true,
      manager: { select: { name: true } },
    },
  })

  return selectActiveWorkPermit(candidates, period)
}
