import dotenv from "dotenv"
dotenv.config()

import path from "path"
import XLSX from "xlsx"
import { PrismaPg } from "@prisma/adapter-pg"
import { ChecklistPeriod, PrismaClient } from "../generated/prisma"
import { getChecklistFormConfig, getFormsForRoom } from "../lib/checklist-config"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const dryRun = process.argv.includes("--dry-run")
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Normalisasi nama equipment dan pemetaan form code serta periode
function normalizeEquipment(raw: string): {
  name: string
  formCode: string | null
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

  return { name: s, formCode: null, period: ChecklistPeriod.MONTHLY }
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toUpperCase()
}

function normalizeNik(nik: string) {
  return nik.replace(/^0+(?=\d)/, "")
}

function getExplicitAreaCode(branchName: string) {
  const prefix = normalizeName(branchName).match(/^(STORE HUB|GD ANAK|GUDANG ANAK|OFFICE|HEAD OFFICE|WHC|WH|WAREHOUSE|DEPO|BULKY)\b/)?.[1]
  switch (prefix) {
    case "WH":
    case "WAREHOUSE": return "wh"
    case "WHC": return "whc"
    case "DEPO": return "depo"
    case "BULKY": return "bulky"
    case "STORE HUB": return "store_hub"
    case "GD ANAK":
    case "GUDANG ANAK": return "gudang_anak"
    case "OFFICE":
    case "HEAD OFFICE": return "office"
    default: return undefined
  }
}

async function importAssignment(
  data: { userNik: string; formCode: string; period: ChecklistPeriod } &
    ({ roomId: string } | { equipmentId: string }),
) {
  const config = getChecklistFormConfig(data.formCode)
  if (!config) return false
  const { formCode, ...target } = data
  const assignments = await prisma.picAssignment.findMany({ where: target, select: { formCode: true } })
  if (assignments.some((assignment) => getChecklistFormConfig(assignment.formCode)?.id === config.id)) return false
  if (!dryRun) await prisma.picAssignment.create({ data })
  return true
}

async function main() {
  console.log(dryRun ? "=== VALIDASI MASTER PIC (DRY RUN) ===" : "=== IMPORT MASTER PIC & EQUIPMENT ===")

  const users = await prisma.user.findMany({
    where: { role: "ES" },
    select: { NIK: true, branchName: true },
  })
  const usersByNik = Map.groupBy(
    users.filter((user) => /^\d+$/.test(user.NIK)),
    (user) => normalizeNik(user.NIK),
  )
  function resolvePic(rawNik: string, branchName: string) {
    const matches = usersByNik.get(normalizeNik(rawNik))?.filter(
      (user) => normalizeName(user.branchName) === normalizeName(branchName),
    )
    if (matches?.length === 1) return matches[0].NIK
  }

  const rooms = await prisma.room.findMany({
    where: { isActive: true, area: { isActive: true } },
    include: { area: true, formAvailabilities: true },
  })
  const roomsByName = Map.groupBy(rooms, (room) => normalizeName(room.name))

  // 3. Import Equipment & PIC Assignment dari DATA PIC UNIT NASIONAL.xlsx
  const picFile = path.resolve(process.cwd(), "docs/DATA PIC UNIT NASIONAL.xlsx")
  const wbPic = XLSX.readFile(picFile)
  const rowsPic = XLSX.utils.sheet_to_json<any[]>(wbPic.Sheets["DATA PIC UNIT"], { header: 1 })

  let equipmentUpserted = 0
  let equipmentAssignments = 0
  let skippedEquipmentPic = 0
  let unmappedEquipmentForms = 0
  let unlocatedEquipment = 0

  console.log(`Memproses ${rowsPic.length - 2} baris penugasan equipment...`)

  for (let i = 2; i < rowsPic.length; i++) {
    const r = rowsPic[i]
    if (!r || !r[0] || !r[1] || !r[2]) continue

    const branchName = normalizeName(r[0].toString())
    const rawPic = r[1].toString().trim()
    const rawEquip = r[2].toString().trim()
    const rawUnit = r[3] !== undefined && r[3] !== null ? parseInt(r[3], 10) : 1
    const unitNo = isNaN(rawUnit) ? 1 : rawUnit

    const norm = normalizeEquipment(rawEquip)
    const equipCode = `${branchName.replace(/\s+/g, "_")}-${norm.name.replace(/\s+/g, "_")}-${unitNo}`.toUpperCase()

    const equipmentKey = { branchName, name: norm.name, unitNo }
    const where = { branchName_name_unitNo: equipmentKey }
    const equipment = dryRun
      ? await prisma.equipment.findUnique({ where })
      : await prisma.equipment.upsert({
          where,
          update: { isActive: true },
          create: { ...equipmentKey, code: equipCode },
        })
    equipmentUpserted++
    if (!equipment?.areaId && !equipment?.roomId) unlocatedEquipment++

    if (!norm.formCode) {
      unmappedEquipmentForms++
      continue
    }
    const nikMatch = rawPic.match(/(?:^|\D)(\d{7,8})\s*$/)
    const canonicalNik = nikMatch && resolvePic(nikMatch[1], branchName)
    if (!canonicalNik) {
      skippedEquipmentPic++
      continue
    }

    if (!equipment || await importAssignment({
      userNik: canonicalNik,
      equipmentId: equipment.id,
      formCode: norm.formCode,
      period: norm.period,
    })) equipmentAssignments++
  }

  console.log(`Baris equipment diproses: ${equipmentUpserted}.`)
  console.log(`Baris equipment tanpa area/ruangan: ${unlocatedEquipment}.`)
  console.log(`Penugasan equipment baru yang lolos validasi: ${equipmentAssignments}.`)
  console.log(`Penugasan equipment dilewati (PIC/cabang tidak cocok atau kosong): ${skippedEquipmentPic}.`)
  console.log(`Baris equipment tanpa kode form yang dikenal: ${unmappedEquipmentForms}.`)

  // 4. Import PIC Assignment untuk Ruangan dari Salinan INVENTARISIR EQUIPMENT RUANGAN DAN PIC CHECKLIST.xlsx
  const invFile = path.resolve(process.cwd(), "docs/Salinan INVENTARISIR EQUIPMENT RUANGAN DAN PIC CHECKLIST.xlsx")
  const wbInv = XLSX.readFile(invFile)

  let roomAssignments = 0
  let skippedRoomPic = 0
  let skippedRoomMapping = 0

  console.log(`Memproses inventarisir ruangan dari ${wbInv.SheetNames.length} sheet cabang...`)

  for (const sheetName of wbInv.SheetNames) {
    const areaCode = getExplicitAreaCode(sheetName)
    const sheet = wbInv.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })

    let currentFormCode: string | undefined
    const currentPeriod = ChecklistPeriod.MONTHLY

    for (const r of data) {
      if (!r) continue
      const c0 = (r[0] || "").toString().trim()
      if (c0.includes("FORM CHECKLIST RUANGAN")) {
        currentFormCode = "SAT/FRM/TSM/003 REV 000 211022"
        continue
      } else if (c0.includes("FORM CHECKLIST WAREHOUSE")) {
        currentFormCode = "SAT/FRM/TSM/002_REV_000_211022"
        continue
      } else if (c0.includes("FORM CHECKLIST FISIK")) {
        currentFormCode = "SAT/FRM/TSM/005 REV 211022"
        continue
      }

      const rawNik = (r[2] || "").toString().trim()
      if (!currentFormCode || !/^\d+$/.test(rawNik)) continue

      const canonicalNik = resolvePic(rawNik, sheetName)
      if (!canonicalNik) {
        skippedRoomPic++
        continue
      }
      const config = getChecklistFormConfig(currentFormCode)
      const matchingRooms = roomsByName.get(normalizeName(c0))?.filter((room) =>
        (!areaCode || room.area.code === areaCode) &&
        getFormsForRoom(room, currentPeriod, room.area.type).some((candidate) => candidate.id === config?.id),
      )
      if (matchingRooms?.length !== 1) {
        skippedRoomMapping++
        continue
      }

      if (await importAssignment({
        userNik: canonicalNik,
        roomId: matchingRooms[0].id,
        formCode: currentFormCode,
        period: currentPeriod,
      })) roomAssignments++
    }
  }

  console.log(`Penugasan ruangan baru yang lolos validasi: ${roomAssignments}.`)
  console.log(`Penugasan ruangan dilewati (PIC/cabang tidak cocok): ${skippedRoomPic}.`)
  console.log(`Penugasan ruangan dilewati (ruangan/form belum cocok secara unik): ${skippedRoomMapping}.`)

  if (dryRun) return

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
