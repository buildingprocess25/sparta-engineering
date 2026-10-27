"use server"

import { revalidatePath } from "next/cache"
import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { WorkPermitStatus } from "@/generated/prisma"

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
  const session = await getSession()
  if (!session?.userId) {
    return { ok: false, error: "Sesi tidak valid. Silakan login kembali." }
  }

  const prisma = getPrisma()

  // Ambil user pemohon
  const user = await prisma.user.findUnique({
    where: { NIK: String(session.userId) },
    select: { NIK: true, branchName: true },
  })

  if (!user) {
    return { ok: false, error: "Data pengguna tidak ditemukan." }
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
    const permit = await prisma.workPermit.create({
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

    return {
      ok: true,
      workPermit: {
        id: permit.id,
        permitCode: permit.permitCode,
        status: permit.status,
      },
    }
  } catch (err: any) {
    console.error("Failed to submit work permit:", err)
    return { ok: false, error: err.message || "Gagal menyimpan form izin kerja ke database." }
  }
}

export async function approveWorkPermitAction(permitId: string, managerNotes?: string) {
  const session = await getSession()
  if (!session?.userId) {
    return { ok: false, error: "Sesi tidak valid." }
  }

  // Izinkan Manager, COORD, atau ADMIN_HO
  if (
    session.role !== "MANAGER" &&
    session.role !== "COORD" &&
    session.role !== "ADMIN_HO" &&
    session.role !== "SUPER_ADMIN"
  ) {
    return { ok: false, error: "Hanya Manager atau Koordinator yang berhak menyetujui izin kerja." }
  }

  const prisma = getPrisma()

  try {
    const updated = await prisma.workPermit.update({
      where: { id: permitId },
      data: {
        status: "APPROVED",
        managerNik: session.userId,
        managerSignedAt: new Date(),
        managerNotes: managerNotes || "Disetujui oleh Manager",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/work-permits")

    return { ok: true, permit: updated }
  } catch (err: any) {
    console.error("Failed to approve work permit:", err)
    return { ok: false, error: err.message || "Gagal menyetujui izin kerja." }
  }
}

export async function rejectWorkPermitAction(permitId: string, reason: string) {
  const session = await getSession()
  if (!session?.userId) {
    return { ok: false, error: "Sesi tidak valid." }
  }

  if (
    session.role !== "MANAGER" &&
    session.role !== "COORD" &&
    session.role !== "ADMIN_HO" &&
    session.role !== "SUPER_ADMIN"
  ) {
    return { ok: false, error: "Hanya Manager atau Koordinator yang berhak menolak izin kerja." }
  }

  const prisma = getPrisma()

  try {
    const updated = await prisma.workPermit.update({
      where: { id: permitId },
      data: {
        status: "REJECTED",
        managerNik: session.userId,
        managerSignedAt: new Date(),
        managerNotes: reason || "Perlengkapan K3 belum memenuhi standar keselamatan kerja.",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/work-permits")

    return { ok: true, permit: updated }
  } catch (err: any) {
    console.error("Failed to reject work permit:", err)
    return { ok: false, error: err.message || "Gagal menolak izin kerja." }
  }
}

export async function getTodayWorkPermitStatus(userNik?: string) {
  if (!userNik) return null

  const prisma = getPrisma()

  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthNum = now.getMonth() + 1
    const currentPeriod = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`

    // Bulan berikutnya (H- pengajuan bulan depan)
    const nextDate = new Date(currentYear, now.getMonth() + 1, 1)
    const nextPeriod = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`
    // Jendela pengajuan H- dibuka mulai tanggal 20 ke atas
    const isHMinusWindow = now.getDate() >= 20

    // Ambil riwayat izin kerja teknisi
    const userPermits = await prisma.workPermit.findMany({
      where: {
        applicantNik: userNik,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        manager: {
          select: { name: true, NIK: true },
        },
      },
    })

    if (!userPermits || userPermits.length === 0) {
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
      } as any
    }

    const getPermitPeriod = (p: any): string => {
      const payload = p.safetyPayload as any
      if (payload?.targetPeriod && typeof payload.targetPeriod === "string") {
        return payload.targetPeriod
      }
      if (p.workDate) {
        return new Date(p.workDate).toISOString().slice(0, 7)
      }
      return new Date(p.createdAt).toISOString().slice(0, 7)
    }

    // 1. Cek izin kerja yang disetujui (APPROVED) untuk bulan berjalan
    const approvedCurrent = userPermits.find(
      (p) => p.status === "APPROVED" && getPermitPeriod(p) === currentPeriod
    )

    // 2. Cek izin kerja untuk bulan berikutnya (jika sudah ada pengajuan H-)
    const nextMonthPermit = userPermits.find(
      (p) => getPermitPeriod(p) === nextPeriod
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
      (p) => getPermitPeriod(p) === currentPeriod
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
      const pastPeriod = getPermitPeriod(pastApproved)
      return {
        id: pastApproved.id,
        permitCode: pastApproved.permitCode,
        status: "EXPIRED" as any,
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
      targetPeriod: getPermitPeriod(fallbackLatest),
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
  if (!userNik && !permitCode) return null

  const prisma = getPrisma()

  try {
    let permit = null

    if (permitCode) {
      permit = await prisma.workPermit.findUnique({
        where: { permitCode },
        include: {
          applicant: { select: { name: true, NIK: true, branchName: true } },
          manager: { select: { name: true, NIK: true } },
        },
      })
    } else if (userNik) {
      // Prioritaskan permit APPROVED
      permit = await prisma.workPermit.findFirst({
        where: { applicantNik: userNik, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { select: { name: true, NIK: true, branchName: true } },
          manager: { select: { name: true, NIK: true } },
        },
      })

      // Jika belum ada yang APPROVED, ambil yang terakhir
      if (!permit) {
        permit = await prisma.workPermit.findFirst({
          where: { applicantNik: userNik },
          orderBy: { createdAt: "desc" },
          include: {
            applicant: { select: { name: true, NIK: true, branchName: true } },
            manager: { select: { name: true, NIK: true } },
          },
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
  const prisma = getPrisma()

  const where: any = {}

  if (filters?.status && filters.status !== "ALL") {
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

  return prisma.workPermit.findMany({
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
