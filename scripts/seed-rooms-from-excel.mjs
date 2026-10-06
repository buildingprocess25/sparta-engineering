import "dotenv/config"
import fs from "fs"
import path from "path"
import * as xlsx from "xlsx"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/index.js"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is required")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Mapping from Excel Column Title to { formCode, periods: ChecklistPeriod[] }
const COLUMN_FORM_MAPPING = {
  "CHECKLIST FORKLIFT WEEKLY": {
    formCode: "FRM_TS_043",
    formId: "frm-ts-043",
    periods: ["WEEKLY"],
  },
  "CHECKLIST FORKLIFT MONTHLY": {
    formCode: "FRM_TS_029",
    formId: "frm-ts-029",
    periods: ["MONTHLY"],
  },
  "CHECKLIST PALLET MOVER WEEKLY": {
    formCode: "FRM_TS_045",
    formId: "frm-ts-045",
    periods: ["WEEKLY"],
  },
  "CHECKLIST PALLET MOVER MONTHLY": {
    formCode: "FRM_TS_016",
    formId: "frm-ts-016",
    periods: ["MONTHLY"],
  },
  "CHECKLIST HANPALLET": {
    formCode: "FRM_TS_062",
    formId: "frm-ts-062",
    periods: ["MONTHLY"],
  },
  "CHECKLIST BATERAI FORKLIFT": {
    formCode: "FRM_TS_068",
    formId: "frm-ts-068",
    periods: ["MONTHLY"],
  },
  "CHECKLIST BATERAI PALLET MOVER": {
    formCode: "FRM_TS_028",
    formId: "frm-ts-028",
    periods: ["MONTHLY"],
  },
  "CHECKLIST PERAWATAN UNIT SEWA WH": {
    formCode: "FRM_TSM_008",
    formId: "frm-tsm-008",
    periods: ["MONTHLY"],
  },
  "CHECKLIST GENSET": {
    formCode: "FRM_TS_022",
    formId: "frm-ts-022",
    periods: ["MONTHLY"],
  },
  "CHECKLIST TEST ATS": {
    formCode: "FRM_TSM_001",
    formId: "frm-tsm-001",
    periods: ["MONTHLY"],
  },
  "CHECKLIST HYDRANT": {
    formCode: "FRM_TSM_006",
    formId: "frm-tsm-006",
    periods: ["MONTHLY", "WEEKLY", "SEMESTER"],
  },
  "CHECKLIST EXHAUST": {
    formCode: "FRM_TS_063",
    formId: "frm-ts-063",
    periods: ["MONTHLY"],
  },
  "CHECKLIST PLTS": {
    formCode: "FRM_TSM_007",
    formId: "frm-tsm-007",
    periods: ["MONTHLY", "QUARTERLY"],
  },
  "CHECKLIST WATER RECYCLE": {
    formCode: "FRM_TSM_013",
    formId: "frm-tsm-013",
    periods: ["MONTHLY"],
  },
  "CHECKLIST CONVEYOR": {
    formCode: "FRM_TS_041",
    formId: "frm-ts-041",
    periods: ["MONTHLY"],
  },
  "CHECKLIST TABLE LIFTER": {
    formCode: "FRM_TS_064",
    formId: "frm-ts-064",
    periods: ["MONTHLY"],
  },
  "CHECKLIST RUANGAN": {
    formCode: "FRM_TSM_003",
    formId: "frm-tsm-003",
    periods: ["MONTHLY", "WEEKLY"],
  },
  "CHECKLIST BANGUNAN UTAMA & PENUNJANG": {
    formCode: "FRM_TSM_005",
    formId: "frm-tsm-005",
    periods: ["MONTHLY", "WEEKLY"],
  },
  "CHECKLIST WAREHOUSE": {
    formCode: "FRM_TSM_002",
    formId: "frm-tsm-002",
    periods: ["MONTHLY", "WEEKLY"],
  },
  "CHECKLIST MAIN CABLE": {
    formCode: "FRM_TSM_004",
    formId: "frm-tsm-004",
    periods: ["MONTHLY", "WEEKLY"],
  },
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function seedRoomsFromExcel() {
  const excelPath = path.resolve("docs/LIST RUANGAN OFFICE WH MASTER SPARTA ENGINEERING.xlsx")
  if (!fs.existsSync(excelPath)) {
    throw new Error(`File not found: ${excelPath}`)
  }

  const buf = fs.readFileSync(excelPath)
  const wb = xlsx.read(buf, { type: "buffer" })
  const sheet = wb.Sheets["AREA vs FORM"]
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 })

  const titleRow = data[2]

  // Read existing areas
  const areas = await prisma.area.findMany()
  const officeArea = areas.find((a) => a.code === "office")
  const warehouseAreas = areas.filter((a) => a.type === "WAREHOUSE")

  if (!officeArea) {
    throw new Error("Office area (code: office) not found in database")
  }

  console.log(`Found ${areas.length} areas. Office: ${officeArea.name}, Warehouse areas: ${warehouseAreas.map(a => a.name).join(", ")}`)

  // Parse Excel rows
  const officeRooms = []
  const warehouseRooms = []

  for (let r = 3; r < data.length; r++) {
    const row = data[r]
    if (!row || !row[0]) continue

    const location = String(row[0]).trim().toUpperCase() // WAREHOUSE, OFFICE, BANGUNAN PENUNJANG
    const roomName = row[1] ? String(row[1]).trim() : ""
    if (!roomName) continue

    const activeForms = []
    for (let c = 2; c < titleRow.length; c++) {
      const colTitle = titleRow[c]
      const cellVal = row[c] ? String(row[c]).trim().toUpperCase() : ""
      if (cellVal === "V" && COLUMN_FORM_MAPPING[colTitle]) {
        activeForms.push(COLUMN_FORM_MAPPING[colTitle])
      }
    }

    const roomData = {
      location,
      name: roomName,
      activeForms,
    }

    if (location === "OFFICE") {
      officeRooms.push(roomData)
    } else {
      // WAREHOUSE or BANGUNAN PENUNJANG
      warehouseRooms.push(roomData)
    }
  }

  console.log(`Parsed ${officeRooms.length} Office rooms, ${warehouseRooms.length} Warehouse & Penunjang rooms`)

  // Seed Office rooms
  let totalRoomsCreated = 0
  let totalAvailabilitiesCreated = 0

  for (let i = 0; i < officeRooms.length; i++) {
    const r = officeRooms[i]
    const code = `office-${slugify(r.name)}-${i}`

    const room = await prisma.room.upsert({
      where: { code },
      update: {
        name: r.name,
        areaId: officeArea.id,
        isActive: true,
      },
      create: {
        code,
        name: r.name,
        areaId: officeArea.id,
        isActive: true,
      },
    })
    totalRoomsCreated++

    for (const form of r.activeForms) {
      for (const period of form.periods) {
        await prisma.roomFormAvailability.upsert({
          where: {
            roomId_formCode_period: {
              roomId: room.id,
              formCode: form.formCode,
              period,
            },
          },
          update: {},
          create: {
            roomId: room.id,
            formCode: form.formCode,
            period,
          },
        })
        totalAvailabilitiesCreated++
      }
    }
  }

  // Seed Warehouse rooms for each warehouse area
  for (const whArea of warehouseAreas) {
    for (let i = 0; i < warehouseRooms.length; i++) {
      const r = warehouseRooms[i]
      const code = `${whArea.code}-${slugify(r.name)}-${i}`

      const room = await prisma.room.upsert({
        where: { code },
        update: {
          name: r.name,
          areaId: whArea.id,
          isActive: true,
        },
        create: {
          code,
          name: r.name,
          areaId: whArea.id,
          isActive: true,
        },
      })
      totalRoomsCreated++

      for (const form of r.activeForms) {
        for (const period of form.periods) {
          await prisma.roomFormAvailability.upsert({
            where: {
              roomId_formCode_period: {
                roomId: room.id,
                formCode: form.formCode,
                period,
              },
            },
            update: {},
            create: {
              roomId: room.id,
              formCode: form.formCode,
              period,
            },
          })
          totalAvailabilitiesCreated++
        }
      }
    }
  }

  console.log(`Seeding complete: ${totalRoomsCreated} room records, ${totalAvailabilitiesCreated} room-form availabilities created.`)
}

if (process.argv[1]?.endsWith("seed-rooms-from-excel.mjs")) {
  seedRoomsFromExcel()
    .catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
