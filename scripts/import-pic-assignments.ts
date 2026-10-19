import dotenv from "dotenv"
dotenv.config()

import path from "path"
import XLSX from "xlsx"
import { PrismaPg } from "@prisma/adapter-pg"
import { ChecklistPeriod, PrismaClient } from "../generated/prisma"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Normalisasi nama equipment dan pemetaan form code serta periode
function normalizeEquipment(raw: string): {
  name: string
  formCode: string
  period: ChecklistPeriod
} {
  const s = (raw || "").toString().trim().toUpperCase()

  if (s.includes("CONVEYOR")) {
    return { name: "CONVEYOR", formCode: "SAT/FRM/TS/041_REV: 01_161020", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("EXHAUST")) {
    return { name: "EXHAUST FAN", formCode: "SAT/FRM/TS/063_REV : 00_161020", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("TEST ATS")) {
    return { name: s, formCode: "SAT/FRM/TSM/001", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("GENSET")) {
    return { name: s, formCode: "SAT/FRM/TS/022", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("HAND") && s.includes("PAL")) {
    return { name: "HAND PALLET", formCode: "SAT/FRM/TS/062", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("TABLE") || s.includes("TABEL")) {
    return { name: "TABLE LIFTER", formCode: "SAT/FRM/TS/064_REV: 00_161020", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("BATTER") || s.includes("BATERAI")) {
    if (s.includes("FORKLIF")) {
      return { name: "BATERAI FORKLIFT", formCode: "SAT/FRM/TS/068", period: ChecklistPeriod.MONTHLY }
    }
    if (s.includes("MOVER")) {
      return { name: "BATERAI PALLET MOVER", formCode: "SAT/FRM/TS/028-REV.002 161020", period: ChecklistPeriod.MONTHLY }
    }
  }
  if (s.includes("FORKLIF")) {
    return { name: "FORKLIFT", formCode: "SAT/FRM/TS/043", period: ChecklistPeriod.WEEKLY }
  }
  if (s.includes("PAL") && s.includes("MOVER")) {
    return { name: "PALLET MOVER", formCode: "SAT/FRM/TS/045", period: ChecklistPeriod.WEEKLY }
  }
  if (s.includes("HYD")) {
    return { name: "HYDRANT", formCode: "SAT/FRM/TSM/006", period: ChecklistPeriod.WEEKLY }
  }
  if (s.includes("PLTS")) {
    return { name: "PLTS", formCode: "SAT/FRM/TSM/007", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("SEWA")) {
    return { name: "UNIT SEWA", formCode: "SAT/FRM/TSM/008_Rev_000_111122", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("WAREH")) {
    return { name: "WAREHOUSE", formCode: "SAT/FRM/TSM/002_REV_000_211022", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("FISIK") || s.includes("PENUNJANG") || s.includes("PENUJANG")) {
    return { name: "BANGUNAN UTAMA & PENUNJANG", formCode: "SAT/FRM/TSM/005 REV 211022", period: ChecklistPeriod.MONTHLY }
  }
  if (s.includes("RUANGAN")) {
    return { name: "RUANGAN", formCode: "SAT/FRM/TSM/003 REV 000 211022", period: ChecklistPeriod.MONTHLY }
  }

  return { name: s, formCode: "SAT/FRM/TSM/003 REV 000 211022", period: ChecklistPeriod.MONTHLY }
}

async function main() {
  console.log("=== MEMULAI IMPORT PIC ASSIGNMENT & EQUIPMENT ===")

  // 1. Buat peta NIK User di DB
  const users = await prisma.user.findMany({ select: { NIK: true } })
  const userNikMap = new Map<string, string>()
  users.forEach((u) => {
    userNikMap.set(u.NIK, u.NIK)
    userNikMap.set(String(parseInt(u.NIK, 10)), u.NIK)
    userNikMap.set(u.NIK.padStart(8, "0"), u.NIK)
  })
  console.log(`Ditemukan ${users.length} user di database.`)

  // 2. Buat peta Ruangan di DB
  const rooms = await prisma.room.findMany({ select: { id: true, name: true } })
  const roomNameMap = new Map<string, string>()
  rooms.forEach((r) => {
    roomNameMap.set(r.name.trim().toLowerCase(), r.id)
  })
  console.log(`Ditemukan ${rooms.length} ruangan di database.`)

  // 3. Import Equipment & PIC Assignment dari DATA PIC UNIT NASIONAL.xlsx
  const picFile = path.resolve(process.cwd(), "docs/DATA PIC UNIT NASIONAL.xlsx")
  const wbPic = XLSX.readFile(picFile)
  const rowsPic = XLSX.utils.sheet_to_json<any[]>(wbPic.Sheets["DATA PIC UNIT"], { header: 1 })

  let equipmentUpserted = 0
  let equipmentAssignments = 0
  let skippedRows = 0

  console.log(`Memproses ${rowsPic.length - 2} baris penugasan equipment...`)

  for (let i = 2; i < rowsPic.length; i++) {
    const r = rowsPic[i]
    if (!r || !r[0] || !r[1] || !r[2]) continue

    const branchName = r[0].toString().trim().toUpperCase()
    const rawPic = r[1].toString().trim()
    const rawEquip = r[2].toString().trim()
    const rawUnit = r[3] !== undefined && r[3] !== null ? parseInt(r[3], 10) : 1
    const unitNo = isNaN(rawUnit) ? 1 : rawUnit

    const norm = normalizeEquipment(rawEquip)
    const equipCode = `${branchName.replace(/\s+/g, "_")}-${norm.name.replace(/\s+/g, "_")}-${unitNo}`.toUpperCase()

    // Upsert Equipment
    const equipment = await prisma.equipment.upsert({
      where: {
        branchName_name_unitNo: {
          branchName,
          name: norm.name,
          unitNo,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        branchName,
        name: norm.name,
        unitNo,
        code: equipCode,
        isActive: true,
      },
    })
    equipmentUpserted++

    // Ekstrak NIK PIC
    const nikMatch = rawPic.match(/(\d{7,8})\s*$/)
    if (!nikMatch) {
      skippedRows++
      continue
    }

    const canonicalNik = userNikMap.get(nikMatch[1])
    if (!canonicalNik) {
      skippedRows++
      continue
    }

    // Buat PicAssignment jika belum ada
    const existingAssign = await prisma.picAssignment.findFirst({
      where: {
        userNik: canonicalNik,
        equipmentId: equipment.id,
        formCode: norm.formCode,
        period: norm.period,
      },
      select: { id: true },
    })

    if (!existingAssign) {
      await prisma.picAssignment.create({
        data: {
          userNik: canonicalNik,
          equipmentId: equipment.id,
          formCode: norm.formCode,
          period: norm.period,
          isActive: true,
        },
      })
      equipmentAssignments++
    }
  }

  console.log(`Berhasil memproses Equipment: ${equipmentUpserted} alat.`)
  console.log(`Berhasil membuat PicAssignment Equipment: ${equipmentAssignments} penugasan.`)
  console.log(`Baris dilewati (Vacant/Non-NIK): ${skippedRows}.`)

  // 4. Import PIC Assignment untuk Ruangan dari Salinan INVENTARISIR EQUIPMENT RUANGAN DAN PIC CHECKLIST.xlsx
  const invFile = path.resolve(process.cwd(), "docs/Salinan INVENTARISIR EQUIPMENT RUANGAN DAN PIC CHECKLIST.xlsx")
  const wbInv = XLSX.readFile(invFile)

  let roomAssignments = 0

  console.log(`Memproses inventarisir ruangan dari ${wbInv.SheetNames.length} sheet cabang...`)

  for (const sheetName of wbInv.SheetNames) {
    const sheet = wbInv.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })

    let currentFormCode = "SAT/FRM/TSM/003 REV 000 211022" // default ruangan
    let currentPeriod = ChecklistPeriod.MONTHLY

    for (const r of data) {
      if (!r) continue
      const c0 = (r[0] || "").toString().trim()
      if (c0.includes("FORM CHECKLIST RUANGAN")) {
        currentFormCode = "SAT/FRM/TSM/003 REV 000 211022"
        currentPeriod = ChecklistPeriod.MONTHLY
        continue
      } else if (c0.includes("FORM CHECKLIST WAREHOUSE")) {
        currentFormCode = "SAT/FRM/TSM/002_REV_000_211022"
        currentPeriod = ChecklistPeriod.MONTHLY
        continue
      } else if (c0.includes("FORM CHECKLIST FISIK")) {
        currentFormCode = "SAT/FRM/TSM/005 REV 211022"
        currentPeriod = ChecklistPeriod.MONTHLY
        continue
      }

      const rawNik = (r[2] || "").toString().trim()
      if (!rawNik || !/^\d+$/.test(rawNik)) continue

      const canonicalNik = userNikMap.get(rawNik)
      const roomId = roomNameMap.get(c0.toLowerCase())

      if (canonicalNik && roomId) {
        const existing = await prisma.picAssignment.findFirst({
          where: {
            userNik: canonicalNik,
            roomId,
            formCode: currentFormCode,
            period: currentPeriod,
          },
          select: { id: true },
        })

        if (!existing) {
          await prisma.picAssignment.create({
            data: {
              userNik: canonicalNik,
              roomId,
              formCode: currentFormCode,
              period: currentPeriod,
              isActive: true,
            },
          })
          roomAssignments++
        }
      }
    }
  }

  console.log(`Berhasil membuat PicAssignment Ruangan: ${roomAssignments} penugasan.`)

  // 5. Verifikasi Total Akhir di Database
  const totalEquip = await prisma.equipment.count()
  const totalAssign = await prisma.picAssignment.count()

  console.log("==========================================")
  console.log(`TOTAL AKHIR EQUIPMENT DI DATABASE      : ${totalEquip}`)
  console.log(`TOTAL AKHIR PIC ASSIGNMENT DI DATABASE : ${totalAssign}`)
  console.log("==========================================")
}

main()
  .catch((e) => {
    console.error("Gagal menjalankan import:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
