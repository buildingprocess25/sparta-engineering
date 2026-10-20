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

  const branchCode = (user.branchName || "SAT").substring(0, 3).toUpperCase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "")
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const permitCode = `WP-${branchCode}-${dateStr}-${randomSuffix}`

  const safetyPayload = {
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
        workDate: today,
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const permit = await prisma.workPermit.findFirst({
      where: {
        applicantNik: userNik,
        workDate: today,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        manager: {
          select: { name: true, NIK: true },
        },
      },
    })

    if (!permit) return null

    return {
      id: permit.id,
      permitCode: permit.permitCode,
      status: permit.status,
      kegiatan: permit.kegiatan,
      lokasi: permit.lokasi,
      managerNotes: permit.managerNotes,
      managerName: permit.manager?.name,
      createdAt: permit.createdAt.toISOString(),
      managerSignedAt: permit.managerSignedAt?.toISOString() || null,
    }
  } catch (err) {
    console.error("Error fetching work permit status:", err)
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
