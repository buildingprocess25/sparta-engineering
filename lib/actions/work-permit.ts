"use server"

import { revalidatePath } from "next/cache"
import { WorkPermitStatus, type Prisma } from "@/generated/prisma"
import { getCurrentPeriodKey } from "@/lib/date-utils"
import { getPrisma } from "@/lib/prisma"
import {
  getApplicantWorkPermitScope,
  getManagerWorkPermitScope,
  getPendingWorkPermitDecisionScope,
} from "@/lib/work-permits/access"
import { getWorkPermitPeriod } from "@/lib/work-permits/active-period"
import { getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { getWorkPermitHistoryHref } from "@/lib/work-permits/history"

export type WorkPermitInput = {
  kegiatan: string
  lokasi: string
  picSat: string
  kontraktor?: string
  workDate?: string
  duration?: string
  targetPeriod?: string
  workers: string[]
  adminReqs?: Record<string, boolean> | string[]
  adminLainnyaText?: string
  hotWork?: { active: boolean; items: Record<string, boolean> | string[]; lainnya?: string }
  workHeight?: { active: boolean; items: Record<string, boolean> | string[]; lainnya?: string }
  confinedSpace?: { active: boolean; items: Record<string, boolean> | string[]; lainnya?: string }
  electrical?: { active: boolean; items: Record<string, boolean> | string[]; lainnya?: string }
  apd?: { items: Record<string, boolean> | string[]; lainnya?: string }
  fireProtection?: { items: Record<string, boolean> | string[]; lainnya?: string }
  catatanPasca?: string
}

export async function submitWorkPermitAction(data: WorkPermitInput) {
  const user = await getWorkPermitUser()
  if (!user) {
    return { ok: false, error: "Sesi tidak valid. Silakan login kembali." }
  }
  if (user.role !== "ES") {
    return { ok: false, error: "Hanya teknisi ES yang dapat mengajukan izin kerja." }
  }

  const now = new Date()
  let targetPeriod = data.targetPeriod
  if (!targetPeriod) {
    if (data.workDate) {
      targetPeriod = data.workDate.slice(0, 7)
    } else {
      targetPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    }
  }

  // Tentukan workDate yang disimpan di database
  let workDateToSave = new Date()
  if (data.workDate) {
    workDateToSave = new Date(data.workDate)
  } else if (targetPeriod) {
    const [y, m] = targetPeriod.split("-").map(Number)
    workDateToSave = new Date(y, m - 1, 1)
  }
  workDateToSave.setHours(0, 0, 0, 0)

  const branchCode = (user.branchName || "SAT").substring(0, 3).toUpperCase()
  const dateStr = workDateToSave.toISOString().slice(0, 10).replace(/-/g, "")
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const permitCode = `WP-${branchCode}-${dateStr}-${randomSuffix}`

  const safetyPayload = {
    targetPeriod,
    adminReqs: data.adminReqs || [],
    adminLainnyaText: data.adminLainnyaText || "",
    hotWork: data.hotWork || { active: false, items: [] },
    workHeight: data.workHeight || { active: false, items: [] },
    confinedSpace: data.confinedSpace || { active: false, items: [] },
    electrical: data.electrical || { active: false, items: [] },
    apd: data.apd || { items: [] },
    fireProtection: data.fireProtection || { items: [] },
  }

  try {
    const permit = await getPrisma().workPermit.create({
      data: {
        permitCode,
        formCode: "SAT/FRM/MED/003_Rev:000_180225",
        kegiatan: data.kegiatan || "Pemeliharaan & Checklist Rutin",
        lokasi: data.lokasi || "Branch",
        picSat: data.picSat || user.NIK,
        kontraktor: data.kontraktor || "INTERNAL",
        workDate: workDateToSave,
        duration: data.duration || "1 Hari",
        workers: data.workers || [],
        safetyPayload,
        catatanPasca: data.catatanPasca || null,
        status: "PENDING_MANAGER",
        applicantNik: user.NIK,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/work-permits")
    revalidatePath(getWorkPermitHistoryHref())

    return {
      ok: true,
      workPermit: {
        id: permit.id,
        permitCode: permit.permitCode,
        status: permit.status,
      },
    }
  } catch (err) {
    console.error("Failed to submit work permit:", err)
    return { ok: false, error: "Gagal menyimpan form izin kerja ke database." }
  }
}

export async function approveWorkPermitAction(permitId: string, managerNotes?: string) {
  return decideWorkPermit(permitId, "APPROVED", managerNotes)
}

export async function rejectWorkPermitAction(permitId: string, reason: string) {
  return decideWorkPermit(permitId, "REJECTED", reason)
}

async function decideWorkPermit(permitId: string, status: "APPROVED" | "REJECTED", notes?: string) {
  const user = await getWorkPermitUser()
  if (!user) {
    return { ok: false, error: "Sesi tidak valid." }
  }

  const where = getPendingWorkPermitDecisionScope(user, permitId)
  if (!where) {
    return { ok: false, error: "Hanya Manager cabang yang dapat memproses izin kerja." }
  }

  const managerNotes = typeof notes === "string" ? notes.trim() : ""
  if (status === "REJECTED" && !managerNotes) {
    return { ok: false, error: "Alasan penolakan izin kerja wajib diisi." }
  }

  try {
    const [permit] = await getPrisma().workPermit.updateManyAndReturn({
      where,
      data: {
        status,
        managerNik: user.NIK,
        managerSignedAt: new Date(),
        managerNotes: managerNotes || "Disetujui oleh Manager",
      },
    })

    if (!permit) {
      return { ok: false, error: "Izin kerja tidak tersedia atau sudah diproses. Muat ulang antrean izin kerja." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/work-permits")
    revalidatePath(getWorkPermitHistoryHref())

    return { ok: true, permit }
  } catch (err) {
    console.error("Failed to record work permit decision:", err)
    return { ok: false, error: "Gagal menyimpan keputusan izin kerja." }
  }
}

export async function getTodayWorkPermitStatus(userNik?: string) {
  try {
    const user = await getWorkPermitUser()
    const where = getApplicantWorkPermitScope(user, userNik)
    if (!where) return null

    const now = new Date()
    const currentPeriod = getCurrentPeriodKey("MONTHLY", now)

    // Bulan berikutnya (H- pengajuan bulan depan)
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextPeriod = getCurrentPeriodKey("MONTHLY", nextDate)
    // Jendela pengajuan H- dibuka mulai tanggal 20 ke atas
    const isHMinusWindow = now.getDate() >= 20

    const [approvedCurrent, userPermits] = await Promise.all([
      getActiveWorkPermit(user, now),
      getPrisma().workPermit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          manager: { select: { name: true, NIK: true } },
        },
      }),
    ])

    if (!approvedCurrent && userPermits.length === 0) {
      return {
        id: "",
        permitCode: "",
        status: null,
        kegiatan: "",
        lokasi: "",
        targetPeriod: currentPeriod,
        isHMinusWindow,
        nextMonthPeriod: nextPeriod,
        nextMonthPermit: null,
      }
    }

    const nextMonthPermit = userPermits.find(
      (p) => getWorkPermitPeriod(p) === nextPeriod
    )

    const nextMonthPermitData = nextMonthPermit
      ? {
          id: nextMonthPermit.id,
          permitCode: nextMonthPermit.permitCode,
          status: nextMonthPermit.status,
          targetPeriod: nextPeriod,
        }
      : null

    // 3. Jika izin bulan berjalan SUDAH APPROVED -> Status aktif untuk bulan berjalan!
    if (approvedCurrent) {
      return {
        id: approvedCurrent.id,
        permitCode: approvedCurrent.permitCode,
        status: approvedCurrent.status,
        kegiatan: approvedCurrent.kegiatan,
        lokasi: approvedCurrent.lokasi,
        managerNotes: approvedCurrent.managerNotes,
        managerName: approvedCurrent.manager?.name,
        createdAt: approvedCurrent.createdAt.toISOString(),
        managerSignedAt: approvedCurrent.managerSignedAt?.toISOString() || null,
        targetPeriod: currentPeriod,
        isHMinusWindow,
        nextMonthPeriod: nextPeriod,
        nextMonthPermit: nextMonthPermitData,
      }
    }

    // 4. Jika belum ada yang APPROVED di bulan berjalan, cek apakah ada pengajuan bulan berjalan (PENDING / REJECTED)
    const latestCurrent = userPermits.find(
      (p) => getWorkPermitPeriod(p) === currentPeriod
    )

    if (latestCurrent) {
      return {
        id: latestCurrent.id,
        permitCode: latestCurrent.permitCode,
        status: latestCurrent.status,
        kegiatan: latestCurrent.kegiatan,
        lokasi: latestCurrent.lokasi,
        managerNotes: latestCurrent.managerNotes,
        managerName: latestCurrent.manager?.name,
        createdAt: latestCurrent.createdAt.toISOString(),
        managerSignedAt: latestCurrent.managerSignedAt?.toISOString() || null,
        targetPeriod: currentPeriod,
        isHMinusWindow,
        nextMonthPeriod: nextPeriod,
        nextMonthPermit: nextMonthPermitData,
      }
    }

    // 5. Jika tidak ada izin bulan berjalan, tetapi teknisi pernah punya izin APPROVED di bulan sebelumnya -> EXPIRED
    const pastApproved = userPermits.find((p) => p.status === "APPROVED")
    if (pastApproved) {
      const pastPeriod = getWorkPermitPeriod(pastApproved)
      return {
        id: pastApproved.id,
        permitCode: pastApproved.permitCode,
        status: "EXPIRED" as const,
        kegiatan: pastApproved.kegiatan,
        lokasi: pastApproved.lokasi,
        managerNotes: pastApproved.managerNotes,
        managerName: pastApproved.manager?.name,
        createdAt: pastApproved.createdAt.toISOString(),
        managerSignedAt: pastApproved.managerSignedAt?.toISOString() || null,
        targetPeriod: currentPeriod,
        pastPeriod,
        isHMinusWindow,
        nextMonthPeriod: nextPeriod,
        nextMonthPermit: nextMonthPermitData,
      }
    }

    // 6. Fallback jika ada pengajuan lain
    const fallbackLatest = userPermits[0]
    return {
      id: fallbackLatest.id,
      permitCode: fallbackLatest.permitCode,
      status: fallbackLatest.status,
      kegiatan: fallbackLatest.kegiatan,
      lokasi: fallbackLatest.lokasi,
      managerNotes: fallbackLatest.managerNotes,
      managerName: fallbackLatest.manager?.name,
      createdAt: fallbackLatest.createdAt.toISOString(),
      managerSignedAt: fallbackLatest.managerSignedAt?.toISOString() || null,
      targetPeriod: getWorkPermitPeriod(fallbackLatest),
      isHMinusWindow,
      nextMonthPeriod: nextPeriod,
      nextMonthPermit: nextMonthPermitData,
    }
  } catch (err) {
    console.error("Error fetching work permit status:", err)
    return null
  }
}

export const getUserWorkPermitStatus = getTodayWorkPermitStatus

export async function getUserFullWorkPermit(userNik?: string, permitCode?: string) {
  try {
    const scope = getApplicantWorkPermitScope(await getWorkPermitUser(), userNik)
    if (!scope) return null

    const prisma = getPrisma()
    const include = {
      applicant: { select: { name: true, NIK: true, branchName: true } },
      manager: { select: { name: true, NIK: true } },
    } satisfies Prisma.WorkPermitInclude
    let permit = null

    if (permitCode) {
      permit = await prisma.workPermit.findUnique({
        where: { ...scope, permitCode },
        include,
      })
    } else {
      // Prioritaskan permit APPROVED
      permit = await prisma.workPermit.findFirst({
        where: { ...scope, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include,
      })

      // Jika belum ada yang APPROVED, ambil yang terakhir
      if (!permit) {
        permit = await prisma.workPermit.findFirst({
          where: scope,
          orderBy: { createdAt: "desc" },
          include,
        })
      }
    }

    if (!permit) return null

    return {
      ...permit,
      createdAt: permit.createdAt.toISOString(),
      updatedAt: permit.updatedAt.toISOString(),
      workDate: permit.workDate.toISOString(),
      applicantSignedAt: permit.applicantSignedAt.toISOString(),
      managerSignedAt: permit.managerSignedAt?.toISOString() || null,
    }
  } catch (err) {
    console.error("Error fetching full work permit:", err)
    return null
  }
}

export async function getManagerWorkPermits(filters?: {
  status?: string
  search?: string
}) {
  const where = getManagerWorkPermitScope(await getWorkPermitUser())
  if (!where) return []

  if (filters?.status && filters.status !== "ALL") {
    if (!Object.values(WorkPermitStatus).includes(filters.status as WorkPermitStatus)) return []
    where.status = filters.status as WorkPermitStatus
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim()
    where.OR = [
      { permitCode: { contains: q, mode: "insensitive" } },
      { kegiatan: { contains: q, mode: "insensitive" } },
      { lokasi: { contains: q, mode: "insensitive" } },
      { applicant: { name: { contains: q, mode: "insensitive" } } },
      { applicantNik: { contains: q, mode: "insensitive" } },
    ]
  }

  return getPrisma().workPermit.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      applicant: {
        select: {
          name: true,
          NIK: true,
          branchName: true,
        },
      },
      manager: {
        select: {
          name: true,
          NIK: true,
        },
      },
    },
  })
}
